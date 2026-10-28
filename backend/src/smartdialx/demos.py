"""Scripted walkthroughs of the failure cases from the assignment.

Each demo builds a tiny world (one campaign, a couple of agents, mock provider A),
breaks something on purpose and prints what the database ends up saying.
"""

import os
import tempfile
import threading

from .allocator import AllocationResult, CallAllocator
from .clock import SimClock
from .config import Settings
from .db import Database
from .events import EventProcessor, SimulatedCrash
from .models import EventType, ProviderEvent
from .providers import provider_a
from .recovery import Recovery
from .repository import Repository
from .safety import SafetyController
from .screening import ScreeningService


class _World:
    def __init__(self, agents: int = 1, borrowers: int = 1, path: str = ":memory:", screening: bool = False):
        self.clock = SimClock(1000.0)
        self.db = Database(path)
        self.db.init_schema()
        self.repo = Repository(self.db, self.clock, Settings())
        self.campaign = self.repo.create_campaign("demo", "progressive", "A", screening=screening)
        self.repo.add_agents(agents)
        self.repo.add_borrowers(self.campaign, borrowers)
        self.provider = provider_a(self.clock, seed=1, answer_rate=1.0, reject_rate=0.0, busy_rate=0.0,
                                   bot_s=(5.0, 5.0), hold_patience_s=300.0)
        self.providers = {"A": self.provider}
        self.events = EventProcessor(self.repo, self.providers)
        self.recovery = Recovery(self.repo, self.providers, self.events)
        self.allocator = CallAllocator(self.repo, self.providers, "demo-worker")

    def start_call(self):
        res = self.repo.reserve_bound(self.campaign, "demo-worker", "A")
        self.allocator.dial(res, AllocationResult())
        return self.repo.get_call(res.call_id)

    def event(self, call, etype: EventType, n: int, talk: float | None = None) -> str:
        e = ProviderEvent(f"{call['provider_call_id']}:{n}", "A", call["provider_call_id"], call["dial_token"],
                          etype, self.clock.now(), talk_seconds=talk)
        return self.events.handle(e).outcome

    def state(self, call_id: int) -> str:
        call = self.repo.get_call(call_id)
        agent = self.repo.get_agent(1)
        return f"call={call['state']} reason={call['end_reason']} agent={agent['state']}"


def _title(text: str) -> None:
    print(f"\n== {text} " + "=" * max(0, 60 - len(text)))


