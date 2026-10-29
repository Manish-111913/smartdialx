# Console API

This is the API the web console talks to. You start it with
`python -m smartdialx.main serve`, and the code is in `backend/src/smartdialx/api.py`. It's
a small JSON API on the standard library's `ThreadingHTTPServer`, and by default it listens
on `127.0.0.1:8000`. The Next.js app forwards `/api/*` to it (see `frontend/next.config.ts`;
set `SMARTDIALX_API` to point it somewhere else).

## What's behind it

`serve` starts a `Console` (`console.py`). That's one SQLite file
(`backend/data/console.db`), both mock providers, and a background thread that runs the
normal pipeline once a second for every running campaign:

```
provider events -> recovery sweep -> wrap-ups and requested pauses -> screening transfers
    -> pacer -> safety controller -> allocator -> provider
```

On a fresh start it creates 12 agents and 4 campaigns with 780 made-up borrowers between
them, then plays back the last 20 minutes as fast as it can, so the screens have history
from the first second. Use `--keep` to carry on with the existing database instead, and
`--history` to change how much gets played back.

Nothing behind this API dials anything real. The providers are the same mocks the tests use.

## Conventions

- Times are epoch seconds on the console's clock. Every response includes `now` from that
  same clock, so work out "3m ago" against it rather than the browser's clock. While the
  console is playing back its history, its clock is behind real time.
- `since` is a window in seconds, from 60 seconds up to 30 days. Funnel numbers count the
  calls that *started* inside the window, which is why attempts >= answered >= willing >=
  connected always holds.
- `campaign` filters by campaign id wherever that makes sense. Agents are one shared pool,
  so agent counts and utilization are never filtered by campaign.
- The codes you see on screen come from the ids: `AG-1001` is agent 1, `CALL-10042` is
  call 42, `CMP-101` is campaign 1, `DEC-n` is decision n and `REC-n` is recovery action n.
- Phone numbers are masked (`***-0042`), even though they're made up anyway.
- Errors come back as `{"error": "..."}` with one of these status codes: 400 for bad input,
  404 for an unknown id or route, 405 for the wrong method, 409 when the state machine
  refuses a transition, and 500 for a bug (the details go to the server log).

## Endpoints

### System

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | clock, replay status, ticks, errors, running campaigns, provider status |
| POST | `/api/system/reset` | delete the console database and seed a fresh world (settings kept) |

### Dashboards

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/overview` | `campaign`, `since` | KPIs, screening funnel, agent state counts, activity series, system health, recent activity |
| GET | `/api/live` | `campaign`, `since` | live call counts by state, waiting borrowers, pipeline, safety status, alerts |

### Agents

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/agents` | `since` | every agent with state, current call, current or last campaign, calls in window |
| GET | `/api/agents/{id}` | `since` | one agent plus recent calls and an activity feed |
| POST | `/api/agents` | `{name, state}` | state is AVAILABLE, PAUSED or OFFLINE; names are unique |
| POST | `/api/agents/{id}/state` | `{state}` | AVAILABLE, PAUSED or OFFLINE. A busy agent can only go OFFLINE (that ends the live call) |
| POST | `/api/agents/{id}/pause-request` | `{on}` | pause once the agent is off their current call |

