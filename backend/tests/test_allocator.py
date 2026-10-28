import threading

import pytest

from smartdialx.allocator import AllocationResult, NotApproved
from smartdialx.config import Settings
from smartdialx.db import Database
from smartdialx.models import AgentState, Mode, PacingRequest
from smartdialx.providers import provider_a
from smartdialx.repository import Repository
from smartdialx.safety import Action, SafetyDecision
from smartdialx.stats import check_invariants
from smartdialx.worker import Dialer


def live_bound_calls(db):
    return db.conn().execute(
        "SELECT COUNT(*) FROM calls WHERE bound = 1 AND state IN ('RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'CONNECTED')"
    ).fetchone()[0]


def test_fifty_agents_fifty_calls(make_world):
    w = make_world(agents=50, borrowers=200)
    dialer = Dialer(w.repo, w.providers, "w1")
    tick = dialer.tick(w.campaign)
    assert tick.decision.approved == 50
    assert tick.allocation.started == 50
    assert live_bound_calls(w.db) == 50
    assert {w.repo.get_agent(a)["state"] for a in w.agent_ids} == {"DIALING"}
    assert dialer.tick(w.campaign).allocation.started == 0


def test_allocator_refuses_decisions_not_from_safety(make_world):
    w = make_world(agents=5, borrowers=5)
    req = PacingRequest(Mode.PREDICTIVE, 5, bound=False, reasoning="sneaky")
    forged = SafetyDecision(Action.APPROVE, 5, 5, False, Mode.PREDICTIVE, (), req)
    with pytest.raises(NotApproved):
        w.allocator.execute(forged, w.repo.get_campaign(w.campaign))
    assert w.provider.stats["initiate"] == 0


def test_agent_disappears_before_dial(make_world):
    w = make_world(agents=1, borrowers=1)

    def agent_logs_off(point):
        if point == "after_reserve":
            w.repo.set_agent_state(1, AgentState.OFFLINE)

    w.allocator.fail_point = agent_logs_off
    res = w.repo.reserve_bound(w.campaign, "w", "A")
    result = AllocationResult()
    w.allocator.dial(res, result)
    assert result.aborted == 1
    assert w.provider.stats["initiate"] == 0
    assert w.call(res.call_id)["state"] == "QUEUED"
    assert w.agent()["state"] == "OFFLINE"


def test_provider_rejects(make_world):
    w = make_world(agents=1, borrowers=1, reject_rate=1.0)
    res = w.repo.reserve_bound(w.campaign, "w", "A")
    result = AllocationResult()
    w.allocator.dial(res, result)
    assert result.rejected == 1
    call = w.call(res.call_id)
    assert (call["state"], call["end_reason"], call["initiation"]) == ("FAILED", "provider_rejected", "REJECTED")
    assert w.agent()["state"] == "AVAILABLE"
    retry = w.db.conn().execute("SELECT COUNT(*) FROM calls WHERE state = 'QUEUED'").fetchone()[0]
    assert retry == 1


def test_provider_down_counts_as_rejected(make_world):
    w = make_world(agents=1, borrowers=1)
    w.provider.set_outage("down")
    result = AllocationResult()
    w.allocator.dial(w.repo.reserve_bound(w.campaign, "w", "A"), result)
    assert result.rejected == 1
    assert w.agent()["state"] == "AVAILABLE"


def test_timeout_keeps_agent_until_reconciled(make_world):
    w = make_world(agents=1, borrowers=1)
    w.provider.set_outage("timeout")
    res = w.repo.reserve_bound(w.campaign, "w", "A")
    result = AllocationResult()
    w.allocator.dial(res, result)
    assert result.ambiguous == 1
    call = w.call(res.call_id)
    assert (call["state"], call["initiation"]) == ("RESERVED", "UNKNOWN")
    assert w.agent()["state"] == "DIALING"


def test_concurrent_dialers_never_overbook(make_world, db_path):
    w = make_world(agents=20, borrowers=500)
    provider = provider_a(w.clock, seed=2, reject_rate=0.0)
    providers = {"A": provider}
    errors = []
    barrier = threading.Barrier(6)

    def run(i):
        repo = Repository(Database(db_path), w.clock, Settings())
        dialer = Dialer(repo, providers, f"w{i}")
        try:
            barrier.wait()
            for _ in range(5):
                dialer.tick(w.campaign)
        except Exception as e:  # pragma: no cover
            errors.append(e)
        finally:
            repo.db.close()

    threads = [threading.Thread(target=run, args=(i,)) for i in range(6)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not errors, errors
    assert live_bound_calls(w.db) == 20
    assert provider.stats["initiate"] == 20
    assert check_invariants(w.db) == []


def add_history(w, answered=20, total=200):
    """Pretend the campaign already has `total` ring outcomes."""
    with w.db.transaction() as conn:
        conn.execute(
            "WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ?)"
            " INSERT INTO calls (campaign_id, borrower_id, state, ring_result, ring_result_at, created_at, updated_at)"
            " SELECT 1, 1, 'FAILED', CASE WHEN i <= ? THEN 'answered' ELSE 'no_answer' END, i, 0, 0 FROM n",
            (total, answered),
        )


def unbound_in_flight(db):
    return db.conn().execute(
        "SELECT COUNT(*) FROM calls WHERE bound = 0 AND state IN ('RESERVED', 'INITIATED', 'RINGING')"
    ).fetchone()[0]


def test_concurrent_predictive_dialers_share_one_overdial_budget(make_world, db_path):
    w = make_world(agents=5, borrowers=500, mode="predictive", answer_rate=0.0)
    add_history(w, answered=10, total=200)
    errors = []
    barrier = threading.Barrier(6)

    def run(i):
        repo = Repository(Database(db_path), w.clock, Settings())
        try:
            barrier.wait()
            Dialer(repo, w.providers, f"w{i}").tick(w.campaign)
        except Exception as e:  # pragma: no cover
            errors.append(e)
        finally:
            repo.db.close()

    threads = [threading.Thread(target=run, args=(i,)) for i in range(6)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert not errors, errors
    assert unbound_in_flight(w.db) == 5 * 3  # every worker saw headroom 15, together they still only got 15


def test_predictive_tick_respects_overdial_cap(make_world):
    w = make_world(agents=5, borrowers=500, mode="predictive")
    add_history(w, answered=20, total=200)
    tick = Dialer(w.repo, w.providers, "w").tick(w.campaign)
    assert not tick.decision.bound
    assert tick.allocation.started <= 5 * w.repo.settings.safety.max_overdial_ratio
    assert tick.allocation.started > 5
