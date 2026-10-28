# Results

Everything below was produced by the commands shown, on a Windows laptop with
Python 3.11.9. Simulations use seed 7 and a simulated clock, so rerunning gives the
same numbers. Load test numbers depend on the machine.

## Scenario comparison

`python -m smartdialx.main scenarios`

```
  scenario         mode   util  initiated  connected  abandoned  abandon%  forced_prog  reduced  rejected  violations
         A  progressive  46.7%        792        149          0     0.00%            0        0         0           0
         A   predictive  67.0%       1104        209          3     1.42%          132      110       132           0
         B  progressive  65.6%        574        275          0     0.00%            0        0         0           0
         B   predictive  71.9%        635        302          1     0.33%          156        8        57           0
         C  progressive  85.0%        274        181          0     0.00%            0        0         0           0
         C   predictive  87.5%        276        183          0     0.00%          168        3       178           0
         D  progressive  60.9%        818        278          0     0.00%            0        0         0           0
         D   predictive  67.5%        953        316          7     2.17%         1280       49        63           0
    outage  progressive  53.2%        518        220          0     0.00%            0        4        82           0
    outage   predictive  56.6%        560        236          0     0.00%           54        1        31           0
agent-drop  progressive  65.2%       2124       1009          0     0.00%            0        0         0           0
agent-drop   predictive  73.7%       2368       1135         10     0.87%          299       17        17           0
```

Columns: `util` = talking time / logged-in time. `forced_prog`, `reduced`, `rejected`
count safety controller decisions. `violations` = invariant check at the end of the
run (agent or borrower with two live calls, agent busy on a finished call, connected
call without its agent).

What it shows:

- Progressive never abandons a call, in any scenario. That's structural: every call
  has an agent reserved before it's dialed.
- Predictive helps most when the answer rate is low. At 20% (A) agents in progressive
  mode spend most of their time waiting on calls nobody picks up; predictive raises
  utilization from 46.7% to 67.0% for a 1.42% abandon rate. At 70% (C) there's little
  to gain, since agents are already busy 85% of the time. The safety controller rejects
  most predictive requests there because there are rarely free agents.
- Every predictive run starts in progressive mode (`cold_start`) until it has 30 ring
  outcomes to estimate from.
- No invariant violations in any run.

## Scenario D: answer rate changes mid-run

`python -m smartdialx.main simulate --scenario D --mode predictive --timeline`

The answer rate goes 50% -> 20% at 600s -> 70% at 1200s -> 30% at 1800s.

```
   t  available  talking  requested  approved             action   p_hat  p_safe  answer_rate_now
 600          4       14          0         0            APPROVE  0.4318  0.4654              0.2
 720         10       10          0         0            APPROVE  0.3455  0.3781              0.2
 900          4       16          0         0            APPROVE  0.1591  0.1853              0.2
1200          0       15          1         0  FORCE_PROGRESSIVE  0.2182  0.2473              0.7
1500          0       18          0         0  FORCE_PROGRESSIVE    0.35  0.3828              0.7
1800          0       18          1         1  FORCE_PROGRESSIVE  0.4545  0.4882              0.3
2400          0       10          3         1  FORCE_PROGRESSIVE  0.3364  0.3689              0.3
```

- When the rate drops to 20%, the estimate follows within about five minutes (200
  outcome window). Until it catches up, the pacer under-dials. That's the safe
  direction: it costs utilization, not abandons.
- When the rate jumps to 70%, the pacer is still planning with about 25%. Answers come
  in faster than agents free up, and 7 calls are abandoned. The safety controller then
  forces progressive (`answer_rate_jump` 80 ticks, then `abandon_rate` for the rest of
  the run).
- The abandon breaker uses the last 200 answered calls. 7 abandons out of 200 is 3.5%,
  above the 3% limit, so it stays in progressive until enough clean calls push them
  out of the window. With 20 agents that takes longer than the remaining 20 minutes.
  This is the intended trade: once the model has been wrong, it has to earn its way
  back.

This scenario is the honest weak spot of predictive pacing. A sudden jump in answer
rate costs a handful of abandons before the controls react. Progressive mode doesn't
have this problem.

## Provider outage

`python -m smartdialx.main simulate --scenario outage --mode predictive`

Provider B (slow, 5% timeouts, 15% duplicate events, events reordered by up to 4s);
every request times out between 600s and 900s.

```
  provider requests                      accepted 476, rejected 16, timeout 68
  end reasons                            no_answer 238, completed 220, not_placed 34, busy 25, provider_rejected 16, network 8
  events                                 applied 1204, stale 510, duplicate deliveries 268
  safety decisions                       APPROVE 379, FORCE_PROGRESSIVE 54, REDUCE 1, REJECT 31
  safety reasons                         cold_start 54, provider_unhealthy 92, overdial_cap 3
  recovery actions                       not_placed 34
  invariant violations                   0
```

- Existing calls kept going; their events still arrived during the outage.
- New calls: each timed-out request kept its agent held, then the breaker tripped
  (`provider_unhealthy` in 92 decisions) and blocked new dialing.
- 68 timeouts were never redialed blindly. The ones the provider had actually placed
  were adopted when their events arrived. The 34 it hadn't were confirmed `not_placed`
  by recovery and requeued as normal retries.
- 268 duplicate deliveries were ignored by event id. 510 stale events (mostly the
  provider's INITIATED confirmation arriving after we'd recorded acceptance, plus
  reordered RINGING) changed nothing.

## Agent drop

`python -m smartdialx.main simulate --scenario agent-drop --mode predictive`

100 agents, 40 log off at 600s.

```
  end reasons     ... agent_left 35, no_agent 10
  agent drop at 600s   staffed now 60, next decision: APPROVE 0/0 with 10 free
```

