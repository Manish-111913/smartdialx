# SmartDialX

A small outbound dialer for collections, built for the CredResolve backend assignment.
It does progressive dialing (one free agent, one call) and predictive dialing (dial
ahead based on the answer rate), with a separate safety controller that every pacing
decision has to go through before any call is placed.

It also has an optional screening mode: a bot calls first, finds out whether the
borrower can and wants to talk, and only then transfers them to a free agent. This is
a **mock screening prototype**: the bot's conversation outcomes are simulated, and
there's no speech recognition or real voice bot. See [docs/screening.md](docs/screening.md).

All telephony is mocked. No real numbers are dialed and no credentials are needed.
Borrowers are synthetic (`+1-555-...` numbers).

## What's in here

```
smartdialx/
  README.md
  docs/
    architecture.md            components, call flow, concurrency, recovery
    state-machines.md          agent and call states, late and duplicate events
    architecture-decisions.md  what we chose and what it costs us
    scale.md                   what breaks at 1k / 10k / 100k agents
    results.md                 simulation and load test output with notes
    screening.md               screening bot -> agent transfer, and how it differs from predictive
    final-answer.md            answer to the assignment's final question
  backend/
    pyproject.toml
    src/smartdialx/
      config.py         tunable limits (all of them are assumptions, see the file)
      models.py         states, events, data types
      state_machine.py  allowed transitions, stale/late event rules
      db.py             SQLite connections, transactions, schema
      repository.py     reservations and every state change
      stats.py          snapshot for pacing/safety, metrics, invariant checks
      providers.py      provider interface, mock Provider A and B
      events.py         provider event processing (dedup, ordering, crash safe)
      pacing.py         progressive and predictive pacers
      safety.py         safety controller
      allocator.py      reserve -> dial -> record
      screening.py      hand-off from the screening bot to an agent (hold, transfer, no-agent policy)
      recovery.py       leases, ambiguous requests, stuck calls, orphan agents
      worker.py         one pipeline tick, and a worker thread loop
      simulator.py      simulated-clock scenarios
      demos.py          step-by-step failure walkthroughs
      main.py           CLI
    tests/              203 tests
    scripts/load_test.py
```

## Setup (Windows, PowerShell)

Needs Python 3.11 or newer. There are no runtime dependencies outside the standard
library; pytest is the only dev dependency.

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
```

If activation is blocked, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once.

## Running it

All commands below are run from `backend/` with the venv active.

```powershell
# tests
python -m pytest -v

# one simulated campaign
python -m smartdialx.main simulate --mode progressive
python -m smartdialx.main simulate --mode predictive --answer-rate 0.5
python -m smartdialx.main simulate --mode predictive --answer-rate 0.2 --agents 10 --calls 2000
python -m smartdialx.main simulate --scenario outage --mode predictive --timeline
python -m smartdialx.main simulate --scenario B --mode predictive --json

# screening bot first, agent only for people who say yes (mock bot)
python -m smartdialx.main simulate --mode progressive --screening
python -m smartdialx.main simulate --mode predictive --screening --timeline

# same borrowers with and without screening, both pacing modes
python -m smartdialx.main compare-screening

# every assignment scenario, both modes, side by side
python -m smartdialx.main scenarios

# walk through the failure cases (race, duplicates, out of order, crashes, outage)
python -m smartdialx.main demo

# load test
python scripts\load_test.py --agents 50 --calls 2000 --workers 8
```

Presets for `--scenario`: `A` (20% answer, 120s talk), `B` (50%, 90s), `C` (70%, 180s),
`D` (answer rate and talk time change every 10 minutes), `outage` (provider B, requests
time out between minute 10 and 15), `agent-drop` (100 agents, 40 log off at minute 10),
`screening` (40% answer; of those, 35% willing, 25% unavailable, 3% bot failures, the rest decline).

## Example output

From `python -m smartdialx.main scenarios` (seed 7, 20 agents unless noted):

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
 screening  progressive  32.7%        790        104          0     0.00%            0        0         0           0
 screening   predictive  62.7%       1435        194          0     0.00%           58        7        24           0
```

In the screening rows `connected` means transferred to an agent after saying yes; the
other answered calls were handled by the bot alone. Their utilization isn't comparable
with the other rows because the borrower population is different. `compare-screening`
does the fair comparison (same population both ways); see [docs/screening.md](docs/screening.md).

`util` is time agents spent talking divided by time they were logged in. See
[docs/results.md](docs/results.md) for what each run shows and the full single-run
report format.

## How it fits together

```
Campaign -> Pacer -> Safety Controller -> Call Allocator -> Provider
                                                              |
                         Repository (SQLite) <- Event Processor <- webhooks
```

- The pacer only proposes a number. It can't reach the allocator or a provider.
- The safety controller recomputes every limit from the database and can approve,
  reduce, reject, or force progressive mode. The allocator refuses decisions that
  didn't come from it.
- Reservations are single conditional UPDATEs inside `BEGIN IMMEDIATE` transactions,
  and partial unique indexes stop the database from ever holding two live calls for
  one agent or one borrower.
- Provider events are stored by event id first, then applied in a second transaction.
  Duplicates hit the primary key; out-of-order events are recognised by state rank.
- No transaction is held open while talking to a provider. Before a request goes out
  the call is marked SENDING, so after a crash recovery knows to ask the provider
  ("do you have request X?") instead of dialing again.

Details in [docs/architecture.md](docs/architecture.md).

## Limitations

- SQLite means one machine and one writer at a time. Fine for this prototype and a few
  hundred agents; see [docs/scale.md](docs/scale.md) for what changes after that.
- Providers are mocks. Real providers differ in whether they support idempotency keys
  or lookups by our request id; the recovery design depends on one of those existing.
- The predictive model is a binomial risk estimate with a smoothed answer rate. It
  keeps abandoned calls rare, not impossible. Only progressive mode gives a hard
  guarantee.
- Every threshold in `config.py` is our own assumption, not a regulatory number.
  Real limits need to come from compliance and be validated on real campaign data.
- The simulator uses a fake clock. Talk times, ring times and answer behaviour come
  from simple distributions, not real call data.
- There's no API server or UI. The CLI, simulator and tests are the interface.
- Screening is simulated. Outcomes come from fixed probabilities, not a conversation.
  A real voice-bot provider would need to support screening calls, report a result,
  and accept a transfer request identified by our token.
- Agents are one shared pool. Capacity checks count free agents globally, which is
  right for one campaign per pool but would over-count if several campaigns shared the
  same agents.

## Responsible calling

Only synthetic numbers and mock providers are used. Consent outcomes are explicit: a
borrower the bot records as declined is never transferred and never called again, and
retries are capped by `max_attempts`. Running anything like this for real needs
recorded consent to be contacted, opt-out handling across campaigns, calling-hour
rules, call-recording disclosures, privacy safeguards, and legal and regulatory review
for each market.
