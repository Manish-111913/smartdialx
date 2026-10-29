# SmartDialX frontend

Next.js (App Router) + Tailwind CSS port of the eight Stitch designs for the
SmartDialX console. All data on these screens is mock data from the designs; the
frontend isn't wired to the backend yet.

## Run it

Needs Node 20 or newer.

```powershell
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve the production build
npm run lint
```

## Screens

| Route | Screen | Stitch source |
|---|---|---|
| `/` | Overview | executive_dashboard_enhanced_layout_insights |
| `/campaigns` | Campaigns | campaign_management |
| `/live-operations` | Live Operations | live_operations |
| `/agents` | Agents | agent_management |
| `/pacing-safety` | Pacing & Safety | pacing_safety |
| `/provider-monitoring` | Provider Monitoring | provider_monitoring |
| `/simulation-lab` | Simulation Lab | simulation_lab |
| `/event-logs` | Event Logs & Recovery | event_logs_recovery |
| `/settings` | placeholder, no design yet | - |

## How it's put together

```
src/
  app/                 one route per screen, plus the root layout
  components/          AppShell, Sidebar, Header, nav config
  screens/<name>/      <Name>Screen.jsx (markup) + behavior.js (interactions)
  lib/useScreen.js     runs a screen's behavior.js after render, cleans up on unmount
```

**Shared layout.** Every Stitch screen came with its own sidebar and header. All of
them now use the ones from the executive dashboard design, fixed on the left and
top. They're real React components: collapse is state (256px or a 72px rail), the
active link and the breadcrumb come from the current route.

**Screen markup.** Each screen's main content was converted from the Stitch HTML to
JSX: class to className, style strings to objects, SVG attributes camel-cased,
form fields made uncontrolled (defaultValue/defaultChecked). Links between screens
use next/link.

**Interactions.** The designs came with plain JavaScript for drawers, modals,
filters, sorting and toasts. Rather than rewrite all of it, each screen keeps that
script in `behavior.js`, wrapped in a `mount()` function. `useScreen()` calls it once
the markup is rendered and the JSX calls its functions through `ui(e)`:

```jsx
const ui = useScreen(mount);
<button onClick={(e) => ui(e).openDrawer("AG-1024")}>...</button>
```

Listeners the script adds are removed when you leave the page. Outside-click and
Escape handlers listen on `window` instead of `document`, so a `stopPropagation()`
inside a React handler still reaches them. These scripts change the DOM directly,
which is fine while the screens hold no React state. Moving them into React state
is the next step if the screens start showing live data.

**Tailwind.** Tailwind 3.4, the same major version the Stitch exports were built
against (v4 renames several utilities they use), with the forms and
container-queries plugins. The designs didn't all share one theme, so
`tailwind.config.ts` merges them and gives the conflicting tokens a prefix:

- `po-*` colours and `rounded-po*` radii: the "Precision Operations" palette and
  sharper corners used by provider monitoring, simulation lab and event logs
- `cm-primary`, `cm-surface`: campaigns
- `ps-brand-*`: pacing & safety

## Differences from the Stitch HTML

- Each screen's own sidebar and header were replaced by the shared ones, so page
  specific bits of those headers (cluster badges, extra filters) are gone.
- Provider monitoring's original config didn't define the font-size and spacing
  tokens it uses (`text-body-md`, `gap-space-md` and so on), so in the export they
  did nothing. Here they get the design-system values like every other screen.
- Fixed-height selects and inputs had their text clipped by the forms plugin's
  padding in the export; they get `py-0` here.
- Scrollbars are a thin 6px bar everywhere instead of a mix of hidden and thin.
