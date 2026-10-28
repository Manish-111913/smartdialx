"""Runs dialing scenarios on a simulated clock and collects metrics.

Everything goes through the real code paths (repository, events, pacing, safety,
allocator, recovery). Only time is fake: one loop iteration = `tick_s` simulated
seconds, so a 30 minute campaign runs in a few seconds and the same seed gives the
same result every time.
"""

import dataclasses
import json
import random
from dataclasses import dataclass, field

from .clock import SimClock
from .config import Settings
from .db import Database
from .events import EventProcessor
from .models import AgentState
from .providers import make_provider
from .recovery import Recovery
from .repository import Repository
from .stats import campaign_metrics, check_invariants
from .worker import Dialer


@dataclass
class Scenario:
    name: str = "custom"
    mode: str = "progressive"
    provider: str = "A"
    agents: int = 20
    borrowers: int = 3000
    duration_s: int = 1800
    answer_rate: float = 0.5
    talk_s: float = 90.0
    # (at_s, answer_rate, talk_s) changes applied during the run
    schedule: list[tuple[float, float, float]] = field(default_factory=list)
    # (start_s, end_s, kind) where kind is "down" or "timeout"
    outage: tuple[float, float, str] | None = None
    # (at_s, how many agents log off)
    agent_drop: tuple[float, int] | None = None
    wrap_up_s: float = 10.0
    # screening bot first, agent only for willing borrowers
    screening: bool = False
    # who picks up: share willing to talk to an agent, share who can't talk now,
    # share where the bot fails. The rest decline. 1.0 willing = everyone talks (old behaviour)
    willing_rate: float = 1.0
    unavailable_rate: float = 0.0
    screen_fail_rate: float = 0.0
    hold_s: float = 20.0
    seed: int = 7
    tick_s: float = 1.0
    recovery_every_s: float = 10.0
    sample_every_s: float = 60.0


@dataclass
class SimReport:
    scenario: Scenario
    metrics: dict
    utilization: float
    occupancy: float
    productive_utilization: float
    timeline: list[dict]
    drop_reaction: dict | None
    invariant_violations: list[str]
    provider_stats: dict

    def to_dict(self) -> dict:
        return {
            "scenario": dataclasses.asdict(self.scenario),
            "utilization": self.utilization,
            "occupancy": self.occupancy,
            "productive_utilization": self.productive_utilization,
            "metrics": self.metrics,
            "drop_reaction": self.drop_reaction,
            "invariant_violations": self.invariant_violations,
            "provider_stats": self.provider_stats,
            "timeline": self.timeline,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, default=str)


