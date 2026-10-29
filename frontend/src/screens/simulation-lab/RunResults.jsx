"use client";

import Link from "next/link";
import { clock, duration, num, pct, rate, seconds } from "@/lib/format";
import { decision, endReason, providerName, reason, recoveryAction } from "@/lib/labels";
import { ErrorNote, Skeleton } from "@/components/ui";
import TimelineChart from "./TimelineChart";
import { FAULTS, download, isActive, presetLabel, toCsv } from "./shared";

const OUTCOME_COLORS = [
  "bg-po-secondary",
  "bg-po-on-tertiary-container",
  "bg-po-surface-dim",
  "bg-amber-400",
  "bg-po-outline",
  "bg-po-error",
  "bg-po-tertiary-fixed",
  "bg-po-surface-container-high",
];

const STATUS_STYLE = {
  queued: "bg-po-surface-container text-po-on-surface-variant",
  running: "bg-po-secondary-fixed text-po-on-secondary-fixed",
  done: "bg-po-surface-container-high text-po-secondary",
  failed: "bg-po-error-container text-po-on-error-container",
};

export function RunStatus({ job }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs font-semibold ${STATUS_STYLE[job.status]}`}>
      {isActive(job) && <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary animate-pulse" />}
      {job.status === "done" && job.started_at && job.finished_at
        ? `Completed in ${seconds(job.finished_at - job.started_at)}`
        : job.status === "running"
          ? "Running"
          : job.status === "queued"
            ? "Queued"
            : "Failed"}
    </span>
  );
}

export default function RunResults({ job, presets, onRerun, busy }) {
  if (!job) return null;
  const r = job.result;
  const params = job.params ?? {};

  function exportCsv() {
    const summary = [
      ["run", job.id],
      ["preset", params.preset],
      ["mode", r.scenario.mode],
      ["screening", r.scenario.screening],
      ["provider", r.scenario.provider],
      ["fault", params.fault ?? "normal"],
      ["agents", r.scenario.agents],
      ["borrowers", r.scenario.borrowers],
      ["simulated_seconds", r.scenario.duration_s],
      ["seed", r.scenario.seed],
      ["calls_initiated", r.calls_initiated],
      ["calls_answered", r.calls_answered],
      ["calls_connected", r.calls_connected],
      ["calls_failed", r.calls_failed],
      ["calls_abandoned", r.calls_abandoned],
      ["abandon_rate", r.abandon_rate],
      ["utilization", r.utilization],
      ["productive_utilization", r.productive_utilization],
      ["safety_interventions", r.safety_interventions],
      ["invariant_violations", r.invariant_violations.length],
    ];
    const cols = ["t", "staffed", "available", "talking", "wrap_up", "on_hold", "requested", "approved", "action", "p_hat", "p_safe", "outage"];
    const timeline = (r.timeline ?? []).map((p) => cols.map((c) => p[c]));
    download(`simulation-run-${job.id}.csv`, toCsv([["metric", "value"], ...summary, [], cols, ...timeline]));
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-headline-md text-headline-md text-po-on-surface">Simulation Output: Run #{job.id}</span>
            <RunStatus job={job} />
          </div>
          <span className="font-body-sm text-body-sm text-po-on-surface-variant">
            {presetLabel(presets, params.preset)} · {params.mode === "predictive" ? "Predictive" : "Progressive"}
            {params.screening ? " + AI screening" : ""} · {num(params.agents)} agents · {num(params.borrowers)} targets ·{" "}
            {providerName(params.provider ?? r?.scenario.provider)} · {FAULTS[params.fault] ?? "Normal operation"} · seed {params.seed ?? r?.scenario.seed}
            {job.created_at ? ` · started ${clock(job.created_at)}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            disabled={!r}
            onClick={exportCsv}
            className="h-8 px-space-md rounded-po bg-po-surface-container-lowest hover:bg-po-surface-container-low text-po-on-surface font-body-sm text-body-sm shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px] text-po-on-surface-variant">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRerun(params)}
            className="h-8 px-space-md rounded-po bg-po-surface-container-lowest hover:bg-po-surface-container-low text-po-on-surface font-body-sm text-body-sm shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px] text-po-on-surface-variant">replay</span>
            <span>Run again</span>
          </button>
        </div>
      </div>

      {job.status === "failed" && <ErrorNote error={`This run failed: ${job.error ?? "unknown error"}`} />}
      {isActive(job) && (
        <div className="flex flex-col gap-space-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-space-sm">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-20 rounded-po-xl" />
            ))}
          </div>
          <p className="font-body-sm text-body-sm text-po-on-surface-variant">
            Simulating {duration(presets?.[params.preset]?.duration_s ?? 1800)} of dialing on a fake clock. This usually takes a few seconds.
          </p>
        </div>
      )}
      {r && <Output job={job} r={r} />}
    </div>
  );
}

