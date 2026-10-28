# Architecture decisions

Short records of the choices that shaped the prototype. Each one says what we picked,
why, and what it makes harder.

## 1. SQLite as the single source of truth

Picked: one SQLite file in WAL mode, every write in a `BEGIN IMMEDIATE` transaction,
busy timeout 10s.

Why: the hard part of this problem is correctness under concurrency, and that comes
down to atomic conditional updates plus constraints. SQLite gives both, has nothing
to install, and runs the same on a reviewer's laptop. Partial unique indexes let the
schema itself refuse double bookings.

Harder: one writer at a time, one machine. Workers are threads in one process; you
can't spread them across servers. Write throughput tops out around a few hundred
call lifecycles per second on a laptop (the load test measured roughly 400 to 540).
The move to PostgreSQL is mostly mechanical, because the queries are already
written as conditional updates: `FOR UPDATE SKIP LOCKED` replaces the
`BEGIN IMMEDIATE` lock, and the same `WHERE state = ...` checks still apply.

## 2. No cache in front of the database

Picked: every tick reads a fresh snapshot. No in-memory agent or call state survives
between ticks.

Why: "the database says AVAILABLE but the cache says RESERVED" can't happen if there
isn't a cache. Where there's doubt, the database wins, and reservation correctness
never depends on a read that could be stale; it depends on the UPDATE's WHERE clause.

Harder: more queries per tick. At this scale it's nothing. At 10k agents the
snapshot would be computed from counters or by a single coordinator, not by every
worker.

## 3. Threads, not processes or async

Picked: `threading.Thread` workers, each with its own SQLite connection.

Why: the work is mostly waiting on I/O (database and provider calls), the GIL doesn't
matter much, and threads are enough to reproduce real races in tests. Nothing in the
design depends on workers sharing memory, so moving to processes or separate
machines doesn't change correctness.

Harder: real parallelism is limited by the GIL and the single SQLite writer anyway.

## 4. Safety controller is a separate component that can only say less

Picked: the pacer returns a `PacingRequest`; only `SafetyController.review()` can
create a sealed `SafetyDecision`; the allocator only accepts sealed decisions. The
controller recomputes its limits from the snapshot and ignores the pacer's estimates.

Why: the assignment's main point. If the predictive model is wrong, broken or too
optimistic, the worst it can do is ask for too many calls and be told no. The pacer
module doesn't import the allocator or any provider.

Harder: some logic exists twice (both pacer and safety look at agent counts). That's
on purpose. Python can't truly stop someone from building a fake sealed decision, so
the seal stops accidents rather than determined misuse; the real protection is that
the pacer has no path to a provider.

Rules and why they're there (numbers are assumptions in `config.py`):
- Bound calls never exceed free agents. This is the progressive guarantee.
- Unbound calls in flight never exceed 3x free agents. This is a backstop if the
  pacer goes wrong; the pacer's own model normally stays below it.
- Abandon rate above 3% over the last 200 answered calls forces progressive. It
  recovers on its own as new, safely connected calls push old abandons out.
- Fewer than 30 ring outcomes forces progressive. We don't predict without data.
- Short-window answer rate jumping well above the long-window rate forces
  progressive. A rising answer rate is the dangerous direction; a falling one only
  costs idle time, so it isn't treated as a safety event.
- Provider error rate above 50% (with at least 10 requests in the last minute)
  rejects new calls.

## 5. Predictive pacing: binomial risk with a conservative answer rate

Picked: smoothed answer rate with a prior, then the upper confidence bound (Wilson),
then the largest batch N where P(answers from in-flight + N calls > capacity) stays
under 2%. The reasoning and all inputs are stored for every decision.

Why: it's explainable in one sentence, and it answers "why 17 and not 10" with
numbers. The upper bound matters because guessing the answer rate too low is what
causes abandoned calls; guessing too high only costs idle time. The prior stops the
first few calls from swinging the estimate.

Harder: it assumes calls are independent and the recent past looks like the near
future. It also ignores agents who are about to finish a call (only agents finishing
wrap-up count as capacity). That's conservative but leaves some utilization on the
table.

## 6. Provider requests are not exactly once

Picked: every attempt gets a token. We record SENDING before calling the provider.
After a timeout or crash, recovery looks the token up at the provider instead of
redialing. The mock providers also refuse to place a second call for the same token.

