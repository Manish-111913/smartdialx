"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useFilters } from "@/components/Filters";
import { Badge, EmptyState, ErrorNote, Skeleton } from "@/components/ui";
import { qs, useApi } from "@/lib/api";
import { ago, clock, num, pct, plural, rangeLabel, rate, seconds } from "@/lib/format";
import {
  AGENT_STATE_ORDER,
  agentState,
  decision,
  endReason,
  feedKind,
  feedResult,
  providerName,
  providerStatus,
  reason,
  recoveryAction,
  safetyStatus,
  TONE,
} from "@/lib/labels";
import ActivityChart, { ChartLegend } from "./ActivityChart";

// the greeting depends on the browser's clock, so the server renders a neutral one
const noop = () => () => {};
function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

const ACCENTS = {
  indigo: {
    card: "hover:border-indigo-300",
    bar: "from-indigo-500 to-blue-500",
    icon: "bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600",
    tag: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
  },
  cyan: {
    card: "hover:border-cyan-300",
    bar: "from-cyan-500 to-teal-500",
    icon: "bg-cyan-50 border-cyan-100 text-cyan-600 group-hover:bg-cyan-600",
    tag: "bg-cyan-50 text-cyan-700 border-cyan-200/60",
  },
  emerald: {
    card: "hover:border-emerald-300",
    bar: "from-emerald-500 to-teal-500",
    icon: "bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600",
    tag: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  },
  amber: {
    card: "hover:border-amber-300",
    bar: "from-amber-500 to-orange-500",
    icon: "bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600",
    tag: "bg-amber-50 text-amber-700 border-amber-200/60",
  },
};

