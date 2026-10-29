# SmartDialX

This is an outbound dialer for a collections team, built for the CredResolve backend
assignment. It places calls for a campaign, decides how many to place at a time, and
makes sure every answered call has an agent waiting for it.

There are two ways to pace calls:

- **Progressive**: one free agent, one call. Nobody is ever left on the line without an
  agent, but agents sit idle while phones ring.
- **Predictive**: dial a few more calls than there are free agents, based on how often
  people actually pick up. Agents stay busier, at the risk of the occasional answered
  call with no one to take it.

Whatever the pacer wants, a separate safety controller gets the final say. It looks at
the database, not at the pacer's maths, and can approve the request, cut it down, block
it, or force the campaign back to progressive.

There's also an optional screening mode. A bot calls first, asks whether the person can
talk, and only the people who say yes are handed to an agent. To be clear about what this
is: the bot is a mock. Its answers are random draws with fixed odds. There's no speech
recognition and no real voice bot anywhere in the code. [docs/screening.md](docs/screening.md)
explains how it works and how it compares with plain predictive dialing.

Nothing here dials a real phone. Both telecom providers are mocks, every borrower is made
up (`+1-555-...` numbers), and you don't need any credentials.

On top of the backend there's a web console (Next.js + Tailwind) where you can watch it
run and poke at it: pause agents, create campaigns, change limits, break a provider on
purpose and see what recovery does about it.

## Quick start

You need Python 3.11+ and Node 20+. On Windows, in PowerShell:

```powershell
# backend, first time only
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"

# start the live console API (leave this running)
python -m smartdialx.main serve
```

Then in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. If PowerShell refuses to activate the venv, run
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once and try again.

Every time `serve` starts it builds a fresh little world: 12 agents, 4 campaigns and 780
borrowers. It then plays back the last 20 minutes in about four seconds so the screens
have something to show, and after that it runs in real time. If you'd rather carry on
from where you stopped last time, use `serve --keep`.

The backend has no dependencies outside the Python standard library. pytest is the only
dev dependency.

## What you can do in the console

| Screen | What it's for |
|---|---|
| Overview | Screening funnel, agent states, call activity, system health, recent events |
| Campaigns | Create, edit, pause, resume, duplicate and stop campaigns |
| Live Operations | Every live and recent call, with a full timeline for each one |
| Agents | Agent states, pause someone now or after their current call, add agents |
| Pacing & Safety | Switch a campaign's mode, tune limits, read every safety decision and why |
| Provider Monitoring | Compare the two mock providers and inject faults into either one |
| Simulation Lab | Run a scenario in an isolated world and compare all four strategies |
| Event Logs & Recovery | Every provider event, how it was handled, and what recovery fixed |
| Settings | Every limit the engine uses, plus a button to reset the demo data |

All numbers on these screens come from the backend. The frontend has no sample data of
its own, and if the backend isn't running it tells you so.

## Command line

Everything also works without the console. Run these from `backend/` with the venv active.

```powershell
# tests (241 of them)
python -m pytest -v

# one simulated campaign
python -m smartdialx.main simulate --mode progressive
python -m smartdialx.main simulate --mode predictive --answer-rate 0.5
python -m smartdialx.main simulate --mode predictive --answer-rate 0.2 --agents 10 --calls 2000
python -m smartdialx.main simulate --scenario outage --mode predictive --timeline
python -m smartdialx.main simulate --scenario B --mode predictive --json

# screening bot first, agents only for people who say yes
python -m smartdialx.main simulate --mode progressive --screening
python -m smartdialx.main simulate --mode predictive --screening --timeline

# the same borrowers with and without screening, in both modes
python -m smartdialx.main compare-screening

# every assignment scenario in both modes, side by side
python -m smartdialx.main scenarios

# step through the failure cases (races, duplicates, out-of-order events, crashes, outage)
python -m smartdialx.main demo

# load test
python scripts\load_test.py --agents 50 --calls 2000 --workers 8
```

The `--scenario` presets:

- `A`: 20% answer rate, 120s talk time
- `B`: 50%, 90s
- `C`: 70%, 180s
- `D`: answer rate and talk time change every 10 minutes
- `outage`: provider B, requests time out between minute 10 and 15
- `agent-drop`: 100 agents, 40 of them log off at minute 10
- `screening`: 40% answer; of those, 35% willing, 25% can't talk now, 3% bot failures,
  the rest decline

## Results

This is `python -m smartdialx.main scenarios` with seed 7 and 20 agents (unless the
scenario says otherwise):

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

`util` is the time agents spent talking divided by the time they were logged in.

A note on the screening rows: there, `connected` means someone said yes to the bot and was
handed to an agent. Everyone else who answered was dealt with by the bot alone. That's a
different group of people from the other rows, so don't compare their utilization
directly. `compare-screening` does the fair version, with the same borrowers both ways.

