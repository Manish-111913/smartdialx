"use client";

import { clock, num } from "@/lib/format";
import { providerName } from "@/lib/labels";
import { EmptyState } from "@/components/ui";
import { RunStatus } from "./RunResults";
import { FAULTS, presetLabel } from "./shared";

export default function RunHistory({ runs, presets, selectedId, onSelect, onLoad }) {
  return (
    <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-po-on-surface">Recent Simulation Run History</h3>
          <span className="font-body-sm text-body-sm text-po-on-surface-variant">Runs started since the backend was last started (kept in memory, newest first)</span>
        </div>
        <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">{num(runs.length)} runs</span>
      </div>
      {runs.length === 0 ? (
        <EmptyState icon="science" title="No simulations yet" detail="Configure a scenario above and press Run Simulation." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 rounded-l-po">Run ID</th>
                <th className="py-2.5 px-3">Scenario Preset</th>
                <th className="py-2.5 px-3">Dialing Mode</th>
                <th className="py-2.5 px-3">AI Screening</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Started At</th>
                <th className="py-2.5 px-3 rounded-r-po text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-po-surface-container-low">
              {runs.map((job) => {
                const p = job.params ?? {};
                const violations = job.compare
                  ? (job.result?.rows ?? []).reduce((sum, r) => sum + r.invariant_violations.length, 0)
                  : (job.result?.invariant_violations?.length ?? 0);
                return (
                  <tr key={job.id} className={`transition-colors ${job.id === selectedId ? "bg-po-surface-container-low/70" : "hover:bg-po-surface-container-low/40"}`}>
                    <td className={`py-3 px-3 font-label-mono-sm font-semibold ${job.id === selectedId ? "text-po-secondary" : "text-po-on-surface"}`}>#{job.id}</td>
                    <td className="py-3 px-3 font-medium text-po-on-surface">{presetLabel(presets, p.preset ?? "balanced")}</td>
                    <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">
                      {job.compare ? "Comparison (4 runs)" : p.mode === "progressive" ? "Progressive" : "Predictive"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs ${
                          job.compare || p.screening ? "bg-po-surface-container-high text-po-secondary" : "bg-po-surface-container text-po-on-surface-variant"
                        }`}
                      >
                        {job.compare ? "On and off" : p.screening ? "On" : "Off"}
                      </span>
                    </td>
                    <td className={`py-3 px-3 font-label-mono-xs ${p.fault && p.fault !== "normal" ? "text-po-error font-medium" : ""}`}>
                      {providerName(p.provider ?? "A")}
                      {p.fault && p.fault !== "normal" ? ` (${FAULTS[p.fault] ?? p.fault})` : ""}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <RunStatus job={job} />
                        {job.status === "done" && (
                          <span className={`font-label-mono-xs text-[10.5px] ${violations ? "text-po-error" : "text-po-on-surface-variant"}`}>
                            {num(violations)} violations
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">{clock(job.created_at)}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelect(job)}
                          className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs"
                        >
                          Results
                        </button>
                        <button
                          type="button"
                          onClick={() => onLoad(p)}
                          title="Load this run's settings into the form"
                          className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs"
                        >
                          Clone
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center gap-1.5 pt-space-xs font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
        <span className="material-symbols-outlined text-[14px] text-po-secondary">verified_user</span>
        <span>Every run uses generated borrowers with +1-555 numbers and mock providers only.</span>
      </div>
    </div>
  );
}
