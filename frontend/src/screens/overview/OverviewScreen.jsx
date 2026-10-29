"use client";

import Link from "next/link";
import { useScreen } from "@/lib/useScreen";
import { mount } from "./behavior";

export default function OverviewScreen() {
  const ui = useScreen(mount);

  return (
    <>
      <div className="font-body-md text-on-surface antialiased selection:bg-indigo-100 selection:text-indigo-900 bg-[#f8fafc] min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col w-full">
          {/* Simulation Trigger Notification Banner */}
          <div className="fixed top-16 right-6 z-50 transform translate-y-[-20px] opacity-0 pointer-events-none transition-all duration-300 ease-out flex items-center gap-space-sm bg-slate-900 text-white px-space-md py-space-sm rounded-xl shadow-2xl border border-indigo-500/30" id="sim-toast">
            <span className="material-symbols-outlined text-[20px] text-cyan-400 animate-spin">refresh</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-body-sm font-semibold text-white">Simulation Run Initialized</span>
              <span className="font-label-mono-xs text-label-mono-xs text-slate-300">Re-scoring 1,435 synthetic SIP vectors...</span>
            </div>
            <button className="ml-space-md text-slate-400 hover:text-white transition-colors" onClick={(e) => ui(e).dismissToast()}>
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          {/* Operational Header Area */}
          <div className="px-space-xl py-6 flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-white border-b border-slate-200/70 shadow-xs">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline-lg text-headline-lg font-bold text-slate-900 tracking-tight">Good afternoon, Manish</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-label-mono-xs bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-semibold shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                  SIMULATION ACTIVE
                </span>
              </div>
              <p className="font-body-md text-body-md text-slate-500 max-w-2xl">Monitor screening performance, agent availability, and call orchestration from one place.</p>
            </div>
            {/* Action Toolbar */}
            <div className="flex items-center gap-space-sm self-start md:self-auto shrink-0">
              <Link className="inline-flex items-center gap-space-xs px-4 h-9 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 font-body-sm text-body-sm font-medium transition-all shadow-xs border border-slate-200" data-path="live-operations" href="/live-operations">
                <span className="material-symbols-outlined text-[17px] text-cyan-600">sensors</span>
                <span>View Live Operations</span>
              </Link>
              <button className="inline-flex items-center gap-space-xs px-4 h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-body-sm text-body-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95 ring-1 ring-indigo-500/50" id="run-sim-btn" onClick={(e) => ui(e).triggerSimulation()}>
                <span className="material-symbols-outlined text-[17px] text-cyan-200">play_circle</span>
                <span>Run Simulation</span>
              </button>
            </div>
          </div>
          {/* Main Executive Dashboard Space */}
          <div className="p-space-xl flex flex-col gap-space-xl">
            {/* KPI Metric Cards: Richer Vibrant Accents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
              {/* Card 1: Screening Calls (Indigo Theme) */}
              <div className="relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Screening Calls</span>
                    <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight">1,435</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">call_made</span>
                  </div>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
                  <span>AI screening attempts</span>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200/60">Demo Data</span>
                </div>
              </div>
              {/* Card 2: Willing to Talk (Cyan Theme) */}
              <div className="relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:border-cyan-300 hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Willing to Talk</span>
                    <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight">196</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  </div>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
                  <span>People eligible for transfer</span>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-medium border border-cyan-200/60">13.6% Yield</span>
                </div>
              </div>
              {/* Card 3: Connected to Agents (Emerald Theme) */}
              <div className="relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Connected to Agents</span>
                    <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight">194</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">support_agent</span>
                  </div>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
                  <span>Confirmed transfers</span>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">99.0% Success</span>
                </div>
              </div>
              {/* Card 4: Agent Utilization (Amber Theme) */}
              <div className="relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Agent Utilization</span>
                    <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight">67.0%</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">speed</span>
                  </div>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
                  <span className="truncate">Selected campaign / 24h</span>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">Optimal Range</span>
                </div>
              </div>
            </div>
            {/* Primary Visualization: AI Screening Funnel */}
            <div className="bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col gap-space-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs">
                <div>
                  <div className="flex items-center gap-space-sm">
                    <h2 className="font-headline-md text-headline-md font-bold text-slate-900">AI Screening Funnel</h2>
                    <span className="inline-flex items-center gap-1 font-label-mono-xs text-label-mono-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 text-indigo-700 font-bold shadow-xs">E2E Yield 13.5%</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-slate-500 mt-1">See how screening attempts progress toward confirmed human-agent conversations.</p>
                </div>
                <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-label-mono-xs text-label-mono-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-200" />
                  <span className="font-semibold text-slate-700">Simulation Session #8410-Q</span>
                </div>
              </div>
              {/* Funnel Progression Visualizer with Vibrant Gradients */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md relative">
                {/* Stage 1 */}
                <div className="relative bg-slate-50/80 hover:bg-slate-50 p-space-md rounded-xl transition-all duration-200 border border-slate-200/70 hover:border-slate-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Stage 01</span>
                    <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-white text-slate-700 font-semibold border border-slate-200 shadow-2xs">100% Total</span>
                  </div>
                  <div className="my-space-md">
                    <div className="font-headline-lg text-headline-lg text-slate-900 font-bold">1,435</div>
                    <div className="font-body-sm text-body-sm text-slate-500 font-medium mt-0.5">Screening Attempts</div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-900 h-full rounded-full w-full" />
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-slate-500 font-label-mono-xs text-label-mono-xs">
                    <span className="font-medium">SIP Outbound</span>
                    <span className="text-slate-700 font-semibold">Batch Active</span>
                  </div>
                </div>
                {/* Stage 2 */}
                <div className="relative bg-slate-50/80 hover:bg-slate-50 p-space-md rounded-xl transition-all duration-200 border border-slate-200/70 hover:border-indigo-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Stage 02</span>
                    <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs">37.8% Answered</span>
                  </div>
                  <div className="my-space-md">
                    <div className="font-headline-lg text-headline-lg text-slate-900 font-bold">542</div>
                    <div className="font-body-sm text-body-sm text-slate-500 font-medium mt-0.5">Answered Calls</div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full shadow-sm" style={{ width: "37.8%" }} />
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-slate-500 font-label-mono-xs text-label-mono-xs">
                    <span className="text-indigo-600 font-medium">Voice Response OK</span>
                    <span>893 Unanswered</span>
                  </div>
                </div>
                {/* Stage 3 */}
                <div className="relative bg-slate-50/80 hover:bg-slate-50 p-space-md rounded-xl transition-all duration-200 border border-slate-200/70 hover:border-cyan-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Stage 03</span>
                    <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold border border-cyan-200 shadow-2xs">36.2% Qualified</span>
                  </div>
                  <div className="my-space-md">
                    <div className="font-headline-lg text-headline-lg text-slate-900 font-bold">196</div>
                    <div className="font-body-sm text-body-sm text-slate-500 font-medium mt-0.5">Willing to Talk</div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-teal-500 h-full rounded-full shadow-sm" style={{ width: "36.2%" }} />
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-slate-500 font-label-mono-xs text-label-mono-xs">
                    <span className="text-cyan-700 font-medium">AI Intent Match</span>
                    <span>346 Declined</span>
                  </div>
                </div>
                {/* Stage 4 */}
                <div className="relative bg-slate-50/80 hover:bg-slate-50 p-space-md rounded-xl transition-all duration-200 border border-slate-200/70 hover:border-emerald-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Stage 04</span>
                    <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-2xs">99.0% Transfer</span>
                  </div>
                  <div className="my-space-md">
                    <div className="font-headline-lg text-headline-lg text-slate-900 font-bold">194</div>
                    <div className="font-body-sm text-body-sm text-slate-500 font-medium mt-0.5">Transfer Confirmed</div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full shadow-sm" style={{ width: "99.0%" }} />
                  </div>
                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-slate-500 font-label-mono-xs text-label-mono-xs">
                    <span className="text-emerald-700 font-medium">Live Agent Handshake</span>
                    <span className="text-rose-600 font-bold">2 Dropouts</span>
                  </div>
                </div>
              </div>
              {/* Critical Funnel Callout Strip */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-sm p-space-md rounded-xl bg-gradient-to-r from-rose-50/60 via-slate-50 to-slate-50 border border-rose-100">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[19px] text-rose-500 shrink-0">info</span>
                  <p className="font-body-sm text-body-sm text-slate-700">
                    <strong className="font-bold text-slate-900">Transfer Integrity Gap:</strong>
                    {" "}2 willing respondents were not connected due to waiting period timeout or agent availability gap.
                  </p>
                </div>
                <p className="font-label-mono-xs text-label-mono-xs text-slate-500">Screening outcomes are simulated. Transfer completion depends on agent availability and provider confirmation.</p>
              </div>
            </div>
            {/* Middle Two-Column Grid: Call Activity & Agent Availability */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
              {/* Left Column (8 cols): Call Activity Chart */}
              <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-space-md">
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">Call Activity</h2>
                        <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">Demo Data</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-slate-500 mt-1">Screening attempts and confirmed agent connections over time.</p>
                    </div>
                    {/* Chart Legends with enriched color dots */}
                    <div className="flex items-center gap-space-md text-slate-600 font-label-mono-xs text-label-mono-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-indigo-600 shadow-xs" />
                        <span className="font-semibold text-slate-700">Attempts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-md bg-cyan-500 shadow-xs" />
                        <span className="font-semibold text-slate-700">Connections</span>
                      </div>
                    </div>
                  </div>
                  {/* SVG Dual-Series Operational Activity Visualization */}
                  <div className="w-full h-64 mt-space-md flex flex-col justify-end relative">
                    <svg className="w-full h-52 overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 200">
                      <defs>
                        <linearGradient id="attemptsGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.01" />
                        </linearGradient>
                        <linearGradient id="connGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="700" y1="40" y2="40" />
                      <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="700" y1="90" y2="90" />
                      <line stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" x1="0" x2="700" y1="140" y2="140" />
                      <line stroke="#e2e8f0" strokeWidth="1" x1="0" x2="700" y1="190" y2="190" />
                      {/* Screening Attempts Area & Line */}
                      <polygon fill="url(#attemptsGrad)" points="
                      20,170 80,140 140,110 200,60 260,50 320,80 380,45 440,70 500,95 560,115 620,145 680,175 680,190 20,190
                    " />
                      <polyline fill="none" points="
                      20,170 80,140 140,110 200,60 260,50 320,80 380,45 440,70 500,95 560,115 620,145 680,175
                    " stroke="#4338ca" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                      {/* Confirmed Connections Area & Line */}
                      <polygon fill="url(#connGrad)" points="
                      20,188 80,182 140,174 200,148 260,142 320,158 380,138 440,152 500,165 560,172 620,182 680,188 680,190 20,190
                    " />
                      <polyline fill="none" points="
                      20,188 80,182 140,174 200,148 260,142 320,158 380,138 440,152 500,165 560,172 620,182 680,188
                    " stroke="#0891b2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                      {/* Interactive Highlight Nodes */}
                      <circle className="cursor-pointer" cx="260" cy="50" fill="#4338ca" r="5" stroke="#ffffff" strokeWidth="2" />
                      <circle className="cursor-pointer" cx="260" cy="142" fill="#0891b2" r="5" stroke="#ffffff" strokeWidth="2" />
                      <circle className="cursor-pointer" cx="380" cy="45" fill="#4338ca" r="5" stroke="#ffffff" strokeWidth="2" />
                      <circle className="cursor-pointer" cx="380" cy="138" fill="#0891b2" r="5" stroke="#ffffff" strokeWidth="2" />
                    </svg>
                    {/* Hourly Interval Labels */}
                    <div className="w-full flex justify-between pt-2 text-slate-400 font-label-mono-xs text-label-mono-xs">
                      <span>08:00</span>
                      <span>09:00</span>
                      <span>10:00</span>
                      <span>11:00</span>
                      <span>12:00</span>
                      <span>13:00</span>
                      <span>14:00</span>
                      <span>15:00</span>
                      <span>16:00</span>
                      <span>17:00</span>
                      <span>18:00</span>
                    </div>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm flex flex-wrap items-center justify-between gap-space-sm font-label-mono-xs text-label-mono-xs text-slate-500 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">PEAK LOAD: 14:00 (168 ATTEMPTS / 28 CONNECTED)</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-700">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    AVG TRANSFER LATENCY: 1.4s
                  </span>
                </div>
              </div>
              {/* Right Column (4 cols): Agent Availability Panel */}
              <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">Agent Availability</h2>
                      <p className="font-body-sm text-body-sm text-slate-500 mt-0.5">36 Total Roster Capacity</p>
                    </div>
                    <span className="font-label-mono-xs text-label-mono-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Pool A{" "}
                      &amp;
                      {" "}B
                    </span>
                  </div>
                  {/* Multi-segmented Status Bar with Crisp Enterprise Tones */}
                  <div className="flex flex-col gap-space-xs mt-space-xs">
                    <div className="h-4 w-full rounded-md overflow-hidden flex bg-slate-100 ring-1 ring-slate-200/70">
                      {/* Available (14/36 = 38.8%) */}
                      <div className="bg-teal-500 hover:opacity-90 transition-opacity" style={{ width: "38.8%" }} title="Available: 14" />
                      {/* Connected (12/36 = 33.3%) */}
                      <div className="bg-emerald-500 hover:opacity-90 transition-opacity" style={{ width: "33.3%" }} title="Connected: 12" />
                      {/* Reserved (3/36 = 8.3%) */}
                      <div className="bg-amber-500 hover:opacity-90 transition-opacity" style={{ width: "8.3%" }} title="Reserved: 3" />
                      {/* Dialing (2/36 = 5.5%) */}
                      <div className="bg-blue-500 hover:opacity-90 transition-opacity" style={{ width: "5.5%" }} title="Dialing: 2" />
                      {/* Wrap-up (2/36 = 5.5%) */}
                      <div className="bg-indigo-500 hover:opacity-90 transition-opacity" style={{ width: "5.5%" }} title="Wrap-up: 2" />
                      {/* Paused (1/36 = 2.8%) */}
                      <div className="bg-slate-400 hover:opacity-90 transition-opacity" style={{ width: "2.8%" }} title="Paused: 1" />
                      {/* Offline (2/36 = 5.8%) */}
                      <div className="bg-slate-300 hover:opacity-90 transition-opacity" style={{ width: "5.8%" }} title="Offline: 2" />
                    </div>
                    <div className="flex justify-between font-label-mono-xs text-label-mono-xs text-slate-400 px-0.5">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100% (36 Agents)</span>
                    </div>
                  </div>
                  {/* Segment Legend Matrix with enhanced badges */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50/50 border border-teal-100/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                        <span className="font-body-sm text-body-sm text-slate-700 font-medium">Available</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm font-bold text-teal-800">14</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="font-body-sm text-body-sm text-slate-700 font-medium">Connected</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm font-bold text-emerald-800">12</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="font-body-sm text-body-sm text-slate-700 font-medium">Reserved</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm font-bold text-amber-800">3</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="font-body-sm text-body-sm text-slate-700 font-medium">Dialing</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm font-bold text-blue-800">2</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 border border-indigo-100/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="font-body-sm text-body-sm text-slate-700 font-medium">Wrap-up</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm font-bold text-indigo-800">2</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100/70 border border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span className="font-body-sm text-body-sm text-slate-700 font-medium">Paused</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm font-bold text-slate-800">1</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-slate-100/70 border border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                        <span className="font-body-sm text-body-sm text-slate-700 font-medium">Offline</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm font-bold text-slate-800">2</span>
                    </div>
                  </div>
                </div>
                <div className="mt-space-lg pt-space-sm flex items-center justify-between border-t border-slate-100">
                  <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-semibold">READY RATIO: 38.8%</span>
                  <Link className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors" data-path="agents" href="/agents">
                    <span>View All Agents</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
            {/* Lower Two-Column Grid: Recent Activity & Safety Insights */}
            <div className="flex flex-col gap-space-xl">
              {/* Two-Column Layout: Safety & System Health + AI Screening Insight */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
                {/* Left Column (5 cols): Safety & System Health */}
                <div className="lg:col-span-5 bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-space-sm">
                      <h3 className="font-headline-sm text-[16px] font-bold text-slate-900">
                        Safety{" "}
                        &amp;
                        {" "}System Health
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-label-mono-xs text-[10px] bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider border border-emerald-100">SIMULATION ACTIVE</span>
                    </div>
                    {/* Status Rows */}
                    <div className="flex flex-col gap-2.5 my-space-md">
                      {/* Row 1 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-body-sm">Safety Controller</span>
                          <span className="text-slate-500 font-label-mono-xs text-[11px]">Rate limiter capped at 12 calls/min</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-label-mono-xs text-[10.5px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">Operational</span>
                      </div>
                      {/* Row 2 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-body-sm">Active Telephony Carrier</span>
                          <span className="text-slate-500 font-label-mono-xs text-[11px]">Mock SIP Gateway (45ms mock ping)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-label-mono-xs text-[10.5px] font-semibold bg-amber-50 border border-amber-200 text-amber-700">Monitoring</span>
                      </div>
                      {/* Row 3 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-body-sm">Screening Backlog</span>
                          <span className="text-slate-500 font-label-mono-xs text-[11px]">0 queued tasks waiting dispatch</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-label-mono-xs text-[10.5px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">Operational</span>
                      </div>
                      {/* Row 4 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-body-sm">Pending Transfers</span>
                          <span className="text-slate-500 font-label-mono-xs text-[11px]">2 transfers awaiting agent pickup</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-label-mono-xs text-[10.5px] font-semibold bg-amber-50 border border-amber-200 text-amber-700">Restricted</span>
                      </div>
                      {/* Row 5 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-body-sm">Recent Recovery Actions</span>
                          <span className="text-slate-500 font-label-mono-xs text-[11px]">1 timeout auto-reconciled cleanly</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-label-mono-xs text-[10.5px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">Operational</span>
                      </div>
                    </div>
                    {/* Warning Box */}
                    <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[17px] text-amber-600 mt-0.5 shrink-0">shield</span>
                      <p className="text-amber-800 text-body-sm text-[12px] leading-snug font-normal">New screening calls are restricted automatically when the safety controller detects insufficient available agents.</p>
                    </div>
                  </div>
                  <div className="mt-space-lg flex justify-end">
                    <Link className="inline-flex items-center gap-1 font-body-sm text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors" data-path="pacing-safety" href="/pacing-safety">
                      <span>View Safety Decisions</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
                {/* Right Column (7 cols): AI Screening Insight */}
                <div className="lg:col-span-7 bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex flex-col gap-space-md">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-space-xs">
                      <div>
                        <h3 className="font-headline-sm text-[16px] font-bold text-slate-900">AI Screening Insight</h3>
                        <p className="font-body-sm text-slate-500 text-[12px] mt-0.5">
                          Algorithmic efficiency{" "}
                          &amp;
                          {" "}yield analysis
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-mono-xs text-[10.5px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">Model: DialX-Voice-v2.1 (Simulated)</span>
                    </div>
                    {/* Inner Card 1: Conversion & Transfer Integrity (Blue Tint) */}
                    <div className="p-space-md rounded-xl bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border border-indigo-100/80 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                          <span className="material-symbols-outlined text-[16px]">equalizer</span>
                        </div>
                        <span className="font-headline-sm text-body-sm font-bold text-slate-900">
                          Conversion{" "}
                          &amp;
                          {" "}Transfer Integrity
                        </span>
                      </div>
                      <p className="font-body-md text-[13px] font-semibold text-slate-900 leading-snug">194 of 196 willing respondents reached a confirmed agent connection in this illustrative run.</p>
                      <p className="font-body-sm text-[12px] text-slate-600 leading-normal">Two willing respondents were not connected within the configured waiting period (max queue SLA: 45s), automatically invoking the deferred callback workflow.</p>
                    </div>
                    {/* Inner Card 2: Operational Context (Neutral) */}
                    <div className="p-space-md rounded-xl bg-slate-50/50 border border-slate-200/60 flex flex-col gap-1.5">
                      <span className="font-label-ui text-[10px] uppercase tracking-wider font-semibold text-slate-400">OPERATIONAL CONTEXT</span>
                      <p className="font-body-sm text-[12px] text-slate-600 leading-relaxed">Screening drastically reduces agent fatigue spent on unanswered dials, answering machines, and unwilling contacts. However, total net yield depends tightly on answer rates, conversational screening length, transfer delays, and instantaneous agent buffer capacity.</p>
                    </div>
                    {/* 3-Column Metric Stat Cards Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-1">
                      {/* Stat 1 */}
                      <div className="p-3 rounded-lg bg-indigo-50/40 border border-indigo-100/60 flex flex-col items-center justify-center text-center">
                        <span className="font-label-ui text-[9.5px] uppercase tracking-wider font-semibold text-slate-400 mb-1">HUMAN TIME SAVED</span>
                        <span className="font-display-kpi text-[20px] font-bold text-indigo-600 leading-tight">~18.4 hrs</span>
                      </div>
                      {/* Stat 2 */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-center text-center">
                        <span className="font-label-ui text-[9.5px] uppercase tracking-wider font-semibold text-slate-400 mb-1">AVG AI SCREENING</span>
                        <span className="font-display-kpi text-[20px] font-bold text-slate-900 leading-tight">19.2s</span>
                      </div>
                      {/* Stat 3 */}
                      <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100/60 flex flex-col items-center justify-center text-center">
                        <span className="font-label-ui text-[9.5px] uppercase tracking-wider font-semibold text-slate-400 mb-1">TRANSFER HOLD TIME</span>
                        <span className="font-display-kpi text-[20px] font-bold text-emerald-600 leading-tight">3.4s</span>
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="mt-space-lg pt-space-xs flex items-center justify-between font-label-mono-xs text-label-mono-xs text-slate-400 border-t border-slate-100">
                    <span>Generated by Orchestrator Engine</span>
                    <a className="inline-flex items-center gap-1 font-body-sm text-[12.5px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors" href="#">
                      <span>Tweak Pacing Thresholds</span>
                      <span className="material-symbols-outlined text-[15px]">tune</span>
                    </a>
                  </div>
                </div>
              </div>
              {/* Full-Width Recent Activity Card */}
              <div className="bg-white rounded-xl p-space-xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-md">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">Recent Activity</h2>
                      <p className="font-body-sm text-body-sm text-slate-500 mt-0.5">Real-time mock event stream and dispatcher audit logs.</p>
                    </div>
                    <Link className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline" data-path="event-logs-recovery" href="/event-logs">
                      <span>View All Events</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                  {/* Table */}
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
                        {/* Row 1 */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">14:32:10</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">Outbound Q3 Renewal</td>
                          <td className="py-3 px-3 text-slate-600">Screening attempt completed</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Person willing
                            </span>
                          </td>
                          <td className="py-3 px-3 font-label-mono-xs text-label-mono-xs text-slate-500">Initiated agent reservation #AG-104</td>
                        </tr>
                        {/* Row 2 */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">14:31:55</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">Outbound Q3 Renewal</td>
                          <td className="py-3 px-3 text-slate-600">Transfer confirmed</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Agent connected
                            </span>
                          </td>
                          <td className="py-3 px-3 font-body-sm text-slate-600">Confirmed via Mock-SIP provider (320ms latency)</td>
                        </tr>
                        {/* Row 3 */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">14:31:20</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">Cold Inquiries Tier 1</td>
                          <td className="py-3 px-3 text-slate-600">Screening outcome recorded</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Declined
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-body-sm">AI voice bot terminated call gracefully</td>
                        </tr>
                        {/* Row 4 */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">14:29:40</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">Outbound Q3 Renewal</td>
                          <td className="py-3 px-3 text-slate-600">Provider timeout reconciled</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] bg-blue-50/50 border border-blue-100/60 text-blue-800 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Call status recovered
                            </span>
                          </td>
                          <td className="py-3 px-3 font-body-sm text-slate-600">Fallback recovery handler executed cleanly</td>
                        </tr>
                        {/* Row 5 */}
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">14:28:15</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">High Priority Outreach</td>
                          <td className="py-3 px-3 text-slate-600">Safety controller decision</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Initiation blocked
                            </span>
                          </td>
                          <td className="py-3 px-3 font-label-mono-xs text-label-mono-xs text-slate-600">Pacing threshold reached (max concurrency limit: 12)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Table Footer */}
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-400 font-label-mono-xs text-label-mono-xs border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 font-body-sm text-[12px]">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">lock</span>
                    <span>Privacy-Compliant Mode: No raw customer phone numbers or PII are exposed in the activity audit.</span>
                  </div>
                  <span className="text-slate-500 font-medium">Showing 5 of 1,435 records</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
