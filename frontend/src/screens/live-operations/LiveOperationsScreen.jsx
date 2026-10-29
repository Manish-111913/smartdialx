"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useFilters } from "@/components/Filters";
import { Badge, EmptyState, ErrorNote, Icon, RowMenu, Skeleton } from "@/components/ui";
import { qs, useApi } from "@/lib/api";
import { ago, duration, num, pct, plural, rangeLabel, rate, seconds } from "@/lib/format";
import { CALL_STATES, callState, OUTCOMES, outcome, providerName, safetyStatus } from "@/lib/labels";
import CallDrawer from "./CallDrawer";
import { callDuration, durationHint } from "./time";

// tabs show the busiest states first; anything else is still reachable from the status filter
const TAB_ORDER = ["CONNECTED", "TRANSFER_PENDING", "SCREENING", "ANSWERED", "RINGING", "INITIATED", "RESERVED", "COMPLETED", "FAILED", "ABANDONED", "CANCELLED"];

const ALERT_LOOK = {
  error: { box: "bg-rose-50/50 border-rose-200/80", title: "text-rose-700", icon: "error" },
  warning: { box: "bg-amber-50/50 border-amber-200/80", title: "text-amber-700", icon: "warning" },
  info: { box: "bg-slate-50 border-slate-200", title: "text-slate-800", icon: "info" },
};

export default function LiveOperationsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { campaignId, setCampaignId, since } = useFilters();
  const [state, setState] = useState("");
  const [outcomeKey, setOutcomeKey] = useState("");
  const [provider, setProvider] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => Number(params.get("call")) || null);

  // wait for a pause in typing before asking the backend
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const live = useApi(`/live${qs({ campaign: campaignId, since })}`, { interval: 3000 });
  const calls = useApi(
    `/calls${qs({ campaign: campaignId, state, outcome: outcomeKey, provider, q: query, since, limit: 100 })}`,
    { interval: 3000 },
  );
  const { data: campaignList } = useApi("/campaigns", { interval: 15000 });

  const filtered = state || outcomeKey || provider || query;
  const reset = () => {
    setState("");
    setOutcomeKey("");
    setProvider("");
    setSearch("");
    setQuery("");
  };
  const refresh = () => {
    live.refresh();
    calls.refresh();
  };
  const closeDrawer = () => {
    setSelected(null);
    if (params.get("call")) router.replace("/live-operations", { scroll: false });
  };

  return (
    <>
      <div className="bg-[#f8fafc] text-slate-800 font-sans antialiased text-[13px] px-6 py-5 space-y-6 min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Live Operations</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100/70 text-blue-700 uppercase tracking-wide">
                <span className="w-1 h-1 rounded-full bg-blue-600 mr-1 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor screening attempts, call progress, and agent transfers across active campaigns.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={campaignId ?? ""}
              onChange={(e) => setCampaignId(e.target.value ? Number(e.target.value) : null)}
              className="text-xs border-slate-200 rounded-lg py-1.5 pl-3 pr-7 bg-white text-slate-700 font-medium shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              title="Campaign (same as the header filter)"
            >
              <option value="">All Campaigns</option>
              {(campaignList?.campaigns ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="text-xs border-slate-200 rounded-lg py-1.5 pl-3 pr-7 bg-white text-slate-700 font-medium shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              title="Call state"
            >
              <option value="">All Call States</option>
              {Object.entries(CALL_STATES).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-52 text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
                placeholder="Search call ID, campaign or agent"
                type="text"
              />
              <Icon name="search" className="text-[16px] text-slate-400 absolute left-2.5 top-1.5" />
            </div>
            <div className="flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />
              Simulation
            </div>
            <button
              type="button"
              onClick={refresh}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm"
              title="Refresh now"
            >
              <Icon name="refresh" className="text-[18px] block" />
            </button>
            <Link
              href="/simulation-lab"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-blue-300"
              title="Run a scenario in the Simulation Lab"
            >
              <Icon name="play_circle" className="text-[16px]" />
              Run Simulation
            </Link>
          </div>
        </div>

        <ErrorNote error={live.error ?? calls.error} />

        {live.data ? <Kpis data={live.data} since={since} /> : <KpiSkeleton />}
        {live.data && <Pipeline data={live.data} />}

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <QueueToolbar
            data={calls.data}
            state={state}
            setState={setState}
            outcomeKey={outcomeKey}
            setOutcomeKey={setOutcomeKey}
            provider={provider}
            setProvider={setProvider}
            filtered={filtered}
            reset={reset}
          />
          <CallTable
            key={[state, outcomeKey, provider, query, campaignId].join("|")}
            data={calls.data}
            loading={calls.loading}
            selected={selected}
            onSelect={setSelected}
            filtered={filtered}
            onOpen={(path) => router.push(path)}
          />
        </section>

        {live.data && <Alerts alerts={live.data.alerts} now={live.data.now} onOpenCall={setSelected} />}
      </div>
      <CallDrawer callId={selected} onClose={closeDrawer} onSelect={setSelected} />
    </>
  );
}

function KpiSkeleton() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </section>
  );
}