The very next tick (1 simulated second later) already used the new agent count. The
pacer saw it had more calls ringing than the remaining capacity could absorb and
asked for 0. 35 calls that belonged to departing agents were cancelled and requeued
(`agent_left`). 10 calls were abandoned over the whole 30 minute run (0.87%).

## Failure walkthroughs

`python -m smartdialx.main demo`

```
== two workers grab the same agent at the same moment ==========
8 threads tried, 1 got the agent (worker-1)

== ANSWERED, ANSWERED, ANSWERED, COMPLETED =====================
same event id three times: ['applied', 'duplicate', 'duplicate']
  -> call=CONNECTED reason=None agent=CONNECTED
new ids, same meaning: ['stale', 'stale']
COMPLETED: applied
  -> call=COMPLETED reason=completed agent=WRAP_UP

== COMPLETED, ANSWERED, RINGING ================================
COMPLETED  applied
ANSWERED   late
RINGING    late
  -> call=COMPLETED reason=completed agent=WRAP_UP

== worker crashes right after ANSWERED is stored, then COMPLETED arrives
crashed after storing ANSWERED -> call=INITIATED reason=None agent=DIALING
COMPLETED arrives: applied -> call=COMPLETED reason=completed agent=WRAP_UP
restart, process leftovers: ['late']

== agent reserved > borrower reserved > call initiated > worker crashes
crashed after provider accepted; db says initiation=SENDING -> call=RESERVED reason=None agent=DIALING
recovery after lease expiry: [('adopted', 1)]
  -> call=INITIATED reason=None agent=DIALING
provider placed 1 request(s); no second dial was sent

== provider times out, then comes back =========================
initiate timed out: initiation=UNKNOWN -> call=RESERVED reason=None agent=DIALING (agent held, not freed)
recovery during outage: 1 deferred
recovery after outage: [('adopted', 1)] -> call=INITIATED reason=None agent=DIALING

== mock screening bot: two say yes with one agent free, one says no
3 bot calls placed with 1 agent; agent is AVAILABLE (not held during screening)
both willing borrowers are on hold; transfer run: TransferReport(sent=1, rejected=0, ambiguous=0, no_agent=0, blocked=0, waiting=1)
   call 1: TRANSFER_PENDING agent=None reason=None | call 2: CONNECTED agent=1 reason=None
hold runs out for the one still waiting: TransferReport(sent=0, rejected=0, ambiguous=0, no_agent=1, blocked=0, waiting=0)
   call 1: FAILED agent=None reason=no_agent_transfer | call 2: CONNECTED agent=1 reason=None
borrower 3 declines -> COMPLETED reason=screen_declined screen_result=declined, no transfer, no retry

== worker crashes right after the provider accepted the transfer
crashed: transfer_status=SENDING agent=RESERVED
recovery: [('transfer_adopted', 1)] -> call=CONNECTED reason=None agent=CONNECTED
provider transfers performed: 1
```

## Screening (mock bot)

`python -m smartdialx.main simulate --scenario screening --mode predictive`

```
  agent utilization (talking / staffed)  62.7%
  productive utilization                 60.5%
  abandoned                              0 (0.00% of answered)
  safety reasons                         cold_start 58, screening_overdial_cap 87, transfer_backlog 41
  invariant violations                   0

  screening
    bot calls attempted / answered       1435 / 542
    willing / unavailable / declined     196 / 120 / 197
    no answer / busy                     793 / 73
    screening failed / provider failures 15 / 10
    transfer attempts                    194
    connected to an agent                194 (avg hold 1.0s)
    willing but no agent in time         2
    hung up while on hold                0
    transfers blocked by safety          0
```

The same preset in progressive mode connected 104 willing borrowers with 0 left
unserved (the progressive cap guarantees an agent for every bot call in flight), at
32.7% utilization.

`python -m smartdialx.main compare-screening` runs both pacing modes with and without
screening on the same borrower population. Full table and caveats in
[screening.md](screening.md). Summary: with predictive pacing, screening raised
productive utilization (agent time with people who wanted to talk) from 39.5% to 54.4%
at a 20% answer rate and from 47.2% to 59.4% at 50%. With progressive pacing it made
things slightly worse (25.2% -> 22.3% at 20%), because bot time adds to agent idle
time when you never dial ahead. These are mock-population numbers, not a forecast.

## Load test

`python scripts\load_test.py --agents 50 --calls 2000 --workers 8`

```
calls processed        2000
calls completed in db  2000
elapsed                4.42s
throughput             452 calls/s
errors                 0
duplicate events sent  817 (ignored by dedup: 817)
double allocations     0
invariant violations   0
```

`python scripts\load_test.py --agents 10 --calls 3000 --workers 16` (heavy contention)

```
calls processed        3000
elapsed                7.52s
throughput             399 calls/s
errors                 0
duplicate events sent  1252 (ignored by dedup: 1252)
double allocations     0
invariant violations   0
```

Throughput varies between runs on the same laptop (earlier runs measured 310 to 540
calls/s); the zero counts don't.

Each call here is a full lifecycle: about 8 write transactions (reserve, sending,
accepted, two events stored and processed, wrap-up expiry). So that's roughly 3,000 to
4,000 SQLite write transactions a second through one lock, with zero think time.

One thing the load test caught: the first version read the clock before taking the
write lock, so a call's `reserved_at` could be earlier than the previous call's
`ended_at` on the same agent. The overlap check reported 3 "double allocations" that
weren't real (the database constraints and invariants were clean). Reading the clock
inside the transaction fixed the timestamps, and the check now reports 0.

## Tests

`python -m pytest -v`: 203 passed in about 35s. That includes 30 screening tests, the
worker thread loop running real campaigns with three threads in each mode, and the
concurrency tests for agents, borrowers, the over-dial budget and transfers.
