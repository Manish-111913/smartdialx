"""Basic load test: N worker threads push M calls through the real reservation,
dial and event code against one SQLite file, then we check nobody got double booked.

    python scripts/load_test.py --agents 50 --calls 2000 --workers 8

Each call does: reserve agent+borrower, mark sending, provider initiate, mark
accepted, then ANSWERED and COMPLETED events (some delivered twice on purpose).
Wrap-up is 0 so agents go straight back into the pool.
"""

import argparse
import os
import random
import sys
import tempfile
import threading
import time

from smartdialx.clock import SystemClock
from smartdialx.config import Settings, Timeouts
from smartdialx.db import Database
from smartdialx.events import EventProcessor
from smartdialx.models import EventType, ProviderEvent
from smartdialx.providers import DialRequest, provider_a
from smartdialx.repository import Repository
from smartdialx.stats import check_invariants


def worker(path, clock, settings, provider, campaign, dup_rate, seed, totals, lock):
    repo = Repository(Database(path), clock, settings)
    events = EventProcessor(repo, {"A": provider})
    rng = random.Random(seed)
    done = errors = dups = 0
    while True:
        try:
            repo.expire_wrap_ups()
            res = repo.reserve_bound(campaign, threading.current_thread().name, "A")
            if res is None:
                left = repo.db.conn().execute(
                    "SELECT COUNT(*) FROM calls WHERE state IN ('QUEUED', 'RESERVED', 'INITIATED', 'CONNECTED')"
                ).fetchone()[0]
                if left == 0:
                    break
                time.sleep(0.001)
                continue
            if not repo.mark_sending(res):
                continue
            pcid = provider.initiate(DialRequest(res.token, res.phone, res.call_id))
            repo.mark_accepted(res, pcid)
            for n, etype in enumerate((EventType.ANSWERED, EventType.COMPLETED)):
                event = ProviderEvent(f"{pcid}:{n}", "A", pcid, res.token, etype, clock.now(), talk_seconds=1.0)
                events.handle(event)
                if rng.random() < dup_rate:
                    events.handle(event)
                    dups += 1
            done += 1
        except Exception as e:
            errors += 1
            print(f"error in {threading.current_thread().name}: {e!r}", file=sys.stderr)
    repo.db.close()
    with lock:
        totals["done"] += done
        totals["errors"] += errors
        totals["dups_sent"] += dups


def overlapping_allocations(db: Database) -> int:
    """Count calls whose agent was still busy with a previous call when they were reserved."""
    rows = db.conn().execute(
        "SELECT agent_id, reserved_at, ended_at FROM calls WHERE agent_id IS NOT NULL ORDER BY agent_id, reserved_at"
    ).fetchall()
    overlaps = 0
    last: dict[int, float] = {}
    for r in rows:
        prev_end = last.get(r["agent_id"])
        if prev_end is not None and r["reserved_at"] < prev_end:
            overlaps += 1
        last[r["agent_id"]] = r["ended_at"] or float("inf")
    return overlaps


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--agents", type=int, default=50)
    ap.add_argument("--calls", type=int, default=2000)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--dup-rate", type=float, default=0.2, help="share of events delivered twice")
    ap.add_argument("--db", help="sqlite file to use (default: temp file)")
    args = ap.parse_args()

    path = args.db or os.path.join(tempfile.mkdtemp(), "load.db")
    clock = SystemClock()
    settings = Settings(timeouts=Timeouts(wrap_up_s=0, retry_delay_s=0))
    db = Database(path)
    db.init_schema()
    repo = Repository(db, clock, settings)
    campaign = repo.create_campaign("load", "progressive", "A")
    repo.add_agents(args.agents)
    repo.add_borrowers(campaign, args.calls)
    provider = provider_a(clock, seed=1, reject_rate=0.0)

    totals = {"done": 0, "errors": 0, "dups_sent": 0}
    lock = threading.Lock()
    threads = [
        threading.Thread(target=worker, name=f"w{i}",
                         args=(path, clock, settings, provider, campaign, args.dup_rate, i, totals, lock))
        for i in range(args.workers)
    ]
    start = time.perf_counter()
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    elapsed = time.perf_counter() - start

    conn = db.conn()
    completed = conn.execute("SELECT COUNT(*) FROM calls WHERE state = 'COMPLETED'").fetchone()[0]
    deduped = conn.execute("SELECT COALESCE(SUM(deliveries - 1), 0) FROM provider_events").fetchone()[0]
    overlaps = overlapping_allocations(db)
    violations = check_invariants(db)

    print(f"agents {args.agents}, workers {args.workers}, calls {args.calls}, db {path}")
    print(f"calls processed        {totals['done']}")
    print(f"calls completed in db  {completed}")
    print(f"elapsed                {elapsed:.2f}s")
    print(f"throughput             {totals['done'] / elapsed:.0f} calls/s")
    print(f"errors                 {totals['errors']}")
    print(f"duplicate events sent  {totals['dups_sent']} (ignored by dedup: {deduped})")
    print(f"double allocations     {overlaps}")
    print(f"invariant violations   {len(violations)}")
    db.close()
    ok = totals["errors"] == 0 and overlaps == 0 and not violations and completed == args.calls
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
