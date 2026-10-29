"use client";

import Link from "next/link";
import { ago, clock, duration, num, plural, rangeLabel } from "@/lib/format";
import { callState, endReason, feedKind, feedResult, outcome, TONE } from "@/lib/labels";
import { Badge, Drawer, EmptyState, ErrorNote, Skeleton } from "@/components/ui";
import { agentActions, Avatar, BUSY, StateBadge } from "./parts";

function Info({ label, children }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-1 min-w-0">
      <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
      <div className="font-body-sm text-[13px] font-semibold text-slate-900 truncate">{children}</div>
    </div>
  );
}

export default function AgentDrawer({ open, onClose, detail, error, since, act, busy }) {
  const agent = detail?.agent;
  const now = detail?.now;
  const call = agent?.call;
  const callStart = call ? call.connected_at ?? call.reserved_at : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-[440px]"
      title={
        agent ? (
          <span className="flex items-center gap-3">
            <Avatar name={agent.name} state={agent.state} size="w-10 h-10 text-[13px]" />
            <span className="truncate">{agent.name}</span>
          </span>
        ) : (
          "Agent"
        )
      }
      badge={agent && <StateBadge state={agent.state} pauseRequested={agent.pause_requested} />}
      subtitle={agent && <span className="font-label-mono-xs text-label-mono-xs">{agent.code}</span>}
    >
      <ErrorNote error={error} className="mb-4" />
      {!agent ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <Info label={agent.campaign_is_current ? "Current campaign" : "Last campaign"}>
              {agent.campaign ? (
                <Link href={`/campaigns?id=${agent.campaign.id}`} className="hover:text-indigo-600 hover:underline">
                  {agent.campaign.name}
                </Link>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </Info>
            <Info label="Active call">
              {call ? (
                <Link href={`/live-operations?call=${call.id}`} className="font-label-mono-xs text-[12px] font-bold text-indigo-600 hover:underline">
                  {call.code}
                  <span className="text-slate-500 font-medium">
                    {" "}
                    · {callState(call.state).label}
                    {callStart && now ? ` ${duration(now - callStart)}` : ""}
                  </span>
                </Link>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </Info>
            <Info label="Time in state">
              <span className="font-label-mono-xs text-[13px]">{duration(now - agent.state_since)}</span>
            </Info>
            <Info label="Last activity">{ago(agent.last_activity, now)}</Info>
            <Info label={`Calls (${rangeLabel(since).toLowerCase()})`}>
              <span className="font-label-mono-xs text-[12px]">
                {num(agent.calls)}
                <span className="text-slate-500 font-medium"> · talk {duration(agent.talk_s)}</span>
              </span>
            </Info>
            <Info label="Avg talk time">
              <span className="font-label-mono-xs text-[12px]">{duration(agent.avg_talk_s)}</span>
            </Info>
          </div>

          {agent.state === "WRAP_UP" && agent.wrap_up_until && (
            <p className="text-[12px] text-slate-500 -mt-2">
              Wrap-up ends automatically in {duration(Math.max(0, agent.wrap_up_until - now))}.
            </p>
          )}
          {agent.pause_requested && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[12px] text-slate-600 flex gap-2 -mt-2">
              <span className="material-symbols-outlined text-[17px] text-slate-500">pause_circle</span>
              <span>Pause requested. The agent finishes the current call first, then goes to Paused.</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Agent actions</span>
            {BUSY.includes(agent.state) && (
              <p className="text-[11.5px] text-slate-500 -mt-1">
                {agent.name.split(" ")[0]} is {agent.state.toLowerCase()} right now, so they can&apos;t be marked available or paused until the call ends.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {agentActions(agent, act).map((a) => (
                <button
                  key={a.label}
                  type="button"
                  disabled={busy}
                  onClick={a.onClick}
                  className={`h-9 px-2 rounded-lg font-body-sm text-[12px] flex items-center justify-center gap-1.5 font-semibold transition-colors border shadow-2xs disabled:opacity-50 ${
                    a.primary
                      ? "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
                      : a.danger
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                        : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
            <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Recent calls</span>
            {detail.calls.length === 0 ? (
              <EmptyState icon="call" title="No calls yet" detail="This agent hasn't been bridged to a borrower." />
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                {detail.calls.map((c) => {
                  const s = callState(c.state);
                  return (
                    <Link
                      key={c.id}
                      href={`/live-operations?call=${c.id}`}
                      className="px-3 py-2 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-mono-xs text-[11.5px] font-bold text-indigo-600">{c.code}</span>
                        <span className="text-[11.5px] text-slate-500 truncate">
                          {c.campaign}
                          {c.end_reason ? ` · ${endReason(c.end_reason)}` : ""}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge tone={s.tone}>{s.label}</Badge>
                        <span className="text-[10.5px] text-slate-400">
                          {c.screening ? `${outcome(c.outcome).label} · ` : ""}
                          {c.talk_seconds != null ? `talk ${duration(c.talk_seconds)}` : ago(c.connected_at ?? c.reserved_at, now)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
            <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Recent activity</span>
            {detail.activity.length === 0 ? (
              <EmptyState icon="history" title="Nothing in this time range" />
            ) : (
              <div className="flex flex-col gap-3 relative pl-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {detail.activity.map((item, i) => {
                  const kind = feedKind(item.kind);
                  const result = feedResult(item);
                  return (
                    <div key={`${item.kind}-${item.at}-${i}`} className="relative flex flex-col gap-0.5">
                      <span className={`absolute -left-[17px] top-1.5 w-2 h-2 rounded-full ring-2 ring-white ${TONE[kind.tone].dot}`} />
                      <span className={`font-label-mono-xs text-label-mono-xs font-semibold ${TONE[kind.tone].text}`}>
                        {clock(item.at)} · {ago(item.at, now)}
                      </span>
                      <span className="font-body-sm text-body-sm text-slate-800">
                        {kind.label}: <span className="font-semibold">{result.label}</span>
                      </span>
                      {(item.call || item.campaign || item.detail) && (
                        <span className="text-[11.5px] text-slate-500">
                          {[item.call, item.campaign, item.kind === "operator" ? item.detail : null].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {plural(detail.calls.length, "recent call")} shown. Calls and borrowers are simulated by the backend&apos;s mock providers.
          </p>
        </div>
      )}
    </Drawer>
  );
}
