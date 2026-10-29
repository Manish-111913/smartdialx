"""SQLite connections, transactions and schema.

Each thread gets its own connection. Writes go through `transaction()`, which starts
with BEGIN IMMEDIATE so the write lock is taken up front: two writers can't both read
"agent 7 is AVAILABLE" inside their transactions and then both update it. On top of
that every UPDATE filters on the expected old state, so correctness doesn't depend on
the lock mode alone.
"""

import sqlite3
import threading
from collections.abc import Iterator
from contextlib import contextmanager

SCHEMA = """
CREATE TABLE IF NOT EXISTS campaigns (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    mode          TEXT NOT NULL CHECK (mode IN ('progressive', 'predictive')),
    provider      TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'PAUSED', 'STOPPED')),
    max_attempts  INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
    screening     INTEGER NOT NULL DEFAULT 0,
    description   TEXT,
    -- mock audience for the console (see console.AUDIENCES); NULL = provider defaults
    audience      TEXT,
    -- per-campaign overrides of ScreeningSettings; NULL = use the global setting
    hold_s        REAL,
    no_agent_policy TEXT CHECK (no_agent_policy IN ('callback', 'end')),
    created_at    REAL NOT NULL,
    updated_at    REAL
);

CREATE TABLE IF NOT EXISTS agents (
    id               INTEGER PRIMARY KEY,
    name             TEXT NOT NULL UNIQUE,
    state            TEXT NOT NULL CHECK (state IN
                     ('OFFLINE', 'AVAILABLE', 'RESERVED', 'DIALING', 'CONNECTED', 'WRAP_UP', 'PAUSED')),
    current_call_id  INTEGER,
    wrap_up_until    REAL,
    -- operator asked for a pause; applied once the agent is off its current call
    pause_requested  INTEGER NOT NULL DEFAULT 0,
    version          INTEGER NOT NULL DEFAULT 0,
    updated_at       REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS agents_by_state ON agents(state, updated_at);

CREATE TABLE IF NOT EXISTS borrowers (
    id           INTEGER PRIMARY KEY,
    campaign_id  INTEGER NOT NULL REFERENCES campaigns(id),
    name         TEXT NOT NULL,
    phone        TEXT NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0,
    outcome      TEXT
);

CREATE TABLE IF NOT EXISTS calls (
    id                INTEGER PRIMARY KEY,
    campaign_id       INTEGER NOT NULL REFERENCES campaigns(id),
    borrower_id       INTEGER NOT NULL REFERENCES borrowers(id),
    agent_id          INTEGER REFERENCES agents(id),
    attempt           INTEGER NOT NULL DEFAULT 1,
    state             TEXT NOT NULL CHECK (state IN
                      ('QUEUED', 'RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING',
                       'TRANSFER_PENDING', 'CONNECTED', 'COMPLETED', 'FAILED', 'CANCELLED', 'ABANDONED')),
    bound             INTEGER NOT NULL DEFAULT 1,
    screening         INTEGER NOT NULL DEFAULT 0,
    provider          TEXT,
    dial_token        TEXT UNIQUE,
    provider_call_id  TEXT UNIQUE,
    initiation        TEXT NOT NULL DEFAULT 'NOT_SENT' CHECK (initiation IN
                      ('NOT_SENT', 'SENDING', 'ACCEPTED', 'REJECTED', 'UNKNOWN')),
    worker_id         TEXT,
    lease_expires_at  REAL,
    not_before        REAL NOT NULL DEFAULT 0,
    end_reason        TEXT,
    ring_result       TEXT,
    ring_result_at    REAL,
    talk_seconds      REAL,
    screen_result     TEXT CHECK (screen_result IN ('willing', 'unavailable', 'declined', 'failed')),
    screen_result_at  REAL,
    hold_until        REAL,
    transfer_token    TEXT UNIQUE,
    transfer_status   TEXT CHECK (transfer_status IN ('SENDING', 'ACCEPTED', 'UNKNOWN')),
    transfer_attempts INTEGER NOT NULL DEFAULT 0,
    transfer_lease_expires_at REAL,
    transfer_requested_at REAL,
    created_at        REAL NOT NULL,
    reserved_at       REAL,
    sending_at        REAL,
    initiated_at      REAL,
    answered_at       REAL,
    connected_at      REAL,
    ended_at          REAL,
    last_event_at     REAL,
    updated_at        REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS calls_queue ON calls(campaign_id, state, not_before, id);
CREATE INDEX IF NOT EXISTS calls_ring ON calls(campaign_id, ring_result_at);
CREATE INDEX IF NOT EXISTS calls_answered ON calls(campaign_id, answered_at);
CREATE INDEX IF NOT EXISTS calls_started ON calls(sending_at);
CREATE INDEX IF NOT EXISTS calls_connected ON calls(connected_at);
CREATE INDEX IF NOT EXISTS calls_ended ON calls(ended_at);

-- the database itself refuses a second live call for the same borrower or agent
CREATE UNIQUE INDEX IF NOT EXISTS one_live_call_per_borrower ON calls(borrower_id)
    WHERE state IN ('QUEUED', 'RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING',
                    'TRANSFER_PENDING', 'CONNECTED');
CREATE UNIQUE INDEX IF NOT EXISTS one_live_call_per_agent ON calls(agent_id)
    WHERE agent_id IS NOT NULL
      AND state IN ('RESERVED', 'INITIATED', 'RINGING', 'ANSWERED', 'SCREENING', 'TRANSFER_PENDING', 'CONNECTED');
CREATE INDEX IF NOT EXISTS calls_transfers ON calls(state, hold_until) WHERE state = 'TRANSFER_PENDING';

CREATE TABLE IF NOT EXISTS provider_events (
    event_id          TEXT PRIMARY KEY,
    provider          TEXT NOT NULL,
    provider_call_id  TEXT,
    dial_token        TEXT,
    event_type        TEXT NOT NULL,
    occurred_at       REAL,
    talk_seconds      REAL,
    reason            TEXT,
    received_at       REAL NOT NULL,
    deliveries        INTEGER NOT NULL DEFAULT 1,
    processed_at      REAL,
    call_id           INTEGER,
    outcome           TEXT,
    note              TEXT
);
CREATE INDEX IF NOT EXISTS events_pending ON provider_events(received_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS events_received ON provider_events(received_at);
CREATE INDEX IF NOT EXISTS events_by_call ON provider_events(call_id);

CREATE TABLE IF NOT EXISTS provider_requests (
    id          INTEGER PRIMARY KEY,
    provider    TEXT NOT NULL,
    call_id     INTEGER NOT NULL,
    dial_token  TEXT NOT NULL,
    sent_at     REAL NOT NULL,
    result      TEXT CHECK (result IN ('accepted', 'rejected', 'timeout')),
    error       TEXT
);
CREATE INDEX IF NOT EXISTS provider_requests_recent ON provider_requests(provider, sent_at);

CREATE TABLE IF NOT EXISTS decisions (
    id              INTEGER PRIMARY KEY,
    campaign_id     INTEGER NOT NULL,
    at              REAL NOT NULL,
    mode            TEXT NOT NULL,
    requested       INTEGER NOT NULL,
    approved        INTEGER NOT NULL,
    action          TEXT NOT NULL,
    bound           INTEGER NOT NULL,
    started         INTEGER,
    reasoning       TEXT,
    safety_reasons  TEXT,
    inputs          TEXT
);
CREATE INDEX IF NOT EXISTS decisions_by_time ON decisions(at);
CREATE INDEX IF NOT EXISTS decisions_by_campaign ON decisions(campaign_id, id);

CREATE TABLE IF NOT EXISTS recovery_log (
    id        INTEGER PRIMARY KEY,
    at        REAL NOT NULL,
    call_id   INTEGER,
    agent_id  INTEGER,
    action    TEXT NOT NULL,
    detail    TEXT
);
CREATE INDEX IF NOT EXISTS recovery_by_time ON recovery_log(at);

-- operator actions from the console (pause a campaign, inject a fault, ...)
CREATE TABLE IF NOT EXISTS audit_log (
    id       INTEGER PRIMARY KEY,
    at       REAL NOT NULL,
    action   TEXT NOT NULL,
    subject  TEXT,
    detail   TEXT
);

-- agent state counts sampled by the console every few seconds; utilization and the
-- availability history are computed from these
CREATE TABLE IF NOT EXISTS agent_samples (
    at         REAL PRIMARY KEY,
    available  INTEGER NOT NULL,
    reserved   INTEGER NOT NULL,
    dialing    INTEGER NOT NULL,
    connected  INTEGER NOT NULL,
    wrap_up    INTEGER NOT NULL,
    paused     INTEGER NOT NULL,
    offline    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workers (
    id              TEXT PRIMARY KEY,
    started_at      REAL NOT NULL,
    last_heartbeat  REAL NOT NULL,
    status          TEXT NOT NULL
);
"""


