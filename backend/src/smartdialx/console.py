"""The live engine behind the web console.

The CLI simulator runs a whole campaign in a few seconds on a fake clock and throws
the database away. The console keeps one database, both mock providers and every
campaign alive, and runs the same pipeline in a background thread with the clock
following wall time, so the screens show things as they happen:

    provider events -> recovery -> wrap-ups and pauses -> transfers
        -> pacer -> safety controller -> allocator -> provider

On start it seeds a small synthetic world (a dozen agents, a few campaigns with a
few hundred borrowers between them) and replays the last `history_s` seconds as fast
as it can, so there's some history to look at straight away. Every borrower and
phone number is synthetic and every call goes to a mock provider.
"""

import copy
import dataclasses
import itertools
import json
import logging
import os
import threading
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor

from .clock import SimClock
from .config import Settings
from .db import Database
from .events import EventProcessor
from .models import AgentState, CampaignStatus, Mode
from .providers import DialRequest, MockProvider, make_provider
from .recovery import Recovery
from .repository import Repository
from .simulator import Scenario, run as run_scenario
from .worker import Dialer

log = logging.getLogger(__name__)

# Who picks up when a campaign calls, per mock audience. Screening campaigns use all
# of it; direct campaigns only use answer_rate and willing_rate (people who don't
# want to talk give the agent a short "not now" call).
AUDIENCES: dict[str, dict] = {
    "standard": {"label": "Standard", "answer_rate": 0.4, "willing_rate": 0.35,
                 "unavailable_rate": 0.25, "screen_fail_rate": 0.03},
    "warm": {"label": "Warm (high willingness)", "answer_rate": 0.5, "willing_rate": 0.55,
             "unavailable_rate": 0.2, "screen_fail_rate": 0.02},
    "strict": {"label": "Strict (low willingness)", "answer_rate": 0.35, "willing_rate": 0.22,
               "unavailable_rate": 0.3, "screen_fail_rate": 0.04},
}

FAULTS = {
    "normal": "Normal operation",
    "latency": "Increased latency",
    "timeout": "Request timeouts",
    "outage": "Temporary outage",
    "duplicates": "Duplicate events",
    "out_of_order": "Out-of-order events",
}

PROVIDER_INFO = {
    "A": {"label": "Mock provider A", "summary": "Fast and reliable"},
    "B": {"label": "Mock provider B", "summary": "Slow and unreliable"},
}

# the seeded world. Names are made up; borrowers are generated with +1-555 numbers
SEED_AGENTS = [
    ("Alex Morgan", "AVAILABLE"), ("Priya Sharma", "AVAILABLE"), ("Jordan Lee", "AVAILABLE"),
    ("Sam Taylor", "AVAILABLE"), ("Maya Patel", "AVAILABLE"), ("Marcus Vance", "AVAILABLE"),
    ("Elena Rostova", "AVAILABLE"), ("David Kim", "AVAILABLE"), ("Chloe Bennett", "AVAILABLE"),
    ("Lucas Chen", "AVAILABLE"), ("Aisha Khan", "PAUSED"), ("Rohan Mehta", "OFFLINE"),
]

SEED_CAMPAIGNS = [
    {"name": "Q3 Renewal Outreach", "description": "Borrowers with a renewal due this quarter",
     "mode": "predictive", "provider": "A", "screening": True, "audience": "standard", "borrowers": 400},
    {"name": "Auto Claims Pilot", "description": "Follow-up on open auto claims",
     "mode": "progressive", "provider": "B", "screening": True, "audience": "strict", "borrowers": 200},
    {"name": "Customer Follow-up", "description": "Check-in after a resolved account issue",
     "mode": "progressive", "provider": "A", "screening": False, "audience": "warm", "borrowers": 150,
     "pause_at": 0.6},
    {"name": "Service Feedback", "description": "Short satisfaction call after a payment plan change",
     "mode": "progressive", "provider": "B", "screening": False, "audience": "warm", "borrowers": 30},
]


