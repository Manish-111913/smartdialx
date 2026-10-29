"use client";

import Link from "next/link";
import { Badge, Drawer, ErrorNote, Skeleton } from "@/components/ui";
import { useApi } from "@/lib/api";
import { ago, clock, dateTime, duration, num, seconds } from "@/lib/format";
import { callState, endReason, eventStatus, eventType, outcome, providerName, recoveryAction, TONE } from "@/lib/labels";
import { callDuration } from "./time";

const SCREEN_RESULT_OUTCOME = { willing: "willing", unavailable: "callback_later", declined: "declined", failed: "screening_failed" };
const REQUEST_TONE = { accepted: "green", rejected: "red", timeout: "amber" };

// call milestones from the call row, provider requests, provider events and recovery
// actions, merged into one list in time order
function buildTimeline({ call: c, events, requests, recovery }) {
  const items = [];
  const add = (at, title, text, tone, extra) => {
    if (at) items.push({ at, title, text, tone, ...extra });
  };

  add(c.created_at, c.attempt > 1 ? `Queued for attempt ${c.attempt}` : "Added to the call queue", null, "gray");
  if (c.reserved_at) {
    if (c.screening) add(c.reserved_at, "Picked for a screening call", "No agent is held while the bot talks", "amber");
    else if (c.bound) add(c.reserved_at, "Agent reserved before dialing", "Progressive pacing: one free agent, one call", "amber");
    else add(c.reserved_at, "Picked for a predictive call", "An agent is claimed only if the borrower answers", "amber");
  }
  if (requests.length === 0) add(c.sending_at, `Request sent to ${providerName(c.provider)}`, null, "blue");
  for (const r of requests) {
    add(r.sent_at, `Request to ${providerName(r.provider)}: ${r.result ?? "no answer yet"}`, r.error, REQUEST_TONE[r.result] ?? "amber");
  }
  add(c.answered_at, c.screening ? "Answered, mock screening bot started" : "Answered", null, "indigo");
  if (c.screen_result_at) {
    const o = outcome(SCREEN_RESULT_OUTCOME[c.screen_result]);
    add(c.screen_result_at, `Screening outcome: ${o.label}`, c.screen_result === "willing" ? "Eligible for transfer to an agent" : "Not eligible for transfer", o.tone);
  }
  if (c.screen_result === "willing" && c.transfer_requested_at) {
    add(c.transfer_requested_at, "Waiting for a free agent", c.hold_until ? `Wait ends at ${clock(c.hold_until)}` : null, "amber");
  }
  add(
    c.connected_at,
    c.screening ? `Transfer confirmed, connected to ${c.agent ?? "an agent"}` : `Connected to ${c.agent ?? "an agent"}`,
    c.screening ? "The provider confirmed the transfer" : null,
    "green",
  );
  for (const e of events) {
    const status = eventStatus(e.status);
    add(e.received_at, `Provider event: ${eventType(e.type)}`, e.note, status.tone, {
      badges: [
        { label: status.label, tone: status.tone },
        ...(e.duplicate ? [{ label: `Delivered ${e.deliveries}x, applied once`, tone: "slate" }] : []),
        ...(e.reconciled ? [{ label: "Replayed by recovery", tone: "blue" }] : []),
      ],
    });
  }
  for (const r of recovery) {
    const a = recoveryAction(r.action);
    add(r.at, `Recovery: ${a.label}`, r.detail, a.tone);
  }
  if (c.ended_at) {
    const talk = c.talk_seconds ? ` after ${seconds(c.talk_seconds, 0)}` : "";
    add(c.ended_at, `Call ended: ${callState(c.state).label}`, `${endReason(c.end_reason)}${talk}`, callState(c.state).tone);
  }
  return items.sort((a, b) => a.at - b.at);
}

function Field({ label, children, sub }) {
  return (
    <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg min-w-0">
      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">{label}</span>
      <div className="font-bold text-slate-800 text-xs">{children}</div>
      {sub && <span className="text-[10px] text-slate-500 block mt-0.5">{sub}</span>}
    </div>
  );
}

