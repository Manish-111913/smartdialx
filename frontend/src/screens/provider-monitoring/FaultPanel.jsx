"use client";

import { useState } from "react";
import { post } from "@/lib/api";
import { duration } from "@/lib/format";
import { humanize, providerName } from "@/lib/labels";
import { useAction } from "@/components/ui";

const KINDS = ["timeout", "latency", "outage", "duplicates", "out_of_order", "normal"];
const DURATIONS = [
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 900, label: "15 minutes" },
];

// What the rest of SmartDialX is expected to do about each fault; this is the
// behaviour of the backend code, not a promise about real carriers.
export const EXPECTED = {
  normal: "Clears any injected fault and puts the provider back on its usual profile.",
  latency:
    "Calls take about three times as long to ring and 5-10s longer to answer. They still connect; the pacer just sees a longer setup time.",
  timeout:
    "Call requests time out. Each one is marked UNKNOWN and recovery looks it up at the provider by token, so nothing is dialed twice. Webhooks keep flowing.",
  outage:
    "The provider refuses requests and holds its webhooks. New calls fail fast, the provider error-rate rule stops new calls on it, and the held events arrive once it's back.",
  duplicates:
    "About half the events are delivered twice. A repeat hits the stored event id and only bumps a delivery counter, so nothing is applied twice.",
  out_of_order:
    "Events arrive up to 10s late in random order. Stale or late ones are recorded without moving any call backwards.",
};

export default function FaultPanel({ providers, labels, now, onChanged }) {
  const [target, setTarget] = useState("B");
  const [kind, setKind] = useState("timeout");
  const [length, setLength] = useState(60);
  const { run, busy } = useAction();

  const provider = providers.find((p) => p.name === target);
  const active = provider?.fault;
  const label = (k) => labels?.[k] ?? humanize(k);

  const inject = async (chosen) => {
    const body = chosen === "normal" ? { kind: "normal" } : { kind: chosen, duration_s: length };
    const title = chosen === "normal" ? `${providerName(target)} back to normal` : `${label(chosen)} on ${providerName(target)}`;
    const detail = chosen === "normal" ? undefined : `Runs for ${duration(length)} of console time.`;
    const ok = await run(() => post(`/providers/${target}/fault`, body), title, detail);
    if (ok) onChanged();
  };

  return (
    <div className="lg:col-span-5 bg-po-surface-container-lowest rounded-xl p-5 border border-po-surface-container shadow-sm flex flex-col justify-between">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-po-secondary">science</span>
            <h2 className="font-headline-md text-[18px] text-po-primary font-bold">Fault Simulation</h2>
          </div>
          <span className="px-2 py-0.5 rounded bg-po-surface-container text-po-secondary font-label-mono-xs text-[11px] font-semibold">Mock providers only</span>
        </div>
        <p className="font-body-sm text-[12.5px] text-po-on-surface-variant">
          Fault simulation exercises SmartDialX&apos;s event processing, safety controls, and recovery logic using mock providers. It affects the
          live console for everyone watching it.
        </p>
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex flex-col gap-1.5">
            <span className="font-label-ui text-[11px] text-po-primary uppercase font-semibold">Provider</span>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setTarget(p.name)}
                  className={`px-3 py-1.5 rounded-lg font-body-sm text-[13px] transition-colors ${
                    target === p.name
                      ? "text-po-primary bg-po-surface-container-high font-semibold"
                      : "text-po-on-surface-variant bg-po-surface-container-low font-medium hover:bg-po-surface-container"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fault-kind" className="font-label-ui text-[11px] text-po-primary uppercase font-semibold">
              Simulated behaviour
            </label>
            <div className="relative">
              <select
                id="fault-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full h-8 pl-3 pr-8 bg-po-surface-container-low hover:bg-po-surface-container text-po-primary font-body-sm text-[13px] rounded-lg border-0 appearance-none focus:ring-1 focus:ring-po-secondary transition-colors cursor-pointer py-0"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {label(k)}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[16px] text-po-on-surface-variant absolute right-2.5 top-2 pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-label-ui text-[11px] text-po-primary uppercase font-semibold">Duration</span>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  disabled={kind === "normal"}
                  onClick={() => setLength(d.value)}
                  className={`py-1 rounded-lg font-label-mono-xs text-[11px] transition-colors disabled:opacity-40 ${
                    length === d.value
                      ? "bg-po-surface-container-high text-po-primary font-semibold"
                      : "bg-po-surface-container-low text-po-on-surface-variant font-medium hover:bg-po-surface-container"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 mt-4">
        {active && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
            <div className="font-body-sm text-[12px] text-amber-900">
              <span className="font-semibold">Active on {providerName(target)}:</span> {active.label}
              {active.until ? ` · ends in ${duration(Math.max(0, active.until - now))}` : " · until cleared"}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => inject("normal")}
              className="h-7 px-2.5 rounded-lg bg-white border border-amber-300 text-amber-800 font-body-sm text-[12px] font-semibold hover:bg-amber-100 shrink-0 disabled:opacity-50"
            >
              Clear fault
            </button>
          </div>
        )}
        <div className="p-3 rounded-lg bg-po-surface-container-low border-l-4 border-l-po-secondary flex flex-col gap-1">
          <div className="flex items-center justify-between font-label-mono-xs text-[11px]">
            <span className="font-semibold text-po-primary">
              {label(kind)} on {providerName(target)}
            </span>
            <span className="text-po-secondary font-semibold">{kind === "normal" ? "Restore" : `${duration(length)}`}</span>
          </div>
          <p className="font-body-sm text-[12px] text-po-on-surface-variant leading-relaxed">{EXPECTED[kind]}</p>
        </div>
        <button
          type="button"
          disabled={busy || !provider}
          onClick={() => inject(kind)}
          className="w-full h-9 rounded-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[16px]">{kind === "normal" ? "restart_alt" : "play_arrow"}</span>
          <span>{busy ? "Applying…" : kind === "normal" ? "Restore normal operation" : "Run fault"}</span>
        </button>
      </div>
    </div>
  );
}
