import sqlite3
import threading

import pytest

from smartdialx.config import Settings
from smartdialx.db import Database
from smartdialx.models import AgentState, CallState, EventType
from smartdialx.repository import Repository
from smartdialx.stats import check_invariants


def test_schema_init_is_repeatable(db):
    db.init_schema()
    db.init_schema()


def test_wal_mode_is_on(db):
    assert db.conn().execute("PRAGMA journal_mode").fetchone()[0] == "wal"


def test_reserve_bound_takes_agent_and_borrower_together(repo, make_world):
    w = make_world(agents=2, borrowers=3)
    res = repo.reserve_bound(w.campaign, "w1", "A")
    agent = repo.get_agent(res.agent_id)
    call = repo.get_call(res.call_id)
    assert agent["state"] == "RESERVED" and agent["current_call_id"] == res.call_id
    assert call["state"] == "RESERVED" and call["agent_id"] == res.agent_id
    assert call["worker_id"] == "w1" and call["lease_expires_at"] > w.clock.now()


def test_no_free_agent_means_nothing_reserved(repo, make_world):
    w = make_world(agents=1, borrowers=2)
    assert repo.reserve_bound(w.campaign, "w1", "A") is not None
    assert repo.reserve_bound(w.campaign, "w1", "A") is None
    queued = repo.db.conn().execute("SELECT COUNT(*) FROM calls WHERE state = 'QUEUED'").fetchone()[0]
    assert queued == 1


def test_no_borrower_rolls_back_agent(repo, make_world):
    w = make_world(agents=2, borrowers=1)
    repo.reserve_bound(w.campaign, "w1", "A")
    assert repo.reserve_bound(w.campaign, "w1", "A") is None
    states = sorted(repo.get_agent(a)["state"] for a in w.agent_ids)
    assert states == ["AVAILABLE", "RESERVED"]


def test_release_puts_everything_back(repo, make_world):
    w = make_world(agents=1, borrowers=1)
    res = repo.reserve_bound(w.campaign, "w1", "A")
    assert repo.release(res, "test")
    assert repo.get_call(res.call_id)["state"] == "QUEUED"
    assert repo.get_agent(res.agent_id)["state"] == "AVAILABLE"
    assert not repo.release(res, "again")


def test_mark_sending_refuses_if_agent_left(repo, make_world):
    w = make_world(agents=1, borrowers=1)
    res = repo.reserve_bound(w.campaign, "w1", "A")
    repo.set_agent_state(res.agent_id, AgentState.OFFLINE)
    assert repo.get_call(res.call_id)["state"] == "QUEUED"
    assert not repo.mark_sending(res)
    assert repo.get_agent(res.agent_id)["state"] == "OFFLINE"


def test_database_rejects_second_live_call_for_borrower(repo, make_world):
    make_world(agents=1, borrowers=1)
    with pytest.raises(sqlite3.IntegrityError):
        with repo.db.transaction() as conn:
            conn.execute(
                "INSERT INTO calls (campaign_id, borrower_id, state, created_at, updated_at)"
                " VALUES (1, 1, 'QUEUED', 0, 0)"
            )


def test_database_rejects_second_live_call_for_agent(repo, make_world):
    w = make_world(agents=1, borrowers=2)
    repo.reserve_bound(w.campaign, "w1", "A")
    with pytest.raises(sqlite3.IntegrityError):
        with repo.db.transaction() as conn:
            conn.execute("UPDATE calls SET state = 'RESERVED', agent_id = 1 WHERE state = 'QUEUED'")


def _race(db_path, clock, campaign, threads, attempts_each, bound=True):
    barrier = threading.Barrier(threads)
    wins: list[tuple[int, int | None]] = []
    lock = threading.Lock()
    errors = []

    def worker(i):
        repo = Repository(Database(db_path), clock, Settings())
        try:
            barrier.wait()
            for _ in range(attempts_each):
                res = (repo.reserve_bound if bound else repo.reserve_unbound)(campaign, f"w{i}", "A")
                if res is None:
                    break
                with lock:
                    wins.append((res.call_id, res.agent_id))
        except Exception as e:  # pragma: no cover - surfaced below
            errors.append(e)
        finally:
            repo.db.close()

    ts = [threading.Thread(target=worker, args=(i,)) for i in range(threads)]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    assert not errors, errors
    return wins


