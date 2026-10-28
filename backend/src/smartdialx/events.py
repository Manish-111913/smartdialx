"""Handles provider callbacks.

Two steps, two transactions:

1. store: insert the event keyed by the provider's event id. A second delivery of
   the same id hits the primary key and only bumps a counter. Once stored we can
   ack the provider.
2. process: apply it to the call and mark it processed, in one transaction. If the
   process dies in between, the event stays in the table with processed_at NULL
   and `process_pending()` picks it up later. Processing twice is impossible
   because the processed_at check and the state change commit together.

Out-of-order events are handled by rank: an event that would move a call backwards
(RINGING after ANSWERED) is recorded as stale, and anything arriving after a
terminal state is recorded as late. Neither changes the call.
"""

import logging
from collections.abc import Callable, Mapping
from dataclasses import dataclass

from .models import CallState, EVENT_TARGET, EventType, Initiation, ProviderEvent, ScreenResult, TERMINAL_CALL_STATES
from .providers import TelecomProvider
from .repository import Repository
from .state_machine import CALL_RANK, Verdict, classify

log = logging.getLogger(__name__)

C = CallState

REASONS = {
    EventType.COMPLETED: "completed",
    EventType.NO_ANSWER: "no_answer",
    EventType.BUSY: "busy",
    EventType.FAILED: "failed",
    EventType.TIMED_OUT: "timed_out",
    EventType.CANCELLED: "cancelled",
}


class SimulatedCrash(Exception):
    pass


@dataclass(frozen=True)
class EventResult:
    event_id: str
    outcome: str
    call_id: int | None = None
    note: str = ""


