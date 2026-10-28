import math

import pytest

from smartdialx.config import PacingSettings
from smartdialx.models import CampaignStatus, Mode, Snapshot
from smartdialx.pacing import (
    PredictivePacer,
    ProgressivePacer,
    largest_safe_batch,
    prob_more_than,
    smoothed_rate,
    wilson_upper,
)


def snap(**kw) -> Snapshot:
    base = dict(campaign_id=1, campaign_status=CampaignStatus.RUNNING, mode=Mode.PREDICTIVE, now=0,
                staffed_agents=20, queued_ready=1000)
    base.update(kw)
    return Snapshot(**base)


def test_progressive_is_one_call_per_free_agent():
    req = ProgressivePacer().decide(snap(available_agents=50))
    assert req.requested == 50 and req.bound


def test_progressive_limited_by_ready_borrowers():
    assert ProgressivePacer().decide(snap(available_agents=50, queued_ready=7)).requested == 7


def test_binomial_tail_matches_hand_calculation():
    # P(X > 1) for Bin(3, 0.5) = P(2) + P(3) = 3/8 + 1/8
    assert prob_more_than(3, 0.5, 1) == pytest.approx(0.5)
    assert prob_more_than(5, 0.2, 5) == 0.0
    assert prob_more_than(5, 1.0, 4) == 1.0
    assert prob_more_than(0, 0.5, 0) == 0.0


def test_binomial_tail_handles_large_n():
    value = prob_more_than(2000, 0.3, 650)
    assert 0 < value < 0.05


def test_wilson_upper_is_above_estimate_and_shrinks_with_data():
    assert wilson_upper(0.3, 10, 1.0) > wilson_upper(0.3, 1000, 1.0) > 0.3


def test_prior_dominates_tiny_samples():
    p, n = smoothed_rate(answered=3, total=3, prior_rate=0.3, prior_weight=20)
    assert p == pytest.approx((3 + 6) / 23)
    p0, _ = smoothed_rate(0, 0, 0.3, 20)
    assert p0 == 0.3


def test_no_capacity_means_no_calls():
    req = PredictivePacer().decide(snap(available_agents=0, ring_answered=50, ring_total=200))
    assert req.requested == 0


def test_lower_answer_rate_dials_more():
    pacer = PredictivePacer()
    low = pacer.decide(snap(available_agents=10, ring_answered=40, ring_total=200))
    high = pacer.decide(snap(available_agents=10, ring_answered=140, ring_total=200))
    assert low.requested > high.requested >= 10 * 0 and low.requested > 10


def test_calls_already_ringing_reduce_the_batch():
    pacer = PredictivePacer()
    idle = pacer.decide(snap(available_agents=10, ring_answered=60, ring_total=200))
    busy = pacer.decide(snap(available_agents=10, unbound_in_flight=15, ring_answered=60, ring_total=200))
    assert busy.requested < idle.requested


def test_chosen_batch_is_the_largest_within_risk():
    s = PacingSettings()
    req = PredictivePacer(s).decide(snap(available_agents=10, ring_answered=60, ring_total=200))
    p = req.inputs["p_safe"]
    n = req.inputs["binomial_n"]
    assert prob_more_than(n, p, 10) <= s.max_abandon_risk
    assert prob_more_than(n + 1, p, 10) > s.max_abandon_risk


def test_unhealthy_provider_scales_request_down():
    pacer = PredictivePacer()
    healthy = pacer.decide(snap(available_agents=10, ring_answered=60, ring_total=200))
    sick = pacer.decide(snap(available_agents=10, ring_answered=60, ring_total=200,
                             provider_requests=20, provider_errors=10))
    assert sick.requested == math.floor(healthy.inputs["binomial_n"] * 0.5)


def test_reasoning_explains_the_number():
    req = PredictivePacer().decide(snap(available_agents=10, ring_answered=60, ring_total=200))
    assert f"request {req.requested}" in req.reasoning
    for key in ("capacity", "p_hat", "p_safe", "risk_at_n", "unbound_in_flight", "provider_health"):
        assert key in req.inputs


def test_largest_safe_batch_edge_cases():
    assert largest_safe_batch(0, 0.5, 0, 0.02, 100) == 0
    assert largest_safe_batch(100, 0.5, 5, 0.02, 100) == 0   # already too much in flight
    assert largest_safe_batch(0, 1.0, 5, 0.02, 100) == 5     # everyone answers: 1:1
