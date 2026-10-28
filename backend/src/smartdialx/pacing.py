"""Progressive and predictive pacing.

A pacer only answers "how many calls would I like to start right now, and why".
It has no access to the allocator or providers; whatever it asks for goes to the
safety controller first.
"""

import math

from .config import PacingSettings
from .models import Mode, PacingRequest, Snapshot


class ProgressivePacer:
    """One free agent, one call."""

    mode = Mode.PROGRESSIVE

    def decide(self, snap: Snapshot) -> PacingRequest:
        n = min(snap.available_agents, snap.queued_ready)
        return PacingRequest(
            mode=Mode.PROGRESSIVE,
            requested=n,
            bound=True,
            reasoning=f"{snap.available_agents} free agents, {snap.queued_ready} borrowers ready -> {n} calls",
            inputs={"available_agents": snap.available_agents, "queued_ready": snap.queued_ready},
        )


class PredictivePacer:
    """Dial ahead of agents, sized so that running out of agents stays unlikely.

    1. Estimate the answer rate from recent ring outcomes, blended with a prior so a
       handful of calls can't swing it (and there's no divide by zero on day one).
    2. Use an upper confidence bound on that rate. Guessing too high only costs us
       some idle time; guessing too low is what causes abandoned calls.
    3. Capacity = free agents (+ agents finishing wrap-up before a new call would
       likely be answered).
    4. Pick the largest N such that, with the calls already ringing plus N new ones,
       P(more answers than capacity) <= max_abandon_risk under a binomial model.
    5. Scale down by provider health so we don't pile requests on a failing provider.
    """

    mode = Mode.PREDICTIVE

    def __init__(self, settings: PacingSettings | None = None):
        self.settings = settings or PacingSettings()

    def decide(self, snap: Snapshot) -> PacingRequest:
        s = self.settings
        capacity = snap.available_agents + (snap.wrap_up_ending_soon if s.count_wrap_up_ending_soon else 0)
        p_hat, n_eff = smoothed_rate(snap.ring_answered, snap.ring_total, s.prior_answer_rate, s.prior_weight)
        p_safe = min(1.0, wilson_upper(p_hat, n_eff, s.confidence_z))
        in_flight = snap.unbound_in_flight

        n = largest_safe_batch(in_flight, p_safe, capacity, s.max_abandon_risk, s.max_request)
        health = max(0.0, 1.0 - snap.provider_error_rate)
        after_health = math.floor(n * health)
        requested = min(after_health, snap.queued_ready)
        expected_only = max(0, math.floor(capacity / p_safe - in_flight)) if p_safe > 0 else 0

        inputs = {
            "available_agents": snap.available_agents,
            "wrap_up_ending_soon": snap.wrap_up_ending_soon,
            "capacity": capacity,
            "unbound_in_flight": in_flight,
            "ring_answered": snap.ring_answered,
            "ring_total": snap.ring_total,
            "p_hat": round(p_hat, 4),
            "p_safe": round(p_safe, 4),
            "risk_target": s.max_abandon_risk,
            "risk_at_n": round(prob_more_than(in_flight + n, p_safe, capacity), 4),
            "binomial_n": n,
            "expected_value_n": expected_only,
            "provider_health": round(health, 3),
            "queued_ready": snap.queued_ready,
            "avg_talk_s": round(snap.avg_talk_s, 1) if snap.avg_talk_s else None,
            "avg_setup_s": round(snap.avg_setup_s, 1) if snap.avg_setup_s else None,
        }
        reasoning = (
            f"capacity {capacity} ({snap.available_agents} free + {inputs['wrap_up_ending_soon']} finishing wrap-up), "
            f"{in_flight} already ringing; answer rate {p_hat:.0%} from {snap.ring_total} outcomes, "
            f"planning with {p_safe:.0%}; largest batch with P(answers > capacity) <= {s.max_abandon_risk:.0%} "
            f"is {n} (expected-value alone would say {expected_only}); provider health {health:.0%} -> {after_health}; "
            f"{snap.queued_ready} ready -> request {requested}"
        )
        return PacingRequest(Mode.PREDICTIVE, requested, bound=False, reasoning=reasoning, inputs=inputs)


