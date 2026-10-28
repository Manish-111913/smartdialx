from smartdialx.allocator import AllocationResult
from smartdialx.events import SimulatedCrash
from smartdialx.models import EventType
from smartdialx.stats import check_invariants


def crash_at(name):
    def fail(point):
        if point == name:
            raise SimulatedCrash(point)
    return fail


def dial_and_crash(w, point):
    w.allocator.fail_point = crash_at(point)
    res = w.repo.reserve_bound(w.campaign, "dead-worker", "A")
    try:
        w.allocator.dial(res, AllocationResult())
    except SimulatedCrash:
        pass
    w.allocator.fail_point = None
    return res


def expire_lease(w):
    w.clock.advance(w.repo.settings.timeouts.lease_s + 1)


def test_live_lease_is_left_alone(world):
    res = dial_and_crash(world, "after_reserve")
    report = world.recovery.sweep()
    assert report.actions == []
    assert world.call(res.call_id)["state"] == "RESERVED"


def test_crash_after_reserve_releases_everything(world):
    res = dial_and_crash(world, "after_reserve")
    expire_lease(world)
    report = world.recovery.sweep()
    assert report.count("released") == 1
    assert world.call(res.call_id)["state"] == "QUEUED"
    assert world.agent()["state"] == "AVAILABLE"
    assert world.provider.stats["initiate"] == 0


def test_crash_after_sending_but_request_never_arrived(world):
    res = dial_and_crash(world, "after_sending")
    expire_lease(world)
    report = world.recovery.sweep()
    assert report.count("not_placed") == 1
    call = world.call(res.call_id)
    assert (call["state"], call["end_reason"]) == ("FAILED", "not_placed")
    assert world.agent()["state"] == "AVAILABLE"
    retries = world.db.conn().execute("SELECT COUNT(*) FROM calls WHERE state = 'QUEUED'").fetchone()[0]
    assert retries == 1


def test_crash_after_provider_accepted_is_adopted_not_redialed(world):
    res = dial_and_crash(world, "after_initiate")
    assert world.call(res.call_id)["initiation"] == "SENDING"
    expire_lease(world)
    report = world.recovery.sweep()
    assert report.count("adopted") == 1
    assert world.call(res.call_id)["state"] == "INITIATED"
    assert world.agent()["state"] == "DIALING"
    assert world.provider.stats["initiate"] == 1
    # the call then finishes normally from provider events
    world.pump(400)
    assert world.call(res.call_id)["state"] == "COMPLETED"
    assert check_invariants(world.db) == []


def test_ambiguous_timeout_waits_out_the_outage(make_world):
    w = make_world(agents=1, borrowers=1, timeout_accepted=1.0)
    w.provider.set_outage("timeout")
    res = w.repo.reserve_bound(w.campaign, "w", "A")
    w.allocator.dial(res, AllocationResult())
    expire_lease(w)
    report = w.recovery.sweep()
    assert report.deferred == 1 and report.actions == []
    assert w.agent()["state"] == "DIALING"  # still held, the call might be ringing
    w.provider.set_outage(None)
    assert w.recovery.sweep().count("adopted") == 1


def test_gives_up_after_long_outage(make_world):
    w = make_world(agents=1, borrowers=1, timeout_accepted=0.0)
    w.provider.set_outage("timeout")
    res = w.repo.reserve_bound(w.campaign, "w", "A")
    w.allocator.dial(res, AllocationResult())
    w.clock.advance(w.repo.settings.timeouts.ambiguous_give_up_s + 1)
    report = w.recovery.sweep()
    assert report.count("gave_up") == 1
    assert w.call(res.call_id)["end_reason"] == "unreconciled"
    assert w.agent()["state"] == "AVAILABLE"


def test_stuck_call_is_reconciled_from_provider(world):
    call = world.start_call()
    # events get lost: advance past the end of the call without polling
    world.clock.advance(400)
    world.provider._outbox.clear()
    report = world.recovery.sweep()
    assert report.count("reconciled") == 1
    assert world.call(call["id"])["state"] == "COMPLETED"
    assert world.agent()["state"] == "WRAP_UP"


def test_orphan_agent_is_freed(world):
    call = world.start_call()
    world.send(call, EventType.NO_ANSWER)
    with world.db.transaction() as conn:  # simulate a bug leaving the agent stuck
        conn.execute("UPDATE agents SET state = 'DIALING', current_call_id = ? WHERE id = 1", (call["id"],))
    report = world.recovery.sweep()
    assert report.count("agent_freed") == 1
    assert world.agent()["state"] == "AVAILABLE"


def test_recovery_is_idempotent(world):
    dial_and_crash(world, "after_reserve")
    expire_lease(world)
    first = world.recovery.sweep()
    second = world.recovery.sweep()
    assert first.count("released") == 1
    assert second.actions == []


def test_dead_worker_is_marked(world):
    world.repo.heartbeat("w-old")
    world.clock.advance(31)
    report = world.recovery.sweep()
    assert report.count("worker_dead") == 1
    status = world.db.conn().execute("SELECT status FROM workers WHERE id = 'w-old'").fetchone()[0]
    assert status == "DEAD"


def test_recovery_actions_are_logged(world):
    dial_and_crash(world, "after_reserve")
    expire_lease(world)
    world.recovery.sweep()
    rows = world.db.conn().execute("SELECT action FROM recovery_log").fetchall()
    assert [r[0] for r in rows] == ["released"]