function Output({ job, r }) {
  const s = r.screening;
  const sc = r.scenario;
  const kpis = [
    { label: "Calls Initiated", value: num(r.calls_initiated), sub: `${num(sc.borrowers)} targets` },
    { label: "Answered", value: num(r.calls_answered), sub: `${pct(r.answer_rate)} answer rate`, accent: true },
    s
      ? { label: "Willing to Talk", value: num(s.willing), sub: `${pct(rate(s.willing, s.answered))} of answered` }
      : { label: "Productive Talks", value: num(r.productive_conversations), sub: "excludes short not-now calls" },
    {
      label: "Agent Connected",
      value: num(r.calls_connected),
      sub: s ? `${pct(rate(s.agent_connections, s.willing))} of willing` : `${pct(rate(r.calls_connected, r.calls_answered))} of answered`,
      strong: true,
    },
    { label: "Failed / No Answer", value: num(r.calls_failed), sub: `${pct(rate(r.calls_failed, r.calls_initiated))} of initiated`, error: true },
    { label: "Abandoned", value: num(r.calls_abandoned), sub: `${pct(r.abandon_rate, 2)} of answered`, error: r.calls_abandoned > 0 },
    { label: "Agent Util", value: pct(r.utilization), sub: `${pct(r.productive_utilization)} productive`, accent: true },
    { label: "Safety Interventions", value: num(r.safety_interventions), sub: `${num(r.decisions?.REJECT ?? 0)} blocked rounds` },
  ];

  const outcomes = Object.entries(r.end_reasons ?? {}).sort((a, b) => b[1] - a[1]);
  const shown = outcomes.slice(0, 7);
  const rest = outcomes.slice(7).reduce((sum, [, n]) => sum + n, 0);
  if (rest) shown.push(["other", rest]);
  const ended = outcomes.reduce((sum, [, n]) => sum + n, 0);

  const timeline = r.timeline ?? [];
  const peak = timeline.reduce((best, p) => (p.talking > (best?.talking ?? -1) ? p : best), null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-space-sm">
        {kpis.map((k) => (
          <div key={k.label} className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
            <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">{k.label}</span>
            <div className="mt-1">
              <span className={`font-display-kpi text-[24px] font-semibold ${k.strong ? "text-po-secondary" : k.error ? "text-po-error" : "text-po-on-surface"}`}>
                {k.value}
              </span>
            </div>
            <span className={`font-label-mono-xs text-[10px] mt-1 ${k.accent ? "text-po-secondary font-medium" : k.error ? "text-po-error" : "text-po-on-surface-variant"}`}>
              {k.sub}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <div>
                <h3 className="font-headline-sm text-body-md text-po-on-surface">Call Outcome Distribution</h3>
                <span className="font-body-sm text-body-sm text-po-on-surface-variant">How the {num(ended)} calls that ended in this run finished</span>
              </div>
              <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded-po bg-po-surface-container text-po-on-surface">{num(ended)} Ended</span>
            </div>
            {ended > 0 ? (
              <>
                <div className="w-full h-8 rounded-po-lg overflow-hidden flex bg-po-surface-container my-space-md">
                  {shown.map(([key, n], i) => (
                    <div
                      key={key}
                      className={`h-full hover:opacity-90 transition-opacity ${OUTCOME_COLORS[i % OUTCOME_COLORS.length]}`}
                      style={{ width: `${(n / ended) * 100}%` }}
                      title={`${key === "other" ? "Other" : endReason(key)}: ${num(n)} (${pct(n / ended)})`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-2">
                  {shown.map(([key, n], i) => (
                    <div key={key} className="flex items-center gap-2 min-w-0">
                      <span className={`w-3 h-3 rounded-sm shrink-0 ${OUTCOME_COLORS[i % OUTCOME_COLORS.length]}`} />
                      <div className="flex flex-col font-label-mono-xs text-label-mono-xs min-w-0">
                        <span className="text-po-on-surface-variant font-medium truncate">{key === "other" ? "Other" : endReason(key)}</span>
                        <span className="text-po-on-surface font-semibold">
                          {num(n)} ({pct(n / ended)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="font-body-sm text-body-sm text-po-on-surface-variant py-6">No calls ended in this run.</p>
            )}
          </div>
          <div className="mt-space-md p-space-sm rounded-po bg-po-surface-container-low flex items-center justify-between gap-2 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
            {s ? (
              <>
                <span>Answered calls that ended with the bot, no agent time used:</span>
                <span className="font-semibold text-po-secondary">
                  {num(s.declined + s.unavailable + s.screen_failed)} of {num(s.answered)}
                </span>
              </>
            ) : (
              <>
                <span>Short not-now calls that still reached an agent:</span>
                <span className="font-semibold text-po-on-surface">{num(r.agent_conversations - r.productive_conversations)}</span>
              </>
            )}
          </div>
          {r.calls_queued > 0 && (
            <p className="mt-2 font-label-mono-xs text-[10.5px] text-po-on-surface-variant">
              {num(r.calls_queued)} calls were still queued (waiting for a retry or never reached) when the run ended.
            </p>
          )}
        </div>

        <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-space-sm">
              <div>
                <h3 className="font-headline-sm text-body-md text-po-on-surface">Agent Utilization &amp; Concurrency</h3>
                <span className="font-body-sm text-body-sm text-po-on-surface-variant">
                  Sampled every minute of the {duration(sc.duration_s)} simulated run, {num(sc.agents)} agents
                </span>
              </div>
              {peak && (
                <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded-po bg-po-surface-container text-po-secondary font-medium">
                  Peak: {num(peak.talking)} talking
                </span>
              )}
            </div>
            {timeline.length ? (
              <TimelineChart timeline={timeline} screening={sc.screening} />
            ) : r.timeline === undefined ? (
              <Skeleton className="h-44 rounded-po-lg" />
            ) : (
              <p className="font-body-sm text-body-sm text-po-on-surface-variant py-6">No timeline samples.</p>
            )}
          </div>
          <div className="mt-space-md p-space-sm rounded-po bg-po-surface-container-low flex items-center justify-between font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
            <span>Talking time / staffed time over the whole run:</span>
            <span className="font-semibold text-po-secondary">
              {pct(r.utilization)} ({pct(r.occupancy)} incl. wrap-up)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        <SafetySummary r={r} changed={job.settings_changed} />
        <ScreeningInsight r={r} params={job.params ?? {}} />
      </div>
    </>
  );
}

function Row({ title, detail, children }) {
  return (
    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low/60 flex items-center justify-between gap-3">
      <div className="flex flex-col min-w-0">
        <span className="font-headline-sm text-body-sm text-po-on-surface font-semibold">{title}</span>
        <span className="font-body-sm text-body-sm text-po-on-surface-variant">{detail}</span>
      </div>
      <div className="shrink-0 text-right">{children}</div>
    </div>
  );
}

function SafetySummary({ r, changed }) {
  const decisions = Object.entries(r.decisions ?? {}).sort((a, b) => b[1] - a[1]);
  const total = decisions.reduce((sum, [, n]) => sum + n, 0);
  const reasons = Object.entries(r.safety_reasons ?? {}).sort((a, b) => b[1] - a[1]);
  const recovery = Object.entries(r.recovery ?? {}).sort((a, b) => b[1] - a[1]);
  const violations = r.invariant_violations ?? [];

  return (
    <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col justify-between">
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-body-lg text-po-on-surface font-semibold">Safety &amp; System Health</h3>
          <span className="px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container-low text-po-secondary uppercase tracking-wider">This run</span>
        </div>
        <div className="flex flex-col gap-space-xs">
          <Row title="Pacing rounds reviewed by safety" detail={`${num(total)} decisions, ${num(r.safety_interventions)} changed the pacer’s request`}>
            <div className="flex flex-wrap justify-end gap-1">
              {decisions.map(([action, n]) => (
                <span key={action} className="px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container text-po-on-surface">
                  {decision(action).label} {num(n)}
                </span>
              ))}
            </div>
          </Row>
          <Row
            title="Most common safety reasons"
            detail={reasons.length ? reasons.slice(0, 3).map(([key, n]) => `${reason(key).label} (${num(n)})`).join(", ") : "Every request was within limits"}
          >
            <span className="px-2.5 py-0.5 rounded-po text-label-ui font-label-ui bg-po-surface-container text-po-on-surface">{num(reasons.length)} kinds</span>
          </Row>
          <Row
            title="Recovery actions"
            detail={recovery.length ? recovery.map(([key, n]) => `${recoveryAction(key).label} (${num(n)})`).join(", ") : "Nothing needed reconciling"}
          >
            <span className="px-2.5 py-0.5 rounded-po text-label-ui font-label-ui bg-po-surface-container-high text-po-on-secondary-fixed">
              {num(recovery.reduce((sum, [, n]) => sum + n, 0))}
            </span>
          </Row>
          <Row title="Duplicate deliveries ignored" detail="Events delivered again with an id that was already stored">
            <span className="px-2.5 py-0.5 rounded-po text-label-ui font-label-ui bg-po-surface-container text-po-on-surface">{num(r.duplicate_deliveries)}</span>
          </Row>
          <Row
            title="Invariant check"
            detail={
              violations.length
                ? violations.slice(0, 2).join("; ")
                : "No agent or borrower ever had two live calls, and nobody reached an agent without saying yes"
            }
          >
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-po text-label-ui font-label-ui ${
                violations.length ? "bg-po-error-container text-po-on-error-container" : "bg-po-surface-container-high text-po-on-secondary-fixed"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{violations.length ? "error" : "check_circle"}</span>
              {num(violations.length)} violations
            </span>
          </Row>
        </div>
        <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[17px] text-po-secondary shrink-0 mt-0.5">shield</span>
          <span className="font-body-sm text-body-sm text-po-on-surface-variant">
            {changed?.length
              ? `Ran with the console's settings at the time, ${changed.length} changed from the defaults (${changed.join(", ")}).`
              : "Ran with the console's settings at the time, all at their defaults."}{" "}
            Change them on the <Link href="/settings" className="font-semibold text-po-secondary hover:underline">Settings</Link> screen and run again to compare.
          </span>
        </div>
      </div>
      <div className="pt-space-md flex justify-end">
        <Link className="font-headline-sm text-body-sm text-po-secondary hover:text-po-primary flex items-center gap-1" href="/pacing-safety">
          <span>View live safety decisions</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

function ScreeningInsight({ r, params }) {
  const s = r.screening;
  const sc = r.scenario;
  const missed = s ? s.willing - s.agent_connections : 0;

  return (
    <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col justify-between">
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-headline-sm text-body-lg text-po-on-surface font-semibold">AI Screening Insight</h3>
            <span className="font-body-sm text-body-sm text-po-on-surface-variant">Willing borrowers and what happened to them</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container-high text-po-on-secondary-fixed-variant font-medium">
            Mock screening bot
          </span>
        </div>
        {s ? (
          <>
            <div className="p-space-md rounded-po-xl bg-po-surface-container-low flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-po-secondary font-headline-sm text-body-md">
                <span className="material-symbols-outlined text-[18px]">query_stats</span>
                <span className="font-semibold">Conversion &amp; Transfer Integrity</span>
              </div>
              <p className="font-headline-sm text-body-sm text-po-on-surface font-semibold">
                {num(s.agent_connections)} of {num(s.willing)} willing borrowers reached a confirmed agent connection in this run.
              </p>
              <p className="font-body-sm text-[12px] text-po-on-surface-variant leading-relaxed">
                {missed > 0
                  ? `${num(s.no_agent)} weren’t connected within the ${sc.hold_s}s wait and ${
                      params.no_agent_policy === "end" ? "the call ended politely" : "got a callback scheduled"
                    }; ${num(s.caller_left_hold)} hung up while waiting; ${num(s.transfer_blocked)} transfers were blocked by safety.`
                  : "Every willing borrower got an agent within the wait time."}
              </p>
            </div>
            <div className="p-space-md rounded-po-xl bg-po-surface-container-low/40 flex flex-col gap-1">
              <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Operational Context</span>
              <p className="font-body-sm text-[12px] text-po-on-surface-variant leading-relaxed">
                Screening keeps agents away from unanswered and unwilling contacts, but the benefit depends on the answer rate, how long the
                bot talks, transfer waits and how many agents are free. Outcomes here are random draws from the mock audience, not real
                conversations.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-space-sm text-center">
              <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex flex-col">
                <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Willing Rate</span>
                <span className="font-headline-sm text-body-lg text-po-secondary font-bold mt-1">{pct(rate(s.willing, s.answered))}</span>
              </div>
              <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex flex-col">
                <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Declined / Later</span>
                <span className="font-headline-sm text-body-lg text-po-on-surface font-bold mt-1">
                  {num(s.declined)} / {num(s.unavailable)}
                </span>
              </div>
              <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex flex-col">
                <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Avg Hold Time</span>
                <span className="font-headline-sm text-body-lg text-po-secondary font-bold mt-1">{seconds(s.avg_hold_s)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-space-md rounded-po-xl bg-po-surface-container-low flex flex-col gap-1.5">
            <p className="font-headline-sm text-body-sm text-po-on-surface font-semibold">Screening was off for this run.</p>
            <p className="font-body-sm text-[12px] text-po-on-surface-variant leading-relaxed">
              Every answered call went straight to an agent. Turn screening on, or use Compare strategies to run the same audience with and
              without the bot.
            </p>
          </div>
        )}
      </div>
      <div className="pt-space-md flex items-center justify-between">
        <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
          {num(r.agent_conversations)} agent conversations, {duration(r.agent_talk_s)} of talk
        </span>
      </div>
    </div>
  );
}
