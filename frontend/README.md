# SmartDialX frontend

The web console for SmartDialX, built with Next.js (App Router) and Tailwind CSS. It has
no data of its own: every number, row and chart comes from the backend's API. If the
backend isn't running, the screens say so instead of showing something made up.

## Running it

You need Node 20 or newer, and the backend running first. From `backend/`, with its venv
active, run `python -m smartdialx.main serve` (the root README has the full setup). Then:

```powershell
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```powershell
npm run build      # production build
npm run start      # serve the production build
npm run lint
```

Requests to `/api/...` are forwarded to the backend at `http://127.0.0.1:8000`. If your
backend runs somewhere else, set `SMARTDIALX_API` before starting (or before building, for
`npm run start`).

## Screens

| Route | Screen | Main endpoints |
|---|---|---|
| `/` | Overview | `/api/overview` |
| `/campaigns` | Campaigns | `/api/campaigns`, `/api/campaigns/{id}` |
| `/live-operations` | Live Operations | `/api/live`, `/api/calls`, `/api/calls/{id}` |
| `/agents` | Agents | `/api/agents`, `/api/agents/{id}` |
| `/pacing-safety` | Pacing & Safety | `/api/pacing`, `/api/decisions`, `/api/settings` |
| `/provider-monitoring` | Provider Monitoring | `/api/providers`, `/api/providers/{name}/fault` |
| `/simulation-lab` | Simulation Lab | `/api/simulations` |
| `/event-logs` | Event Logs & Recovery | `/api/events`, `/api/recovery` |
| `/settings` | Settings | `/api/settings`, `/api/system/reset` |

Every endpoint is described in [../docs/api.md](../docs/api.md).

Screens link to each other with query parameters, which open the right drawer or filter
straight away:

- `/agents?id=3`
- `/campaigns?id=2`
- `/live-operations?call=42`
- `/pacing-safety?decision=120`
- `/provider-monitoring?provider=B`
- `/event-logs?q=CALL-10042` and `/event-logs?recovery=7`

## How the code is laid out

```
src/
  app/              one folder per route, plus the root layout
  components/       sidebar, header, the global filters, and shared widgets (ui.tsx)
  lib/
    api.ts          fetch wrapper and the useApi() polling hook
    format.ts       numbers, percentages, durations, "3m ago"
    labels.ts       the name and colour of every backend state, outcome and decision
  screens/<name>/   the screens themselves, split into smaller files where it helps
```

A few things are worth knowing before you change anything.

**Fetching data.** Screens call `useApi(path, { interval })`, which fetches a path under
`/api` and keeps polling it, every 3 to 5 seconds on the live screens. It stops while the
tab is hidden. When you change a filter, the old data stays on screen until the new data
arrives, so nothing flashes. Actions use `post`, `patch` or `put` wrapped in `useAction()`.
That shows a toast with whatever the server said, good or bad, and then refreshes the data.

**Time.** The backend reports times on its own clock and puts its `now` in every response.
Anything relative, like "time in state" or "3m ago", is worked out against that `now`, not
the browser's clock. This matters right after the backend starts: it replays 20 minutes of
history first, and during that time its clock is behind yours.

**Shared layout.** All screens use the sidebar and header from the executive dashboard
design, fixed on the left and top. The campaign and time range pickers in the header are
global (`components/Filters.tsx`) and remembered between visits, and the screens where a
filter makes sense use them. The bell shows the same operational alerts as Live Operations.
The bottom of the sidebar shows whether the backend is reachable and how each mock provider
is doing.

**Labels and colours.** States, screening outcomes, safety decisions, recovery actions and
event statuses are all named and coloured in one file, `lib/labels.ts`. That's why
"Reserved" is the same amber on every screen. If you add a new state on the backend, add it
there too.

**Tailwind.** This uses Tailwind 3.4, not 4. The Stitch designs were made for version 3,
and version 4 renames several of the utilities they rely on. The forms and
container-queries plugins are on. The designs didn't share one theme, so
`tailwind.config.ts` merges them and gives the clashing tokens a prefix:

- `po-*` colours and `rounded-po*` radii: the palette and sharper corners used by Provider
  Monitoring, Simulation Lab and Event Logs
- `cm-primary`, `cm-surface`: Campaigns
- `ps-brand-*`: Pacing & Safety

## How it differs from the Stitch designs

- Each design came with its own sidebar and header. Every screen now uses the executive
  dashboard's.
- Anything the backend has no real source for was taken out rather than faked: audio
  codecs, call quality scores, regions, SIP response codes, named agent pools (there's only
  one shared pool), trend percentages and "time saved" estimates.
- Labels that said "Demo Data" now say the data is simulated, because that's what it is:
  real output from the backend, running against mock providers with made-up borrowers.
- The Settings screen didn't exist in the designs. It was built in the same style and
  edits the backend's settings.
