import threading

import pytest

from smartdialx.allocator import AllocationResult
from smartdialx.config import ScreeningSettings, Settings
from smartdialx.db import Database
from smartdialx.events import SimulatedCrash
from smartdialx.models import AgentState, CampaignStatus, EventType, ProviderEvent
from smartdialx.repository import Repository
from smartdialx.safety import SafetyController
from smartdialx.screening import ScreeningService
from smartdialx.stats import campaign_metrics, check_invariants


class Screen:
    """A screening campaign plus helpers to drive one call by hand."""

    def __init__(self, world):
        self.w = world
        self.repo = world.repo
        self.service = ScreeningService(world.repo, world.providers, SafetyController())

    def dial(self):
        res = self.repo.reserve_screening(self.w.campaign, "w", "A", progressive=True)
        assert res is not None
        self.w.allocator.dial(res, AllocationResult())
        return self.repo.get_call(res.call_id)

    def event(self, call, etype, reason=None, event_id=None, talk=None):
        call = self.repo.get_call(call["id"])
        e = ProviderEvent(event_id or f"{call['provider_call_id']}:{etype}:{reason}", "A",
                          call["provider_call_id"], call["dial_token"], etype, self.w.clock.now(),
                          talk_seconds=talk, reason=reason)
        return self.w.events.handle(e)

    def screened(self, result="willing", call=None):
        """Dial and let the mock bot run until the borrower is on hold."""
        call = call or self.dial()
        for _ in range(60):
            if self.repo.get_call(call["id"])["state"] == "TRANSFER_PENDING":
                break
            self.w.pump(1)
        assert self.repo.get_call(call["id"])["state"] == "TRANSFER_PENDING"
        return self.repo.get_call(call["id"])

    def call(self, call_id):
        return self.repo.get_call(call_id)

    def outcome(self, borrower_id=1):
        return self.w.db.conn().execute("SELECT outcome FROM borrowers WHERE id = ?", (borrower_id,)).fetchone()[0]


def screening_world(make_world, agents=1, borrowers=1, **provider_kw):
    kw = {"willing_rate": 1.0, "bot_s": (5.0, 5.0), "hold_patience_s": 300.0}
    kw.update(provider_kw)
    w = make_world(agents=agents, borrowers=borrowers, **kw)
    with w.db.transaction() as conn:
        conn.execute("UPDATE campaigns SET screening = 1")
    # long hold so stepping the clock in tests doesn't expire it by accident
    w.repo.settings = Settings(screening=ScreeningSettings(hold_s=120))
    return w


@pytest.fixture
def sw(make_world):
    return Screen(screening_world(make_world))


# ---- outcomes ----------------------------------------------------------------

def test_no_answer_never_touches_an_agent(make_world):
    s = Screen(screening_world(make_world, answer_rate=0.0))
    call = s.dial()
    assert s.w.agent()["state"] == "AVAILABLE"   # no agent held while the bot dials
    s.event(call, EventType.NO_ANSWER, "no_answer")
    assert s.call(call["id"])["end_reason"] == "no_answer"
    assert s.w.agent()["state"] == "AVAILABLE"
    assert s.w.db.conn().execute("SELECT COUNT(*) FROM calls WHERE state = 'QUEUED'").fetchone()[0] == 1


def test_busy(sw):
    call = sw.dial()
    sw.event(call, EventType.BUSY, "busy")
    assert sw.call(call["id"])["end_reason"] == "busy"


def test_answered_goes_to_screening_not_to_an_agent(sw):
    call = sw.dial()
    sw.event(call, EventType.ANSWERED)
    assert sw.call(call["id"])["state"] == "SCREENING"
    assert sw.w.agent()["state"] == "AVAILABLE"


def test_unavailable_schedules_a_later_callback(sw):
    call = sw.dial()
    sw.event(call, EventType.ANSWERED)
    sw.event(call, EventType.SCREEN_RESULT, "unavailable")
    done = sw.call(call["id"])
    assert (done["state"], done["end_reason"], done["screen_result"]) == ("COMPLETED", "screen_unavailable", "unavailable")
    retry = sw.w.db.conn().execute("SELECT not_before FROM calls WHERE state = 'QUEUED'").fetchone()
    assert retry["not_before"] >= sw.w.clock.now() + Settings().screening.unavailable_retry_s - 1
    assert sw.w.agent()["state"] == "AVAILABLE"


def test_declined_is_never_transferred_or_called_again(sw):
    call = sw.dial()
    sw.event(call, EventType.ANSWERED)
    sw.event(call, EventType.SCREEN_RESULT, "declined")
    assert sw.call(call["id"])["end_reason"] == "screen_declined"
    assert sw.outcome() == "declined"
    assert sw.w.db.conn().execute("SELECT COUNT(*) FROM calls WHERE state = 'QUEUED'").fetchone()[0] == 0
    report = sw.service.run()
    assert report.sent == 0
    assert sw.w.agent()["state"] == "AVAILABLE"


