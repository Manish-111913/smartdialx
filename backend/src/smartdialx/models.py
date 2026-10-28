"""Agent/call states and the core data types."""

from dataclasses import dataclass, field
from enum import StrEnum


class AgentState(StrEnum):
    OFFLINE = "OFFLINE"
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"      # held for a call that hasn't been dialed yet
    DIALING = "DIALING"        # provider request sent, borrower not on the line yet
    CONNECTED = "CONNECTED"    # talking to a borrower
    WRAP_UP = "WRAP_UP"        # notes after a call
    PAUSED = "PAUSED"


class CallState(StrEnum):
    QUEUED = "QUEUED"
    RESERVED = "RESERVED"      # borrower claimed by a worker (and agent, if bound)
    INITIATED = "INITIATED"    # provider accepted the request
    RINGING = "RINGING"
    ANSWERED = "ANSWERED"      # borrower picked up; nobody bridged yet
    SCREENING = "SCREENING"    # screening bot is talking to the borrower
    TRANSFER_PENDING = "TRANSFER_PENDING"  # borrower agreed; waiting for / being handed to an agent
    CONNECTED = "CONNECTED"    # borrower bridged to an agent
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"          # no answer, busy, provider error, ...
    CANCELLED = "CANCELLED"    # we stopped it before it was answered
    ABANDONED = "ABANDONED"    # answered but no agent could take it


TERMINAL_CALL_STATES = frozenset(
    {CallState.COMPLETED, CallState.FAILED, CallState.CANCELLED, CallState.ABANDONED}
)
LIVE_CALL_STATES = frozenset(
    {
        CallState.RESERVED,
        CallState.INITIATED,
        CallState.RINGING,
        CallState.ANSWERED,
        CallState.SCREENING,
        CallState.TRANSFER_PENDING,
        CallState.CONNECTED,
    }
)


class Initiation(StrEnum):
    """What we know about the provider request for a call."""

    NOT_SENT = "NOT_SENT"
    SENDING = "SENDING"      # we may or may not have reached the provider
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"    # provider definitely did not place the call
    UNKNOWN = "UNKNOWN"      # timed out; needs reconciliation before anything else


class EventType(StrEnum):
    INITIATED = "INITIATED"
    RINGING = "RINGING"
    ANSWERED = "ANSWERED"
    COMPLETED = "COMPLETED"
    NO_ANSWER = "NO_ANSWER"
    BUSY = "BUSY"
    FAILED = "FAILED"
    TIMED_OUT = "TIMED_OUT"
    CANCELLED = "CANCELLED"
    SCREEN_RESULT = "SCREEN_RESULT"  # reason carries the outcome, see ScreenResult
    TRANSFERRED = "TRANSFERRED"      # provider bridged the borrower to our agent


EVENT_TARGET: dict[EventType, CallState] = {
    EventType.INITIATED: CallState.INITIATED,
    EventType.RINGING: CallState.RINGING,
    EventType.ANSWERED: CallState.ANSWERED,
    EventType.COMPLETED: CallState.COMPLETED,
    EventType.NO_ANSWER: CallState.FAILED,
    EventType.BUSY: CallState.FAILED,
    EventType.FAILED: CallState.FAILED,
    EventType.TIMED_OUT: CallState.FAILED,
    EventType.CANCELLED: CallState.CANCELLED,
    EventType.SCREEN_RESULT: CallState.TRANSFER_PENDING,  # only for "willing"; events.py handles the rest
    EventType.TRANSFERRED: CallState.CONNECTED,
}


class ScreenResult(StrEnum):
    WILLING = "willing"          # available and agreed to talk to an agent
    UNAVAILABLE = "unavailable"  # answered, can't talk now
    DECLINED = "declined"        # doesn't want to talk to an agent; never transfer
    FAILED = "failed"            # bot couldn't complete the conversation


class Mode(StrEnum):
    PROGRESSIVE = "progressive"
    PREDICTIVE = "predictive"


class CampaignStatus(StrEnum):
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"


# end reasons that mean "try this borrower again later"
RETRYABLE_REASONS = frozenset(
    {"no_answer", "busy", "failed", "network", "timed_out", "provider_rejected", "not_placed", "agent_left", "lost",
     "screen_unavailable", "screen_failed", "no_agent_transfer", "caller_left_hold"}
)


@dataclass(frozen=True)
class ProviderEvent:
    event_id: str
    provider: str
    provider_call_id: str
    dial_token: str
    type: EventType
    occurred_at: float
    talk_seconds: float | None = None
    reason: str | None = None


@dataclass(frozen=True)
class Reservation:
    call_id: int
    borrower_id: int
    campaign_id: int
    agent_id: int | None
    token: str
    phone: str
    provider: str
    screening: bool = False

    @property
    def bound(self) -> bool:
        return self.agent_id is not None


@dataclass(frozen=True)
class Campaign:
    id: int
    name: str
    mode: Mode
    provider: str
    status: CampaignStatus
    max_attempts: int
    screening: bool = False


@dataclass
class Snapshot:
    """Everything pacing and safety look at, read from the database in one go."""

    campaign_id: int
    campaign_status: CampaignStatus
    mode: Mode
    now: float
    staffed_agents: int = 0
    available_agents: int = 0
    wrap_up_ending_soon: int = 0
    connected_agents: int = 0
    bound_in_flight: int = 0
    unbound_in_flight: int = 0
    active_calls: int = 0
    queued_ready: int = 0
    calls_started: int = 0
    # ring outcomes (answered vs no answer/busy), most recent first
    ring_answered: int = 0
    ring_total: int = 0
    short_answered: int = 0
    short_total: int = 0
    # answered calls and how many of those were abandoned
    recent_answered: int = 0
    recent_abandoned: int = 0
    avg_talk_s: float | None = None
    avg_setup_s: float | None = None
    provider_requests: int = 0
    provider_errors: int = 0
    # screening campaigns only
    screening: bool = False
    screening_in_flight: int = 0     # bot calls not yet resolved (reserved .. screening)
    pending_transfers: int = 0       # willing borrowers on hold with no agent yet
    screen_willing: int = 0          # of ring_total, how many ended up willing
    recent_willing: int = 0
    recent_transfer_failures: int = 0

    @property
    def answer_rate(self) -> float | None:
        return self.ring_answered / self.ring_total if self.ring_total else None

    @property
    def provider_error_rate(self) -> float:
        return self.provider_errors / self.provider_requests if self.provider_requests else 0.0


@dataclass(frozen=True)
class PacingRequest:
    mode: Mode
    requested: int
    bound: bool
    reasoning: str
    inputs: dict = field(default_factory=dict)
