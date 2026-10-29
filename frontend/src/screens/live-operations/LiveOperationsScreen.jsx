"use client";

import { useScreen } from "@/lib/useScreen";
import { mount } from "./behavior";

export default function LiveOperationsScreen() {
  const ui = useScreen(mount);

  return (
    <>
      <div className="bg-[#f8fafc] text-slate-800 font-sans antialiased text-[13px] px-6 py-5 space-y-6 min-h-[calc(100vh-3.5rem)]">
        {/* Action & Live Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Live Operations</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100/70 text-blue-700 uppercase tracking-wide">
                <span className="w-1 h-1 rounded-full bg-blue-600 mr-1" />
                Dispatch Matrix
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-600">CLUSTER US-EAST-01</span>
              {" "}— Monitor screening attempts, call progress, and agent transfers across active campaigns.
            </p>
          </div>
          <div className="flex items-center space-x-2.5">
            {/* Campaign Roster Select */}
            <div className="relative">
              <select className="text-xs border-slate-200 rounded-lg py-1.5 pl-3 pr-7 bg-white text-slate-700 font-medium shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option>All Campaigns (Active Roster)</option>
              </select>
            </div>
            {/* All Call States Filter */}
            <button className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <span className="">All Call States</span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
            {/* Search Input */}
            <div className="relative">
              <input className="w-48 text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500" placeholder="Search call ID or campaign..." type="text" />
              {" "}
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            {/* SIP-Sim status badge */}
            <div className="flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
              SIP-Sim v2 Active
            </div>
            {/* Reload Button */}
            <button className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
            {/* Run Simulation CTA */}
            <button className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm shadow-blue-300">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" fillRule="evenodd" />
              </svg>
              <span className="">Run Simulation</span>
            </button>
          </div>
        </div>
        {/* BEGIN: KpiCards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5" data-purpose="kpi-metrics-grid">
          {/* Metric 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Screening</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] uppercase flex items-center">
                <span className="w-1 h-1 rounded-full bg-blue-600 mr-1" />
                Bots
              </span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">18</span>
              <span className="text-[11px] text-slate-500 font-normal">concurrency</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Real-time interactions</span>
              <span className="font-bold text-blue-600">120 sps</span>
            </div>
          </div>
          {/* Metric 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waiting for Agent</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[10px] uppercase">Priority</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-amber-600 tracking-tight">2</span>
              <span className="text-[11px] text-slate-500 font-normal">in queue</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                Avg wait SLA:{" "}
                <strong className="text-slate-700 font-medium">3.4s</strong>
              </span>
              <span className="font-bold text-amber-600">Max 7.1s</span>
            </div>
          </div>
          {/* Metric 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Calls</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">Voice Agents</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">12</span>
              <span className="text-[11px] text-slate-500 font-normal">live channels</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Pool occupancy</span>
              <span className="font-bold text-slate-700">85.7%</span>
            </div>
          </div>
          {/* Metric 4 */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connected Today</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] uppercase">99.0% Integrity</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">194</span>
              <span className="text-[11px] text-slate-500 font-normal">transfers</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Successful handshakes</span>
              <span className="font-bold text-emerald-600">+18/hr</span>
            </div>
          </div>
          {/* Metric 5 */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety Blocks</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">Policy</span>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">7</span>
              <span className="text-[11px] text-slate-500 font-normal">holds</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Carrier limiters</span>
              <span className="font-bold text-slate-700">0 drops</span>
            </div>
          </div>
        </section>
        {/* END: KpiCards */}
        {/* BEGIN: PipelineFunnel */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs" data-purpose="screening-transfer-pipeline">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-50 text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Screening{" "}
                  &amp;
                  {" "}Transfer Pipeline
                </h2>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Telemetry Stream v2</span>
            </div>
            <div className="flex items-center space-x-5 text-xs mt-2 sm:mt-0">
              <div>
                <span className="text-slate-400">Avg Screening Latency:</span>
                {" "}
                <span className="font-bold text-slate-800 ml-1">19.2s</span>
              </div>
              <span className="text-slate-300">•</span>
              <div>
                <span className="text-slate-400">Avg Transfer Wait:</span>
                {" "}
                <span className="font-bold text-slate-800 ml-1">3.4s</span>
              </div>
              <span className="text-slate-300">•</span>
              <div>
                <span className="text-slate-400">Drop Rate:</span>
                {" "}
                <span className="font-bold text-emerald-600 ml-1">1.0%</span>
              </div>
            </div>
          </div>
          {/* 5 Pipeline Stage Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Stage 01 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span className="">Stage 01</span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-800 text-xs mb-2">Screening Call</h4>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Attempts</span>
                <span className="font-bold text-slate-900 font-mono text-sm">1,435</span>
              </div>
            </div>
            {/* Stage 02 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span className="">Stage 02</span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.228 3.684A1 1 0 008.28 3H5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-800 text-xs mb-2">Person Responds</h4>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Answered</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  542{" "}
                  <span className="text-[10px] font-sans font-normal text-slate-400">(37.8%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: "37.8%" }} />
              </div>
            </div>
            {/* Stage 03 */}
            <div className="bg-blue-50/30 border border-blue-200 rounded-lg p-3 relative">
              <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                <span className="">Stage 03 • Qualified</span>
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h4 className="font-bold text-blue-900 text-xs mb-1.5">Willing to Talk</h4>
              <div className="space-y-0.5 text-xs">
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-600 text-[11px]">Eligible transfer</span>
                  <span className="font-bold text-blue-700 font-mono">
                    196{" "}
                    <span className="text-[10px] font-sans font-normal text-blue-500">(36.2%)</span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] text-slate-400">
                  <span className="">Declined / Unwilling</span>
                  <span className="font-mono">346</span>
                </div>
              </div>
            </div>
            {/* Stage 04 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span className="">Stage 04</span>
                <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-800 text-xs mb-2">Agent Reserved</h4>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Standby hold</span>
                <span className="font-bold text-amber-600 font-mono text-sm">2 active</span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-1 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
            {/* Stage 05 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span className="">Stage 05</span>
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
              <h4 className="font-bold text-slate-800 text-xs mb-2">Transfer Confirmed</h4>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-500">Full duplex</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  194{" "}
                  <span className="text-[10px] font-sans font-normal text-slate-400">(99.0%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-1 rounded-full" style={{ width: "99%" }} />
              </div>
            </div>
          </div>
        </section>
        {/* END: PipelineFunnel */}
        {/* BEGIN: CallQueueTable */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs" data-purpose="call-queue-matrix">
          {/* Table Filter Tabs */}
          <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="font-bold text-slate-900 text-sm mr-2">Call Queue</span>
              <button className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs">All States (9)</button>
              <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">Connected (3)</button>
              <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">Reserved (1)</button>
              <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">Ringing (2)</button>
              <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">Completed (3)</button>
              <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">Screening (2)</button>
              <div className="relative inline-block ml-1">
                <button className="flex items-center space-x-1 px-2 py-1 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50">
                  <span className="">••• More</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="">
                <strong className="text-slate-800 font-semibold">9</strong>
                {" "}active records
              </span>
              <span className="text-slate-300">•</span>
              <button className="text-blue-600 hover:underline font-medium">Reset</button>
            </div>
          </div>
          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Call ID</th>
                  <th className="py-2.5 px-4">Campaign</th>
                  <th className="py-2.5 px-4">Screening Outcome</th>
                  <th className="py-2.5 px-4">Call State</th>
                  <th className="py-2.5 px-4">Assigned Agent</th>
                  <th className="py-2.5 px-4">Provider</th>
                  <th className="py-2.5 px-4 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {/* Row 1: Selected / In Focus */}
                <tr className="call-row bg-blue-50/40 hover:bg-blue-50/60 transition-colors border-l-4 border-l-blue-600 cursor-pointer" data-agent="Jordan Lee" data-agent-id="AG-1089 • SDR Lead" data-call-id="CALL-20481" data-campaign="Q3 Renewal Outreach" data-duration="02m 45s (Live)" data-provider="Mock SIP Gateway A" data-state="Connected">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">CALL-20481</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">Q3 Renewal Outreach</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Willing to talk
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
                      Connected
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">Jordan Lee</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway A</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">02m 45s</td>
                </tr>
                {/* Row 2 */}
                <tr className="call-row hover:bg-slate-50 transition-colors cursor-pointer" data-agent="Awaiting Agent" data-agent-id="Unassigned" data-call-id="CALL-20482" data-campaign="Auto Claims Pilot" data-duration="00m 42s" data-provider="Mock SIP Gateway B" data-state="Reserved">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">CALL-20482</td>
                  <td className="py-3 px-4 text-slate-800">Auto Claims Pilot</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Willing to talk
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                      Reserved
                    </span>
                  </td>
                  <td className="py-3 px-4 text-amber-600 font-medium">— Awaiting Agent</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway B</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700 text-right">00m 42s</td>
                </tr>
                {/* Row 3 */}
                <tr className="call-row hover:bg-slate-50 transition-colors cursor-pointer" data-agent="—" data-agent-id="Automated" data-call-id="CALL-20479" data-campaign="Cold Inquiries Tier 1" data-duration="00m 18s" data-provider="Mock SIP Gateway A" data-state="Ringing">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">CALL-20479</td>
                  <td className="py-3 px-4 text-slate-800">Cold Inquiries Tier 1</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
                      In progress
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
                      Ringing
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">—</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway A</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">00m 18s</td>
                </tr>
                {/* Row 4 */}
                <tr className="call-row hover:bg-slate-50 transition-colors cursor-pointer" data-agent="Priya Sharma" data-agent-id="AG-1044 • Account Exec" data-call-id="CALL-20475" data-campaign="Q3 Renewal Outreach" data-duration="03m 12s" data-provider="Mock SIP Gateway A" data-state="Connected">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">CALL-20475</td>
                  <td className="py-3 px-4 text-slate-800">Q3 Renewal Outreach</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Willing to talk
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Connected
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">Priya Sharma</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway A</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">03m 12s</td>
                </tr>
                {/* Row 5 */}
                <tr className="call-row hover:bg-slate-50 transition-colors cursor-pointer" data-agent="Alex Morgan" data-agent-id="AG-1090 • Support" data-call-id="CALL-20472" data-campaign="Auto Claims Pilot" data-duration="01m 05s" data-provider="Mock SIP Gateway B" data-state="Completed">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">CALL-20472</td>
                  <td className="py-3 px-4 text-slate-800">Auto Claims Pilot</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">Callback later</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">Completed</span>
                  </td>
                  <td className="py-3 px-4 text-slate-800">Alex Morgan</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway B</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">01m 05s</td>
                </tr>
                {/* Row 6 */}
                <tr className="call-row hover:bg-slate-50 transition-colors cursor-pointer" data-agent="Sam Taylor" data-agent-id="AG-1055 • Specialist" data-call-id="CALL-20468" data-campaign="Premium Member Retention" data-duration="04m 20s" data-provider="Mock SIP Gateway A" data-state="Connected">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">CALL-20468</td>
                  <td className="py-3 px-4 text-slate-800">Premium Member Retention</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Willing to talk
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Connected
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">Sam Taylor</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway A</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">04m 20s</td>
                </tr>
                {/* Row 7 */}
                <tr className="call-row hover:bg-slate-50 transition-colors cursor-pointer" data-agent="—" data-agent-id="Automated" data-call-id="CALL-20465" data-campaign="Cold Inquiries Tier 1" data-duration="00m 28s" data-provider="Mock SIP Gateway A" data-state="Completed">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">CALL-20465</td>
                  <td className="py-3 px-4 text-slate-800">Cold Inquiries Tier 1</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">Declined</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">Completed</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">—</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway A</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">00m 28s</td>
                </tr>
                {/* Row 8 */}
                <tr className="call-row hover:bg-slate-50 transition-colors cursor-pointer" data-agent="—" data-agent-id="Automated" data-call-id="CALL-20461" data-campaign="Q3 Renewal Outreach" data-duration="00m 34s" data-provider="Mock SIP Gateway B" data-state="Completed">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">CALL-20461</td>
                  <td className="py-3 px-4 text-slate-800">Q3 Renewal Outreach</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">Busy / No answer</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">Completed</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">—</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway B</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">00m 34s</td>
                </tr>
                {/* Row 9 */}
                <tr className="call-row hover:bg-slate-50 transition-colors cursor-pointer" data-agent="—" data-agent-id="Automated" data-call-id="CALL-20459" data-campaign="Premium Member Retention" data-duration="00m 12s" data-provider="Mock SIP Gateway A" data-state="Ringing">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">CALL-20459</td>
                  <td className="py-3 px-4 text-slate-800">Premium Member Retention</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
                      In progress
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
                      Ringing
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">—</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">Mock SIP Gateway A</td>
                  <td className="py-3 px-4 font-mono text-slate-700 text-right">00m 12s</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        {/* END: CallQueueTable */}
        {/* BEGIN: OperationalAlerts */}
        <section className="space-y-2.5" data-purpose="diagnostic-alerts">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Operational Alerts{" "}
                &amp;
                {" "}Exceptions
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">System Diagnostics</span>
            </div>
            <a className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1" href="#">
              <span className="">
                View Event Logs{" "}
                &amp;
                {" "}Recovery
              </span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* SLA Alert */}
            <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl relative">
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="text-amber-600 font-bold text-xs uppercase tracking-wide">Queue SLA Alert</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">A willing respondent is waiting for an available agent (Queue SLA: 45s threshold approaching on CALL-20482).</p>
            </div>
            {/* Safety Controller */}
            <div className="p-3 bg-blue-50/40 border border-blue-200/70 rounded-xl relative">
              <div className="flex items-center space-x-2 mb-1.5">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="text-blue-800 font-bold text-xs uppercase tracking-wide">Safety Controller Active</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Automatic rate limiting capped at 12 calls/min to preserve agent headroom and SIP trunk stability.</p>
            </div>
            {/* Webhook Reconciled */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative">
              <div className="flex items-center space-x-2 mb-1.5">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="text-slate-800 font-bold text-xs uppercase tracking-wide">Webhook Reconciled</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Duplicate provider mock webhook safely deduplicated for call session CALL-20478.</p>
            </div>
            {/* Auto Failover */}
            <div className="p-3 bg-emerald-50/40 border border-emerald-200/70 rounded-xl relative">
              <div className="flex items-center space-x-2 mb-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="text-emerald-800 font-bold text-xs uppercase tracking-wide">Auto Failover Completed</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Provider SIP timeout reconciled via automatic Gateway B fallback without carrier drop.</p>
            </div>
          </div>
        </section>
        {/* END: OperationalAlerts */}
      </div>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-40 transition-opacity duration-300" id="drawer-backdrop" onClick={(e) => ui(e).closeDrawer()} style={{ display: "none" }} />
      <aside className="fixed top-0 right-0 h-full w-[440px] max-w-full bg-white border-l border-slate-200 shadow-2xl flex flex-col shrink-0 z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out" data-purpose="call-inspector-drawer" id="call-details-drawer" style={{ display: "none" }}>
        {/* Drawer Top Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-blue-600 text-xs px-2 py-0.5 bg-blue-50 border border-blue-200 rounded" id="drawer-call-id">CALL-20481</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" id="drawer-call-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              Connected
            </span>
          </div>
          <button className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 focus:outline-none" id="close-drawer" onClick={(e) => ui(e).closeDrawer()} title="Close Panel">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
        {/* Drawer Main Details Content */}
        <div className="p-4 space-y-5 flex-1">
          {/* Campaign Sub-header */}
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-snug" id="drawer-campaign-title">Q3 Renewal Outreach</h2>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Realtime Call{" "}
              &amp;
              {" "}Audio Telemetry
            </p>
          </div>
          {/* Telemetry & Call Attributes */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Telemetry{" "}
              &amp;
              {" "}Call Attributes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {/* Screening Outcome Card */}
              <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Screening Outcome</span>
                {" "}
                <span className="font-bold text-emerald-600 text-xs block">Willing to talk</span>
                {" "}
                <span className="text-[10px] text-slate-500">Passed bot verification</span>
              </div>
              {/* Current Call State Card */}
              <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Current Call State</span>
                {" "}
                <span className="font-bold text-slate-800 text-xs block" id="drawer-state-card">Connected (Ch 04)</span>
                {" "}
                <span className="text-[10px] text-slate-500">Full duplex open</span>
              </div>
            </div>
            {/* Assigned Agent Card */}
            <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Agent</span>
                {" "}
                <span className="font-bold text-slate-900 text-xs" id="drawer-agent-name">Jordan Lee</span>
              </div>
              <span className="text-[10px] font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100" id="drawer-agent-badge">AG-1089 • SDR Lead</span>
            </div>
            {/* Audio Provider & Duration Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Audio Provider</span>
                {" "}
                <span className="font-semibold text-slate-800 text-xs block" id="drawer-provider">Mock SIP Gateway A</span>
                {" "}
                <span className="text-[10px] text-emerald-600 font-semibold">22ms RTT latency</span>
              </div>
              <div className="p-2.5 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Duration / Start</span>
                {" "}
                <span className="font-mono font-bold text-slate-900 text-xs block" id="drawer-duration">02m 45s (Live)</span>
                {" "}
                <span className="text-[10px] text-slate-400 font-mono">14:38:12 Today</span>
              </div>
            </div>
          </div>
          {/* RX/TX Audio Waveform Console */}
          <div className="p-3 bg-slate-950 rounded-xl text-white shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Rx/Tx Audio Flow</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">G.711u • 64 kbps</span>
            </div>
            {/* Soundwave Bar Equalizer Visualizer */}
            <div className="h-10 flex items-center justify-between px-1 gap-1 my-1">
              <div className="w-1 bg-slate-600 rounded-full h-3" />
              <div className="w-1 bg-blue-400 rounded-full h-6 animate-pulse" />
              <div className="w-1 bg-blue-400 rounded-full h-4" />
              <div className="w-1 bg-blue-400 rounded-full h-8 animate-pulse" />
              <div className="w-1 bg-slate-600 rounded-full h-2" />
              <div className="w-1 bg-blue-400 rounded-full h-7" />
              <div className="w-1 bg-emerald-400 rounded-full h-9 animate-pulse" />
              <div className="w-1 bg-emerald-400 rounded-full h-5" />
              <div className="w-1 bg-slate-600 rounded-full h-2" />
              <div className="w-1 bg-blue-400 rounded-full h-6" />
              <div className="w-1 bg-blue-400 rounded-full h-4 animate-pulse" />
              <div className="w-1 bg-blue-400 rounded-full h-8" />
              <div className="w-1 bg-slate-600 rounded-full h-3" />
              <div className="w-1 bg-blue-400 rounded-full h-7 animate-pulse" />
              <div className="w-1 bg-emerald-400 rounded-full h-9" />
              <div className="w-1 bg-emerald-400 rounded-full h-4 animate-pulse" />
              <div className="w-1 bg-slate-600 rounded-full h-2" />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              <span className="">Jitter: 1.2ms</span>
              <span className="text-emerald-400 font-semibold">MOS: 4.41 (Excellent)</span>
            </div>
          </div>
          {/* Recent Event Timeline */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Recent Event Timeline</h4>
            <div className="relative pl-4 space-y-3.5 border-l-2 border-slate-200 text-xs">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                <div className="leading-tight">
                  <span className="font-mono text-[10px] text-slate-400">14:38:12</span>
                  <p className="font-semibold text-slate-800">Screening attempt started</p>
                  <p className="text-[11px] text-slate-500">Mock SIP Gateway A initiated INVITE</p>
                </div>
              </div>
              {/* Event 2 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                <div className="leading-tight">
                  <span className="font-mono text-[10px] text-slate-400">14:38:18</span>
                  <p className="font-semibold text-slate-800">Customer answered call</p>
                  <p className="text-[11px] text-slate-500">Voice response OK, bot greeting launched</p>
                </div>
              </div>
              {/* Event 3 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                <div className="leading-tight">
                  <span className="font-mono text-[10px] text-slate-400">14:38:34</span>
                  <p className="font-semibold text-emerald-700">Outcome recorded: Willing to talk</p>
                  <p className="text-[11px] text-slate-500">Intent match: License renewal confirmed</p>
                </div>
              </div>
              {/* Event 4 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
                <div className="leading-tight">
                  <span className="font-mono text-[10px] text-slate-400">14:38:36</span>
                  <p className="font-semibold text-slate-800">Agent reservation requested</p>
                  <p className="text-[11px] text-slate-500">Allocated Jordan Lee in standby queue</p>
                </div>
              </div>
              {/* Event 5 */}
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                <div className="leading-tight">
                  <span className="font-mono text-[10px] text-slate-400">14:38:39</span>
                  <p className="font-semibold text-slate-800">Transfer confirmed</p>
                  <p className="text-[11px] text-slate-500">Live handshake complete, 3.2s bridge</p>
                </div>
              </div>
            </div>
          </div>
          {/* Action CTAs */}
          <div className="pt-2 space-y-2">
            <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <span id="drawer-agent-cta" className="">View Agent (Jordan Lee)</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs flex items-center justify-center space-x-1">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="">View Campaign</span>
              </button>
              <button className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs flex items-center justify-center space-x-1">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
                <span className="">SIP Raw Events</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