### Campaigns

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/campaigns` | | list with targets, attempts, connections, display status, latest safety decision |
| GET | `/api/campaigns/{id}` | `since` | one campaign, full metrics (`stats.campaign_metrics`), effective screening settings, activity |
| POST | `/api/campaigns` | see below | creates the campaign and its synthetic borrowers |
| PATCH | `/api/campaigns/{id}` | any of the create fields except `borrowers` | calls already placed keep their settings |
| POST | `/api/campaigns/{id}/status` | `{status}` | RUNNING, PAUSED or STOPPED. Stopping cancels queued calls and can't be undone |
| POST | `/api/campaigns/{id}/duplicate` | | copy with the same configuration, created paused |

Create body: `name` (required), `borrowers` (1-2000), `mode` (`progressive`/`predictive`),
`provider` (`A`/`B`), `screening` (bool), `audience` (`standard`/`warm`/`strict`), `hold_s`
(5-300, optional), `no_agent_policy` (`callback`/`end`, optional), `description`, `status`
(`RUNNING`/`PAUSED`).

`display_status` adds COMPLETED: a running or paused campaign with nothing queued and nothing
live.

### Calls

| Method | Path | Query | Notes |
|---|---|---|---|
| GET | `/api/calls` | `campaign`, `state`, `outcome`, `provider`, `q`, `scope`, `since`, `limit` | live calls first, then calls that ended in the window. `state=QUEUED` lists the queue |
| GET | `/api/calls/{id}` | | the call, its provider events, provider requests, recovery actions and earlier attempts |

`outcome` is the screening outcome worked out from the call's columns: `in_progress`,
`willing`, `callback_later`, `declined`, `screening_failed`, `no_answer`, `busy`,
`not_reached`, `not_started` (null for direct calls).

### Pacing and safety

| Method | Path | Query | Notes |
|---|---|---|---|
| GET | `/api/pacing` | `campaign`, `since` | live snapshot, latest decision, threshold table, answer-rate sensitivity |
| GET | `/api/decisions` | `campaign`, `action`, `since`, `changes`, `limit` | `changes=1` keeps only decisions where the action changed |
| GET | `/api/decisions/{id}` | | reasoning, safety reasons and the pacer's inputs |

The sensitivity rows run the real `PredictivePacer` and `SafetyController` on a copy of the
snapshot at 20/50/70% answer rates, as if every online agent were free.

### Providers

| Method | Path | Body / query | Notes |
|---|---|---|---|
| GET | `/api/providers` | `since` | per provider: status, requests by result, events by outcome, timing, profile; request series |
| GET | `/api/providers/{A\|B}` | `since` | plus recent events, requests and fault history |
| POST | `/api/providers/{A\|B}/fault` | `{kind, duration_s}` | `normal`, `latency`, `timeout`, `outage`, `duplicates`, `out_of_order`; duration 10-3600 s or none |

### Events and recovery

| Method | Path | Query | Notes |
|---|---|---|---|
| GET | `/api/events` | `type`, `provider`, `campaign`, `status`, `q`, `since`, `limit` | stored provider events with how they were handled |
| GET | `/api/events/{event_id}` | | URL-encode the id (it contains `:`) |
| GET | `/api/recovery` | `since`, `limit` | recovery log, pending reconciliation counts, worker heartbeats |
| GET | `/api/recovery/{id}` | | one action with the full call it touched |

Event `status`: `processed`, `confirmation` (repeats the state the call is already in, e.g.
the provider's INITIATED arriving after we recorded the request as accepted), `ignored_stale`,
`ignored_late`, `rejected_invalid`, `orphan`, `pending`, plus the filters `duplicate`
(delivered more than once) and `reconciled` (replayed by recovery).

### Settings

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/settings` | | current values, defaults, mock audiences, fault kinds |
| PUT | `/api/settings` | `{section: {key: value}}` | partial update of `pacing`, `safety`, `timeouts`, `screening`; validated with `Settings.validate()` |
| POST | `/api/settings/reset` | | back to the defaults in `config.py` |

### Simulation lab

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/simulations` | | runs from this server process, presets, audiences |
| POST | `/api/simulations` | `{preset, mode, screening, audience, hold_s, no_agent_policy, agents, borrowers, provider, fault, seed, compare}` | runs `simulator.run` in a background thread; `compare: true` runs all four mode/screening combinations on the same audience |
| GET | `/api/simulations/{id}` | | status, and when done the summary, metrics and per-minute timeline |

Simulation runs don't touch the live console. Each one gets a fresh in-memory database and
its own fake clock, and uses whatever settings the console has at the moment you start it
(the response lists any that differ from the defaults in `settings_changed`).