function Kpi({ label, tag, tagClass, value, valueClass = "text-slate-900", unit, footLeft, footRight, title }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs relative" title={title}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] uppercase whitespace-nowrap ${tagClass}`}>{tag}</span>
      </div>
      <div className="mt-2 flex items-baseline space-x-1.5">
        <span className={`text-2xl font-extrabold tracking-tight ${valueClass}`}>{value}</span>
        <span className="text-[11px] text-slate-500 font-normal">{unit}</span>
      </div>
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-400 truncate">{footLeft}</span>
        <span className="font-bold text-slate-700 whitespace-nowrap">{footRight}</span>
      </div>
    </div>
  );
}

function Kpis({ data, since }) {
  const k = data.kpis;
  const safety = safetyStatus(data.safety.status);
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
      <Kpi
        label="Active Screening"
        tag="Mock bot"
        tagClass="bg-blue-50 text-blue-700"
        value={num(k.screening_dialing + k.screening_active)}
        unit="bot calls"
        footLeft={`${num(k.screening_active)} talking to the bot`}
        footRight={`${num(k.screening_dialing)} dialing`}
        title="Screening calls being dialed or talking to the mock bot right now"
      />
      <Kpi
        label="Waiting for Agent"
        tag="On hold"
        tagClass="bg-amber-50 text-amber-700"
        value={num(k.waiting_for_agent)}
        valueClass={k.waiting_for_agent ? "text-amber-600" : "text-slate-900"}
        unit="willing"
        footLeft={k.longest_wait_s !== null ? `Longest wait ${seconds(k.longest_wait_s, 0)}` : "Nobody waiting"}
        footRight={`${num(k.transferring)} transferring`}
        title="Willing borrowers on hold with no agent reserved yet"
      />
      <Kpi
        label="Active Calls"
        tag="Live"
        tagClass="bg-slate-100 text-slate-700"
        value={num(k.live_calls)}
        unit="live calls"
        footLeft={`${num(k.connected_now)} with agents`}
        footRight={`${num(k.queued)} queued`}
        title="Every call from reservation to connected, screening and direct"
      />
      <Kpi
        label="Connected"
        tag={rangeLabel(since)}
        tagClass="bg-emerald-50 text-emerald-700"
        value={num(k.connected)}
        unit="to agents"
        footLeft="Confirmed agent connections"
        footRight={`${pct(rate(data.pipeline.connected, data.pipeline.willing))} of willing`}
        title="Calls that reached an agent in the selected range (transfers confirmed by the provider, plus direct calls)"
      />
      <Kpi
        label="Safety Blocks"
        tag={safety.label}
        tagClass={`border ${safetyTag(safety.tone)}`}
        value={num(k.safety_blocks)}
        unit="blocked"
        footLeft="Reduced or forced progressive"
        footRight={num(k.safety_adjustments)}
        title="Pacing requests the safety controller rejected in the selected range"
      />
    </section>
  );
}

function safetyTag(tone) {
  return {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
  }[tone] ?? "bg-slate-100 text-slate-600 border-slate-200";
}