class Console:
    def __init__(
        self,
        path: str,
        settings: Settings | None = None,
        history_s: float = 1200.0,
        seed: int = 7,
        tick_s: float = 1.0,
        keep: bool = False,
    ):
        self.path = path
        self.seed = seed
        self.tick_s = tick_s
        self.history_s = history_s
        self.settings = settings or Settings()
        self.settings.validate()
        self._lock = threading.RLock()
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self.started_wall = time.time()
        self.errors = 0
        self.ticks = 0
        self.faults: dict[str, dict] = {}
        # simulations run with whatever settings the console has at the time
        self.simulations = SimulationLab(lambda: self.settings)
        self._open(fresh=not (keep and os.path.exists(path)))

    # ---- setup -------------------------------------------------------------

    def _open(self, fresh: bool) -> None:
        if fresh:
            for suffix in ("", "-wal", "-shm"):
                if os.path.exists(self.path + suffix):
                    os.remove(self.path + suffix)
        self.db = Database(self.path)
        self.db.init_schema()
        self._start_world(fresh)

    def _start_world(self, fresh: bool) -> None:
        if fresh:
            start = time.time() - self.history_s
        else:
            # resuming: carry on from the last thing that happened, recovery sorts out
            # whatever was in flight when the old process stopped
            last = self.db.conn().execute(
                "SELECT MAX(updated_at) FROM calls UNION ALL SELECT MAX(updated_at) FROM agents"
            ).fetchall()
            start = max((r[0] for r in last if r[0] is not None), default=time.time())
        self.clock = SimClock(start)
        self.history_start = start
        self.providers: dict[str, MockProvider] = {
            name: make_provider(name, self.clock, seed=self.seed + i, talk_s=100.0)
            for i, name in enumerate(("A", "B"))
        }
        self._baseline = {name: copy.deepcopy(p.profile) for name, p in self.providers.items()}
        for p in self.providers.values():
            p.audience = self._audience_for
        self._build()
        self._script: list[tuple[float, int]] = []
        if fresh:
            self._seed()
        self._next_recovery = self.clock.now() + 10
        self._next_sample = self.clock.now()

    def _build(self) -> None:
        """(Re)create the pipeline objects. Cheap; done again whenever settings change."""
        self.repo = Repository(self.db, self.clock, self.settings)
        self.events = EventProcessor(self.repo, self.providers)
        self.recovery = Recovery(self.repo, self.providers, self.events, self.settings)
        self.dialer = Dialer(self.repo, self.providers, worker_id="console")

    def _seed(self) -> None:
        for name, state in SEED_AGENTS:
            self.repo.add_agent(name, AgentState(state))
        for spec in SEED_CAMPAIGNS:
            cid = self.repo.create_campaign(
                spec["name"], spec["mode"], spec["provider"], screening=spec["screening"],
                description=spec["description"], audience=spec["audience"],
            )
            self.repo.add_borrowers(cid, spec["borrowers"])
            if "pause_at" in spec:
                self._script.append((self.clock.now() + spec["pause_at"] * self.history_s, cid))
        self.audit("console_started", None, f"seeded {len(SEED_AGENTS)} agents and {len(SEED_CAMPAIGNS)} campaigns")

    def _audience_for(self, req: DialRequest) -> dict | None:
        row = self.db.conn().execute(
            "SELECT k.audience FROM calls c JOIN campaigns k ON k.id = c.campaign_id WHERE c.id = ?", (req.call_id,)
        ).fetchone()
        return AUDIENCES.get(row["audience"]) if row and row["audience"] else None

    # ---- the loop ----------------------------------------------------------

    def start(self) -> None:
        if self._thread is not None:
            return
        self._thread = threading.Thread(target=self._run, name="console-engine", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=10)
            self._thread = None

    @property
    def warming_up(self) -> bool:
        return self.clock.now() < time.time() - 5 * self.tick_s

    def _run(self) -> None:
        while not self._stop.is_set():
            if self.clock.now() + self.tick_s > time.time():
                self._stop.wait(0.1)
                continue
            # one tick per lock, so operator actions get in between even while catching up
            with self._lock:
                try:
                    self.step()
                except Exception:
                    self.errors += 1
                    log.exception("console tick failed")

    def step(self) -> None:
        """Advance the clock by one tick and run everything that's due."""
        now = self.clock.advance(self.tick_s)
        self.ticks += 1
        self._expire_faults(now)
        while self._script and self._script[0][0] <= now:
            _, cid = self._script.pop(0)
            self.repo.set_campaign_status(cid, CampaignStatus.PAUSED)
            self.audit("campaign_paused", f"campaign:{cid}", "paused by the demo script")
        for provider in self.providers.values():
            for event in provider.poll_events():
                self.events.handle(event)
        self.events.process_pending()
        if now >= self._next_recovery:
            self.recovery.sweep()
            self._next_recovery = now + 10
        self.repo.expire_wrap_ups()
        self.repo.apply_requested_pauses()
        self.dialer.screening.run()
        running = [r[0] for r in self.db.conn().execute(
            "SELECT id FROM campaigns WHERE status = 'RUNNING' ORDER BY id"
        )]
        for cid in running:
            self.dialer.tick(cid, transfers=False)
        if now >= self._next_sample:
            self._sample(now)
            self._next_sample = now + 5
            self.repo.heartbeat("console")

    def _sample(self, now: float) -> None:
        counts = dict(self.db.conn().execute("SELECT state, COUNT(*) FROM agents GROUP BY state").fetchall())
        with self.db.transaction() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO agent_samples VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (now, *(counts.get(s, 0) for s in
                        ("AVAILABLE", "RESERVED", "DIALING", "CONNECTED", "WRAP_UP", "PAUSED", "OFFLINE"))),
            )

    def audit(self, action: str, subject: str | None, detail: str = "") -> None:
        with self.db.transaction() as conn:
            conn.execute(
                "INSERT INTO audit_log (at, action, subject, detail) VALUES (?, ?, ?, ?)",
                (self.clock.now(), action, subject, detail),
            )

    # ---- operator actions --------------------------------------------------

    def add_agent(self, name: str, state: str = "AVAILABLE") -> int:
        name = name.strip()
        if not name:
            raise ValueError("agent name is required")
        if state not in ("AVAILABLE", "PAUSED", "OFFLINE"):
            raise ValueError("a new agent starts as AVAILABLE, PAUSED or OFFLINE")
        with self._lock:
            exists = self.db.conn().execute("SELECT 1 FROM agents WHERE name = ?", (name,)).fetchone()
            if exists:
                raise ValueError(f"an agent called {name!r} already exists")
            agent_id = self.repo.add_agent(name, AgentState(state))
            self.audit("agent_added", f"agent:{agent_id}", f"{name}, starts {state}")
            return agent_id

    def set_agent_state(self, agent_id: int, state: str) -> None:
        """Operator moves an agent. Busy agents can't be switched over by accident:
        logging off mid-call is allowed, but it ends the call, so callers must ask
        for it explicitly with state OFFLINE."""
        target = AgentState(state)
        if target not in (AgentState.AVAILABLE, AgentState.PAUSED, AgentState.OFFLINE):
            raise ValueError("operators can set AVAILABLE, PAUSED or OFFLINE")
        with self._lock:
            agent = self.repo.get_agent(agent_id)
            if agent is None:
                raise KeyError(f"agent {agent_id} not found")
            busy = agent["state"] in ("RESERVED", "DIALING", "CONNECTED")
            if busy and target != AgentState.OFFLINE:
                raise ValueError(f"agent is {agent['state']}; use pause after call instead")
            for h in self.repo.set_agent_state(agent_id, target):
                self.providers[h.provider].hangup(h.provider_call_id)
            self.audit(f"agent_{target.value.lower()}", f"agent:{agent_id}", f"was {agent['state']}")

    def request_pause(self, agent_id: int, on: bool) -> None:
        with self._lock:
            self.repo.request_pause(agent_id, on)
            self.audit("agent_pause_requested" if on else "agent_pause_cancelled", f"agent:{agent_id}")

    def create_campaign(self, spec: dict) -> int:
        clean = _campaign_fields(spec, creating=True)
        borrowers = clean.pop("borrowers")
        status = clean.pop("status", "RUNNING")
        # one transaction, so nobody ever sees the campaign without its borrowers
        with self._lock, self.db.transaction():
            cid = self.repo.create_campaign(
                clean.pop("name"), clean.pop("mode"), clean.pop("provider"),
                screening=clean.pop("screening"), status=CampaignStatus(status), **clean,
            )
            self.repo.add_borrowers(cid, borrowers)
            self.audit("campaign_created", f"campaign:{cid}", f"{borrowers} borrowers, starts {status}")
            return cid

    def update_campaign(self, campaign_id: int, spec: dict) -> None:
        clean = _campaign_fields(spec, creating=False)
        with self._lock:
            self.repo.get_campaign(campaign_id)
            self.repo.update_campaign(campaign_id, **clean)
            self.audit("campaign_updated", f"campaign:{campaign_id}", ", ".join(sorted(clean)))

    def set_campaign_status(self, campaign_id: int, status: str) -> None:
        target = CampaignStatus(status)
        with self._lock:
            current = self.repo.get_campaign(campaign_id).status
            if current == CampaignStatus.STOPPED and target != CampaignStatus.STOPPED:
                raise ValueError("a stopped campaign can't be restarted; duplicate it instead")
            self.repo.set_campaign_status(campaign_id, target)
            if target == CampaignStatus.STOPPED:
                # nothing queued should ever be dialed for a stopped campaign; live calls finish normally
                self.repo.cancel_queued(campaign_id, "campaign_stopped")
            self.audit(f"campaign_{target.value.lower()}", f"campaign:{campaign_id}", f"was {current.value}")

    def duplicate_campaign(self, campaign_id: int) -> int:
        row = self.db.conn().execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone()
        if row is None:
            raise KeyError(f"campaign {campaign_id} not found")
        borrowers = self.db.conn().execute(
            "SELECT COUNT(*) FROM borrowers WHERE campaign_id = ?", (campaign_id,)
        ).fetchone()[0]
        spec = {k: row[k] for k in ("mode", "provider", "description", "audience", "hold_s", "no_agent_policy")}
        spec.update(name=f"{row['name']} (copy)", screening=bool(row["screening"]),
                    borrowers=max(1, borrowers), status="PAUSED")
        return self.create_campaign(spec)

    # ---- provider faults ---------------------------------------------------

    def set_fault(self, provider: str, kind: str, duration_s: float | None = None) -> dict:
        if provider not in self.providers:
            raise KeyError(f"provider {provider} not found")
        if kind not in FAULTS:
            raise ValueError(f"unknown fault {kind!r}; choose from {', '.join(FAULTS)}")
        with self._lock:
            p = self.providers[provider]
            p.profile = copy.deepcopy(self._baseline[provider])
            p.set_outage(None)
            self.faults.pop(provider, None)
            if kind != "normal":
                prof = p.profile
                if kind == "latency":
                    prof.ring_s = (prof.ring_s[0] * 3, prof.ring_s[1] * 3)
                    prof.answer_after_s = (prof.answer_after_s[0] + 5, prof.answer_after_s[1] + 10)
                elif kind == "timeout":
                    p.set_outage("timeout")
                elif kind == "outage":
                    p.set_outage("down")
                elif kind == "duplicates":
                    prof.duplicate_rate = 0.5
                elif kind == "out_of_order":
                    prof.jitter_s = 10.0
                now = self.clock.now()
                self.faults[provider] = {
                    "kind": kind, "label": FAULTS[kind], "started_at": now,
                    "until": now + duration_s if duration_s else None,
                }
            self.audit("fault_cleared" if kind == "normal" else "fault_started", f"provider:{provider}",
                       FAULTS[kind] + (f" for {duration_s:.0f}s" if duration_s and kind != "normal" else ""))
            return self.faults.get(provider, {"kind": "normal", "label": FAULTS["normal"]})

    def _expire_faults(self, now: float) -> None:
        for name, fault in list(self.faults.items()):
            if fault["until"] is not None and now >= fault["until"]:
                self.set_fault(name, "normal")

    # ---- settings ----------------------------------------------------------

    def update_settings(self, patch: dict) -> Settings:
        """Apply a partial update like {"safety": {"max_active_calls": 50}}."""
        sections = {}
        for section, values in patch.items():
            current = getattr(self.settings, section, None)
            if current is None or not dataclasses.is_dataclass(current) or not isinstance(values, dict):
                raise ValueError(f"unknown settings section {section!r}")
            fields = {f.name: f for f in dataclasses.fields(current)}
            clean = {}
            for key, value in values.items():
                if key not in fields:
                    raise ValueError(f"unknown setting {section}.{key}")
                clean[key] = _coerce(getattr(current, key), value, f"{section}.{key}",
                                     nullable=fields[key].default is None)
            sections[section] = dataclasses.replace(current, **clean)
        new = dataclasses.replace(self.settings, **sections)
        new.validate()
        with self._lock:
            self.settings = new
            self._build()
            self.audit("settings_changed", None, json.dumps(patch, sort_keys=True))
        return new

    def reset_settings(self) -> Settings:
        with self._lock:
            self.settings = Settings()
            self._build()
            self.audit("settings_reset", None, "back to defaults")
        return self.settings

    # ---- whole console -----------------------------------------------------

    def reset(self) -> None:
        """Empty the database and seed a fresh world.

        The file stays: request threads may still hold connections to it, and on
        Windows an open SQLite file can't be deleted.
        """
        self.stop()
        with self._lock:
            with self.db.transaction() as conn:
                # children before parents, foreign keys are on
                for table in ("provider_events", "provider_requests", "decisions", "recovery_log", "audit_log",
                              "agent_samples", "workers", "calls", "borrowers", "agents", "campaigns"):
                    conn.execute(f"DELETE FROM {table}")
            self.faults.clear()
            self._stop.clear()
            self.started_wall = time.time()
            self.errors = self.ticks = 0
            self._start_world(fresh=True)
        self.start()

    def close(self) -> None:
        self.stop()
        self.simulations.close()
        self.db.close()


