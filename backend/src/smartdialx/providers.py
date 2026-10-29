"""Provider interface and the two mock providers.

The dialer only sees `TelecomProvider`. Mocks schedule call events on a clock and
hand them out through `poll_events()`, which stands in for webhooks. Nothing here
dials a real number.
"""

import heapq
import itertools
import random
import threading
import time
from dataclasses import dataclass, field
from typing import Callable, Protocol

from .clock import Clock
from .models import EventType, ProviderEvent


_FINAL = frozenset(
    {EventType.COMPLETED, EventType.NO_ANSWER, EventType.BUSY, EventType.FAILED,
     EventType.TIMED_OUT, EventType.CANCELLED}
)


class ProviderError(Exception):
    """The provider told us it did not place the call. Safe to retry."""


class ProviderUnavailable(ProviderError):
    """Connection refused / 5xx before the request was accepted."""


class ProviderTimeout(Exception):
    """We gave up waiting. The call may or may not exist."""


@dataclass(frozen=True)
class DialRequest:
    token: str          # our id for this attempt, echoed back in every event
    phone: str
    call_id: int
    screening: bool = False  # start with the screening bot instead of a plain call


@dataclass(frozen=True)
class CallStatus:
    provider_call_id: str
    status: str         # last event type that has happened, lowercase
    talk_seconds: float | None = None
    reason: str | None = None
    transferred: bool = False  # provider accepted a transfer for this call
    holding: bool = False      # screened as willing, still on the line waiting for a transfer


class TelecomProvider(Protocol):
    name: str

    def initiate(self, req: DialRequest) -> str: ...

    def lookup(self, token: str) -> CallStatus | None: ...

    def hangup(self, provider_call_id: str) -> None: ...

    def transfer(self, provider_call_id: str, token: str, agent_ref: str) -> None: ...

    def poll_events(self) -> list[ProviderEvent]: ...


@dataclass
class ProviderProfile:
    name: str
    answer_rate: float = 0.5
    busy_rate: float = 0.05
    talk_s: float = 90.0
    ring_s: tuple[float, float] = (1.0, 3.0)
    answer_after_s: tuple[float, float] = (3.0, 10.0)
    no_answer_after_s: float = 25.0
    reject_rate: float = 0.0
    timeout_rate: float = 0.0
    # share of timeouts where the provider did place the call
    timeout_accepted: float = 0.5
    drop_rate: float = 0.0          # call fails after being accepted
    duplicate_rate: float = 0.0
    jitter_s: float = 0.0           # random delivery delay; big enough values reorder events
    request_latency_s: float = 0.0  # real sleep inside initiate(), only for threaded runs
    # who the borrower is, once they pick up. Used by the screening bot, and for plain
    # calls when willing_rate < 1 (an agent then gets a short "not now" call instead)
    willing_rate: float = 1.0
    unavailable_rate: float = 0.0
    screen_fail_rate: float = 0.0
    bot_s: tuple[float, float] = (15.0, 40.0)   # how long the bot conversation takes
    hold_patience_s: float = 60.0               # willing borrower hangs up after this long on hold
    brief_talk_s: float = 20.0


@dataclass
class _MockCall:
    pcid: str
    token: str
    events: list[ProviderEvent] = field(default_factory=list)
    answered_at: float | None = None
    ended: bool = False
    screening: bool = False
    holding_from: float | None = None
    transfer_token: str | None = None


