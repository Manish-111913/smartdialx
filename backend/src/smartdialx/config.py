"""Tunable settings.

None of these numbers come from CredResolve. They are starting assumptions for the
prototype and should be validated against real campaign data and compliance rules
before anyone relies on them.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class SafetyLimits:
    # hard ceiling on live calls across the campaign
    max_active_calls: int = 500
    # predictive calls without an agent, per available agent. A backstop: the
    # pacer's own risk model should normally stay well below it
    max_overdial_ratio: float = 3.0
    # abandoned / answered, over the last `abandon_window` answered calls
    max_abandon_rate: float = 0.03
    abandon_window: int = 200
    abandon_min_samples: int = 20
    # predictive needs this many ring outcomes before we trust the answer rate
    min_samples_for_predictive: int = 30
    # if the short-window answer rate jumps above the long-window rate by this
    # factor, stop predicting until the long window catches up
    answer_rate_jump_ratio: float = 1.5
    answer_rate_jump_min: float = 0.15
    answer_rate_short_window: int = 30
    # provider circuit breaker
    provider_window_s: float = 60.0
    provider_min_requests: int = 10
    provider_max_error_rate: float = 0.5
    provider_probe_calls: int = 2
    max_calls_per_tick: int = 100
    max_calls_per_campaign: int | None = None
    # screening campaigns: bot calls in flight per free agent (predictive screening)
    max_screening_ratio: float = 6.0
    # willing borrowers who never reached an agent, over the last `abandon_window` willing ones
    max_transfer_fail_rate: float = 0.05
    # how many conversations the bot platform can hold at once
    max_bot_calls: int = 200


@dataclass(frozen=True)
class PacingSettings:
    prior_answer_rate: float = 0.3
    prior_weight: float = 20.0
    answer_window: int = 200
    # z for the upper confidence bound on the answer rate
    confidence_z: float = 1.0
    # acceptable chance that answers outnumber free agents, per pacing decision
    max_abandon_risk: float = 0.02
    max_request: int = 200
    # count agents in wrap-up that will be free within the expected setup time
    count_wrap_up_ending_soon: bool = True


@dataclass(frozen=True)
class Timeouts:
    # how long a worker owns a reservation before recovery may look at it
    lease_s: float = 30.0
    # client-side timeout for a provider initiate request; must be < lease_s
    provider_request_s: float = 5.0
    # live call with no provider event for this long gets reconciled
    stuck_call_s: float = 180.0
    # stop trying to reconcile an ambiguous initiation after this long
    ambiguous_give_up_s: float = 600.0
    wrap_up_s: float = 10.0
    # an answered predictive call may pull an agent this close to the end of wrap-up
    wrap_up_preempt_s: float = 5.0
    retry_delay_s: float = 60.0
    max_attempts: int = 3


@dataclass(frozen=True)
class ScreeningSettings:
    # how long a willing borrower is kept on hold (bot message) waiting for an agent
    hold_s: float = 20.0
    # what to do when nobody frees up in time: "callback" queues a retry, "end" just ends politely
    no_agent_policy: str = "callback"
    callback_delay_s: float = 300.0
    # "can't talk now" gets a later retry, within max_attempts
    unavailable_retry_s: float = 1800.0
    # starting guess for the share of ring outcomes that end up willing
    prior_willing_rate: float = 0.15


@dataclass(frozen=True)
class Settings:
    safety: SafetyLimits = field(default_factory=SafetyLimits)
    pacing: PacingSettings = field(default_factory=PacingSettings)
    timeouts: Timeouts = field(default_factory=Timeouts)
    screening: ScreeningSettings = field(default_factory=ScreeningSettings)

    def validate(self) -> None:
        t = self.timeouts
        if t.provider_request_s >= t.lease_s:
            # otherwise recovery could grab a reservation while the worker is
            # still legitimately waiting on the provider
            raise ValueError("provider_request_s must be shorter than lease_s")
        if not 0 < self.pacing.max_abandon_risk < 1:
            raise ValueError("max_abandon_risk must be between 0 and 1")
        if not 0 < self.pacing.prior_answer_rate <= 1:
            raise ValueError("prior_answer_rate must be in (0, 1]")
        if self.safety.max_overdial_ratio < 1:
            raise ValueError("max_overdial_ratio below 1 makes predictive slower than progressive")
        if self.screening.no_agent_policy not in ("callback", "end"):
            raise ValueError("no_agent_policy must be 'callback' or 'end'")
        if self.screening.hold_s <= 0:
            raise ValueError("hold_s must be positive")