def _campaign_fields(spec: dict, creating: bool) -> dict:
    out: dict = {}
    if "name" in spec or creating:
        name = str(spec.get("name") or "").strip()
        if not name:
            raise ValueError("campaign name is required")
        if len(name) > 80:
            raise ValueError("campaign name is too long")
        out["name"] = name
    if "description" in spec:
        out["description"] = (str(spec["description"]).strip() or None) if spec["description"] is not None else None
    if "mode" in spec or creating:
        out["mode"] = Mode(spec.get("mode", "progressive")).value
    if "provider" in spec or creating:
        provider = str(spec.get("provider", "A")).upper()
        if provider not in ("A", "B"):
            raise ValueError("provider must be A or B")
        out["provider"] = provider
    if "screening" in spec or creating:
        out["screening"] = bool(spec.get("screening", False))
    if "audience" in spec:
        if spec["audience"] is not None and spec["audience"] not in AUDIENCES:
            raise ValueError(f"audience must be one of {', '.join(AUDIENCES)}")
        out["audience"] = spec["audience"]
    elif creating:
        out["audience"] = "standard"
    # null on an update means "follow the global setting again"
    if "hold_s" in spec and (spec["hold_s"] is not None or not creating):
        if spec["hold_s"] is None:
            out["hold_s"] = None
        else:
            hold = float(spec["hold_s"])
            if not 5 <= hold <= 300:
                raise ValueError("agent wait must be between 5 and 300 seconds")
            out["hold_s"] = hold
    if "no_agent_policy" in spec and (spec["no_agent_policy"] is not None or not creating):
        if spec["no_agent_policy"] not in (None, "callback", "end"):
            raise ValueError("no-agent policy must be callback or end")
        out["no_agent_policy"] = spec["no_agent_policy"]
    if creating:
        try:
            borrowers = int(spec.get("borrowers", 0))
        except (TypeError, ValueError):
            raise ValueError("call targets must be a number") from None
        if not 1 <= borrowers <= 2000:
            raise ValueError("call targets must be between 1 and 2000 in the demo")
        out["borrowers"] = borrowers
        if "status" in spec:
            if spec["status"] not in ("RUNNING", "PAUSED"):
                raise ValueError("a new campaign starts RUNNING or PAUSED")
            out["status"] = spec["status"]
    return out


