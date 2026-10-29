"use client";

import Link from "next/link";
import { useApi } from "@/lib/api";
import { clock, dateTime, seconds } from "@/lib/format";
import { callState, endReason, eventStatus, eventType, providerName } from "@/lib/labels";
import { Badge, Drawer, EmptyState, ErrorNote, Skeleton, useToast } from "@/components/ui";
import { STATUS_EXPLAIN } from "./explain";

export const SEVERITY_TONE = { info: "slate", warning: "amber", error: "red" };

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block uppercase">{label}</span>
      <span className="font-label-mono-xs text-label-mono-xs font-semibold text-po-primary break-all">{children}</span>
    </div>
  );
}

export default function EventDrawer({ eventId, onClose, onSelect }) {
  const toast = useToast();
  const { data, error } = useApi(eventId ? `/events/${encodeURIComponent(eventId)}` : null, { interval: 5000 });
  const ev = data?.event?.event_id === eventId ? data.event : null;
  const call = ev ? data.call : null;
  const related = ev ? (data.related ?? []) : [];

  function copy() {
    navigator.clipboard.writeText(JSON.stringify(ev, null, 2)).then(
      () => toast({ tone: "success", title: "Event JSON copied" }),
      () => toast({ tone: "error", title: "Couldn't copy", detail: "The browser blocked clipboard access." }),
    );
  }

  return (
    <Drawer
      open={!!eventId}
      onClose={onClose}
      title={eventId}
      badge={ev && <Badge tone={SEVERITY_TONE[ev.severity] ?? "slate"}>{ev.severity}</Badge>}
      subtitle="Provider event record"
      footer={
        <div className="flex items-center justify-between gap-2">
          {ev?.call_id ? (
            <Link href={`/live-operations?call=${ev.call_id}`} className="font-body-sm text-body-sm text-po-secondary font-semibold hover:underline">
              Open {ev.call} in Live Operations
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!ev}
            onClick={copy}
            className="px-3 py-1.5 rounded-po-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-body-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            <span>Copy Raw JSON</span>
          </button>
        </div>
      }
    >
      <ErrorNote error={error} className="mb-3" />
      {!ev ? (
        error ? (
          <EmptyState icon="search_off" title="Event not available" />
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-24" />
          </div>
        )
      ) : (
        <div className="space-y-space-md font-body-sm text-body-sm">
          <div className="grid grid-cols-2 gap-space-sm bg-po-surface-container-low p-space-sm rounded-po-lg">
            <Field label="Received">{dateTime(ev.received_at)}</Field>
            <Field label="Occurred at provider">{dateTime(ev.occurred_at)}</Field>
            <Field label="Processed">{ev.processed_at ? dateTime(ev.processed_at) : "Not yet"}</Field>
            <Field label="Delivery delay">{ev.occurred_at ? seconds(ev.received_at - ev.occurred_at) : "—"}</Field>
            <Field label="Event type">
              {eventType(ev.type)} <span className="text-po-on-surface-variant font-normal">({ev.type})</span>
            </Field>
            <Field label="Call">
              {ev.call_id ? (
                <Link href={`/live-operations?call=${ev.call_id}`} className="text-po-secondary hover:underline">
                  {ev.call}
                </Link>
              ) : (
                "No matching call"
              )}
            </Field>
            <Field label="Campaign">
              {ev.campaign_id ? (
                <Link href={`/campaigns?id=${ev.campaign_id}`} className="text-po-secondary hover:underline">
                  {ev.campaign}
                </Link>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Provider">{providerName(ev.provider)}</Field>
            <Field label="Provider call id">{ev.provider_call_id ?? "—"}</Field>
            <Field label="Deliveries">{ev.deliveries}</Field>
            <Field label="Reason">{ev.reason ?? "—"}</Field>
            <Field label="Talk time">{ev.talk_seconds !== null ? seconds(ev.talk_seconds) : "—"}</Field>
          </div>

          <div className="space-y-space-xs">
            <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block">State Machine Decision</span>
            <div className="rounded-po-lg bg-po-surface-container-low p-space-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge tone={eventStatus(ev.status).tone} dot>
                  {eventStatus(ev.status).label}
                </Badge>
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">outcome: {ev.outcome ?? "pending"}</span>
              </div>
              {ev.note && (
                <p className="p-1.5 rounded-po bg-po-surface-container-lowest text-po-secondary font-label-mono-xs text-label-mono-xs font-semibold text-center">{ev.note}</p>
              )}
              <p className="text-po-on-surface leading-relaxed">{STATUS_EXPLAIN[ev.status]}</p>
              {ev.duplicate && (
                <p className="text-po-on-surface-variant leading-relaxed">
                  Delivered {ev.deliveries} times. The repeats hit the stored event id and only bumped the delivery counter, so the event was
                  applied once.
                </p>
              )}
              {ev.reconciled && (
                <p className="text-po-on-surface-variant leading-relaxed">
                  Created by recovery after it asked the provider for this call’s status, then run through the same event path as a real
                  callback.
                </p>
              )}
            </div>
          </div>

          <div>
            <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block mb-1">Call Right Now</span>
            {call ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={callState(call.state).tone}>{callState(call.state).label}</Badge>
                {call.end_reason && <span className="text-po-on-surface-variant">{endReason(call.end_reason)}</span>}
              </div>
            ) : (
              <span className="text-po-on-surface-variant">No call is linked to this event.</span>
            )}
          </div>

          <div>
            <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block mb-1">
              Other Events For The Same Provider Call
            </span>
            {related.length === 0 ? (
              <span className="text-po-on-surface-variant">None.</span>
            ) : (
              <div className="flex flex-col gap-1">
                {related.map((r) => (
                  <button
                    key={r.event_id}
                    type="button"
                    onClick={() => onSelect(r.event_id)}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-left"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">{clock(r.received_at)}</span>
                      <span className="font-label-mono-xs text-label-mono-xs font-semibold text-po-secondary truncate">{eventType(r.type)}</span>
                      {r.duplicate && <span className="font-label-mono-xs text-[10px] text-po-on-surface-variant">x{r.deliveries}</span>}
                    </span>
                    <Badge tone={eventStatus(r.status).tone}>{eventStatus(r.status).label}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
