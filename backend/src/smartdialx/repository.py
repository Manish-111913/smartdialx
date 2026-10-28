"""SQLite access. All reservations and state changes go through here.

Rules followed by every write in this file:
- it runs inside `db.transaction()` (BEGIN IMMEDIATE)
- the UPDATE filters on the state we expect to leave, and we check rowcount
- the transition is checked against state_machine first
- nothing in here talks to a provider; callers do that between transactions
"""

import logging
import math
import sqlite3
import uuid
from dataclasses import dataclass

from .clock import Clock
from .config import Settings
from .db import Database
from .models import (
    AgentState,
    Campaign,
    CampaignStatus,
    CallState,
    Initiation,
    Mode,
    RETRYABLE_REASONS,
    Reservation,
    TERMINAL_CALL_STATES,
)
from .state_machine import can_agent, check_agent, check_call

log = logging.getLogger(__name__)

A = AgentState
C = CallState


@dataclass(frozen=True)
class Hangup:
    call_id: int
    provider: str
    provider_call_id: str


class _NothingToReserve(Exception):
    pass


class Repository:
    def __init__(self, db: Database, clock: Clock, settings: Settings | None = None):
        self.db = db
        self.clock = clock
        self.settings = settings or Settings()

    # ---- setup -----------------------------------------------------------

    def create_campaign(
        self, name: str, mode: Mode, provider: str, max_attempts: int | None = None, screening: bool = False
    ) -> int:
        attempts = max_attempts or self.settings.timeouts.max_attempts
        with self.db.transaction() as conn:
            cur = conn.execute(
                "INSERT INTO campaigns (name, mode, provider, max_attempts, screening, created_at)"
                " VALUES (?, ?, ?, ?, ?, ?)",
                (name, Mode(mode).value, provider, attempts, int(screening), self.clock.now()),
            )
            return cur.lastrowid

    def get_campaign(self, campaign_id: int) -> Campaign:
        row = self.db.conn().execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone()
        if row is None:
            raise KeyError(f"campaign {campaign_id} not found")
        return Campaign(
            id=row["id"],
            name=row["name"],
            mode=Mode(row["mode"]),
            provider=row["provider"],
            status=CampaignStatus(row["status"]),
            max_attempts=row["max_attempts"],
            screening=bool(row["screening"]),
        )

    def set_campaign_status(self, campaign_id: int, status: CampaignStatus) -> None:
        with self.db.transaction() as conn:
            conn.execute("UPDATE campaigns SET status = ? WHERE id = ?", (status.value, campaign_id))

    def add_agents(self, count: int, state: AgentState = A.AVAILABLE, prefix: str = "agent") -> list[int]:
        now = self.clock.now()
        with self.db.transaction() as conn:
            start = conn.execute("SELECT COUNT(*) FROM agents").fetchone()[0]
            ids = []
            for i in range(count):
                cur = conn.execute(
                    "INSERT INTO agents (name, state, updated_at) VALUES (?, ?, ?)",
                    (f"{prefix}-{start + i + 1}", state.value, now),
                )
                ids.append(cur.lastrowid)
            return ids

    def add_borrowers(self, campaign_id: int, count: int) -> list[int]:
        """Adds borrowers with fake numbers and queues a first call for each."""
        now = self.clock.now()
        with self.db.transaction() as conn:
            start = conn.execute("SELECT COUNT(*) FROM borrowers").fetchone()[0]
            ids = []
            for i in range(count):
                n = start + i + 1
                cur = conn.execute(
                    "INSERT INTO borrowers (campaign_id, name, phone) VALUES (?, ?, ?)",
                    (campaign_id, f"borrower-{n}", f"+1-555-{n:07d}"),
                )
                conn.execute(
                    "INSERT INTO calls (campaign_id, borrower_id, state, created_at, updated_at)"
                    " VALUES (?, ?, 'QUEUED', ?, ?)",
                    (campaign_id, cur.lastrowid, now, now),
                )
                ids.append(cur.lastrowid)
            return ids

    # ---- reads -------------------------------------------------------------

    def get_agent(self, agent_id: int) -> sqlite3.Row:
        return self.db.conn().execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()

    def get_call(self, call_id: int) -> sqlite3.Row:
        return self.db.conn().execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()

    def call_by_token(self, conn: sqlite3.Connection, token: str) -> sqlite3.Row | None:
        return conn.execute("SELECT * FROM calls WHERE dial_token = ?", (token,)).fetchone()

    # ---- reservations ------------------------------------------------------

    def reserve_bound(self, campaign_id: int, worker_id: str, provider: str) -> Reservation | None:
        """Progressive reservation: agent first, then borrower, in one transaction.

        If there's no queued borrower the whole thing rolls back, so we never
        leave an agent reserved for nothing.
        """
        token = uuid.uuid4().hex
        try:
            with self.db.transaction() as conn:
                # read the clock after we hold the write lock, so timestamps follow commit order
                now = self.clock.now()
                lease = now + self.settings.timeouts.lease_s
                agent = conn.execute(
                    "UPDATE agents SET state = 'RESERVED', version = version + 1, updated_at = ?"
                    " WHERE id = (SELECT id FROM agents WHERE state = 'AVAILABLE' ORDER BY updated_at, id LIMIT 1)"
                    "   AND state = 'AVAILABLE'"
                    " RETURNING id",
                    (now,),
                ).fetchall()
                if not agent:
                    raise _NothingToReserve
                agent_id = agent[0]["id"]
                call = self._claim_queued_call(conn, campaign_id, worker_id, provider, token, lease, now, agent_id)
                if call is None:
                    raise _NothingToReserve
                conn.execute("UPDATE agents SET current_call_id = ? WHERE id = ?", (call["id"], agent_id))
        except _NothingToReserve:
            return None
        return self._reservation(call, campaign_id, agent_id, token, provider)

    def reserve_unbound(self, campaign_id: int, worker_id: str, provider: str) -> Reservation | None:
        """Predictive reservation: borrower only. An agent is claimed when they answer.

        The over-dial cap is checked again here, under the write lock. The safety
        controller checks it too, but from a snapshot; two workers approving at the
        same moment could otherwise both fill the same headroom.
        """
        token = uuid.uuid4().hex
        with self.db.transaction() as conn:
            now = self.clock.now()
            counts = conn.execute(
                "SELECT (SELECT COUNT(*) FROM agents WHERE state = 'AVAILABLE') AS free,"
                "       (SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND bound = 0"
                "          AND state IN ('RESERVED', 'INITIATED', 'RINGING')) AS in_flight",
                (campaign_id,),
            ).fetchone()
            if counts["in_flight"] + 1 > math.floor(counts["free"] * self.settings.safety.max_overdial_ratio):
                return None
            lease = now + self.settings.timeouts.lease_s
            call = self._claim_queued_call(conn, campaign_id, worker_id, provider, token, lease, now, None)
        if call is None:
            return None
        return self._reservation(call, campaign_id, None, token, provider)

    def reserve_screening(
        self, campaign_id: int, worker_id: str, provider: str, progressive: bool
    ) -> Reservation | None:
        """Screening reservation: borrower only. No agent is held while the bot talks.

        Capacity is still checked under the write lock. Progressive: bot calls in
        flight plus borrowers already waiting on hold never exceed free agents, so if
        everyone says yes there's an agent for each. Predictive: up to
        `max_screening_ratio` bot calls per free agent.
        """
        token = uuid.uuid4().hex
        with self.db.transaction() as conn:
            now = self.clock.now()
            counts = conn.execute(
                "SELECT (SELECT COUNT(*) FROM agents WHERE state = 'AVAILABLE') AS free,"
                "       (SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND screening = 1"
                "          AND state IN ('RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING')) AS in_flight,"
                "       (SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND state = 'TRANSFER_PENDING'"
                "          AND agent_id IS NULL) AS waiting",
                (campaign_id, campaign_id),
            ).fetchone()
            if progressive:
                room = counts["free"] - counts["waiting"]
            else:
                room = math.floor(counts["free"] * self.settings.safety.max_screening_ratio) - counts["waiting"]
            if counts["in_flight"] + 1 > room:
                return None
            lease = now + self.settings.timeouts.lease_s
            call = self._claim_queued_call(conn, campaign_id, worker_id, provider, token, lease, now, None, screening=True)
        if call is None:
            return None
        return self._reservation(call, campaign_id, None, token, provider, screening=True)

    def _claim_queued_call(self, conn, campaign_id, worker_id, provider, token, lease, now, agent_id, screening=False):
        rows = conn.execute(
            "UPDATE calls SET state = 'RESERVED', agent_id = ?, bound = ?, screening = ?, worker_id = ?, provider = ?,"
            "   dial_token = ?, lease_expires_at = ?, reserved_at = ?, updated_at = ?"
            " WHERE id = (SELECT id FROM calls WHERE campaign_id = ? AND state = 'QUEUED' AND not_before <= ?"
            "             ORDER BY not_before, id LIMIT 1)"
            "   AND state = 'QUEUED'"
            " RETURNING id, borrower_id",
            (agent_id, 1 if agent_id else 0, int(screening), worker_id, provider, token, lease, now, now,
             campaign_id, now),
        ).fetchall()
        if not rows:
            return None
        phone = conn.execute("SELECT phone FROM borrowers WHERE id = ?", (rows[0]["borrower_id"],)).fetchone()
        return {"id": rows[0]["id"], "borrower_id": rows[0]["borrower_id"], "phone": phone["phone"]}

    @staticmethod
    def _reservation(call, campaign_id, agent_id, token, provider, screening=False) -> Reservation:
        return Reservation(
            call_id=call["id"],
            borrower_id=call["borrower_id"],
            campaign_id=campaign_id,
            agent_id=agent_id,
            token=token,
            phone=call["phone"],
            provider=provider,
            screening=screening,
        )

    def release(self, res: Reservation, reason: str) -> bool:
        """Undo a reservation that never reached the provider."""
        with self.db.transaction() as conn:
            return self._release(conn, res.call_id, res.token, reason)

    def _release(self, conn, call_id: int, token: str, reason: str) -> bool:
        call = conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()
        if call is None or call["dial_token"] != token:
            return False
        if call["state"] != C.RESERVED or call["initiation"] != Initiation.NOT_SENT:
            return False
        check_call(C.RESERVED, C.QUEUED)
        conn.execute(
            "UPDATE calls SET state = 'QUEUED', agent_id = NULL, bound = 1, worker_id = NULL, dial_token = NULL,"
            "   lease_expires_at = NULL, reserved_at = NULL, updated_at = ?"
            " WHERE id = ? AND state = 'RESERVED' AND initiation = 'NOT_SENT'",
            (self.clock.now(), call_id),
        )
        if call["agent_id"]:
            self._move_agent(conn, call["agent_id"], call_id, A.AVAILABLE)
        log.info("released call=%s reason=%s", call_id, reason)
        return True

    def mark_sending(self, res: Reservation) -> bool:
        """Record that we're about to call the provider. Must commit before the request goes out."""
        with self.db.transaction() as conn:
            now = self.clock.now()
            if res.agent_id is not None:
                agent = conn.execute("SELECT state, current_call_id FROM agents WHERE id = ?", (res.agent_id,)).fetchone()
                if agent["state"] != A.RESERVED or agent["current_call_id"] != res.call_id:
                    # agent went away while we were setting up
                    self._release(conn, res.call_id, res.token, "agent_gone")
                    return False
            cur = conn.execute(
                "UPDATE calls SET initiation = 'SENDING', sending_at = ?, updated_at = ?"
                " WHERE id = ? AND dial_token = ? AND state = 'RESERVED' AND initiation = 'NOT_SENT'",
                (now, now, res.call_id, res.token),
            )
            if cur.rowcount != 1:
                return False
            if res.agent_id is not None:
                self._move_agent(conn, res.agent_id, res.call_id, A.DIALING)
            conn.execute("UPDATE borrowers SET attempts = attempts + 1 WHERE id = ?", (res.borrower_id,))
            conn.execute(
                "INSERT INTO provider_requests (provider, call_id, dial_token, sent_at) VALUES (?, ?, ?, ?)",
                (res.provider, res.call_id, res.token, now),
            )
        return True

    def mark_accepted(self, res: Reservation, provider_call_id: str) -> bool:
        with self.db.transaction() as conn:
            now = self.clock.now()
            self._request_result(conn, res.token, "accepted", None)
            cur = conn.execute(
                "UPDATE calls SET state = 'INITIATED', initiation = 'ACCEPTED', provider_call_id = ?,"
                "   initiated_at = ?, last_event_at = ?, lease_expires_at = NULL, updated_at = ?"
                " WHERE id = ? AND dial_token = ? AND state = 'RESERVED' AND initiation IN ('SENDING', 'UNKNOWN')",
                (provider_call_id, now, now, now, res.call_id, res.token),
            )
            if cur.rowcount == 1:
                return True
            # a provider event may have got here first and adopted the call already
            row = conn.execute("SELECT provider_call_id FROM calls WHERE id = ?", (res.call_id,)).fetchone()
            return row is not None and row["provider_call_id"] == provider_call_id

    def mark_rejected(self, res: Reservation, error: str) -> bool:
        """Provider definitely did not place the call. Safe to retry later."""
        with self.db.transaction() as conn:
            self._request_result(conn, res.token, "rejected", error)
            call = conn.execute("SELECT * FROM calls WHERE id = ? AND dial_token = ?", (res.call_id, res.token)).fetchone()
            if call is None or call["state"] != C.RESERVED or call["initiation"] not in (Initiation.SENDING, Initiation.UNKNOWN):
                return False
            conn.execute("UPDATE calls SET initiation = 'REJECTED' WHERE id = ?", (res.call_id,))
            call = conn.execute("SELECT * FROM calls WHERE id = ?", (res.call_id,)).fetchone()
            self.finish(conn, call, C.FAILED, "provider_rejected")
            return True

    def mark_unknown(self, res: Reservation, error: str) -> bool:
        """Request timed out. The call may or may not exist; recovery reconciles it."""
        with self.db.transaction() as conn:
            self._request_result(conn, res.token, "timeout", error)
            cur = conn.execute(
                "UPDATE calls SET initiation = 'UNKNOWN', updated_at = ?"
                " WHERE id = ? AND dial_token = ? AND state = 'RESERVED' AND initiation = 'SENDING'",
                (self.clock.now(), res.call_id, res.token),
            )
            return cur.rowcount == 1

    @staticmethod
    def _request_result(conn, token: str, result: str, error: str | None) -> None:
        conn.execute(
            "UPDATE provider_requests SET result = ?, error = ? WHERE dial_token = ? AND result IS NULL",
            (result, error, token),
        )

    # ---- call transitions (called inside a transaction) -------------------

    def adopt(self, conn, call: sqlite3.Row, provider_call_id: str) -> sqlite3.Row:
        """A provider event proves the request was accepted even though we didn't record it yet."""
        now = self.clock.now()
        check_call(C(call["state"]), C.INITIATED)
        conn.execute(
            "UPDATE calls SET state = 'INITIATED', initiation = 'ACCEPTED', provider_call_id = ?,"
            "   initiated_at = COALESCE(initiated_at, ?), lease_expires_at = NULL, updated_at = ?"
            " WHERE id = ? AND state = 'RESERVED'",
            (provider_call_id, now, now, call["id"]),
        )
        self._request_result(conn, call["dial_token"], "accepted", None)
        return conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()

    def advance(self, conn, call: sqlite3.Row, target: CallState, at: float) -> bool:
        """Move a call forward to INITIATED, RINGING or ANSWERED."""
        current = C(call["state"])
        check_call(current, target)
        now = self.clock.now()
        extra = ""
        params: list = [target.value, now, now]
        if target == C.ANSWERED:
            extra = ", answered_at = ?, ring_result = 'answered', ring_result_at = ?"
            params += [at, now]
        cur = conn.execute(
            f"UPDATE calls SET state = ?, last_event_at = ?, updated_at = ?{extra} WHERE id = ? AND state = ?",
            (*params, call["id"], current.value),
        )
        return cur.rowcount == 1

    def connect(self, conn, call: sqlite3.Row) -> bool:
        """ANSWERED -> CONNECTED with an agent, or ABANDONED if nobody is free.

        Returns False when the call was abandoned (caller should hang up).
        """
        now = self.clock.now()
        agent_id = None
        if call["agent_id"] and self._move_agent(conn, call["agent_id"], call["id"], A.CONNECTED):
            agent_id = call["agent_id"]
        else:
            agent_id = self._claim_agent_for_answer(conn, call["id"], now)
        if agent_id is None:
            self.finish(conn, call, C.ABANDONED, "no_agent")
            return False
        check_call(C.ANSWERED, C.CONNECTED)
        conn.execute(
            "UPDATE calls SET state = 'CONNECTED', agent_id = ?, connected_at = ?, updated_at = ?"
            " WHERE id = ? AND state = 'ANSWERED'",
            (agent_id, now, now, call["id"]),
        )
        return True

    def _claim_agent_for_answer(self, conn, call_id: int, now: float) -> int | None:
        rows = conn.execute(
            "UPDATE agents SET state = 'CONNECTED', current_call_id = ?, wrap_up_until = NULL,"
            "   version = version + 1, updated_at = ?"
            " WHERE id = (SELECT id FROM agents WHERE state = 'AVAILABLE' ORDER BY updated_at, id LIMIT 1)"
            "   AND state = 'AVAILABLE'"
            " RETURNING id",
            (call_id, now),
        ).fetchall()
        if rows:
            return rows[0]["id"]
        # an agent a few seconds from the end of wrap-up is better than abandoning
        rows = conn.execute(
            "UPDATE agents SET state = 'CONNECTED', current_call_id = ?, wrap_up_until = NULL,"
            "   version = version + 1, updated_at = ?"
            " WHERE id = (SELECT id FROM agents WHERE state = 'WRAP_UP' AND wrap_up_until <= ?"
            "             ORDER BY wrap_up_until, id LIMIT 1)"
            "   AND state = 'WRAP_UP'"
            " RETURNING id",
            (call_id, now, now + self.settings.timeouts.wrap_up_preempt_s),
        ).fetchall()
        return rows[0]["id"] if rows else None

    def finish(
        self, conn, call: sqlite3.Row, target: CallState, reason: str, talk_seconds: float | None = None
    ) -> None:
        """Put a call in a terminal state, free its agent, and maybe queue a retry."""
        current = C(call["state"])
        check_call(current, target)
        now = self.clock.now()
        ring = ", ring_result = 'no_answer', ring_result_at = ?" if reason in ("no_answer", "busy") else ""
        params = [target.value, reason, talk_seconds, now, now, now]
        if ring:
            params.append(now)
        cur = conn.execute(
            "UPDATE calls SET state = ?, end_reason = ?, talk_seconds = ?, ended_at = ?, last_event_at = ?,"
            f"   updated_at = ?, lease_expires_at = NULL{ring}"
            " WHERE id = ? AND state = ?",
            (*params, call["id"], current.value),
        )
        if cur.rowcount != 1:
            raise RuntimeError(f"call {call['id']} changed under us")

        if call["agent_id"]:
            if current in (C.CONNECTED, C.ANSWERED) or target == C.COMPLETED:
                until = now + self.settings.timeouts.wrap_up_s
                self._move_agent(conn, call["agent_id"], call["id"], A.WRAP_UP, wrap_up_until=until)
            else:
                self._move_agent(conn, call["agent_id"], call["id"], A.AVAILABLE)

        self._after_call(conn, call, target, reason, now)

    def _after_call(self, conn, call, target: CallState, reason: str, now: float) -> None:
        borrower = conn.execute(
            "SELECT b.attempts, c.max_attempts FROM borrowers b JOIN campaigns c ON c.id = b.campaign_id"
            " WHERE b.id = ?",
            (call["borrower_id"],),
        ).fetchone()
        s = self.settings.screening
        retry = reason in RETRYABLE_REASONS and target != C.ABANDONED
        if reason == "no_agent_transfer" and s.no_agent_policy != "callback":
            retry = False
        if retry:
            if borrower["attempts"] < borrower["max_attempts"]:
                delay = {
                    "screen_unavailable": s.unavailable_retry_s,
                    "no_agent_transfer": s.callback_delay_s,
                    "caller_left_hold": s.callback_delay_s,
                }.get(reason, self.settings.timeouts.retry_delay_s)
                conn.execute(
                    "INSERT INTO calls (campaign_id, borrower_id, attempt, state, not_before, created_at, updated_at)"
                    " VALUES (?, ?, ?, 'QUEUED', ?, ?, ?)",
                    (call["campaign_id"], call["borrower_id"], call["attempt"] + 1, now + delay, now, now),
                )
                return
            outcome = f"exhausted:{reason}"
        elif reason == "screen_declined":
            # they said no to an agent; we don't call again
            outcome = "declined"
        elif target == C.COMPLETED:
            outcome = "completed" if reason in ("completed", "hangup") else reason
        elif target == C.ABANDONED:
            # don't ring someone straight back after abandoning them
            outcome = "abandoned"
        else:
            outcome = reason
        conn.execute("UPDATE borrowers SET outcome = ? WHERE id = ?", (outcome, call["borrower_id"]))

    def _move_agent(
        self, conn, agent_id: int, call_id: int, target: AgentState, wrap_up_until: float | None = None
    ) -> bool:
        """Move an agent only if it is still working on `call_id`.

        If the agent logged off or got moved by someone else, we leave it alone.
        That's what stops a late event from flipping an OFFLINE agent back to AVAILABLE.
        """
        agent = conn.execute("SELECT state, current_call_id FROM agents WHERE id = ?", (agent_id,)).fetchone()
        if agent is None or agent["current_call_id"] != call_id:
            return False
        current = A(agent["state"])
        if not can_agent(current, target):
            return False
        keep_call = target in (A.RESERVED, A.DIALING, A.CONNECTED)
        cur = conn.execute(
            "UPDATE agents SET state = ?, current_call_id = ?, wrap_up_until = ?, version = version + 1, updated_at = ?"
            " WHERE id = ? AND state = ? AND current_call_id = ?",
            (target.value, call_id if keep_call else None, wrap_up_until, self.clock.now(),
             agent_id, current.value, call_id),
        )
        return cur.rowcount == 1

    # ---- screening and transfer ----------------------------------------------

    def start_screening(self, conn, call: sqlite3.Row) -> None:
        check_call(C(call["state"]), C.SCREENING)
        now = self.clock.now()
        conn.execute(
            "UPDATE calls SET state = 'SCREENING', last_event_at = ?, updated_at = ? WHERE id = ? AND state = 'ANSWERED'",
            (now, now, call["id"]),
        )

    def screened_willing(self, conn, call: sqlite3.Row) -> None:
        """Borrower agreed to talk to an agent. They're on hold until one is reserved."""
        check_call(C(call["state"]), C.TRANSFER_PENDING)
        now = self.clock.now()
        conn.execute(
            "UPDATE calls SET state = 'TRANSFER_PENDING', screen_result = 'willing', screen_result_at = ?,"
            "   transfer_requested_at = ?, hold_until = ?, last_event_at = ?, updated_at = ?"
            " WHERE id = ? AND state = 'SCREENING'",
            (now, now, now + self.settings.screening.hold_s, now, now, call["id"]),
        )

    def record_screen_result(self, conn, call_id: int, result: str) -> None:
        conn.execute(
            "UPDATE calls SET screen_result = ?, screen_result_at = ? WHERE id = ? AND screen_result IS NULL",
            (result, self.clock.now(), call_id),
        )

    def claim_transfer_agent(self, call_id: int) -> tuple[int, str] | None:
        """Reserve a free agent for a borrower on hold and mark the transfer as SENDING.

        One transaction: either the call gets exactly one agent and a transfer token,
        or nothing changes. Two workers trying this for the same call or the same
        agent can't both win, same as any other reservation.
        """
        token = uuid.uuid4().hex
        with self.db.transaction() as conn:
            now = self.clock.now()
            call = conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()
            if call is None or call["state"] != C.TRANSFER_PENDING or call["agent_id"] is not None:
                return None
            if call["hold_until"] is not None and call["hold_until"] <= now:
                return None
            rows = conn.execute(
                "UPDATE agents SET state = 'RESERVED', current_call_id = ?, version = version + 1, updated_at = ?"
                " WHERE id = (SELECT id FROM agents WHERE state = 'AVAILABLE' ORDER BY updated_at, id LIMIT 1)"
                "   AND state = 'AVAILABLE'"
                " RETURNING id",
                (call_id, now),
            ).fetchall()
            if not rows:
                return None
            agent_id = rows[0]["id"]
            conn.execute(
                "UPDATE calls SET agent_id = ?, transfer_token = ?, transfer_status = 'SENDING',"
                "   transfer_attempts = transfer_attempts + 1, transfer_lease_expires_at = ?, updated_at = ?"
                " WHERE id = ? AND state = 'TRANSFER_PENDING' AND agent_id IS NULL",
                (agent_id, token, now + self.settings.timeouts.lease_s, now, call_id),
            )
        return agent_id, token

    def transfer_accepted(self, call_id: int, token: str) -> bool:
        with self.db.transaction() as conn:
            cur = conn.execute(
                "UPDATE calls SET transfer_status = 'ACCEPTED', updated_at = ?"
                " WHERE id = ? AND transfer_token = ? AND transfer_status IN ('SENDING', 'UNKNOWN')",
                (self.clock.now(), call_id, token),
            )
            return cur.rowcount == 1

    def transfer_unknown(self, call_id: int, token: str) -> bool:
        with self.db.transaction() as conn:
            cur = conn.execute(
                "UPDATE calls SET transfer_status = 'UNKNOWN', updated_at = ?"
                " WHERE id = ? AND transfer_token = ? AND transfer_status = 'SENDING'",
                (self.clock.now(), call_id, token),
            )
            return cur.rowcount == 1

    def transfer_rejected(self, call_id: int, token: str) -> bool:
        """Provider definitely didn't transfer. Free the agent; the borrower keeps holding."""
        with self.db.transaction() as conn:
            call = conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()
            if (
                call is None
                or call["state"] != C.TRANSFER_PENDING
                or call["transfer_token"] != token
                or call["transfer_status"] not in ("SENDING", "UNKNOWN")
            ):
                return False
            if call["agent_id"]:
                self._move_agent(conn, call["agent_id"], call_id, A.AVAILABLE)
            conn.execute(
                "UPDATE calls SET agent_id = NULL, transfer_status = NULL, transfer_lease_expires_at = NULL,"
                "   updated_at = ? WHERE id = ?",
                (self.clock.now(), call_id),
            )
            return True

    def complete_transfer(self, conn, call: sqlite3.Row) -> bool:
        """TRANSFERRED arrived: borrower is talking to the agent we reserved."""
        check_call(C(call["state"]), C.CONNECTED)
        if not call["agent_id"] or not self._move_agent(conn, call["agent_id"], call["id"], A.CONNECTED):
            return False
        now = self.clock.now()
        conn.execute(
            "UPDATE calls SET state = 'CONNECTED', connected_at = ?, transfer_status = 'ACCEPTED',"
            "   transfer_lease_expires_at = NULL, last_event_at = ?, updated_at = ?"
            " WHERE id = ? AND state = 'TRANSFER_PENDING'",
            (now, now, now, call["id"]),
        )
        return True

    def end_hold(self, call_id: int, reason: str) -> Hangup | None:
        """Give up on a borrower who is holding with no agent reserved."""
        with self.db.transaction() as conn:
            call = conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()
            if call is None or call["state"] != C.TRANSFER_PENDING or call["agent_id"] is not None:
                return None
            self.finish(conn, call, C.FAILED, reason)
        if call["provider_call_id"]:
            return Hangup(call_id, call["provider"], call["provider_call_id"])
        return None

    # ---- agents (operator side) -------------------------------------------

    def set_agent_state(self, agent_id: int, target: AgentState) -> list[Hangup]:
        """Login, logout, pause, resume. Returns calls the caller must hang up at the provider."""
        hangups: list[Hangup] = []
        with self.db.transaction() as conn:
            agent = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
            current = A(agent["state"])
            if current == target:
                return []
            check_agent(current, target)
            if agent["current_call_id"]:
                call = conn.execute("SELECT * FROM calls WHERE id = ?", (agent["current_call_id"],)).fetchone()
                if call is not None and call["state"] not in TERMINAL_CALL_STATES:
                    hangups += self._detach_agent(conn, call)
            # detaching may have touched the agent row already; we still hold the
            # write lock, so nobody else could have
            conn.execute(
                "UPDATE agents SET state = ?, current_call_id = NULL, wrap_up_until = NULL,"
                "   version = version + 1, updated_at = ? WHERE id = ?",
                (target.value, self.clock.now(), agent_id),
            )
        return hangups

    def _detach_agent(self, conn, call: sqlite3.Row) -> list[Hangup]:
        state = C(call["state"])
        if state == C.RESERVED and call["initiation"] == Initiation.NOT_SENT:
            self._release(conn, call["id"], call["dial_token"], "agent_left")
            return []
        if state == C.RESERVED:
            # request may be in flight; we can't cancel what we can't see yet.
            # the call carries on without an agent and must find one if answered.
            conn.execute("UPDATE calls SET agent_id = NULL, bound = 0 WHERE id = ?", (call["id"],))
            return []
        conn.execute("UPDATE agents SET current_call_id = NULL WHERE id = ?", (call["agent_id"],))
        reason = "agent_left"
        target = C.FAILED if state in (C.CONNECTED, C.TRANSFER_PENDING) else C.CANCELLED
        if state == C.ANSWERED:
            target = C.ABANDONED
            reason = "no_agent"
        fresh = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
        self.finish(conn, fresh, target, reason)
        if call["provider_call_id"]:
            return [Hangup(call["id"], call["provider"], call["provider_call_id"])]
        return []

    def expire_wrap_ups(self) -> int:
        with self.db.transaction() as conn:
            now = self.clock.now()
            cur = conn.execute(
                "UPDATE agents SET state = 'AVAILABLE', wrap_up_until = NULL, version = version + 1, updated_at = ?"
                " WHERE state = 'WRAP_UP' AND wrap_up_until <= ?",
                (now, now),
            )
            return cur.rowcount

    # ---- bookkeeping -------------------------------------------------------

    def log_recovery(self, conn, action: str, call_id: int | None, agent_id: int | None, detail: str = "") -> None:
        conn.execute(
            "INSERT INTO recovery_log (at, call_id, agent_id, action, detail) VALUES (?, ?, ?, ?, ?)",
            (self.clock.now(), call_id, agent_id, action, detail),
        )

    def heartbeat(self, worker_id: str, status: str = "RUNNING") -> None:
        now = self.clock.now()
        with self.db.transaction() as conn:
            conn.execute(
                "INSERT INTO workers (id, started_at, last_heartbeat, status) VALUES (?, ?, ?, ?)"
                " ON CONFLICT(id) DO UPDATE SET last_heartbeat = excluded.last_heartbeat, status = excluded.status",
                (worker_id, now, now, status),
            )
