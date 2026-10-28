"""Dialer pipeline (one tick) and the worker thread that runs it.

    Campaign -> Pacer -> SafetyController -> CallAllocator -> Provider

Workers share nothing in memory. Everything they agree on lives in SQLite, so
running one worker or ten only changes how often the loop runs.
"""

import json
import logging
import threading
import uuid
from collections.abc import Mapping
from dataclasses import dataclass

from .allocator import AllocationResult, CallAllocator
from .clock import Clock
from .config import Settings
from .db import Database
from .events import EventProcessor
from .models import Mode, PacingRequest
from .pacing import PredictivePacer, ProgressivePacer, ScreeningPacer
from .providers import TelecomProvider
from .recovery import Recovery
from .repository import Repository
from .safety import SafetyController, SafetyDecision
from .screening import ScreeningService, TransferReport
from .stats import take_snapshot

log = logging.getLogger(__name__)


@dataclass
class TickResult:
    request: PacingRequest
    decision: SafetyDecision
    allocation: AllocationResult
    transfers: TransferReport | None = None


class Dialer:
    def __init__(self, repo: Repository, providers: Mapping[str, TelecomProvider], worker_id: str):
        self.repo = repo
        self.settings = repo.settings
        self.safety = SafetyController(self.settings.safety)
        self.pacers = {
            Mode.PROGRESSIVE: ProgressivePacer(),
            Mode.PREDICTIVE: PredictivePacer(self.settings.pacing),
        }
        prior = self.settings.screening.prior_willing_rate
        self.screening_pacers = {
            Mode.PROGRESSIVE: ScreeningPacer(True, self.settings.pacing, prior),
            Mode.PREDICTIVE: ScreeningPacer(False, self.settings.pacing, prior),
        }
        self.allocator = CallAllocator(repo, providers, worker_id)
        self.screening = ScreeningService(repo, providers, self.safety)

    def tick(self, campaign_id: int) -> TickResult:
        campaign = self.repo.get_campaign(campaign_id)
        transfers = None
        if campaign.screening:
            # people already on hold get agents before we start new bot calls
            transfers = self.screening.run()
        snap = take_snapshot(self.repo.db, self.repo.clock, self.settings, campaign_id)
        pacers = self.screening_pacers if campaign.screening else self.pacers
        request = pacers[campaign.mode].decide(snap)
        decision = self.safety.review(request, snap)
        allocation = AllocationResult()
        if decision.approved > 0:
            allocation = self.allocator.execute(decision, campaign)
        if request.requested or decision.approved or decision.reasons:
            self._record(campaign_id, decision, allocation)
        return TickResult(request, decision, allocation, transfers)

    def _record(self, campaign_id: int, d: SafetyDecision, a: AllocationResult) -> None:
        with self.repo.db.transaction() as conn:
            conn.execute(
                "INSERT INTO decisions (campaign_id, at, mode, requested, approved, action, bound, started,"
                "   reasoning, safety_reasons, inputs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (campaign_id, self.repo.clock.now(), d.request.mode.value, d.requested, d.approved,
                 d.action.value, int(d.bound), a.started, d.request.reasoning,
                 json.dumps(list(d.reasons)) if d.reasons else None, json.dumps(d.request.inputs)),
            )


class Worker(threading.Thread):
    """Polls provider events, runs recovery, and dials for one campaign until stopped."""

    def __init__(
        self,
        db: Database,
        clock: Clock,
        providers: Mapping[str, TelecomProvider],
        campaign_id: int,
        settings: Settings | None = None,
        interval_s: float = 0.1,
        recovery_every: int = 10,
        worker_id: str | None = None,
    ):
        super().__init__(daemon=True)
        self.worker_id = worker_id or f"worker-{uuid.uuid4().hex[:6]}"
        self.name = self.worker_id
        self.repo = Repository(db, clock, settings)
        self.providers = providers
        self.campaign_id = campaign_id
        self.interval_s = interval_s
        self.recovery_every = recovery_every
        self.events = EventProcessor(self.repo, providers)
        self.recovery = Recovery(self.repo, providers, self.events)
        self.dialer = Dialer(self.repo, providers, self.worker_id)
        self.stop_event = threading.Event()
        self.errors = 0
        self.loops = 0

    def run(self) -> None:
        self.repo.heartbeat(self.worker_id)
        while not self.stop_event.is_set():
            try:
                self.run_once()
            except Exception:
                # one bad loop shouldn't kill the worker; leases cover anything it left half done
                self.errors += 1
                log.exception("worker %s loop failed", self.worker_id)
            self.stop_event.wait(self.interval_s)
        self.repo.heartbeat(self.worker_id, status="STOPPED")
        self.repo.db.close()

    def run_once(self) -> None:
        self.loops += 1
        for provider in self.providers.values():
            for event in provider.poll_events():
                self.events.handle(event)
        self.events.process_pending()
        if self.loops % self.recovery_every == 0:
            self.recovery.sweep()
        self.repo.expire_wrap_ups()
        self.dialer.tick(self.campaign_id)
        self.repo.heartbeat(self.worker_id)

    def stop(self) -> None:
        self.stop_event.set()
