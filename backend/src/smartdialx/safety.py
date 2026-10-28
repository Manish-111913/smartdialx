"""Safety controller. Sits between pacing and the allocator.

It never trusts the pacer's math. Every limit here is recomputed from the database
snapshot, so a buggy or over-eager pacer can at worst ask for too much and get
told no. The allocator only accepts decisions created here.

Rules, in order:
- campaign not running -> reject
- provider error rate over the limit -> reject new calls (live calls carry on)
- predictive without enough data, with too many abandons, or with the answer rate
  suddenly jumping -> force progressive
- bound (progressive) calls never exceed free agents
- unbound (predictive) calls in flight never exceed free agents * max_overdial_ratio
- global caps: live calls, calls per tick, calls per campaign

Screening campaigns (bot calls first) have their own branch: no new bot calls while
someone is waiting for an agent, a progressive or ratio cap on bot calls in flight, a
bot concurrency cap, and a fallback to progressive if too many willing borrowers go
unserved. `review_transfer` is the consent gate for handing someone to an agent.
"""

import math
from dataclasses import dataclass, field
from enum import StrEnum

from .config import SafetyLimits
from .models import CampaignStatus, Mode, PacingRequest, Snapshot


class Action(StrEnum):
    APPROVE = "APPROVE"
    REDUCE = "REDUCE"
    REJECT = "REJECT"
    FORCE_PROGRESSIVE = "FORCE_PROGRESSIVE"


_SEAL = object()


@dataclass(frozen=True)
class SafetyDecision:
    action: Action
    requested: int
    approved: int
    bound: bool
    mode: Mode
    reasons: tuple[str, ...]
    request: PacingRequest
    _seal: object = field(default=None, repr=False, compare=False)

    @property
    def issued_by_safety(self) -> bool:
        return self._seal is _SEAL


