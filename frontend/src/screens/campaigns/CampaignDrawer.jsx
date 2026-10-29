"use client";

import Link from "next/link";
import { ago, clock, duration, num, pct, rate } from "@/lib/format";
import { decision, endReason, feedKind, feedResult, providerName, reason, TONE } from "@/lib/labels";
import { Badge, Drawer, EmptyState, ErrorNote, Skeleton } from "@/components/ui";
import { campaignActions, ModeBadge, StatusBadge } from "./parts";

const EDGE = {
  teal: "border-teal-500",
  amber: "border-amber-500",
  blue: "border-blue-500",
  green: "border-emerald-500",
  violet: "border-violet-500",
  slate: "border-slate-400",
  gray: "border-slate-300",
  red: "border-rose-500",
  indigo: "border-indigo-500",
};

function Tile({ label, children, wide = false }) {
  return (
    <div className={`p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col min-w-0 ${wide ? "col-span-2" : ""}`}>
      <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">{label}</span>
      <div className="text-[12.5px] text-slate-900 font-semibold mt-0.5 truncate">{children}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-400">{title}</span>
      {children}
    </div>
  );
}

function Bar({ value, tone = "bg-blue-600" }) {
  return (
    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, (value ?? 0) * 100)}%` }} />
    </div>
  );
}

export default function CampaignDrawer({ open, onClose, detail, error, audiences, act, busy }) {
  const c = detail?.campaign;
  const m = detail?.metrics;
  const sc = m?.screening;
  const settings = detail?.screening_settings;
  const now = detail?.now;
  const last = c?.last_decision;
  const reasons = Object.entries(m?.end_reasons ?? {}).sort((a, b) => b[1] - a[1]);
  const reasonTotal = reasons.reduce((sum, [, n]) => sum + n, 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-[460px]"
      title={c?.name ?? "Campaign"}
      badge={c && <StatusBadge status={c.display_status} />}
      subtitle={
        c && (
          <span>
            <span className="font-mono text-[11px] text-blue-700">{c.code}</span>
            {c.description ? ` · ${c.description}` : ""}
          </span>
        )
      }
      footer={
        c && (
          <div className="grid grid-cols-2 gap-2">
            {campaignActions(c, act, { includeView: false }).map((a) => (
              <button
                key={a.label}
                type="button"
                disabled={busy || a.disabled}
                title={a.disabled ? a.hint : undefined}
                onClick={a.onClick}
                className={`h-8 rounded-lg border text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  a.danger
                    ? "bg-red-50 hover:bg-red-100 border-red-200/80 text-red-700 font-semibold"
                    : "bg-white border-[#E5EAF1] hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{a.icon}</span>
                {a.short ?? a.label}
              </button>
            ))}
          </div>
        )
      }
    >
      <ErrorNote error={error} className="mb-4" />
      {!c ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <SafetyBanner campaign={c} last={last} now={now} />

          <Section title="Configuration">
            <div className="grid grid-cols-2 gap-2">
              <Tile label="Dialing mode">
                <ModeBadge mode={c.mode} />
              </Tile>
              <Tile label="AI screening">
                {c.screening ? <span className="text-purple-700">Mock screening bot</span> : <span className="text-slate-500">Off (direct dial)</span>}
              </Tile>
              <Tile label="Provider">
                <Link href={`/provider-monitoring?provider=${c.provider}`} className="hover:text-blue-600 hover:underline">
                  {providerName(c.provider)}
                </Link>
              </Tile>
              <Tile label="Mock audience">{audiences?.[c.audience]?.label ?? c.audience ?? "Provider default"}</Tile>
              {c.screening && settings && (
                <>
                  <Tile label="Max agent wait">
                    {settings.hold_s}s <span className="text-[10.5px] text-slate-400 font-medium">{settings.hold_is_default ? "global" : "campaign"}</span>
                  </Tile>
                  <Tile label="If no agent frees up">
                    {settings.no_agent_policy === "end" ? "Stop" : "Callback later"}{" "}
                    <span className="text-[10.5px] text-slate-400 font-medium">{settings.policy_is_default ? "global" : "campaign"}</span>
                  </Tile>
                </>
              )}
              <Tile label="Agent pool" wide>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">groups</span>
                  {detail.agent_pool.name}
                  <span className="text-[11px] text-slate-500 font-medium">
                    · {num(detail.agent_pool.online)} online of {num(detail.agent_pool.agents)}
                  </span>
                </span>
              </Tile>
            </div>
          </Section>

          <Section title="Progress">
            <div className="grid grid-cols-2 gap-2">
              <Tile label="Borrowers resolved" wide>
                <div className="flex items-center justify-between font-mono">
                  <span>
                    {num(c.resolved)} / {num(c.targets)}
                  </span>
                  <span className="text-[10.5px] text-slate-500 font-medium">{pct(rate(c.resolved, c.targets))}</span>
                </div>
                <Bar value={rate(c.resolved, c.targets)} />
              </Tile>
              <Tile label="Calls placed">
                <span className="font-mono">{num(c.attempts)}</span>
              </Tile>
              <Tile label="Queued / live now">
                <span className="font-mono">
                  {num(c.queued)} / {num(c.live)}
                </span>
              </Tile>
              <Tile label="Answer rate">
                <span className="font-mono">{pct(m.answer_rate)}</span>
              </Tile>
              <Tile label="Abandon rate">
                <span className={`font-mono ${m.abandon_rate > 0.03 ? "text-rose-600" : ""}`}>
                  {pct(m.abandon_rate, 2)} <span className="text-[10.5px] text-slate-400 font-medium">({num(m.calls_abandoned)})</span>
                </span>
              </Tile>
            </div>
          </Section>

          {c.screening ? (
            <Section title="Screening outcomes (mock bot)">
              {!sc ? (
                <p className="text-[12px] text-slate-500">No screening calls placed yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Tile label="Screening attempts">
                    <span className="font-mono">{num(sc.attempted)}</span>
                  </Tile>
                  <Tile label="Answered">
                    <span className="font-mono">
                      {num(sc.answered)} <span className="text-[10.5px] text-slate-400 font-medium">{pct(rate(sc.answered, sc.attempted))}</span>
                    </span>
                  </Tile>
                  <Tile label="Willing to talk">
                    <span className="font-mono text-emerald-700">
                      {num(sc.willing)} <span className="text-[10.5px] text-slate-400 font-medium">{pct(rate(sc.willing, sc.answered))} of answered</span>
                    </span>
                  </Tile>
                  <Tile label="Declined / callback later">
                    <span className="font-mono">
                      {num(sc.declined)} / {num(sc.unavailable)}
                    </span>
                  </Tile>
                  <Tile label="Transfers confirmed" wide>
                    <div className="flex items-center justify-between font-mono">
                      <span>
                        {num(sc.agent_connections)} of {num(sc.willing)} willing
                      </span>
                      <span className="text-[10.5px] text-emerald-700 font-semibold">{pct(rate(sc.agent_connections, sc.willing))}</span>
                    </div>
                    <Bar value={rate(sc.agent_connections, sc.willing)} tone="bg-emerald-500" />
                    <span className="text-[10.5px] text-slate-500 font-medium mt-1">
                      {num(sc.no_agent)} not reached in time · {num(sc.caller_left_hold)} hung up waiting · avg wait {duration(sc.avg_hold_s)}
                    </span>
                  </Tile>
                </div>
              )}
            </Section>
          ) : (
            <Section title="Agent conversations">
              <div className="grid grid-cols-2 gap-2">
                <Tile label="Answered">
                  <span className="font-mono">{num(m.calls_answered)}</span>
                </Tile>
                <Tile label="Connected to agents">
                  <span className="font-mono">{num(m.calls_connected)}</span>
                </Tile>
                <Tile label="Agent talk time">
                  <span className="font-mono">{duration(m.agent_talk_s)}</span>
                </Tile>
                <Tile label="Not interested (short)">
                  <span className="font-mono">{num(m.agent_conversations - m.productive_conversations)}</span>
                </Tile>
              </div>
            </Section>
          )}

          <Section title="How calls ended">
            {reasons.length === 0 ? (
              <p className="text-[12px] text-slate-500">No finished calls yet.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {reasons.slice(0, 8).map(([key, n]) => (
                  <div key={key} className="flex items-center gap-2 text-[12px]">
                    <span className="w-40 shrink-0 text-slate-600 truncate">{endReason(key)}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(n / reasonTotal) * 100}%` }} />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] text-slate-700">{num(n)}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Recent activity">
            {detail.activity.length === 0 ? (
              <EmptyState icon="history" title="Nothing in this time range" />
            ) : (
              <div className="flex flex-col gap-1.5 font-mono text-[10.5px]">
                {detail.activity.map((item, i) => {
                  const kind = feedKind(item.kind);
                  const result = feedResult(item);
                  return (
                    <div
                      key={`${item.kind}-${item.at}-${i}`}
                      className={`p-2 bg-slate-50 rounded border-l-2 flex flex-col gap-0.5 ${EDGE[kind.tone]}`}
                    >
                      <div className="flex items-center justify-between text-slate-400">
                        <span>
                          {clock(item.at)} · {ago(item.at, now)}
                        </span>
                        <span className={`font-semibold text-[9.5px] uppercase ${TONE[kind.tone].text}`}>{kind.label}</span>
                      </div>
                      <span className="text-slate-800 text-[11px] font-sans">
                        {result.label}
                        {item.call ? ` · ${item.call}` : ""}
                        {item.agent ? ` · ${item.agent}` : ""}
                        {item.kind === "safety_decision" || item.kind === "operator" ? (item.detail ? ` · ${item.detail}` : "") : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}
    </Drawer>
  );
}

function SafetyBanner({ campaign, last, now }) {
  if (campaign.status !== "RUNNING" || !last) {
    return (
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
        <span className="material-symbols-outlined text-slate-500 text-[19px] shrink-0 mt-0.5">shield</span>
        <div className="flex flex-col">
          <span className="text-[12.5px] font-semibold text-slate-800 leading-tight">Safety controller</span>
          <span className="text-[11.5px] text-slate-600 mt-0.5 leading-snug">
            {campaign.status === "RUNNING"
              ? "No pacing decisions recorded yet."
              : "No new calls start while the campaign isn't running. Borrowers already waiting for an agent are still handled."}
          </span>
        </div>
      </div>
    );
  }
  const d = decision(last.action);
  const why = last.reasons.map(reason);
  return (
    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-start gap-2.5">
      <span className="material-symbols-outlined text-blue-600 text-[19px] shrink-0 mt-0.5">verified_user</span>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12.5px] font-semibold text-blue-900 leading-tight">Latest safety decision</span>
          <Badge tone={d.tone}>{d.label}</Badge>
          <span className="text-[11px] text-blue-700">{ago(last.at, now)}</span>
        </div>
        <span className="text-[11.5px] text-blue-800 leading-snug">
          Pacer asked for {num(last.requested)}, safety allowed {num(last.approved)} ({last.mode}).
          {why.length > 0 && ` ${why.map((r) => r.label).join("; ")}.`}
        </span>
        <Link
          href={`/pacing-safety?campaign=${campaign.id}&decision=${last.id}`}
          className="text-[11.5px] font-semibold text-blue-700 hover:underline self-start"
        >
          View decision {last.code}
        </Link>
      </div>
    </div>
  );
}
