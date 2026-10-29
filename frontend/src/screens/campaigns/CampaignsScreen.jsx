"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { patch, post, qs, useApi } from "@/lib/api";
import { ago, num, pct, rate } from "@/lib/format";
import { useFilters } from "@/components/Filters";
import { ConfirmDialog, EmptyState, ErrorNote, Modal, RowMenu, Skeleton, useAction } from "@/components/ui";
import CampaignDrawer from "./CampaignDrawer";
import CampaignForm from "./CampaignForm";
import { campaignActions, ModeBadge, ScreeningBadge, StatusBadge } from "./parts";

const PAGE_SIZE = 8;
const NO_FILTERS = { search: "", status: "", mode: "", screening: "", provider: "" };
const TABS = [
  { value: "", label: "All states" },
  { value: "RUNNING", label: "Running" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "STOPPED", label: "Stopped" },
];

export default function CampaignsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = Number(params.get("id")) || null;
  const { since } = useFilters();

  const list = useApi("/campaigns", { interval: 5000 });
  const detail = useApi(selectedId ? `/campaigns/${selectedId}${qs({ since })}` : null, { interval: 5000 });
  const { run, busy } = useAction();

  const [filters, setFilters] = useState(NO_FILTERS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState(null);
  const [stopping, setStopping] = useState(null);

  const data = list.data;
  const now = data?.now;
  const campaigns = useMemo(() => data?.campaigns ?? [], [data]);

  function update(next) {
    setFilters((f) => ({ ...f, ...next }));
    setPage(0);
  }

  function select(id) {
    router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });
  }

  function reload() {
    list.refresh();
    detail.refresh();
  }

  function openForm(campaign) {
    setForm({ campaign });
  }

  const act = {
    view: (c) => select(c.id),
    edit: (c) => openForm(c),
    setStatus: async (c, status) => {
      const verb = status === "RUNNING" ? "resumed" : "paused";
      if (await run(() => post(`/campaigns/${c.id}/status`, { status }), `${c.name} ${verb}`)) reload();
    },
    duplicate: async (c) => {
      let copy = null;
      const ok = await run(
        async () => {
          copy = await post(`/campaigns/${c.id}/duplicate`);
        },
        `Copy of ${c.name} created`,
        "It starts paused so you can review it first.",
      );
      if (ok) {
        list.refresh();
        select(copy.campaign.id);
      }
    },
    stop: (c) => setStopping(c),
  };

  async function confirmStop() {
    const c = stopping;
    const ok = await run(() => post(`/campaigns/${c.id}/status`, { status: "STOPPED" }), `${c.name} stopped`);
    setStopping(null);
    if (ok) reload();
  }

  async function save(body) {
    const editing = form.campaign;
    let saved = null;
    if (editing && Object.keys(body).length === 0) {
      setForm(null);
      return;
    }
    const ok = await run(
      async () => {
        saved = editing ? await patch(`/campaigns/${editing.id}`, body) : await post("/campaigns", body);
      },
      editing ? `${body.name ?? editing.name} updated` : `${body.name} created`,
      editing ? "Calls already placed keep the settings they started with." : body.status === "PAUSED" ? "Created paused." : "Dialing starts on the next pacing round.",
    );
    if (!ok) return;
    setForm(null);
    list.refresh();
    if (editing) detail.refresh();
    else select(saved.campaign.id);
  }

  const rows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return campaigns
      .filter((c) => !term || c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term))
      .filter((c) => !filters.status || c.display_status === filters.status)
      .filter((c) => !filters.mode || c.mode === filters.mode)
      .filter((c) => !filters.screening || String(c.screening) === filters.screening)
      .filter((c) => !filters.provider || c.provider === filters.provider);
  }, [campaigns, filters]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const dropdownActive = filters.mode || filters.screening || filters.provider || filters.status;
  const s = data?.summary;
  const pool = data?.agent_pool;

  return (
    <div className="font-sans text-[#172033] antialiased selection:bg-blue-100 selection:text-blue-900 bg-[#F6F8FB] min-h-[calc(100vh-3.5rem)]">
      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] font-bold text-[#172033] tracking-tight">Campaign Management</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] border border-slate-200">
                Mock providers · synthetic borrowers
              </span>
            </div>
            <p className="text-[13px] text-[#667085] mt-0.5">Configure calling campaigns, screening behavior, and dialing strategies.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[17px] pointer-events-none">search</span>
              <input
                value={filters.search}
                onChange={(e) => update({ search: e.target.value })}
                placeholder="Search campaigns..."
                type="text"
                className="w-full h-8 pl-8 pr-3 bg-white text-[#172033] placeholder:text-slate-400 text-[12px] rounded-lg border border-[#E5EAF1] shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all py-0"
              />
            </div>
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                className="h-8 px-2.5 rounded-lg bg-white border border-[#E5EAF1] text-slate-600 hover:text-slate-900 text-[12px] font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">tune</span>
                <span>Filters</span>
                {dropdownActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl z-50 p-3 flex flex-col gap-3 border border-[#E5EAF1]">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-mono text-[10px] uppercase font-semibold text-slate-400">Filter criteria</span>
                      <button type="button" className="font-mono text-[10px] text-blue-600 hover:underline cursor-pointer" onClick={() => update(NO_FILTERS)}>
                        Reset all
                      </button>
                    </div>
                    <FilterSelect label="Status" value={filters.status} onChange={(v) => update({ status: v })}>
                      {TABS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </FilterSelect>
                    <FilterSelect label="Dialing mode" value={filters.mode} onChange={(v) => update({ mode: v })}>
                      <option value="">All modes</option>
                      <option value="predictive">Predictive</option>
                      <option value="progressive">Progressive</option>
                    </FilterSelect>
                    <FilterSelect label="AI screening" value={filters.screening} onChange={(v) => update({ screening: v })}>
                      <option value="">Screening on or off</option>
                      <option value="true">AI screening</option>
                      <option value="false">Direct dial</option>
                    </FilterSelect>
                    <FilterSelect label="Provider" value={filters.provider} onChange={(v) => update({ provider: v })}>
                      <option value="">Both providers</option>
                      <option value="A">Mock provider A</option>
                      <option value="B">Mock provider B</option>
                    </FilterSelect>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={reload}
              title="Refresh"
              className="w-8 h-8 rounded-lg bg-white border border-[#E5EAF1] text-slate-400 hover:text-blue-600 hover:bg-slate-50 shadow-xs flex items-center justify-center transition-transform active:rotate-180 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">refresh</span>
            </button>
            <button
              type="button"
              onClick={() => openForm(null)}
              className="h-8 px-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-[12.5px] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

        <ErrorNote error={list.error} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Kpi
            label="Total campaigns"
            value={s?.total}
            badge={
              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[15px]">folder_copy</span>
              </span>
            }
            aside={s && `${num(s.stopped)} stopped`}
            note="Every campaign on this console"
          />
          <Kpi
            label="Running"
            value={s?.running}
            valueCls="text-emerald-600"
            badge={
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            }
            aside={s && `${num(s.targets_remaining)} borrowers queued`}
            asideCls="text-emerald-700"
            note="Dialing through the mock providers"
          />
          <Kpi
            label="Paused"
            value={s?.paused}
            valueCls="text-amber-600"
            badge={
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[10px] font-bold border border-amber-200/60">
                HOLD
              </span>
            }
            aside={s && (s.paused ? "Waiting for resume" : "None on hold")}
            asideCls="text-amber-700"
            note="No new calls; waiting borrowers still served"
          />
          <Kpi
            label="Completed"
            value={s?.completed}
            badge={
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9.5px] font-bold border border-slate-200">
                DONE
              </span>
            }
            aside={s && "No borrowers left to call"}
            note="Every borrower has an outcome"
          />
        </div>

        <div className="bg-white rounded-xl border border-[#E5EAF1] shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-[#E5EAF1] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-bold text-slate-900">All Campaigns</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-mono text-[10.5px] font-medium">
                {num(campaigns.length)} total • {num(rows.length)} in view
              </span>
              <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Refreshes every 5s</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update({ status: t.value })}
                  className={`px-2.5 py-1 rounded-md text-[11.5px] cursor-pointer transition-all ${
                    filters.status === t.value
                      ? "bg-white border border-[#E5EAF1] text-blue-600 font-semibold shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 font-medium"
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <button type="button" className="text-blue-600 font-mono text-[11px] hover:underline ml-1 cursor-pointer" onClick={() => update(NO_FILTERS)}>
                Reset
              </button>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-9 bg-slate-50/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider select-none border-b border-[#E5EAF1]">
                  <th className="py-2 px-4 font-semibold">Campaign name</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Dialing mode</th>
                  <th className="py-2 px-3 font-semibold">Screening</th>
                  <th className="py-2 px-3 font-semibold text-right">Call targets</th>
                  <th className="py-2 px-3 font-semibold text-right">Connected</th>
                  <th className="py-2 px-3 font-semibold">Agent pool</th>
                  <th className="py-2 px-3 font-semibold">Last updated</th>
                  <th className="py-2 px-3 font-semibold text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF1] text-[12.5px]">
                {!data &&
                  Array.from({ length: 4 }, (_, i) => (
                    <tr key={i} className="h-12">
                      <td colSpan={9} className="px-4">
                        <Skeleton className="h-6" />
                      </td>
                    </tr>
                  ))}
                {visible.map((c) => {
                  const done = rate(c.resolved, c.targets);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => select(c.id)}
                      className={`h-12 hover:bg-blue-50/30 cursor-pointer transition-colors group ${c.id === selectedId ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
                            <span>{c.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-normal">{c.code}</span>
                          </div>
                          <span className="font-mono text-[10.5px] text-slate-400 truncate max-w-[260px]">{c.description || "No description"}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={c.display_status} />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <ModeBadge mode={c.mode} />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <ScreeningBadge screening={c.screening} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                        <div className="flex flex-col items-end" title={`${num(c.resolved)} of ${num(c.targets)} borrowers have an outcome; ${num(c.attempts)} calls placed`}>
                          <span className="text-slate-900 font-semibold">{num(c.targets)}</span>
                          <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                            <div className={`h-full rounded-full ${c.display_status === "PAUSED" ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${(done ?? 0) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5">{num(c.attempts)} calls placed</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                        <span className="text-slate-900 font-semibold">{num(c.connected)}</span>
                        <span className="text-slate-400 text-[10.5px] ml-1">({pct(rate(c.connected, c.targets))})</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5" title={pool ? `${pool.name}: ${pool.note}` : undefined}>
                          <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                          <div className="flex flex-col leading-tight">
                            <span>Shared pool</span>
                            {pool && <span className="font-mono text-[10px] text-slate-400">{num(pool.online)} online</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{ago(c.last_activity, now)}</td>
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <RowMenu items={campaignActions(c, act).map((a) => ({ ...a, disabled: a.disabled || busy }))} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data && rows.length === 0 && (
              <EmptyState
                icon="campaign"
                title={campaigns.length ? "No campaigns match these filters" : "No campaigns yet"}
                detail={campaigns.length ? "Clear the filters or the search to see all campaigns." : "Create a campaign to start dialing."}
              />
            )}
          </div>
          <div className="px-4 py-2.5 bg-slate-50/50 border-t border-[#E5EAF1] flex items-center justify-between text-slate-500 text-[12px]">
            <span className="font-mono text-[11px]">
              {rows.length
                ? `Showing rows ${current * PAGE_SIZE + 1} - ${current * PAGE_SIZE + visible.length} of ${num(rows.length)}`
                : "No rows"}
            </span>
            <div className="flex items-center gap-1">
              <PageButton disabled={current === 0} onClick={() => setPage(current - 1)}>
                Previous
              </PageButton>
              {Array.from({ length: pages }, (_, i) => (
                <PageButton key={i} active={i === current} onClick={() => setPage(i)}>
                  {i + 1}
                </PageButton>
              ))}
              <PageButton disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                Next
              </PageButton>
            </div>
          </div>
        </div>
      </div>

      <CampaignDrawer
        open={selectedId !== null}
        onClose={() => select(null)}
        detail={detail.data?.campaign?.id === selectedId ? detail.data : null}
        error={detail.error}
        audiences={data?.audiences}
        act={act}
        busy={busy}
      />

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        width="max-w-xl"
        title={
          <span className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[19px]">{form?.campaign ? "edit_note" : "campaign"}</span>
            </span>
            {form?.campaign ? `Edit ${form.campaign.name}` : "Create New Campaign"}
          </span>
        }
        subtitle={
          form?.campaign
            ? "Changes apply to new calls. Calls already placed keep the settings they started with."
            : "Set the dialing strategy, mock screening and who the campaign calls."
        }
      >
        {form && (
          <CampaignForm
            key={form.campaign?.id ?? "new"}
            campaign={form.campaign}
            audiences={data?.audiences}
            pool={pool}
            busy={busy}
            onSubmit={save}
            onCancel={() => setForm(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={stopping !== null}
        danger
        busy={busy}
        title={stopping ? `Stop ${stopping.name}?` : ""}
        confirmLabel="Stop campaign"
        message={
          stopping && (
            <>
              Stopping is final. The {num(stopping.queued)} borrower{stopping.queued === 1 ? "" : "s"} still queued will be cancelled and
              never dialed. The {num(stopping.live)} call{stopping.live === 1 ? "" : "s"} in progress finish normally. To run it again later,
              duplicate it instead.
            </>
          )
        }
        onConfirm={confirmStop}
        onCancel={() => setStopping(null)}
      />
    </div>
  );
}

function Kpi({ label, value, valueCls = "text-slate-900", badge, aside, asideCls = "text-slate-500", note }) {
  return (
    <div className="bg-white p-3.5 rounded-xl border border-[#E5EAF1] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase font-semibold tracking-wider text-slate-400">{label}</span>
        {badge}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {value === undefined ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <span className={`text-[28px] font-bold leading-none ${valueCls}`}>{num(value)}</span>
        )}
        {aside && <span className={`font-mono text-[10.5px] font-medium ${asideCls}`}>{aside}</span>}
      </div>
      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 truncate">{note}</div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] text-slate-400 uppercase">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 px-2 bg-slate-50 border border-[#E5EAF1] text-slate-800 rounded text-[12px] focus:outline-none py-0"
      >
        {children}
      </select>
    </div>
  );
}

function PageButton({ active = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-2 py-1 rounded text-[11px] border ${
        active
          ? "bg-blue-600 text-white font-mono font-semibold border-blue-600"
          : "bg-white text-slate-700 hover:bg-slate-100 border-[#E5EAF1] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      }`}
    >
      {children}
    </button>
  );
}
