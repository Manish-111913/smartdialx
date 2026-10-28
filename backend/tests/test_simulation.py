import json

import pytest

from smartdialx.main import main
from smartdialx.simulator import Scenario, preset, run


def short(**kw) -> Scenario:
    base = dict(agents=10, borrowers=800, duration_s=900, seed=3)
    base.update(kw)
    return Scenario(**base)


def test_progressive_never_abandons():
    r = run(short(mode="progressive", answer_rate=0.7, talk_s=60))
    assert r.metrics["calls_abandoned"] == 0
    assert r.metrics["calls_connected"] > 0
    assert r.invariant_violations == []


def test_predictive_beats_progressive_at_low_answer_rate():
    prog = run(short(mode="progressive", answer_rate=0.2, talk_s=120))
    pred = run(short(mode="predictive", answer_rate=0.2, talk_s=120))
    assert pred.utilization > prog.utilization
    assert pred.metrics["calls_connected"] > prog.metrics["calls_connected"]
    assert pred.metrics["abandon_rate"] <= 0.05
    assert pred.invariant_violations == []


def test_same_seed_same_result():
    a = run(short(mode="predictive", provider="B", answer_rate=0.4))
    b = run(short(mode="predictive", provider="B", answer_rate=0.4))
    assert a.metrics == b.metrics
    assert a.utilization == b.utilization


def test_predictive_starts_progressive_until_it_has_data():
    r = run(short(mode="predictive", answer_rate=0.5, duration_s=300))
    assert r.metrics["safety_reasons"].get("cold_start", 0) > 0


def test_answer_rate_jump_triggers_safety():
    r = run(short(mode="predictive", duration_s=1500, answer_rate=0.15, talk_s=60,
                  schedule=[(800, 0.8, 60)]))
    assert r.metrics["safety_reasons"].get("answer_rate_jump", 0) > 0
    assert r.invariant_violations == []


def test_timeout_outage_holds_agents_then_recovers():
    r = run(short(mode="predictive", provider="B", agents=30, borrowers=3000, answer_rate=0.5,
                  duration_s=1500, outage=(500, 800, "timeout")))
    m = r.metrics
    assert m["provider_requests"].get("timeout", 0) > 0
    assert m["safety_reasons"].get("provider_unhealthy", 0) > 0
    # ambiguous calls were sorted out by asking the provider, not by redialing
    assert m["recovery"].get("adopted", 0) + m["recovery"].get("not_placed", 0) > 0
    after = [row for row in r.timeline if row["t"] > 900]
    assert any(row["talking"] > 0 for row in after)
    assert r.invariant_violations == []


def test_hard_outage_trips_the_breaker_then_resumes():
    r = run(short(mode="progressive", provider="A", agents=20, borrowers=3000, answer_rate=0.5,
                  duration_s=900, outage=(0, 300, "down")))
    m = r.metrics
    assert m["provider_requests"].get("rejected", 0) >= 20
    assert m["safety_reasons"].get("provider_unhealthy", 0) > 0
    # the breaker capped how hard we hammered it: far fewer requests than ticks x agents
    assert m["provider_requests"]["rejected"] < 300
    after = [row for row in r.timeline if row["t"] > 420]
    assert any(row["talking"] > 0 for row in after)
    assert r.invariant_violations == []


def test_agent_drop_is_seen_on_the_next_decision():
    r = run(short(mode="predictive", agents=50, borrowers=3000, duration_s=900, agent_drop=(400, 20)))
    d = r.drop_reaction
    assert d is not None and d["staffed_after"] == 30
    assert d["approved"] <= d["available"] * 3
    assert r.invariant_violations == []


def test_presets_exist_for_assignment_scenarios():
    for name in ("A", "B", "C", "D", "outage", "agent-drop"):
        assert preset(name).name == name
    with pytest.raises(ValueError):
        preset("nope")


def test_report_counts_add_up():
    r = run(short(mode="progressive", answer_rate=0.5))
    m = r.metrics
    assert m["calls_answered"] >= m["calls_connected"] >= m["calls_completed"]
    assert m["calls_initiated"] >= m["calls_answered"]
    assert 0 <= r.utilization <= r.occupancy <= 1


def test_progressive_screening_serves_every_willing_borrower():
    r = run(short(mode="progressive", screening=True, answer_rate=0.5, willing_rate=0.4, unavailable_rate=0.2))
    sc = r.metrics["screening"]
    assert sc["willing"] > 0
    assert sc["no_agent"] == 0 and sc["caller_left_hold"] == 0
    assert sc["declined"] > 0
    assert r.metrics["calls_abandoned"] == 0
    assert r.invariant_violations == []


def test_predictive_screening_reports_funnel_and_stays_consistent():
    r = run(short(mode="predictive", screening=True, answer_rate=0.3, willing_rate=0.35, unavailable_rate=0.25,
                  screen_fail_rate=0.03, duration_s=1200))
    sc = r.metrics["screening"]
    assert sc["attempted"] >= sc["answered"] >= sc["willing"] >= sc["agent_connections"] > 0
    assert sc["willing"] + sc["unavailable"] + sc["declined"] + sc["screen_failed"] <= sc["answered"]
    assert r.metrics["agent_conversations"] == sc["agent_connections"]
    assert r.invariant_violations == []


def test_screening_beats_plain_predictive_on_productive_time():
    population = dict(willing_rate=0.35, unavailable_rate=0.25, screen_fail_rate=0.03, answer_rate=0.2, talk_s=120)
    plain = run(short(mode="predictive", duration_s=1200, **population))
    screened = run(short(mode="predictive", screening=True, duration_s=1200, **population))
    assert screened.productive_utilization > plain.productive_utilization
    assert screened.invariant_violations == [] and plain.invariant_violations == []


def test_cli_simulate_screening(capsys):
    code = main(["simulate", "--mode", "progressive", "--screening", "--agents", "5", "--calls", "300",
                 "--duration", "300"])
    out = capsys.readouterr().out
    assert code == 0
    assert "screening=on (mock bot)" in out and "connected to an agent" in out


def test_cli_simulate_text(capsys):
    code = main(["simulate", "--mode", "predictive", "--answer-rate", "0.5", "--agents", "5",
                 "--calls", "200", "--duration", "300"])
    out = capsys.readouterr().out
    assert code == 0
    assert "agent utilization" in out and "invariant violations" in out


def test_cli_simulate_json(capsys):
    main(["simulate", "--scenario", "B", "--duration", "300", "--agents", "5", "--json"])
    data = json.loads(capsys.readouterr().out)
    assert data["scenario"]["answer_rate"] == 0.5
    assert "metrics" in data and data["invariant_violations"] == []
