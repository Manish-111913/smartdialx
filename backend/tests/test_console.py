"""Live console engine: seeding, operator actions, faults, settings."""

import pytest

from smartdialx.console import AUDIENCES, Console
from smartdialx.models import AgentState, CampaignStatus
from smartdialx.stats import check_invariants


@pytest.fixture
def console(tmp_path):
    c = Console(str(tmp_path / "console.db"), history_s=0)
    yield c
    c.close()


def run(c: Console, seconds: int) -> None:
    for _ in range(seconds):
        c.step()


def agent_by_state(c: Console, *states: str):
    marks = ", ".join("?" * len(states))
    return c.db.conn().execute(f"SELECT * FROM agents WHERE state IN ({marks}) ORDER BY id", states).fetchone()


def test_seeded_world_dials_without_breaking_invariants(console):
    conn = console.db.conn()
    assert conn.execute("SELECT COUNT(*) FROM agents").fetchone()[0] == 12
    assert conn.execute("SELECT COUNT(*) FROM campaigns").fetchone()[0] == 4
    run(console, 300)
    assert conn.execute("SELECT COUNT(*) FROM calls WHERE sending_at IS NOT NULL").fetchone()[0] > 20
    assert conn.execute("SELECT COUNT(*) FROM calls WHERE connected_at IS NOT NULL").fetchone()[0] > 0
    assert conn.execute("SELECT COUNT(*) FROM agent_samples").fetchone()[0] >= 50
    assert check_invariants(console.db) == []
    assert console.errors == 0


def test_busy_agent_cannot_be_paused_directly(console):
    run(console, 60)
    busy = agent_by_state(console, "CONNECTED", "DIALING", "RESERVED")
    assert busy is not None
    with pytest.raises(ValueError):
        console.set_agent_state(busy["id"], "PAUSED")
    assert console.repo.get_agent(busy["id"])["state"] == busy["state"]


def test_pause_after_call_waits_for_the_call_to_end(console):
    run(console, 60)
    busy = agent_by_state(console, "CONNECTED")
    assert busy is not None
    console.request_pause(busy["id"], True)
    console.step()
    assert console.repo.get_agent(busy["id"])["state"] in ("CONNECTED", "PAUSED", "WRAP_UP")
    for _ in range(400):
        console.step()
        if console.repo.get_agent(busy["id"])["state"] == "PAUSED":
            break
    agent = console.repo.get_agent(busy["id"])
    assert agent["state"] == "PAUSED"
    assert agent["pause_requested"] == 0
    assert check_invariants(console.db) == []


def test_stopping_a_campaign_cancels_its_queue_and_is_final(console):
    cid = console.create_campaign({"name": "Short run", "borrowers": 20, "status": "PAUSED"})
    console.set_campaign_status(cid, "STOPPED")
    queued = console.db.conn().execute(
        "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND state = 'QUEUED'", (cid,)
    ).fetchone()[0]
    assert queued == 0
    with pytest.raises(ValueError):
        console.set_campaign_status(cid, "RUNNING")


def test_campaign_validation(console):
    with pytest.raises(ValueError):
        console.create_campaign({"name": "", "borrowers": 10})
    with pytest.raises(ValueError):
        console.create_campaign({"name": "x", "borrowers": 0})
    with pytest.raises(ValueError):
        console.create_campaign({"name": "x", "borrowers": 10, "provider": "C"})
    with pytest.raises(ValueError):
        console.create_campaign({"name": "x", "borrowers": 10, "audience": "everyone"})


def test_campaign_hold_time_overrides_the_global_setting(console):
    cid = console.create_campaign({"name": "Patient", "borrowers": 1, "screening": True, "hold_s": 90,
                                   "status": "PAUSED"})
    repo = console.repo
    with console.db.transaction() as conn:
        conn.execute("UPDATE calls SET state = 'SCREENING', sending_at = 1 WHERE campaign_id = ?", (cid,))
        call = conn.execute("SELECT * FROM calls WHERE campaign_id = ?", (cid,)).fetchone()
        repo.screened_willing(conn, call)
    call = repo.get_call(call["id"])
    assert call["hold_until"] - call["transfer_requested_at"] == pytest.approx(90)


