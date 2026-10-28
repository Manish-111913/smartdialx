"""Screening bot -> human agent handoff.

This is a mock screening prototype. The "bot" is the provider's job: the mock
provider picks a conversation outcome at random from configured weights and reports
it as a SCREEN_RESULT event. There's no speech recognition, text-to-speech or
language model anywhere in here. A real voice-bot provider would plug in behind the
same TelecomProvider interface (initiate with screening=True, SCREEN_RESULT events,
transfer()).

What this module does is the part a real system would also need: once a borrower
says yes, reserve exactly one free agent, ask the provider to transfer, and if
nobody is free within `hold_s`, end the call politely and either schedule a callback
or stop, depending on `no_agent_policy`.

Transfer protocol, mirroring how calls are placed:
  1. tx: claim AVAILABLE agent -> RESERVED, call gets agent + transfer token, SENDING
  2. provider.transfer(call, token, agent)        -- no tx open
  3. tx: ACCEPTED / UNKNOWN (timeout) / rejected (agent freed, borrower keeps holding)
  4. TRANSFERRED event: call -> CONNECTED, agent RESERVED -> CONNECTED
After a crash or timeout, recovery looks the call up and resends with the same token,
which the provider treats as a no-op if the transfer already happened.
"""

import logging
from collections.abc import Callable, Mapping
from dataclasses import dataclass

from .providers import ProviderError, ProviderTimeout, TelecomProvider
from .repository import Repository
from .safety import SafetyController

log = logging.getLogger(__name__)


@dataclass
class TransferReport:
    sent: int = 0           # provider accepted the transfer request
    rejected: int = 0       # provider refused; agent freed, borrower still holding
    ambiguous: int = 0      # timed out; recovery reconciles
    no_agent: int = 0       # hold ran out with nobody free
    blocked: int = 0        # safety controller said no
    waiting: int = 0        # still on hold, no agent yet


class ScreeningService:
    def __init__(self, repo: Repository, providers: Mapping[str, TelecomProvider], safety: SafetyController):
        self.repo = repo
        self.db = repo.db
        self.clock = repo.clock
        self.providers = providers
        self.safety = safety
        self.fail_point: Callable[[str], None] | None = None

    def run(self) -> TransferReport:
        report = TransferReport()
        self._expire_holds(report)
        self._transfer_waiting(report)
        return report

    def _expire_holds(self, report: TransferReport) -> None:
        rows = self.db.conn().execute(
            "SELECT id FROM calls WHERE state = 'TRANSFER_PENDING' AND agent_id IS NULL AND hold_until <= ?",
            (self.clock.now(),),
        ).fetchall()
        for row in rows:
            hangup = self.repo.end_hold(row["id"], "no_agent_transfer")
            if hangup is not None:
                # the bot apologises and (with the callback policy) says we'll call back
                self.providers[hangup.provider].hangup(hangup.provider_call_id)
                report.no_agent += 1

    def _transfer_waiting(self, report: TransferReport) -> None:
        rows = self.db.conn().execute(
            "SELECT c.id, c.provider, c.provider_call_id, c.screen_result, k.status AS campaign_status"
            " FROM calls c JOIN campaigns k ON k.id = c.campaign_id"
            " WHERE c.state = 'TRANSFER_PENDING' AND c.agent_id IS NULL AND c.hold_until > ?"
            " ORDER BY c.transfer_requested_at, c.id",
            (self.clock.now(),),
        ).fetchall()
        for row in rows:
            allowed, why = self.safety.review_transfer(row["screen_result"], row["campaign_status"])
            if not allowed:
                hangup = self.repo.end_hold(row["id"], "transfer_blocked")
                if hangup is not None:
                    self.providers[hangup.provider].hangup(hangup.provider_call_id)
                log.info("transfer blocked call=%s: %s", row["id"], why)
                report.blocked += 1
                continue
            claim = self.repo.claim_transfer_agent(row["id"])
            if claim is None:
                report.waiting += 1
                continue
            agent_id, token = claim
            self.send(row["id"], row["provider"], row["provider_call_id"], agent_id, token, report)

    def send(self, call_id: int, provider: str, pcid: str, agent_id: int, token: str, report: TransferReport) -> None:
        self._maybe_fail("before_transfer")
        try:
            self.providers[provider].transfer(pcid, token, f"agent-{agent_id}")
        except ProviderTimeout:
            self.repo.transfer_unknown(call_id, token)
            report.ambiguous += 1
            return
        except ProviderError as e:
            log.info("transfer rejected call=%s: %s", call_id, e)
            self.repo.transfer_rejected(call_id, token)
            report.rejected += 1
            return
        self._maybe_fail("after_transfer")
        self.repo.transfer_accepted(call_id, token)
        report.sent += 1

    def _maybe_fail(self, point: str) -> None:
        if self.fail_point is not None:
            self.fail_point(point)