class MockProvider:
    def __init__(
        self,
        profile: ProviderProfile,
        clock: Clock,
        seed: int | None = None,
        sleep: Callable[[float], None] = time.sleep,
    ):
        self.profile = profile
        self.name = profile.name
        self.clock = clock
        self.answer_rate = profile.answer_rate
        self.outage: str | None = None  # None, "down" or "timeout"
        # optional per-request audience: returns overrides for answer_rate, willing_rate,
        # unavailable_rate, screen_fail_rate, talk_s (the console uses it so campaigns
        # can call different kinds of people through the same provider)
        self.audience: Callable[[DialRequest], dict | None] | None = None
        self._rng = random.Random(seed)
        self._sleep = sleep
        self._lock = threading.Lock()
        self._calls: dict[str, _MockCall] = {}
        self._by_token: dict[str, str] = {}
        self._outbox: list[tuple[float, int, ProviderEvent]] = []
        self._seq = itertools.count()
        self._ids = itertools.count(1)
        self.stats = {"initiate": 0, "rejected": 0, "timeouts": 0, "duplicates_sent": 0, "hangups": 0}

    def set_outage(self, kind: str | None) -> None:
        if kind not in (None, "down", "timeout"):
            raise ValueError(kind)
        self.outage = kind

    # ---- interface -----------------------------------------------------------

    def initiate(self, req: DialRequest) -> str:
        if self.profile.request_latency_s:
            self._sleep(self.profile.request_latency_s)
        with self._lock:
            self.stats["initiate"] += 1
            if self.outage == "down":
                self.stats["rejected"] += 1
                raise ProviderUnavailable(f"{self.name} unavailable")
            # same token twice means the client retried; don't place a second call
            if req.token in self._by_token:
                return self._by_token[req.token]
            r = self._rng.random()
            if self.outage == "timeout" or r < self.profile.timeout_rate:
                self.stats["timeouts"] += 1
                if self._rng.random() < self.profile.timeout_accepted:
                    self._create(req)
                raise ProviderTimeout(f"{self.name} timed out")
            if r < self.profile.timeout_rate + self.profile.reject_rate:
                self.stats["rejected"] += 1
                raise ProviderError(f"{self.name} rejected the request")
            return self._create(req)

    def lookup(self, token: str) -> CallStatus | None:
        with self._lock:
            if self.outage:
                raise ProviderUnavailable(f"{self.name} unavailable")
            pcid = self._by_token.get(token)
            if pcid is None:
                return None
            call = self._calls[pcid]
            now = self.clock.now()
            happened = [e for e in call.events if e.occurred_at <= now]
            transferred = call.transfer_token is not None
            if not happened:
                return CallStatus(pcid, "initiated", transferred=transferred)
            last = max(happened, key=lambda e: e.occurred_at)
            return CallStatus(
                pcid, last.type.value.lower(), last.talk_seconds, last.reason,
                transferred=transferred,
                holding=not transferred and self._is_holding(call, now),
            )

    def hangup(self, provider_call_id: str) -> None:
        with self._lock:
            call = self._calls.get(provider_call_id)
            if call is None or call.ended:
                return
            now = self.clock.now()
            if any(e.occurred_at <= now and e.type in _FINAL for e in call.events):
                call.ended = True
                return
            self.stats["hangups"] += 1
            future = {e.event_id for e in call.events if e.occurred_at > now}
            call.events = [e for e in call.events if e.event_id not in future]
            self._outbox = [item for item in self._outbox if item[2].event_id not in future]
            heapq.heapify(self._outbox)
            if call.answered_at is not None and call.answered_at <= now:
                self._schedule(call, EventType.COMPLETED, now, talk=now - call.answered_at, reason="hangup")
            else:
                self._schedule(call, EventType.CANCELLED, now, reason="hangup")
            call.ended = True

    def transfer(self, provider_call_id: str, token: str, agent_ref: str) -> None:
        """Bridge a borrower who is holding after screening to one of our agents.

        Same token twice is a no-op, so a resend after a timeout can't transfer twice.
        """
        with self._lock:
            if self.outage == "down":
                raise ProviderUnavailable(f"{self.name} unavailable")
            call = self._calls.get(provider_call_id)
            if call is None:
                raise ProviderError("unknown call")
            if call.transfer_token == token:
                return
            if self.outage == "timeout" or self._rng.random() < self.profile.timeout_rate:
                self.stats["timeouts"] += 1
                if self._rng.random() < self.profile.timeout_accepted:
                    self._do_transfer(call, token)
                raise ProviderTimeout(f"{self.name} transfer timed out")
            self._do_transfer(call, token)

    def _do_transfer(self, call: _MockCall, token: str) -> None:
        now = self.clock.now()
        if call.transfer_token is not None:
            raise ProviderError("call already transferred")
        if not self._is_holding(call, now):
            raise ProviderError("call is not waiting for a transfer")
        future = {e.event_id for e in call.events if e.occurred_at > now}
        call.events = [e for e in call.events if e.event_id not in future]
        self._outbox = [item for item in self._outbox if item[2].event_id not in future]
        heapq.heapify(self._outbox)
        call.transfer_token = token
        self.stats["transfers"] = self.stats.get("transfers", 0) + 1
        talk = self._rng.uniform(0.5 * self.profile.talk_s, 1.5 * self.profile.talk_s)
        self._schedule(call, EventType.TRANSFERRED, now + 0.5)
        self._schedule(call, EventType.COMPLETED, now + 0.5 + talk, talk=talk)

    @staticmethod
    def _is_holding(call: _MockCall, now: float) -> bool:
        if call.holding_from is None or call.holding_from > now or call.ended:
            return False
        return not any(e.occurred_at <= now and e.type in _FINAL for e in call.events)

    def poll_events(self) -> list[ProviderEvent]:
        with self._lock:
            if self.outage == "down":
                # full outage: webhooks back up and arrive late once it recovers.
                # a "timeout" outage only hits the request API, callbacks still flow
                return []
            now = self.clock.now()
            out = []
            while self._outbox and self._outbox[0][0] <= now:
                out.append(heapq.heappop(self._outbox)[2])
            return out

    def pending_events(self) -> int:
        with self._lock:
            return len(self._outbox)

    # ---- internals -------------------------------------------------------------

    def _create(self, req: DialRequest) -> str:
        p = self.profile
        rng = self._rng
        now = self.clock.now()
        aud = (self.audience(req) if self.audience else None) or {}
        pcid = f"{self.name}-{next(self._ids)}"
        call = _MockCall(pcid, req.token, screening=req.screening)
        self._calls[pcid] = call
        self._by_token[req.token] = pcid

        self._schedule(call, EventType.INITIATED, now + 0.1)
        ring_at = now + rng.uniform(*p.ring_s)
        roll = rng.random()
        if roll < p.drop_rate:
            self._schedule(call, EventType.FAILED, ring_at, reason="network")
        elif roll < p.drop_rate + p.busy_rate:
            self._schedule(call, EventType.BUSY, ring_at, reason="busy")
        else:
            self._schedule(call, EventType.RINGING, ring_at)
            if rng.random() < aud.get("answer_rate", self.answer_rate):
                answer_at = ring_at + rng.uniform(*p.answer_after_s)
                call.answered_at = answer_at
                if req.screening:
                    self._schedule(call, EventType.ANSWERED, answer_at)
                    self._screen(call, answer_at, aud)
                else:
                    # draw order matters for reproducibility: talk time before scheduling
                    willing = aud.get("willing_rate", p.willing_rate)
                    brief = willing < 1 and rng.random() >= willing
                    base = p.brief_talk_s if brief else aud.get("talk_s", p.talk_s)
                    talk = rng.uniform(0.5 * base, 1.5 * base)
                    self._schedule(call, EventType.ANSWERED, answer_at)
                    self._schedule(call, EventType.COMPLETED, answer_at + talk, talk=talk,
                                   reason="not_interested" if brief else None)
            else:
                self._schedule(call, EventType.NO_ANSWER, ring_at + p.no_answer_after_s, reason="no_answer")
        return pcid

    def _screen(self, call: _MockCall, answer_at: float, aud: dict) -> None:
        """Mock bot conversation: pick an outcome and schedule what the bot would report.

        No speech recognition here, just weighted random outcomes from the profile.
        """
        p = self.profile
        rng = self._rng
        failing = aud.get("screen_fail_rate", p.screen_fail_rate)
        willing = aud.get("willing_rate", p.willing_rate)
        done = answer_at + rng.uniform(*p.bot_s)
        roll = rng.random()
        if roll < failing:
            self._schedule(call, EventType.FAILED, done, talk=done - answer_at, reason="screen_failed")
            return
        roll -= failing
        if roll < willing:
            call.holding_from = done
            self._schedule(call, EventType.SCREEN_RESULT, done, reason="willing")
            give_up = done + p.hold_patience_s
            self._schedule(call, EventType.COMPLETED, give_up, talk=give_up - answer_at, reason="caller_hung_up")
            return
        roll -= willing
        result = "unavailable" if roll < aud.get("unavailable_rate", p.unavailable_rate) else "declined"
        self._schedule(call, EventType.SCREEN_RESULT, done, reason=result)
        self._schedule(call, EventType.COMPLETED, done + 3, talk=done + 3 - answer_at, reason="bot_ended")

    def _schedule(self, call: _MockCall, etype: EventType, at: float, talk=None, reason=None) -> None:
        event = ProviderEvent(
            event_id=f"{call.pcid}:{len(call.events) + 1}:{etype.value}",
            provider=self.name,
            provider_call_id=call.pcid,
            dial_token=call.token,
            type=etype,
            occurred_at=at,
            talk_seconds=talk,
            reason=reason,
        )
        call.events.append(event)
        jitter = self.profile.jitter_s
        deliver = at + (self._rng.uniform(0, jitter) if jitter else 0)
        heapq.heappush(self._outbox, (deliver, next(self._seq), event))
        if self.profile.duplicate_rate and self._rng.random() < self.profile.duplicate_rate:
            self.stats["duplicates_sent"] += 1
            again = deliver + self._rng.uniform(0.5, 1.0 + jitter)
            heapq.heappush(self._outbox, (again, next(self._seq), event))