def test_screen_failure_is_retryable(sw):
    call = sw.dial()
    sw.event(call, EventType.ANSWERED)
    sw.event(call, EventType.SCREEN_RESULT, "failed")
    assert (sw.call(call["id"])["state"], sw.call(call["id"])["end_reason"]) == ("FAILED", "screen_failed")
    assert sw.w.db.conn().execute("SELECT COUNT(*) FROM calls WHERE state = 'QUEUED'").fetchone()[0] == 1


def test_screening_timeout_is_ambiguous_not_redialed(make_world):
    s = Screen(screening_world(make_world, timeout_accepted=1.0))
    s.w.provider.set_outage("timeout")
    res = s.repo.reserve_screening(s.w.campaign, "w", "A", progressive=True)
    s.w.allocator.dial(res, AllocationResult())
    assert s.call(res.call_id)["initiation"] == "UNKNOWN"
    s.w.provider.set_outage(None)
    s.w.clock.advance(31)
    assert s.w.recovery.sweep().count("adopted") == 1
    assert s.w.provider.stats["initiate"] == 1


# ---- willing -> agent -----------------------------------------------------------

def test_willing_with_free_agent_is_connected(sw):
    call = sw.screened("willing")
    assert sw.call(call["id"])["state"] == "TRANSFER_PENDING"
    report = sw.service.run()
    assert report.sent == 1
    assert sw.w.agent()["state"] == "RESERVED"
    sw.w.pump(2)
    done = sw.call(call["id"])
    assert done["state"] == "CONNECTED" and done["agent_id"] == 1
    assert sw.w.agent()["state"] == "CONNECTED"
    sw.w.pump(400)
    assert sw.call(call["id"])["state"] == "COMPLETED"
    assert sw.w.agent()["state"] == "WRAP_UP"
    assert check_invariants(sw.w.db) == []


def test_willing_with_no_agent_ends_politely_and_schedules_callback(make_world):
    s = Screen(screening_world(make_world))
    call = s.screened("willing")
    s.repo.set_agent_state(1, AgentState.PAUSED)
    assert s.service.run().waiting == 1
    assert s.call(call["id"])["state"] == "TRANSFER_PENDING"   # still on hold, not reported as connected
    s.w.clock.advance(s.repo.settings.screening.hold_s + 1)
    report = s.service.run()
    assert report.no_agent == 1 and report.sent == 0
    done = s.call(call["id"])
    assert (done["state"], done["end_reason"], done["connected_at"]) == ("FAILED", "no_agent_transfer", None)
    assert s.w.provider.stats["hangups"] == 1
    retry = s.w.db.conn().execute("SELECT not_before FROM calls WHERE state = 'QUEUED'").fetchone()
    assert retry is not None


def test_no_agent_policy_end_does_not_call_back(make_world, repo):
    s = Screen(screening_world(make_world))
    repo.settings = Settings(screening=ScreeningSettings(hold_s=120, no_agent_policy="end"))
    call = s.screened("willing")
    s.repo.set_agent_state(1, AgentState.PAUSED)
    s.w.clock.advance(repo.settings.screening.hold_s + 1)
    s.service.run()
    assert s.call(call["id"])["end_reason"] == "no_agent_transfer"
    assert s.outcome() == "no_agent_transfer"
    assert s.w.db.conn().execute("SELECT COUNT(*) FROM calls WHERE state = 'QUEUED'").fetchone()[0] == 0


def test_agent_freed_while_holding_gets_the_transfer(make_world):
    s = Screen(screening_world(make_world))
    call = s.screened("willing")
    s.repo.set_agent_state(1, AgentState.PAUSED)
    s.service.run()
    s.repo.set_agent_state(1, AgentState.AVAILABLE)
    assert s.service.run().sent == 1
    s.w.pump(2)
    assert s.call(call["id"])["state"] == "CONNECTED"


def test_borrower_hanging_up_on_hold(make_world):
    s = Screen(screening_world(make_world))
    call = s.screened("willing")
    s.repo.set_agent_state(1, AgentState.PAUSED)
    s.event(call, EventType.COMPLETED, "caller_hung_up", talk=30)
    assert s.call(call["id"])["end_reason"] == "caller_left_hold"


def test_provider_rejecting_transfer_frees_agent_and_keeps_borrower_holding(sw):
    call = sw.screened("willing")
    sw.w.provider._calls[sw.call(call["id"])["provider_call_id"]].holding_from = None  # provider thinks they're gone
    report = sw.service.run()
    assert report.rejected == 1
    assert sw.w.agent()["state"] == "AVAILABLE"
    after = sw.call(call["id"])
    assert after["state"] == "TRANSFER_PENDING" and after["agent_id"] is None


