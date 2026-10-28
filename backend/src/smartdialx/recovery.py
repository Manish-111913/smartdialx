"""Cleans up after crashed workers and expired leases.

Safe to run from any worker, any number of times. Each fix re-checks the call
inside its own transaction, so two sweeps racing each other do the work once.

What it looks at:
- RESERVED, request never sent, lease expired  -> put borrower back, free agent
- RESERVED, request SENDING/UNKNOWN, lease expired -> ask the provider by token:
    found      -> adopt the call, events take it from there
    not found  -> definitely not placed, fail it as retryable, free agent
    no answer  -> leave it alone (agent stays held) until ambiguous_give_up_s
- live calls with no event for stuck_call_s -> ask the provider, replay its status
  through the normal event path so the usual duplicate/late rules apply
- agents pointing at calls that are already over -> free them
- workers with stale heartbeats -> mark DEAD (for visibility; leases do the real work)
"""

import logging
from collections.abc import Mapping
from dataclasses import dataclass, field

from .config import Settings
from .events import EventProcessor
from .models import CallState, EventType, Initiation, ProviderEvent, TERMINAL_CALL_STATES
from .providers import ProviderError, ProviderTimeout, ProviderUnavailable, TelecomProvider
from .repository import Repository

log = logging.getLogger(__name__)

C = CallState


@dataclass
class RecoveryReport:
    actions: list[tuple[str, int | None]] = field(default_factory=list)
    deferred: int = 0

    def count(self, action: str) -> int:
        return sum(1 for a, _ in self.actions if a == action)


