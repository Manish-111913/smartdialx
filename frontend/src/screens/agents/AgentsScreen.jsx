"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { post, qs, useApi } from "@/lib/api";
import { ago, duration, num, pct, rangeLabel, rate } from "@/lib/format";
import { AGENT_STATE_ORDER, agentState, callState, TONE } from "@/lib/labels";
import { useFilters } from "@/components/Filters";
import { ConfirmDialog, EmptyState, ErrorNote, RowMenu, Skeleton, useAction } from "@/components/ui";
import AddAgentModal from "./AddAgentModal";
import AgentDrawer from "./AgentDrawer";
import { agentActions, AVAILABILITY, Avatar, LEGEND, StateBadge } from "./parts";

const PAGE_SIZE = 10;
const SORTS = {
  time: (a, b) => a.state_since - b.state_since,
  name: (a, b) => a.name.localeCompare(b.name),
  activity: (a, b) => b.last_activity - a.last_activity,
};
const NO_FILTERS = { search: "", status: "", availability: "", campaign: null, sort: "time" };

export default function AgentsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = Number(params.get("id")) || null;
  const { since, campaignId } = useFilters();

  const list = useApi(`/agents${qs({ since })}`, { interval: 3000 });
  const detail = useApi(selectedId ? `/agents/${selectedId}${qs({ since })}` : null, { interval: 3000 });
  const { run, busy } = useAction();

  const [filters, setFilters] = useState(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [logoff, setLogoff] = useState(null);

  const data = list.data;
  const now = data?.now;
  // the table follows the header's campaign until someone picks one here
  const campaignFilter = filters.campaign ?? (campaignId ? String(campaignId) : "");

  function update(patch) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  }

  function select(id) {
    router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });
  }

  function reload() {
    list.refresh();
    detail.refresh();
  }

  const act = {
    setState: async (agent, state) => {
      const verb = { AVAILABLE: agent.state === "OFFLINE" ? "logged in" : "is available", PAUSED: "paused", OFFLINE: "logged off" }[state];
      if (await run(() => post(`/agents/${agent.id}/state`, { state }), `${agent.name} ${verb}`)) reload();
    },
    requestPause: async (agent, on) => {
      const title = on ? `${agent.name} will pause after this call` : `Pause request cancelled for ${agent.name}`;
      if (await run(() => post(`/agents/${agent.id}/pause-request`, { on }), title)) reload();
    },
    confirmLogoff: (agent) => setLogoff(agent),
  };

  async function confirmLogoff() {
    const agent = logoff;
    const ok = await run(
      () => post(`/agents/${agent.id}/state`, { state: "OFFLINE" }),
      `${agent.name} logged off`,
      "Their live call was ended.",
    );
    setLogoff(null);
    if (ok) reload();
  }

  async function createAgent(body) {
    let created = null;
    const ok = await run(async () => {
      created = await post("/agents", body);
    }, `${body.name} added`);
    if (!ok) return false;
    list.refresh();
    select(created.agent.id);
    return true;
  }

  const agents = useMemo(() => data?.agents ?? [], [data]);
  const rows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    const allowed = filters.availability ? AVAILABILITY[filters.availability] : null;
    return agents
      .filter((a) => !term || a.name.toLowerCase().includes(term) || a.code.toLowerCase().includes(term))
      .filter((a) => !filters.status || a.state === filters.status)
      .filter((a) => !allowed || allowed.includes(a.state))
      .filter((a) => !campaignFilter || String(a.campaign?.id) === campaignFilter)
      .sort(SORTS[filters.sort]);
  }, [agents, filters, campaignFilter]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const filtered = filters.search || filters.status || filters.availability || campaignFilter;

  const s = data?.summary;
  const online = s ? s.total - s.OFFLINE : 0;
  const quick = [
    { key: "all", label: "All", count: s?.total, active: !filters.status && !filters.availability, apply: { status: "", availability: "" } },
    { key: "available", label: "Available", count: s?.AVAILABLE, active: filters.status === "AVAILABLE", apply: { status: "AVAILABLE", availability: "" } },
    { key: "connected", label: "On a call", count: s?.CONNECTED, active: filters.status === "CONNECTED", apply: { status: "CONNECTED", availability: "" } },
    {
      key: "busy",
      label: "Busy",
      count: s ? s.RESERVED + s.DIALING + s.CONNECTED + s.WRAP_UP : undefined,
      active: filters.availability === "busy",
      apply: { status: "", availability: "busy" },
    },
    { key: "inactive", label: "Inactive", count: s ? s.PAUSED + s.OFFLINE : undefined, active: filters.availability === "inactive", apply: { status: "", availability: "inactive" } },
  ];

  return (
    <div className="font-body-md text-on-surface antialiased selection:bg-indigo-100 selection:text-indigo-900 bg-[#f8fafc] min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col gap-space-lg p-space-lg lg:p-space-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Agent Management</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-mono-xs font-label-mono-xs bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold">
                Shared pool · {s ? `${num(online)} online` : "…"}
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Monitor agent availability, assignments, and readiness across your campaigns.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative flex items-center min-w-[240px] sm:w-64">
              <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-slate-400 pointer-events-none">search</span>
              <input
                value={filters.search}
                onChange={(e) => update({ search: e.target.value })}
                placeholder="Search agents by name or ID..."
                type="text"
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-white border border-slate-200 text-slate-900 font-body-sm text-body-sm shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 py-0"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`relative h-8 px-3 rounded-lg border font-body-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-colors ${
                showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span className="font-medium">Filter</span>
              {filtered && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
            </button>
            <button
              type="button"
              onClick={reload}
              title="Refresh agent roster"
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center shadow-sm transition-transform active:rotate-180"
            >
              <span className="material-symbols-outlined text-[17px]">sync</span>
            </button>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-body-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">person_add</span>
              <span className="font-medium">Add Agent</span>
            </button>
          </div>
        </div>

        <ErrorNote error={list.error} />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
          <Kpi
            label="Total Agents"
            value={s?.total}
            icon="hub"
            accent="from-indigo-500 to-blue-500"
            iconCls="bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600"
            hover="hover:border-indigo-300"
            note="In the shared agent pool"
            chip={s && `${num(online)} online`}
            chipCls="bg-indigo-50 text-indigo-700 border-indigo-200/60"
          />
          <Kpi
            label="Available"
            value={s?.AVAILABLE}
            icon="how_to_reg"
            accent="from-teal-500 to-cyan-500"
            iconCls="bg-teal-50 border-teal-100 text-teal-600 group-hover:bg-teal-600"
            hover="hover:border-teal-300"
            note="Free for the next call or transfer"
            chip={s && `${pct(rate(s.AVAILABLE, online), 0)} of online`}
            chipCls="bg-teal-50 text-teal-700 border-teal-200/60"
          />
          <Kpi
            label="On Calls"
            value={s?.CONNECTED}
            icon="support_agent"
            accent="from-emerald-500 to-teal-600"
            iconCls="bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600"
            hover="hover:border-emerald-300"
            note="Talking to a borrower now"
            chip={s && `+${num(s.RESERVED + s.DIALING)} reserved / dialing`}
            chipCls="bg-emerald-50 text-emerald-700 border-emerald-200/60"
          />
          <Kpi
            label="Paused / Offline"
            value={s ? s.PAUSED + s.OFFLINE : undefined}
            icon="bedtime"
            accent="from-amber-500 to-orange-500"
            iconCls="bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600"
            hover="hover:border-amber-300"
            note="Not taking new calls"
            chip={s && `${num(s.PAUSED)} paused / ${num(s.OFFLINE)} offline`}
            chipCls="bg-amber-50 text-amber-700 border-amber-200/60"
          />
        </div>

        <div className="rounded-xl bg-white p-space-xl shadow-sm border border-slate-200/80 flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">Agent Availability</h2>
              <span className="px-2.5 py-0.5 rounded-full text-label-mono-xs font-label-mono-xs bg-slate-50 border border-slate-200 text-slate-600 font-semibold">
                Live · refreshes every 3s
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {quick.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => update(q.apply)}
                  className={`px-3 py-1 rounded-lg text-label-ui font-label-ui transition-colors ${
                    q.active ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {q.label} ({q.count ?? "…"})
                </button>
              ))}
            </div>
          </div>
          {!s ? (
            <Skeleton className="h-16" />
          ) : (
            <div className="flex flex-col gap-space-xs mt-1">
              <div className="h-3.5 w-full rounded-md overflow-hidden flex bg-slate-100 ring-1 ring-slate-200/70">
                {AGENT_STATE_ORDER.map((state) => {
                  const st = agentState(state);
                  const n = s[state];
                  if (!n) return null;
                  return (
                    <div
                      key={state}
                      className={`${TONE[st.tone].bar} hover:opacity-90 transition-opacity cursor-pointer`}
                      style={{ width: `${(n / s.total) * 100}%` }}
                      title={`${st.label}: ${n} agent${n === 1 ? "" : "s"} (${pct(n / s.total)})`}
                      onClick={() => update({ status: state, availability: "" })}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
                {AGENT_STATE_ORDER.map((state) => {
                  const st = agentState(state);
                  return (
                    <button
                      key={state}
                      type="button"
                      title={st.hint}
                      onClick={() => update({ status: filters.status === state ? "" : state, availability: "" })}
                      className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg border cursor-pointer transition-colors ${LEGEND[st.tone]} ${
                        filters.status === state ? "ring-2 ring-indigo-300" : ""
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${TONE[st.tone].dot}`} />
                        <span className="font-body-sm text-[12px] text-slate-700 font-medium">{st.label}</span>
                      </span>
                      <span className="font-label-mono-sm text-label-mono-sm font-bold">{s[state]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-full rounded-xl bg-white shadow-sm border border-slate-200/80 flex flex-col overflow-hidden">
          <div className="p-space-md lg:px-space-xl lg:py-space-md flex flex-col gap-space-sm bg-white border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <div className="flex items-center gap-2.5">
                <h3 className="font-headline-sm text-headline-sm font-bold text-slate-900">All Agents</h3>
                <span className="px-2.5 py-0.5 rounded-full text-label-mono-xs font-label-mono-xs bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                  {num(agents.length)} total • {num(rows.length)} match
                </span>
              </div>
              <span className="text-label-mono-xs font-label-mono-xs text-slate-500">
                Call counts cover {rangeLabel(since).toLowerCase()}
              </span>
            </div>
            {showFilters && (
              <div className="flex flex-wrap items-center gap-space-xs pt-1">
                <Select value={filters.status} onChange={(v) => update({ status: v })}>
                  <option value="">Status: All states</option>
                  {AGENT_STATE_ORDER.map((st) => (
                    <option key={st} value={st}>
                      {agentState(st).label}
                    </option>
                  ))}
                </Select>
                <Select value={campaignFilter} onChange={(v) => update({ campaign: v })}>
                  <option value="">All campaigns</option>
                  {(data?.campaigns ?? []).map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Select value={filters.availability} onChange={(v) => update({ availability: v, status: "" })}>
                  <option value="">Availability: Any</option>
                  <option value="available">Available for calls</option>
                  <option value="busy">Busy (reserved, dialing, on call, wrap-up)</option>
                  <option value="inactive">Inactive (paused, offline)</option>
                </Select>
                <Select value={filters.sort} onChange={(v) => update({ sort: v })}>
                  <option value="time">Sort by: Time in state</option>
                  <option value="name">Sort by: Agent name</option>
                  <option value="activity">Sort by: Last activity</option>
                </Select>
                <button
                  type="button"
                  onClick={() => update(NO_FILTERS)}
                  className="h-8 px-3 text-slate-500 hover:text-rose-600 font-body-sm text-body-sm flex items-center gap-1 transition-colors rounded-lg hover:bg-rose-50"
                >
                  <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                  <span className="font-medium">Reset</span>
                </button>
              </div>
            )}
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-9 bg-slate-50/80 text-slate-500 font-label-ui text-label-ui uppercase tracking-wider select-none border-b border-slate-100">
                  <th className="py-2.5 px-space-lg font-semibold">Agent</th>
                  <th className="py-2.5 px-space-md font-semibold">Status</th>
                  <th className="py-2.5 px-space-md font-semibold">Current Campaign</th>
                  <th className="py-2.5 px-space-md font-semibold">Current Call</th>
                  <th className="py-2.5 px-space-md font-semibold">Time in State</th>
                  <th className="py-2.5 px-space-md font-semibold">Last Activity</th>
                  <th className="py-2.5 px-space-lg text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-body-md text-body-md text-slate-800">
                {!data &&
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="h-14">
                      <td colSpan={7} className="px-space-lg">
                        <Skeleton className="h-6" />
                      </td>
                    </tr>
                  ))}
                {visible.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => select(a.id)}
                    className={`h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group ${a.id === selectedId ? "bg-indigo-50/40" : ""}`}
                  >
                    <td className="py-3 px-space-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={a.name} state={a.state} />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{a.name}</span>
                          <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">{a.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-space-md whitespace-nowrap">
                      <StateBadge state={a.state} pauseRequested={a.pause_requested} />
                    </td>
                    <td className="py-3 px-space-md whitespace-nowrap truncate max-w-[220px]">
                      {!a.campaign ? (
                        <span className="text-slate-400">—</span>
                      ) : a.campaign_is_current ? (
                        <span className="font-medium text-slate-900">{a.campaign.name}</span>
                      ) : (
                        <span className="text-slate-400 font-body-sm text-body-sm">last: {a.campaign.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-space-md whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {a.call ? (
                        <Link href={`/live-operations?call=${a.call.id}`} className="flex flex-col leading-tight group/call">
                          <span className="font-label-mono-xs text-label-mono-xs text-indigo-600 font-bold group-hover/call:underline">{a.call.code}</span>
                          <span className="text-[11px] text-slate-500">{callState(a.call.state).label}</span>
                        </Link>
                      ) : (
                        <span className="font-label-mono-xs text-label-mono-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">
                      {duration(now - a.state_since)}
                    </td>
                    <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">{ago(a.last_activity, now)}</td>
                    <td className="py-3 px-space-lg text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Inspect agent"
                          onClick={() => select(a.id)}
                          className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[19px]">visibility</span>
                        </button>
                        <RowMenu
                          items={[
                            { label: "View details", icon: "visibility", onClick: () => select(a.id) },
                            ...agentActions(a, act).map((item) => ({ ...item, disabled: busy })),
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && rows.length === 0 && (
              <EmptyState
                icon="person_search"
                title={agents.length ? "No agents match these filters" : "No agents yet"}
                detail={agents.length ? "Try clearing the filters or the search." : "Add an agent to start taking calls."}
              />
            )}
          </div>
          <div className="p-space-md lg:px-space-xl flex flex-col sm:flex-row items-center justify-between gap-space-sm bg-white border-t border-slate-100">
            <span className="text-slate-500 font-label-mono-xs text-label-mono-xs">
              Showing{" "}
              <strong className="text-slate-800 font-semibold">
                {rows.length ? `${current * PAGE_SIZE + 1}-${current * PAGE_SIZE + visible.length}` : "0"}
              </strong>{" "}
              of {num(rows.length)} agents
            </span>
            <div className="flex items-center gap-1">
              <PageButton disabled={current === 0} onClick={() => setPage(current - 1)}>
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                Previous
              </PageButton>
              {Array.from({ length: pages }, (_, i) => (
                <PageButton key={i} active={i === current} onClick={() => setPage(i)}>
                  {i + 1}
                </PageButton>
              ))}
              <PageButton disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                Next
                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
              </PageButton>
            </div>
          </div>
        </div>
      </div>

      <AgentDrawer
        open={selectedId !== null}
        onClose={() => select(null)}
        detail={detail.data?.agent?.id === selectedId ? detail.data : null}
        error={detail.error}
        since={since}
        act={act}
        busy={busy}
      />
      <AddAgentModal open={adding} busy={busy} onClose={() => setAdding(false)} onCreate={createAgent} />
      <ConfirmDialog
        open={logoff !== null}
        danger
        busy={busy}
        title={logoff ? `Log off ${logoff.name} now?` : ""}
        confirmLabel="Log off and end call"
        message={
          logoff && (
            <>
              {logoff.name} is {agentState(logoff.state).label.toLowerCase()} on {logoff.call?.code ?? "a call"}. Logging off now ends
              that call for the borrower. Use <strong>Pause after call</strong> instead if the call should finish first.
            </>
          )
        }
        onConfirm={confirmLogoff}
        onCancel={() => setLogoff(null)}
      />
    </div>
  );
}

function Kpi({ label, value, icon, accent, iconCls, hover, note, chip, chipCls }) {
  return (
    <div className={`relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 ${hover} hover:shadow-md transition-all group overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">{label}</span>
          {value === undefined ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight">{num(value)}</span>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center group-hover:text-white transition-colors shadow-xs ${iconCls}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="mt-space-md pt-space-xs flex items-center justify-between gap-2 text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
        <span className="truncate">{note}</span>
        {chip && (
          <span className={`font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded font-semibold border whitespace-nowrap ${chipCls}`}>{chip}</span>
        )}
      </div>
    </div>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 pl-2.5 pr-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-body-sm text-body-sm focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors py-0"
    >
      {children}
    </select>
  );
}

function PageButton({ active = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-8 px-2.5 min-w-8 rounded-lg font-label-mono-xs text-label-mono-xs flex items-center justify-center gap-1 transition-colors ${
        active
          ? "bg-slate-900 text-white font-bold shadow-xs"
          : "bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
