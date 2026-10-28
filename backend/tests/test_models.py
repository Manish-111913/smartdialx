import pytest

from smartdialx.config import Settings, Timeouts, PacingSettings, SafetyLimits
from smartdialx.models import (
    AgentState,
    CallState,
    CampaignStatus,
    EVENT_TARGET,
    EventType,
    LIVE_CALL_STATES,
    Mode,
    Snapshot,
    TERMINAL_CALL_STATES,
)


def test_required_agent_states_exist():
    for name in ["OFFLINE", "AVAILABLE", "RESERVED", "DIALING", "CONNECTED", "WRAP_UP", "PAUSED"]:
        assert AgentState(name).value == name


def test_required_call_states_exist():
    for name in ["QUEUED", "RESERVED", "INITIATED", "RINGING", "ANSWERED", "CONNECTED",
                 "COMPLETED", "FAILED", "CANCELLED"]:
        assert CallState(name).value == name


def test_terminal_and_live_sets_dont_overlap():
    assert not TERMINAL_CALL_STATES & LIVE_CALL_STATES
    assert CallState.QUEUED not in TERMINAL_CALL_STATES | LIVE_CALL_STATES


def test_every_event_type_maps_to_a_call_state():
    assert set(EVENT_TARGET) == set(EventType)


def test_snapshot_rates_without_data():
    snap = Snapshot(1, CampaignStatus.RUNNING, Mode.PREDICTIVE, now=0)
    assert snap.answer_rate is None
    assert snap.provider_error_rate == 0.0


def test_default_settings_are_valid():
    Settings().validate()


@pytest.mark.parametrize("settings", [
    Settings(timeouts=Timeouts(lease_s=5, provider_request_s=5)),
    Settings(pacing=PacingSettings(max_abandon_risk=0)),
    Settings(pacing=PacingSettings(prior_answer_rate=0)),
    Settings(safety=SafetyLimits(max_overdial_ratio=0.5)),
])
def test_bad_settings_are_rejected(settings):
    with pytest.raises(ValueError):
        settings.validate()
