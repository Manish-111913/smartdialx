import pytest

from smartdialx.events import SimulatedCrash
from smartdialx.models import AgentState, EventType, ProviderEvent
from smartdialx.stats import check_invariants


def count_transitions(world, call_id):
    return world.db.conn().execute(
        "SELECT COUNT(*) FROM provider_events WHERE call_id = ? AND outcome = 'applied'", (call_id,)
    ).fetchone()[0]


def test_same_event_three_times_applies_once(world):
    call = world.start_call()
    outcomes = [world.send(call, EventType.ANSWERED, event_id="ev-1").outcome for _ in range(3)]
    assert outcomes == ["applied", "duplicate", "duplicate"]
    row = world.db.conn().execute("SELECT deliveries FROM provider_events WHERE event_id = 'ev-1'").fetchone()
    assert row["deliveries"] == 3
    assert count_transitions(world, call["id"]) == 1


def test_answered_answered_answered_completed(world):
    call = world.start_call()
    outcomes = [world.send(call, EventType.ANSWERED, event_id=f"a{i}").outcome for i in range(3)]
    assert outcomes == ["applied", "stale", "stale"]
    assert world.call(call["id"])["state"] == "CONNECTED"
    assert world.send(call, EventType.COMPLETED, talk=50).outcome == "applied"
    final = world.call(call["id"])
    assert final["state"] == "COMPLETED" and final["talk_seconds"] == 50
    assert world.agent()["state"] == "WRAP_UP"
    assert check_invariants(world.db) == []


def test_completed_answered_ringing(world):
    call = world.start_call()
    assert world.send(call, EventType.COMPLETED, talk=20).outcome == "applied"
    assert world.send(call, EventType.ANSWERED).outcome == "late"
    assert world.send(call, EventType.RINGING).outcome == "late"
    assert world.call(call["id"])["state"] == "COMPLETED"
    assert world.agent()["state"] == "WRAP_UP"
    assert check_invariants(world.db) == []


def test_ringing_after_answered_is_stale(world):
    call = world.start_call()
    world.send(call, EventType.ANSWERED)
    assert world.send(call, EventType.RINGING).outcome == "stale"
    assert world.call(call["id"])["state"] == "CONNECTED"


def test_crash_after_store_is_picked_up_later(world):
    call = world.start_call()

    def crash(point):
        if point == "after_store":
            raise SimulatedCrash(point)

    world.events.fail_point = crash
    with pytest.raises(SimulatedCrash):
        world.send(call, EventType.ANSWERED, event_id="ans")
    world.events.fail_point = None
    assert world.call(call["id"])["state"] == "INITIATED"

    results = world.events.process_pending()
    assert [r.outcome for r in results] == ["applied"]
    assert world.call(call["id"])["state"] == "CONNECTED"
    assert world.events.process_pending() == []


def test_crash_before_commit_rolls_back_and_replays_once(world):
    call = world.start_call()

    def crash(point):
        if point == "before_commit":
            raise SimulatedCrash(point)

    world.events.fail_point = crash
    with pytest.raises(SimulatedCrash):
        world.send(call, EventType.ANSWERED, event_id="ans")
    world.events.fail_point = None
    # the state change rolled back together with processed_at
    assert world.call(call["id"])["state"] == "INITIATED"
    assert world.agent()["state"] == "DIALING"
    world.events.process_pending()
    assert world.call(call["id"])["state"] == "CONNECTED"
    assert count_transitions(world, call["id"]) == 1


def test_answered_then_crash_then_completed(world):
    call = world.start_call()

    def crash(point):
        if point == "after_store":
            raise SimulatedCrash(point)

    world.events.fail_point = crash
    with pytest.raises(SimulatedCrash):
        world.send(call, EventType.ANSWERED, event_id="ans")
    world.events.fail_point = None
    world.send(call, EventType.COMPLETED, talk=60)
    assert [r.outcome for r in world.events.process_pending()] == ["late"]
    assert world.call(call["id"])["state"] == "COMPLETED"
    assert world.agent()["state"] == "WRAP_UP"
    assert check_invariants(world.db) == []


