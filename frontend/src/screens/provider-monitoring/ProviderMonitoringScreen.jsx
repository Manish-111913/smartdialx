"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { qs, useApi } from "@/lib/api";
import { clock, duration, num, pct, RANGES, rangeLabel, rate, seconds } from "@/lib/format";
import { eventStatus, eventType, providerStatus, TONE } from "@/lib/labels";
import { useFilters } from "@/components/Filters";
import { Badge, EmptyState, ErrorNote, Skeleton } from "@/components/ui";
import FaultPanel from "./FaultPanel";
import ProviderDrawer from "./ProviderDrawer";
import RequestChart, { SERIES } from "./RequestChart";

const ACCENT = { operational: "bg-po-on-tertiary-container", degraded: "bg-amber-500", outage: "bg-po-error" };

export default function ProviderMonitoringScreen() {
  const params = useSearchParams();
  const { since, setSince } = useFilters();
  const [search, setSearch] = useState("");
  const [chartProvider, setChartProvider] = useState(null);
  const [open, setOpen] = useState(() => {
    const p = params.get("provider");
    return p === "A" || p === "B" ? p : null;
  });

  const providers = useApi(`/providers${qs({ since })}`, { interval: 4000 });
  const events = useApi(`/events${qs({ since, limit: 8 })}`, { interval: 4000 });
  const settings = useApi("/settings", { interval: 0 });

  const data = providers.data;
  const list = data?.providers ?? [];
  const term = search.trim().toLowerCase();
  const visible = term
    ? list.filter((p) => [p.name, p.label, p.summary].some((s) => s?.toLowerCase().includes(term)))
    : list;
  const totals = list.reduce(
    (acc, p) => ({
      total: acc.total + p.requests.total,
      accepted: acc.accepted + p.requests.accepted,
      timeout: acc.timeout + p.requests.timeout,
      rejected: acc.rejected + p.requests.rejected,
    }),
    { total: 0, accepted: 0, timeout: 0, rejected: 0 },
  );

  const refresh = () => {
    providers.refresh();
    events.refresh();
  };

  return (
    <>
      <div className="font-body-md text-po-on-surface antialiased bg-po-surface px-6 py-6 min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col w-full gap-5 pb-16">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-po-surface-container-lowest p-5 rounded-xl border border-po-surface-container shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-headline-lg text-[24px] text-po-primary tracking-tight font-bold">Provider Monitoring</h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-po-surface-container text-po-primary font-label-mono-xs text-[11px] font-medium border border-po-surface-container-high">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-po-on-tertiary-container opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-po-on-tertiary-container" />
                  </span>
                  <span>Simulation environment</span>
                </div>
              </div>
              <p className="font-body-md text-[13px] text-po-on-surface-variant">
                Monitor mock provider availability, request outcomes, simulated timing, and event delivery.
              </p>
            </div>
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="relative">
                <select
                  value={since}
                  onChange={(e) => setSince(Number(e.target.value))}
                  className="h-8 pl-3 pr-8 bg-po-surface-container-low hover:bg-po-surface-container text-po-primary font-body-sm text-[13px] rounded-lg border-0 appearance-none cursor-pointer focus:ring-1 focus:ring-po-secondary transition-colors py-0"
                  title="Time range"
                >
                  {RANGES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[16px] text-po-on-surface-variant absolute right-2 top-2 pointer-events-none">expand_more</span>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[16px] text-po-outline absolute left-2.5 pointer-events-none">search</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 pr-3 bg-po-surface-container-low text-po-primary placeholder-po-outline font-body-sm text-[13px] rounded-lg border-0 focus:ring-1 focus:ring-po-secondary transition-all w-48 xl:w-56 py-0"
                  placeholder="Search providers…"
                  type="text"
                />
              </div>
              <button
                type="button"
                onClick={refresh}
                title="Refresh"
                className="w-8 h-8 rounded-lg bg-po-surface-container-low text-po-on-surface-variant hover:text-po-primary hover:bg-po-surface-container flex items-center justify-center transition-colors"
              >
                <span className={`material-symbols-outlined text-[18px] ${providers.loading ? "animate-spin" : ""}`}>refresh</span>
              </button>
            </div>
          </div>

          <ErrorNote error={providers.error} />

          {!data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Kpi label="Configured providers" badge="Mock" value={num(list.length)} unit="providers" note={list.map((p) => p.label).join(" & ")} icon="hub" />
              <Kpi
                label="Successful requests"
                badge={rangeLabel(since)}
                value={num(totals.accepted)}
                unit={pct(rate(totals.accepted, totals.total))}
                unitClass="text-po-on-tertiary-container font-semibold"
                note={`of ${num(totals.total)} call requests`}
                icon="check_circle"
                iconClass="text-po-on-tertiary-container"
              />
              <Kpi
                label="Timeouts"
                badge="Reconciled by lookup"
                value={num(totals.timeout)}
                unit={`${pct(rate(totals.timeout, totals.total))} rate`}
                note="Outcome unknown until checked by token"
                icon="hourglass_empty"
              />
              <Kpi
                label="Provider errors"
                badge="Rejected"
                value={num(totals.rejected)}
                unit={`${pct(rate(totals.rejected, totals.total))} rate`}
                unitClass="text-po-error font-medium"
                note="Provider said no; safe to retry"
                icon="shield"
                iconClass="text-po-error"
              />
            </div>
          )}

          <div className="px-4 py-2.5 rounded-xl bg-po-surface-container-low border border-po-surface-container flex items-center gap-2 text-po-on-surface-variant font-body-sm text-[12px]">
            <span className="material-symbols-outlined text-[16px] text-po-secondary shrink-0">info</span>
            <span>
              Both providers are mocks inside the backend. Timings are simulated, not network latency, and no real telecom connection is involved.
            </span>
          </div>

          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {visible.length === 0 ? (
                <div className="lg:col-span-2 bg-po-surface-container-lowest rounded-xl border border-po-surface-container">
                  <EmptyState icon="search_off" title="No provider matches that search" />
                </div>
              ) : (
                visible.map((p) => <ProviderCard key={p.name} p={p} now={data.now} onOpen={() => setOpen(p.name)} />)
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-po-surface-container-lowest rounded-xl p-5 border border-po-surface-container shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex flex-col">
                    <h2 className="font-headline-md text-[18px] text-po-primary font-bold">Request Performance</h2>
                    <span className="font-body-sm text-[12px] text-po-on-surface-variant">
                      Call requests by outcome, {data ? `${duration(data.series.bucket_s)} buckets` : "per bucket"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-po-surface-container-low p-1 rounded-lg border border-po-surface-container">
                    {[null, ...list.map((p) => p.name)].map((name) => (
                      <button
                        key={name ?? "all"}
                        type="button"
                        onClick={() => setChartProvider(name)}
                        className={`px-2.5 py-0.5 rounded font-label-mono-xs text-[11px] ${
                          chartProvider === name ? "bg-po-surface-container-lowest text-po-primary font-semibold shadow-sm" : "text-po-on-surface-variant hover:text-po-primary"
                        }`}
                      >
                        {name ? `Provider ${name}` : "All"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-4 mb-3 pb-2 border-b border-po-surface-container-low">
                  {SERIES.map((s) => (
                    <div key={s.key} className="flex items-center gap-1.5 font-body-sm text-[12px] text-po-on-surface-variant">
                      <span className={`w-2.5 h-2.5 rounded-sm ${s.swatch}`} />
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
                {data ? <RequestChart series={data.series} provider={chartProvider} /> : <Skeleton className="h-48" />}
              </div>
              <div className="mt-4 pt-3 border-t border-po-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-label-mono-xs text-[11px] text-po-outline">
                <span>Simulation output from the live console · {rangeLabel(since)}</span>
                {data && <span className="text-po-primary font-semibold">{num(totals.total)} requests</span>}
              </div>
            </div>
            {data ? (
              <FaultPanel providers={list} labels={settings.data?.faults} now={data.now} onChanged={refresh} />
            ) : (
              <Skeleton className="lg:col-span-5 h-96 rounded-xl" />
            )}
          </div>

          <div className="bg-po-surface-container-lowest rounded-xl border border-po-surface-container shadow-sm overflow-hidden">
            <div className="p-5 pb-3 border-b border-po-surface-container-low">
              <h2 className="font-headline-md text-[18px] text-po-primary font-bold">Provider Metrics</h2>
              <p className="font-body-sm text-[12px] text-po-on-surface-variant">Side-by-side reliability of the two mock providers, {rangeLabel(since).toLowerCase()}</p>
            </div>
            {!data ? (
              <div className="p-5 space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : visible.length === 0 ? (
              <EmptyState icon="search_off" title="No provider matches that search" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-[11px] uppercase tracking-wider border-b border-po-surface-container">
                      <th className="py-2.5 px-5">Provider</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Time to ring</th>
                      <th className="py-2.5 px-3 text-right">Accepted</th>
                      <th className="py-2.5 px-3 text-right">Timeouts</th>
                      <th className="py-2.5 px-3 text-right">Errors</th>
                      <th className="py-2.5 px-3 text-right">Event issues</th>
                      <th className="py-2.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-po-surface-container font-body-sm text-[13px]">
                    {visible.map((p) => (
                      <MetricsRow key={p.name} p={p} onOpen={() => setOpen(p.name)} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-3.5 bg-po-surface-container-low border-t border-po-surface-container text-po-on-surface-variant font-label-mono-xs text-[11px]">
              Time to ring is simulated by the mock (request sent to RINGING event), not measured network latency.
            </div>
          </div>

          <div className="bg-po-surface-container-lowest rounded-xl border border-po-surface-container shadow-sm overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between border-b border-po-surface-container-low">
              <h2 className="font-headline-md text-[18px] text-po-primary font-bold">Recent Provider Events</h2>
              <Link href="/event-logs" className="font-body-sm text-[12px] font-semibold text-po-secondary hover:text-po-secondary-container flex items-center gap-1 transition-colors">
                <span>View all in Event Logs &amp; Recovery</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
            <ErrorNote error={events.error} className="m-4" />
            {!events.data ? (
              <div className="p-5 space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : events.data.events.length === 0 ? (
              <EmptyState icon="inbox" title="No provider events in this range" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-[11px] uppercase tracking-wider border-b border-po-surface-container">
                      <th className="py-2.5 px-5">Time</th>
                      <th className="py-2.5 px-3">Provider</th>
                      <th className="py-2.5 px-3">Event</th>
                      <th className="py-2.5 px-3">Outcome</th>
                      <th className="py-2.5 px-3">Handling</th>
                      <th className="py-2.5 px-5">Call</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-po-surface-container font-body-sm text-[13px]">
                    {events.data.events.map((e) => (
                      <EventRow key={e.event_id} e={e} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-3.5 bg-po-surface-container-low border-t border-po-surface-container flex items-center gap-2 text-po-on-surface-variant font-body-sm text-[12px]">
              <span className="material-symbols-outlined text-[16px] text-po-on-tertiary-container shrink-0">verified_user</span>
              <span>Borrowers and phone numbers are synthetic; no customer data is involved.</span>
            </div>
          </div>
        </div>
      </div>

      <ProviderDrawer name={open} since={since} onClose={() => setOpen(null)} />
    </>
  );
}

function Kpi({ label, badge, value, unit, unitClass = "text-po-on-surface-variant font-medium", note, icon, iconClass = "text-po-secondary" }) {
  return (
    <div className="bg-po-surface-container-lowest p-4 rounded-xl border border-po-surface-container shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold tracking-wider">{label}</span>
        <span className="px-2 py-0.5 rounded bg-po-surface-container text-po-on-secondary-fixed-variant font-label-mono-xs text-[11px] font-semibold truncate">{badge}</span>
      </div>
      <div className="my-2 flex items-baseline gap-2">
        <span className="font-display-kpi text-[32px] leading-tight text-po-primary font-bold">{value}</span>
        <span className={`font-label-mono-sm text-[12px] ${unitClass}`}>{unit}</span>
      </div>
      <div className="pt-2 border-t border-po-surface-container-low flex items-center justify-between gap-2 text-po-on-surface-variant font-body-sm text-[12px]">
        <span className="truncate">{note}</span>
        <span className={`material-symbols-outlined text-[16px] ${iconClass}`}>{icon}</span>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = providerStatus(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-label-mono-xs text-[11px] font-semibold shrink-0 ${TONE[s.tone].badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${TONE[s.tone].dot}`} />
      {s.label}
    </span>
  );
}

function ProviderCard({ p, now, onOpen }) {
  const { requests: r, profile } = p;
  const share = (n) => `${r.total ? (n / r.total) * 100 : 0}%`;
  const issues = p.duplicates + p.out_of_order;
  return (
    <div className="bg-po-surface-container-lowest rounded-xl p-5 border border-po-surface-container shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${ACCENT[p.status] ?? ACCENT.operational}`} />
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-headline-md text-[18px] text-po-primary font-bold">{p.label}</span>
              <span className="font-label-mono-xs text-[11px] px-2 py-0.5 rounded bg-po-surface-container text-po-on-surface-variant font-semibold">{p.name}</span>
            </div>
            <p className="font-body-sm text-[12px] text-po-on-surface-variant">{p.summary}</p>
          </div>
          <StatusPill status={p.status} />
        </div>

        {p.fault && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">science</span>
            <span>
              <span className="font-semibold">{p.fault.label}</span> injected
              {p.fault.until ? ` · ends in ${duration(Math.max(0, p.fault.until - now))}` : " · until cleared"}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 my-4 p-3.5 rounded-lg bg-po-surface-container-low border border-po-surface-container">
          <Metric label="Time to ring" value={seconds(p.avg_ring_s)} note={`answer ${seconds(p.avg_answer_s)}`} />
          <Metric label="Success rate" value={pct(p.success_rate)} note={`${num(r.total)} req`} />
          <Metric label="Event issues" value={num(issues)} note="dups / order" accent={issues ? "text-po-secondary" : "text-po-primary"} />
        </div>

        <div className="flex flex-col gap-1.5 font-body-sm text-[12.5px]">
          <Detail
            label="Request behaviour"
            value={`${pct(profile.reject_rate)} rejected · ${pct(profile.timeout_rate)} time out · ${pct(profile.drop_rate)} drop`}
          />
          <Detail
            label="Event delivery"
            value={
              profile.duplicate_rate || profile.jitter_s
                ? `${pct(profile.duplicate_rate)} duplicated · jitter up to ${profile.jitter_s}s`
                : "On time, no duplicates"
            }
          />
          <Detail label="Observed" value={`${num(p.duplicates)} duplicates · ${num(p.out_of_order)} out of order · ${num(p.live_calls)} live calls`} />
          <div className="flex flex-col gap-1.5 pt-2">
            <div className="flex justify-between font-label-mono-xs text-[11px] text-po-on-surface-variant">
              <span>{num(r.accepted)} accepted</span>
              <span>
                {num(r.timeout)} timeouts · {num(r.rejected)} errors
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-po-surface-container overflow-hidden flex">
              <div className="h-full bg-po-on-tertiary-container" style={{ width: share(r.accepted) }} />
              <div className="h-full bg-po-secondary" style={{ width: share(r.timeout) }} />
              <div className="h-full bg-po-error" style={{ width: share(r.rejected) }} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-po-surface-container">
        <div className="flex items-center gap-1.5 text-po-on-surface-variant font-label-mono-xs text-[11px] min-w-0">
          <span className="material-symbols-outlined text-[16px] text-po-secondary">campaign</span>
          <span className="truncate">{p.campaigns.length ? p.campaigns.map((c) => c.name).join(", ") : "No campaigns use it"}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/event-logs${qs({ q: `${p.name}-` })}`}
            className="h-8 px-3 rounded-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-[12px] font-medium transition-colors flex items-center"
          >
            Events
          </Link>
          <button
            type="button"
            onClick={onOpen}
            className="h-8 px-3.5 rounded-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-[12px] font-medium transition-colors shadow-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, note, accent = "text-po-primary" }) {
  return (
    <div className="flex flex-col">
      <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">{label}</span>
      <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
        <span className={`font-headline-lg text-[22px] font-bold ${accent}`}>{value}</span>
        <span className="font-label-mono-xs text-[11px] text-po-outline">{note}</span>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-po-on-surface-variant shrink-0">{label}:</span>
      <span className="font-medium text-po-primary text-right">{value}</span>
    </div>
  );
}

function MetricsRow({ p, onOpen }) {
  const r = p.requests;
  const share = (n) => pct(rate(n, r.total));
  const issues = p.duplicates + p.out_of_order;
  return (
    <tr className="hover:bg-po-surface-container/60 transition-colors">
      <td className="py-3 px-5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-po-surface-container-high flex items-center justify-center text-po-primary font-bold text-[11px]">{p.name}</div>
          <div className="flex flex-col">
            <span className="font-semibold text-po-primary">{p.label}</span>
            <span className="font-label-mono-xs text-[11px] text-po-outline">{p.summary}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        <StatusPill status={p.status} />
      </td>
      <td className="py-3 px-3 text-right font-label-mono-sm text-[12px] font-semibold text-po-primary">{seconds(p.avg_ring_s)}</td>
      <td className="py-3 px-3 text-right">
        <span className="font-label-mono-sm text-[12px] font-medium text-po-primary">{num(r.accepted)}</span>
        <span className="font-label-mono-xs text-[11px] text-po-on-tertiary-container ml-1">({share(r.accepted)})</span>
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`font-label-mono-sm text-[12px] font-medium ${r.timeout ? "text-po-secondary" : "text-po-primary"}`}>{num(r.timeout)}</span>
        <span className="font-label-mono-xs text-[11px] text-po-outline ml-1">({share(r.timeout)})</span>
      </td>
      <td className="py-3 px-3 text-right">
        <span className={`font-label-mono-sm text-[12px] font-medium ${r.rejected ? "text-po-error" : "text-po-on-surface-variant"}`}>{num(r.rejected)}</span>
        <span className="text-po-outline text-[10px] ml-1">({share(r.rejected)})</span>
      </td>
      <td className="py-3 px-3 text-right">
        <span
          className={`px-2 py-0.5 rounded font-label-mono-xs text-[11px] ${issues ? "bg-po-surface-container-highest text-po-secondary font-semibold" : "bg-po-surface-container text-po-on-surface-variant"}`}
          title={`${p.duplicates} duplicate deliveries, ${p.out_of_order} out-of-order or late events`}
        >
          {num(issues)} (dups/order)
        </span>
      </td>
      <td className="py-3 px-5 text-right">
        <button
          type="button"
          onClick={onOpen}
          className="h-7 px-3 rounded-lg bg-po-surface-container-low hover:bg-po-surface-container text-po-primary font-body-sm text-[12px] font-medium transition-colors"
        >
          Inspect
        </button>
      </td>
    </tr>
  );
}

function EventRow({ e }) {
  const s = eventStatus(e.status);
  let handling = e.note || "—";
  if (e.duplicate) handling = `Deduplicated, delivered ${e.deliveries}× · ${handling}`;
  if (e.reconciled) handling = `From a recovery lookup · ${handling}`;
  return (
    <tr className="hover:bg-po-surface-container/60 transition-colors">
      <td className="py-2.5 px-5 font-label-mono-xs text-[11px] text-po-outline">{clock(e.received_at)}</td>
      <td className="py-2.5 px-3 font-semibold text-po-primary">Provider {e.provider}</td>
      <td className="py-2.5 px-3">{eventType(e.type)}</td>
      <td className="py-2.5 px-3">
        <Badge tone={s.tone} title={s.hint}>
          {s.label}
        </Badge>
      </td>
      <td className="py-2.5 px-3 text-po-on-surface-variant font-body-sm text-[12px] max-w-xs truncate" title={handling}>
        {handling}
      </td>
      <td className="py-2.5 px-5 font-label-mono-xs text-[11px]">
        {e.call_id ? (
          <Link href={`/live-operations?call=${e.call_id}`} className="text-po-secondary hover:underline">
            {e.call}
          </Link>
        ) : (
          <span className="text-po-outline">—</span>
        )}
      </td>
    </tr>
  );
}
