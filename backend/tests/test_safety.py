import pytest

from smartdialx.config import SafetyLimits
from smartdialx.models import CampaignStatus, Mode, PacingRequest, Snapshot
from smartdialx.safety import Action, SafetyController, SafetyDecision


def snap(**kw) -> Snapshot:
    base = dict(campaign_id=1, campaign_status=CampaignStatus.RUNNING, mode=Mode.PREDICTIVE, now=0,
                staffed_agents=20, available_agents=10, queued_ready=1000,
                ring_answered=60, ring_total=200, short_answered=9, short_total=30)
    base.update(kw)
    return Snapshot(**base)


def predictive(n):
    return PacingRequest(Mode.PREDICTIVE, n, bound=False, reasoning="test")


def progressive(n):
    return PacingRequest(Mode.PROGRESSIVE, n, bound=True, reasoning="test")


@pytest.fixture
def safety():
    return SafetyController(SafetyLimits())


def test_reasonable_request_is_approved(safety):
    d = safety.review(predictive(15), snap())
    assert d.action == Action.APPROVE and d.approved == 15 and not d.bound


def test_paused_campaign_rejects_everything(safety):
    d = safety.review(progressive(5), snap(campaign_status=CampaignStatus.PAUSED))
    assert d.action == Action.REJECT and d.approved == 0


def test_unhealthy_provider_blocks_new_calls(safety):
    d = safety.review(progressive(5), snap(provider_requests=20, provider_errors=15))
    assert d.action == Action.REJECT
    assert d.reasons[0].startswith("provider_unhealthy")


def test_cold_start_forces_progressive(safety):
    d = safety.review(predictive(40), snap(ring_total=5, ring_answered=2))
    assert d.action == Action.FORCE_PROGRESSIVE and d.bound and d.approved == 10


def test_abandon_rate_forces_progressive(safety):
    d = safety.review(predictive(40), snap(recent_answered=100, recent_abandoned=5))
    assert d.action == Action.FORCE_PROGRESSIVE
    assert d.reasons[0].startswith("abandon_rate")


def test_answer_rate_jump_forces_progressive(safety):
    d = safety.review(predictive(40), snap(ring_answered=40, ring_total=200, short_answered=21, short_total=30))
    assert d.action == Action.FORCE_PROGRESSIVE
    assert d.reasons[0].startswith("answer_rate_jump")


def test_answer_rate_drop_does_not_force_progressive(safety):
    # dropping answers only means more idle time, not abandoned calls
    d = safety.review(predictive(20), snap(ring_answered=120, ring_total=200, short_answered=3, short_total=30))
    assert d.action != Action.FORCE_PROGRESSIVE


def test_bound_calls_never_exceed_free_agents(safety):
    d = safety.review(progressive(50), snap(available_agents=10))
    assert d.action == Action.REDUCE and d.approved == 10


def test_overdial_cap(safety):
    d = safety.review(predictive(100), snap(available_agents=10, unbound_in_flight=12))
    assert d.approved == 30 - 12
    assert any(r.startswith("overdial_cap") for r in d.reasons)


def test_no_free_agents_no_predictive_calls(safety):
    d = safety.review(predictive(10), snap(available_agents=0))
    assert d.action == Action.REJECT and d.approved == 0


def test_active_and_tick_caps():
    s = SafetyController(SafetyLimits(max_active_calls=20, max_calls_per_tick=5))
    d = s.review(predictive(25), snap(active_calls=18))
    assert d.approved == 2
    d = s.review(predictive(25), snap(active_calls=0))
    assert d.approved == 5


def test_campaign_cap():
    s = SafetyController(SafetyLimits(max_calls_per_campaign=100))
    d = s.review(progressive(10), snap(calls_started=97))
    assert d.approved == 3


def test_probe_mode_after_errors_with_few_requests(safety):
    d = safety.review(progressive(10), snap(provider_requests=4, provider_errors=3))
    assert d.approved == 2
    assert any(r.startswith("provider_probe") for r in d.reasons)


def test_pacer_cannot_forge_a_decision():
    fake = SafetyDecision(Action.APPROVE, 99, 99, False, Mode.PREDICTIVE, (), predictive(99))
    assert not fake.issued_by_safety


def test_decisions_are_deterministic(safety):
    a = safety.review(predictive(40), snap())
    b = safety.review(predictive(40), snap())
    assert (a.action, a.approved, a.reasons) == (b.action, b.approved, b.reasons)
