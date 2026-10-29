"use client";

import { useScreen } from "@/lib/useScreen";
import { mount } from "./behavior";

export default function SimulationLabScreen() {
  const ui = useScreen(mount);

  return (
    <>
      <div className="font-body-md text-po-on-surface antialiased selection:bg-po-secondary-fixed selection:text-po-secondary bg-po-background min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col w-full">
          {/* Simulation Toast Notification Component */}
          <div className="fixed top-16 right-6 z-50 transform transition-all duration-300 opacity-0 pointer-events-none -translate-y-4 max-w-md w-full bg-po-surface-container-lowest shadow-xl rounded-po-xl p-space-md flex items-start gap-3" id="sim-toast">
            <div className="w-8 h-8 rounded-po-lg bg-po-surface-container-high text-po-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">model_training</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-body-sm text-po-on-surface">Simulation Dispatched</span>
                <button className="text-po-on-surface-variant hover:text-po-on-surface text-[14px]" onClick={(e) => ui(e).dismissToast()}>
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              <p className="font-body-sm text-body-sm text-po-on-surface-variant mt-0.5">SIP-Sim engine running Scenario: Balanced Campaign (500 synthetic targets, 14 mock agents).</p>
              <div className="mt-2 w-full bg-po-surface-container-low h-1.5 rounded-po-full overflow-hidden">
                <div className="h-full bg-po-secondary transition-all duration-3000 w-full animate-pulse" id="toast-progress-bar" />
              </div>
            </div>
          </div>
          <div className="p-space-lg xl:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full">
            {/* 1. PAGE HEADER (Engineered Utilitarian Breadcrumb & Action Deck) */}
            <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="font-headline-lg text-headline-lg text-po-on-surface tracking-tight">Simulation Lab</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container-low text-po-secondary uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary animate-ping" />
                      SIP-Sim Mock Engine
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-label-mono-xs font-label-mono-xs bg-po-surface-container-high text-po-on-secondary-fixed-variant">v2.1-SYNTHETIC</span>
                  </div>
                  <p className="font-body-md text-body-md text-po-on-surface-variant mt-1">Test dialing pacing, conversational AI screening yield, and carrier failover thresholds in a zero-risk simulated sandbox.</p>
                </div>
                {/* Controls: Scenario select & Run CTA */}
                <div className="flex items-center gap-space-sm flex-wrap self-start lg:self-center">
                  <div className="relative">
                    <select className="h-9 pl-3 pr-8 rounded-po-lg bg-po-surface-container-low text-po-on-surface font-body-sm text-body-sm focus:outline-none appearance-none cursor-pointer py-0" id="scenario-dropdown" onChange={(e) => ui(e).onScenarioSelect(e.currentTarget.value)}>
                      <option value="balanced">Balanced Campaign (50% Ans)</option>
                      <option value="low">Low Answer Rate (20% Ans)</option>
                      <option value="high">High Answer Rate (70% Ans)</option>
                      <option value="dynamic">Dynamic Drift (20% → 70%)</option>
                      <option value="fault">Carrier SIP 503 Fault Injection</option>
                    </select>
                    {" "}
                    <span className="material-symbols-outlined absolute right-2 top-2 text-[18px] text-po-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                  <button className="h-9 px-space-md rounded-po-lg bg-po-surface-container-low hover:bg-po-surface-container-high text-po-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" onClick={(e) => ui(e).resetSimulationForm()}>
                    <span className="material-symbols-outlined text-[16px] text-po-on-surface-variant">restart_alt</span>
                    <span>Reset</span>
                  </button>
                  <button className="h-9 px-space-lg rounded-po-lg bg-po-primary hover:bg-po-inverse-surface text-po-on-primary font-headline-sm text-body-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.99]" id="run-sim-btn" onClick={(e) => ui(e).triggerSimulation()}>
                    <span className="material-symbols-outlined text-[18px] text-po-tertiary-fixed">play_circle</span>
                    <span>Run Simulation</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 px-space-md py-2 rounded-po-lg bg-po-surface-container-low text-po-on-surface-variant font-label-mono-xs text-label-mono-xs">
                <span className="material-symbols-outlined text-[15px] text-po-secondary">info</span>
                <span>Simulations use purely synthetic subscriber databases and deterministic SIP telephony mocks. No public carrier trunks or live PSTN minutes are consumed.</span>
              </div>
            </div>
            {/* 2. FOUR COMPACT TELEMETRY KPI TILES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {/* Tile 1 */}
              <div className="bg-po-surface-container-lowest p-space-md rounded-po-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Simulations Executed</span>
                  <span className="text-label-mono-xs font-label-mono-xs px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-on-surface-variant">+6 today</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display-kpi text-display-kpi text-po-on-surface font-semibold tracking-tight">24</span>
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">runs logged</span>
                </div>
                <div className="mt-3 pt-2 bg-po-surface-container-low p-2 rounded-po flex items-center justify-between font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                  <span>7-Day Pass SLA</span>
                  <span className="text-po-on-surface font-semibold">100% Deterministic</span>
                </div>
              </div>
              {/* Tile 2 */}
              <div className="bg-po-surface-container-lowest p-space-md rounded-po-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Calls Processed</span>
                  <span className="text-label-mono-xs font-label-mono-xs px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-secondary font-semibold">SIP Synthetic</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display-kpi text-display-kpi text-po-on-surface font-semibold tracking-tight">4,820</span>
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">total calls</span>
                </div>
                <div className="mt-3 pt-2 bg-po-surface-container-low p-2 rounded-po flex items-center justify-between font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                  <span>Concurrency Peak</span>
                  <span className="text-po-on-surface font-semibold">28 Channels</span>
                </div>
              </div>
              {/* Tile 3 */}
              <div className="bg-po-surface-container-lowest p-space-md rounded-po-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Successful Transfers</span>
                  <span className="text-label-mono-xs font-label-mono-xs px-1.5 py-0.5 rounded-po bg-po-surface-container-high text-po-on-secondary-fixed font-semibold">26.2% Yield</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display-kpi text-display-kpi text-po-on-surface font-semibold tracking-tight">1,264</span>
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">agent connected</span>
                </div>
                <div className="mt-3 pt-2 bg-po-surface-container-low p-2 rounded-po flex items-center justify-between font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                  <span>Transfer Queue SLA</span>
                  <span className="text-po-secondary font-semibold">97.8% within 45s</span>
                </div>
              </div>
              {/* Tile 4 */}
              <div className="bg-po-surface-container-lowest p-space-md rounded-po-xl shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Safety Gating Events</span>
                  <span className="text-label-mono-xs font-label-mono-xs px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-on-surface font-semibold">0 Dropped</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display-kpi text-display-kpi text-po-on-surface font-semibold tracking-tight">38</span>
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">pacing throttles</span>
                </div>
                <div className="mt-3 pt-2 bg-po-surface-container-low p-2 rounded-po flex items-center justify-between font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                  <span>Queue Overrun Interventions</span>
                  <span className="text-po-on-surface font-semibold">100% Protected</span>
                </div>
              </div>
            </div>
            {/* 3. QUICK SCENARIO PRESETS (Interactive horizontal strip) */}
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Quick Scenario Presets</span>
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Select to automatically populate simulation constraints</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm" id="preset-container">
                {/* Preset 1 */}
                <button className="preset-card text-left p-space-md rounded-po-xl bg-po-surface-container-lowest hover:bg-po-surface-container-low shadow-sm transition-all group flex flex-col justify-between gap-2" onClick={(e) => ui(e).applyPreset('low')}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-body-md text-po-on-surface font-semibold group-hover:text-po-secondary">Low Answer Rate</span>
                      <span className="font-label-mono-xs text-[10px] px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-on-surface">20% Ans</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-po-on-surface-variant mt-1 leading-snug">Conservative pacing stress test with high cold-call friction.</p>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary flex items-center gap-1 font-semibold">
                    Load preset
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </span>
                </button>
                {/* Preset 2 (Active Benchmark) */}
                <button className="preset-card text-left p-space-md rounded-po-xl bg-po-surface-container-lowest shadow-sm transition-all group flex flex-col justify-between gap-2 ring-2 ring-po-secondary bg-po-surface-container-low/30" onClick={(e) => ui(e).applyPreset('balanced')}>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline-sm text-body-md text-po-on-surface font-semibold text-po-secondary">Balanced Mode</span>
                        <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary" />
                      </div>
                      <span className="font-label-mono-xs text-[10px] px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-secondary font-semibold">50% Ans</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-po-on-surface-variant mt-1 leading-snug">Standard production baseline for B2B renewals and service checkups.</p>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary flex items-center gap-1 font-semibold">
                    Active Selection
                    <span className="material-symbols-outlined text-[13px]">check</span>
                  </span>
                </button>
                {/* Preset 3 */}
                <button className="preset-card text-left p-space-md rounded-po-xl bg-po-surface-container-lowest hover:bg-po-surface-container-low shadow-sm transition-all group flex flex-col justify-between gap-2" onClick={(e) => ui(e).applyPreset('high')}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-body-md text-po-on-surface font-semibold group-hover:text-po-secondary">High Answer Rate</span>
                      <span className="font-label-mono-xs text-[10px] px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-on-surface">70% Ans</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-po-on-surface-variant mt-1 leading-snug">High concurrency pickup simulating urgent customer notifications.</p>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary flex items-center gap-1 font-semibold">
                    Load preset
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </span>
                </button>
                {/* Preset 4 */}
                <button className="preset-card text-left p-space-md rounded-po-xl bg-po-surface-container-lowest hover:bg-po-surface-container-low shadow-sm transition-all group flex flex-col justify-between gap-2" onClick={(e) => ui(e).applyPreset('dynamic')}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-body-md text-po-on-surface font-semibold group-hover:text-po-secondary">Changing Dynamics</span>
                      <span className="font-label-mono-xs text-[10px] px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-on-surface">20% → 70%</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-po-on-surface-variant mt-1 leading-snug">Mid-run answer rate surge testing pacing governor adaptation.</p>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary flex items-center gap-1 font-semibold">
                    Load preset
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </span>
                </button>
                {/* Preset 5 */}
                <button className="preset-card text-left p-space-md rounded-po-xl bg-po-surface-container-lowest hover:bg-po-surface-container-low shadow-sm transition-all group flex flex-col justify-between gap-2" onClick={(e) => ui(e).applyPreset('fault')}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-body-md text-po-on-surface font-semibold text-po-error">Carrier Fault Test</span>
                      <span className="font-label-mono-xs text-[10px] px-1.5 py-0.5 rounded-po bg-po-error-container text-po-on-error-container font-semibold">SIP 503</span>
                    </div>
                    <p className="font-body-sm text-[11px] text-po-on-surface-variant mt-1 leading-snug">Fault injection: simulate carrier gateway timeouts and failover.</p>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary flex items-center gap-1 font-semibold">
                    Load preset
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </span>
                </button>
              </div>
            </div>
            {/* 4. CONFIGURE SIMULATION (Bento parameters configuration panel) */}
            <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col gap-space-lg">
              <div className="flex items-center justify-between pb-space-sm bg-po-surface-container-lowest">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-po-surface-container flex items-center justify-center text-po-on-surface">
                    <span className="material-symbols-outlined text-[17px]">tune</span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-po-on-surface">Configure Simulation Parameters</h2>
                    <p className="font-body-sm text-body-sm text-po-on-surface-variant">Set workload profiles, pacing algorithms, and telephony trunk injection policies</p>
                  </div>
                </div>
                <span className="font-label-mono-xs text-label-mono-xs px-2.5 py-1 rounded-po bg-po-surface-container text-po-on-surface-variant font-medium">Seed: #48921</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                {/* SUBSECTION A: Dialing Strategy (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">A. Dialing Mode</span>
                    <span className="font-label-mono-xs text-[11px] text-po-secondary">Algorithm Selection</span>
                  </div>
                  <div className="grid grid-cols-1 gap-space-sm">
                    {/* Option 1: Progressive */}
                    <div className="p-space-md rounded-po-xl bg-po-surface-container-low/50 hover:bg-po-surface-container-low cursor-pointer transition-all flex items-start justify-between gap-3" id="mode-progressive" onClick={(e) => ui(e).selectDialMode('progressive')}>
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-body-md text-po-on-surface">Progressive Dialing</span>
                        <span className="font-body-sm text-[12px] text-po-on-surface-variant mt-0.5">Strict 1:1 dial per idle agent. Zero risk of dropped transfers, lower overall agent talk volume.</span>
                        <div className="mt-2 flex items-center gap-2 font-label-mono-xs text-[10px] text-po-on-surface-variant">
                          <span className="px-1.5 py-0.5 rounded-po bg-po-surface-container">Concurrency Cap: 1.0x</span>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-po-full bg-po-surface-container flex items-center justify-center shrink-0" id="check-progressive">
                        <span className="material-symbols-outlined text-[13px] text-po-on-surface-variant">circle</span>
                      </div>
                    </div>
                    {/* Option 2: Predictive (Default Active) */}
                    <div className="p-space-md rounded-po-xl bg-po-surface-container-low cursor-pointer transition-all flex items-start justify-between gap-3 ring-2 ring-po-secondary" id="mode-predictive" onClick={(e) => ui(e).selectDialMode('predictive')}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-body-md text-po-on-surface font-semibold text-po-secondary">Predictive Dialing</span>
                          <span className="px-1.5 py-0.2 rounded-po bg-po-surface-container text-po-secondary font-label-mono-xs text-[9.5px]">RECOMMENDED</span>
                        </div>
                        <span className="font-body-sm text-[12px] text-po-on-surface-variant mt-0.5">Statistical pacing factoring in call answer likelihood and agent handle times.</span>
                        <div className="mt-2 flex items-center gap-2 font-label-mono-xs text-[10px] text-po-on-surface-variant">
                          <span className="px-1.5 py-0.5 rounded-po bg-po-surface-container text-po-secondary font-medium">Dynamic Pacing Capped at 2.4x</span>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-po-full bg-po-secondary text-po-on-secondary flex items-center justify-center shrink-0" id="check-predictive">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* SUBSECTION B: AI Voice Screening Parameters (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">B. AI Voice Screening</span>
                    <div className="flex items-center gap-2">
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Enable</span>
                      <button className="w-9 h-5 rounded-po-full bg-po-secondary flex items-center p-0.5 transition-colors" id="ai-screening-toggle" onClick={(e) => ui(e).toggleAiScreening()}>
                        <div className="w-4 h-4 rounded-po-full bg-po-surface-container-lowest translate-x-4 shadow-sm transition-transform" id="ai-toggle-ball" />
                      </button>
                    </div>
                  </div>
                  <div className="p-space-md rounded-po-xl bg-po-surface-container-low flex flex-col gap-space-md">
                    <div>
                      <label className="block font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider mb-1">Conversational Outcome Profile</label>
                      {" "}
                      <select className="w-full h-8 px-2.5 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm focus:outline-none py-0" id="ai-profile">
                        <option value="standard">Standard Qualified Screening (38% Willingness)</option>
                        <option value="strict">Strict Intent Verification (22% Willingness)</option>
                        <option value="lenient">High Acceptance / Warm Welcome (55% Willingness)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div>
                        <label className="block font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider mb-1">Max Agent Wait SLA</label>
                        <div className="relative">
                          <input className="w-full h-8 px-2.5 pr-8 rounded-po bg-po-surface-container-lowest text-po-on-surface font-label-mono-sm text-label-mono-sm focus:outline-none py-0" id="wait-sla" type="number" defaultValue="45" />
                          {" "}
                          <span className="absolute right-2 top-2 font-label-mono-xs text-[10px] text-po-on-surface-variant">sec</span>
                        </div>
                      </div>
                      <div>
                        <label className="block font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider mb-1">No-Agent Policy</label>
                        {" "}
                        <select className="w-full h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-[12px] focus:outline-none py-0" id="no-agent-policy">
                          <option value="callback">Deferred Callback</option>
                          <option value="graceful_end">Graceful Terminate</option>
                          <option value="voicemail">Leave System VM</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1 font-body-sm text-[11px] text-po-on-surface-variant leading-relaxed">
                      <span className="material-symbols-outlined text-[15px] text-po-secondary shrink-0">smart_toy</span>
                      <span>Synthetic speech intent classifier models natural pauses, voicemail triggers, and IVR dropouts.</span>
                    </div>
                  </div>
                </div>
                {/* SUBSECTION C: Workload & Workstation Pool (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">
                      C. Workload{" "}
                      &amp;
                      {" "}Carrier Faults
                    </span>
                    <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Resource Inputs</span>
                  </div>
                  <div className="p-space-md rounded-po-xl bg-po-surface-container-low flex flex-col gap-space-md">
                    {/* Agents Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body-sm text-body-sm text-po-on-surface font-medium">Available Agent Pool</span>
                        <span className="font-label-mono-sm text-label-mono-sm font-semibold text-po-secondary" id="agent-val">14 Agents</span>
                      </div>
                      <input className="w-full accent-po-secondary h-1.5 bg-po-surface-container rounded-po-lg appearance-none cursor-pointer" max="100" min="1" onInput={(e) => document.getElementById('agent-val').innerText = e.currentTarget.value + ' Agents'} type="range" defaultValue="14" />
                      <div className="flex justify-between font-label-mono-xs text-[10px] text-po-on-surface-variant mt-1">
                        <span>1 Agent</span>
                        <span>50</span>
                        <span>100 Agents</span>
                      </div>
                    </div>
                    {/* Call Target */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body-sm text-body-sm text-po-on-surface font-medium">Synthetic Call Targets</span>
                        <span className="font-label-mono-sm text-label-mono-sm font-semibold text-po-on-surface" id="target-val">500 Targets</span>
                      </div>
                      <input className="w-full accent-po-secondary h-1.5 bg-po-surface-container rounded-po-lg appearance-none cursor-pointer" max="5000" min="50" onInput={(e) => document.getElementById('target-val').innerText = e.currentTarget.value + ' Targets'} step="50" type="range" defaultValue="500" />
                    </div>
                    {/* Fault Injection Profile */}
                    <div>
                      <label className="block font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider mb-1">
                        SIP Trunk Provider{" "}
                        &amp;
                        {" "}Faults
                      </label>
                      <div className="grid grid-cols-2 gap-space-xs">
                        <select className="h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-[12px] focus:outline-none py-0" id="carrier-provider">
                          <option value="sip_a">Mock Provider A (24ms)</option>
                          <option value="sip_b">Mock Provider B (318ms)</option>
                        </select>
                        <select className="h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-[12px] focus:outline-none py-0" id="fault-injection">
                          <option value="none">Normal (0% Loss)</option>
                          <option value="latency">Increased Latency</option>
                          <option value="timeout">SIP 408 Timeout</option>
                          <option value="outage">SIP 503 Service Outage</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Action execution banner */}
              <div className="flex items-center justify-between pt-space-sm bg-po-surface-container-lowest flex-wrap gap-space-sm">
                <div className="flex items-center gap-space-sm font-body-sm text-body-sm text-po-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs text-label-mono-xs font-medium">
                    <span className="w-2 h-2 rounded-po-full bg-po-secondary" />
                    Profile: Predictive + AI Screening Active
                  </span>
                  <span className="hidden sm:inline text-po-on-surface-variant">•</span>
                  <span className="hidden sm:inline font-label-mono-xs text-label-mono-xs">Target Concurrency: 14 channels max • SLA limit: 45s</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="px-space-md py-1.5 rounded-po-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-body-sm text-body-sm transition-colors" onClick={(e) => ui(e).resetSimulationForm()}>Reset Configuration</button>
                  <button className="px-space-lg py-1.5 rounded-po-lg bg-po-primary hover:bg-po-inverse-surface text-po-on-primary font-headline-sm text-body-sm flex items-center gap-2 shadow-sm transition-all" onClick={(e) => ui(e).triggerSimulation()}>
                    <span className="material-symbols-outlined text-[17px] text-po-tertiary-fixed">play_circle</span>
                    <span>Execute Scenario Run</span>
                  </button>
                </div>
              </div>
            </div>
            {/* 5. LATEST SIMULATION RESULTS (Run #SIM-1049) */}
            <div className="flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-md text-headline-md text-po-on-surface">Simulation Output: Run #SIM-1049</span>
                    <span className="px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container-high text-po-secondary font-semibold">Completed in 18.2s</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-po-on-surface-variant">Synthetic SIP-Sim Engine (Illustrative Demo Run) • Timestamp: 14:32:10 UTC</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <button className="h-8 px-space-md rounded-po bg-po-surface-container-lowest hover:bg-po-surface-container-low text-po-on-surface font-body-sm text-body-sm shadow-sm flex items-center gap-1.5 transition-colors" onClick={(e) => ui(e).exportSyntheticLog()}>
                    <span className="material-symbols-outlined text-[15px] text-po-on-surface-variant">download</span>
                    <span>Export CSV</span>
                  </button>
                  <button className="h-8 px-space-md rounded-po bg-po-surface-container-lowest hover:bg-po-surface-container-low text-po-on-surface font-body-sm text-body-sm shadow-sm flex items-center gap-1.5 transition-colors" onClick={(e) => ui(e).triggerSimulation()}>
                    <span className="material-symbols-outlined text-[15px] text-po-on-surface-variant">replay</span>
                    <span>Re-run Test</span>
                  </button>
                </div>
              </div>
              {/* 8 High-Density KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-space-sm">
                {/* KPI 1 */}
                <div className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
                  <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Calls Initiated</span>
                  <div className="mt-1">
                    <span className="font-display-kpi text-[24px] text-po-on-surface font-semibold">500</span>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-on-surface-variant mt-1">100% Targets</span>
                </div>
                {/* KPI 2 */}
                <div className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
                  <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Answered</span>
                  <div className="mt-1">
                    <span className="font-display-kpi text-[24px] text-po-on-surface font-semibold">248</span>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary font-medium mt-1">49.6% Pick-up</span>
                </div>
                {/* KPI 3 */}
                <div className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
                  <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">AI Qualified</span>
                  <div className="mt-1">
                    <span className="font-display-kpi text-[24px] text-po-on-surface font-semibold">92</span>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-on-surface-variant mt-1">37.1% Willing</span>
                </div>
                {/* KPI 4 */}
                <div className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
                  <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Agent Connected</span>
                  <div className="mt-1">
                    <span className="font-display-kpi text-[24px] text-po-secondary font-semibold">90</span>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary font-semibold mt-1">97.8% Transfer SLA</span>
                </div>
                {/* KPI 5 */}
                <div className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
                  <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Failed / Term</span>
                  <div className="mt-1">
                    <span className="font-display-kpi text-[24px] text-po-error font-semibold">12</span>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-error mt-1">2.4% Congestion</span>
                </div>
                {/* KPI 6 */}
                <div className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
                  <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Deferred / Queue</span>
                  <div className="mt-1">
                    <span className="font-display-kpi text-[24px] text-po-on-surface font-semibold">240</span>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-on-surface-variant mt-1">Pacing Staged</span>
                </div>
                {/* KPI 7 */}
                <div className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
                  <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Agent Util</span>
                  <div className="mt-1">
                    <span className="font-display-kpi text-[24px] text-po-on-surface font-semibold">74.2%</span>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-secondary font-medium mt-1">10.4 of 14 Active</span>
                </div>
                {/* KPI 8 */}
                <div className="bg-po-surface-container-lowest p-space-sm rounded-po-xl shadow-sm flex flex-col justify-between">
                  <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Safety Blocks</span>
                  <div className="mt-1">
                    <span className="font-display-kpi text-[24px] text-po-on-surface font-semibold">4</span>
                  </div>
                  <span className="font-label-mono-xs text-[10px] text-po-on-surface-variant mt-1">Gated Over-dial</span>
                </div>
              </div>
              {/* Two Side-by-Side Visual Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
                {/* CHART A: Call Outcome Distribution */}
                <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <div>
                        <h3 className="font-headline-sm text-body-md text-po-on-surface">Call Outcome Distribution</h3>
                        <span className="font-body-sm text-body-sm text-po-on-surface-variant">Breakdown of 500 synthetic call attempts</span>
                      </div>
                      <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded-po bg-po-surface-container text-po-on-surface">500 Total</span>
                    </div>
                    {/* Proportional horizontal stacked bar */}
                    <div className="w-full h-8 rounded-po-lg overflow-hidden flex bg-po-surface-container my-space-md">
                      <div className="h-full bg-po-secondary hover:opacity-90 transition-opacity" style={{ width: "18%" }} title="Agent Connected: 90 (18%)" />
                      <div className="h-full bg-po-surface-container-high hover:opacity-90 transition-opacity" style={{ width: "31.2%" }} title="Declined / Unwilling: 156 (31.2%)" />
                      <div className="h-full bg-po-error-container hover:opacity-90 transition-opacity" style={{ width: "2.4%" }} title="Carrier Failed: 12 (2.4%)" />
                      <div className="h-full bg-po-surface-dim hover:opacity-90 transition-opacity" style={{ width: "48.4%" }} title="Deferred / Backlog: 242 (48.4%)" />
                    </div>
                    {/* Legend Items with precise values */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm pt-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-po-secondary shrink-0" />
                        <div className="flex flex-col font-label-mono-xs text-label-mono-xs">
                          <span className="text-po-on-surface-variant font-medium">Connected</span>
                          <span className="text-po-on-surface font-semibold">90 (18.0%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-po-surface-container-high shrink-0" />
                        <div className="flex flex-col font-label-mono-xs text-label-mono-xs">
                          <span className="text-po-on-surface-variant font-medium">Unwilling / Bot End</span>
                          <span className="text-po-on-surface font-semibold">156 (31.2%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-po-error-container shrink-0" />
                        <div className="flex flex-col font-label-mono-xs text-label-mono-xs">
                          <span className="text-po-on-surface-variant font-medium">SIP Dropped</span>
                          <span className="text-po-error font-semibold">12 (2.4%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-po-surface-dim shrink-0" />
                        <div className="flex flex-col font-label-mono-xs text-label-mono-xs">
                          <span className="text-po-on-surface-variant font-medium">Deferred / Pending</span>
                          <span className="text-po-on-surface font-semibold">242 (48.4%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-space-md p-space-sm rounded-po bg-po-surface-container-low flex items-center justify-between font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                    <span>Conversational Screening Filter Efficiency:</span>
                    <span className="font-semibold text-po-secondary">62.9% agent workload spared</span>
                  </div>
                </div>
                {/* CHART B: Agent Utilization & Pacing Timeline */}
                <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <div>
                        <h3 className="font-headline-sm text-body-md text-po-on-surface">
                          Agent Utilization{" "}
                          &amp;
                          {" "}Channel Concurrency
                        </h3>
                        <span className="font-body-sm text-body-sm text-po-on-surface-variant">Live active channels vs. 14-agent workforce safety ceiling</span>
                      </div>
                      <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded-po bg-po-surface-container text-po-secondary font-medium">Peak: 12.8 Ch</span>
                    </div>
                    {/* Inline SVG Area Chart */}
                    <div className="w-full h-44 my-space-sm relative">
                      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 160">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#4e45d5" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4e45d5" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Grid Lines */}
                        <line stroke="#dae2fd" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="500" y1="20" y2="20" />
                        <line stroke="#dae2fd" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="500" y1="60" y2="60" />
                        <line stroke="#dae2fd" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="500" y1="100" y2="100" />
                        <line stroke="#dae2fd" strokeWidth="1" x1="0" x2="500" y1="140" y2="140" />
                        {/* 14-Agent Capacity Line (Red dashed ceiling at y=28) */}
                        <line stroke="#ba1a1a" strokeDasharray="6 4" strokeWidth="1.5" x1="0" x2="500" y1="28" y2="28" />
                        <text className="font-label-mono-xs text-[9px] fill-po-error" x="4" y="24">Safety Limit: 14 Concurrent Agents</text>
                        {/* Concurrency Area & Line */}
                        <path d="M 0 140 Q 40 120 70 85 T 140 46 T 210 38 T 280 42 T 350 32 T 420 48 T 500 70 L 500 140 L 0 140 Z" fill="url(#chartGradient)" />
                        <path d="M 0 140 Q 40 120 70 85 T 140 46 T 210 38 T 280 42 T 350 32 T 420 48 T 500 70" fill="none" stroke="#4e45d5" strokeLinecap="round" strokeWidth="2.5" />
                        {/* Peak marker */}
                        <circle cx="350" cy="32" fill="#ffffff" r="4" stroke="#4e45d5" strokeWidth="2" />
                      </svg>
                    </div>
                    {/* Timeline axis points */}
                    <div className="flex items-center justify-between font-label-mono-xs text-[10px] text-po-on-surface-variant px-1">
                      <span>0s (Dispatch)</span>
                      <span>3s (Screening Peak)</span>
                      <span>8s (Transfer Wave)</span>
                      <span>12s (Stable Wrap)</span>
                      <span>18s (Terminated)</span>
                    </div>
                  </div>
                  <div className="mt-space-md p-space-sm rounded-po bg-po-surface-container-low flex items-center justify-between font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                    <span>Concurrency Cushion at Peak:</span>
                    <span className="font-semibold text-po-secondary">1.2 agents headroom preserved</span>
                  </div>
                </div>
              </div>
            </div>
            {/* 6. CORRESPONDING EXECUTIVE DASHBOARD INSIGHT PANELS (Exact Visual Match to Screen 37) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
              {/* Panel 1: Safety & System Health */}
              <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-body-lg text-po-on-surface font-semibold">
                      Safety{" "}
                      &amp;
                      {" "}System Health
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container-low text-po-secondary uppercase tracking-wider">Simulation Active</span>
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    {/* Row 1 */}
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low/60 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-body-sm text-po-on-surface font-semibold">Safety Controller</span>
                        <span className="font-body-sm text-body-sm text-po-on-surface-variant">Rate limiter capped at 12 calls/min</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-po text-label-ui font-label-ui bg-po-surface-container-high text-po-on-secondary-fixed">Operational</span>
                    </div>
                    {/* Row 2 */}
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low/60 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-body-sm text-po-on-surface font-semibold">Active Telephony Carrier</span>
                        <span className="font-body-sm text-body-sm text-po-on-surface-variant">Mock SIP Gateway (45ms mock ping)</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-po text-label-ui font-label-ui bg-po-surface-container text-po-on-surface">Monitoring</span>
                    </div>
                    {/* Row 3 */}
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low/60 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-body-sm text-po-on-surface font-semibold">Screening Backlog</span>
                        <span className="font-body-sm text-body-sm text-po-on-surface-variant">0 queued tasks waiting dispatch</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-po text-label-ui font-label-ui bg-po-surface-container-high text-po-on-secondary-fixed">Operational</span>
                    </div>
                    {/* Row 4 */}
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low/60 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-body-sm text-po-on-surface font-semibold">Pending Transfers</span>
                        <span className="font-body-sm text-body-sm text-po-on-surface-variant">2 transfers awaiting agent pickup</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-po text-label-ui font-label-ui bg-po-surface-container text-po-on-surface">Restricted</span>
                    </div>
                    {/* Row 5 */}
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low/60 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-body-sm text-po-on-surface font-semibold">Recent Recovery Actions</span>
                        <span className="font-body-sm text-body-sm text-po-on-surface-variant">1 timeout auto-reconciled cleanly</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-po text-label-ui font-label-ui bg-po-surface-container-high text-po-on-secondary-fixed">Operational</span>
                    </div>
                  </div>
                  {/* Alert callout inside panel */}
                  <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[17px] text-po-secondary shrink-0 mt-0.5">shield</span>
                    <span className="font-body-sm text-body-sm text-po-on-surface-variant">New screening calls are restricted automatically when the safety controller detects insufficient available agents.</span>
                  </div>
                </div>
                <div className="pt-space-md flex justify-end">
                  <a className="font-headline-sm text-body-sm text-po-secondary hover:text-po-primary flex items-center gap-1" href="#">
                    <span>View Safety Decisions</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </div>
              </div>
              {/* Panel 2: AI Screening Insight */}
              <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="font-headline-sm text-body-lg text-po-on-surface font-semibold">AI Screening Insight</h3>
                      <span className="font-body-sm text-body-sm text-po-on-surface-variant">
                        Algorithmic efficiency{" "}
                        &amp;
                        {" "}yield analysis
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container-high text-po-on-secondary-fixed-variant font-medium">Model: DialX-Voice-v2.1 (Simulated)</span>
                  </div>
                  {/* Highlight Box: Conversion & Transfer Integrity */}
                  <div className="p-space-md rounded-po-xl bg-po-surface-container-low flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-po-secondary font-headline-sm text-body-md">
                      <span className="material-symbols-outlined text-[18px]">query_stats</span>
                      <span className="font-semibold">
                        Conversion{" "}
                        &amp;
                        {" "}Transfer Integrity
                      </span>
                    </div>
                    <p className="font-headline-sm text-body-sm text-po-on-surface font-semibold">194 of 196 willing respondents reached a confirmed agent connection in this illustrative run.</p>
                    <p className="font-body-sm text-[12px] text-po-on-surface-variant leading-relaxed">Two willing respondents were not connected within the configured waiting period (max queue SLA: 45s), automatically invoking the deferred callback workflow.</p>
                  </div>
                  {/* Operational Context block */}
                  <div className="p-space-md rounded-po-xl bg-po-surface-container-low/40 flex flex-col gap-1">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant">Operational Context</span>
                    <p className="font-body-sm text-[12px] text-po-on-surface-variant leading-relaxed">Screening drastically reduces agent fatigue spent on unanswered dials, answering machines, and unwilling contacts. However, total net yield depends tightly on answer rates, conversational screening length, transfer delays, and instantaneous agent buffer capacity.</p>
                  </div>
                  {/* 3 KPI Pills */}
                  <div className="grid grid-cols-3 gap-space-sm text-center">
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex flex-col">
                      <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Human Time Saved</span>
                      <span className="font-headline-sm text-body-lg text-po-secondary font-bold mt-1">~18.4 hrs</span>
                    </div>
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex flex-col">
                      <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Avg AI Screening</span>
                      <span className="font-headline-sm text-body-lg text-po-on-surface font-bold mt-1">19.2s</span>
                    </div>
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low flex flex-col">
                      <span className="font-label-ui text-[10px] uppercase tracking-wider text-po-on-surface-variant">Transfer Hold Time</span>
                      <span className="font-headline-sm text-body-lg text-po-secondary font-bold mt-1">3.4s</span>
                    </div>
                  </div>
                </div>
                <div className="pt-space-md flex items-center justify-between">
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Generated by Orchestrator Engine</span>
                  <a className="font-headline-sm text-body-sm text-po-secondary hover:text-po-primary flex items-center gap-1" href="#">
                    <span>Tweak Pacing Thresholds</span>
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                  </a>
                </div>
              </div>
            </div>
            {/* 7. COMPARE DIALING STRATEGIES BENCHMARK MATRIX */}
            <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-po-on-surface">Comparative Dialing Strategy Matrix</h3>
                  <span className="font-body-sm text-body-sm text-po-on-surface-variant">Simulated outcomes based on 500 contacts, 14 mock agents, and 50% target answer rates</span>
                </div>
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Comparative Model Engine</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-po">
                        Strategy{" "}
                        &amp;
                        {" "}Routing Profile
                      </th>
                      <th className="py-2.5 px-3">Calls Initiated</th>
                      <th className="py-2.5 px-3">Connections</th>
                      <th className="py-2.5 px-3">Agent Util</th>
                      <th className="py-2.5 px-3">Abandoned Rate</th>
                      <th className="py-2.5 px-3">Safety Blocks</th>
                      <th className="py-2.5 px-3 rounded-r-po">Est. Time Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-po-surface-container-low">
                    {/* Row 1: Progressive */}
                    <tr className="hover:bg-po-surface-container-low/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-po-full bg-po-on-surface-variant" />
                          <span className="font-semibold text-po-on-surface">Progressive Only</span>
                          <span className="font-label-mono-xs text-[10px] text-po-on-surface-variant">(1:1 Dialing)</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-label-mono-sm">180 calls</td>
                      <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-on-surface">88 reached</td>
                      <td className="py-3 px-3 font-label-mono-sm">48.3%</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-secondary font-medium">0.0% (Zero Drop)</td>
                      <td className="py-3 px-3 font-label-mono-sm">0 blocks</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-on-surface-variant">0.0 hrs (Baseline)</td>
                    </tr>
                    {/* Row 2: Predictive Only */}
                    <tr className="hover:bg-po-surface-container-low/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-po-full bg-po-on-surface-variant" />
                          <span className="font-semibold text-po-on-surface">Predictive Only</span>
                          <span className="font-label-mono-xs text-[10px] text-po-on-surface-variant">(Stat Pacing)</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-label-mono-sm">410 calls</td>
                      <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-on-surface">201 reached</td>
                      <td className="py-3 px-3 font-label-mono-sm">89.4%</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-error font-medium">3.1% (Over-dial drop)</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-on-surface">19 throttles</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-on-surface-variant">4.2 hrs saved</td>
                    </tr>
                    {/* Row 3: Progressive + AI Screening */}
                    <tr className="hover:bg-po-surface-container-low/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-po-full bg-po-secondary" />
                          <span className="font-semibold text-po-on-surface">Progressive + AI Screening</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-label-mono-sm">260 calls</td>
                      <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-on-surface">64 warm transfers</td>
                      <td className="py-3 px-3 font-label-mono-sm">54.0%</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-secondary font-medium">0.2%</td>
                      <td className="py-3 px-3 font-label-mono-sm">1 throttle</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-secondary font-semibold">11.8 hrs saved</td>
                    </tr>
                    {/* Row 4: Predictive + AI Screening (Highlighted Active Champion) */}
                    <tr className="bg-po-surface-container-low/70 hover:bg-po-surface-container-low transition-colors font-medium">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-po-full bg-po-secondary animate-pulse" />
                          <span className="font-bold text-po-secondary">Predictive + AI Screening</span>
                          <span className="px-1.5 py-0.2 rounded-po bg-po-surface-container-high text-po-secondary font-label-mono-xs text-[9.5px]">CHAMPION</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-label-mono-sm font-semibold">500 calls</td>
                      <td className="py-3 px-3 font-label-mono-sm font-bold text-po-secondary">90 warm transfers</td>
                      <td className="py-3 px-3 font-label-mono-sm font-bold text-po-on-surface">74.2%</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-secondary font-semibold">
                        0.4% (
                        &lt;
                        1% SLA)
                      </td>
                      <td className="py-3 px-3 font-label-mono-sm">4 throttles</td>
                      <td className="py-3 px-3 font-label-mono-sm text-po-secondary font-bold">18.4 hrs saved</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-space-sm rounded-po bg-po-surface-container-low flex items-center gap-2 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                <span className="material-symbols-outlined text-[15px] text-po-on-surface-variant shrink-0">info</span>
                <span>Results depend on configured answer rate, screening duration, transfer latency, agent headroom, and independent safety thresholds.</span>
              </div>
            </div>
            {/* 8. RECENT SIMULATION AUDIT RUNS (Table matching Executive Audit Logs) */}
            <div className="bg-po-surface-container-lowest p-space-lg rounded-po-xl shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-po-on-surface">Recent Simulation Run History</h3>
                  <span className="font-body-sm text-body-sm text-po-on-surface-variant">Historical audit trail of synthetic scenario dispatches</span>
                </div>
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Showing 5 of 24 records</span>
                  <a className="font-headline-sm text-body-sm text-po-secondary hover:text-po-primary flex items-center gap-1" href="#">
                    <span>View Full Archive</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 rounded-l-po">Run ID</th>
                      <th className="py-2.5 px-3">Scenario Preset</th>
                      <th className="py-2.5 px-3">Dialing Mode</th>
                      <th className="py-2.5 px-3">AI Screening</th>
                      <th className="py-2.5 px-3">Carrier Trunk</th>
                      <th className="py-2.5 px-3">Safety Status</th>
                      <th className="py-2.5 px-3">Started At</th>
                      <th className="py-2.5 px-3 rounded-r-po text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-po-surface-container-low">
                    {/* Run #SIM-1049 */}
                    <tr className="hover:bg-po-surface-container-low/40 transition-colors">
                      <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-secondary">#SIM-1049</td>
                      <td className="py-3 px-3 font-medium text-po-on-surface">Balanced Campaign (50%)</td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">Predictive (2.4x)</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container-high text-po-secondary">Active</span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs">Mock SIP Gateway A</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container-high text-po-on-secondary-fixed">
                          <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary" />
                          Completed Clean
                        </span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">14:32:10 UTC</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Results</button>
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Clone</button>
                        </div>
                      </td>
                    </tr>
                    {/* Run #SIM-1048 */}
                    <tr className="hover:bg-po-surface-container-low/40 transition-colors">
                      <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-on-surface">#SIM-1048</td>
                      <td className="py-3 px-3 font-medium text-po-on-surface">Carrier Fault Injection</td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">Predictive (2.0x)</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container text-po-on-surface-variant">Active</span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-error font-medium">SIP-Sim v2 (503 Fault)</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container text-po-on-surface">
                          <span className="w-1.5 h-1.5 rounded-po-full bg-po-on-surface" />
                          Gated by Safety
                        </span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">14:15:22 UTC</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Results</button>
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Clone</button>
                        </div>
                      </td>
                    </tr>
                    {/* Run #SIM-1047 */}
                    <tr className="hover:bg-po-surface-container-low/40 transition-colors">
                      <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-on-surface">#SIM-1047</td>
                      <td className="py-3 px-3 font-medium text-po-on-surface">High Answer Rate Stress (70%)</td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">Progressive</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container text-po-on-surface-variant">Disabled</span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs">Mock SIP Gateway A</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container-high text-po-on-secondary-fixed">
                          <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary" />
                          Completed Clean
                        </span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">13:58:40 UTC</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Results</button>
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Clone</button>
                        </div>
                      </td>
                    </tr>
                    {/* Run #SIM-1046 */}
                    <tr className="hover:bg-po-surface-container-low/40 transition-colors">
                      <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-on-surface">#SIM-1046</td>
                      <td className="py-3 px-3 font-medium text-po-on-surface">Dynamic Shift (20% to 70%)</td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">Predictive (Dynamic)</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container-high text-po-secondary">Active</span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs">Mock SIP Gateway B</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container-high text-po-on-secondary-fixed">
                          <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary" />
                          Completed Clean
                        </span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">13:20:05 UTC</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Results</button>
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Clone</button>
                        </div>
                      </td>
                    </tr>
                    {/* Run #SIM-1045 */}
                    <tr className="hover:bg-po-surface-container-low/40 transition-colors">
                      <td className="py-3 px-3 font-label-mono-sm font-semibold text-po-on-surface">#SIM-1045</td>
                      <td className="py-3 px-3 font-medium text-po-on-surface">Low Answer Rate Stress (20%)</td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">Predictive (2.4x)</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-po text-label-mono-xs font-label-mono-xs bg-po-surface-container-high text-po-secondary">Active</span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs">Mock SIP Gateway A</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-po-full text-label-ui font-label-ui bg-po-surface-container-high text-po-on-secondary-fixed">
                          <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary" />
                          Completed Clean
                        </span>
                      </td>
                      <td className="py-3 px-3 font-label-mono-xs text-po-on-surface-variant">12:44:11 UTC</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Results</button>
                          <button className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-on-surface font-label-mono-xs text-label-mono-xs">Clone</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-space-xs font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-po-secondary">verified_user</span>
                  <span>Privacy-Compliant Sandbox Mode: No live subscriber MSISDNs or customer recording audio are processed.</span>
                </div>
                <span>Storage retention: 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