def test_event_can_beat_our_own_accepted_write(world):
    res = world.repo.reserve_bound(world.campaign, "w", "A")
    world.repo.mark_sending(res)
    event = ProviderEvent("early-1", "A", "A-99", res.token, EventType.RINGING, world.clock.now())
    assert world.events.handle(event).outcome == "applied"
    call = world.call(res.call_id)
    assert call["state"] == "RINGING" and call["provider_call_id"] == "A-99"
    # the worker's late write still succeeds without moving the call backwards
    assert world.repo.mark_accepted(res, "A-99")
    assert world.call(res.call_id)["state"] == "RINGING"


def test_orphan_event_is_recorded_not_applied(world):
    event = ProviderEvent("ghost", "A", "A-404", "no-such-token", EventType.ANSWERED, 0)
    assert world.events.handle(event).outcome == "orphan"


def test_unbound_answer_claims_free_agent(make_world):
    w = make_world(agents=1, borrowers=1, mode="predictive")
    call = w.start_call(bound=False)
    assert call["agent_id"] is None
    w.send(call, EventType.ANSWERED)
    connected = w.call(call["id"])
    assert connected["state"] == "CONNECTED" and connected["agent_id"] == 1
    assert w.agent()["state"] == "CONNECTED"


def test_unbound_answer_with_no_agent_is_abandoned_and_hung_up(make_world):
    w = make_world(agents=1, borrowers=1, mode="predictive")
    call = w.start_call(bound=False)
    w.repo.set_agent_state(1, AgentState.PAUSED)  # the only agent steps away while it rings
    result = w.send(call, EventType.ANSWERED)
    assert "abandoned" in result.note
    assert w.call(call["id"])["state"] == "ABANDONED"
    assert w.provider.stats["hangups"] == 1
    assert w.db.conn().execute("SELECT outcome FROM borrowers").fetchone()[0] == "abandoned"


def test_answer_can_pull_agent_finishing_wrap_up(make_world):
    w = make_world(agents=2, borrowers=2, mode="predictive")
    first = w.start_call()
    w.send(first, EventType.ANSWERED)
    w.send(first, EventType.COMPLETED, talk=10)
    assert w.agent(1)["state"] == "WRAP_UP"
    w.clock.advance(w.repo.settings.timeouts.wrap_up_s - 2)  # 2s of wrap-up left
    second = w.start_call(bound=False)
    w.repo.set_agent_state(2, AgentState.PAUSED)  # nobody AVAILABLE when it's answered
    w.send(second, EventType.ANSWERED)
    connected = w.call(second["id"])
    assert connected["state"] == "CONNECTED" and connected["agent_id"] == 1


def test_late_answer_after_cancel_hangs_up(world):
    call = world.start_call()
    world.send(call, EventType.RINGING)
    world.repo.set_agent_state(1, AgentState.OFFLINE)
    hangups_before = world.provider.stats["hangups"]
    result = world.send(call, EventType.ANSWERED)
    assert result.outcome == "late"
    assert world.provider.stats["hangups"] == hangups_before + 1


def test_late_event_does_not_bring_offline_agent_back(world):
    call = world.start_call()
    world.send(call, EventType.RINGING)
    world.repo.set_agent_state(1, AgentState.OFFLINE)
    world.send(call, EventType.NO_ANSWER)
    world.send(call, EventType.COMPLETED)
    assert world.agent()["state"] == "OFFLINE"
    assert check_invariants(world.db) == []


def test_full_lifecycle_from_provider_events(world):
    call = world.start_call()
    world.pump(400)
    final = world.call(call["id"])
    assert final["state"] == "COMPLETED"
    assert final["answered_at"] and final["connected_at"] and final["ended_at"]
