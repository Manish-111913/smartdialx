"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { qs, useApi } from "@/lib/api";
import { ago, clock, duration, num, pct, RANGES, rate } from "@/lib/format";
import { eventStatus, eventType, providerName, recoveryAction } from "@/lib/labels";
import { useFilters } from "@/components/Filters";
import { Badge, EmptyState, ErrorNote, Skeleton } from "@/components/ui";
import EventDrawer, { SEVERITY_TONE } from "./EventDrawer";
import RecoveryDrawer from "./RecoveryDrawer";
import { EXTRA_STATUS_LABELS, STATUS_FILTERS, download, eventsToCsv } from "./explain";

const PAGE = 50;

const select =
  "w-full h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm outline-none cursor-pointer py-0";

// a deep link (?q= or ?recovery=) remounts the page so it starts from that link
export default function EventLogsScreen() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const recovery = params.get("recovery");
  return <EventLogs key={`${q}|${recovery ?? ""}`} initialQuery={q} initialRecovery={recovery} />;
}

function EventLogs({ initialQuery, initialRecovery }) {
  const filters = useFilters();
  const [search, setSearch] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  // undefined = follow the header filter
  const [campaign, setCampaign] = useState(undefined);
  const [range, setRange] = useState(undefined);
  const [limit, setLimit] = useState(PAGE);
  const [eventId, setEventId] = useState(null);
  const [recoveryId, setRecoveryId] = useState(initialRecovery);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setLimit(PAGE);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const since = range ?? filters.since;
  const campaignId = campaign === undefined ? filters.campaignId : campaign === "" ? null : campaign;

  const events = useApi(`/events${qs({ type, provider, campaign: campaignId, status, q: query, since, limit })}`, { interval: 4000 });
  const recovery = useApi(`/recovery${qs({ since, limit: 50 })}`, { interval: 5000 });

  const ev = events.data;
  const rec = recovery.data;
  const totals = ev?.totals;
  const rows = ev?.events ?? [];
  const pending = rec?.pending;
  const pendingTotal = pending ? Object.values(pending).reduce((sum, n) => sum + n, 0) : 0;
  const worker = rec?.workers?.find((w) => w.status === "RUNNING");

  const change = (setter) => (value) => {
    setter(value);
    setLimit(PAGE);
  };

  function clearFilters() {
    setType("");
    setProvider("");
    setStatus("");
    setCampaign(undefined);
    setRange(undefined);
    setSearch("");
    setLimit(PAGE);
  }

  function exportRows(format) {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    if (format === "json") download(`events-${stamp}.json`, JSON.stringify(rows, null, 2), "application/json");
    else download(`events-${stamp}.csv`, eventsToCsv(rows), "text/csv");
  }

  return (
    <div className="font-body-md text-po-on-surface antialiased relative px-space-xl py-space-xl bg-po-background min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col w-full space-y-space-lg text-po-on-surface">
        <div className="relative overflow-hidden rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div className="flex items-start md:items-center gap-space-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-po-lg bg-po-surface-container text-po-on-tertiary-container">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-po-primary tracking-tight">Event Integrity Protected</span>
                <p className="font-body-sm text-body-sm text-po-on-surface-variant mt-0.5">
                  Every provider event is stored by its event id first, so a second delivery only bumps a counter, then applied in a separate
                  transaction. Out-of-order events are ranked so a call never moves backwards, and events that arrive after a call has ended
                  are recorded but not applied.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-xs shrink-0 self-start md:self-auto">
              <span className="inline-flex items-center gap-1 rounded-md bg-po-surface-container-high px-2 py-1 font-label-mono-xs text-label-mono-xs text-po-primary font-semibold">
                <span className={`h-2 w-2 rounded-po-full ${totals?.pending ? "bg-amber-500" : "bg-po-on-tertiary-container"} animate-pulse`} />
                {totals ? `${num(totals.pending)} waiting to be processed` : "Connecting…"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <h1 className="font-headline-lg text-headline-lg text-po-primary tracking-tight">Event Logs &amp; Recovery</h1>
            <p className="font-body-md text-body-md text-po-on-surface-variant">
              Inspect provider events, investigate failures, and review what automatic recovery reconciled.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs">
            <div className="relative min-w-[260px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-po-on-surface-variant text-[18px]">search</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Event id or CALL-10042"
                aria-label="Search events"
                className="w-full h-8 pl-8 pr-3 rounded-po-lg bg-po-surface-container-lowest text-po-on-surface placeholder:text-po-on-surface-variant/70 font-body-sm text-body-sm outline-none shadow-sm focus:ring-1 focus:ring-po-secondary py-0"
              />
            </div>
            <select
              aria-label="Time range"
              value={since}
              onChange={(e) => change(setRange)(Number(e.target.value))}
              className="h-8 px-2.5 rounded-po-lg bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm outline-none shadow-sm cursor-pointer hover:bg-po-surface-container-low py-0"
            >
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                events.refresh();
                recovery.refresh();
              }}
              title="Refresh now (the page also refreshes every few seconds)"
              className="h-8 px-3 rounded-po-lg bg-po-surface-container-lowest hover:bg-po-surface-container text-po-on-surface font-body-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <span className={`material-symbols-outlined text-[16px] text-po-on-tertiary-container ${events.loading ? "animate-spin" : ""}`}>sync</span>
              <span className="font-label-mono-xs text-label-mono-xs font-medium">Auto-refresh 4s</span>
            </button>
            <div className="hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-po-lg bg-po-surface-container-low font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary" />
              <span>Simulation</span>
            </div>
          </div>
        </div>

        <ErrorNote error={events.error ?? recovery.error} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {!totals || !rec ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-po-xl" />)
          ) : (
            <>
              <Kpi
                label="Total Events"
                icon="dataset"
                value={num(totals.total)}
                chip={`${num(totals.applied)} applied`}
                note="Provider callbacks stored in this range"
                aside={`${num(totals.confirmations)} confirmations`}
              />
              <Kpi
                label="Duplicate Deliveries"
                icon="filter_vintage"
                value={num(totals.duplicates)}
                chip={`${pct(rate(totals.duplicates, totals.total + totals.duplicates))} of deliveries`}
                note="Matched a stored event id"
                aside="Applied once"
              />
              <Kpi
                label="Out-of-Order & Failures"
                icon="warning"
                iconClass="bg-po-error-container text-po-error"
                value={num(totals.out_of_order)}
                chip={`${num(totals.rejected)} rejected`}
                note={`Requests: ${num(ev.requests.timeout ?? 0)} timed out, ${num(ev.requests.rejected ?? 0)} refused`}
                aside={`${num(totals.failures)} failed calls`}
              />
              <Kpi
                label="Recovery Actions"
                icon="published_with_changes"
                value={num(rec.total)}
                chip={`${num(Object.keys(rec.actions).length)} kinds`}
                note={`${num(pendingTotal)} items waiting for recovery`}
                aside={`${num(totals.reconciled)} replayed events`}
              />
            </>
          )}
        </div>

        <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col space-y-space-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-xs">
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-po-secondary text-[20px]">healing</span>
                <h2 className="font-headline-sm text-headline-sm text-po-primary tracking-tight">Recovery Overview</h2>
              </div>
              <p className="font-body-sm text-body-sm text-po-on-surface-variant mt-0.5">
                SmartDialX reconciles ambiguous provider outcomes before retrying. It does not redial a call just because a request timed out.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-po-lg bg-po-surface-container px-2.5 py-1 font-label-mono-xs text-label-mono-xs text-po-primary font-medium">
              <span className={`h-2 w-2 rounded-po-full ${worker ? "bg-po-secondary animate-pulse" : "bg-po-outline"}`} />
              {worker ? `Recovery sweep running · heartbeat ${ago(worker.last_heartbeat, rec.now)}` : "No running worker"}
            </span>
          </div>
          {!rec ? (
            <Skeleton className="h-36" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-space-md">
              <PendingCard
                title="Ambiguous Call Requests"
                count={pending.ambiguous_requests}
                note={`Provider gave no answer within ${duration(rec.timeouts.provider_request_s)}. After the ${duration(rec.timeouts.lease_s)} lease, recovery looks the request up by token; it gives up after ${duration(rec.timeouts.ambiguous_give_up_s)}.`}
              />
              <PendingCard
                title="Unconfirmed Transfers"
                count={pending.unknown_transfers}
                note="A transfer request timed out. Recovery asks the provider, then resends with the same token, which can’t transfer twice."
              />
              <PendingCard
                title="Expired Reservations"
                count={pending.expired_reservations}
                note={`Reservations past their ${duration(rec.timeouts.lease_s)} lease. If nothing was sent, the borrower and agent are released.`}
              />
              <PendingCard
                title="Quiet Live Calls"
                count={pending.quiet_calls}
                note={`No provider event for ${duration(rec.timeouts.stuck_call_s)}. Recovery asks the provider and replays its answer through the event path.`}
              />
              <div className="rounded-po-lg bg-po-surface-container-low p-space-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui text-po-on-surface font-semibold uppercase">Completed Recoveries</span>
                  <span className="px-2 py-0.5 rounded-po-full bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold">In range</span>
                </div>
                <div className="my-space-sm">
                  <span className="font-headline-lg text-headline-lg text-po-primary font-bold">{num(rec.total)}</span>
                </div>
                {Object.keys(rec.actions).length ? (
                  <ul className="space-y-0.5">
                    {Object.entries(rec.actions)
                      .sort((a, b) => b[1] - a[1])
                      .map(([action, n]) => (
                        <li key={action} className="flex items-center justify-between gap-2 font-body-sm text-[12px] text-po-on-surface-variant">
                          <span className="truncate">{recoveryAction(action).label}</span>
                          <span className="font-label-mono-xs font-semibold text-po-on-surface">{num(n)}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="font-body-sm text-body-sm text-po-on-surface-variant">Nothing needed reconciling in this range.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
            <div className="flex items-center gap-space-xs flex-wrap">
              <div className="w-2 h-2 rounded-po-full bg-po-secondary" />
              <h2 className="font-headline-sm text-headline-sm text-po-primary tracking-tight">Event Stream</h2>
              <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant bg-po-surface-container px-2 py-0.5 rounded-po">
                {ev ? `Showing ${num(rows.length)} of ${num(ev.matched)} matching events` : "Loading…"}
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              {["json", "csv"].map((format) => (
                <button
                  key={format}
                  type="button"
                  disabled={!rows.length}
                  onClick={() => exportRows(format)}
                  className="h-8 px-3 rounded-po-lg bg-po-surface-container-low hover:bg-po-surface-container text-po-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Export {format.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-xs p-space-xs bg-po-surface-container-low rounded-po-lg">
            <Filter label="EVENT TYPE">
              <select value={type} onChange={(e) => change(setType)(e.target.value)} className={select}>
                <option value="">All event types</option>
                {(ev?.types ?? []).map((t) => (
                  <option key={t} value={t}>
                    {eventType(t)}
                  </option>
                ))}
              </select>
            </Filter>
            <Filter label="PROVIDER">
              <select value={provider} onChange={(e) => change(setProvider)(e.target.value)} className={select}>
                <option value="">All providers</option>
                <option value="A">{providerName("A")}</option>
                <option value="B">{providerName("B")}</option>
              </select>
            </Filter>
            <Filter label="CAMPAIGN">
              <select
                value={campaignId ?? ""}
                onChange={(e) => change(setCampaign)(e.target.value === "" ? "" : Number(e.target.value))}
                className={select}
              >
                <option value="">All campaigns</option>
                {(ev?.campaigns ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Filter>
            <Filter label="PROCESSING STATUS">
              <select value={status} onChange={(e) => change(setStatus)(e.target.value)} className={select}>
                <option value="">All statuses</option>
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {EXTRA_STATUS_LABELS[s] ?? eventStatus(s).label}
                  </option>
                ))}
              </select>
            </Filter>
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full h-8 px-2 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-body-sm font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                <span>Clear Filters</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-po-lg bg-po-surface-container-lowest">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-8 bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-label-ui uppercase tracking-wider">
                  <th className="py-2 px-3 font-semibold">Received</th>
                  <th className="py-2 px-3 font-semibold">Event ID</th>
                  <th className="py-2 px-3 font-semibold">Event Type</th>
                  <th className="py-2 px-3 font-semibold">Call</th>
                  <th className="py-2 px-3 font-semibold">Campaign</th>
                  <th className="py-2 px-3 font-semibold">Provider</th>
                  <th className="py-2 px-3 font-semibold text-center">Severity</th>
                  <th className="py-2 px-3 font-semibold">Processing Status</th>
                  <th className="py-2 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-po-surface-container font-body-sm text-body-sm">
                {!ev &&
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="py-2 px-3">
                        <Skeleton className="h-6" />
                      </td>
                    </tr>
                  ))}
                {rows.map((e) => (
                  <tr key={e.event_id} onClick={() => setEventId(e.event_id)} className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap" title={`Occurred ${clock(e.occurred_at)}`}>
                      {clock(e.received_at)}
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary whitespace-nowrap">{e.event_id}</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-on-surface whitespace-nowrap">
                        <span className={`h-1.5 w-1.5 rounded-po-full ${e.reconciled ? "bg-po-secondary" : "bg-po-on-tertiary-container"}`} />
                        {eventType(e.type)}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-medium whitespace-nowrap">
                      {e.call_id ? (
                        <Link href={`/live-operations?call=${e.call_id}`} onClick={(x) => x.stopPropagation()} className="text-po-secondary hover:underline">
                          {e.call}
                        </Link>
                      ) : (
                        <span className="text-po-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[160px]">{e.campaign ?? "—"}</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">{providerName(e.provider)}</td>
                    <td className="py-2 px-3 text-center">
                      <Badge tone={SEVERITY_TONE[e.severity] ?? "slate"}>{e.severity}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge tone={eventStatus(e.status).tone} dot title={eventStatus(e.status).hint}>
                          {eventStatus(e.status).label}
                        </Badge>
                        {e.duplicate && (
                          <span className="font-label-mono-xs text-[10px] px-1.5 py-0.5 rounded-po bg-po-secondary-fixed text-po-on-secondary-fixed font-semibold">
                            x{e.deliveries} deliveries
                          </span>
                        )}
                        {e.reconciled && (
                          <span className="font-label-mono-xs text-[10px] px-1.5 py-0.5 rounded-po bg-po-surface-container-high text-po-secondary font-semibold">recovery</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={(x) => {
                          x.stopPropagation();
                          setEventId(e.event_id);
                        }}
                        className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ev && rows.length === 0 && (
              <EmptyState icon="manage_search" title="No events match" detail="Try a longer time range or clear the filters." />
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-po-on-surface-variant font-body-sm text-body-sm pt-space-xs flex-wrap">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Phone numbers never appear in the event log; borrowers are synthetic.</span>
            </div>
            {ev && rows.length < ev.matched && limit < 500 && (
              <button
                type="button"
                onClick={() => setLimit((l) => Math.min(500, l + PAGE))}
                className="h-8 px-3 rounded-po-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-body-sm font-medium"
              >
                Load {num(Math.min(PAGE, ev.matched - rows.length))} more
              </button>
            )}
          </div>
        </div>

        <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-po-secondary text-[20px]">rule_folder</span>
                <h2 className="font-headline-sm text-headline-sm text-po-primary tracking-tight">Recent Recovery Actions</h2>
              </div>
              <p className="font-body-sm text-body-sm text-po-on-surface-variant mt-0.5">What the recovery sweep found and fixed, newest first.</p>
            </div>
            <Link className="inline-flex items-center gap-1 text-po-secondary font-headline-sm text-body-sm hover:underline" href="/live-operations">
              <span>View Live Operations</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto rounded-po-lg bg-po-surface-container-lowest">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-8 bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-label-ui uppercase tracking-wider">
                  <th className="py-2 px-3 font-semibold">Time</th>
                  <th className="py-2 px-3 font-semibold">Recovery ID</th>
                  <th className="py-2 px-3 font-semibold">Call</th>
                  <th className="py-2 px-3 font-semibold">Recovery Type</th>
                  <th className="py-2 px-3 font-semibold">Detail</th>
                  <th className="py-2 px-3 font-semibold">Campaign</th>
                  <th className="py-2 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-po-surface-container font-body-sm text-body-sm">
                {(rec?.recovery ?? []).map((r) => (
                  <tr key={r.id} onClick={() => setRecoveryId(String(r.id))} className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap" title={ago(r.at, rec.now)}>
                      {clock(r.at)}
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">{r.code}</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-medium">
                      {r.call_id ? (
                        <Link href={`/live-operations?call=${r.call_id}`} onClick={(x) => x.stopPropagation()} className="text-po-secondary hover:underline">
                          {r.call}
                        </Link>
                      ) : (
                        <span className="text-po-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <Badge tone={recoveryAction(r.action).tone}>{recoveryAction(r.action).label}</Badge>
                    </td>
                    <td className="py-2 px-3 text-po-on-surface-variant truncate max-w-[240px]">{r.detail || "—"}</td>
                    <td className="py-2 px-3 text-po-on-surface truncate max-w-[160px]">{r.campaign ?? "—"}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={(x) => {
                          x.stopPropagation();
                          setRecoveryId(String(r.id));
                        }}
                        className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors"
                      >
                        View Recovery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rec && rec.recovery.length === 0 && (
              <EmptyState icon="task_alt" title="No recovery actions in this range" detail="Nothing timed out, went quiet or got stuck." />
            )}
            {!rec && <Skeleton className="h-24 m-2" />}
          </div>
        </div>
      </div>

      <EventDrawer eventId={eventId} onClose={() => setEventId(null)} onSelect={setEventId} />
      <RecoveryDrawer recoveryId={recoveryId} onClose={() => setRecoveryId(null)} />
    </div>
  );
}

function Kpi({ label, icon, iconClass = "bg-po-surface-container text-po-primary", value, chip, note, aside }) {
  return (
    <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-po-lg flex items-center justify-center ${iconClass}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
      </div>
      <div className="my-space-xs flex items-baseline gap-2 flex-wrap">
        <div className="font-display-kpi text-display-kpi text-po-primary leading-none tracking-tight">{value}</div>
        <span className="rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-tertiary-container font-semibold">{chip}</span>
      </div>
      <div className="pt-space-xs flex items-center justify-between gap-2">
        <span className="font-body-sm text-body-sm text-po-on-surface-variant truncate">{note}</span>
        <span className="font-label-mono-xs text-label-mono-xs text-po-secondary font-medium whitespace-nowrap">{aside}</span>
      </div>
    </div>
  );
}

function PendingCard({ title, count, note }) {
  return (
    <div className="rounded-po-lg bg-po-surface-container-low p-space-md flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="font-label-ui text-label-ui text-po-on-surface font-semibold uppercase">{title}</span>
        <span
          className={`px-2 py-0.5 rounded-po-full font-label-mono-xs text-label-mono-xs font-semibold ${
            count ? "bg-po-secondary-fixed text-po-on-secondary-fixed" : "bg-po-surface-container text-po-on-tertiary-container"
          }`}
        >
          {count ? "Pending" : "Clear"}
        </span>
      </div>
      <div className="my-space-sm">
        <span className="font-headline-lg text-headline-lg text-po-primary font-bold">{num(count)}</span>
      </div>
      <p className="font-body-sm text-body-sm text-po-on-surface-variant">{note}</p>
    </div>
  );
}

function Filter({ label, children }) {
  return (
    <div>
      <span className="block font-label-mono-xs text-label-mono-xs text-po-on-surface-variant mb-1 px-1">{label}</span>
      {children}
    </div>
  );
}