Why: there is no way to make a database write and an HTTP request atomic. A timeout
tells you nothing about whether the call was placed. Redialing blindly risks calling
a borrower twice; marking it failed blindly risks a ringing phone with no agent.

Harder: depends on the provider letting us find a call by our own id (custom
parameters, idempotency keys or a lookup API). If a real provider can't do that, the
fallback is to keep the agent held until the provider's own timeout window has
passed, then treat the call as failed and hang up anything that turns up later. The
code does that after `ambiguous_give_up_s`. We don't claim exactly-once; we claim
at-most-one placed call per attempt where the provider dedupes tokens, and no blind
retries where it doesn't.

## 7. Store-then-process for events

Picked: insert the event by id (commit), then apply it in a second transaction that
also marks it processed.

Why: once stored, the event can't be lost even if we crash, so the webhook can be
acknowledged. Applying and marking processed together means a replay can't apply it
twice. Ordering problems are handled by state rank, not by trusting provider
timestamps.

Harder: a crash between the two steps leaves pending events that need a sweep
(`process_pending()`, run on every worker loop).

## 8. Leases with recovery that asks before it acts

Picked: reservations carry `worker_id` and `lease_expires_at` (30s). Recovery only
touches a reservation after its lease expires, and what it does depends on the
initiation status. Heartbeats exist but only for visibility.

Why: a lease expiring doesn't prove the worker died or that the call wasn't placed.
The lease is longer than the provider request timeout, so a live worker always
finishes or gives up first, and recovery checks with the provider before freeing
anything that might be ringing.

Harder: a crashed worker's reservation stays stuck for up to 30s. Tuning the lease is
a trade between that and false takeovers from slow workers.

## 9. Simulated clock for scenarios

Picked: the simulator drives the real code with a fake clock, one second per tick,
fixed seed.

Why: 30 minute scenarios run in about 3 seconds, results are reproducible, and tests
don't sleep. The concurrency tests and the load test use real threads and real time
instead.

Harder: the simulator is single threaded, so it shows pacing behaviour, not
contention. Contention is covered separately.

## 10. Screening as its own call path, not a flavour of predictive

Picked: a `screening` flag on the campaign, two new call states (SCREENING,
TRANSFER_PENDING), a provider event for the bot's result (SCREEN_RESULT) and one for
the bridge (TRANSFERRED), and a `ScreeningService` that does the agent hand-off. The bot
itself is a mock inside the provider.

Why: screening decides who should reach an agent; predictive decides how many calls to
start. Mixing them would hide the one thing that has to be exact: a willing borrower
gets one agent, reserved atomically, and a borrower who declined never gets one. Two
explicit states make "talking to the bot" and "waiting for an agent" visible in the
database, the reports and the invariants. Putting the conversation behind the provider
interface matches how real voice-bot platforms work and keeps a real one pluggable.

Transfers reuse the dial protocol: reserve in a transaction, mark SENDING, call the
provider outside the transaction, record the result, and reconcile by lookup after a
timeout or crash. The provider treats a repeated transfer token as a no-op, so a resend
can't bridge the borrower twice.

No agent free: hold for `hold_s`, then end politely and either call back or stop. We
never report a transfer that the provider didn't confirm. ABANDONED is not reused for
this, because the borrower wasn't left in silence; they're `no_agent_transfer` or
`caller_left_hold`.

Harder: two more states in every table and test, and the bot's outcomes are invented.
The productive-time gains in [screening.md](screening.md) depend on parameters
(willing rate, bot conversation length, how long an agent spends on a "not now" call)
that haven't been measured anywhere real.

## What I'm least confident about

- The predictive model's independence assumption. Answer rates are correlated in
  practice (time of day, list segment), which makes the 2% per-decision risk an
  underestimate. The abandon-rate breaker is what catches this, but it reacts after
  the fact.
- Real provider behaviour around lookups and idempotency. The recovery path relies on
  it and the mocks are kinder than real carriers.
- SQLite under multi-process deployment. Not tried; it's the first thing to change
  before running more than one process.

## With another week

- PostgreSQL with `SKIP LOCKED`, and run workers as separate processes.
- A real webhook endpoint (FastAPI or similar) in front of `EventProcessor.store()`.
- Predict when connected agents will free up using talk time history, so pacing can
  dial for them too, guarded by a separate cap.
- Per-borrower calling windows and attempt limits from compliance rules.
- Try it against a real provider sandbox (Plivo) to see how lookups behave.