# ---- duplicates and ordering --------------------------------------------------------

def test_duplicate_willing_result_claims_only_one_agent(make_world):
    s = Screen(screening_world(make_world, agents=3))
    call = s.dial()
    s.event(call, EventType.ANSWERED)
    first = s.event(call, EventType.SCREEN_RESULT, "willing", event_id="sr-1")
    again = s.event(call, EventType.SCREEN_RESULT, "willing", event_id="sr-1")
    other_id = s.event(call, EventType.SCREEN_RESULT, "willing", event_id="sr-2")
    assert (first.outcome, again.outcome, other_id.outcome) == ("applied", "duplicate", "stale")
    s.w.pump(20)  # let the mock provider catch up and put the borrower on hold
    s.service.run()
    s.service.run()
    busy = [a for a in s.w.agent_ids if s.w.agent(a)["state"] != "AVAILABLE"]
    assert len(busy) == 1


def test_duplicate_transferred_event(sw):
    call = sw.screened("willing")
    sw.service.run()
    a = sw.event(call, EventType.TRANSFERRED, event_id="tr-1")
    b = sw.event(call, EventType.TRANSFERRED, event_id="tr-1")
    c = sw.event(call, EventType.TRANSFERRED, event_id="tr-2")
    assert (a.outcome, b.outcome, c.outcome) == ("applied", "duplicate", "stale")
    assert sw.call(call["id"])["state"] == "CONNECTED"


def test_screen_result_before_answered(sw):
    call = sw.dial()
    assert sw.event(call, EventType.SCREEN_RESULT, "willing").outcome == "applied"
    assert sw.call(call["id"])["state"] == "TRANSFER_PENDING"
    assert sw.call(call["id"])["answered_at"] is not None
    assert sw.event(call, EventType.ANSWERED).outcome == "stale"
    assert sw.event(call, EventType.RINGING).outcome == "stale"


def test_completed_before_transferred_still_counts_as_connected(sw):
    call = sw.screened("willing")
    sw.service.run()
    sw.event(call, EventType.COMPLETED, event_id="c-1", talk=90)
    done = sw.call(call["id"])
    assert done["state"] == "COMPLETED" and done["connected_at"] is not None
    assert sw.w.agent()["state"] == "WRAP_UP"
    assert sw.event(call, EventType.TRANSFERRED, event_id="t-1").outcome == "late"


def test_late_declined_result_is_still_honoured(sw):
    call = sw.dial()
    sw.event(call, EventType.ANSWERED)
    sw.event(call, EventType.COMPLETED, "bot_ended", talk=10)
    result = sw.event(call, EventType.SCREEN_RESULT, "declined")
    assert result.outcome == "late"
    assert sw.call(call["id"])["screen_result"] == "declined"
    assert sw.outcome() == "declined"


def test_transfer_event_for_unscreened_call_is_invalid(world):
    call = world.start_call()
    assert world.send(call, EventType.TRANSFERRED).outcome == "invalid"


# ---- crashes and recovery -----------------------------------------------------------

def test_crash_during_screening_is_recovered_from_provider(sw):
    call = sw.dial()
    sw.event(call, EventType.ANSWERED)
    # worker dies, events are lost, the provider moves on without us
    sw.w.clock.advance(400)
    sw.w.provider._outbox.clear()
    report = sw.w.recovery.sweep()
    assert report.count("reconciled") == 1
    assert sw.call(call["id"])["state"] not in ("SCREENING", "ANSWERED")
    assert check_invariants(sw.w.db) == []


def test_crash_after_transfer_sent_is_adopted_not_retransferred(sw):
    call = sw.screened("willing")

    def crash(point):
        if point == "after_transfer":
            raise SimulatedCrash(point)

    sw.service.fail_point = crash
    with pytest.raises(SimulatedCrash):
        sw.service.run()
    assert sw.call(call["id"])["transfer_status"] == "SENDING"
    sw.w.clock.advance(31)
    sw.w.provider._outbox.clear()   # and the TRANSFERRED webhook got lost too
    report = sw.w.recovery.sweep()
    assert report.count("transfer_adopted") == 1
    assert sw.w.provider.stats["transfers"] == 1
    assert sw.call(call["id"])["state"] == "CONNECTED"
    assert sw.w.agent()["state"] == "CONNECTED"


def test_crash_before_transfer_sent_resends_with_same_token(sw):
    call = sw.screened("willing")

    def crash(point):
        if point == "before_transfer":
            raise SimulatedCrash(point)

    sw.service.fail_point = crash
    with pytest.raises(SimulatedCrash):
        sw.service.run()
    token = sw.call(call["id"])["transfer_token"]
    sw.w.clock.advance(31)
    report = sw.w.recovery.sweep()
    assert report.count("transfer_resent") == 1
    assert sw.call(call["id"])["transfer_token"] == token
    assert sw.w.provider.stats["transfers"] == 1
    sw.w.pump(2)
    assert sw.call(call["id"])["state"] == "CONNECTED"