class ScreeningPacer:
    """How many screening bot calls to start.

    No agent is held while the bot talks; agents are only needed for the borrowers who
    end up willing. So this is the same question as predictive dialing, with "willing"
    in place of "answered":
    - progressive: bot calls in flight + borrowers on hold <= free agents. If every
      single person says yes, there's still an agent for each.
    - predictive: binomial risk on the willing rate, same method as PredictivePacer.
    """

    def __init__(self, progressive: bool, settings: PacingSettings | None = None, prior_willing_rate: float = 0.15):
        self.progressive = progressive
        self.mode = Mode.PROGRESSIVE if progressive else Mode.PREDICTIVE
        self.settings = settings or PacingSettings()
        self.prior_willing_rate = prior_willing_rate

    def decide(self, snap: Snapshot) -> PacingRequest:
        free = snap.available_agents
        waiting = snap.pending_transfers
        in_flight = snap.screening_in_flight
        if self.progressive:
            n = max(0, min(free - waiting - in_flight, snap.queued_ready))
            return PacingRequest(
                Mode.PROGRESSIVE, n, bound=True,
                reasoning=f"screening: {free} free agents, {in_flight} bot calls in flight, "
                          f"{waiting} on hold -> {n} calls",
                inputs={"available_agents": free, "screening_in_flight": in_flight,
                        "pending_transfers": waiting, "queued_ready": snap.queued_ready},
            )

        s = self.settings
        capacity = free + (snap.wrap_up_ending_soon if s.count_wrap_up_ending_soon else 0) - waiting
        p_hat, n_eff = smoothed_rate(snap.screen_willing, snap.ring_total, self.prior_willing_rate, s.prior_weight)
        p_safe = min(1.0, wilson_upper(p_hat, n_eff, s.confidence_z))
        n = largest_safe_batch(in_flight, p_safe, capacity, s.max_abandon_risk, s.max_request)
        health = max(0.0, 1.0 - snap.provider_error_rate)
        requested = min(math.floor(n * health), snap.queued_ready)
        inputs = {
            "available_agents": free,
            "pending_transfers": waiting,
            "capacity": capacity,
            "screening_in_flight": in_flight,
            "screen_willing": snap.screen_willing,
            "ring_total": snap.ring_total,
            "p_hat": round(p_hat, 4),
            "p_safe": round(p_safe, 4),
            "binomial_n": n,
            "provider_health": round(health, 3),
            "queued_ready": snap.queued_ready,
        }
        reasoning = (
            f"screening: capacity {capacity}, {in_flight} bot calls in flight; willing rate {p_hat:.0%} "
            f"from {snap.ring_total} outcomes, planning with {p_safe:.0%}; largest batch with "
            f"P(willing > capacity) <= {s.max_abandon_risk:.0%} is {n}; health {health:.0%} -> request {requested}"
        )
        return PacingRequest(Mode.PREDICTIVE, requested, bound=False, reasoning=reasoning, inputs=inputs)


def smoothed_rate(answered: int, total: int, prior_rate: float, prior_weight: float) -> tuple[float, float]:
    """Answer rate with `prior_weight` imaginary calls at `prior_rate` mixed in."""
    n = total + prior_weight
    if n <= 0:
        return prior_rate, 0.0
    return (answered + prior_rate * prior_weight) / n, n


def wilson_upper(p: float, n: float, z: float) -> float:
    if n <= 0:
        return 1.0
    z2 = z * z
    centre = p + z2 / (2 * n)
    spread = z * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))
    return (centre + spread) / (1 + z2 / n)


def prob_more_than(n: int, p: float, k: int) -> float:
    """P(X > k) for X ~ Binomial(n, p)."""
    if k >= n or n <= 0 or p <= 0:
        return 0.0
    if k < 0:
        return 1.0
    if p >= 1:
        return 1.0
    log_p, log_q = math.log(p), math.log1p(-p)
    lg_n1 = math.lgamma(n + 1)
    total = 0.0
    for i in range(k + 1, n + 1):
        total += math.exp(lg_n1 - math.lgamma(i + 1) - math.lgamma(n - i + 1) + i * log_p + (n - i) * log_q)
    return min(1.0, total)


def largest_safe_batch(in_flight: int, p: float, capacity: int, risk: float, max_n: int) -> int:
    """Largest N in [0, max_n] with P(Bin(in_flight + N, p) > capacity) <= risk."""
    if capacity <= 0 or prob_more_than(in_flight, p, capacity) > risk:
        return 0
    lo, hi = 0, max_n
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if prob_more_than(in_flight + mid, p, capacity) <= risk:
            lo = mid
        else:
            hi = mid - 1
    return lo
