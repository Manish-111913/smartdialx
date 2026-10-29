"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { patch, post, put, qs, useApi } from "@/lib/api";
import { clock, num, pct, rangeLabel } from "@/lib/format";
import { campaignStatus, decision, humanize, reason, safetyStatus, TONE } from "@/lib/labels";
import { useFilters } from "@/components/Filters";
import { Badge, ConfirmDialog, EmptyState, ErrorNote, Skeleton, useAction, useToast } from "@/components/ui";
import DecisionDrawer from "./DecisionDrawer";
import { buildPatch, FIELDS, formatLimit, LIMIT_UNIT, MARGINS, settingValue, toInput } from "./fields";
import SensitivityChart from "./SensitivityChart";

const PAGE = 8;
const TABS = ["APPROVE", "REDUCE", "REJECT", "FORCE_PROGRESSIVE"];
const THRESHOLD_STATUS = {
  ok: { label: "Within limit", tone: "green" },
  near: { label: "Near limit", tone: "amber" },
  over: { label: "Over limit", tone: "red" },
  off: { label: "No limit set", tone: "gray" },
  no_data: { label: "Not enough data", tone: "gray" },
  not_applicable: { label: "Not used in this mode", tone: "gray" },
};

export default function PacingSafetyScreen() {
  const params = useSearchParams();
  const { campaignId: headerCampaign, since } = useFilters();
  const [picked, setPicked] = useState(null);
  const wanted = picked ?? (Number(params.get("campaign")) || headerCampaign || null);
  const pacing = useApi(`/pacing${qs({ campaign: wanted, since })}`, { interval: 4000 });
  const data = pacing.data;
  const selected = data?.selected;

  const [tab, setTab] = useState(null);
  const [changesOnly, setChangesOnly] = useState(true);
  const [allCampaigns, setAllCampaigns] = useState(false);
  const [page, setPage] = useState(0);
  const decisionsPath = selected
    ? `/decisions${qs({ campaign: allCampaigns ? null : selected.id, action: tab, since, changes: changesOnly ? 1 : null, limit: 200 })}`
    : null;
  const decisions = useApi(decisionsPath, { interval: 4000 });

  const [decisionId, setDecisionId] = useState(() => Number(params.get("decision")) || null);
  const [edits, setEdits] = useState({});
  const [confirmReset, setConfirmReset] = useState(false);
  const { run, busy } = useAction();
  const toast = useToast();

  const settings = data?.settings;
  const value = (key) => (key in edits ? edits[key] : toInput(key, settingValue(settings, key)));
  const edit = (key, text) => setEdits((all) => ({ ...all, [key]: text }));
  const dirty = Object.keys(edits).some((key) => edits[key] !== toInput(key, settingValue(settings, key)));

  const refreshAll = () => {
    pacing.refresh();
    decisions.refresh();
  };

  const save = async () => {
    let body;
    try {
      body = buildPatch(edits);
    } catch (e) {
      toast({ tone: "error", title: "Check the configuration", detail: e.message });
      return;
    }
    const ok = await run(() => put("/settings", body), "Configuration saved", "Used by every campaign from the next pacing round.");
    if (ok) {
      setEdits({});
      refreshAll();
    }
  };

  const resetDefaults = async () => {
    const ok = await run(() => post("/settings/reset"), "Settings reset to defaults");
    setConfirmReset(false);
    if (ok) {
      setEdits({});
      refreshAll();
    }
  };

  const setMode = async (mode) => {
    if (!selected || selected.mode === mode) return;
    const ok = await run(
      () => patch(`/campaigns/${selected.id}`, { mode }),
      `${selected.name} is now ${mode}`,
      "Takes effect from the next pacing round.",
    );
    if (ok) refreshAll();
  };

  const rows = decisions.data?.decisions ?? [];
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(Math.min(page, pages - 1) * PAGE, Math.min(page, pages - 1) * PAGE + PAGE);
  const counts = decisions.data?.counts ?? {};
  const total = decisions.data?.total ?? 0;

  return (
    <>
      <div className="bg-surface-page text-primaryText font-sans antialiased p-6 max-w-7xl mx-auto space-y-6 min-h-[calc(100vh-3.5rem)]">
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pacing &amp; Safety</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Simulation</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Control dialing intensity, monitor campaign capacity, and understand safety decisions.</p>
          </div>
          <div className="flex items-center flex-wrap gap-2.5">
            <select
              value={selected?.id ?? ""}
              onChange={(e) => {
                setPicked(Number(e.target.value));
                setPage(0);
              }}
              disabled={!data?.campaigns?.length}
              className="h-8 py-0 pl-2.5 pr-8 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-xs focus:ring-1 focus:ring-blue-500"
              title="Campaign"
            >
              {(data?.campaigns ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {campaignStatus(c.status).label}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-400 hidden lg:inline">{rangeLabel(since)}</span>
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-xs"
            >
              <span className={`material-symbols-outlined text-[15px] text-gray-500 ${pacing.loading ? "animate-spin" : ""}`}>refresh</span>
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-xs"
            >
              Reset to defaults
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || busy}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Saving…" : "Save Configuration"}
            </button>
          </div>
        </section>

        <ErrorNote error={pacing.error} />

        {!data ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </section>
        ) : !selected ? (
          <div className="bg-white rounded-xl border border-surface-border">
            <EmptyState icon="campaign" title="No campaigns yet" detail="Create a campaign to see its pacing and safety decisions." />
          </div>
        ) : (
          <>
            <Kpis data={data} since={since} />
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <PacingConfig data={data} value={value} edit={edit} setMode={setMode} busy={busy} dirty={dirty} />
              <PacingOverview data={data} />
            </section>
            <SafetyMatrix data={data} value={value} edit={edit} />
            <section className="bg-white rounded-xl border border-surface-border shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900">Answer Rate &amp; Capacity</h2>
                  <span className="text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">Computed live</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-gray-500">
                  <Legend color="bg-blue-600" label="Pacer would ask for" />
                  <Legend color="bg-emerald-500" label="Safety would allow" />
                  <Legend color="border-t-2 border-dashed border-slate-400 h-0" label="Expected-value batch" />
                </div>
              </div>
              <SensitivityChart rows={data.sensitivity} />
              <p className="text-[11px] text-gray-400 text-center">
                Worked out by the live predictive pacer and safety controller for {num(data.sensitivity?.[0]?.agents ?? 0)} online agents, as if all
                were free with nothing ringing. It isn&apos;t a forecast, and a higher answer rate doesn&apos;t mean higher productivity without free agents to take the calls.
              </p>
            </section>
          </>
        )}

        {selected && (
          <section className="bg-white rounded-xl border border-surface-border shadow-xs overflow-hidden">
            <div className="p-5 border-b border-surface-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Recent Safety Decisions</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Every pacing round the safety controller reviews the pacer&apos;s request. Counts cover {rangeLabel(since).toLowerCase()}
                  {allCampaigns ? " across all campaigns" : ` for ${selected.name}`}.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-medium overflow-x-auto">
                  <TabButton active={tab === null} onClick={() => { setTab(null); setPage(0); }}>
                    All ({num(total)})
                  </TabButton>
                  {TABS.map((action) => (
                    <TabButton key={action} active={tab === action} onClick={() => { setTab(action); setPage(0); }}>
                      {decision(action).label} ({num(counts[action] ?? 0)})
                    </TabButton>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-2.5 border-b border-gray-100 flex flex-wrap items-center gap-4 text-[11px] text-gray-600 bg-gray-50/40">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={changesOnly} onChange={(e) => { setChangesOnly(e.target.checked); setPage(0); }} className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                Only rounds where the decision changed
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={allCampaigns} onChange={(e) => { setAllCampaigns(e.target.checked); setPage(0); }} className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                All campaigns
              </label>
              {changesOnly && <span className="text-gray-400">A cold start repeats the same decision every second, so repeats are hidden.</span>}
            </div>
            <ErrorNote error={decisions.error} className="m-4" />
            {!decisions.data ? (
              <div className="p-5 space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState icon="verified_user" title="No decisions match" detail="Try another tab, include repeated rounds, or widen the time range." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-5">Time</th>
                      <th className="py-3 px-4">Campaign</th>
                      <th className="py-3 px-4">Decision</th>
                      <th className="py-3 px-4">Trigger</th>
                      <th className="py-3 px-4">Pacing Mode</th>
                      <th className="py-3 px-4 text-center">Calls</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {shown.map((d) => (
                      <DecisionRow key={d.id} d={d} onInspect={() => setDecisionId(d.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {rows.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {Math.min(page, pages - 1) * PAGE + 1}-{Math.min(rows.length, (Math.min(page, pages - 1) + 1) * PAGE)} of {num(rows.length)}
                  {rows.length >= 200 ? " most recent" : ""} rows
                </span>
                <div className="flex items-center gap-1 font-medium">
                  <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                    Previous
                  </button>
                  <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    {Math.min(page, pages - 1) + 1} / {pages}
                  </span>
                  <button type="button" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <DecisionDrawer id={decisionId} onClose={() => setDecisionId(null)} />
      <ConfirmDialog
        open={confirmReset}
        title="Reset pacing and safety settings?"
        message="Every pacing, safety, timeout and screening setting goes back to its default for all campaigns. Campaign modes are not changed."
        confirmLabel="Reset to defaults"
        danger
        busy={busy}
        onConfirm={resetDefaults}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}

function Kpis({ data, since }) {
  const { selected, overview, settings, actions, snapshot, status } = data;
  const forced = status === "forced_progressive";
  const max = settings.safety.max_active_calls;
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Kpi
        label="Dialing Mode"
        badge={forced ? { text: "Forced progressive", cls: "bg-purple-50 text-purple-700 border-purple-200" } : { text: campaignStatus(selected.status).label, cls: "bg-blue-50 text-blue-700 border-blue-200" }}
        value={<div className="text-xl font-bold text-gray-900 tracking-tight">{humanize(selected.mode)}</div>}
        note={
          <span className="flex items-center gap-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${TONE[safetyStatus(status).tone].dot}`} />
            {forced ? "Safety is running it one call per free agent" : selected.screening ? "Screening bot calls first" : "Direct calls to agents"}
          </span>
        }
      />
      <Kpi
        label="Active Calls"
        badge={{ text: "Live", cls: "bg-amber-50 text-amber-700 border-amber-200" }}
        value={
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">{num(overview.active_calls)}</span>
            <span className="text-xs text-gray-400">/ {num(max)} ceiling</span>
          </div>
        }
        note={`${num(overview.in_flight)} dialing or with the bot`}
      />
      <Kpi
        label="Available Agents"
        badge={{ text: overview.available_agents ? "Free now" : "All busy", cls: overview.available_agents ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200" }}
        value={
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">{num(overview.available_agents)}</span>
            <span className="text-xs text-gray-400">of {num(snapshot.staffed_agents)} staffed</span>
          </div>
        }
        note={`Capacity ${num(overview.capacity)} incl. wrap-ups ending soon`}
      />
      <Kpi
        label="Safety Blocks"
        badge={{ text: rangeLabel(since), cls: "bg-indigo-50 text-indigo-700 border-indigo-200" }}
        value={
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">{num(actions.REJECT ?? 0)}</span>
            <span className="text-xs text-gray-400">rounds blocked</span>
          </div>
        }
        note={`${num(actions.REDUCE ?? 0)} reduced · ${num(actions.FORCE_PROGRESSIVE ?? 0)} forced progressive`}
      />
    </section>
  );
}

function Kpi({ label, badge, value, note }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border truncate ${badge.cls}`}>{badge.text}</span>
      </div>
      <div className="mt-3">
        {value}
        <div className="text-[11px] text-gray-500 mt-1">{note}</div>
      </div>
    </div>
  );
}

function PacingConfig({ data, value, edit, setMode, busy, dirty }) {
  const { selected } = data;
  const answer = Number(value("pacing.prior_answer_rate")) || 0;
  const margin = Number(value("pacing.max_abandon_risk"));
  const margins = MARGINS.some((m) => m.value === margin) ? MARGINS : [...MARGINS, { value: margin, label: `${pct(margin, 1)} · Custom` }];
  return (
    <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Pacing Configuration</h2>
          {dirty && <span className="text-[11px] font-semibold text-amber-600">Unsaved changes</span>}
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold text-gray-700 block mb-2">Pacing mode for {selected.name}</label>
          <div className="grid grid-cols-2 gap-3">
            <ModeCard
              active={selected.mode === "progressive"}
              disabled={busy}
              onClick={() => setMode("progressive")}
              title="Progressive"
              text="A call starts only when a free agent and a borrower have both been reserved."
              points={["One agent at a time", "Conservative initiation"]}
            />
            <ModeCard
              active={selected.mode === "predictive"}
              disabled={busy}
              onClick={() => setMode("predictive")}
              title="Predictive"
              text="Dials ahead from the expected answer rate and free agent capacity."
              points={["Capacity-aware batch size", "Risk-limited by safety"]}
            />
          </div>
          <p className="text-[10.5px] text-gray-400 mt-1.5">Mode is set per campaign and applies right away. The settings below are shared by every campaign.</p>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-medium text-gray-700">Expected answer rate</span>
              <span className="font-mono font-bold text-blue-600 text-xs">{answer}%</span>
            </div>
            <input
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              type="range"
              min="10"
              max="90"
              value={answer}
              onChange={(e) => edit("pacing.prior_answer_rate", e.target.value)}
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>90%</span>
            </div>
            <p className="text-[10.5px] text-gray-400 mt-1">
              Starting estimate the pacer blends with observed outcomes; it matters most before there&apos;s enough history.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Safety margin</label>
              <select
                value={margin}
                onChange={(e) => edit("pacing.max_abandon_risk", e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-800 focus:ring-1 focus:ring-blue-500"
              >
                {margins.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <NumberField label="Max concurrent calls" k="safety.max_active_calls" value={value} edit={edit} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Max outstanding calls per free agent" k="safety.max_overdial_ratio" value={value} edit={edit} step="0.1" suffix="×" />
            <div className="text-[10.5px] text-gray-400 leading-relaxed self-end">
              Safety margin is the accepted chance, per decision, that more people answer than there are free agents.
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex items-start gap-2.5">
        <span className="material-symbols-outlined text-[16px] text-blue-600 mt-0.5">info</span>
        <p className="text-[11px] text-blue-800 leading-relaxed">
          The pacer plans with an upper bound on the answer rate, so guessing high costs idle time rather than abandoned calls.
        </p>
      </div>
    </div>
  );
}

function ModeCard({ active, disabled, onClick, title, text, points }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-lg p-3 text-left transition-all disabled:cursor-wait ${
        active ? "border-2 border-blue-600 bg-blue-50/40 shadow-xs" : "border border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs ${active ? "font-bold text-blue-900" : "font-semibold text-gray-700"}`}>{title}</span>
        {active && <span className="material-symbols-outlined text-[16px] text-blue-600">check_circle</span>}
      </div>
      <div className={`text-[10px] mt-0.5 ${active ? "text-blue-700" : "text-gray-500"}`}>{text}</div>
      <ul className="mt-1.5 space-y-0.5">
        {points.map((p) => (
          <li key={p} className="text-[10px] text-gray-500">· {p}</li>
        ))}
      </ul>
      {active && <span className="sr-only">Selected</span>}
    </button>
  );
}

function NumberField({ label, k, value, edit, step = "1", suffix }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          min="0"
          step={step}
          value={value(k)}
          onChange={(e) => edit(k, e.target.value)}
          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-800 font-mono focus:ring-1 focus:ring-blue-500"
        />
        {suffix && <span className="absolute right-2.5 top-1.5 text-[11px] text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function PacingOverview({ data }) {
  const { overview, latest, snapshot } = data;
  const scale = Math.max(1, snapshot.staffed_agents, overview.active_calls, overview.in_flight);
  const queueShare = overview.queued_ready / Math.max(1, overview.queued_ready + snapshot.calls_started);
  const gap = latest ? latest.requested - latest.approved : 0;
  return (
    <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Pacing Overview</h2>
          <span className="text-xs text-gray-400">{latest ? `Last round ${clock(latest.at)}` : "No round yet"}</span>
        </div>
        <div className="mt-4 space-y-3.5">
          <Meter label="Capacity for the next calls" value={`${num(overview.capacity)} agents`} hint="free + wrap-ups ending soon" width={overview.capacity / scale} color="bg-emerald-500" />
          <Meter label="Live calls" value={`${num(overview.active_calls)} calls`} hint={`of ${num(snapshot.staffed_agents)} staffed agents`} width={overview.active_calls / scale} color="bg-blue-600" />
          <Meter label="Dialing or with the bot" value={`${num(overview.in_flight)} calls`} hint="not on an agent yet" width={overview.in_flight / scale} color="bg-sky-400" />
          <Meter label="Borrowers ready to dial" value={num(overview.queued_ready)} hint="of the queue still to go" width={queueShare} color="bg-indigo-400" />
        </div>
        {latest ? (
          <div className="mt-5 p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/50">
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Pacer vs safety, last round</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <span className="text-[11px] text-gray-500 block">Pacer suggested</span>
                <span className="text-xl font-mono font-bold text-blue-700">
                  {num(latest.requested)} <span className="text-xs font-normal text-gray-500">calls</span>
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">{humanize(latest.mode)} pacer</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200">
                <span className="text-[11px] text-gray-500 block">Permitted by safety</span>
                <span className={`text-xl font-mono font-bold ${gap > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {num(latest.approved)} <span className="text-xs font-normal text-gray-500">calls</span>
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">{decision(latest.action).label}</span>
              </div>
            </div>
            {gap > 0 || latest.reasons.length ? (
              <div className="mt-3 text-xs bg-amber-100/70 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-md font-medium">
                {gap > 0 ? `${num(gap)} call${gap === 1 ? "" : "s"} held back. ` : ""}
                {latest.reasons.map((r) => reason(r).label).join(" · ")}
              </div>
            ) : (
              <div className="mt-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-md font-medium">
                Approved as requested; no limit was hit.
              </div>
            )}
            {latest.reasoning && <p className="mt-2 text-[10.5px] font-mono text-gray-500 leading-relaxed">{latest.reasoning}</p>}
          </div>
        ) : (
          <EmptyState icon="speed" title="No pacing decision yet" detail="Decisions appear once the campaign is running and has borrowers to dial." />
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-500">
        <span className="material-symbols-outlined text-[16px] text-gray-400">shield</span>
        <span>The pacing engine suggests a dialing volume. The safety controller independently determines whether that volume is permitted.</span>
      </div>
    </div>
  );
}

function Meter({ label, value, hint, width, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-medium mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-mono">
          {value} <span className="text-gray-400 font-normal">({hint})</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, width * 100))}%` }} />
      </div>
    </div>
  );
}

function SafetyMatrix({ data, value, edit }) {
  const status = safetyStatus(data.status);
  return (
    <section className="bg-white rounded-xl border border-surface-border shadow-xs overflow-hidden">
      <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-sm font-bold text-gray-900">Safety Controller</h2>
            <Badge tone={status.tone} dot title={status.hint}>
              {status.label}
            </Badge>
            <span className="text-xs text-gray-400">· {data.thresholds.length} rules checked every round</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">The safety controller can reduce or block new call initiation independently of the selected pacing mode.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Fallback:</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-[11px] font-medium">Forced progressive</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-5">Safety Rule</th>
              <th className="py-3 px-4">Current</th>
              <th className="py-3 px-4">Limit</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-5">What it does</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {data.thresholds.map((t) => {
              const s = THRESHOLD_STATUS[t.status] ?? THRESHOLD_STATUS.no_data;
              const key = `safety.${t.key}`;
              const field = FIELDS[key];
              return (
                <tr key={t.key} className={`hover:bg-gray-50/50 transition-colors ${t.status === "over" ? "bg-rose-50/30" : ""}`}>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">{t.label}</td>
                  <td className={`py-3.5 px-4 font-mono font-medium ${TONE[s.tone].text}`}>{formatLimit(t.key, t.current)}</td>
                  <td className="py-3.5 px-4">
                    {field ? (
                      <div className="relative w-28">
                        <input
                          type="number"
                          min="0"
                          step={field.kind === "count" ? "1" : "0.1"}
                          value={value(key)}
                          placeholder={field.nullable ? "No limit" : undefined}
                          onChange={(e) => edit(key, e.target.value)}
                          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-md pl-2 pr-6 py-1 text-gray-800 font-mono focus:ring-1 focus:ring-blue-500"
                          aria-label={`${t.label} limit`}
                        />
                        <span className="absolute right-2 top-1 text-[11px] text-gray-400">{LIMIT_UNIT[field.kind]}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-gray-500">{formatLimit(t.key, t.limit)}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </td>
                  <td className="py-3.5 px-5 text-gray-500 text-[11px] max-w-md">{t.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2.5 border-t border-gray-100 text-[11px] text-gray-400">
        Limits are saved with Save Configuration. They are prototype assumptions, not regulatory limits, and don&apos;t guarantee compliance.
      </div>
    </section>
  );
}

function DecisionRow({ d, onInspect }) {
  const verdict = decision(d.action);
  const first = d.reasons[0] ? reason(d.reasons[0]) : null;
  const held = d.approved < d.requested;
  return (
    <tr className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${held ? "bg-amber-50/20" : ""}`} onClick={onInspect}>
      <td className="py-3 px-5 font-mono text-gray-500 text-[11px]">{clock(d.at)}</td>
      <td className="py-3 px-4 font-semibold text-gray-900">{d.campaign}</td>
      <td className="py-3 px-4">
        <Badge tone={verdict.tone}>{verdict.label}</Badge>
      </td>
      <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={first ? `${first.label}: ${first.detail}` : d.reasoning}>
        {first ? first.label : "Within all limits"}
        {first?.detail && <span className="text-gray-400"> · {first.detail}</span>}
      </td>
      <td className="py-3 px-4 font-mono text-gray-500">
        {humanize(d.mode)}
        {d.action === "FORCE_PROGRESSIVE" && <span className="text-purple-600"> → progressive</span>}
      </td>
      <td className={`py-3 px-4 font-mono text-center ${held ? "text-amber-800 font-semibold" : "text-gray-900"}`}>
        {num(d.requested)} suggested / {num(d.approved)} permitted
      </td>
      <td className="py-3 px-5 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInspect();
          }}
          className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline"
        >
          Inspect
        </button>
      </td>
    </tr>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md whitespace-nowrap ${active ? "bg-white text-gray-900 shadow-2xs font-semibold" : "text-gray-600 hover:text-gray-900"}`}
    >
      {children}
    </button>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 ${color.includes("border") ? "" : "h-2.5 rounded-sm"} ${color}`} />
      {label}
    </span>
  );
}