class Database:
    def __init__(self, path: str, busy_timeout_s: float = 10.0):
        self.path = path
        self.busy_timeout_s = busy_timeout_s
        self._local = threading.local()
        # an in-memory db can't be shared between connections, so all threads use
        # one connection behind a lock. Concurrency tests must use a file.
        self._memory = path == ":memory:"
        self._shared: sqlite3.Connection | None = None
        self._mem_lock = threading.RLock()

    def _open(self) -> sqlite3.Connection:
        conn = sqlite3.connect(
            self.path,
            timeout=self.busy_timeout_s,
            isolation_level=None,  # we issue BEGIN/COMMIT ourselves
            check_same_thread=not self._memory,
        )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        if not self._memory:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA synchronous = NORMAL")
        return conn

    def conn(self) -> sqlite3.Connection:
        if self._memory:
            if self._shared is None:
                self._shared = self._open()
            return self._shared
        conn = getattr(self._local, "conn", None)
        if conn is None:
            conn = self._open()
            self._local.conn = conn
        return conn

    def init_schema(self) -> None:
        with self._mem_lock if self._memory else _nullcontext():
            self.conn().executescript(SCHEMA)

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        """Write transaction. Nested calls join the outer transaction."""
        depth = getattr(self._local, "depth", 0)
        if depth:
            self._local.depth = depth + 1
            try:
                yield self.conn()
            finally:
                self._local.depth -= 1
            return

        lock = self._mem_lock if self._memory else _nullcontext()
        with lock:
            conn = self.conn()
            conn.execute("BEGIN IMMEDIATE")
            self._local.depth = 1
            try:
                yield conn
            except BaseException:
                conn.execute("ROLLBACK")
                raise
            else:
                conn.execute("COMMIT")
            finally:
                self._local.depth = 0

    @contextmanager
    def read(self) -> Iterator[sqlite3.Connection]:
        """Read-only snapshot: all queries inside see the same committed state."""
        if getattr(self._local, "depth", 0):
            yield self.conn()
            return
        lock = self._mem_lock if self._memory else _nullcontext()
        with lock:
            conn = self.conn()
            conn.execute("BEGIN")
            try:
                yield conn
            finally:
                conn.execute("COMMIT")

    def close(self) -> None:
        conn = getattr(self._local, "conn", None)
        if conn is not None:
            conn.close()
            self._local.conn = None
        if self._shared is not None:
            self._shared.close()
            self._shared = None


@contextmanager
def _nullcontext():
    yield