def provider_a(clock: Clock, seed: int | None = None, **overrides) -> MockProvider:
    """Fast and reliable."""
    profile = ProviderProfile(name="A", reject_rate=0.005, ring_s=(1.0, 3.0), answer_after_s=(3.0, 10.0))
    for k, v in overrides.items():
        setattr(profile, k, v)
    return MockProvider(profile, clock, seed)


def provider_b(clock: Clock, seed: int | None = None, **overrides) -> MockProvider:
    """Slower and flaky: timeouts, rejections, duplicate and out-of-order events."""
    profile = ProviderProfile(
        name="B",
        ring_s=(2.0, 6.0),
        answer_after_s=(5.0, 15.0),
        reject_rate=0.03,
        timeout_rate=0.05,
        drop_rate=0.02,
        duplicate_rate=0.15,
        jitter_s=4.0,
    )
    for k, v in overrides.items():
        setattr(profile, k, v)
    return MockProvider(profile, clock, seed)


def make_provider(name: str, clock: Clock, seed: int | None = None, **overrides) -> MockProvider:
    factories = {"A": provider_a, "B": provider_b}
    try:
        return factories[name.upper()](clock, seed, **overrides)
    except KeyError:
        raise ValueError(f"unknown provider {name!r}, expected A or B") from None
