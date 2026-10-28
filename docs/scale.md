# Scale: 100 -> 1,000 -> 10,000 agents

## How much load an agent creates

Rough numbers for a collections campaign with a 20% answer rate, 120s talk time and
10s wrap-up:

- each agent finishes about one connected call every 130 to 150s
- at 20% answer rate that takes about 5 dial attempts per connected call
- so about 0.035 call attempts per second per agent

Each attempt in this design costs around 8 SQLite write transactions (reserve,
sending, accepted, 3 to 4 events each stored then processed, agent release), plus
duplicate deliveries and one snapshot read per worker per tick.

| Agents | Attempts/s | Write tx/s (approx.) | Provider events/s |
|---|---|---|---|
| 100 | 3.5 | 30 | 12 |
| 1,000 | 35 | 300 | 120 |
| 10,000 | 350 | 3,000 | 1,200 |
| 100,000 | 3,500 | 30,000 | 12,000 |

The load test sustained about 3,000 to 4,000 write transactions a second on a
laptop, but with zero think time, no network hop and one process. Those numbers are
best case.

## What breaks first

### 1. The single SQLite write lock (somewhere between 1,000 and 10,000)

Everything that changes state goes through one lock: reservations, every provider
event, wrap-up expiry, heartbeats. At 1,000 agents average load fits, but load isn't
average. Answers cluster, and a burst of webhooks queues behind reservations. Every
writer waits its turn, so reservation latency grows with event volume even though
they touch different rows. SQLite also can't be shared safely by processes on
different machines, so we can't add servers at all.

Why first: it's the one resource every operation shares, and it doesn't care which
rows you touch.

Fix: PostgreSQL. Row-level locks mean reserving agent 7 doesn't wait for an event on
call 9000. Claiming queued calls becomes
`SELECT ... FOR UPDATE SKIP LOCKED LIMIT n`, so workers don't queue behind each other
for the same rows. The conditional UPDATEs and partial unique indexes carry over
unchanged. This also lets workers run as separate processes and machines.

### 2. Every worker paces the same campaign (around 1,000)

Today each worker takes its own snapshot and makes its own pacing decision. With N
workers on one campaign that's N times the snapshot queries, and N decisions racing
for the same capacity. It stays safe, because reservations are atomic and the
over-dial cap is re-checked inside the reservation transaction, but it's wasteful and
makes decisions jumpy: N workers each see 10 free agents and each try to fill them.

Fix: one pacing leader per campaign (a Postgres advisory lock or a lease row). It
computes the decision once per tick and writes a dial budget; workers just claim
from the budget. Safety stays in the same place, between the pacer and the budget.

### 3. Snapshot queries (around 10,000)

`take_snapshot` counts agents by state and calls by state, and scans the last 200
outcomes. Cheap with indexes at 100 agents, but at 10k agents with many campaigns,
running it every second for every campaign adds up, and COUNT(*) over a hot table
fights with the writes.

Fix: keep counters (free agents per pool, unbound in flight per campaign) updated in
the same transaction as the state change, and read those. Outcome windows can be a
small ring buffer per campaign.

### 4. Webhook ingestion (around 10,000)

1,200 events a second, arriving in bursts, each one a store plus a process
transaction. The two-step design already separates "accept it" from "apply it".

Fix: the webhook endpoint only does the store (or puts the event on a queue such as
SQS or Kafka partitioned by call id, which keeps per-call order and allows replay).
Appliers read from that. This is the first point where adding a queue is justified
by load, not by fashion.

### 5. Provider limits (10,000 and up)

Real carriers cap calls per second per trunk and per number. At 350 attempts a
second you're at or past typical limits, and if 10,000 agents' calls all go through
one provider, an outage of that provider stops everything.

Fix: a per-provider rate limit in the safety controller, several providers with
routing, and per-provider circuit breakers (the current breaker is per campaign's
provider).

### 6. One agent pool (100,000)

Agents in one table, one database. At this size you shard: by region, business line
or campaign group, each shard with its own database, workers and agent pool. The
cost is that agents can't be shared across shards without a coordination layer.

## What doesn't change

- The safety boundary: pacer proposes, controller disposes, allocator only takes
  sealed decisions.
- Atomic conditional updates and unique constraints as the guarantee against double
  booking. Faster databases make them cheaper, not unnecessary.
- Store-then-process for events, and SENDING/lookup before redialing. These matter
  more with more machines, not less.

## 100,000 agents, first thing

The single database. Before that, provider throughput limits. "Add servers" doesn't
help with either. The first needs the data split by shard; the second needs more
carrier capacity and routing.
