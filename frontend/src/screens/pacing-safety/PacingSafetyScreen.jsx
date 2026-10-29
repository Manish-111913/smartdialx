"use client";

import { useScreen } from "@/lib/useScreen";
import { mount } from "./behavior";

export default function PacingSafetyScreen() {
  const ui = useScreen(mount);

  return (
    <>
      <div className="bg-surface-page text-primaryText font-sans antialiased p-6 max-w-7xl mx-auto space-y-6 min-h-[calc(100vh-3.5rem)]">
        {/* Top Section Header & Controls */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" data-purpose="page-title-banner">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Pacing{" "}
                &amp;
                {" "}Safety
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Demo Simulation Mode</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Control dialing intensity, monitor campaign capacity, and understand safety decisions.</p>
          </div>
          <div className="flex items-center flex-wrap gap-2.5">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-xs" type="button">
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              Refresh
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-xs" type="button">Reset Demo Defaults</button>
            <button className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm shadow-blue-500/20" type="button">Save Configuration</button>
          </div>
        </section>
        {/* BEGIN: 4CompactKPICards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="kpi-metrics-row">
          {/* KPI 1: Dialing Mode */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Dialing Mode</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">Active Mode</span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-gray-900 tracking-tight">Predictive</div>
              <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Safety-Gated Dynamic Sizing
              </p>
            </div>
          </div>
          {/* KPI 2: Active Calls */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Active Calls</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200">In-Flight</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">12</span>
                <span className="text-xs text-gray-400">/ 18 max ceiling</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">85.7% Voice Trunk Occupancy</p>
            </div>
          </div>
          {/* KPI 3: Available Agents */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Available Agents</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">Healthy Buffer</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">14</span>
                <span className="text-xs text-gray-400">Ready Standby</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">38.9% Pool ready for transfer</p>
            </div>
          </div>
          {/* KPI 4: Safety Blocks */}
          <div className="bg-white p-4 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Safety Blocks</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">Holds Triggered</span>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 tracking-tight">7</span>
                <span className="text-xs text-gray-400">interventions (24h)</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Pre-dial safety mitigations applied</p>
            </div>
          </div>
        </section>
        {/* END: 4CompactKPICards */}
        {/* BEGIN: PacingAndCapacitySection */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-purpose="pacing-capacity-comparison">
          {/* Left Card: Pacing Configuration (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Pacing Configuration</h2>
                <span className="text-[11px] font-mono text-gray-400">POL-ID #4492</span>
              </div>
              {/* Dialing Mode Selector Toggle */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700 block mb-2">Operating Pacing Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Progressive Option */}
                  <div className="border border-gray-200 rounded-lg p-3 text-left opacity-75 hover:opacity-100 cursor-pointer transition-all">
                    <div className="text-xs font-semibold text-gray-700">Progressive</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">1:1 Agent match, zero dropped calls</div>
                  </div>
                  {/* Predictive Option (Selected) */}
                  <div className="border-2 border-blue-600 bg-blue-50/40 rounded-lg p-3 text-left relative cursor-pointer shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">Predictive</span>
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5 font-medium">Algorithmic batch dispatch</div>
                  </div>
                </div>
              </div>
              {/* Pacing Controls */}
              <div className="mt-5 space-y-4">
                {/* Slider: Expected Answer Rate */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-medium text-gray-700">Expected Answer Rate</span>
                    <span className="font-mono font-bold text-blue-600 text-xs">38%</span>
                  </div>
                  <input className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" max="90" min="10" type="range" defaultValue="38" />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>10% Low Pickup</span>
                    <span>50% Mid</span>
                    <span>90% High Response</span>
                  </div>
                </div>
                {/* Input Fields Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Safety Margin</label>
                    {" "}
                    <select className="w-full text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-800 focus:ring-1 focus:ring-blue-500">
                      <option>1.25x Conservative</option>
                      <option>1.50x Balanced</option>
                      <option>1.10x Ultra Safe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Max Concurrent Calls</label>
                    {" "}
                    <input className="w-full text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-800 font-mono focus:ring-1 focus:ring-blue-500" type="number" defaultValue="18" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Ratio / Available Agent</label>
                    <div className="text-xs bg-slate-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 font-mono flex items-center justify-between">
                      <span>1.4x</span>
                      <span className="text-[10px] text-gray-400">Batch Cap</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Max Drop Rate Floor</label>
                    <div className="text-xs bg-slate-50 border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 font-mono">
                      &lt;
                      {" "}3.0% FCC SLA
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Explanatory note badge */}
            <div className="mt-4 p-3 bg-blue-50/60 border border-blue-100 rounded-lg flex items-start gap-2.5">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <p className="text-[11px] text-blue-800 leading-relaxed">Pacing engine dynamically calculates target batch dispatch while respecting agent queue SLAs.</p>
            </div>
          </div>
          {/* Right Card: Capacity Comparison & Limiter Distinction (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-surface-border shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900">
                    Pacing Overview{" "}
                    &amp;
                    {" "}Capacity Comparison
                  </h2>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Buffer Active</span>
                </div>
                <span className="text-xs text-gray-400">Realtime Snapshot</span>
              </div>
              {/* Capacity Comparison Bars */}
              <div className="mt-4 space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-700">Available Agent Capacity</span>
                    <span className="text-gray-900 font-mono">
                      14 agents{" "}
                      <span className="text-gray-400 font-normal">(100% baseline)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-700">Active In-Progress Calls</span>
                    <span className="text-gray-900 font-mono">
                      12 channels{" "}
                      <span className="text-gray-400 font-normal">(85% capacity)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-gray-700">Queued Call Targets</span>
                    <span className="text-gray-900 font-mono">
                      42 records{" "}
                      <span className="text-gray-400 font-normal">awaiting batch</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-400 h-2.5 rounded-full" style={{ width: "58%" }} />
                  </div>
                </div>
              </div>
              {/* Pacer vs Safety Distinction Box */}
              <div className="mt-5 p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/50">
                <div className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Engine vs Safety Divergence</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
                    <span className="text-[11px] text-gray-500 block">Pacer Suggested Volume</span>
                    {" "}
                    <span className="text-xl font-mono font-bold text-blue-700">
                      16{" "}
                      <span className="text-xs font-normal text-gray-500">attempts</span>
                    </span>
                    {" "}
                    <span className="text-[10px] text-gray-400 block mt-0.5">Based on 38% answer model</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                    <span className="text-[11px] text-gray-500 block">Calls Permitted by Safety</span>
                    {" "}
                    <span className="text-xl font-mono font-bold text-amber-600">
                      10{" "}
                      <span className="text-xs font-normal text-gray-500">calls cap</span>
                    </span>
                    {" "}
                    <span className="text-[10px] text-gray-400 block mt-0.5">Trunk headroom constraint</span>
                  </div>
                </div>
                {/* Highlight gap banner */}
                <div className="mt-3 flex items-center justify-between text-xs bg-amber-100/70 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-md font-medium">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                    Limiter Gap: -6 calls held back to prevent queue spikes
                  </span>
                  <span className="text-[10px] font-mono font-semibold bg-white/80 px-1.5 py-0.5 rounded">DELTA -37.5%</span>
                </div>
              </div>
            </div>
            {/* Shield explanation */}
            <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-500">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span>The pacing engine suggests a dialing volume. The safety controller independently determines whether that volume is permitted.</span>
            </div>
          </div>
        </section>
        {/* END: PacingAndCapacitySection */}
        {/* BEGIN: SafetyControllerMatrixCard */}
        <section className="bg-white rounded-xl border border-surface-border shadow-xs overflow-hidden" data-purpose="safety-rules-matrix">
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-gray-900">Safety Controller Matrix</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Operational
                </span>
                <span className="text-xs text-gray-400">· 5 Global Safeguards Active</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">The safety controller can reduce or block new call initiation independently of the selected pacing mode.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Fallback Strategy:</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-[11px] font-medium">Forced Progressive</span>
            </div>
          </div>
          {/* Table of rules */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-5" scope="col">Safety Rule</th>
                  <th className="py-3 px-4" scope="col">Current Metric</th>
                  <th className="py-3 px-4" scope="col">Threshold Boundary</th>
                  <th className="py-3 px-4" scope="col">Status</th>
                  <th className="py-3 px-5" scope="col">
                    Rule Description{" "}
                    &amp;
                    {" "}Behavioral Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {/* Row 1 */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-gray-900">Max Concurrent Active Calls</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-blue-600">12 calls</td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">18 calls max</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">Normal (66%)</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-500 text-[11px]">Hard carrier trunk ceiling across all active SIP gateways.</td>
                </tr>
                {/* Row 2 */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-gray-900">Max Unanswered / Abandoned Ratio</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-emerald-600">1.8%</td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">3.0% max boundary</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">Optimal</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-500 text-[11px]">Auto-throttles pacer if unanswered call spikes exceed safety boundary.</td>
                </tr>
                {/* Row 3 */}
                <tr className="hover:bg-gray-50/50 transition-colors bg-rose-50/20">
                  <td className="py-3.5 px-5 font-semibold text-gray-900">Max Calls Per Campaign Window</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-600">8 calls/min</td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">12 calls/min</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-[11px] rounded bg-rose-50 text-rose-700 font-medium border border-rose-200">Throttled</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-500 text-[11px]">Enforces burst limits to avoid sudden agent starvation.</td>
                </tr>
                {/* Row 4 */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-gray-900">Predictive Over-Dial Limit</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-blue-600">1.1x</td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">1.4x ceiling</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-[11px] rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">Safe</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-500 text-[11px]">Prevents algorithmic over-dialing when available agent count drops below 5.</td>
                </tr>
                {/* Row 5 */}
                <tr className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-gray-900">Provider Error-Rate Threshold</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-emerald-600">0.2%</td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">1.5% trip circuit</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-[11px] rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">Operational</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-500 text-[11px]">Automatic failover circuit breaker for carrier SIP 503/504 errors.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        {/* END: SafetyControllerMatrixCard */}
        {/* BEGIN: SimulationCard */}
        <section className="bg-white rounded-xl border border-surface-border shadow-xs p-5 space-y-4" data-purpose="answer-rate-simulation">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">
                Answer Rate{" "}
                &amp;
                {" "}Capacity Impact Simulation
              </h2>
              <span className="text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">Sensitivity Matrix</span>
            </div>
            <span className="text-xs text-gray-400">Fixed Agent Buffer: 14 reps</span>
          </div>
          {/* 3 Scenario Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scenario 1: 20% Answer Rate */}
            <div className="border border-gray-200 rounded-lg p-4 bg-slate-50/40 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-800">20% Answer Rate</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">Safe</span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Suggested Dispatch:</span>
                  <span className="font-mono font-semibold text-gray-900">24 calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Permitted by Safety:</span>
                  <span className="font-mono font-semibold text-emerald-700">16 calls</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "66%" }} />
                </div>
                <p className="text-[11px] text-gray-500 pt-1 leading-normal">Low pickup likelihood permits larger batch sizing under strict trunk cap.</p>
              </div>
            </div>
            {/* Scenario 2: 50% Answer Rate */}
            <div className="border border-gray-200 rounded-lg p-4 bg-slate-50/40 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-800">50% Answer Rate</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">Tight Buffer</span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Suggested Dispatch:</span>
                  <span className="font-mono font-semibold text-gray-900">14 calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Permitted by Safety:</span>
                  <span className="font-mono font-semibold text-amber-700">12 calls</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "85%" }} />
                </div>
                <p className="text-[11px] text-gray-500 pt-1 leading-normal">Medium pickup rates require conservative dispatch to preserve agent queue.</p>
              </div>
            </div>
            {/* Scenario 3: 70% Answer Rate */}
            <div className="border border-gray-200 rounded-lg p-4 bg-slate-50/40 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-800">70% Answer Rate</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800">Progressive Fallback</span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Suggested Dispatch:</span>
                  <span className="font-mono font-semibold text-gray-900">9 calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Permitted by Safety:</span>
                  <span className="font-mono font-semibold text-rose-700">8 calls</span>
                </div>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: "90%" }} />
                </div>
                <p className="text-[11px] text-gray-500 pt-1 leading-normal">High answer rate behaves near 1:1 progressive to eliminate abandoned transfers.</p>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-gray-400 text-center pt-1">Illustrative Simulation Data • A higher answer rate does not imply higher productivity without available agent buffers.</div>
        </section>
        {/* END: SimulationCard */}
        {/* BEGIN: DecisionsTableSection */}
        <section className="bg-white rounded-xl border border-surface-border shadow-xs overflow-hidden" data-purpose="safety-decisions-history">
          <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Recent Safety Decisions</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chronological audit stream of pacer proposal evaluations{" "}
                &amp;
                {" "}limits.
              </p>
            </div>
            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-medium">
              <button className="px-2.5 py-1 bg-white text-gray-900 rounded-md shadow-2xs font-semibold">All Decisions (14)</button>
              <button className="px-2.5 py-1 text-gray-600 hover:text-gray-900 rounded-md">Approved (8)</button>
              <button className="px-2.5 py-1 text-gray-600 hover:text-gray-900 rounded-md">Reduced (3)</button>
              <button className="px-2.5 py-1 text-gray-600 hover:text-gray-900 rounded-md">Blocked (2)</button>
              <button className="px-2.5 py-1 text-gray-600 hover:text-gray-900 rounded-md">Forced Progressive (1)</button>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-5" scope="col">Time</th>
                  <th className="py-3 px-4" scope="col">Campaign</th>
                  <th className="py-3 px-4" scope="col">Decision</th>
                  <th className="py-3 px-4" scope="col">Trigger Condition</th>
                  <th className="py-3 px-4" scope="col">Pacing Mode</th>
                  <th className="py-3 px-4 text-center" scope="col">Calls Affected</th>
                  <th className="py-3 px-5 text-right" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {/* Decision 1 */}
                <tr className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-5 font-mono text-gray-500 text-[11px]">14:48:02</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">Q3 Renewal Outreach</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">Normal batch dispatch; within safe SLAs</td>
                  <td className="py-3 px-4 font-mono text-gray-500">Predictive</td>
                  <td className="py-3 px-4 font-mono text-center text-gray-900">6 suggested / 6 dial</td>
                  <td className="py-3 px-5 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline" onClick={(e) => ui(e).openDrawer('DEC-8419', 'Reduced', 'Auto Claims Pilot', 'Max Concurrent Active Calls (Ceiling reached)', 'Predictive', '16 suggested', '10 permitted')} type="button">Inspect</button>
                  </td>
                </tr>
                {/* Decision 2 (Focus item for drawer inspection) */}
                <tr className="hover:bg-gray-50/60 transition-colors bg-amber-50/30">
                  <td className="py-3 px-5 font-mono text-gray-500 text-[11px]">14:46:11</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">Auto Claims Pilot</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Reduced</span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium">Trunk capacity ceiling near threshold</td>
                  <td className="py-3 px-4 font-mono text-gray-500">Predictive</td>
                  <td className="py-3 px-4 font-mono text-center text-amber-800 font-semibold">16 suggested / 10 dial</td>
                  <td className="py-3 px-5 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline" onClick={(e) => ui(e).openDrawer('DEC-8419', 'Reduced', 'Auto Claims Pilot', 'Max Concurrent Active Calls (Ceiling reached)', 'Predictive', '16 suggested', '10 permitted')} type="button">Inspect</button>
                  </td>
                </tr>
                {/* Decision 3 */}
                <tr className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-5 font-mono text-gray-500 text-[11px]">14:43:55</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">Cold Inquiries Tier 1</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Blocked</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">Available agent count dropped below 2</td>
                  <td className="py-3 px-4 font-mono text-gray-500">Predictive</td>
                  <td className="py-3 px-4 font-mono text-center text-rose-700 font-semibold">8 suggested / 0 dial</td>
                  <td className="py-3 px-5 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline" onClick={(e) => ui(e).openDrawer('DEC-8417', 'Blocked', 'Cold Inquiries Tier 1', 'Agent Starvation Prevention (<2 agents ready)', 'Predictive', '8 suggested', '0 permitted')} type="button">Inspect</button>
                  </td>
                </tr>
                {/* Decision 4 */}
                <tr className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-5 font-mono text-gray-500 text-[11px]">14:40:18</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">Auto Claims Pilot</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Forced Progressive</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">Unanswered ratio spiked to 2.9%</td>
                  <td className="py-3 px-4 font-mono text-gray-500">Forced Progressive</td>
                  <td className="py-3 px-4 font-mono text-center text-gray-700">1:1 match enforced</td>
                  <td className="py-3 px-5 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline" onClick={(e) => ui(e).openDrawer('DEC-8412', 'Forced Progressive', 'Auto Claims Pilot', 'Unanswered ratio exceeded 2.5% boundary', 'Forced Progressive', '12 suggested', '4 permitted')} type="button">Inspect</button>
                  </td>
                </tr>
                {/* Decision 5 */}
                <tr className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-5 font-mono text-gray-500 text-[11px]">14:38:00</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">Q3 Renewal Outreach</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">Standard batch evaluation; safe buffer</td>
                  <td className="py-3 px-4 font-mono text-gray-500">Predictive</td>
                  <td className="py-3 px-4 font-mono text-center text-gray-900">8 suggested / 8 dial</td>
                  <td className="py-3 px-5 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline" onClick={(e) => ui(e).openDrawer('DEC-8409', 'Approved', 'Q3 Renewal Outreach', 'All safety gates clear', 'Predictive', '8 suggested', '8 permitted')} type="button">Inspect</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Table Footer Pagination */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Showing 1-5 of 14 safety decisions</span>
            <div className="flex items-center gap-1 font-medium">
              <button className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>
                &lt;
                {" "}Previous
              </button>
              <button className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">1</button>
              <button className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50">2</button>
              <button className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50">3</button>
              <button className="px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-50">
                Next{" "}
                &gt;
              </button>
            </div>
          </div>
        </section>
        {/* END: DecisionsTableSection */}
      </div>
      <div aria-labelledby="slide-over-title" aria-modal="true" className="fixed inset-0 z-50 overflow-hidden hidden" data-purpose="safety-inspector-drawer" id="inspectorDrawer" role="dialog">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" id="drawerBackdrop" onClick={(e) => ui(e).closeDrawer()} />
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          {/* Drawer Panel */}
          <div className="w-screen max-w-md bg-white border-l border-surface-border shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-500" id="drawerDecisionId">#DEC-8419</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800" id="drawerDecisionBadge">Reduced</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-1" id="slide-over-title">Decision Inspector</h3>
              </div>
              <button aria-label="Close Inspector" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" onClick={(e) => ui(e).closeDrawer()} type="button">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
            {/* Drawer Content Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
              {/* Metadata Attributes */}
              <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Campaign Target:</span>
                  <span className="font-semibold text-gray-900" id="drawerCampaign">Auto Claims Pilot</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trigger Condition:</span>
                  <span className="font-medium text-gray-800 text-right max-w-[200px]" id="drawerTrigger">Max Concurrent Active Calls</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Selected Pacing Mode:</span>
                  <span className="font-mono text-gray-700" id="drawerMode">Predictive</span>
                </div>
              </div>
              {/* Suggested vs Permitted Meter */}
              <div className="p-4 border border-blue-100 bg-blue-50/40 rounded-xl space-y-3">
                <div className="text-xs font-bold text-gray-800">Dispatch Comparison</div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-md border border-gray-200">
                    <span className="text-[10px] text-gray-400 block uppercase">Pacer Requested</span>
                    {" "}
                    <span className="text-base font-mono font-bold text-blue-700" id="drawerSuggested">16 suggested</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-md border border-amber-200">
                    <span className="text-[10px] text-gray-400 block uppercase">Permitted Release</span>
                    {" "}
                    <span className="text-base font-mono font-bold text-amber-600" id="drawerPermitted">10 permitted</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-600 bg-white/70 p-2 rounded border border-gray-200/60 leading-relaxed">Trunk ceiling safeguard intercepted 6 dispatch calls to prevent queue hold time degradation above the 45s threshold.</div>
              </div>
              {/* Event Evaluation Timeline */}
              <div>
                <div className="font-bold text-gray-900 mb-3 text-xs">Evaluation Timeline Steps</div>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {/* Step 1 */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                    <div className="text-gray-800 font-semibold text-[11px]">Pacing Engine Calculation</div>
                    <div className="text-[10px] text-gray-400">14:46:11.020 · 38% answer probability requested 16 outbound rings.</div>
                  </div>
                  {/* Step 2 */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
                    <div className="text-gray-800 font-semibold text-[11px]">Safety Matrix Intercept</div>
                    <div className="text-[10px] text-gray-400">14:46:11.085 · Carrier trunk threshold cap exceeded (12 / 18 active).</div>
                  </div>
                  {/* Step 3 */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="text-gray-800 font-semibold text-[11px]">Reduced Volume Release Dispatched</div>
                    <div className="text-[10px] text-gray-400">14:46:11.140 · Dial batch reduced from 16 to 10. Queue buffer preserved.</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Drawer Footer */}
            <div className="p-4 border-t border-surface-border bg-gray-50 flex items-center justify-between">
              <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={(e) => ui(e).closeDrawer()} type="button">Close</button>
              <a className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-xs inline-flex items-center gap-1.5" href="#">
                <span>View in Live Operations</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
