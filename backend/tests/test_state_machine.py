import pytest

from smartdialx.models import AgentState as A, CallState as C, TERMINAL_CALL_STATES
from smartdialx.state_machine import (
    AGENT_TRANSITIONS,
    CALL_TRANSITIONS,
    InvalidTransition,
    Verdict,
    can_agent,
    can_call,
    check_agent,
    check_call,
    classify,
)


def test_every_state_has_a_row():
    assert set(AGENT_TRANSITIONS) == set(A)
    assert set(CALL_TRANSITIONS) == set(C)


@pytest.mark.parametrize("current,target", [
    (A.OFFLINE, A.AVAILABLE),
    (A.AVAILABLE, A.RESERVED),
    (A.RESERVED, A.DIALING),
    (A.DIALING, A.CONNECTED),
    (A.CONNECTED, A.WRAP_UP),
    (A.WRAP_UP, A.AVAILABLE),
    (A.AVAILABLE, A.PAUSED),
    (A.PAUSED, A.AVAILABLE),
    (A.DIALING, A.AVAILABLE),
    (A.RESERVED, A.OFFLINE),
    (A.RESERVED, A.CONNECTED),   # held for a screened borrower, then bridged
])
def test_normal_agent_lifecycle(current, target):
    assert can_agent(current, target)


@pytest.mark.parametrize("current,target", [
    (A.OFFLINE, A.RESERVED),
    (A.PAUSED, A.RESERVED),
    (A.RESERVED, A.RESERVED),
    (A.CONNECTED, A.AVAILABLE),   # must go through wrap-up
    (A.RESERVED, A.PAUSED),
])
def test_bad_agent_transitions(current, target):
    assert not can_agent(current, target)
    with pytest.raises(InvalidTransition):
        check_agent(current, target)


@pytest.mark.parametrize("path", [
    [C.QUEUED, C.RESERVED, C.INITIATED, C.RINGING, C.ANSWERED, C.CONNECTED, C.COMPLETED],
    [C.QUEUED, C.RESERVED, C.INITIATED, C.RINGING, C.FAILED],
    [C.QUEUED, C.RESERVED, C.QUEUED],
    [C.QUEUED, C.RESERVED, C.INITIATED, C.RINGING, C.ANSWERED, C.ABANDONED],
    [C.QUEUED, C.RESERVED, C.INITIATED, C.CANCELLED],
    # screening: bot first, agent only after a yes
    [C.QUEUED, C.RESERVED, C.INITIATED, C.RINGING, C.ANSWERED, C.SCREENING, C.TRANSFER_PENDING, C.CONNECTED, C.COMPLETED],
    [C.QUEUED, C.RESERVED, C.INITIATED, C.RINGING, C.ANSWERED, C.SCREENING, C.COMPLETED],
    [C.QUEUED, C.RESERVED, C.INITIATED, C.RINGING, C.ANSWERED, C.SCREENING, C.TRANSFER_PENDING, C.FAILED],
])
def test_valid_call_paths(path):
    for a, b in zip(path, path[1:]):
        check_call(a, b)


@pytest.mark.parametrize("current,target", [
    (C.QUEUED, C.INITIATED),
    (C.RINGING, C.QUEUED),        # can't requeue after the provider has it
    (C.CONNECTED, C.RINGING),
    (C.ANSWERED, C.COMPLETED),    # must be CONNECTED or ABANDONED first
    (C.INITIATED, C.CONNECTED),
    (C.SCREENING, C.CONNECTED),         # no agent without the transfer step
    (C.TRANSFER_PENDING, C.COMPLETED),  # must be CONNECTED first
    (C.TRANSFER_PENDING, C.SCREENING),
    (C.RINGING, C.TRANSFER_PENDING),
])
def test_bad_call_transitions(current, target):
    assert not can_call(current, target)
    with pytest.raises(InvalidTransition):
        check_call(current, target)


def test_terminal_states_are_final():
    for state in TERMINAL_CALL_STATES:
        assert CALL_TRANSITIONS[state] == frozenset()


@pytest.mark.parametrize("current,target,verdict", [
    (C.RINGING, C.ANSWERED, Verdict.APPLY),
    (C.INITIATED, C.COMPLETED, Verdict.APPLY),     # skipping ahead is fine
    (C.CONNECTED, C.ANSWERED, Verdict.STALE),      # duplicate meaning
    (C.ANSWERED, C.RINGING, Verdict.STALE),        # out of order
    (C.RINGING, C.RINGING, Verdict.STALE),
    (C.COMPLETED, C.ANSWERED, Verdict.LATE),
    (C.FAILED, C.COMPLETED, Verdict.LATE),
    (C.CONNECTED, C.CANCELLED, Verdict.INVALID),
    (C.TRANSFER_PENDING, C.TRANSFER_PENDING, Verdict.STALE),  # duplicate willing
    (C.CONNECTED, C.TRANSFER_PENDING, Verdict.STALE),
    (C.SCREENING, C.TRANSFER_PENDING, Verdict.APPLY),
])
def test_classify(current, target, verdict):
    assert classify(current, target) == verdict