def _coerce(current, value, name: str, nullable: bool = False):
    """Convert an incoming JSON value to the type of the setting it replaces."""
    if value is None:
        if nullable:
            return None
        raise ValueError(f"{name} is required")
    if isinstance(current, bool):
        if not isinstance(value, bool):
            raise ValueError(f"{name} must be true or false")
        return value
    if isinstance(current, str):
        return str(value)
    if current is None or isinstance(current, (int, float)):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{name} must be a number")
        if value < 0:
            raise ValueError(f"{name} can't be negative")
        whole = float(value).is_integer()
        if isinstance(current, int) and not whole:
            raise ValueError(f"{name} must be a whole number")
        if isinstance(current, int) or (current is None and whole):
            return int(value)
        return float(value)
    raise ValueError(f"{name} can't be changed here")


class SimulationLab:
    """Runs simulator scenarios in the background for the Simulation Lab screen.

    Each run is a fresh in-memory world on its own fake clock, nothing to do with the
    live console. Results are kept in memory for this server process only.
    """

    PRESETS = {
        "balanced": {"label": "Balanced (50% answer)", "answer_rate": 0.5, "talk_s": 90},
        "low": {"label": "Low answer rate (20%)", "answer_rate": 0.2, "talk_s": 120},
        "high": {"label": "High answer rate (70%)", "answer_rate": 0.7, "talk_s": 180},
        "drift": {"label": "Changing answer rate (50% -> 20% -> 70%)", "answer_rate": 0.5, "talk_s": 90,
                  "duration_s": 2400, "schedule": [(600, 0.2, 120), (1200, 0.7, 180), (1800, 0.3, 60)]},
        "fault": {"label": "Provider timeouts (B, minute 10-15)", "provider": "B", "answer_rate": 0.5,
                  "talk_s": 90, "fault": "timeout"},
    }

    def __init__(self, settings: Callable[[], Settings] = Settings, keep: int = 30):
        self._settings = settings
        self._pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="simlab")
        self._lock = threading.Lock()
        self._ids = itertools.count(1)
        self._runs: dict[int, dict] = {}
        self._keep = keep

    def start(self, params: dict) -> dict:
        scenario = self.scenario(params)
        settings = self._settings()
        compare = bool(params.get("compare"))
        with self._lock:
            run_id = next(self._ids)
            job = {"id": run_id, "status": "queued", "params": params, "compare": compare,
                   "created_at": time.time(), "started_at": None, "finished_at": None,
                   "result": None, "error": None, "settings_changed": _changed_settings(settings)}
            self._runs[run_id] = job
            for old in sorted(self._runs)[:-self._keep]:
                self._runs.pop(old)
        self._pool.submit(self._work, job, scenario, settings)
        return self._public(job)

    def scenario(self, params: dict) -> Scenario:
        preset = self.PRESETS.get(params.get("preset", "balanced"))
        if preset is None:
            raise ValueError(f"unknown preset; choose from {', '.join(self.PRESETS)}")
        values = {k: v for k, v in preset.items() if k not in ("label", "fault")}
        fault = params.get("fault", preset.get("fault", "normal"))
        for key, lo, hi in (("agents", 1, 100), ("borrowers", 50, 5000)):
            if key in params:
                v = int(params[key])
                if not lo <= v <= hi:
                    raise ValueError(f"{key} must be between {lo} and {hi}")
                values[key] = v
        if "answer_rate" in params and params["answer_rate"] is not None:
            rate = float(params["answer_rate"])
            if not 0.05 <= rate <= 0.95:
                raise ValueError("answer rate must be between 5% and 95%")
            values["answer_rate"] = rate
        values["mode"] = Mode(params.get("mode", "predictive")).value
        if params.get("provider"):
            values["provider"] = str(params["provider"]).upper()
        values["screening"] = bool(params.get("screening", False))
        audience = AUDIENCES.get(params.get("audience") or "standard")
        if audience is None:
            raise ValueError(f"audience must be one of {', '.join(AUDIENCES)}")
        if values["screening"] or params.get("compare"):
            values.update(willing_rate=audience["willing_rate"], unavailable_rate=audience["unavailable_rate"],
                          screen_fail_rate=audience["screen_fail_rate"])
        if params.get("hold_s"):
            values["hold_s"] = float(params["hold_s"])
        if params.get("no_agent_policy"):
            values["no_agent_policy"] = params["no_agent_policy"]
        duration = values.get("duration_s", 1800)
        if fault in ("timeout", "outage"):
            values["outage"] = (duration / 3, duration / 2, "timeout" if fault == "timeout" else "down")
        elif fault == "latency":
            values["provider_overrides"] = {"ring_s": (4.0, 12.0), "answer_after_s": (10.0, 25.0)}
        elif fault == "duplicates":
            values["provider_overrides"] = {"duplicate_rate": 0.5}
        elif fault == "out_of_order":
            values["provider_overrides"] = {"jitter_s": 10.0}
        elif fault != "normal":
            raise ValueError(f"unknown fault {fault!r}")
        values["seed"] = int(params.get("seed", 7))
        values["name"] = params.get("preset", "balanced")
        return Scenario(**values)

    def _work(self, job: dict, scenario: Scenario, settings: Settings) -> None:
        job["status"] = "running"
        job["started_at"] = time.time()
        try:
            if job["compare"]:
                rows = []
                # same audience on every row, so the comparison is fair
                for screening in (False, True):
                    for mode in ("progressive", "predictive"):
                        variant = dataclasses.replace(scenario, mode=mode, screening=screening)
                        rows.append(_summary(run_scenario(variant, settings)))
                job["result"] = {"rows": rows}
            else:
                report = run_scenario(scenario, settings)
                job["result"] = {**_summary(report), "timeline": report.timeline,
                                 "metrics": report.metrics, "drop_reaction": report.drop_reaction}
            job["status"] = "done"
        except Exception as e:  # shown on the screen; the server keeps going
            log.exception("simulation %s failed", job["id"])
            job["status"] = "failed"
            job["error"] = str(e)
        job["finished_at"] = time.time()

    def get(self, run_id: int) -> dict:
        job = self._runs.get(run_id)
        if job is None:
            raise KeyError(f"simulation {run_id} not found")
        return self._public(job, full=True)

    def list(self) -> list[dict]:
        return [self._public(j) for j in sorted(self._runs.values(), key=lambda j: -j["id"])]

    @staticmethod
    def _public(job: dict, full: bool = False) -> dict:
        out = {k: v for k, v in job.items() if k != "result"}
        result = job["result"]
        if result is not None:
            out["result"] = result if full else {k: v for k, v in result.items() if k not in ("timeline", "metrics")}
        return out

    def close(self) -> None:
        self._pool.shutdown(wait=False, cancel_futures=True)