function Stage({ step, icon, iconClass, title, highlight, children }) {
  return (
    <div className={`rounded-lg p-3 border ${highlight ? "bg-blue-50/30 border-blue-200" : "bg-slate-50/70 border-slate-200/80"}`}>
      <div
        className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1 ${highlight ? "text-blue-600" : "text-slate-400"}`}
      >
        <span>{step}</span>
        <Icon name={icon} className={`text-[15px] ${iconClass}`} />
      </div>
      <h4 className={`font-bold text-xs mb-2 ${highlight ? "text-blue-900" : "text-slate-800"}`}>{title}</h4>
      {children}
    </div>
  );
}

function Bar({ value, className }) {
  return (
    <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
      <div className={`h-1 rounded-full ${className}`} style={{ width: `${Math.min(100, (value ?? 0) * 100)}%` }} />
    </div>
  );
}

function Pipeline({ data }) {
  const p = data.pipeline;
  const k = data.kpis;
  const notEligible = p.declined + p.callback_later + p.screening_failed;
  const missed = rate(p.willing_not_connected, p.willing);
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-blue-50 text-blue-600">
            <Icon name="account_tree" className="text-[16px] block" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm">Screening &amp; Transfer Pipeline</h2>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{rangeLabel(data.since)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <div>
            <span className="text-slate-400">Avg bot conversation:</span>
            <span className="font-bold text-slate-800 ml-1">{seconds(p.avg_bot_s)}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div>
            <span className="text-slate-400">Avg wait for agent:</span>
            <span className="font-bold text-slate-800 ml-1">{seconds(p.avg_hold_s)}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div title="Willing borrowers whose call ended without reaching an agent">
            <span className="text-slate-400">Willing, not reached:</span>
            <span className={`font-bold ml-1 ${p.willing_not_connected ? "text-rose-600" : "text-emerald-600"}`}>{pct(missed)}</span>
          </div>
        </div>
      </div>
      {p.attempts === 0 ? (
        <EmptyState icon="account_tree" title="No screening calls in this range" detail="Only campaigns with AI screening enabled go through this pipeline." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Stage step="Stage 01" icon="call" iconClass="text-slate-400" title="Screening Call">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500">Attempts</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{num(p.attempts)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{num(p.in_progress)} still in progress</p>
          </Stage>
          <Stage step="Stage 02" icon="phone_in_talk" iconClass="text-slate-400" title="Person Responds">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500">Answered</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {num(p.answered)} <span className="text-[10px] font-sans font-normal text-slate-400">({pct(rate(p.answered, p.attempts))})</span>
              </span>
            </div>
            <Bar value={rate(p.answered, p.attempts)} className="bg-blue-500" />
            <p className="text-[11px] text-slate-400 mt-1">
              {num(p.no_answer)} no answer · {num(p.busy)} busy
            </p>
          </Stage>
          <Stage step="Stage 03 • Eligible" icon="verified_user" iconClass="text-blue-600" title="Willing to Talk" highlight>
            <div className="space-y-0.5 text-xs">
              <div className="flex items-baseline justify-between">
                <span className="text-slate-600 text-[11px]">Eligible for transfer</span>
                <span className="font-bold text-blue-700 font-mono">
                  {num(p.willing)} <span className="text-[10px] font-sans font-normal text-blue-500">({pct(rate(p.willing, p.answered))})</span>
                </span>
              </div>
              <div
                className="flex items-baseline justify-between text-[11px] text-slate-400"
                title={`Declined ${p.declined}, callback later ${p.callback_later}, screening failed ${p.screening_failed}`}
              >
                <span>Not eligible</span>
                <span className="font-mono">{num(notEligible)}</span>
              </div>
            </div>
          </Stage>
          <Stage step="Stage 04" icon="schedule" iconClass="text-amber-500" title="Agent Reserved">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500">Transferring now</span>
              <span className="font-bold text-amber-600 font-mono text-sm">{num(k.transferring)}</span>
            </div>
            <div className="flex items-baseline justify-between text-[11px] text-slate-400 mt-1">
              <span>Waiting, no agent yet</span>
              <span className="font-mono">{num(k.waiting_for_agent)}</span>
            </div>
          </Stage>
          <Stage step="Stage 05" icon="check" iconClass="text-emerald-600" title="Transfer Confirmed">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-500">Provider confirmed</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">
                {num(p.connected)} <span className="text-[10px] font-sans font-normal text-slate-400">({pct(rate(p.connected, p.willing))})</span>
              </span>
            </div>
            <Bar value={rate(p.connected, p.willing)} className="bg-emerald-500" />
            <p className="text-[11px] text-slate-400 mt-1">{num(p.willing_not_connected)} willing but not connected</p>
          </Stage>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100 text-[11.5px] text-slate-600">
          <Icon name="check_circle" className="text-[16px] text-emerald-600" />
          <p>
            <strong className="text-slate-800">Eligible for transfer:</strong> the mock bot recorded the person as willing to talk. Only these
            borrowers are offered to an agent.
          </p>
        </div>
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11.5px] text-slate-600">
          <Icon name="block" className="text-[16px] text-slate-400" />
          <p>
            <strong className="text-slate-800">Not eligible:</strong> declined ({num(p.declined)}), asked for a callback ({num(p.callback_later)}),
            or the bot could not finish ({num(p.screening_failed)}). They are never transferred.
          </p>
        </div>
      </div>
    </section>
  );
}

function QueueToolbar({ data, state, setState, outcomeKey, setOutcomeKey, provider, setProvider, filtered, reset }) {
  const counts = data?.state_counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const tabs = TAB_ORDER.filter((s) => counts[s] || s === state);
  const tab = (active) =>
    active
      ? "px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs"
      : "px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium";
  const select = "text-xs border-slate-200 rounded-lg py-1 pl-2.5 pr-7 bg-white text-slate-700 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-bold text-slate-900 text-sm mr-2">Call Queue</span>
        <button type="button" className={tab(!state)} onClick={() => setState("")}>
          All ({num(total)})
        </button>
        {tabs.map((s) => (
          <button key={s} type="button" className={tab(state === s)} onClick={() => setState(s)}>
            {callState(s).label} ({num(counts[s] ?? 0)})
          </button>
        ))}
        {(data?.queued > 0 || state === "QUEUED") && (
          <button type="button" className={tab(state === "QUEUED")} onClick={() => setState("QUEUED")} title="Borrowers waiting to be dialed">
            Queued ({num(data?.queued ?? 0)})
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <select value={outcomeKey} onChange={(e) => setOutcomeKey(e.target.value)} className={select} title="Screening outcome">
          <option value="">All outcomes</option>
          {Object.entries(OUTCOMES).map(([key, o]) => (
            <option key={key} value={key}>
              {o.label}
            </option>
          ))}
        </select>
        <select value={provider} onChange={(e) => setProvider(e.target.value)} className={select} title="Provider">
          <option value="">All providers</option>
          <option value="A">{providerName("A")}</option>
          <option value="B">{providerName("B")}</option>
        </select>
        <span>
          <strong className="text-slate-800 font-semibold">{num(data?.calls.length ?? 0)}</strong> shown
        </span>
        {filtered && (
          <>
            <span className="text-slate-300">•</span>
            <button type="button" onClick={reset} className="text-blue-600 hover:underline font-medium">
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

function CallTable({ data, loading, selected, onSelect, filtered, onOpen }) {
  // the list refreshes every few seconds, so the page is clamped rather than reset
  const [page, setPage] = useState(0);
  if (!data) {
    return loading ? (
      <div className="p-4 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    ) : null;
  }
  if (data.calls.length === 0) {
    return (
      <EmptyState
        icon="call_end"
        title={filtered ? "No calls match these filters" : "No live or recent calls"}
        detail={filtered ? "Try another state, outcome or provider, or reset the filters." : "Calls appear here once a running campaign starts dialing."}
      />
    );
  }
  const now = data.now;
  const pages = Math.max(1, Math.ceil(data.calls.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = data.calls.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
          <tr>
            <th className="py-2.5 px-4">Call ID</th>
            <th className="py-2.5 px-4">Campaign</th>
            <th className="py-2.5 px-4">Screening Outcome</th>
            <th className="py-2.5 px-4">Call State</th>
            <th className="py-2.5 px-4">Assigned Agent</th>
            <th className="py-2.5 px-4">Provider</th>
            <th className="py-2.5 px-4 text-right">Duration</th>
            <th className="py-2.5 px-4">Last Event</th>
            <th className="py-2.5 px-4 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
          {rows.map((c) => {
            const active = c.id === selected;
            const s = callState(c.state);
            const o = outcome(c.outcome);
            const live = !c.ended_at && c.state !== "QUEUED";
            return (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`cursor-pointer transition-colors ${active ? "bg-blue-50/40 hover:bg-blue-50/60 border-l-4 border-l-blue-600" : "hover:bg-slate-50"}`}
              >
                <td className={`py-3 px-4 font-mono font-bold ${active ? "text-blue-600" : "text-slate-900"}`}>{c.code}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{c.campaign}</td>
                <td className="py-3 px-4">
                  <Badge tone={o.tone} dot={c.screening} title={o.hint}>
                    {o.label}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge tone={s.tone} dot={live} title={s.hint}>
                    {s.label}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  {c.agent ? (
                    <span className="text-slate-800 font-semibold">{c.agent}</span>
                  ) : c.state === "TRANSFER_PENDING" ? (
                    <span className="text-amber-600 font-medium">Waiting for agent</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">{c.provider ? providerName(c.provider) : "—"}</td>
                <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-right" title={durationHint(c)}>
                  {c.state === "QUEUED" ? "—" : duration(callDuration(c, now))}
                </td>
                <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">{ago(c.last_event_at, now)}</td>
                <td className="py-1 px-2 text-right">
                  <RowMenu
                    items={[
                      { label: "View details", icon: "visibility", onClick: () => onSelect(c.id) },
                      { label: "View campaign", icon: "campaign", onClick: () => onOpen(`/campaigns?id=${c.campaign_id}`) },
                      {
                        label: "View agent",
                        icon: "support_agent",
                        disabled: !c.agent_id,
                        hint: "No agent on this call",
                        onClick: () => onOpen(`/agents?id=${c.agent_id}`),
                      },
                      { label: "Inspect events", icon: "terminal", onClick: () => onOpen(`/event-logs?q=${encodeURIComponent(c.code)}`) },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px] text-slate-500">
        <span>
          Showing {num(current * PAGE_SIZE + 1)}-{num(current * PAGE_SIZE + rows.length)} of {num(data.calls.length)}
          {data.calls.length >= 100 && " (the 100 most relevant: live first, then the most recently ended; narrow the filters to see others)"}
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 font-medium text-slate-600"
            >
              Previous
            </button>
            <span className="px-2 font-semibold text-slate-700">
              {current + 1} / {pages}
            </span>
            <button
              type="button"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 font-medium text-slate-600"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function alertLink(a, onOpenCall) {
  const cls = "text-[11px] font-semibold text-blue-600 hover:text-blue-800";
  if (a.call_id) {
    return (
      <button type="button" className={cls} onClick={() => onOpenCall(a.call_id)}>
        Open call
      </button>
    );
  }
  if (a.provider) return <Link className={cls} href={`/provider-monitoring?provider=${a.provider}`}>View provider</Link>;
  if (a.kind === "safety" && a.campaign_id) return <Link className={cls} href={`/pacing-safety?campaign=${a.campaign_id}`}>View decisions</Link>;
  if (["reconciliation", "recovery", "duplicates", "out_of_order"].includes(a.kind)) return <Link className={cls} href="/event-logs">View events</Link>;
  return null;
}

function Alerts({ alerts, now, onOpenCall }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon name="warning" className="text-[18px] text-amber-500" />
          <h3 className="font-bold text-slate-900 text-sm">Operational Alerts &amp; Exceptions</h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">{plural(alerts.length, "alert")}</span>
        </div>
        <Link className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1" href="/event-logs">
          <span>View Event Logs &amp; Recovery</span>
          <Icon name="arrow_forward" className="text-[15px]" />
        </Link>
      </div>
      {alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl">
          <EmptyState icon="task_alt" title="Nothing needs attention right now" detail="Faults, waiting borrowers, reconciliations and safety restrictions show up here." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {alerts.map((a, i) => {
            const look = ALERT_LOOK[a.level] ?? ALERT_LOOK.info;
            return (
              <div key={`${a.kind}-${i}`} className={`p-3 border rounded-xl relative flex flex-col gap-1.5 ${look.box}`}>
                <div className="flex items-center gap-1.5">
                  <Icon name={look.icon} className={`text-[16px] ${look.title}`} />
                  <span className={`font-bold text-xs ${look.title}`}>{a.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{a.detail}</p>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-[10.5px] text-slate-400">{ago(a.at, now)}</span>
                  {alertLink(a, onOpenCall)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