class Recovery:
    def __init__(
        self,
        repo: Repository,
        providers: Mapping[str, TelecomProvider],
        events: EventProcessor,
        settings: Settings | None = None,
        worker_timeout_s: float = 30.0,
    ):
        self.repo = repo
        self.db = repo.db
        self.clock = repo.clock
        self.providers = providers
        self.events = events
        self.settings = settings or repo.settings
        self.worker_timeout_s = worker_timeout_s

    def sweep(self) -> RecoveryReport:
        report = RecoveryReport()
        self._expired_unsent(report)
        self._ambiguous(report)
        self._stuck_transfers(report)
        self._stuck(report)
        self._orphan_agents(report)
        self._dead_workers(report)
        return report

    def _expired_unsent(self, report: RecoveryReport) -> None:
        now = self.clock.now()
        rows = self.db.conn().execute(
            "SELECT id, dial_token FROM calls WHERE state = 'RESERVED' AND initiation = 'NOT_SENT'"
            " AND lease_expires_at < ?",
            (now,),
        ).fetchall()
        for row in rows:
            with self.db.transaction() as conn:
                call = conn.execute("SELECT * FROM calls WHERE id = ?", (row["id"],)).fetchone()
                if call["lease_expires_at"] is None or call["lease_expires_at"] >= now:
                    continue
                if self.repo._release(conn, call["id"], row["dial_token"], "lease_expired"):
                    self.repo.log_recovery(conn, "released", call["id"], call["agent_id"], "lease expired before dialing")
                    report.actions.append(("released", call["id"]))

    def _ambiguous(self, report: RecoveryReport) -> None:
        now = self.clock.now()
        rows = self.db.conn().execute(
            "SELECT * FROM calls WHERE state = 'RESERVED' AND initiation IN ('SENDING', 'UNKNOWN')"
            " AND lease_expires_at < ?",
            (now,),
        ).fetchall()
        for call in rows:
            provider = self.providers[call["provider"]]
            try:
                status = provider.lookup(call["dial_token"])
            except ProviderUnavailable:
                if now - (call["sending_at"] or now) > self.settings.timeouts.ambiguous_give_up_s:
                    self._give_up(call, report)
                else:
                    report.deferred += 1
                continue
            with self.db.transaction() as conn:
                fresh = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
                if fresh["state"] != C.RESERVED or fresh["dial_token"] != call["dial_token"]:
                    continue  # someone else sorted it out
                if status is None:
                    conn.execute("UPDATE calls SET initiation = 'REJECTED' WHERE id = ?", (call["id"],))
                    conn.execute(
                        "UPDATE provider_requests SET result = 'rejected', error = 'not found on reconcile'"
                        " WHERE dial_token = ? AND result IS NULL",
                        (call["dial_token"],),
                    )
                    fresh = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
                    self.repo.finish(conn, fresh, C.FAILED, "not_placed")
                    self.repo.log_recovery(conn, "not_placed", call["id"], call["agent_id"], "provider has no such request")
                    report.actions.append(("not_placed", call["id"]))
                else:
                    self.repo.adopt(conn, fresh, status.provider_call_id)
                    self.repo.log_recovery(
                        conn, "adopted", call["id"], call["agent_id"], f"provider has it as {status.status}"
                    )
                    report.actions.append(("adopted", call["id"]))

    def _give_up(self, call, report: RecoveryReport) -> None:
        with self.db.transaction() as conn:
            fresh = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
            if fresh["state"] != C.RESERVED or fresh["initiation"] not in (Initiation.SENDING, Initiation.UNKNOWN):
                return
            # if the call turns up later, its events land on a terminal call and an
            # ANSWERED gets hung up straight away (see events.py)
            self.repo.finish(conn, fresh, C.FAILED, "unreconciled")
            self.repo.log_recovery(conn, "gave_up", call["id"], call["agent_id"], "provider unreachable too long")
            report.actions.append(("gave_up", call["id"]))

    def _stuck(self, report: RecoveryReport) -> None:
        now = self.clock.now()
        rows = self.db.conn().execute(
            "SELECT * FROM calls WHERE state IN ('INITIATED', 'RINGING', 'ANSWERED', 'SCREENING', 'TRANSFER_PENDING', 'CONNECTED')"
            " AND last_event_at < ?",
            (now - self.settings.timeouts.stuck_call_s,),
        ).fetchall()
        for call in rows:
            provider = self.providers[call["provider"]]
            try:
                status = provider.lookup(call["dial_token"])
            except ProviderUnavailable:
                report.deferred += 1
                continue
            if status is None:
                with self.db.transaction() as conn:
                    fresh = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
                    if fresh["state"] in TERMINAL_CALL_STATES:
                        continue
                    self.repo.finish(conn, fresh, C.FAILED, "lost")
                    self.repo.log_recovery(conn, "lost", call["id"], call["agent_id"], "provider doesn't know the call")
                report.actions.append(("lost", call["id"]))
                continue
            event = ProviderEvent(
                event_id=f"reconcile:{status.provider_call_id}:{status.status}",
                provider=call["provider"],
                provider_call_id=status.provider_call_id,
                dial_token=call["dial_token"],
                type=EventType(status.status.upper()),
                occurred_at=now,
                talk_seconds=status.talk_seconds,
                reason=status.reason,
            )
            result = self.events.handle(event)
            with self.db.transaction() as conn:
                conn.execute("UPDATE calls SET last_event_at = ? WHERE id = ?", (now, call["id"]))
                if result.outcome == "applied":
                    self.repo.log_recovery(conn, "reconciled", call["id"], call["agent_id"], result.note)
            if result.outcome == "applied":
                report.actions.append(("reconciled", call["id"]))

    def _stuck_transfers(self, report: RecoveryReport) -> None:
        """Agent reserved for a transfer, but we never heard whether the transfer went through.

        Never pick a different agent or free this one on a guess. Ask the provider:
        transferred -> mark accepted (TRANSFERRED will follow or already did);
        still holding -> resend with the same token, which can't transfer twice;
        call over -> replay its final state through the event path.
        """
        now = self.clock.now()
        rows = self.db.conn().execute(
            "SELECT * FROM calls WHERE state = 'TRANSFER_PENDING' AND agent_id IS NOT NULL"
            " AND transfer_status IN ('SENDING', 'UNKNOWN') AND transfer_lease_expires_at < ?",
            (now,),
        ).fetchall()
        for call in rows:
            provider = self.providers[call["provider"]]
            try:
                status = provider.lookup(call["dial_token"])
            except ProviderUnavailable:
                report.deferred += 1
                continue
            if status is None:
                with self.db.transaction() as conn:
                    fresh = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
                    if fresh["state"] != C.TRANSFER_PENDING:
                        continue
                    self.repo.finish(conn, fresh, C.FAILED, "lost")
                    self.repo.log_recovery(conn, "lost", call["id"], call["agent_id"], "provider doesn't know the call")
                report.actions.append(("lost", call["id"]))
                continue
            if status.transferred:
                self.repo.transfer_accepted(call["id"], call["transfer_token"])
                action = "transfer_adopted"
                if status.status != "screen_result":
                    # TRANSFERRED (or later) already happened; replay it in case the webhook was lost
                    self.events.handle(self._event(call, status, now))
            elif status.holding:
                with self.db.transaction() as conn:
                    conn.execute(
                        "UPDATE calls SET transfer_lease_expires_at = ? WHERE id = ? AND transfer_token = ?",
                        (now + self.settings.timeouts.lease_s, call["id"], call["transfer_token"]),
                    )
                try:
                    provider.transfer(status.provider_call_id, call["transfer_token"], f"agent-{call['agent_id']}")
                    self.repo.transfer_accepted(call["id"], call["transfer_token"])
                    action = "transfer_resent"
                except ProviderTimeout:
                    self.repo.transfer_unknown(call["id"], call["transfer_token"])
                    report.deferred += 1
                    continue
                except ProviderError:
                    self.repo.transfer_rejected(call["id"], call["transfer_token"])
                    action = "transfer_released"
            else:
                self.events.handle(self._event(call, status, now))
                action = "reconciled"
            with self.db.transaction() as conn:
                self.repo.log_recovery(conn, action, call["id"], call["agent_id"], f"provider says {status.status}")
            report.actions.append((action, call["id"]))

    @staticmethod
    def _event(call, status, now: float) -> ProviderEvent:
        return ProviderEvent(
            event_id=f"reconcile:{status.provider_call_id}:{status.status}",
            provider=call["provider"],
            provider_call_id=status.provider_call_id,
            dial_token=call["dial_token"],
            type=EventType(status.status.upper()),
            occurred_at=now,
            talk_seconds=status.talk_seconds,
            reason=status.reason,
        )

    def _orphan_agents(self, report: RecoveryReport) -> None:
        rows = self.db.conn().execute(
            "SELECT a.id, a.state, a.current_call_id, c.state AS call_state, c.agent_id AS call_agent"
            " FROM agents a LEFT JOIN calls c ON c.id = a.current_call_id"
            " WHERE a.state IN ('RESERVED', 'DIALING', 'CONNECTED')"
            "   AND (c.id IS NULL OR c.agent_id IS NOT a.id"
            "        OR c.state IN ('COMPLETED', 'FAILED', 'CANCELLED', 'ABANDONED'))"
        ).fetchall()
        for row in rows:
            target = "WRAP_UP" if row["state"] == "CONNECTED" else "AVAILABLE"
            until = self.clock.now() + self.settings.timeouts.wrap_up_s if target == "WRAP_UP" else None
            with self.db.transaction() as conn:
                cur = conn.execute(
                    "UPDATE agents SET state = ?, current_call_id = NULL, wrap_up_until = ?,"
                    "   version = version + 1, updated_at = ?"
                    " WHERE id = ? AND state = ? AND current_call_id IS ?",
                    (target, until, self.clock.now(), row["id"], row["state"], row["current_call_id"]),
                )
                if cur.rowcount:
                    self.repo.log_recovery(
                        conn, "agent_freed", row["current_call_id"], row["id"],
                        f"{row['state']} with call in {row['call_state']}",
                    )
                    report.actions.append(("agent_freed", row["current_call_id"]))

    def _dead_workers(self, report: RecoveryReport) -> None:
        now = self.clock.now()
        with self.db.transaction() as conn:
            dead = conn.execute(
                "UPDATE workers SET status = 'DEAD' WHERE status = 'RUNNING' AND last_heartbeat < ? RETURNING id",
                (now - self.worker_timeout_s,),
            ).fetchall()
            for row in dead:
                self.repo.log_recovery(conn, "worker_dead", None, None, row["id"])
                report.actions.append(("worker_dead", None))