def run(scenario: Scenario, settings: Settings | None = None) -> SimReport:
    base = settings or Settings()
    settings = dataclasses.replace(
        base,
        timeouts=dataclasses.replace(base.timeouts, wrap_up_s=scenario.wrap_up_s),
        screening=dataclasses.replace(base.screening, hold_s=scenario.hold_s),
    )
    settings.validate()

    clock = SimClock()
    db = Database(":memory:")
    db.init_schema()
    repo = Repository(db, clock, settings)
    campaign_id = repo.create_campaign(scenario.name, scenario.mode, scenario.provider, screening=scenario.screening)
    agent_ids = repo.add_agents(scenario.agents)
    repo.add_borrowers(campaign_id, scenario.borrowers)

    provider = make_provider(
        scenario.provider, clock, seed=scenario.seed, answer_rate=scenario.answer_rate, talk_s=scenario.talk_s,
        willing_rate=scenario.willing_rate, unavailable_rate=scenario.unavailable_rate,
        screen_fail_rate=scenario.screen_fail_rate,
    )
    providers = {provider.name: provider}
    events = EventProcessor(repo, providers)
    recovery = Recovery(repo, providers, events, settings)
    dialer = Dialer(repo, providers, worker_id="sim")
    rng = random.Random(scenario.seed)

    schedule = sorted(scenario.schedule)
    talk_seconds = staffed_seconds = busy_seconds = 0.0
    timeline: list[dict] = []
    drop_reaction = None
    next_sample = 0.0
    next_recovery = scenario.recovery_every_s
    dropped = False

    while clock.now() < scenario.duration_s:
        now = clock.advance(scenario.tick_s)

        while schedule and schedule[0][0] <= now:
            _, rate, talk = schedule.pop(0)
            provider.answer_rate = rate
            provider.profile.talk_s = talk

        if scenario.outage:
            start, end, kind = scenario.outage
            provider.set_outage(kind if start <= now < end else None)

        if scenario.agent_drop and not dropped and now >= scenario.agent_drop[0]:
            dropped = True
            online = [a for a in agent_ids if repo.get_agent(a)["state"] != AgentState.OFFLINE]
            for agent_id in rng.sample(online, min(scenario.agent_drop[1], len(online))):
                for h in repo.set_agent_state(agent_id, AgentState.OFFLINE):
                    providers[h.provider].hangup(h.provider_call_id)

        for event in provider.poll_events():
            events.handle(event)

        if now >= next_recovery:
            recovery.sweep()
            next_recovery += scenario.recovery_every_s

        repo.expire_wrap_ups()
        tick = dialer.tick(campaign_id)

        counts = _agent_counts(db)
        staffed = sum(v for k, v in counts.items() if k != "OFFLINE")
        staffed_seconds += staffed * scenario.tick_s
        talk_seconds += counts.get("CONNECTED", 0) * scenario.tick_s
        busy_seconds += (counts.get("CONNECTED", 0) + counts.get("WRAP_UP", 0)) * scenario.tick_s

        if dropped and drop_reaction is None:
            drop_reaction = {
                "at_s": now,
                "staffed_after": staffed,
                "available": counts.get("AVAILABLE", 0),
                "requested": tick.decision.requested,
                "approved": tick.decision.approved,
                "action": tick.decision.action.value,
                "note": "first pacing decision after the drop already uses the new agent count",
            }

        if now >= next_sample:
            inputs = tick.request.inputs
            timeline.append({
                "t": int(now),
                "staffed": staffed,
                "available": counts.get("AVAILABLE", 0),
                "talking": counts.get("CONNECTED", 0),
                "wrap_up": counts.get("WRAP_UP", 0),
                "requested": tick.decision.requested,
                "approved": tick.decision.approved,
                "action": tick.decision.action.value,
                "p_hat": inputs.get("p_hat"),
                "p_safe": inputs.get("p_safe"),
                "answer_rate_now": provider.answer_rate,
                "outage": provider.outage,
                "on_hold": _on_hold(db) if scenario.screening else None,
            })
            next_sample += scenario.sample_every_s

    metrics = campaign_metrics(db, campaign_id)
    report = SimReport(
        scenario=scenario,
        metrics=metrics,
        utilization=round(talk_seconds / staffed_seconds, 3) if staffed_seconds else 0.0,
        occupancy=round(busy_seconds / staffed_seconds, 3) if staffed_seconds else 0.0,
        productive_utilization=round(metrics["productive_talk_s"] / staffed_seconds, 3) if staffed_seconds else 0.0,
        timeline=timeline,
        drop_reaction=drop_reaction,
        invariant_violations=check_invariants(db),
        provider_stats=dict(provider.stats),
    )
    db.close()
    return report


def _on_hold(db: Database) -> int:
    return db.conn().execute(
        "SELECT COUNT(*) FROM calls WHERE state = 'TRANSFER_PENDING' AND agent_id IS NULL"
    ).fetchone()[0]


def _agent_counts(db: Database) -> dict[str, int]:
    return dict(db.conn().execute("SELECT state, COUNT(*) FROM agents GROUP BY state").fetchall())


# the scenarios from the assignment, plus failure cases
PRESETS: dict[str, dict] = {
    "A": {"answer_rate": 0.2, "talk_s": 120},
    "B": {"answer_rate": 0.5, "talk_s": 90},
    "C": {"answer_rate": 0.7, "talk_s": 180},
    "D": {
        "answer_rate": 0.5,
        "talk_s": 90,
        "duration_s": 2400,
        "schedule": [(600, 0.2, 120), (1200, 0.7, 180), (1800, 0.3, 60)],
    },
    "outage": {"provider": "B", "answer_rate": 0.5, "talk_s": 90, "outage": (600, 900, "timeout")},
    "agent-drop": {"agents": 100, "borrowers": 8000, "answer_rate": 0.5, "talk_s": 90, "agent_drop": (600, 40)},
    "screening": {"screening": True, "answer_rate": 0.4, "talk_s": 120,
                  "willing_rate": 0.35, "unavailable_rate": 0.25, "screen_fail_rate": 0.03},
}

# a borrower population where not everyone who answers wants to talk; used for the
# screening comparison so both sides call the same kind of people
POPULATION = {"willing_rate": 0.35, "unavailable_rate": 0.25, "screen_fail_rate": 0.03}


def preset(name: str, **overrides) -> Scenario:
    if name not in PRESETS:
        raise ValueError(f"unknown scenario {name!r}; choose from {', '.join(PRESETS)}")
    values = {"name": name, **PRESETS[name], **{k: v for k, v in overrides.items() if v is not None}}
    return Scenario(**values)
