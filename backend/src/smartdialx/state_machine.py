"""Allowed state transitions for agents and calls.

Every state change in the repository goes through `check_agent` / `check_call`,
and every UPDATE also filters on the state we expect to be leaving. So even if two
threads decide on the same change, only one UPDATE matches.
"""

from enum import StrEnum

from .models import AgentState, CallState, TERMINAL_CALL_STATES

A = AgentState
C = CallState

AGENT_TRANSITIONS: dict[AgentState, frozenset[AgentState]] = {
    A.OFFLINE: frozenset({A.AVAILABLE}),
    A.AVAILABLE: frozenset({A.RESERVED, A.CONNECTED, A.PAUSED, A.OFFLINE}),
    # RESERVED -> CONNECTED: agent held for a screened borrower, provider bridged them
    A.RESERVED: frozenset({A.DIALING, A.CONNECTED, A.AVAILABLE, A.OFFLINE}),
    # WRAP_UP straight from DIALING happens when COMPLETED beats ANSWERED
    A.DIALING: frozenset({A.CONNECTED, A.AVAILABLE, A.WRAP_UP, A.OFFLINE}),
    A.CONNECTED: frozenset({A.WRAP_UP, A.OFFLINE}),
    # CONNECTED from WRAP_UP = pulled a few seconds early for an answered call
    A.WRAP_UP: frozenset({A.AVAILABLE, A.CONNECTED, A.PAUSED, A.OFFLINE}),
    A.PAUSED: frozenset({A.AVAILABLE, A.OFFLINE}),
}

CALL_TRANSITIONS: dict[CallState, frozenset[CallState]] = {
    C.QUEUED: frozenset({C.RESERVED, C.CANCELLED}),
    # back to QUEUED only if the provider was never contacted
    C.RESERVED: frozenset({C.QUEUED, C.INITIATED, C.FAILED, C.CANCELLED}),
    C.INITIATED: frozenset({C.RINGING, C.ANSWERED, C.COMPLETED, C.FAILED, C.CANCELLED, C.ABANDONED}),
    C.RINGING: frozenset({C.ANSWERED, C.COMPLETED, C.FAILED, C.CANCELLED, C.ABANDONED}),
    C.ANSWERED: frozenset({C.CONNECTED, C.SCREENING, C.ABANDONED, C.FAILED}),
    # screening calls: the bot talks first and only willing borrowers go on to an agent
    C.SCREENING: frozenset({C.TRANSFER_PENDING, C.COMPLETED, C.FAILED}),
    C.TRANSFER_PENDING: frozenset({C.CONNECTED, C.FAILED}),
    C.CONNECTED: frozenset({C.COMPLETED, C.FAILED}),
    C.COMPLETED: frozenset(),
    C.FAILED: frozenset(),
    C.CANCELLED: frozenset(),
    C.ABANDONED: frozenset(),
}

# how far along a call is; used to spot stale provider events
CALL_RANK: dict[CallState, int] = {
    C.QUEUED: 0,
    C.RESERVED: 1,
    C.INITIATED: 2,
    C.RINGING: 3,
    C.ANSWERED: 4,
    C.SCREENING: 5,
    C.TRANSFER_PENDING: 6,
    C.CONNECTED: 7,
    C.COMPLETED: 9,
    C.FAILED: 9,
    C.CANCELLED: 9,
    C.ABANDONED: 9,
}


class InvalidTransition(Exception):
    def __init__(self, kind: str, current: str, target: str):
        super().__init__(f"{kind}: {current} -> {target} not allowed")
        self.current = current
        self.target = target


def can_agent(current: AgentState, target: AgentState) -> bool:
    return target in AGENT_TRANSITIONS[current]


def can_call(current: CallState, target: CallState) -> bool:
    return target in CALL_TRANSITIONS[current]


def check_agent(current: AgentState, target: AgentState) -> None:
    if not can_agent(current, target):
        raise InvalidTransition("agent", current, target)


def check_call(current: CallState, target: CallState) -> None:
    if not can_call(current, target):
        raise InvalidTransition("call", current, target)


class Verdict(StrEnum):
    APPLY = "applied"
    STALE = "stale"            # call is already at or past this point
    LATE = "late"              # call already finished
    INVALID = "invalid"


def classify(current: CallState, target: CallState) -> Verdict:
    """Decide what to do with a provider event that wants to move a call to `target`."""
    if current in TERMINAL_CALL_STATES:
        return Verdict.LATE
    if target not in TERMINAL_CALL_STATES and CALL_RANK[target] <= CALL_RANK[current]:
        return Verdict.STALE
    if can_call(current, target):
        return Verdict.APPLY
    return Verdict.INVALID