export default function OverviewScreen() {
  const { campaignId, since } = useFilters();
  const hello = useSyncExternalStore(noop, greeting, () => "Welcome back");
  const { data, error, loading } = useApi(`/overview${qs({ campaign: campaignId, since })}`, { interval: 5000 });
  const { data: campaignList } = useApi(campaignId ? "/campaigns" : null, { interval: 30000 });
  const campaignName = campaignList?.campaigns.find((c) => c.id === campaignId)?.name;

  return (
    <div className="font-body-md text-on-surface antialiased selection:bg-indigo-100 selection:text-indigo-900 bg-[#f8fafc] min-h-[calc(100vh-3.5rem)]">
      <div className="flex flex-col w-full">
        <div className="px-space-xl py-6 flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-white border-b border-slate-200/70 shadow-xs">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg font-bold text-slate-900 tracking-tight">{hello}, Manish</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-label-mono-xs bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-semibold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                SIMULATION
              </span>
            </div>
            <p className="font-body-md text-body-md text-slate-500 max-w-2xl">
              Monitor screening performance, agent availability, and call orchestration from one place.
            </p>
          </div>
          <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">
            <Link
              className="inline-flex items-center gap-space-xs px-4 h-9 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 font-body-sm text-body-sm font-medium transition-all shadow-xs border border-slate-200"
              href="/live-operations"
            >
              <span className="material-symbols-outlined text-[17px] text-cyan-600">sensors</span>
              <span>View Live Operations</span>
            </Link>
            <Link
              className="inline-flex items-center gap-space-xs px-4 h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-body-sm text-body-sm font-semibold transition-all shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50"
              href="/simulation-lab"
              title="Open the Simulation Lab to configure and run a scenario"
            >
              <span className="material-symbols-outlined text-[17px] text-cyan-200">play_circle</span>
              <span>Run Simulation</span>
            </Link>
          </div>
        </div>

        <div className="p-space-xl flex flex-col gap-space-xl">
          <ErrorNote error={error} />
          {!data && loading ? (
            <LoadingState />
          ) : data ? (
            <Dashboard data={data} since={since} campaignName={campaignName} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
        <Skeleton className="h-80 lg:col-span-8" />
        <Skeleton className="h-80 lg:col-span-4" />
      </div>
    </>
  );
}

function Dashboard({ data, since, campaignName }) {
  const { kpis, funnel, direct, agents, activity, system, recent, now } = data;
  const scope = campaignName ?? (data.campaign_id ? "Selected campaign" : "All campaigns");

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
        <Kpi
          accent="indigo"
          icon="call_made"
          label="Screening Calls"
          value={num(kpis.screening_attempts)}
          note="Mock screening bot attempts"
          tag={rangeLabel(since)}
          title="Screening calls started in the selected range. An attempt is not a conversation."
        />
        <Kpi
          accent="cyan"
          icon="how_to_reg"
          label="Willing to Talk"
          value={num(kpis.willing)}
          note="Eligible for transfer"
          tag={`${pct(rate(kpis.willing, funnel.answered))} of answered`}
          title="Borrowers the mock bot recorded as willing. Not all of them reach an agent."
        />
        <Kpi
          accent="emerald"
          icon="support_agent"
          label="Connected to Agents"
          value={num(kpis.connected)}
          note="Confirmed transfers"
          tag={`${pct(rate(kpis.connected, kpis.willing))} of willing`}
          title="Counted only once the provider confirmed the transfer to an agent."
        />
        <Kpi
          accent="amber"
          icon="speed"
          label="Agent Utilization"
          value={kpis.utilization === null ? "—" : pct(kpis.utilization)}
          note="Talking time / staffed time"
          tag="Shared pool"
          title={
            kpis.utilization === null
              ? "No agent samples in this range yet."
              : "Share of staffed agent time spent talking, from agent state samples. Covers the whole shared pool, not one campaign."
          }
        />
      </div>
      {direct.attempts > 0 && (
        <p className="-mt-space-md text-[12px] text-slate-500">
          Direct campaigns (no screening) in the same range: {plural(direct.attempts, "call attempt")}, {num(direct.answered)} answered,{" "}
          {num(direct.connected)} connected to agents.
        </p>
      )}

      <Funnel funnel={funnel} since={since} scope={scope} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-sm mb-space-md">
              <div>
                <div className="flex items-center gap-space-xs">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">Call Activity</h2>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    Simulation
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-slate-500 mt-1">Screening attempts and confirmed agent connections over time.</p>
              </div>
              <ChartLegend />
            </div>
            {activity.points.some((p) => p.attempts || p.connected) ? (
              <ActivityChart points={activity.points} bucket={activity.bucket_s} />
            ) : (
              <EmptyState icon="show_chart" title="No calls started in this range yet" />
            )}
          </div>
          <ActivityFooter points={activity.points} funnel={funnel} />
        </div>
        <AgentAvailability agents={agents} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        <SystemHealth system={system} now={now} />
        <Insight funnel={funnel} since={since} />
      </div>

      <RecentActivity items={recent} now={now} />
    </>
  );
}

function Kpi({ accent, icon, label, value, note, tag, title }) {
  const a = ACCENTS[accent];
  return (
    <div
      title={title}
      className={`relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:shadow-md transition-all group overflow-hidden ${a.card}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${a.bar}`} />
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">{label}</span>
          <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight">{value}</span>
        </div>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center group-hover:text-white transition-colors shadow-xs ${a.icon}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <div className="mt-space-md pt-space-xs flex items-center justify-between gap-2 text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
        <span className="truncate">{note}</span>
        <span className={`font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded font-semibold border whitespace-nowrap ${a.tag}`}>{tag}</span>
      </div>
    </div>
  );
}

function FunnelStage({ step, value, label, tag, tagClass, width, barClass, left, right, hover }) {
  return (
    <div
      className={`relative bg-slate-50/80 hover:bg-slate-50 p-space-md rounded-xl transition-all duration-200 border border-slate-200/70 flex flex-col justify-between ${hover}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Stage {step}</span>
        <span className={`font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded font-bold border shadow-2xs ${tagClass}`}>{tag}</span>
      </div>
      <div className="my-space-md">
        <div className="font-headline-lg text-headline-lg text-slate-900 font-bold">{value}</div>
        <div className="font-body-sm text-body-sm text-slate-500 font-medium mt-0.5">{label}</div>
      </div>
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full shadow-sm ${barClass}`} style={{ width }} />
      </div>
      <div className="mt-space-sm pt-space-xs flex items-center justify-between gap-2 text-slate-500 font-label-mono-xs text-label-mono-xs">
        {left}
        {right}
      </div>
    </div>
  );
}

const width = (r) => `${Math.min(100, Math.max(0, (r ?? 0) * 100)).toFixed(1)}%`;

function Funnel({ funnel: f, since, scope }) {
  const answered = rate(f.answered, f.attempts);
  const willing = rate(f.willing, f.answered);
  const connected = rate(f.connected, f.willing);
  const unanswered = f.attempts - f.answered - f.in_progress;
  const notEligible = f.declined + f.callback_later + f.screening_failed;
  // willing borrowers who are neither connected nor finished without an agent are still on hold or mid-transfer
  const stillOpen = f.willing - f.connected - f.willing_not_connected;

  return (
    <div className="bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col gap-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs">
        <div>
          <div className="flex items-center gap-space-sm">
            <h2 className="font-headline-md text-headline-md font-bold text-slate-900">AI Screening Funnel</h2>
            <span
              title="Confirmed agent connections divided by screening attempts"
              className="inline-flex items-center gap-1 font-label-mono-xs text-label-mono-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 text-indigo-700 font-bold shadow-xs"
            >
              End to end {pct(rate(f.connected, f.attempts))}
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-slate-500 mt-1">
            See how screening attempts progress toward confirmed human-agent conversations.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-label-mono-xs text-label-mono-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
          <span className="font-semibold text-slate-700">
            {scope} · {rangeLabel(since)}
          </span>
        </div>
      </div>

      {f.attempts === 0 ? (
        <EmptyState icon="filter_alt" title="No screening calls in this range" detail="Screening campaigns that are running will show up here as the bot places calls." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md relative">
          <FunnelStage
            step="01"
            value={num(f.attempts)}
            label="Screening Attempts"
            tag="100% of attempts"
            tagClass="bg-white text-slate-700 border-slate-200"
            width="100%"
            barClass="bg-gradient-to-r from-slate-700 to-slate-900"
            hover="hover:border-slate-300"
            left={<span className="font-medium">Calls placed by the bot</span>}
            right={<span className="text-slate-700 font-semibold">{num(f.in_progress)} in progress</span>}
          />
          <FunnelStage
            step="02"
            value={num(f.answered)}
            label="Answered Calls"
            tag={`${pct(answered)} answered`}
            tagClass="bg-indigo-50 text-indigo-700 border-indigo-200"
            width={width(answered)}
            barClass="bg-gradient-to-r from-indigo-500 to-indigo-600"
            hover="hover:border-indigo-200"
            left={<span className="text-indigo-600 font-medium">of attempts</span>}
            right={
              <span title={`No answer ${num(f.no_answer)}, busy ${num(f.busy)}`}>{num(Math.max(0, unanswered))} not answered</span>
            }
          />
          <FunnelStage
            step="03"
            value={num(f.willing)}
            label="Willing to Talk"
            tag={`${pct(willing)} willing`}
            tagClass="bg-cyan-50 text-cyan-700 border-cyan-200"
            width={width(willing)}
            barClass="bg-gradient-to-r from-cyan-500 to-teal-500"
            hover="hover:border-cyan-200"
            left={<span className="text-cyan-700 font-medium">of answered</span>}
            right={
              <span
                title={`Declined ${num(f.declined)}, callback later ${num(f.callback_later)}, screening failed ${num(f.screening_failed)}`}
              >
                {num(notEligible)} not eligible
              </span>
            }
          />
          <FunnelStage
            step="04"
            value={num(f.connected)}
            label="Transfer Confirmed"
            tag={`${pct(connected)} of willing`}
            tagClass="bg-emerald-50 text-emerald-700 border-emerald-200"
            width={width(connected)}
            barClass="bg-gradient-to-r from-emerald-500 to-teal-600"
            hover="hover:border-emerald-200"
            left={<span className="text-emerald-700 font-medium">Provider confirmed</span>}
            right={
              <span className={f.willing_not_connected ? "text-rose-600 font-bold" : ""}>
                {num(f.willing_not_connected)} not connected
              </span>
            }
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-sm p-space-md rounded-xl bg-gradient-to-r from-rose-50/60 via-slate-50 to-slate-50 border border-rose-100">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[19px] text-rose-500 shrink-0">info</span>
          <p className="font-body-sm text-body-sm text-slate-700">
            <strong className="font-bold text-slate-900">Willing but not connected:</strong>{" "}
            {f.willing_not_connected > 0
              ? `${plural(f.willing_not_connected, "willing respondent")} did not reach an agent (${num(f.no_agent_in_time)} had no agent free within the wait time, ${num(f.left_hold)} hung up while waiting).`
              : "every willing respondent whose call has finished reached an agent."}
            {stillOpen > 0 && ` ${num(stillOpen)} still on hold or being transferred (${num(f.waiting)} waiting, ${num(f.transferring)} transferring).`}
          </p>
        </div>
        <p className="font-label-mono-xs text-label-mono-xs text-slate-500 lg:max-w-sm">
          Screening outcomes are simulated. Transfer completion depends on agent availability and provider confirmation.
        </p>
      </div>
    </div>
  );
}

function ActivityFooter({ points, funnel }) {
  const peak = points.reduce((best, p) => (best === null || p.attempts > best.attempts ? p : best), null);
  return (
    <div className="mt-space-lg pt-space-sm flex flex-wrap items-center justify-between gap-space-sm font-label-mono-xs text-label-mono-xs text-slate-500 border-t border-slate-100">
      <span className="font-semibold text-slate-700">
        {peak && peak.attempts > 0
          ? `BUSIEST: ${clock(peak.t, false)} (${num(peak.attempts)} ATTEMPTS / ${num(peak.connected)} CONNECTED)`
          : "NO ACTIVITY YET"}
      </span>
      <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-700" title="Average time from willing to agent connected">
        <span className="w-2 h-2 rounded-full bg-cyan-500" />
        AVG WAIT FOR AGENT: {seconds(funnel.avg_hold_s)}
      </span>
    </div>
  );
}

function AgentAvailability({ agents }) {
  const total = agents.total;
  const online = total - agents.OFFLINE;
  return (
    <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">Agent Availability</h2>
            <p className="font-body-sm text-body-sm text-slate-500 mt-0.5">
              {plural(total, "agent")} · {num(online)} online
            </p>
          </div>
          <span className="font-label-mono-xs text-label-mono-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
            Shared pool
          </span>
        </div>
        {total === 0 ? (
          <EmptyState icon="group_off" title="No agents yet" detail="Add agents on the Agents screen." />
        ) : (
          <>
            <div className="flex flex-col gap-space-xs mt-space-xs">
              <div className="h-4 w-full rounded-md overflow-hidden flex bg-slate-100 ring-1 ring-slate-200/70">
                {AGENT_STATE_ORDER.map((s) =>
                  agents[s] ? (
                    <div
                      key={s}
                      className={`${TONE[agentState(s).tone].bar} hover:opacity-90 transition-opacity`}
                      style={{ width: `${(agents[s] / total) * 100}%` }}
                      title={`${agentState(s).label}: ${agents[s]}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="flex justify-between font-label-mono-xs text-label-mono-xs text-slate-400 px-0.5">
                <span>0%</span>
                <span>50%</span>
                <span>100% ({plural(total, "agent")})</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {AGENT_STATE_ORDER.map((s, i) => {
                const label = agentState(s);
                return (
                  <div
                    key={s}
                    title={label.hint}
                    className={`flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-200/60 ${i === AGENT_STATE_ORDER.length - 1 ? "col-span-2" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${TONE[label.tone].dot}`} />
                      <span className="font-body-sm text-body-sm text-slate-700 font-medium">{label.label}</span>
                    </div>
                    <span className={`font-label-mono-sm text-label-mono-sm font-bold ${TONE[label.tone].text}`}>{num(agents[s])}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="mt-space-lg pt-space-sm flex items-center justify-between border-t border-slate-100">
        <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-semibold" title="Available agents divided by agents online">
          READY: {pct(rate(agents.AVAILABLE, online))} OF ONLINE
        </span>
        <Link className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors" href="/agents">
          <span>View All Agents</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

function HealthRow({ title, detail, badge }) {
  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-slate-900 text-body-sm">{title}</span>
        <span className="text-slate-500 font-label-mono-xs text-[11px]">{detail}</span>
      </div>
      {badge}
    </div>
  );
}

function SystemHealth({ system, now }) {
  const status = safetyStatus(system.safety.status);
  const blocks = system.safety.actions.REJECT ?? 0;
  const last = system.recovery.last;
  return (
    <div className="lg:col-span-5 bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-space-sm">
          <h3 className="font-headline-sm text-[16px] font-bold text-slate-900">Safety &amp; System Health</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded font-label-mono-xs text-[10px] bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider border border-indigo-100">
            Mock providers
          </span>
        </div>
        <div className="flex flex-col gap-2.5 my-space-md">
          <HealthRow
            title="Safety Controller"
            detail={
              system.safety.campaigns.length === 0
                ? "No running campaign"
                : `${plural(blocks, "blocked request")} in range · ${status.hint}`
            }
            badge={<Badge tone={status.tone}>{status.label}</Badge>}
          />
          {system.safety.campaigns.map((c) => {
            const d = decision(c.action);
            const first = c.reasons[0] ? reason(c.reasons[0]) : null;
            return (
              <div key={c.campaign_id} className="flex items-center justify-between gap-3 px-2.5 -mt-1 text-[11.5px]">
                <span className="text-slate-500 truncate">
                  {c.campaign}: {c.approved}/{c.requested} approved{first ? ` · ${first.label}` : ""}
                </span>
                <Link href={`/pacing-safety?decision=${c.id}&campaign=${c.campaign_id}`} className="shrink-0">
                  <Badge tone={d.tone}>{d.label}</Badge>
                </Link>
              </div>
            );
          })}
          {system.providers.map((p) => {
            const s = providerStatus(p.status);
            return (
              <HealthRow
                key={p.name}
                title={providerName(p.name)}
                detail={`${p.fault ? `Fault injected: ${p.fault.label}` : "No fault injected"} · ${pct(p.error_rate)} errors over ${plural(p.requests_60s, "request")} (60s)`}
                badge={<Badge tone={s.tone}>{s.label}</Badge>}
              />
            );
          })}
          <HealthRow
            title="Screening Backlog"
            detail={`${plural(system.screening_backlog, "bot call")} dialing or talking right now`}
            badge={<Badge tone={system.screening_backlog ? "blue" : "green"}>{system.screening_backlog ? "In flight" : "Clear"}</Badge>}
          />
          <HealthRow
            title="Pending Transfers"
            detail={
              system.pending_transfers
                ? `${plural(system.pending_transfers, "willing borrower")} waiting, longest ${seconds(system.longest_wait_s, 0)} · ${num(system.transfers_in_progress)} being transferred`
                : `Nobody waiting · ${num(system.transfers_in_progress)} being transferred`
            }
            badge={<Badge tone={system.pending_transfers ? "amber" : "green"}>{system.pending_transfers ? "Waiting" : "Clear"}</Badge>}
          />
          <HealthRow
            title="Recent Recovery Actions"
            detail={
              last
                ? `${plural(system.recovery.count, "action")} in range · last: ${recoveryAction(last.action).label} (${ago(last.at, now)})`
                : "No recovery actions recorded"
            }
            badge={<Badge tone={system.recovery.count ? "blue" : "gray"}>{system.recovery.count ? "Reconciled" : "None"}</Badge>}
          />
        </div>
        <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[17px] text-amber-600 mt-0.5 shrink-0">shield</span>
          <p className="text-amber-800 text-body-sm text-[12px] leading-snug font-normal">
            New screening calls are restricted when the safety controller blocks initiation. It checks every pacing request against
            free agents, abandon and transfer-failure rates and provider health before any call is placed.
          </p>
        </div>
      </div>
      <div className="mt-space-lg flex justify-end">
        <Link className="inline-flex items-center gap-1 font-body-sm text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors" href="/pacing-safety">
          <span>View Safety Decisions</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

function Insight({ funnel: f, since }) {
  const botOnly = Math.max(0, f.answered - f.willing);
  const stillOpen = f.willing - f.connected - f.willing_not_connected;
  return (
    <div className="lg:col-span-7 bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between pb-space-xs">
          <div>
            <h3 className="font-headline-sm text-[16px] font-bold text-slate-900">Screening Insight</h3>
            <p className="font-body-sm text-slate-500 text-[12px] mt-0.5">What the screening step did in the {rangeLabel(since).toLowerCase()}</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-mono-xs text-[10.5px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
            Mock screening bot
          </span>
        </div>
        <div className="p-space-md rounded-xl bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border border-indigo-100/80 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
              <span className="material-symbols-outlined text-[16px]">equalizer</span>
            </div>
            <span className="font-headline-sm text-body-sm font-bold text-slate-900">Willing to connected</span>
          </div>
          <p className="font-body-md text-[13px] font-semibold text-slate-900 leading-snug">
            {f.willing === 0
              ? "No borrower has been recorded as willing in this range yet."
              : `${num(f.connected)} of ${plural(f.willing, "willing respondent")} reached a confirmed agent connection.`}
          </p>
          {f.willing > 0 && (
            <p className="font-body-sm text-[12px] text-slate-600 leading-normal">
              {f.willing_not_connected === 0
                ? "None of the finished calls missed an agent."
                : `${num(f.no_agent_in_time)} had no agent free within the configured wait and ${num(f.left_hold)} hung up while waiting; the campaign's no-agent policy decides whether they get a callback.`}
              {stillOpen > 0 && ` ${num(stillOpen)} ${stillOpen === 1 ? "is" : "are"} still waiting or mid-transfer.`}
            </p>
          )}
        </div>
        <div className="p-space-md rounded-xl bg-slate-50/50 border border-slate-200/60 flex flex-col gap-1.5">
          <span className="font-label-ui text-[10px] uppercase tracking-wider font-semibold text-slate-400">OPERATIONAL CONTEXT</span>
          <p className="font-body-sm text-[12px] text-slate-600 leading-relaxed">
            {plural(botOnly, "answered call")} ended with the bot (declined, callback later or screening failed) without using agent time.
            Screening can reduce agent time spent on unanswered or unwilling contacts, but its benefit depends on answer rates, screening
            duration, transfer delays, and available agent capacity.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-1">
          <Stat label="ANSWERED, BOT ONLY" value={num(botOnly)} tone="text-indigo-600 bg-indigo-50/40 border-indigo-100/60" />
          <Stat label="AVG BOT CONVERSATION" value={seconds(f.avg_bot_s)} tone="text-slate-900 bg-slate-50 border-slate-200/60" />
          <Stat label="AVG WAIT FOR AGENT" value={seconds(f.avg_hold_s)} tone="text-emerald-600 bg-emerald-50/40 border-emerald-100/60" />
        </div>
      </div>
      <div className="mt-space-lg pt-space-xs flex items-center justify-between font-label-mono-xs text-label-mono-xs text-slate-400 border-t border-slate-100">
        <span>Computed from {plural(f.attempts, "screening call")}</span>
        <Link className="inline-flex items-center gap-1 font-body-sm text-[12.5px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors" href="/pacing-safety">
          <span>Review Pacing Thresholds</span>
          <span className="material-symbols-outlined text-[15px]">tune</span>
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center ${tone}`}>
      <span className="font-label-ui text-[9.5px] uppercase tracking-wider font-semibold text-slate-400 mb-1">{label}</span>
      <span className="font-display-kpi text-[20px] font-bold leading-tight">{value}</span>
    </div>
  );
}

function decisionId(code) {
  return code ? Number(String(code).replace("DEC-", "")) : null;
}

function FeedDetails({ item }) {
  const call = item.call_id ? (
    <Link href={`/live-operations?call=${item.call_id}`} className="font-label-mono-xs text-indigo-600 hover:underline">
      {item.call}
    </Link>
  ) : null;
  const agent = item.agent_id ? (
    <Link href={`/agents?id=${item.agent_id}`} className="text-indigo-600 hover:underline">
      {item.agent}
    </Link>
  ) : null;

  switch (item.kind) {
    case "screening_outcome":
      return (
        <>
          {call} · {item.end_reason ? endReason(item.end_reason) : "Outcome recorded by the mock bot"}
        </>
      );
    case "transfer_confirmed":
    case "agent_connected":
      return (
        <>
          {call} handed to {agent ?? "an agent"} via {providerName(item.provider)}
        </>
      );
    case "call_abandoned":
      return (
        <>
          {call} · {endReason(item.end_reason)}
        </>
      );
    case "recovery":
      return (
        <>
          {call && <>{call} · </>}
          {item.detail}
        </>
      );
    case "safety_decision": {
      const r = item.detail && item.detail.includes(":") ? reason(item.detail) : null;
      return (
        <Link href={`/pacing-safety?decision=${decisionId(item.id)}&campaign=${item.campaign_id}`} className="hover:underline">
          {item.approved}/{item.requested} calls approved{r ? ` · ${r.label}` : ""}
        </Link>
      );
    }
    case "operator":
      return (
        <>
          {agent && <>{agent} · </>}
          {item.provider && `${providerName(item.provider)} · `}
          {item.detail || "—"}
        </>
      );
    default:
      return item.detail ?? "—";
  }
}

function RecentActivity({ items, now }) {
  return (
    <div className="bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-space-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">Recent Activity</h2>
            <p className="font-body-sm text-body-sm text-slate-500 mt-0.5">
              Screening outcomes, transfers, recovery, safety changes and operator actions.
            </p>
          </div>
          <Link className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline" href="/event-logs">
            <span>View All Events</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        {items.length === 0 ? (
          <EmptyState icon="history" title="Nothing has happened in this range yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-label-ui text-label-ui uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3 rounded-l-lg font-semibold">TIME</th>
                  <th className="py-2.5 px-3 font-semibold">CAMPAIGN</th>
                  <th className="py-2.5 px-3 font-semibold">ACTIVITY</th>
                  <th className="py-2.5 px-3 font-semibold">RESULT</th>
                  <th className="py-2.5 px-3 rounded-r-lg font-semibold">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const result = feedResult(item);
                  return (
                    <tr key={`${item.kind}-${item.id ?? item.call_id}-${item.at}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-label-mono-xs text-label-mono-xs text-slate-700 font-medium" title={ago(item.at, now)}>
                        {clock(item.at)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.campaign ?? "—"}</td>
                      <td className="py-3 px-3 text-slate-600">{feedKind(item.kind).label}</td>
                      <td className="py-3 px-3">
                        <Badge tone={result.tone} dot>
                          {result.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-[12px] text-slate-600">
                        <FeedDetails item={item} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-400 font-label-mono-xs text-label-mono-xs border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-500 font-body-sm text-[12px]">
          <span className="material-symbols-outlined text-[15px] text-slate-400">lock</span>
          <span>Borrowers are synthetic and phone numbers are never shown in full.</span>
        </div>
        <span className="text-slate-500 font-medium">Latest {plural(items.length, "entry", "entries")}</span>
      </div>
    </div>
  );
}