def test_many_workers_one_agent_only_one_wins(repo, make_world, db_path):
    w = make_world(agents=1, borrowers=50)
    wins = _race(db_path, w.clock, w.campaign, threads=16, attempts_each=1)
    assert len(wins) == 1
    assert check_invariants(repo.db) == []


def test_many_workers_many_agents_no_double_booking(repo, make_world, db_path):
    w = make_world(agents=10, borrowers=200)
    wins = _race(db_path, w.clock, w.campaign, threads=20, attempts_each=5)
    agents = [a for _, a in wins]
    calls = [c for c, _ in wins]
    assert len(wins) == 10
    assert len(set(agents)) == 10
    assert len(set(calls)) == 10
    assert check_invariants(repo.db) == []


def test_unbound_reservation_needs_a_free_agent(repo, make_world):
    w = make_world(agents=0, borrowers=5)
    assert repo.reserve_unbound(w.campaign, "w1", "A") is None


def test_unbound_reservation_respects_overdial_cap(repo, make_world):
    w = make_world(agents=2, borrowers=50)
    got = [repo.reserve_unbound(w.campaign, "w1", "A") for _ in range(10)]
    assert sum(r is not None for r in got) == 2 * 3


def test_many_workers_unbound_each_borrower_once(repo, make_world, db_path):
    w = make_world(agents=20, borrowers=60)
    wins = _race(db_path, w.clock, w.campaign, threads=12, attempts_each=100, bound=False)
    calls = [c for c, _ in wins]
    assert len(calls) == 60
    assert len(set(calls)) == 60


def test_agent_logging_off_mid_ring_cancels_and_queues_retry(world):
    call = world.start_call()
    world.send(call, EventType.RINGING)
    hangups = world.repo.set_agent_state(1, AgentState.OFFLINE)
    assert [h.call_id for h in hangups] == [call["id"]]
    assert world.call(call["id"])["state"] == "CANCELLED"
    assert world.call(call["id"])["end_reason"] == "agent_left"
    retry = world.db.conn().execute("SELECT state, attempt FROM calls WHERE borrower_id = 1 AND id != ?",
                                    (call["id"],)).fetchone()
    assert (retry["state"], retry["attempt"]) == ("QUEUED", 2)


def test_failed_call_is_retried_until_attempts_run_out(make_world):
    w = make_world(agents=1, borrowers=1, answer_rate=0.0)
    for attempt in range(1, 4):
        call = w.start_call()
        assert call["attempt"] == attempt
        w.send(call, EventType.NO_ANSWER)
        w.clock.advance(w.repo.settings.timeouts.retry_delay_s + 1)
    assert w.repo.reserve_bound(w.campaign, "x", "A") is None
    outcome = w.db.conn().execute("SELECT outcome, attempts FROM borrowers WHERE id = 1").fetchone()
    assert outcome["outcome"] == "exhausted:no_answer"
    assert outcome["attempts"] == 3


def test_retry_waits_for_not_before(make_world):
    w = make_world(agents=1, borrowers=1, answer_rate=0.0)
    call = w.start_call()
    w.send(call, EventType.BUSY)
    assert w.repo.reserve_bound(w.campaign, "x", "A") is None
    w.clock.advance(61)
    assert w.repo.reserve_bound(w.campaign, "x", "A") is not None


def test_wrap_up_expires_to_available(world):
    call = world.start_call()
    world.send(call, EventType.ANSWERED)
    world.send(call, EventType.COMPLETED, talk=30)
    assert world.agent()["state"] == "WRAP_UP"
    assert world.repo.expire_wrap_ups() == 0
    world.clock.advance(world.repo.settings.timeouts.wrap_up_s + 1)
    assert world.repo.expire_wrap_ups() == 1
    assert world.agent()["state"] == "AVAILABLE"


def test_invalid_operator_transition_changes_nothing(world):
    world.start_call()
    from smartdialx.state_machine import InvalidTransition
    with pytest.raises(InvalidTransition):
        world.repo.set_agent_state(1, AgentState.PAUSED)  # can't pause mid-dial
    assert world.agent()["state"] == "DIALING"
    assert world.call(1)["state"] == CallState.INITIATED
