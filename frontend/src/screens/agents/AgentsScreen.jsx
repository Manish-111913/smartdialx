"use client";

import { useScreen } from "@/lib/useScreen";
import { mount } from "./behavior";

export default function AgentsScreen() {
  const ui = useScreen(mount);

  return (
    <>
      <div className="font-body-md text-on-surface antialiased selection:bg-indigo-100 selection:text-indigo-900 bg-[#f8fafc] min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col w-full">
          <div className="flex flex-col gap-space-lg p-space-lg lg:p-space-xl">
            {/* Page Header & Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Agent Management</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-mono-xs font-label-mono-xs bg-surface-container-high text-secondary font-semibold">Cluster-US-East</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">Monitor agent availability, assignments, and readiness across your campaigns.</p>
              </div>
              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-space-sm">
                {/* Search */}
                <div className="relative flex items-center min-w-[240px] sm:w-64">
                  <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-outline pointer-events-none">search</span>
                  <input className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm transition-all focus:outline-none placeholder:text-outline-variant py-0" id="agent-search-input" onInput={(e) => ui(e).filterAgentsTable()} placeholder="Search agents by name or ID..." type="text" />
                </div>
                {/* Filter Trigger */}
                <button className="relative h-8 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-colors" onClick={(e) => ui(e).toggleFilterBar()} type="button">
                  <span className="material-symbols-outlined text-[16px] text-secondary">tune</span>
                  <span className="font-medium">Filter</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                </button>
                {/* Refresh Action */}
                <button className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant flex items-center justify-center shadow-sm transition-transform active:rotate-180" onClick={(e) => ui(e).refreshAgentTelemetry()} title="Refresh Agent Roster" type="button">
                  <span className="material-symbols-outlined text-[17px]">sync</span>
                </button>
                {/* Primary CTA: Add Agent */}
                <button className="h-8 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-body-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-colors" onClick={(e) => ui(e).openAddAgentModal()} type="button">
                  <span className="material-symbols-outlined text-[17px]">person_add</span>
                  <span className="font-medium">+ Add Agent</span>
                </button>
              </div>
            </div>
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-lg">
              {/* 1. Total Agents (Indigo Accent) */}
              <div className="relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Total Agents</span>
                    <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight" id="kpi-total">36</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
                  <span className="">Configured roster capacity</span>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">3 Clusters</span>
                </div>
              </div>
              {/* 2. Available (Teal/Emerald Accent) */}
              <div className="relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Available</span>
                    <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight" id="kpi-avail">14</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  </div>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
                  <span className="">Ready for transfer queue</span>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold border border-teal-200/60">38.9% Pool</span>
                </div>
              </div>
              {/* 3. On Calls (Emerald/Cyan Accent) */}
              <div className="relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">On Calls</span>
                    <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight" id="kpi-calls">12</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">support_agent</span>
                  </div>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
                  <span className="">Active live conversations</span>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">Avg 02m 44s</span>
                </div>
              </div>
              {/* 4. Paused / Offline (Amber Accent) */}
              <div className="relative bg-white rounded-xl p-space-lg shadow-sm border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all group overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider font-semibold text-slate-400">Paused / Offline</span>
                    <span className="font-display-kpi text-[30px] font-bold text-slate-900 mt-1 tracking-tight" id="kpi-paused">10</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">bedtime</span>
                  </div>
                </div>
                <div className="mt-space-md pt-space-xs flex items-center justify-between text-slate-500 font-body-sm text-body-sm border-t border-slate-100">
                  <span className="">
                    Break{" "}
                    &amp;
                    {" "}Standby states
                  </span>
                  <span className="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200/60">8P / 2Off</span>
                </div>
              </div>
            </div>
            {/* Agent Status Distribution & Segmented Bar */}
            <div className="rounded-xl bg-white p-space-xl shadow-sm border border-slate-200/80 flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm font-bold text-slate-900">
                    Agent Availability{" "}
                    &amp;
                    {" "}Distribution
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-label-mono-xs font-label-mono-xs bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-semibold">Realtime 1s Polling</span>
                </div>
                {/* Filter pills */}
                <div className="flex flex-wrap items-center gap-1.5" id="status-quick-pills">
                  <button className="pill-btn active px-3 py-1 rounded-lg text-label-ui font-label-ui bg-slate-900 text-white shadow-xs transition-colors" onClick={(e) => ui(e).setQuickFilter('ALL')} type="button">All (36)</button>
                  <button className="pill-btn px-3 py-1 rounded-lg text-label-ui font-label-ui bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors" onClick={(e) => ui(e).setQuickFilter('Available')} type="button">Available (14)</button>
                  <button className="pill-btn px-3 py-1 rounded-lg text-label-ui font-label-ui bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors" onClick={(e) => ui(e).setQuickFilter('Connected')} type="button">Active Call (12)</button>
                  <button className="pill-btn px-3 py-1 rounded-lg text-label-ui font-label-ui bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors" onClick={(e) => ui(e).setQuickFilter('Reserved_Dialing')} type="button">Reserved / Dialing (5)</button>
                  <button className="pill-btn px-3 py-1 rounded-lg text-label-ui font-label-ui bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors" onClick={(e) => ui(e).setQuickFilter('Inactive')} type="button">Inactive (5)</button>
                </div>
              </div>
              {/* Segmented Bar Visualization */}
              <div className="flex flex-col gap-space-xs mt-1">
                <div className="h-3.5 w-full rounded-md overflow-hidden flex bg-slate-100 ring-1 ring-slate-200/70">
                  {/* Available (14/36 = 38.8%) */}
                  <div className="bg-teal-500 hover:opacity-90 transition-opacity cursor-pointer" onClick={(e) => ui(e).setQuickFilter('Available')} style={{ width: "38.8%" }} title="Available: 14 agents (38.8%)" />
                  {/* Connected (12/36 = 33.3%) */}
                  <div className="bg-emerald-500 hover:opacity-90 transition-opacity cursor-pointer" onClick={(e) => ui(e).setQuickFilter('Connected')} style={{ width: "33.3%" }} title="Connected: 12 agents (33.3%)" />
                  {/* Reserved (3/36 = 8.3%) */}
                  <div className="bg-amber-500 hover:opacity-90 transition-opacity cursor-pointer" onClick={(e) => ui(e).setQuickFilter('Reserved')} style={{ width: "8.3%" }} title="Reserved: 3 agents (8.3%)" />
                  {/* Dialing (2/36 = 5.5%) */}
                  <div className="bg-blue-500 hover:opacity-90 transition-opacity cursor-pointer" onClick={(e) => ui(e).setQuickFilter('Dialing')} style={{ width: "5.5%" }} title="Dialing: 2 agents (5.5%)" />
                  {/* Wrap-up (2/36 = 5.5%) */}
                  <div className="bg-indigo-500 hover:opacity-90 transition-opacity cursor-pointer" onClick={(e) => ui(e).setQuickFilter('Wrap-up')} style={{ width: "5.5%" }} title="Wrap-up: 2 agents (5.5%)" />
                  {/* Paused (1/36 = 2.8%) */}
                  <div className="bg-slate-400 hover:opacity-90 transition-opacity cursor-pointer" onClick={(e) => ui(e).setQuickFilter('Paused')} style={{ width: "2.8%" }} title="Paused: 1 agent (2.8%)" />
                  {/* Offline (2/36 = 5.8%) */}
                  <div className="bg-slate-300 hover:opacity-90 transition-opacity cursor-pointer" onClick={(e) => ui(e).setQuickFilter('Offline')} style={{ width: "5.8%" }} title="Offline: 2 agents (5.8%)" />
                </div>
                {/* Segmented Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
                  <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-teal-50/60 border border-teal-100/80 cursor-pointer hover:bg-teal-100/60 transition-colors" onClick={(e) => ui(e).setQuickFilter('Available')}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="font-body-sm text-[12px] text-slate-700 font-medium">Available</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm font-bold text-teal-800">14</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100/80 cursor-pointer hover:bg-emerald-100/60 transition-colors" onClick={(e) => ui(e).setQuickFilter('Connected')}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-body-sm text-[12px] text-slate-700 font-medium">Connected</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm font-bold text-emerald-800">12</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-amber-50/60 border border-amber-100/80 cursor-pointer hover:bg-amber-100/60 transition-colors" onClick={(e) => ui(e).setQuickFilter('Reserved')}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-body-sm text-[12px] text-slate-700 font-medium">Reserved</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm font-bold text-amber-800">3</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-blue-50/60 border border-blue-100/80 cursor-pointer hover:bg-blue-100/60 transition-colors" onClick={(e) => ui(e).setQuickFilter('Dialing')}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-body-sm text-[12px] text-slate-700 font-medium">Dialing</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm font-bold text-blue-800">2</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100/80 cursor-pointer hover:bg-indigo-100/60 transition-colors" onClick={(e) => ui(e).setQuickFilter('Wrap-up')}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-body-sm text-[12px] text-slate-700 font-medium">Wrap-up</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm font-bold text-indigo-800">2</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-slate-100/70 border border-slate-200/70 cursor-pointer hover:bg-slate-200/60 transition-colors" onClick={(e) => ui(e).setQuickFilter('Paused')}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span className="font-body-sm text-[12px] text-slate-700 font-medium">Paused</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm font-bold text-slate-800">1</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-slate-100/70 border border-slate-200/70 cursor-pointer hover:bg-slate-200/60 transition-colors" onClick={(e) => ui(e).setQuickFilter('Offline')}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      <span className="font-body-sm text-[12px] text-slate-700 font-medium">Offline</span>
                    </div>
                    <span className="font-label-mono-sm text-label-mono-sm font-bold text-slate-800">2</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Main Workspace Split: Table Area + Interactive Side Drawer */}
            <div className="w-full flex flex-col">
              {/* Table Section Container (Now Full Width & Breathing Room) */}
              <div className="w-full rounded-xl bg-white shadow-sm border border-slate-200/80 flex flex-col overflow-hidden">
                {/* Table Toolbar & Filters */}
                <div className="p-space-md lg:px-space-xl lg:py-space-md flex flex-col gap-space-sm bg-white border-b border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-headline-sm text-headline-sm font-bold text-slate-900">All Agents</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-label-mono-xs font-label-mono-xs bg-slate-100 text-slate-600 font-semibold border border-slate-200" id="table-roster-count">36 total • 10 in view</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-space-xs text-label-mono-xs font-label-mono-xs text-slate-500">
                        <span className="">Auto-refresh:</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                          ACTIVE (3s)
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Extended Filter Bar */}
                  <div className="flex flex-wrap items-center gap-space-xs pt-1" id="filter-bar">
                    {/* Status Dropdown */}
                    <select className="h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-body-sm text-body-sm focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors py-0" id="filter-status-select" onChange={(e) => ui(e).filterAgentsTable()}>
                      <option value="">Status: All States</option>
                      <option value="Available">Available</option>
                      <option value="Connected">Connected</option>
                      <option value="Dialing">Dialing</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Wrap-up">Wrap-up</option>
                      <option value="Paused">Paused</option>
                      <option value="Offline">Offline</option>
                    </select>
                    {/* Campaign Dropdown */}
                    <select className="h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-body-sm text-body-sm focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors py-0" id="filter-campaign-select" onChange={(e) => ui(e).filterAgentsTable()}>
                      <option value="">All Campaigns</option>
                      <option value="Q3 Renewal Outreach">Q3 Renewal Outreach</option>
                      <option value="Auto Claims Pilot">Auto Claims Pilot</option>
                      <option value="Cold Inquiries Tier 1">Cold Inquiries Tier 1</option>
                    </select>
                    {/* Sort Dropdown */}
                    <select className="h-8 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-body-sm text-body-sm focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors py-0" id="sort-select" onChange={(e) => ui(e).sortAgentsTable()}>
                      <option value="time">Sort by: Time in State</option>
                      <option value="name">Sort by: Agent Name</option>
                      <option value="activity">Sort by: Last Activity</option>
                    </select>
                    {/* Reset Link */}
                    <button className="h-8 px-3 text-slate-500 hover:text-rose-600 font-body-sm text-body-sm flex items-center gap-1 transition-colors rounded-lg hover:bg-rose-50" onClick={(e) => ui(e).resetAllFilters()} type="button">
                      <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                      <span className="font-medium">Reset</span>
                    </button>
                  </div>
                </div>
                {/* Table Responsive Wrapper */}
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse" id="agents-table">
                    <thead>
                      <tr className="h-9 bg-slate-50/80 text-slate-500 font-label-ui text-label-ui uppercase tracking-wider select-none border-b border-slate-100">
                        <th className="py-2.5 px-space-lg font-semibold">Agent</th>
                        <th className="py-2.5 px-space-md font-semibold">Status</th>
                        <th className="py-2.5 px-space-md font-semibold">Current Campaign</th>
                        <th className="py-2.5 px-space-md font-semibold">Current Call</th>
                        <th className="py-2.5 px-space-md font-semibold">Time in State</th>
                        <th className="py-2.5 px-space-md font-semibold">Last Activity</th>
                        <th className="py-2.5 px-space-lg text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-body-md text-body-md text-slate-800" id="agent-table-body">
                      {/* Row 1: Alex Morgan */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1024" onClick={(e) => ui(e).selectAgent('AG-1024')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-indigo-100">AM</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Alex Morgan</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1024</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-900 truncate max-w-[200px]">Q3 Renewal Outreach</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-indigo-600 font-bold">#SC-8921</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">03m 42s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">Just now</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1024')} title="Inspect Agent" type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" title="Quick Options" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 2: Priya Sharma */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1048" onClick={(e) => ui(e).selectAgent('AG-1048')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-teal-100">PS</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Priya Sharma</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1048</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-teal-50 border border-teal-200 text-teal-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Available
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-900 truncate max-w-[200px]">Auto Claims Pilot</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-400">—</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">14m 22s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">2m ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1048')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 3: Jordan Lee */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group bg-surface-container-high/30" data-agent-id="AG-1089" onClick={(e) => ui(e).selectAgent('AG-1089')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-indigo-100">JL</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Jordan Lee</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1089</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-900 truncate max-w-[200px]">Cold Inquiries Tier 1</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-indigo-600 font-bold">#SC-9042</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">01m 15s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">1m ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1089')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 4: Sam Taylor */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1102" onClick={(e) => ui(e).selectAgent('AG-1102')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-amber-100">ST</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Sam Taylor</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1102</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Reserved
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-900 truncate max-w-[200px]">Q3 Renewal Outreach</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-500">Pending Bot Handshake</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">45s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">45s ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1102')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 5: Maya Patel */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1115" onClick={(e) => ui(e).selectAgent('AG-1115')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-blue-100">MP</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Maya Patel</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1115</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                            Dialing
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-900 truncate max-w-[200px]">Auto Claims Pilot</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-blue-600 font-bold">#SC-8819</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">18s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">18s ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1115')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 6: Marcus Vance */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1130" onClick={(e) => ui(e).selectAgent('AG-1130')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-purple-100">MV</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Marcus Vance</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1130</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            Wrap-up
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-900 truncate max-w-[200px]">Q3 Renewal Outreach</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-500">#SC-8740 (ended)</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">01m 02s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">1m ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1130')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 7: Elena Rostova */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1142" onClick={(e) => ui(e).selectAgent('AG-1142')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-teal-100">ER</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Elena Rostova</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1142</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-teal-50 border border-teal-200 text-teal-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            Available
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-900 truncate max-w-[200px]">Cold Inquiries Tier 1</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-400">—</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">05m 50s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">5m ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1142')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 8: David Kim */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1165" onClick={(e) => ui(e).selectAgent('AG-1165')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-slate-100">DK</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">David Kim</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1165</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Paused
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-400 truncate max-w-[200px]">—</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-400">—</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">22m 14s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">22m ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1165')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 9: Chloe Bennett */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1180" onClick={(e) => ui(e).selectAgent('AG-1180')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 shadow-xs ring-2 ring-indigo-100">CB</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Chloe Bennett</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1180</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-900 truncate max-w-[200px]">Q3 Renewal Outreach</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-indigo-600 font-bold">#SC-8699</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">04m 10s</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">4m ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1180')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Row 10: Lucas Chen */}
                      <tr className="agent-row h-14 hover:bg-slate-50/80 transition-colors cursor-pointer group" data-agent-id="AG-1194" onClick={(e) => ui(e).selectAgent('AG-1194')}>
                        <td className="py-3 px-space-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-label-mono-xs text-label-mono-xs font-bold shrink-0 ring-2 ring-slate-100">LC</div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">Lucas Chen</span>
                              <span className="font-label-mono-xs text-label-mono-xs text-slate-400 font-medium">AG-1194</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-xs text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Offline
                          </span>
                        </td>
                        <td className="py-3 px-space-md whitespace-nowrap font-medium text-slate-400 truncate max-w-[200px]">—</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-400">—</td>
                        <td className="py-3 px-space-md whitespace-nowrap font-label-mono-xs text-label-mono-xs text-slate-700 font-medium">01h 12m</td>
                        <td className="py-3 px-space-md whitespace-nowrap text-slate-500 font-body-sm text-body-sm">1h ago</td>
                        <td className="py-3 px-space-lg text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-lg hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors" onClick={(e) => ui(e).selectAgent('AG-1194')} type="button">
                              <span className="material-symbols-outlined text-[19px]">visibility</span>
                            </button>
                            <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors" type="button">
                              <span className="material-symbols-outlined text-[19px]">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* Table Pagination Footer */}
                <div className="p-space-md lg:px-space-xl flex flex-col sm:flex-row items-center justify-between gap-space-sm bg-white border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 font-label-mono-xs text-label-mono-xs">
                    <span className="">
                      Showing{" "}
                      <strong className="text-slate-800 font-semibold">1-10</strong>
                      {" "}of 36 agents
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="h-8 px-2.5 rounded-lg bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed font-label-mono-xs text-label-mono-xs flex items-center gap-1" disabled type="button">
                      <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                      Previous
                    </button>
                    <span className="h-8 px-3 rounded-lg bg-slate-900 text-white font-label-mono-xs text-label-mono-xs flex items-center justify-center font-bold shadow-xs">1</span>
                    <button className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-label-mono-xs text-label-mono-xs flex items-center justify-center font-medium transition-colors" type="button">2</button>
                    <button className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-label-mono-xs text-label-mono-xs flex items-center justify-center font-medium transition-colors" type="button">3</button>
                    <button className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-label-mono-xs text-label-mono-xs flex items-center gap-1 font-medium transition-colors" type="button">
                      Next
                      <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Interactive Slide-Over Flyout Drawer & Backdrop */}
              <div className="pointer-events-none fixed inset-0 z-50 transition-all duration-300" id="agent-slideover-container">
                {/* Backdrop */}
                <div aria-hidden="true" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs opacity-0 transition-opacity duration-300 pointer-events-none" id="drawer-backdrop" onClick={(e) => ui(e).closeDrawer()} />
                {/* Slide-over Drawer Panel */}
                <aside aria-expanded="true" aria-label="Agent Details Drawer" className="fixed right-0 top-14 h-[calc(100vh-56px)] w-full sm:w-[420px] bg-white shadow-2xl flex flex-col z-50 transform translate-x-0 transition-transform duration-300 ease-out border-l border-slate-200 select-none overflow-y-auto pointer-events-auto" id="agent-drawer">
                  <div className="p-6 bg-slate-50/70 border-b border-slate-200/80 flex items-start justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-headline-sm text-[16px] font-bold shadow-xs ring-2 ring-indigo-100" id="drawer-avatar">JL</div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-[16px] text-slate-900 font-bold tracking-tight" id="drawer-name">Jordan Lee</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-mono-xs text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700" id="drawer-status-badge">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                          </span>
                        </div>
                        <span className="font-label-mono-xs text-label-mono-xs text-slate-500 font-medium" id="drawer-id">AG-1089 • Outbound SDR Lead</span>
                      </div>
                    </div>
                    <button aria-label="Close Agent Details" className="relative z-10 cursor-pointer pointer-events-auto w-8 h-8 rounded-lg hover:bg-slate-200/70 active:bg-slate-300 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors" id="close-drawer-btn" onClick={(e) => ui(e).closeDrawer()} title="Close inspector" type="button">
                      <span className="material-symbols-outlined text-[20px] pointer-events-none">close</span>
                    </button>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-1">
                        <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Current Campaign</span>
                        <span className="font-body-sm text-[13px] font-semibold text-slate-900 truncate" id="drawer-campaign">Cold Inquiries Tier 1</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-1">
                        <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Active Call</span>
                        <span className="font-label-mono-xs text-[12px] font-bold text-indigo-600 truncate" id="drawer-active-call">#SC-9042 (Live: 01m 15s)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-1">
                        <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Audio Provider</span>
                        <span className="font-label-mono-xs text-[11px] text-slate-700 font-medium truncate" id="drawer-audio-provider">Mock SIP Gateway (24ms ping)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-1">
                        <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Telephony Route</span>
                        <span className="font-body-sm text-[12px] text-slate-700 font-medium truncate" id="drawer-route">Predictive Dial Handover</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-1">
                        <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Time In State</span>
                        <span className="font-label-mono-xs text-[13px] font-semibold text-slate-900" id="drawer-time-state">01m 15s</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-1">
                        <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total Calls Today</span>
                        <span className="font-label-mono-xs text-[11px] text-slate-700 font-medium" id="drawer-total-calls">19 calls (Avg duration: 02m 45s)</span>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-2.5" id="drawer-waveform-box">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-indigo-600">mic</span>
                          <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">RX/TX Audio Flow</span>
                        </div>
                        <span className="font-label-mono-xs text-label-mono-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">G.711u / 64 kbps</span>
                      </div>
                      <div className="w-full h-9 flex items-center justify-between gap-1 px-3 py-1 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
                        <div className="w-1.5 bg-indigo-600 rounded-full h-3 animate-pulse" />
                        <div className="w-1.5 bg-indigo-500 rounded-full h-5" />
                        <div className="w-1.5 bg-indigo-600 rounded-full h-7 animate-pulse" />
                        <div className="w-1.5 bg-indigo-500 rounded-full h-4" />
                        <div className="w-1.5 bg-indigo-600 rounded-full h-6 animate-pulse" />
                        <div className="w-1.5 bg-indigo-500 rounded-full h-3" />
                        <div className="w-1.5 bg-indigo-600 rounded-full h-5 animate-pulse" />
                        <div className="w-1.5 bg-indigo-700 rounded-full h-8" />
                        <div className="w-1.5 bg-indigo-600 rounded-full h-6 animate-pulse" />
                        <div className="w-1.5 bg-indigo-500 rounded-full h-4" />
                        <div className="w-1.5 bg-indigo-400 rounded-full h-2" />
                        <div className="w-1.5 bg-indigo-600 rounded-full h-5 animate-pulse" />
                        <div className="w-1.5 bg-indigo-700 rounded-full h-7" />
                        <div className="w-1.5 bg-indigo-600 rounded-full h-6 animate-pulse" />
                        <div className="w-1.5 bg-indigo-500 rounded-full h-4" />
                        <div className="w-1.5 bg-indigo-400 rounded-full h-2 animate-pulse" />
                        <div className="w-1.5 bg-indigo-500 rounded-full h-4" />
                        <div className="w-1.5 bg-indigo-600 rounded-full h-6 animate-pulse" />
                        <div className="w-1.5 bg-indigo-500 rounded-full h-3" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Supervisor Overrides</span>
                      <div className="flex flex-col gap-2" id="drawer-connected-actions">
                        <button className="w-full h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-body-sm text-body-sm flex items-center justify-center gap-1.5 font-semibold transition-colors shadow-xs" onClick={(e) => ui(e).triggerAudioMonitor()} type="button">
                          <span className="material-symbols-outlined text-[17px] text-cyan-300">headphones</span>
                          <span className="">Monitor Audio (Simulated)</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="h-8 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-body-sm text-[12px] flex items-center justify-center gap-1 font-medium transition-colors border border-slate-200 shadow-2xs" onClick={(e) => ui(e).triggerAgentAction('Initiating Wrap-up')} type="button">
                            <span className="material-symbols-outlined text-[16px] text-indigo-600">assignment_turned_in</span>
                            <span className="">Initiate Wrap-up</span>
                          </button>
                          <button className="h-8 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-body-sm text-[12px] flex items-center justify-center gap-1 font-medium transition-colors border border-slate-200 shadow-2xs" onClick={(e) => ui(e).triggerAgentAction('Queued Pause after call')} type="button">
                            <span className="material-symbols-outlined text-[16px] text-slate-500">pause</span>
                            <span className="">Pause after call</span>
                          </button>
                        </div>
                      </div>
                      <div className="hidden flex-col gap-2" id="drawer-available-actions">
                        <button className="w-full h-8 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 font-body-sm text-[12px] flex items-center justify-center gap-1.5 font-medium transition-colors border border-slate-200" onClick={(e) => ui(e).triggerAgentAction('Agent Paused')} type="button">
                          <span className="material-symbols-outlined text-[16px] text-slate-500">pause_circle</span>
                          <span className="">Pause Agent</span>
                        </button>
                        <button className="w-full h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-body-sm text-body-sm flex items-center justify-center gap-1.5 font-semibold transition-colors shadow-xs" onClick={(e) => ui(e).triggerAgentAction('Reassigned to campaign')} type="button">
                          <span className="material-symbols-outlined text-[17px] text-cyan-300">campaign</span>
                          <span className="">Assign to Campaign</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                      <span className="font-label-ui text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Recent Event Stream</span>
                      <div className="flex flex-col gap-3 relative pl-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200" id="drawer-timeline">
                        <div className="relative flex flex-col gap-0.5">
                          <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                          <span className="font-label-mono-xs text-label-mono-xs text-indigo-600 font-semibold">14:43:30</span>
                          <span className="font-body-sm text-body-sm text-slate-800">Handed off from dialer predictive trunk</span>
                        </div>
                        <div className="relative flex flex-col gap-0.5">
                          <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
                          <span className="font-label-mono-xs text-label-mono-xs text-teal-700 font-semibold">14:40:12</span>
                          <span className="font-body-sm text-body-sm text-slate-800">Available standby queue</span>
                        </div>
                        <div className="relative flex flex-col gap-0.5">
                          <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-slate-400 ring-2 ring-white" />
                          <span className="font-label-mono-xs text-label-mono-xs text-slate-600 font-semibold">14:25:00</span>
                          <span className="font-body-sm text-body-sm text-slate-800">Completed wrap-up for previous call</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
          {/* Notification Toast for Simulated Actions */}
          <div className="fixed bottom-6 right-6 z-50 transform transition-all duration-300 flex items-center gap-3 px-4 py-3 rounded-lg bg-inverse-surface text-inverse-on-surface shadow-xl opacity-0 pointer-events-none translate-y-10" id="agent-action-toast">
            <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim" id="toast-icon">info</span>
            <span className="font-body-sm text-body-sm font-medium" id="toast-message">Drawer minimized. Click any row to re-open.</span>
          </div>
          {/* Add Agent Modal (Mock / Prototype) */}
          <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-xs hidden items-center justify-center p-4 transition-opacity" id="add-agent-modal">
            <div className="w-full max-w-md rounded-xl bg-surface-container-lowest shadow-2xl p-space-lg flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-secondary">person_add</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Add New Agent</h3>
                </div>
                <button className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface" onClick={(e) => ui(e).closeAddAgentModal()} type="button">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Provision an agent slot to the SmartDialX SIP orchestrator and assign immediate queue eligibility.</p>
              <form className="flex flex-col gap-space-sm" onSubmit={(e) => ui(e).handleCreateAgent(e)}>
                <div className="flex flex-col gap-1">
                  <label className="font-label-ui text-label-ui uppercase tracking-wider text-outline font-semibold">Full Name</label>
                  <input className="h-8 px-3 rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none py-0" placeholder="e.g. Rachel Hernandez" required type="text" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-ui text-label-ui uppercase tracking-wider text-outline font-semibold">Agent ID / Extension</label>
                  <input className="h-8 px-3 rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none py-0" placeholder="e.g. AG-1210" required type="text" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-ui text-label-ui uppercase tracking-wider text-outline font-semibold">Initial Campaign</label>
                  <select className="h-8 px-3 rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none cursor-pointer py-0">
                    <option>Q3 Renewal Outreach</option>
                    <option>Auto Claims Pilot</option>
                    <option>Cold Inquiries Tier 1</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-ui text-label-ui uppercase tracking-wider text-outline font-semibold">SIP Routing Node</label>
                  <select className="h-8 px-3 rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none cursor-pointer py-0">
                    <option>SIP-Sim v2 (Low-latency cluster)</option>
                    <option>Direct WebRTC Gateway</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button className="h-8 px-3 rounded hover:bg-surface-container text-on-surface-variant font-body-sm text-body-sm" onClick={(e) => ui(e).closeAddAgentModal()} type="button">Cancel</button>
                  <button className="h-8 px-4 rounded bg-primary hover:bg-primary-container text-on-primary font-body-sm text-body-sm font-medium" type="submit">
                    Save{" "}
                    &amp;
                    {" "}Activate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* Client-side Interactive Logic */}
      </div>
    </>
  );
}