def test_campaign_overrides_can_go_back_to_the_global_setting(console):
    cid = console.create_campaign({"name": "Custom", "borrowers": 1, "screening": True, "hold_s": 90,
                                   "no_agent_policy": "end", "status": "PAUSED"})
    console.update_campaign(cid, {"hold_s": None, "no_agent_policy": None})
    row = console.db.conn().execute("SELECT hold_s, no_agent_policy FROM campaigns WHERE id = ?", (cid,)).fetchone()
    assert row["hold_s"] is None and row["no_agent_policy"] is None


def test_campaign_audience_reaches_the_provider(console):
    AUDIENCES["nobody_home"] = {"label": "test", "answer_rate": 0.0}
    try:
        for row in console.db.conn().execute("SELECT id FROM campaigns"):
            console.set_campaign_status(row["id"], "PAUSED")
        cid = console.create_campaign({"name": "Empty", "borrowers": 30, "audience": "nobody_home"})
        run(console, 120)
        answered = console.db.conn().execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND answered_at IS NOT NULL", (cid,)
        ).fetchone()[0]
        started = console.db.conn().execute(
            "SELECT COUNT(*) FROM calls WHERE campaign_id = ? AND sending_at IS NOT NULL", (cid,)
        ).fetchone()[0]
        assert started > 0
        assert answered == 0
    finally:
        AUDIENCES.pop("nobody_home")


def test_fault_is_applied_and_expires(console):
    console.set_fault("B", "outage", duration_s=30)
    assert console.providers["B"].outage == "down"
    assert console.faults["B"]["kind"] == "outage"
    run(console, 31)
    assert console.providers["B"].outage is None
    assert "B" not in console.faults
    actions = [r[0] for r in console.db.conn().execute("SELECT action FROM audit_log WHERE subject = 'provider:B'")]
    assert actions == ["fault_started", "fault_cleared"]


def test_latency_fault_restores_the_baseline_profile(console):
    before = console.providers["A"].profile.ring_s
    console.set_fault("A", "latency")
    assert console.providers["A"].profile.ring_s[1] > before[1]
    console.set_fault("A", "normal")
    assert console.providers["A"].profile.ring_s == before


def test_settings_update_is_validated_and_used(console):
    console.update_settings({"safety": {"max_active_calls": 7}})
    assert console.settings.safety.max_active_calls == 7
    assert console.dialer.safety.limits.max_active_calls == 7
    with pytest.raises(ValueError):
        console.update_settings({"safety": {"max_overdial_ratio": 0.5}})
    with pytest.raises(ValueError):
        console.update_settings({"safety": {"max_active_calls": 2.5}})
    with pytest.raises(ValueError):
        console.update_settings({"nonsense": {"x": 1}})
    console.update_settings({"safety": {"max_calls_per_campaign": 100}})
    console.update_settings({"safety": {"max_calls_per_campaign": None}})
    assert console.settings.safety.max_calls_per_campaign is None
    assert console.reset_settings().safety.max_active_calls == 500


def test_add_agent_rejects_duplicates(console):
    agent_id = console.add_agent("New Person")
    assert console.repo.get_agent(agent_id)["state"] == AgentState.AVAILABLE
    with pytest.raises(ValueError):
        console.add_agent("New Person")
    with pytest.raises(ValueError):
        console.add_agent("  ")


def test_reset_seeds_a_fresh_world_in_the_same_file(console):
    run(console, 30)
    console.add_agent("Extra Person")
    other = console.db.conn()  # an open connection, like a request thread would have
    console.reset()
    console.stop()
    conn = console.db.conn()
    assert conn.execute("SELECT COUNT(*) FROM agents").fetchone()[0] == 12
    assert conn.execute("SELECT COUNT(*) FROM agents WHERE name = 'Extra Person'").fetchone()[0] == 0
    assert other.execute("SELECT COUNT(*) FROM campaigns").fetchone()[0] == 4


def test_duplicate_campaign_starts_paused(console):
    new_id = console.duplicate_campaign(1)
    campaign = console.repo.get_campaign(new_id)
    assert campaign.status == CampaignStatus.PAUSED
    assert campaign.name.endswith("(copy)")
