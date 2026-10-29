"use client";

import Link from "next/link";
import { useApi } from "@/lib/api";
import { clock, dateTime, num, pct, seconds } from "@/lib/format";
import { decision, humanize, reason } from "@/lib/labels";
import { Badge, Drawer, ErrorNote, Skeleton } from "@/components/ui";

// labels for the pacer's inputs; anything not listed is shown humanized
const INPUTS = {
  available_agents: "Free agents",
  wrap_up_ending_soon: "Wrap-ups ending soon",
  capacity: "Capacity planned with",
  unbound_in_flight: "Predictive calls ringing",
  screening_in_flight: "Bot calls in flight",
  pending_transfers: "Borrowers waiting for an agent",
  ring_answered: "Answered (recent window)",
  ring_total: "Ring outcomes (recent window)",
  screen_willing: "Willing (recent window)",
  risk_target: "Acceptable risk per decision",
  risk_at_n: "Risk at the chosen batch",
  binomial_n: "Largest safe batch",
  expected_value_n: "Expected-value batch",
  provider_health: "Provider health",
  queued_ready: "Borrowers ready to dial",
  avg_talk_s: "Average talk time",
  avg_setup_s: "Average time to answer",
};
const PERCENT = new Set(["p_hat", "p_safe", "risk_target", "risk_at_n", "provider_health"]);
const SECONDS = new Set(["avg_talk_s", "avg_setup_s"]);

function inputLabel(key, inputs) {
  const rateOf = "screen_willing" in inputs ? "Willing rate" : "Answer rate";
  if (key === "p_hat") return `${rateOf} (smoothed)`;
  if (key === "p_safe") return `${rateOf} planned with (upper bound)`;
  return INPUTS[key] ?? humanize(key);
}

function inputValue(key, value) {
  if (value === null || value === undefined) return "—";
  if (PERCENT.has(key)) return pct(value, 1);
  if (SECONDS.has(key)) return seconds(value);
  return typeof value === "number" ? num(value) : String(value);
}

export default function DecisionDrawer({ id, onClose }) {
  const { data, error } = useApi(id ? `/decisions/${id}` : null, { interval: 0 });
  const d = data?.decision;
  const verdict = decision(d?.action);

  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      title="Decision Inspector"
      subtitle={d ? `${d.code} · ${dateTime(d.at)}` : "Loading…"}
      badge={d && <Badge tone={verdict.tone}>{verdict.label}</Badge>}
      width="max-w-md"
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <Link
            href="/live-operations"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-xs inline-flex items-center gap-1.5"
          >
            View in Live Operations
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      }
    >
      <ErrorNote error={error} className="mb-4" />
      {!d ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-28" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-5 text-xs">
          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200/80 space-y-2">
            <Row label="Campaign" value={d.campaign} strong />
            <Row label="Pacer mode" value={humanize(d.mode)} />
            <Row label="Ran as" value={d.bound ? "Progressive (one call per free agent)" : "Predictive (dial ahead)"} />
            <Row label="Time" value={clock(d.at)} mono />
          </div>

          <div className="p-4 border border-blue-100 bg-blue-50/40 rounded-xl space-y-3">
            <div className="text-xs font-bold text-gray-800">Dispatch comparison</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Count label="Pacer asked" value={d.requested} tone="text-blue-700" />
              <Count label="Safety allowed" value={d.approved} tone={d.approved < d.requested ? "text-amber-600" : "text-emerald-600"} />
              <Count label="Calls started" value={d.started ?? 0} tone="text-gray-800" />
            </div>
            {d.reasoning && (
              <p className="text-[11px] text-gray-600 bg-white/70 p-2 rounded border border-gray-200/60 leading-relaxed font-mono">{d.reasoning}</p>
            )}
          </div>

          <div>
            <div className="font-bold text-gray-900 mb-2">Why</div>
            {d.reasons.length === 0 ? (
              <p className="text-gray-500">No safety rule changed the request; it was approved as asked.</p>
            ) : (
              <ul className="space-y-2">
                {d.reasons.map((r) => {
                  const why = reason(r);
                  return (
                    <li key={r} className="p-2.5 rounded-md border border-amber-200 bg-amber-50/50">
                      <div className="font-semibold text-gray-800">{why.label}</div>
                      {why.detail && <div className="text-[11px] text-gray-500 font-mono mt-0.5">{why.detail}</div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <div className="font-bold text-gray-900 mb-3">Evaluation steps</div>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
              <Step dot="bg-blue-500" title="Pacing engine" text={`Asked for ${plural(d.requested)} in ${d.mode} mode.`} />
              <Step
                dot={d.approved < d.requested ? "bg-amber-500" : "bg-emerald-500"}
                title={`Safety controller: ${verdict.label.toLowerCase()}`}
                text={
                  d.reasons.length
                    ? `Allowed ${plural(d.approved)}. ${reason(d.reasons[0]).label}.`
                    : `Allowed all ${plural(d.approved)}.`
                }
              />
              <Step
                dot="bg-gray-500"
                title="Allocator"
                text={
                  (d.started ?? 0) < d.approved
                    ? `Started ${plural(d.started ?? 0)}; ran out of borrowers or agents before reaching ${d.approved}.`
                    : `Started ${plural(d.started ?? 0)}.`
                }
              />
            </div>
            <p className="text-[10.5px] text-gray-400 mt-2">All three steps run in the same pacing round at {clock(d.at)}.</p>
          </div>

          {Object.keys(d.inputs).length > 0 && (
            <div>
              <div className="font-bold text-gray-900 mb-2">What the pacer saw</div>
              <dl className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                {Object.entries(d.inputs).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 px-3 py-1.5">
                    <dt className="text-gray-500">{inputLabel(key, d.inputs)}</dt>
                    <dd className="font-mono text-gray-800">{inputValue(key, value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function plural(n) {
  return `${num(n)} call${n === 1 ? "" : "s"}`;
}

function Row({ label, value, strong, mono }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className={`text-right ${strong ? "font-semibold text-gray-900" : "text-gray-700"} ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function Count({ label, value, tone }) {
  return (
    <div className="bg-white p-2.5 rounded-md border border-gray-200">
      <span className="text-[10px] text-gray-400 block uppercase">{label}</span>
      <span className={`text-base font-mono font-bold ${tone}`}>{num(value)}</span>
    </div>
  );
}

function Step({ dot, title, text }) {
  return (
    <div className="relative">
      <span className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${dot}`} />
      <div className="text-gray-800 font-semibold text-[11px]">{title}</div>
      <div className="text-[11px] text-gray-500">{text}</div>
    </div>
  );
}