def test_ambiguous_transfer_timeout_then_reconciled(make_world):
    s = Screen(screening_world(make_world, timeout_accepted=1.0))
    call = s.screened("willing")
    s.w.provider.set_outage("timeout")
    assert s.service.run().ambiguous == 1
    assert s.call(call["id"])["transfer_status"] == "UNKNOWN"
    assert s.w.agent()["state"] == "RESERVED"     # held: the borrower may already be talking to them
    s.w.provider.set_outage(None)
    s.w.clock.advance(31)
    report = s.w.recovery.sweep()
    assert report.count("transfer_adopted") == 1
    assert s.w.provider.stats["transfers"] == 1


# ---- concurrency ------------------------------------------------------------------------

def test_concurrent_transfers_compete_for_limited_agents(make_world, db_path):
    w = screening_world(make_world, agents=3, borrowers=12)
    s = Screen(w)
    calls = []
    for _ in range(10):
        res = s.repo.reserve_screening(w.campaign, "w", "A", progressive=False)
        w.allocator.dial(res, AllocationResult())
        calls.append(res.call_id)
    for _ in range(60):
        waiting = w.db.conn().execute("SELECT COUNT(*) FROM calls WHERE state = 'TRANSFER_PENDING'").fetchone()[0]
        if waiting == 10:
            break
        w.pump(1)
    assert waiting == 10

    barrier = threading.Barrier(6)
    errors = []

    def run(i):
        repo = Repository(Database(db_path), w.clock, Settings())
        try:
            barrier.wait()
            ScreeningService(repo, w.providers, SafetyController()).run()
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
    with_agent = w.db.conn().execute(
        "SELECT COUNT(*), COUNT(DISTINCT agent_id) FROM calls WHERE state = 'TRANSFER_PENDING' AND agent_id IS NOT NULL"
    ).fetchone()
    assert tuple(with_agent) == (3, 3)
    assert w.provider.stats["transfers"] == 3
    assert check_invariants(w.db) == []


# ---- safety ---------------------------------------------------------------------------

def test_safety_refuses_transfer_without_consent():
    safety = SafetyController()
    assert safety.review_transfer("declined", "RUNNING")[0] is False
    assert safety.review_transfer(None, "RUNNING")[0] is False
    assert safety.review_transfer("willing", "RUNNING")[0] is True
    assert safety.review_transfer("willing", "PAUSED")[0] is True
    assert safety.review_transfer("willing", "STOPPED") == (False, "campaign_stopped")


def test_stopped_campaign_blocks_pending_transfer(sw):
    call = sw.screened("willing")
    sw.repo.set_campaign_status(sw.w.campaign, CampaignStatus.STOPPED)
    report = sw.service.run()
    assert report.blocked == 1 and report.sent == 0
    assert sw.call(call["id"])["end_reason"] == "transfer_blocked"
    assert sw.w.agent()["state"] == "AVAILABLE"


def test_backlog_blocks_new_screening_calls(make_world):
    from smartdialx.worker import Dialer
    w = screening_world(make_world, agents=1, borrowers=20)
    s = Screen(w)
    s.screened("willing")
    w.repo.set_agent_state(1, AgentState.PAUSED)   # nobody free, borrower still holding
    tick = Dialer(w.repo, w.providers, "w").tick(w.campaign)
    assert tick.decision.approved == 0
    assert tick.decision.reasons[0].startswith("transfer_backlog")


def test_progressive_screening_never_exceeds_free_agents(make_world):
    w = screening_world(make_world, agents=4, borrowers=50)
    got = [w.repo.reserve_screening(w.campaign, "w", "A", progressive=True) for _ in range(10)]
    assert sum(r is not None for r in got) == 4
    assert {w.repo.get_agent(a)["state"] for a in w.agent_ids} == {"AVAILABLE"}


# ---- reporting --------------------------------------------------------------------------

def test_report_keeps_screening_and_agent_conversations_apart(sw):
    call = sw.screened("willing")
    sw.service.run()
    sw.w.pump(400)
    m = campaign_metrics(sw.w.db, sw.w.campaign)
    sc = m["screening"]
    assert sc["attempted"] == 1 and sc["answered"] == 1 and sc["willing"] == 1
    assert sc["transfer_attempts"] == 1 and sc["agent_connections"] == 1
    assert sc["no_agent"] == 0 and sc["declined"] == 0
    assert m["agent_conversations"] == 1
    assert sw.call(call["id"])["state"] == "COMPLETED"


def test_metrics_for_plain_campaign_have_no_screening_section(world):
    world.start_call()
    assert campaign_metrics(world.db, world.campaign)["screening"] is None
