"use client";

import Link from "next/link";
import { useApi } from "@/lib/api";
import { clock, dateTime, seconds } from "@/lib/format";
import { callState, endReason, eventStatus, eventType, outcome, providerName, recoveryAction } from "@/lib/labels";
import { Badge, Drawer, EmptyState, ErrorNote, Skeleton } from "@/components/ui";
import { RECOVERY_EXPLAIN } from "./explain";

const REQUEST_RESULT = {
  accepted: "Provider accepted the request",
  rejected: "Provider rejected the request (or recovery confirmed it was never placed)",
  timeout: "Timed out: nobody knew whether the call existed",
};

/** Everything we know about the call, in time order. */
function buildTimeline(detail, highlight) {
  const c = detail.call;
  const items = [{ at: c.created_at, title: `Queued (attempt ${c.attempt})` }];
  if (c.reserved_at) items.push({ at: c.reserved_at, title: c.bound ? "Reserved together with an agent" : "Borrower reserved" });
  for (const r of detail.requests ?? []) {
    items.push({
      at: r.sent_at,
      title: `Call request sent to ${providerName(r.provider)}`,
      detail: r.result ? `${REQUEST_RESULT[r.result] ?? r.result}${r.error ? ` (${r.error})` : ""}` : "No result recorded yet",
      tone: r.result === "accepted" ? "ok" : r.result ? "warn" : undefined,
    });
  }
  if (c.initiated_at) items.push({ at: c.initiated_at, title: "Provider confirmed the call" });
  for (const e of detail.events ?? []) {
    items.push({
      at: e.received_at,
      title: `${e.reconciled ? "Replayed event" : "Provider event"}: ${eventType(e.type)}`,
      detail: `${eventStatus(e.status).label}${e.note ? ` · ${e.note}` : ""}${e.duplicate ? ` · delivered ${e.deliveries} times` : ""}`,
    });
  }
  if (c.answered_at) items.push({ at: c.answered_at, title: "Answered" });
  if (c.screen_result_at) items.push({ at: c.screen_result_at, title: `Screening result: ${outcome(c.outcome).label}` });
  if (c.connected_at) items.push({ at: c.connected_at, title: `Connected to ${c.agent ?? "an agent"}` });
  for (const r of detail.recovery ?? []) {
    items.push({ at: r.at, title: `Recovery: ${recoveryAction(r.action).label}`, detail: r.detail, tone: "recovery", current: r.id === highlight });
  }
  if (c.ended_at) items.push({ at: c.ended_at, title: `Ended: ${endReason(c.end_reason)}` });
  return items.sort((a, b) => a.at - b.at);
}