def _changed_settings(settings: Settings) -> list[str]:
    """Settings that differ from the defaults, as "section.key", so a run says what it used."""
    defaults = dataclasses.asdict(Settings())
    current = dataclasses.asdict(settings)
    return [f"{section}.{key}" for section, values in current.items()
            for key, value in values.items() if defaults[section][key] != value]


def _summary(report) -> dict:
    """The numbers the Simulation Lab shows for one run."""
    s, m = report.scenario, report.metrics
    sc = m.get("screening") or {}
    decisions = m.get("decisions", {})
    return {
        "scenario": {"name": s.name, "mode": s.mode, "provider": s.provider, "agents": s.agents,
                     "borrowers": s.borrowers, "duration_s": s.duration_s, "answer_rate": s.answer_rate,
                     "screening": s.screening, "willing_rate": s.willing_rate, "hold_s": s.hold_s,
                     "outage": s.outage, "seed": s.seed},
        "utilization": report.utilization,
        "productive_utilization": report.productive_utilization,
        "occupancy": report.occupancy,
        "calls_initiated": m["calls_initiated"],
        "calls_answered": m["calls_answered"],
        "calls_connected": m["calls_connected"],
        "calls_completed": m["calls_completed"],
        "calls_failed": m["calls_failed"],
        "calls_abandoned": m["calls_abandoned"],
        "calls_queued": m["calls_queued"],
        "abandon_rate": m["abandon_rate"],
        "answer_rate": m["answer_rate"],
        "agent_conversations": m["agent_conversations"],
        "productive_conversations": m["productive_conversations"],
        "agent_talk_s": m["agent_talk_s"],
        "screening": sc or None,
        "decisions": decisions,
        "safety_interventions": sum(v for k, v in decisions.items() if k != "APPROVE"),
        "safety_reasons": m.get("safety_reasons", {}),
        "recovery": m.get("recovery", {}),
        "duplicate_deliveries": m.get("duplicate_deliveries", 0),
        "end_reasons": m.get("end_reasons", {}),
        "invariant_violations": report.invariant_violations,
    }
