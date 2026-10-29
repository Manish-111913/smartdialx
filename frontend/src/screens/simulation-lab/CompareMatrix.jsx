"use client";

import { num, pct } from "@/lib/format";
import { ErrorNote, Skeleton } from "@/components/ui";
import { RunStatus } from "./RunResults";
import { isActive, strategyLabel } from "./shared";

export default function CompareMatrix({ job, audiences, onCompare, busy }) {
  const rows = job?.result?.rows ?? [];
  const best = rows.length ? Math.max(...rows.map((r) => r.productive_utilization ?? 0)) : null;
  const first = rows[0]?.scenario;
  const audience = audiences?.[job?.params?.audience ?? "standard"];

  return (
    <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-headline-sm text-headline-sm text-po-on-surface">Comparative Dialing Strategy Matrix</h3>
            {job && (
              <>
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Run #{job.id}</span>
                <RunStatus job={job} />
              </>
            )}
          </div>
          <span className="font-body-sm text-body-sm text-po-on-surface-variant">
            {first
              ? `Same simulated audience on every row: ${audience?.label ?? "Standard"}, ${num(first.agents)} agents, ${num(first.borrowers)} targets, ${pct(first.answer_rate, 0)} answer rate, seed ${first.seed}`
              : "Runs progressive and predictive pacing, with and without screening, on the same audience"}
          </span>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onCompare}
          className="h-8 px-space-md rounded-po-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px] text-po-on-surface-variant">compare_arrows</span>
          <span>{job ? "Compare again with current settings" : "Compare strategies"}</span>
        </button>
      </div>

      {job?.status === "failed" && <ErrorNote error={`The comparison failed: ${job.error ?? "unknown error"}`} />}
      {isActive(job) && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 rounded-po" />
          ))}
          <p className="font-body-sm text-body-sm text-po-on-surface-variant">Running four simulations one after another…</p>
        </div>
      )}
      {!job && (
        <p className="font-body-sm text-body-sm text-po-on-surface-variant py-4 text-center">
          No comparison yet. It uses the configuration above for all four strategies.
        </p>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-po">Strategy</th>
                <th className="py-2.5 px-3">Calls Initiated</th>
                <th className="py-2.5 px-3">Agent Conversations</th>
                <th className="py-2.5 px-3">Productive</th>
                <th className="py-2.5 px-3">Agent Util</th>
                <th className="py-2.5 px-3">Productive Util</th>
                <th className="py-2.5 px-3">Abandon Rate</th>
                <th className="py-2.5 px-3">Safety Interventions</th>
                <th className="py-2.5 px-3 rounded-r-po">Invariants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-po-surface-container-low">
              {rows.map((r) => {
                const top = r.productive_utilization === best;
                return (
                  <tr key={strategyLabel(r.scenario)} className={`transition-colors ${top ? "bg-po-surface-container-low/70" : "hover:bg-po-surface-container-low/40"}`}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-po-full ${r.scenario.screening ? "bg-po-secondary" : "bg-po-on-surface-variant"}`} />
                        <span className={`font-semibold ${top ? "text-po-secondary" : "text-po-on-surface"}`}>{strategyLabel(r.scenario)}</span>
                        {top && (
                          <span className="px-1.5 rounded-po bg-po-surface-container-high text-po-secondary font-label-mono-xs text-[9.5px]">
                            highest productive util
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-mono-sm">{num(r.calls_initiated)}</td>
                    <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-on-surface">{num(r.agent_conversations)}</td>
                    <td className="py-3 px-3 font-label-mono-sm">{num(r.productive_conversations)}</td>
                    <td className="py-3 px-3 font-label-mono-sm">{pct(r.utilization)}</td>
                    <td className={`py-3 px-3 font-label-mono-sm ${top ? "font-bold text-po-secondary" : ""}`}>{pct(r.productive_utilization)}</td>
                    <td className={`py-3 px-3 font-label-mono-sm font-medium ${r.calls_abandoned ? "text-po-error" : "text-po-secondary"}`}>
                      {pct(r.abandon_rate, 2)} ({num(r.calls_abandoned)})
                    </td>
                    <td className="py-3 px-3 font-label-mono-sm">{num(r.safety_interventions)}</td>
                    <td className={`py-3 px-3 font-label-mono-sm ${r.invariant_violations.length ? "text-po-error font-semibold" : "text-po-on-surface-variant"}`}>
                      {num(r.invariant_violations.length)} violations
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="p-space-sm rounded-po bg-po-surface-container-low flex items-center gap-2 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
        <span className="material-symbols-outlined text-[15px] text-po-on-surface-variant shrink-0">info</span>
        <span>
          Productive conversations leave out short not-now calls that reach an agent when nobody screens first. Results depend on the answer
          rate, the audience, bot conversation length, transfer waits and free agents, so rerun with your own settings before drawing
          conclusions.
        </span>
      </div>
    </div>
  );
}
