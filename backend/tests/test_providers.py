import pytest

from smartdialx.clock import SimClock
from smartdialx.models import EventType
from smartdialx.providers import (
    DialRequest,
    ProviderError,
    ProviderTimeout,
    ProviderUnavailable,
    make_provider,
    provider_a,
    provider_b,
)


def drain(provider, clock, seconds=400):
    out = []
    for _ in range(seconds):
        clock.advance(1)
        out += provider.poll_events()
    return out


def test_provider_a_full_answered_lifecycle():
    clock = SimClock()
    p = provider_a(clock, seed=3, answer_rate=1.0, reject_rate=0.0, busy_rate=0.0)
    pcid = p.initiate(DialRequest("tok-1", "+1-555-0000001", 1))
    types = [e.type for e in drain(p, clock)]
    assert types == [EventType.INITIATED, EventType.RINGING, EventType.ANSWERED, EventType.COMPLETED]
    assert p.lookup("tok-1").provider_call_id == pcid
    assert p.lookup("tok-1").status == "completed"


def test_no_answer_lifecycle():
    clock = SimClock()
    p = provider_a(clock, seed=3, answer_rate=0.0, reject_rate=0.0, busy_rate=0.0)
    p.initiate(DialRequest("tok-1", "x", 1))
    assert [e.type for e in drain(p, clock)][-1] == EventType.NO_ANSWER


def test_same_seed_same_events():
    def run(seed):
        clock = SimClock()
        p = provider_b(clock, seed=seed)
        for i in range(30):
            try:
                p.initiate(DialRequest(f"t{i}", "x", i))
            except (ProviderError, ProviderTimeout):
                pass
        return [(e.event_id, e.occurred_at) for e in drain(p, clock)]

    assert run(11) == run(11)
    assert run(11) != run(12)


def test_initiate_is_idempotent_on_token():
    clock = SimClock()
    p = provider_a(clock, seed=1, reject_rate=0.0)
    first = p.initiate(DialRequest("same", "x", 1))
    assert p.initiate(DialRequest("same", "x", 1)) == first
    assert len(p._calls) == 1


def test_provider_b_sends_duplicates_and_out_of_order():
    clock = SimClock()
    p = provider_b(clock, seed=5, reject_rate=0.0, timeout_rate=0.0, answer_rate=1.0, duplicate_rate=0.5)
    for i in range(40):
        p.initiate(DialRequest(f"t{i}", "x", i))
    events = drain(p, clock)
    ids = [e.event_id for e in events]
    assert len(ids) > len(set(ids)), "expected duplicate deliveries"

    rank = {EventType.INITIATED: 0, EventType.RINGING: 1, EventType.ANSWERED: 2, EventType.COMPLETED: 3}
    seen: dict[str, int] = {}
    reordered = 0
    for e in events:
        r = rank.get(e.type, 3)
        if seen.get(e.provider_call_id, -1) > r:
            reordered += 1
        seen[e.provider_call_id] = max(seen.get(e.provider_call_id, -1), r)
    assert reordered > 0, "expected some events to arrive out of order"


def test_outage_down_is_a_definite_failure():
    clock = SimClock()
    p = provider_a(clock, seed=1)
    p.set_outage("down")
    with pytest.raises(ProviderUnavailable):
        p.initiate(DialRequest("t", "x", 1))
    with pytest.raises(ProviderUnavailable):
        p.lookup("t")
    p.set_outage(None)
    assert p.lookup("t") is None


def test_timeout_can_still_place_the_call():
    clock = SimClock()
    p = provider_a(clock, seed=1, timeout_accepted=1.0)
    p.set_outage("timeout")
    with pytest.raises(ProviderTimeout):
        p.initiate(DialRequest("t", "x", 1))
    p.set_outage(None)
    assert p.lookup("t") is not None


def test_timeout_without_placing_the_call():
    clock = SimClock()
    p = provider_a(clock, seed=1, timeout_accepted=0.0)
    p.set_outage("timeout")
    with pytest.raises(ProviderTimeout):
        p.initiate(DialRequest("t", "x", 1))
    p.set_outage(None)
    assert p.lookup("t") is None


def test_events_are_held_during_full_outage_and_delivered_after():
    clock = SimClock()
    p = provider_a(clock, seed=1, answer_rate=1.0, reject_rate=0.0, busy_rate=0.0)
    p.initiate(DialRequest("t", "x", 1))
    p.set_outage("down")
    assert drain(p, clock, 50) == []
    p.set_outage(None)
    clock.advance(1)
    assert len(p.poll_events()) >= 3


def test_events_still_flow_when_only_requests_time_out():
    clock = SimClock()
    p = provider_a(clock, seed=1, answer_rate=1.0, reject_rate=0.0, busy_rate=0.0)
    p.initiate(DialRequest("t", "x", 1))
    p.set_outage("timeout")
    assert len(drain(p, clock, 50)) >= 3


def test_hangup_while_ringing_cancels():
    clock = SimClock()
    p = provider_a(clock, seed=1, answer_rate=1.0, reject_rate=0.0, busy_rate=0.0)
    pcid = p.initiate(DialRequest("t", "x", 1))
    clock.advance(0.5)
    p.hangup(pcid)
    types = [e.type for e in drain(p, clock)]
    assert EventType.ANSWERED not in types
    assert types[-1] == EventType.CANCELLED


def test_make_provider_rejects_unknown_name():
    with pytest.raises(ValueError):
        make_provider("Z", SimClock())
