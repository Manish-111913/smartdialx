"use client";

import { useRef, useState } from "react";
import { post, useApi } from "@/lib/api";
import { num, pct, rate } from "@/lib/format";
import { AUDIENCE_HINT, providerName } from "@/lib/labels";
import { ErrorNote, Skeleton, useAction, useToast } from "@/components/ui";
import CompareMatrix from "./CompareMatrix";
import RunHistory from "./RunHistory";
import RunResults from "./RunResults";
import { DEFAULTS, FAULT_HINTS, FAULTS, formFromParams, isActive, presetChips, presetLabel } from "./shared";

const MODES = [
  {
    key: "progressive",
    title: "Progressive Dialing",
    text: "One call per free agent. Anyone who answers always has an agent ready, at the cost of more idle agent time.",
    chip: "1 call per free agent",
  },
  {
    key: "predictive",
    title: "Predictive Dialing",
    text: "Dials ahead using the observed answer rate, sized so running out of agents stays unlikely. Safety caps over-dialing.",
    chip: "Binomial risk model + safety caps",
  },
];

const input =
  "w-full h-8 px-2.5 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-po-secondary py-0";

export default function SimulationLabScreen() {
  const toast = useToast();
  const { run, busy } = useAction();
  const [form, setForm] = useState(DEFAULTS);
  const [selectedId, setSelectedId] = useState(null);
  const [compareId, setCompareId] = useState(null);
  const resultsRef = useRef(null);
  const compareRef = useRef(null);

  // the run list lives in memory on the server and is small, so a steady poll is cheap
  const { data, error, loading, refresh } = useApi("/simulations", { interval: 3000 });
  const runs = data?.runs ?? [];
  const presets = data?.presets ?? {};
  const audiences = data?.audiences ?? {};
  const anyActive = runs.some(isActive);

  const selected = selectedId ?? runs.find((r) => !r.compare)?.id ?? null;
  const listItem = runs.find((r) => r.id === selected) ?? null;
  const detailActive = isActive(listItem);
  const { data: detail } = useApi(selected ? `/simulations/${selected}` : null, { interval: detailActive ? 2000 : 0 });
  const job = detail && detail.id === selected && !(detailActive === false && isActive(detail)) ? detail : listItem;

  const compareJob = runs.find((r) => r.id === (compareId ?? runs.find((x) => x.compare)?.id)) ?? null;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  function applyPreset(key) {
    const p = presets[key] ?? {};
    setForm((f) => ({ ...f, preset: key, provider: p.provider ?? "A", fault: p.fault ?? "normal" }));
  }

  async function start(params, compare = false) {
    // the wait only matters when the bot screens first
    const hold = params.screening ? Number(params.hold_s) : DEFAULTS.hold_s;
    const seed = Number(params.seed);
    if (!(hold >= 5 && hold <= 300)) {
      toast({ tone: "error", title: "Check the agent wait", detail: "Max agent wait must be between 5 and 300 seconds." });
      return;
    }
    if (!Number.isInteger(seed) || seed < 0) {
      toast({ tone: "error", title: "Check the seed", detail: "The seed must be a whole number, 0 or more." });
      return;
    }
    const body = { ...params, hold_s: hold, seed, agents: Number(params.agents), borrowers: Number(params.borrowers), compare };
    await run(
      async () => {
        const created = await post("/simulations", body);
        if (compare) {
          setCompareId(created.id);
          compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          setSelectedId(created.id);
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        refresh();
      },
      compare ? "Comparison started" : "Simulation started",
      compare ? "Four runs on the same audience; the matrix fills in when they finish." : "Results appear below when it finishes.",
    );
  }

  function selectRun(item) {
    if (item.compare) {
      setCompareId(item.id);
      compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setSelectedId(item.id);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const done = runs.filter((r) => r.status === "done" && r.result);
  const summaries = done.flatMap((r) => (r.compare ? (r.result.rows ?? []) : [r.result]));
  const total = (key) => summaries.reduce((sum, s) => sum + (s[key] ?? 0), 0);
  const answered = total("calls_answered");
  const connected = total("calls_connected");
  const violations = summaries.reduce((sum, s) => sum + (s.invariant_violations?.length ?? 0), 0);
  const running = runs.filter(isActive);
  const audience = audiences[form.audience];

  return (
    <div className="font-body-md text-po-on-surface antialiased selection:bg-po-secondary-fixed selection:text-po-secondary bg-po-background min-h-[calc(100vh-3.5rem)]">
      <div className="p-space-lg xl:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full">
        <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col gap-space-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-sm flex-wrap">
                <h1 className="font-headline-lg text-headline-lg text-po-on-surface tracking-tight">Simulation Lab</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container-low text-po-secondary uppercase tracking-wider">
                  <span className={`w-1.5 h-1.5 rounded-po-full bg-po-secondary ${anyActive ? "animate-ping" : ""}`} />
                  Mock Simulation
                </span>
              </div>
              <p className="font-body-md text-body-md text-po-on-surface-variant mt-1">
                Test dialing strategies, AI screening outcomes, and system resilience in a controlled environment.
              </p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap self-start lg:self-center">
              <div className="relative">
                <select
                  aria-label="Scenario preset"
                  value={form.preset}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-po-lg bg-po-surface-container-low text-po-on-surface font-body-sm text-body-sm focus:outline-none appearance-none cursor-pointer py-0"
                >
                  {Object.entries(presets).map(([key, p]) => (
                    <option key={key} value={key}>
                      {p.label}
                    </option>
                  ))}
                  {!presets[form.preset] && <option value={form.preset}>{form.preset}</option>}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2 text-[18px] text-po-on-surface-variant pointer-events-none">expand_more</span>
              </div>
              <button
                type="button"
                onClick={() => setForm(DEFAULTS)}
                className="h-9 px-space-md rounded-po-lg bg-po-surface-container-low hover:bg-po-surface-container-high text-po-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-po-on-surface-variant">restart_alt</span>
                <span>Reset</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => start(form)}
                className="h-9 px-space-lg rounded-po-lg bg-po-primary hover:bg-po-inverse-surface text-po-on-primary font-headline-sm text-body-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-[18px] text-po-tertiary-fixed ${busy ? "animate-spin" : ""}`}>{busy ? "progress_activity" : "play_circle"}</span>
                <span>{busy ? "Starting…" : "Run Simulation"}</span>
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2 px-space-md py-2 rounded-po-lg bg-po-surface-container-low text-po-on-surface-variant font-label-mono-xs text-label-mono-xs">
            <span className="material-symbols-outlined text-[15px] text-po-secondary">info</span>
            <span>
              Each run is an isolated simulated world: a fresh in-memory database, a fake clock and mock providers A and B, running the same
              pacing, safety, allocator, event and recovery code as the live console. Nothing here touches live campaigns, agents or calls.
            </span>
          </div>
          {running.length > 0 && (
            <div className="flex items-center gap-2 px-space-md py-2 rounded-po-lg bg-po-secondary-fixed text-po-on-secondary-fixed font-label-mono-xs text-label-mono-xs">
              <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
              <span>
                {running.map((r) => `Run #${r.id} ${r.status}${r.compare ? " (comparison)" : ""}`).join(" · ")}
              </span>
            </div>
          )}
        </div>

        <ErrorNote error={error} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {loading && !data
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-po-xl" />)
            : [
                {
                  label: "Simulations Executed",
                  chip: running.length ? `${running.length} running` : "This server session",
                  value: num(done.length),
                  unit: "runs finished",
                  footer: "Simulated worlds",
                  footerValue: num(summaries.length),
                },
                {
                  label: "Calls Processed",
                  chip: "Mock providers",
                  value: num(total("calls_initiated")),
                  unit: "calls initiated",
                  footer: "Answered",
                  footerValue: num(answered),
                },
                {
                  label: "Agent Connections",
                  chip: `${pct(rate(connected, answered))} of answered`,
                  value: num(connected),
                  unit: "agent connected",
                  footer: "Abandoned",
                  footerValue: num(total("calls_abandoned")),
                },
                {
                  label: "Safety Interventions",
                  chip: `${num(summaries.reduce((sum, s) => sum + (s.decisions?.REJECT ?? 0), 0))} blocked`,
                  value: num(total("safety_interventions")),
                  unit: "requests changed",
                  footer: "Invariant violations",
                  footerValue: num(violations),
                },
              ].map((t) => (
                <div key={t.label} className="bg-po-surface-container-lowest p-space-md rounded-po-xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">{t.label}</span>
                    <span className="text-label-mono-xs font-label-mono-xs px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-on-surface-variant whitespace-nowrap">{t.chip}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-display-kpi text-display-kpi text-po-on-surface font-semibold tracking-tight">{t.value}</span>
                    <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">{t.unit}</span>
                  </div>
                  <div className="mt-3 pt-2 bg-po-surface-container-low p-2 rounded-po flex items-center justify-between font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                    <span>{t.footer}</span>
                    <span className="text-po-on-surface font-semibold">{t.footerValue}</span>
                  </div>
                </div>
              ))}
        </div>

        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Quick Scenario Presets</span>
            <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Loads the preset into the form below</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
            {Object.entries(presets).map(([key, p]) => {
              const active = form.preset === key;
              const fault = p.fault && p.fault !== "normal";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={`text-left p-space-md rounded-po-xl bg-po-surface-container-lowest shadow-sm transition-all group flex flex-col justify-between gap-2 ${
                    active ? "ring-2 ring-po-secondary" : "hover:bg-po-surface-container-low"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`font-headline-sm text-body-md font-semibold ${fault ? "text-po-error" : active ? "text-po-secondary" : "text-po-on-surface group-hover:text-po-secondary"}`}>
                        {p.label}
                      </span>
                      {active && <span className="w-1.5 h-1.5 mt-2 rounded-po-full bg-po-secondary shrink-0" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {presetChips(p).map((chip) => (
                        <span key={chip} className="font-label-mono-xs text-[10px] px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-on-surface">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary flex items-center gap-1 font-semibold">
                    {active ? "Selected" : "Load preset"}
                    <span className="material-symbols-outlined text-[13px]">{active ? "check" : "arrow_forward"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col gap-space-lg">
          <div className="flex items-center justify-between pb-space-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-po-surface-container flex items-center justify-center text-po-on-surface">
                <span className="material-symbols-outlined text-[17px]">tune</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-po-on-surface">Configure Simulation Parameters</h2>
                <p className="font-body-sm text-body-sm text-po-on-surface-variant">Pacing mode, screening, workload and provider faults for the next run</p>
              </div>
            </div>
            <label className="flex items-center gap-2 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
              Seed
              <input
                type="number"
                min="0"
                value={form.seed}
                onChange={(e) => set("seed", e.target.value)}
                className="w-20 h-7 px-2 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs focus:outline-none py-0"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            <div className="lg:col-span-4 flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">A. Dialing Mode</span>
                <span className="font-label-mono-xs text-[11px] text-po-secondary">Pacing strategy</span>
              </div>
              <div className="grid grid-cols-1 gap-space-sm">
                {MODES.map((m) => {
                  const active = form.mode === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => set("mode", m.key)}
                      aria-pressed={active}
                      className={`text-left p-space-md rounded-po-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        active ? "bg-po-surface-container-low ring-2 ring-po-secondary" : "bg-po-surface-container-low/50 hover:bg-po-surface-container-low"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-headline-sm text-body-md ${active ? "font-semibold text-po-secondary" : "text-po-on-surface"}`}>{m.title}</span>
                        <span className="font-body-sm text-[12px] text-po-on-surface-variant mt-0.5">{m.text}</span>
                        <div className="mt-2 font-label-mono-xs text-[10px] text-po-on-surface-variant">
                          <span className={`px-1.5 py-0.5 rounded-po bg-po-surface-container ${active ? "text-po-secondary font-medium" : ""}`}>{m.chip}</span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-po-full flex items-center justify-center shrink-0 ${
                          active ? "bg-po-secondary text-po-on-secondary" : "bg-po-surface-container text-po-on-surface-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">{active ? "check" : "circle"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">B. AI Voice Screening</span>
                <div className="flex items-center gap-2">
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">{form.screening ? "On" : "Off"}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.screening}
                    aria-label="Mock screening bot"
                    onClick={() => set("screening", !form.screening)}
                    className={`w-9 h-5 rounded-po-full flex items-center p-0.5 transition-colors ${form.screening ? "bg-po-secondary" : "bg-po-surface-dim"}`}
                  >
                    <span className={`w-4 h-4 rounded-po-full bg-po-surface-container-lowest shadow-sm transition-transform ${form.screening ? "translate-x-4" : ""}`} />
                  </button>
                </div>
              </div>
              <div className={`p-space-md rounded-po-xl bg-po-surface-container-low flex flex-col gap-space-md ${form.screening ? "" : "opacity-70"}`}>
                <div>
                  <label htmlFor="sim-audience" className="block font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider mb-1">
                    Outcome Profile (Mock Audience)
                  </label>
                  <select id="sim-audience" value={form.audience} onChange={(e) => set("audience", e.target.value)} className={input}>
                    {Object.entries(audiences).map(([key, a]) => (
                      <option key={key} value={key}>
                        {a.label} ({pct(a.willing_rate, 0)} willing)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div>
                    <label htmlFor="sim-hold" className="block font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider mb-1">
                      Max Agent Wait
                    </label>
                    <div className="relative">
                      <input
                        id="sim-hold"
                        type="number"
                        min="5"
                        max="300"
                        value={form.hold_s}
                        disabled={!form.screening}
                        onChange={(e) => set("hold_s", e.target.value)}
                        className={`${input} pr-8 font-label-mono-sm`}
                      />
                      <span className="absolute right-2 top-2 font-label-mono-xs text-[10px] text-po-on-surface-variant">sec</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="sim-policy" className="block font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider mb-1">
                      No-Agent Policy
                    </label>
                    <select
                      id="sim-policy"
                      value={form.no_agent_policy}
                      disabled={!form.screening}
                      onChange={(e) => set("no_agent_policy", e.target.value)}
                      className={`${input} text-[12px]`}
                    >
                      <option value="callback">Callback later</option>
                      <option value="end">End politely</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-1 font-body-sm text-[11px] text-po-on-surface-variant leading-relaxed">
                  <span className="material-symbols-outlined text-[15px] text-po-secondary shrink-0">smart_toy</span>
                  <span>
                    {AUDIENCE_HINT} A single run uses it only when screening is on; a comparison uses it on all four rows.
                    {audience ? ` This one: ${pct(audience.willing_rate, 0)} willing, ${pct(audience.unavailable_rate, 0)} can’t talk now, ${pct(audience.screen_fail_rate, 0)} bot failures, the rest decline.` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">C. Workload &amp; Provider Faults</span>
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Resource Inputs</span>
              </div>
              <div className="p-space-md rounded-po-xl bg-po-surface-container-low flex flex-col gap-space-md">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="sim-agents" className="font-body-sm text-body-sm text-po-on-surface font-medium">
                      Agents Logged In
                    </label>
                    <span className="font-label-mono-sm text-label-mono-sm font-semibold text-po-secondary">{num(Number(form.agents))} Agents</span>
                  </div>
                  <input
                    id="sim-agents"
                    type="range"
                    min="1"
                    max="100"
                    value={form.agents}
                    onChange={(e) => set("agents", Number(e.target.value))}
                    className="w-full accent-po-secondary h-1.5 bg-po-surface-container rounded-po-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between font-label-mono-xs text-[10px] text-po-on-surface-variant mt-1">
                    <span>1 Agent</span>
                    <span>50</span>
                    <span>100 Agents</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="sim-borrowers" className="font-body-sm text-body-sm text-po-on-surface font-medium">
                      Synthetic Call Targets
                    </label>
                    <span className="font-label-mono-sm text-label-mono-sm font-semibold text-po-on-surface">{num(Number(form.borrowers))} Targets</span>
                  </div>
                  <input
                    id="sim-borrowers"
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={form.borrowers}
                    onChange={(e) => set("borrowers", Number(e.target.value))}
                    className="w-full accent-po-secondary h-1.5 bg-po-surface-container rounded-po-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <span className="block font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider mb-1">Mock Provider &amp; Fault</span>
                  <div className="grid grid-cols-2 gap-space-xs">
                    <select aria-label="Mock provider" value={form.provider} onChange={(e) => set("provider", e.target.value)} className={`${input} text-[12px]`}>
                      <option value="A">{providerName("A")}</option>
                      <option value="B">{providerName("B")}</option>
                    </select>
                    <select aria-label="Injected fault" value={form.fault} onChange={(e) => set("fault", e.target.value)} className={`${input} text-[12px]`}>
                      {Object.entries(FAULTS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 font-body-sm text-[11px] text-po-on-surface-variant">{FAULT_HINTS[form.fault]}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-space-sm flex-wrap gap-space-sm">
            <div className="flex items-center gap-space-sm font-body-sm text-body-sm text-po-on-surface-variant flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs text-label-mono-xs font-medium">
                <span className="w-2 h-2 rounded-po-full bg-po-secondary" />
                {form.mode === "predictive" ? "Predictive" : "Progressive"}
                {form.screening ? ` + AI screening (${audience?.label ?? form.audience})` : ", no screening"}
              </span>
              <span className="font-label-mono-xs text-label-mono-xs">
                {presetLabel(presets, form.preset)} · {num(Number(form.agents))} agents · {num(Number(form.borrowers))} targets ·{" "}
                {providerName(form.provider)} · {FAULTS[form.fault]}
              </span>
            </div>
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={() => setForm(DEFAULTS)}
                className="px-space-md py-1.5 rounded-po-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-body-sm text-body-sm transition-colors"
              >
                Reset Configuration
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => start(form, true)}
                className="px-space-md py-1.5 rounded-po-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">compare_arrows</span>
                Compare Strategies
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => start(form)}
                className="px-space-lg py-1.5 rounded-po-lg bg-po-primary hover:bg-po-inverse-surface text-po-on-primary font-headline-sm text-body-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[17px] text-po-tertiary-fixed">play_circle</span>
                <span>Execute Scenario Run</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={resultsRef} className="scroll-mt-20">
          {job ? (
            <RunResults job={job} presets={presets} busy={busy} onRerun={(params) => start(formFromParams(params))} />
          ) : (
            !loading && (
              <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm text-center">
                <p className="font-headline-sm text-body-md text-po-on-surface">No simulation output yet</p>
                <p className="font-body-sm text-body-sm text-po-on-surface-variant mt-1">Run a scenario and its results show up here.</p>
              </div>
            )
          )}
        </div>

        <div ref={compareRef} className="scroll-mt-20">
          <CompareMatrix job={compareJob} audiences={audiences} busy={busy} onCompare={() => start(form, true)} />
        </div>

        <RunHistory runs={runs} presets={presets} selectedId={selected} onSelect={selectRun} onLoad={(params) => setForm(formFromParams(params))} />
      </div>
    </div>
  );
}