class SafetyController:
    def __init__(self, limits: SafetyLimits | None = None):
        self.limits = limits or SafetyLimits()

    def review(self, req: PacingRequest, snap: Snapshot) -> SafetyDecision:
        lim = self.limits
        reasons: list[str] = []

        if snap.campaign_status != CampaignStatus.RUNNING:
            return self._decide(req, 0, req.bound, False, [f"campaign_not_running: {snap.campaign_status}"])

        if snap.provider_requests >= lim.provider_min_requests and snap.provider_error_rate > lim.provider_max_error_rate:
            return self._decide(req, 0, req.bound, False, [
                f"provider_unhealthy: {snap.provider_errors}/{snap.provider_requests} failed in the last "
                f"{lim.provider_window_s:.0f}s"
            ])

        if snap.screening:
            return self._review_screening(req, snap)

        bound = req.bound
        approved = req.requested
        forced = False

        if not bound:
            why = self._why_not_predictive(snap)
            if why:
                forced, bound = True, True
                approved = min(snap.available_agents, snap.queued_ready)
                reasons.append(why)

        if bound:
            if approved > snap.available_agents:
                reasons.append(f"bound_cap: {snap.available_agents} free agents")
                approved = snap.available_agents
        else:
            room = math.floor(snap.available_agents * lim.max_overdial_ratio) - snap.unbound_in_flight
            if approved > room:
                reasons.append(
                    f"overdial_cap: {snap.unbound_in_flight} in flight, limit "
                    f"{lim.max_overdial_ratio} x {snap.available_agents} free agents"
                )
                approved = room

        approved = self._common_caps(approved, snap, reasons)
        return self._decide(req, max(0, approved), bound, forced, reasons)

    def _review_screening(self, req: PacingRequest, snap: Snapshot) -> SafetyDecision:
        """New bot calls for a screening campaign.

        Agents aren't held during screening, so the risk is a willing borrower left on
        hold with nobody to take them. Progressive screening never has more bot calls
        in flight (plus people already waiting) than free agents.
        """
        lim = self.limits
        reasons: list[str] = []
        if snap.pending_transfers > 0:
            return self._decide(req, 0, req.bound, False, [
                f"transfer_backlog: {snap.pending_transfers} willing borrowers already waiting for an agent"
            ])
        progressive = req.bound
        approved = req.requested
        forced = False
        if not progressive:
            why = None
            if snap.ring_total < lim.min_samples_for_predictive:
                why = f"cold_start: {snap.ring_total}/{lim.min_samples_for_predictive} screening outcomes"
            elif snap.recent_willing >= lim.abandon_min_samples:
                rate = snap.recent_transfer_failures / snap.recent_willing
                if rate > lim.max_transfer_fail_rate:
                    why = (f"transfer_fail_rate: {snap.recent_transfer_failures}/{snap.recent_willing} = {rate:.1%} "
                           f"> {lim.max_transfer_fail_rate:.1%}")
            if why:
                forced, progressive = True, True
                approved = min(snap.queued_ready, snap.available_agents - snap.screening_in_flight)
                reasons.append(why)

        if progressive:
            room = snap.available_agents - snap.screening_in_flight - snap.pending_transfers
            label = f"screening_cap: {snap.screening_in_flight} bot calls in flight, {snap.available_agents} free agents"
        else:
            room = (math.floor(snap.available_agents * lim.max_screening_ratio)
                    - snap.screening_in_flight - snap.pending_transfers)
            label = (f"screening_overdial_cap: {snap.screening_in_flight} in flight, limit "
                     f"{lim.max_screening_ratio} x {snap.available_agents} free agents")
        if approved > room:
            reasons.append(label)
            approved = room
        room = lim.max_bot_calls - snap.screening_in_flight
        if approved > room:
            reasons.append(f"bot_cap: {snap.screening_in_flight}/{lim.max_bot_calls} bot conversations")
            approved = room

        approved = self._common_caps(approved, snap, reasons)
        return self._decide(req, max(0, approved), progressive, forced, reasons)

    def review_transfer(self, screen_result: str | None, campaign_status: str) -> tuple[bool, str]:
        """May a screened borrower be handed to an agent?

        Only someone the bot recorded as willing. A paused campaign still finishes
        transfers for people who already said yes; a stopped one doesn't.
        """
        if screen_result != "willing":
            return False, f"no_consent: screen result is {screen_result}"
        if campaign_status == CampaignStatus.STOPPED:
            return False, "campaign_stopped"
        return True, "ok"

    def _common_caps(self, approved: int, snap: Snapshot, reasons: list[str]) -> int:
        lim = self.limits
        room = lim.max_active_calls - snap.active_calls
        if approved > room:
            reasons.append(f"active_cap: {snap.active_calls}/{lim.max_active_calls} live")
            approved = room
        if approved > lim.max_calls_per_tick:
            reasons.append(f"tick_cap: {lim.max_calls_per_tick}")
            approved = lim.max_calls_per_tick
        if lim.max_calls_per_campaign is not None:
            room = lim.max_calls_per_campaign - snap.calls_started
            if approved > room:
                reasons.append(f"campaign_cap: {snap.calls_started}/{lim.max_calls_per_campaign}")
                approved = room
        if (
            snap.provider_requests < lim.provider_min_requests
            and snap.provider_errors >= 2
            and snap.provider_error_rate > lim.provider_max_error_rate
            and approved > lim.provider_probe_calls
        ):
            reasons.append(f"provider_probe: only {lim.provider_probe_calls} calls while the provider looks bad")
            approved = lim.provider_probe_calls
        return approved

    def _why_not_predictive(self, snap: Snapshot) -> str | None:
        lim = self.limits
        if snap.ring_total < lim.min_samples_for_predictive:
            return f"cold_start: {snap.ring_total}/{lim.min_samples_for_predictive} ring outcomes"
        if snap.recent_answered >= lim.abandon_min_samples:
            rate = snap.recent_abandoned / snap.recent_answered
            if rate > lim.max_abandon_rate:
                return (
                    f"abandon_rate: {snap.recent_abandoned}/{snap.recent_answered} = {rate:.1%} "
                    f"> {lim.max_abandon_rate:.1%}"
                )
        if snap.short_total >= lim.answer_rate_short_window and snap.ring_total:
            short = snap.short_answered / snap.short_total
            long = snap.ring_answered / snap.ring_total
            if short > long * lim.answer_rate_jump_ratio and short - long > lim.answer_rate_jump_min:
                return f"answer_rate_jump: last {snap.short_total} at {short:.0%} vs {long:.0%} overall"
        return None

    @staticmethod
    def _decide(req: PacingRequest, approved: int, bound: bool, forced: bool, reasons: list[str]) -> SafetyDecision:
        if forced:
            action = Action.FORCE_PROGRESSIVE
        elif approved >= req.requested:
            action = Action.APPROVE
            approved = req.requested
        elif approved == 0:
            action = Action.REJECT
        else:
            action = Action.REDUCE
        return SafetyDecision(
            action=action,
            requested=req.requested,
            approved=approved,
            bound=bound,
            mode=Mode.PROGRESSIVE if bound else req.mode,
            reasons=tuple(reasons),
            request=req,
            _seal=_SEAL,
        )