class EventProcessor:
    def __init__(self, repo: Repository, providers: Mapping[str, TelecomProvider]):
        self.repo = repo
        self.db = repo.db
        self.clock = repo.clock
        self.providers = providers
        # tests set this to raise SimulatedCrash at a named point
        self.fail_point: Callable[[str], None] | None = None

    def handle(self, event: ProviderEvent) -> EventResult:
        if not self.store(event):
            return EventResult(event.event_id, "duplicate")
        self._maybe_fail("after_store")
        return self.process(event.event_id)

    def store(self, event: ProviderEvent) -> bool:
        with self.db.transaction() as conn:
            cur = conn.execute(
                "INSERT OR IGNORE INTO provider_events (event_id, provider, provider_call_id, dial_token,"
                "   event_type, occurred_at, talk_seconds, reason, received_at)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (event.event_id, event.provider, event.provider_call_id, event.dial_token,
                 event.type.value, event.occurred_at, event.talk_seconds, event.reason, self.clock.now()),
            )
            if cur.rowcount == 0:
                conn.execute("UPDATE provider_events SET deliveries = deliveries + 1 WHERE event_id = ?", (event.event_id,))
                return False
            return True

    def process(self, event_id: str) -> EventResult:
        hangups: list[tuple[str, str]] = []
        with self.db.transaction() as conn:
            row = conn.execute("SELECT * FROM provider_events WHERE event_id = ?", (event_id,)).fetchone()
            if row is None:
                return EventResult(event_id, "missing")
            if row["processed_at"] is not None:
                return EventResult(event_id, "already_processed", row["call_id"])
            result = self._apply(conn, row, hangups)
            self._maybe_fail("before_commit")
            conn.execute(
                "UPDATE provider_events SET processed_at = ?, call_id = ?, outcome = ?, note = ?"
                " WHERE event_id = ? AND processed_at IS NULL",
                (self.clock.now(), result.call_id, result.outcome, result.note, event_id),
            )
        for provider, pcid in hangups:
            self.providers[provider].hangup(pcid)
        if result.outcome not in ("applied",):
            log.debug("event %s %s %s", event_id, result.outcome, result.note)
        return result

    def process_pending(self, limit: int = 1000) -> list[EventResult]:
        rows = self.db.conn().execute(
            "SELECT event_id FROM provider_events WHERE processed_at IS NULL ORDER BY received_at LIMIT ?", (limit,)
        ).fetchall()
        return [self.process(r["event_id"]) for r in rows]

    def _apply(self, conn, row, hangups: list) -> EventResult:
        eid = row["event_id"]
        call = self.repo.call_by_token(conn, row["dial_token"]) if row["dial_token"] else None
        if call is None and row["provider_call_id"]:
            call = conn.execute("SELECT * FROM calls WHERE provider_call_id = ?", (row["provider_call_id"],)).fetchone()
        if call is None:
            return EventResult(eid, "orphan", None, "no call for this event")

        etype = EventType(row["event_type"])
        target = EVENT_TARGET[etype]
        state = C(call["state"])

        if state == C.RESERVED:
            if call["initiation"] in (Initiation.SENDING, Initiation.UNKNOWN):
                # event beat our own "accepted" write, or we timed out but it went through
                call = self.repo.adopt(conn, call, row["provider_call_id"])
                state = C.INITIATED
            else:
                return EventResult(eid, "invalid", call["id"], f"event for call with initiation={call['initiation']}")

        if call["screening"]:
            return self._apply_screening(conn, row, call, state, etype, hangups)
        if etype in (EventType.SCREEN_RESULT, EventType.TRANSFERRED):
            return EventResult(eid, "invalid", call["id"], f"{etype} for a call without screening")

        reason = row["reason"] or REASONS.get(etype, etype.value.lower())
        if target == C.COMPLETED and state != C.CONNECTED and not self._has_agent(conn, call):
            # borrower was on the line and nobody was bridged to them
            target, reason = C.ABANDONED, "answered_no_agent"

        verdict = classify(state, target)
        if verdict == Verdict.LATE:
            if etype == EventType.ANSWERED and state != C.COMPLETED:
                hangups.append((row["provider"], row["provider_call_id"]))
                return EventResult(eid, "late", call["id"], f"answered after {state}, hung up")
            return EventResult(eid, "late", call["id"], f"{etype} after {state}")
        if verdict == Verdict.STALE:
            self._touch(conn, call["id"])
            return EventResult(eid, "stale", call["id"], f"{etype} while {state}")
        if verdict == Verdict.INVALID:
            return EventResult(eid, "invalid", call["id"], f"{state} -> {target}")

        if target in (C.COMPLETED, C.FAILED, C.CANCELLED, C.ABANDONED):
            self.repo.finish(conn, call, target, reason, row["talk_seconds"])
            return EventResult(eid, "applied", call["id"], f"{state} -> {target}")

        self.repo.advance(conn, call, target, row["occurred_at"] or self.clock.now())
        if target == C.ANSWERED:
            fresh = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
            if not self.repo.connect(conn, fresh):
                hangups.append((row["provider"], row["provider_call_id"]))
                return EventResult(eid, "applied", call["id"], "answered, no agent free -> abandoned")
            return EventResult(eid, "applied", call["id"], f"{state} -> CONNECTED")
        return EventResult(eid, "applied", call["id"], f"{state} -> {target}")

    def _apply_screening(self, conn, row, call, state: CallState, etype: EventType, hangups: list) -> EventResult:
        """Screening calls: the bot talks first, an agent only joins via a transfer.

        Same rules as everywhere else (rank for stale, terminal for late), plus:
        - SCREEN_RESULT or TRANSFERRED arriving before ANSWERED implies the answer
        - a declined result is honoured even if it arrives after the call ended
        - COMPLETED while on hold means the borrower gave up waiting, unless a
          transfer was already sent, in which case they did reach the agent
        """
        eid, cid = row["event_id"], call["id"]
        reason = row["reason"] or REASONS.get(etype, etype.value.lower())

        if etype == EventType.SCREEN_RESULT:
            result = row["reason"]
            if result not in {r.value for r in ScreenResult}:
                return EventResult(eid, "invalid", cid, f"unknown screen result {result!r}")
            if state in TERMINAL_CALL_STATES:
                self.repo.record_screen_result(conn, cid, result)
                if result == ScreenResult.DECLINED:
                    self._honour_decline(conn, call)
                return EventResult(eid, "late", cid, f"screen result {result} after {state}, recorded")
            if CALL_RANK[state] >= CALL_RANK[C.TRANSFER_PENDING] or call["screen_result"]:
                self._touch(conn, cid)
                return EventResult(eid, "stale", cid, f"screen result {result} while {state}")
            call = self._ensure_screening(conn, call, row)
            if result == ScreenResult.WILLING:
                self.repo.screened_willing(conn, call)
                return EventResult(eid, "applied", cid, "SCREENING -> TRANSFER_PENDING")
            self.repo.record_screen_result(conn, cid, result)
            call = conn.execute("SELECT * FROM calls WHERE id = ?", (cid,)).fetchone()
            target, why = {
                ScreenResult.UNAVAILABLE: (C.COMPLETED, "screen_unavailable"),
                ScreenResult.DECLINED: (C.COMPLETED, "screen_declined"),
                ScreenResult.FAILED: (C.FAILED, "screen_failed"),
            }[ScreenResult(result)]
            self.repo.finish(conn, call, target, why, row["talk_seconds"])
            return EventResult(eid, "applied", cid, f"SCREENING -> {target} ({why})")

        if etype == EventType.TRANSFERRED:
            if state in TERMINAL_CALL_STATES:
                hangups.append((row["provider"], row["provider_call_id"]))
                return EventResult(eid, "late", cid, f"transferred after {state}, hung up")
            if state == C.CONNECTED:
                self._touch(conn, cid)
                return EventResult(eid, "stale", cid, "transferred while CONNECTED")
            if state != C.TRANSFER_PENDING or not self.repo.complete_transfer(conn, call):
                return EventResult(eid, "invalid", cid, f"transferred while {state} without a reserved agent")
            return EventResult(eid, "applied", cid, "TRANSFER_PENDING -> CONNECTED")

        if etype == EventType.ANSWERED:
            verdict = classify(state, C.ANSWERED)
            if verdict == Verdict.LATE:
                if state != C.COMPLETED:
                    hangups.append((row["provider"], row["provider_call_id"]))
                return EventResult(eid, "late", cid, f"answered after {state}")
            if verdict != Verdict.APPLY:
                self._touch(conn, cid)
                return EventResult(eid, verdict.value, cid, f"answered while {state}")
            self._ensure_screening(conn, call, row)
            return EventResult(eid, "applied", cid, f"{state} -> SCREENING")

        target = EVENT_TARGET[etype]
        if state in TERMINAL_CALL_STATES:
            return EventResult(eid, "late", cid, f"{etype} after {state}")
        if state == C.TRANSFER_PENDING and target == C.COMPLETED:
            if call["agent_id"] and call["transfer_status"] in ("SENDING", "UNKNOWN", "ACCEPTED"):
                # TRANSFERRED is late or lost; the provider did bridge them
                self.repo.complete_transfer(conn, call)
                call = conn.execute("SELECT * FROM calls WHERE id = ?", (cid,)).fetchone()
                self.repo.finish(conn, call, C.COMPLETED, reason, row["talk_seconds"])
                return EventResult(eid, "applied", cid, "TRANSFER_PENDING -> CONNECTED -> COMPLETED")
            self.repo.finish(conn, call, C.FAILED, "caller_left_hold", row["talk_seconds"])
            return EventResult(eid, "applied", cid, "borrower hung up on hold")
        verdict = classify(state, target)
        if verdict == Verdict.STALE:
            self._touch(conn, cid)
            return EventResult(eid, "stale", cid, f"{etype} while {state}")
        if verdict == Verdict.INVALID:
            return EventResult(eid, "invalid", cid, f"{state} -> {target}")
        if target not in TERMINAL_CALL_STATES:
            self.repo.advance(conn, call, target, row["occurred_at"] or self.clock.now())
        else:
            self.repo.finish(conn, call, target, reason, row["talk_seconds"])
        return EventResult(eid, "applied", cid, f"{state} -> {target}")

    def _ensure_screening(self, conn, call, row):
        """Bring a screening call up to SCREENING if events skipped ahead of ANSWERED."""
        state = C(call["state"])
        if state in (C.INITIATED, C.RINGING):
            self.repo.advance(conn, call, C.ANSWERED, row["occurred_at"] or self.clock.now())
            call = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
            state = C.ANSWERED
        if state == C.ANSWERED:
            self.repo.start_screening(conn, call)
            call = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
        return call

    def _honour_decline(self, conn, call) -> None:
        """A late "declined" still counts: no more calls to this borrower."""
        conn.execute("UPDATE borrowers SET outcome = 'declined' WHERE id = ?", (call["borrower_id"],))
        conn.execute(
            "UPDATE calls SET state = 'CANCELLED', end_reason = 'declined', ended_at = ?, updated_at = ?"
            " WHERE borrower_id = ? AND state = 'QUEUED'",
            (self.clock.now(), self.clock.now(), call["borrower_id"]),
        )

    @staticmethod
    def _has_agent(conn, call) -> bool:
        if not call["agent_id"]:
            return False
        agent = conn.execute("SELECT current_call_id FROM agents WHERE id = ?", (call["agent_id"],)).fetchone()
        return agent is not None and agent["current_call_id"] == call["id"]

    def _touch(self, conn, call_id: int) -> None:
        conn.execute("UPDATE calls SET last_event_at = ? WHERE id = ?", (self.clock.now(), call_id))

    def _maybe_fail(self, point: str) -> None:
        if self.fail_point is not None:
            self.fail_point(point)
