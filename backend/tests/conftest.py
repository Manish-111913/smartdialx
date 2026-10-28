import pytest

from smartdialx.allocator import AllocationResult, CallAllocator
from smartdialx.clock import SimClock
from smartdialx.config import Settings
from smartdialx.db import Database
from smartdialx.events import EventProcessor
from smartdialx.models import EventType, ProviderEvent
from smartdialx.providers import provider_a
from smartdialx.recovery import Recovery
from smartdialx.repository import Repository


@pytest.fixture
def clock():
    return SimClock(1000.0)


@pytest.fixture
def db_path(tmp_path):
    return str(tmp_path / "test.db")


@pytest.fixture
def db(db_path):
    database = Database(db_path)
    database.init_schema()
    yield database
    database.close()


@pytest.fixture
def repo(db, clock):
    return Repository(db, clock, Settings())


class World:
    """One campaign on provider A with predictable behaviour, plus all the moving parts."""

    def __init__(self, repo: Repository, agents: int = 1, borrowers: int = 1, mode: str = "progressive", **provider_kw):
        self.repo = repo
        self.db = repo.db
        self.clock = repo.clock
        self.campaign = repo.create_campaign("test", mode, "A")
        self.agent_ids = repo.add_agents(agents)
        repo.add_borrowers(self.campaign, borrowers)
        kw = {"answer_rate": 1.0, "reject_rate": 0.0, "busy_rate": 0.0, **provider_kw}
        self.provider = provider_a(self.clock, seed=1, **kw)
        self.providers = {"A": self.provider}
        self.events = EventProcessor(repo, self.providers)
        self.recovery = Recovery(repo, self.providers, self.events)
        self.allocator = CallAllocator(repo, self.providers, "test-worker")

    def start_call(self, bound: bool = True):
        if bound:
            res = self.repo.reserve_bound(self.campaign, "test-worker", "A")
        else:
            res = self.repo.reserve_unbound(self.campaign, "test-worker", "A")
        assert res is not None
        result = AllocationResult()
        self.allocator.dial(res, result)
        return self.repo.get_call(res.call_id)

    def send(self, call, etype: EventType, event_id: str | None = None, talk: float | None = None):
        call = self.repo.get_call(call["id"])
        event = ProviderEvent(
            event_id=event_id or f"{call['provider_call_id']}:{etype}",
            provider="A",
            provider_call_id=call["provider_call_id"],
            dial_token=call["dial_token"],
            type=etype,
            occurred_at=self.clock.now(),
            talk_seconds=talk,
        )
        return self.events.handle(event)

    def call(self, call_id: int):
        return self.repo.get_call(call_id)

    def agent(self, agent_id: int = 1):
        return self.repo.get_agent(agent_id)

    def pump(self, seconds: float, step: float = 1.0) -> None:
        """Advance time and feed provider events through the processor."""
        t = 0.0
        while t < seconds:
            self.clock.advance(step)
            t += step
            for e in self.provider.poll_events():
                self.events.handle(e)


@pytest.fixture
def world(repo):
    return World(repo)


@pytest.fixture
def make_world(repo):
    def make(**kw):
        return World(repo, **kw)
    return make