[docs/results.md](docs/results.md) goes through what each run shows and explains the full
report format.

## How it works

```
Campaign -> Pacer -> Safety Controller -> Call Allocator -> Provider
                                                              |
                         Repository (SQLite) <- Event Processor <- webhooks
```

A few rules hold everything together:

- The pacer only suggests a number. It has no way to reach the allocator or a provider.
- The safety controller works out every limit again from the database. The allocator
  refuses any decision that didn't come from it.
- Reserving an agent or a borrower is a single conditional `UPDATE` inside a
  `BEGIN IMMEDIATE` transaction. On top of that, partial unique indexes make it impossible
  for the database to hold two live calls for the same agent or the same borrower.
- Provider events are saved by their event id first and applied in a second transaction.
  A duplicate hits the primary key and changes nothing. An event that arrives out of order
  is spotted by comparing how far along the call already is.
- No transaction stays open while we wait on a provider. Before a request goes out, the
  call is marked SENDING. If the process dies at that moment, recovery asks the provider
  "do you have request X?" instead of dialing the person a second time.

The console (`console.py`) runs the same pipeline once a second for every running campaign,
against one SQLite file and both mock providers. The API on top of it is plain
`http.server`. [docs/architecture.md](docs/architecture.md) has the full picture and
[docs/api.md](docs/api.md) lists the endpoints.

## What's where

```
smartdialx/
  README.md
  docs/
    architecture.md            components, call flow, concurrency, recovery
    state-machines.md          agent and call states, late and duplicate events
    architecture-decisions.md  the choices made and what each one costs
    scale.md                   what breaks at 1k, 10k and 100k agents
    results.md                 simulation and load test output, with notes
    screening.md               bot-to-agent transfer, and how it differs from predictive
    final-answer.md            answer to the assignment's final question
    api.md                     the console's HTTP API
  frontend/                    Next.js + Tailwind console, see frontend/README.md
  backend/
    pyproject.toml
    src/smartdialx/
      config.py         every tunable limit (all of them assumptions, see the file)
      models.py         states, events, data types
      state_machine.py  allowed transitions, rules for stale and late events
      db.py             SQLite connections, transactions, schema
      repository.py     reservations and every state change
      stats.py          snapshot for pacing and safety, metrics, invariant checks
      providers.py      provider interface, mock providers A and B
      events.py         provider event handling (duplicates, ordering, crash safety)
      pacing.py         progressive and predictive pacers
      safety.py         safety controller
      allocator.py      reserve, dial, record
      screening.py      handing a screened borrower to an agent (hold, transfer, no-agent policy)
      recovery.py       leases, ambiguous requests, stuck calls, orphaned agents
      worker.py         one pipeline tick, and the worker thread loop
      simulator.py      scenarios on a simulated clock
      demos.py          step-by-step failure walkthroughs
      console.py        live engine behind the web console
      views.py          read queries for the API
      api.py            JSON API
      main.py           command line
    tests/              241 tests
    scripts/load_test.py
```

## Limitations

These are the parts I'd want a reviewer to know about up front.

- SQLite means one machine and one writer at a time. That's fine for this prototype and a
  few hundred agents. [docs/scale.md](docs/scale.md) covers what would have to change
  beyond that.
- The providers are mocks. Real providers differ in whether they accept an idempotency key
  or let you look a call up by your own request id, and the recovery design needs one of
  those two to exist.
- Predictive pacing uses a binomial risk estimate on a smoothed answer rate. It keeps
  abandoned calls rare, not impossible. Only progressive mode can promise zero.
- Every threshold in `config.py` is my own assumption, not a regulatory figure. Real limits
  have to come from compliance and be checked against real campaign data.
- The simulator runs on a fake clock. Ring times, talk times and who answers all come from
  simple random distributions, not real call data.
- Screening outcomes are random draws with fixed odds, not conversations. A real voice-bot
  provider would need to support screening calls, report a result, and accept a transfer
  request identified by our token.
- Agents are one shared pool. Capacity checks count free agents across the whole pool,
  which is right when one campaign uses the pool but over-counts when several campaigns
  share it, as they do in the console. Reservations stay correct (an agent is never booked
  twice). What suffers is pacing accuracy, and it's the safety controller's abandon-rate
  and transfer-failure limits that catch it.
- The console API is a local demo server. There's no login, it only listens on localhost,
  and it runs as one process. It isn't meant to be exposed to a network.

## Responsible calling

Only synthetic numbers and mock providers are used. Consent is handled explicitly: if the
bot records someone as having declined, they're never transferred and never called again,
and retries stop at `max_attempts`. Running anything like this for real would need recorded
consent to contact people, opt-outs that work across campaigns, calling-hour rules,
call-recording notices, privacy safeguards, and a legal and regulatory review for each
market.