export default function CallDrawer({ callId, onClose, onSelect }) {
  const { data, error, loading } = useApi(callId ? `/calls/${callId}` : null, { interval: 3000 });
  const detail = data && data.call.id === callId ? data : null;
  const c = detail?.call;
  const now = detail?.now;
  const state = c ? callState(c.state) : null;
  const o = c ? outcome(c.outcome) : null;

  return (
    <Drawer
      open={callId !== null}
      onClose={onClose}
      width="max-w-[460px]"
      title={<span className="font-mono text-blue-600">{c?.code ?? "Call"}</span>}
      badge={state && <Badge tone={state.tone} dot>{state.label}</Badge>}
      subtitle={c ? c.campaign : "Loading call details"}
      footer={
        c && (
          <div className="space-y-2">
            {c.agent_id && (
              <Link
                href={`/agents?id=${c.agent_id}`}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                View Agent ({c.agent})
              </Link>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/campaigns?id=${c.campaign_id}`}
                className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px] text-slate-500">campaign</span>
                View Campaign
              </Link>
              <Link
                href={`/event-logs?q=${encodeURIComponent(c.code)}`}
                className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px] text-slate-500">terminal</span>
                Inspect Events
              </Link>
            </div>
          </div>
        )
      }
    >
      <ErrorNote error={error} className="mb-3" />
      {!c && loading && (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-48" />
        </div>
      )}
      {c && (
        <div className="space-y-5">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Call attributes</h4>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Screening outcome" sub={o.hint ?? (c.screening ? "Recorded by the mock bot" : null)}>
                <span className={TONE[o.tone].text}>{o.label}</span>
              </Field>
              <Field label="Current call state" sub={state.hint}>
                {state.label}
              </Field>
            </div>
            <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Assigned agent</span>
                <span className="font-bold text-slate-900 text-xs">
                  {c.agent ?? (c.state === "TRANSFER_PENDING" ? "Waiting for a free agent" : "None")}
                </span>
              </div>
              {c.agent_code && (
                <span className="text-[10px] font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {c.agent_code}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Provider" sub={c.initiation !== "NOT_SENT" ? `Request ${c.initiation.toLowerCase()}` : "Not dialed yet"}>
                {providerName(c.provider)}
              </Field>
              <Field label="Duration / start" sub={c.sending_at ? dateTime(c.sending_at) : "Not started"}>
                <span className="font-mono">
                  {duration(callDuration(c, now))}
                  {c.ended_at ? "" : c.sending_at ? " (live)" : ""}
                </span>
              </Field>
              <Field label="Borrower" sub={`Attempt ${c.attempt}`}>
                <span className="font-mono">{c.phone ?? "—"}</span>
              </Field>
              <Field label="Last event" sub={c.last_event_at ? clock(c.last_event_at) : null}>
                {ago(c.last_event_at, now)}
              </Field>
            </div>
            {(c.end_reason || c.transfer_status) && (
              <div className="grid grid-cols-2 gap-2">
                {c.end_reason && <Field label="End reason">{endReason(c.end_reason)}</Field>}
                {c.transfer_status && (
                  <Field label="Transfer" sub="Confirmed only when the provider reports it">
                    {c.transfer_status.toLowerCase()}
                  </Field>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Event timeline</h4>
            <div className="relative pl-4 space-y-3.5 border-l-2 border-slate-200 text-xs">
              {buildTimeline(detail).map((item, i) => (
                <div key={i} className="relative">
                  <span className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${TONE[item.tone].dot}`} />
                  <div className="leading-tight">
                    <span className="font-mono text-[10px] text-slate-400">{clock(item.at)}</span>
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    {item.text && <p className="text-[11px] text-slate-500">{item.text}</p>}
                    {item.badges && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.badges.map((b) => (
                          <Badge key={b.label} tone={b.tone}>
                            {b.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {detail.attempts.length > 1 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Attempts for this borrower ({num(detail.attempts.length)})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {detail.attempts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={a.id === c.id}
                    onClick={() => onSelect(a.id)}
                    className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left text-[11.5px] hover:bg-slate-50 disabled:bg-blue-50/40 disabled:cursor-default"
                  >
                    <span className="font-mono font-semibold text-slate-800">
                      {a.code} <span className="font-sans font-normal text-slate-400">attempt {a.attempt}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-slate-500">{a.end_reason ? endReason(a.end_reason) : ""}</span>
                      <Badge tone={callState(a.state).tone}>{callState(a.state).label}</Badge>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Calls go to mock providers only. A borrower reaches an agent only after the bot records them as willing and the provider
            confirms the transfer.
          </p>
        </div>
      )}
    </Drawer>
  );
}