export default function RecoveryDrawer({ recoveryId, onClose }) {
  const id = recoveryId ? Number(recoveryId) : null;
  const { data, error } = useApi(id ? `/recovery/${id}` : null, { interval: 0 });
  const rec = data?.recovery?.id === id ? data.recovery : null;
  const detail = rec ? data.call : null;
  const action = rec ? recoveryAction(rec.action) : null;

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width="max-w-[540px]"
      title={rec?.code ?? `REC-${recoveryId}`}
      badge={action && <Badge tone={action.tone}>{action.label}</Badge>}
      subtitle="Automatic recovery action"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">{rec ? dateTime(rec.at) : ""}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-po-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-body-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      <ErrorNote error={error} className="mb-3" />
      {!rec ? (
        error ? (
          <EmptyState icon="search_off" title="Recovery action not available" />
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-40" />
          </div>
        )
      ) : (
        <div className="space-y-space-md font-body-sm text-body-sm">
          <div className="rounded-po-lg bg-po-surface-container-low p-space-sm grid grid-cols-2 gap-space-sm">
            <div>
              <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant uppercase block">Call</span>
              {rec.call_id ? (
                <Link href={`/live-operations?call=${rec.call_id}`} className="font-label-mono-xs text-label-mono-xs text-po-secondary font-bold hover:underline">
                  {rec.call}
                </Link>
              ) : (
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface">Not tied to a call</span>
              )}
            </div>
            <div>
              <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant uppercase block">Campaign</span>
              {rec.campaign_id ? (
                <Link href={`/campaigns?id=${rec.campaign_id}`} className="font-body-sm text-body-sm text-po-secondary font-semibold hover:underline">
                  {rec.campaign}
                </Link>
              ) : (
                <span className="text-po-on-surface-variant">—</span>
              )}
            </div>
            <div>
              <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant uppercase block">Agent involved</span>
              {rec.agent_id ? (
                <Link href={`/agents?id=${rec.agent_id}`} className="font-label-mono-xs text-label-mono-xs text-po-secondary font-semibold hover:underline">
                  {rec.agent_code}
                </Link>
              ) : (
                <span className="text-po-on-surface-variant">None</span>
              )}
            </div>
            <div>
              <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant uppercase block">Recorded detail</span>
              <span className="text-po-on-surface">{rec.detail || "—"}</span>
            </div>
          </div>

          <div className="space-y-space-sm">
            <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-po-secondary shrink-0">satellite_alt</span>
              <div>
                <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block mb-0.5">What recovery checked and did</span>
                <p className="text-po-on-surface leading-relaxed">{RECOVERY_EXPLAIN[rec.action] ?? action.hint ?? "See the call timeline below."}</p>
              </div>
            </div>
            {detail && (
              <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-po-on-tertiary-container shrink-0">check_circle</span>
                <div className="flex flex-col gap-1">
                  <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Where the call ended up</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={callState(detail.call.state).tone}>{callState(detail.call.state).label}</Badge>
                    {detail.call.end_reason && <span className="text-po-on-surface">{endReason(detail.call.end_reason)}</span>}
                  </div>
                  <span className="text-po-on-surface-variant">
                    {providerName(detail.call.provider)} · request status {detail.call.initiation?.toLowerCase()}
                    {detail.call.transfer_status ? ` · transfer ${detail.call.transfer_status.toLowerCase()}` : ""}
                  </span>
                </div>
              </div>
            )}
          </div>

          {detail && (
            <div>
              <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block mb-2">Call Timeline</span>
              <ol className="relative border-l border-po-surface-container-high ml-2 space-y-3">
                {buildTimeline(detail, rec.id).map((item, i) => (
                  <li key={i} className="pl-4 relative">
                    <span
                      className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-po-full ring-2 ring-white ${
                        item.current ? "bg-po-secondary" : item.tone === "warn" ? "bg-amber-500" : item.tone === "recovery" ? "bg-po-on-tertiary-container" : "bg-po-outline"
                      }`}
                    />
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`text-po-on-surface ${item.current ? "font-bold" : "font-medium"}`}>{item.title}</span>
                      <span className="font-label-mono-xs text-[10.5px] text-po-on-surface-variant shrink-0">{clock(item.at)}</span>
                    </div>
                    {item.detail && <p className="text-po-on-surface-variant text-[12px]">{item.detail}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {detail?.attempts?.length > 1 && (
            <div>
              <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block mb-1">Attempts For This Borrower</span>
              <div className="flex flex-col gap-1">
                {detail.attempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-po bg-po-surface-container">
                    <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface">
                      #{a.attempt} · {a.code}
                    </span>
                    <span className="flex items-center gap-2">
                      {a.end_reason && <span className="text-[11.5px] text-po-on-surface-variant">{endReason(a.end_reason)}</span>}
                      <Badge tone={callState(a.state).tone}>{callState(a.state).label}</Badge>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[11.5px] text-po-on-surface-variant">
                A retry is a new queued attempt that waits for its turn; recovery never redials on the spot.
              </p>
            </div>
          )}

          {detail && detail.call.ended_at && detail.call.sending_at && (
            <p className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
              From request to final state: {seconds(detail.call.ended_at - detail.call.sending_at)}
            </p>
          )}
        </div>
      )}
    </Drawer>
  );
}