def race_for_one_agent() -> None:
    _title("two workers grab the same agent at the same moment")
    path = os.path.join(tempfile.mkdtemp(), "race.db")
    w = _World(agents=1, borrowers=10, path=path)
    barrier = threading.Barrier(8)
    wins = []

    def grab(i: int) -> None:
        repo = Repository(Database(path), w.clock)
        barrier.wait()
        if repo.reserve_bound(w.campaign, f"worker-{i}", "A"):
            wins.append(i)
        repo.db.close()

    threads = [threading.Thread(target=grab, args=(i,)) for i in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    print(f"8 threads tried, {len(wins)} got the agent (worker-{wins[0]})")
    print("why: BEGIN IMMEDIATE serializes writers and the UPDATE only matches state='AVAILABLE'")


def duplicate_events() -> None:
    _title("ANSWERED, ANSWERED, ANSWERED, COMPLETED")
    w = _World()
    call = w.start_call()
    print("same event id three times:", [w.event(call, EventType.ANSWERED, 2) for _ in range(3)])
    print("  ->", w.state(call["id"]))
    print("new ids, same meaning:", [w.event(call, EventType.ANSWERED, n) for n in (3, 4)])
    print("COMPLETED:", w.event(call, EventType.COMPLETED, 5, talk=42))
    print("  ->", w.state(call["id"]))


def out_of_order_events() -> None:
    _title("COMPLETED, ANSWERED, RINGING")
    w = _World()
    call = w.start_call()
    for etype, n in ((EventType.COMPLETED, 9), (EventType.ANSWERED, 3), (EventType.RINGING, 2)):
        print(f"{etype:<10}", w.event(call, etype, n, talk=30 if etype == EventType.COMPLETED else None))
    print("  ->", w.state(call["id"]))


def crash_after_answered() -> None:
    _title("worker crashes right after ANSWERED is stored, then COMPLETED arrives")
    w = _World()
    call = w.start_call()

    def crash(point: str) -> None:
        if point == "after_store":
            raise SimulatedCrash(point)

    w.events.fail_point = crash
    answered = ProviderEvent(f"{call['provider_call_id']}:3", "A", call["provider_call_id"], call["dial_token"],
                             EventType.ANSWERED, w.clock.now())
    try:
        w.events.handle(answered)
    except SimulatedCrash:
        print("crashed after storing ANSWERED ->", w.state(call["id"]))
    w.events.fail_point = None
    print("COMPLETED arrives:", w.event(call, EventType.COMPLETED, 4, talk=60), "->", w.state(call["id"]))
    print("restart, process leftovers:", [r.outcome for r in w.events.process_pending()])
    print("  ->", w.state(call["id"]))


def crash_mid_dial() -> None:
    _title("agent reserved > borrower reserved > call initiated > worker crashes")
    w = _World()

    def crash(point: str) -> None:
        if point == "after_initiate":
            raise SimulatedCrash(point)

    w.allocator.fail_point = crash
    res = w.repo.reserve_bound(w.campaign, "demo-worker", "A")
    try:
        w.allocator.dial(res, AllocationResult())
    except SimulatedCrash:
        call = w.repo.get_call(res.call_id)
        print(f"crashed after provider accepted; db says initiation={call['initiation']} -> {w.state(res.call_id)}")
    w.clock.advance(31)
    report = w.recovery.sweep()
    print("recovery after lease expiry:", report.actions)
    print("  ->", w.state(res.call_id))
    print("provider placed", w.provider.stats["initiate"], "request(s); no second dial was sent")


def outage_timeout() -> None:
    _title("provider times out, then comes back")
    w = _World()
    w.provider.profile.timeout_accepted = 1.0
    w.provider.set_outage("timeout")
    res = w.repo.reserve_bound(w.campaign, "demo-worker", "A")
    w.allocator.dial(res, AllocationResult())
    call = w.repo.get_call(res.call_id)
    print(f"initiate timed out: initiation={call['initiation']} -> {w.state(res.call_id)} (agent held, not freed)")
    w.clock.advance(31)
    print("recovery during outage:", w.recovery.sweep().deferred, "deferred")
    w.provider.set_outage(None)
    print("recovery after outage:", w.recovery.sweep().actions, "->", w.state(res.call_id))


def _screened_world(agents: int, borrowers: int, willing: float) -> tuple["_World", ScreeningService]:
    w = _World(agents=agents, borrowers=borrowers, screening=True)
    w.provider.profile.willing_rate = willing
    w.provider.profile.unavailable_rate = 0.0
    return w, ScreeningService(w.repo, w.providers, SafetyController())


def _run_bot(w: "_World", call_id: int, until: str = "TRANSFER_PENDING") -> None:
    for _ in range(60):
        state = w.repo.get_call(call_id)["state"]
        if state == until or state in ("COMPLETED", "FAILED"):
            return
        w.clock.advance(1)
        for e in w.provider.poll_events():
            w.events.handle(e)


def screening_handoff() -> None:
    _title("mock screening bot: two say yes with one agent free, one says no")
    w, service = _screened_world(agents=1, borrowers=3, willing=1.0)
    calls = []
    # the mock decides each borrower's answer when the call is placed
    for willing in (1.0, 1.0, 0.0):
        w.provider.profile.willing_rate = willing
        res = w.repo.reserve_screening(w.campaign, "demo", "A", progressive=False)
        w.allocator.dial(res, AllocationResult())
        calls.append(res.call_id)
    print("3 bot calls placed with 1 agent; agent is", w.repo.get_agent(1)["state"], "(not held during screening)")

    def show(call_id: int) -> str:
        c = w.repo.get_call(call_id)
        return f"call {call_id}: {c['state']} agent={c['agent_id']} reason={c['end_reason']}"

    for _ in range(60):
        states = {w.repo.get_call(c)["state"] for c in calls[:2]}
        if states == {"TRANSFER_PENDING"}:
            break
        _pump(w, 1)
    print("both willing borrowers are on hold; transfer run:", service.run())
    _pump(w, 2)
    print("  ", show(calls[0]), "|", show(calls[1]))
    w.clock.advance(w.repo.settings.screening.hold_s + 1)
    print("hold runs out for the one still waiting:", service.run())
    print("  ", show(calls[0]), "|", show(calls[1]))
    print("   (the one who waited was never marked connected; the bot ends politely and a callback is queued)")

    _run_bot(w, calls[2], until="COMPLETED")
    c = w.repo.get_call(calls[2])
    print(f"borrower 3 declines -> {c['state']} reason={c['end_reason']} screen_result={c['screen_result']}, "
          "no transfer, no retry")


def _pump(w: "_World", seconds: int) -> None:
    for _ in range(seconds):
        w.clock.advance(1)
        for e in w.provider.poll_events():
            w.events.handle(e)

def screening_crash_mid_transfer() -> None:
    _title("worker crashes right after the provider accepted the transfer")
    w, service = _screened_world(agents=1, borrowers=1, willing=1.0)
    res = w.repo.reserve_screening(w.campaign, "demo", "A", progressive=True)
    w.allocator.dial(res, AllocationResult())
    _run_bot(w, res.call_id)

    def crash(point: str) -> None:
        if point == "after_transfer":
            raise SimulatedCrash(point)

    service.fail_point = crash
    try:
        service.run()
    except SimulatedCrash:
        call = w.repo.get_call(res.call_id)
        print(f"crashed: transfer_status={call['transfer_status']} agent={w.repo.get_agent(1)['state']}")
    w.clock.advance(31)
    w.provider._outbox.clear()  # and the TRANSFERRED webhook was lost
    print("recovery:", w.recovery.sweep().actions, "->", w.state(res.call_id))
    print("provider transfers performed:", w.provider.stats.get("transfers", 0))


def run_all() -> None:
    race_for_one_agent()
    duplicate_events()
    out_of_order_events()
    crash_after_answered()
    crash_mid_dial()
    outage_timeout()
    screening_handoff()
    screening_crash_mid_transfer()
    print()


if __name__ == "__main__":
    run_all()
