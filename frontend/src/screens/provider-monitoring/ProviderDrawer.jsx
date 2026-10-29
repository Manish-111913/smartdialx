"use client";

import Link from "next/link";
import { qs, useApi } from "@/lib/api";
import { ago, clock, duration, num, pct, seconds } from "@/lib/format";
import { eventStatus, eventType, operatorAction, providerStatus } from "@/lib/labels";
import { Badge, Drawer, EmptyState, ErrorNote, Skeleton } from "@/components/ui";

const RESULT = {
  accepted: { label: "Accepted", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  timeout: { label: "Timed out", tone: "amber" },
  pending: { label: "Waiting", tone: "slate" },
};

export default function ProviderDrawer({ name, since, onClose }) {
  const { data, error } = useApi(name ? `/providers/${name}${qs({ since })}` : null, { interval: 4000 });
  const p = data?.provider;
  const status = providerStatus(p?.status);

  return (
    <Drawer
      open={Boolean(name)}
      onClose={onClose}
      title={p?.label ?? `Mock provider ${name ?? ""}`}
      subtitle={p ? `${p.summary} · simulated provider, no real calls` : "Loading…"}
      badge={p && <Badge tone={status.tone} dot>{status.label}</Badge>}
      width="max-w-[460px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/event-logs${qs({ q: `${name}-` })}`}
            className="h-8 px-3 rounded-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-[12px] font-medium transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">manage_search</span>
            All events from {name}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 rounded-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-[12px] font-medium transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      }
    >
      <ErrorNote error={error} className="mb-4" />
      {!p ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-20" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {p.fault && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[12px] text-amber-900">
              <span className="font-semibold">Injected fault: {p.fault.label}.</span>{" "}
              {p.fault.until ? `Ends in ${duration(Math.max(0, p.fault.until - data.now))}.` : "Until cleared."}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-po-surface-container-low border border-po-surface-container">
            <Stat label="Requests" value={num(p.requests.total)} />
            <Stat label="Accepted" value={`${num(p.requests.accepted)} (${pct(p.success_rate)})`} />
            <Stat label="Timed out" value={num(p.requests.timeout)} />
            <Stat label="Rejected" value={num(p.requests.rejected)} />
            <Stat label="Error rate, last 60s" value={pct(p.error_rate_60s)} />
            <Stat label="Live calls now" value={num(p.live_calls)} />
            <Stat label="Request to ringing" value={seconds(p.avg_ring_s)} />
            <Stat label="Request to answer" value={seconds(p.avg_answer_s)} />
            <Stat label="Event delivery delay" value={seconds(p.avg_delivery_delay_s, 2)} />
            <Stat label="Duplicates / out of order" value={`${num(p.duplicates)} / ${num(p.out_of_order)}`} />
          </div>

          <div className="p-3.5 rounded-xl bg-po-surface-container-highest border border-po-surface-container flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-semibold font-body-sm text-[12.5px] text-po-secondary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Ambiguous timeouts</span>
            </div>
            <p className="font-body-sm text-[12px] text-po-on-surface leading-relaxed">
              When a call request times out, SmartDialX reconciles the request with the mock provider by its token instead of blindly initiating the call
              again. Found means the call is adopted; not found means it was never placed and is safe to retry.
            </p>
          </div>

          <Section title="Simulated behaviour">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-body-sm text-[12px]">
              <Trait label="Ring after" value={`${p.profile.ring_s[0]}-${p.profile.ring_s[1]}s`} />
              <Trait label="Answer after ringing" value={`${p.profile.answer_after_s[0]}-${p.profile.answer_after_s[1]}s`} />
              <Trait label="Rejected requests" value={pct(p.profile.reject_rate)} />
              <Trait label="Timed-out requests" value={pct(p.profile.timeout_rate)} />
              <Trait label="Dropped calls" value={pct(p.profile.drop_rate)} />
              <Trait label="Busy" value={pct(p.profile.busy_rate)} />
              <Trait label="Duplicate events" value={pct(p.profile.duplicate_rate)} />
              <Trait label="Delivery jitter" value={p.profile.jitter_s ? `up to ${p.profile.jitter_s}s` : "none"} />
            </dl>
          </Section>

          {p.campaigns.length > 0 && (
            <Section title="Campaigns on this provider">
              <div className="flex flex-wrap gap-1.5">
                {p.campaigns.map((c) => (
                  <Link key={c.id} href={`/campaigns?id=${c.id}`} className="px-2 py-0.5 rounded bg-po-surface-container text-po-primary text-[11.5px] font-medium hover:bg-po-surface-container-high">
                    {c.name}
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section title="Recent events">
            {data.events.length === 0 ? (
              <EmptyState icon="inbox" title="No events yet" />
            ) : (
              <ul className="divide-y divide-po-surface-container border border-po-surface-container rounded-lg">
                {data.events.map((e) => {
                  const s = eventStatus(e.status);
                  return (
                    <li key={e.event_id} className="px-3 py-2 flex items-center justify-between gap-2 text-[12px]">
                      <div className="min-w-0">
                        <div className="font-medium text-po-primary truncate">
                          {eventType(e.type)}
                          {e.duplicate && <span className="ml-1.5 text-[10.5px] text-po-secondary font-semibold">×{e.deliveries}</span>}
                          {e.reconciled && <span className="ml-1.5 text-[10.5px] text-po-secondary font-semibold">lookup</span>}
                        </div>
                        <div className="text-[11px] text-po-outline font-label-mono-xs">
                          {clock(e.received_at)}
                          {e.call_id && (
                            <>
                              {" · "}
                              <Link href={`/live-operations?call=${e.call_id}`} className="hover:underline text-po-secondary">
                                {e.call}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge tone={s.tone} title={e.note || undefined}>
                        {s.label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Recent call requests">
            {data.requests.length === 0 ? (
              <EmptyState icon="call" title="No requests yet" />
            ) : (
              <ul className="divide-y divide-po-surface-container border border-po-surface-container rounded-lg">
                {data.requests.map((r) => {
                  const result = RESULT[r.result ?? "pending"] ?? RESULT.pending;
                  return (
                    <li key={r.id} className="px-3 py-2 flex items-center justify-between gap-2 text-[12px]">
                      <div className="min-w-0">
                        <Link href={`/live-operations?call=${r.call_id}`} className="font-medium text-po-primary hover:underline">
                          {r.call}
                        </Link>
                        <div className="text-[11px] text-po-outline font-label-mono-xs truncate">
                          {clock(r.sent_at)}
                          {r.error ? ` · ${r.error}` : ""}
                        </div>
                      </div>
                      <Badge tone={result.tone}>{result.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Fault history">
            {data.faults.length === 0 ? (
              <p className="text-[12px] text-po-on-surface-variant">No faults injected on this provider yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.faults.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-[12px]">
                    <span className="text-po-primary">
                      {operatorAction(f.action)}
                      {f.detail ? <span className="text-po-on-surface-variant"> · {f.detail}</span> : null}
                    </span>
                    <span className="font-label-mono-xs text-[11px] text-po-outline">{ago(f.at, data.now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      )}
    </Drawer>
  );
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-label-ui text-[11px] text-po-primary uppercase font-bold tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="font-label-ui text-[10.5px] text-po-on-surface-variant uppercase font-semibold">{label}</span>
      <span className="font-label-mono-sm text-[12px] text-po-primary font-semibold mt-0.5">{value}</span>
    </div>
  );
}

function Trait({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-po-on-surface-variant">{label}</dt>
      <dd className="font-medium text-po-primary">{value}</dd>
    </div>
  );
}
