"""The real Worker thread loop, with real time and several workers at once."""

import time

import pytest

from smartdialx.clock import SystemClock
from smartdialx.config import ScreeningSettings, Settings, Timeouts
from smartdialx.db import Database
from smartdialx.providers import provider_a
from smartdialx.repository import Repository
from smartdialx.stats import campaign_metrics, check_invariants
from smartdialx.worker import Worker

FAST = dict(ring_s=(0.01, 0.03), answer_after_s=(0.01, 0.03), no_answer_after_s=0.05, talk_s=0.05,
            reject_rate=0.0, bot_s=(0.01, 0.02), hold_patience_s=5.0)


@pytest.mark.parametrize("mode,screening", [("progressive", False), ("predictive", False), ("progressive", True)])
def test_workers_run_a_campaign_to_the_end(db_path, mode, screening):
    clock = SystemClock()
    settings = Settings(timeouts=Timeouts(wrap_up_s=0.0, retry_delay_s=0.0),
                        screening=ScreeningSettings(unavailable_retry_s=0.0, callback_delay_s=0.0))
    db = Database(db_path)
    db.init_schema()
    repo = Repository(db, clock, settings)
    campaign = repo.create_campaign("live", mode, "A", screening=screening)
    repo.add_agents(5)
    repo.add_borrowers(campaign, 60)
    extra = {"willing_rate": 0.5, "unavailable_rate": 0.2} if screening else {}
    providers = {"A": provider_a(clock, seed=4, answer_rate=0.6, **FAST, **extra)}

    workers = [Worker(Database(db_path), clock, providers, campaign, settings, interval_s=0.005) for _ in range(3)]
    for w in workers:
        w.start()
    deadline = time.time() + 20
    while time.time() < deadline:
        open_calls = db.conn().execute(
            "SELECT COUNT(*) FROM calls WHERE state NOT IN ('COMPLETED', 'FAILED', 'CANCELLED', 'ABANDONED')"
        ).fetchone()[0]
        if open_calls == 0:
            break
        time.sleep(0.05)
    for w in workers:
        w.stop()
    for w in workers:
        w.join(timeout=5)

    assert all(w.errors == 0 for w in workers)
    assert open_calls == 0, "campaign didn't finish in time"
    assert check_invariants(db) == []
    m = campaign_metrics(db, campaign)
    assert m["agent_conversations"] > 0
    statuses = {r[0] for r in db.conn().execute("SELECT status FROM workers")}
    assert statuses == {"STOPPED"}
    db.close()
