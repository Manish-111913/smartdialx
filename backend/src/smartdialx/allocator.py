"""Picks an agent and a borrower and starts the call.

Order for every call:
  1. reserve (agent + borrower, or borrower only for predictive)   -- tx
  2. mark SENDING                                                  -- tx
  3. provider.initiate()                                           -- no tx open
  4. record accepted / rejected / unknown                          -- tx

If we crash after 2, recovery sees SENDING/UNKNOWN and asks the provider whether
the call exists before doing anything. We never re-send blindly.
"""

import logging
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field

from .models import Campaign, Reservation
from .providers import DialRequest, ProviderError, ProviderTimeout, TelecomProvider
from .repository import Repository
from .safety import SafetyDecision

log = logging.getLogger(__name__)


class NotApproved(Exception):
    pass


@dataclass
class AllocationResult:
    started: int = 0
    rejected: int = 0     # provider said no
    ambiguous: int = 0    # timed out, recovery will reconcile
    aborted: int = 0      # agent or call changed before we dialed
    ran_out: bool = False # no free agent or no ready borrower
    call_ids: list[int] = field(default_factory=list)


class CallAllocator:
    def __init__(self, repo: Repository, providers: Mapping[str, TelecomProvider], worker_id: str):
        self.repo = repo
        self.providers = providers
        self.worker_id = worker_id
        self.fail_point: Callable[[str], None] | None = None

    def execute(self, decision: SafetyDecision, campaign: Campaign) -> AllocationResult:
        if not decision.issued_by_safety:
            raise NotApproved("allocator only takes decisions from the safety controller")
        result = AllocationResult()
        for _ in range(decision.approved):
            if campaign.screening:
                res = self.repo.reserve_screening(campaign.id, self.worker_id, campaign.provider, decision.bound)
            elif decision.bound:
                res = self.repo.reserve_bound(campaign.id, self.worker_id, campaign.provider)
            else:
                res = self.repo.reserve_unbound(campaign.id, self.worker_id, campaign.provider)
            if res is None:
                result.ran_out = True
                break
            self.dial(res, result)
        return result

    def dial(self, res: Reservation, result: AllocationResult) -> None:
        self._maybe_fail("after_reserve")
        if not self.repo.mark_sending(res):
            result.aborted += 1
            return
        self._maybe_fail("after_sending")
        provider = self.providers[res.provider]
        try:
            pcid = provider.initiate(DialRequest(res.token, res.phone, res.call_id, screening=res.screening))
        except ProviderTimeout as e:
            self.repo.mark_unknown(res, str(e))
            result.ambiguous += 1
            return
        except ProviderError as e:
            self.repo.mark_rejected(res, str(e))
            result.rejected += 1
            return
        self._maybe_fail("after_initiate")
        if self.repo.mark_accepted(res, pcid):
            result.started += 1
            result.call_ids.append(res.call_id)
        else:
            # recovery or an event already moved this call on; provider call is tracked by token
            log.warning("call=%s accepted by provider but state moved on", res.call_id)
            result.aborted += 1

    def _maybe_fail(self, point: str) -> None:
        if self.fail_point is not None:
            self.fail_point(point)
