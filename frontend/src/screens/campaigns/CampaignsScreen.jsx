"use client";

import { useScreen } from "@/lib/useScreen";
import { mount } from "./behavior";

export default function CampaignsScreen() {
  const ui = useScreen(mount);

  return (
    <>
      <div className="font-sans text-[#172033] antialiased selection:bg-blue-100 selection:text-blue-900 bg-[#F6F8FB] min-h-[calc(100vh-3.5rem)]">
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* PAGE TITLE & MAIN ACTIONS HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[22px] font-bold text-[#172033] tracking-tight">Campaign Management</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] border border-slate-200">SIP-Trunk-Live: 140ch</span>
              </div>
              <p className="text-[13px] text-[#667085] mt-0.5">Configure calling campaigns, screening behavior, and dialing strategies.</p>
            </div>
            {/* Top Toolbar Right Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[17px] pointer-events-none">search</span>
                {" "}
                <input className="w-full h-8 pl-8 pr-3 bg-white text-[#172033] placeholder:text-slate-400 text-[12px] rounded-lg border border-[#E5EAF1] shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all py-0" id="campaign-search-input" onInput={(e) => ui(e).filterCampaignRows()} placeholder="Search campaigns..." type="text" />
              </div>
              {/* Filters Toggle Button */}
              <div className="relative inline-block text-left" id="filter-dropdown-container">
                <button className="h-8 px-2.5 rounded-lg bg-white border border-[#E5EAF1] text-slate-600 hover:text-slate-900 text-[12px] font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer" onClick={(e) => ui(e).toggleFilterMenu()} type="button">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">tune</span>
                  <span>Filters</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 hidden" id="active-filter-indicator" />
                  <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
                </button>
                {/* Popover Menu */}
                <div className="hidden absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl z-50 p-3 flex flex-col gap-3 border border-[#E5EAF1]" id="filter-menu-popover">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono text-[10px] uppercase font-semibold text-slate-400">Filter Criteria</span>
                    <button className="font-mono text-[10px] text-blue-600 hover:underline cursor-pointer" onClick={(e) => ui(e).resetFilters()}>Reset all</button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-slate-400 uppercase">Status</label>
                    <select className="h-7 px-2 bg-slate-50 border border-[#E5EAF1] text-slate-800 rounded text-[12px] focus:outline-none py-0" id="filter-select-status" onChange={(e) => ui(e).applyDropdownFilters()}>
                      <option value="ALL">All States</option>
                      <option value="Running">Running</option>
                      <option value="Paused">Paused</option>
                      <option value="Completed">Completed</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-slate-400 uppercase">Dialing Mode</label>
                    <select className="h-7 px-2 bg-slate-50 border border-[#E5EAF1] text-slate-800 rounded text-[12px] focus:outline-none py-0" id="filter-select-mode" onChange={(e) => ui(e).applyDropdownFilters()}>
                      <option value="ALL">All Modes</option>
                      <option value="Predictive">Predictive</option>
                      <option value="Progressive">Progressive</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[10px] text-slate-400 uppercase">AI Screening</label>
                    <select className="h-7 px-2 bg-slate-50 border border-[#E5EAF1] text-slate-800 rounded text-[12px] focus:outline-none py-0" id="filter-select-screening" onChange={(e) => ui(e).applyDropdownFilters()}>
                      <option value="ALL">All Strategies</option>
                      <option value="AI Screened">AI Screened</option>
                      <option value="Direct Dial">Direct Dial</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Refresh Button with Spin Effect */}
              <button className="w-8 h-8 rounded-lg bg-white border border-[#E5EAF1] text-slate-600 hover:text-blue-600 hover:bg-slate-50 shadow-xs flex items-center justify-center transition-all cursor-pointer" onClick={(e) => ui(e).refreshTableData()} title="Refresh dataset">
                <span className="material-symbols-outlined text-[17px] text-slate-400 transition-transform duration-500" id="refresh-icon">refresh</span>
              </button>
              {/* Primary + Create Campaign Button */}
              <button className="h-8 px-3 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-[12.5px] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer" onClick={(e) => ui(e).openCreateModal()}>
                <span className="material-symbols-outlined text-[17px]">add</span>
                <span>Create Campaign</span>
              </button>
            </div>
          </div>
          {/* 4 SUMMARY KPI CARDS (Grid matching design system) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Campaigns */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E5EAF1] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-semibold tracking-wider text-slate-400">TOTAL CAMPAIGNS</span>
                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[15px]">folder_copy</span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-slate-900 leading-none">12</span>
                <span className="font-mono text-[10.5px] text-slate-500 font-medium">+2 this week</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 truncate">Configured outreach flows</div>
            </div>
            {/* Running */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E5EAF1] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-semibold tracking-wider text-slate-400">RUNNING</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-emerald-600 leading-none">4</span>
                <span className="font-mono text-[10.5px] text-emerald-700 font-medium">10,200 leads queue</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 truncate">Active voice dispatch</div>
            </div>
            {/* Paused */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E5EAF1] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-semibold tracking-wider text-slate-400">PAUSED</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[10px] font-bold border border-amber-200/60">HOLD</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-amber-600 leading-none">3</span>
                <span className="font-mono text-[10.5px] text-amber-700 font-medium">Manual hold</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 truncate">Awaiting supervisor resume</div>
            </div>
            {/* Completed */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E5EAF1] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-semibold tracking-wider text-slate-400">COMPLETED</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[9.5px] font-bold border border-indigo-200/60">TARGET REACHED</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[28px] font-bold text-slate-900 leading-none">5</span>
                <span className="font-mono text-[10.5px] text-slate-500 font-medium">Target reached</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 truncate">
                Archived{" "}
                &amp;
                {" "}target met
              </div>
            </div>
          </div>
          {/* MAIN DATA TABLE SECTION: ALL CAMPAIGNS */}
          <div className="bg-white rounded-xl border border-[#E5EAF1] shadow-xs overflow-hidden flex flex-col">
            {/* Table Header Toolbar */}
            <div className="px-4 py-2.5 bg-slate-50/70 border-b border-[#E5EAF1] flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-bold text-slate-900">All Campaigns</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-mono text-[10.5px] font-medium" id="campaign-counter-badge">12 total • 7 in view</span>
                <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Auto-refresh: ACTIVE (5s)</span>
                </div>
              </div>
              {/* Quick Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button className="status-tab px-2.5 py-1 rounded-md bg-white border border-[#E5EAF1] text-blue-600 font-semibold text-[11.5px] shadow-2xs cursor-pointer transition-all" onClick={(e) => ui(e).quickFilterStatus('ALL')}>All States</button>
                <button className="status-tab px-2.5 py-1 rounded-md text-slate-600 hover:bg-slate-100 text-[11.5px] font-medium cursor-pointer transition-all" onClick={(e) => ui(e).quickFilterStatus('Running')}>Running</button>
                <button className="status-tab px-2.5 py-1 rounded-md text-slate-600 hover:bg-slate-100 text-[11.5px] font-medium cursor-pointer transition-all" onClick={(e) => ui(e).quickFilterStatus('Paused')}>Paused</button>
                <button className="status-tab px-2.5 py-1 rounded-md text-slate-600 hover:bg-slate-100 text-[11.5px] font-medium cursor-pointer transition-all" onClick={(e) => ui(e).quickFilterStatus('Completed')}>Completed</button>
                <button className="text-blue-600 font-mono text-[11px] hover:underline ml-1 cursor-pointer" onClick={(e) => ui(e).resetFilters()}>Reset</button>
              </div>
            </div>
            {/* Enterprise Data Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse" id="campaigns-table">
                <thead>
                  <tr className="h-9 bg-slate-50/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider select-none border-b border-[#E5EAF1]">
                    <th className="py-2 px-4 font-semibold">CAMPAIGN NAME</th>
                    <th className="py-2 px-3 font-semibold">STATUS</th>
                    <th className="py-2 px-3 font-semibold">DIALING MODE</th>
                    <th className="py-2 px-3 font-semibold">SCREENING</th>
                    <th className="py-2 px-3 font-semibold text-right">CALL TARGETS</th>
                    <th className="py-2 px-3 font-semibold text-right">CONNECTED</th>
                    <th className="py-2 px-3 font-semibold">AGENT POOL</th>
                    <th className="py-2 px-3 font-semibold">LAST UPDATED</th>
                    <th className="py-2 px-3 font-semibold text-center w-20">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF1] text-[12.5px]" id="campaign-table-body">
                  {/* Row 1: Q3 Renewal Outreach */}
                  <tr className="h-12 hover:bg-blue-50/30 cursor-pointer transition-colors campaign-row group" data-index="0" data-mode="Predictive" data-name="Q3 Renewal Outreach" data-screening="AI Screened" data-status="Running" onClick={(e) => ui(e).openDetailsDrawer(0)}>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
                          <span>Q3 Renewal Outreach</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-normal">#CMP-104</span>
                        </div>
                        <span className="font-mono text-[10.5px] text-slate-400 truncate max-w-xs">Expiring enterprise licenses auto-dialer</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Running
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-medium border border-blue-100">Predictive</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-medium border border-purple-100">
                        <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                        AI Screened
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-900 font-semibold">2,500</span>
                        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: "33.7%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <span className="text-slate-900 font-semibold">842</span>
                      {" "}
                      <span className="text-slate-400 text-[10.5px] ml-1">(33.7%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">support_agent</span>
                        <span className="truncate">Retention Specialists (12)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">2m ago</td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 action-menu-trigger" onClick={(e) => ui(e).toggleActionMenu(e, 0)}>
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 2: Auto Claims Pilot */}
                  <tr className="h-12 hover:bg-blue-50/30 cursor-pointer transition-colors campaign-row group" data-index="1" data-mode="Progressive" data-name="Auto Claims Pilot" data-screening="AI Screened" data-status="Running" onClick={(e) => ui(e).openDetailsDrawer(1)}>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
                          <span>Auto Claims Pilot</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-normal">#CMP-102</span>
                        </div>
                        <span className="font-mono text-[10.5px] text-slate-400 truncate max-w-xs">First notice of loss callback pipeline</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Running
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[11px] font-medium border border-teal-100">Progressive</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-medium border border-purple-100">
                        <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                        AI Screened
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-900 font-semibold">1,200</span>
                        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full bg-teal-600 rounded-full" style={{ width: "34.2%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <span className="text-slate-900 font-semibold">410</span>
                      {" "}
                      <span className="text-slate-400 text-[10.5px] ml-1">(34.2%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">support_agent</span>
                        <span className="truncate">Claims Adjusters (8)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">5m ago</td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 action-menu-trigger" onClick={(e) => ui(e).toggleActionMenu(e, 1)}>
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 3: Cold Inquiries Tier 1 */}
                  <tr className="h-12 hover:bg-blue-50/30 cursor-pointer transition-colors campaign-row group" data-index="2" data-mode="Predictive" data-name="Cold Inquiries Tier 1" data-screening="AI Screened" data-status="Running" onClick={(e) => ui(e).openDetailsDrawer(2)}>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
                          <span>Cold Inquiries Tier 1</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-normal">#CMP-099</span>
                        </div>
                        <span className="font-mono text-[10.5px] text-slate-400 truncate max-w-xs">High-cadence qualification queue</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Running
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-medium border border-blue-100">Predictive</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-medium border border-purple-100">
                        <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                        AI Screened
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-900 font-semibold">5,000</span>
                        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: "37.8%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <span className="text-slate-900 font-semibold">1,890</span>
                      {" "}
                      <span className="text-slate-400 text-[10.5px] ml-1">(37.8%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">support_agent</span>
                        <span className="truncate">SDR Outbound (16)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-600 font-semibold whitespace-nowrap">Just now</td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 action-menu-trigger" onClick={(e) => ui(e).toggleActionMenu(e, 2)}>
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 4: Customer Follow-up */}
                  <tr className="h-12 hover:bg-blue-50/30 cursor-pointer transition-colors campaign-row group" data-index="3" data-mode="Progressive" data-name="Customer Follow-up" data-screening="Direct Dial" data-status="Paused" onClick={(e) => ui(e).openDetailsDrawer(3)}>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
                          <span>Customer Follow-up</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-normal">#CMP-087</span>
                        </div>
                        <span className="font-mono text-[10.5px] text-slate-400 truncate max-w-xs">Post-resolution satisfaction checkpoints</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono text-[11px] font-semibold border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Paused
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[11px] font-medium border border-teal-100">Progressive</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">Direct Dial</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-900 font-semibold">800</span>
                        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: "77.5%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <span className="text-slate-900 font-semibold">620</span>
                      {" "}
                      <span className="text-slate-400 text-[10.5px] ml-1">(77.5%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                        <span className="truncate">Shared Roster Pool</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">22m ago</td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 action-menu-trigger" onClick={(e) => ui(e).toggleActionMenu(e, 3)}>
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 5: Premium Member Retention */}
                  <tr className="h-12 hover:bg-blue-50/30 cursor-pointer transition-colors campaign-row group" data-index="4" data-mode="Predictive" data-name="Premium Member Retention" data-screening="AI Screened" data-status="Running" onClick={(e) => ui(e).openDetailsDrawer(4)}>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
                          <span>Premium Member Retention</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-normal">#CMP-110</span>
                        </div>
                        <span className="font-mono text-[10.5px] text-slate-400 truncate max-w-xs">VIP escalation and custom portfolio renewals</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Running
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-medium border border-blue-100">Predictive</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-medium border border-purple-100">
                        <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                        AI Screened
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-900 font-semibold">1,500</span>
                        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: "34.7%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <span className="text-slate-900 font-semibold">520</span>
                      {" "}
                      <span className="text-slate-400 text-[10.5px] ml-1">(34.7%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">support_agent</span>
                        <span className="truncate">VIP Tier 1 (6)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">12m ago</td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 action-menu-trigger" onClick={(e) => ui(e).toggleActionMenu(e, 4)}>
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 6: Service Feedback */}
                  <tr className="h-12 hover:bg-blue-50/30 cursor-pointer transition-colors campaign-row group" data-index="5" data-mode="Progressive" data-name="Service Feedback" data-screening="Direct Dial" data-status="Completed" onClick={(e) => ui(e).openDetailsDrawer(5)}>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
                          <span>Service Feedback</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-normal">#CMP-071</span>
                        </div>
                        <span className="font-mono text-[10.5px] text-slate-400 truncate max-w-xs">Quarterly customer pulse survey</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Completed
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[11px] font-medium border border-teal-100">Progressive</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">Direct Dial</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-900 font-semibold">3,000</span>
                        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full bg-slate-400 rounded-full" style={{ width: "96.3%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <span className="text-slate-900 font-semibold">2,890</span>
                      {" "}
                      <span className="text-slate-400 text-[10.5px] ml-1">(96.3%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                        <span className="truncate">Shared Roster Pool</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">1d ago</td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 action-menu-trigger" onClick={(e) => ui(e).toggleActionMenu(e, 5)}>
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Row 7: Q4 Inactive Accounts */}
                  <tr className="h-12 hover:bg-blue-50/30 cursor-pointer transition-colors campaign-row group" data-index="6" data-mode="Predictive" data-name="Q4 Inactive Accounts" data-screening="AI Screened" data-status="Draft" onClick={(e) => ui(e).openDetailsDrawer(6)}>
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 group-hover:text-blue-600">
                          <span>Q4 Inactive Accounts</span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded font-normal">#CMP-115</span>
                        </div>
                        <span className="font-mono text-[10.5px] text-slate-400 truncate max-w-xs">Dormant client wake-up campaign configuration</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-semibold border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Draft
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-medium border border-blue-100">Predictive</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-medium border border-purple-100">
                        <span className="material-symbols-outlined text-[13px]">smart_toy</span>
                        AI Screened
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-900 font-semibold">4,000</span>
                        <div className="w-16 h-1 rounded-full bg-slate-100 overflow-hidden mt-1">
                          <div className="h-full bg-slate-300 rounded-full" style={{ width: "0%" }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11.5px] whitespace-nowrap">
                      <span className="text-slate-900 font-semibold">0</span>
                      {" "}
                      <span className="text-slate-400 text-[10.5px] ml-1">(0.0%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">support_agent</span>
                        <span className="truncate">SDR Outbound (16)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">3h ago</td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block text-left">
                        <button className="w-7 h-7 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 action-menu-trigger" onClick={(e) => ui(e).toggleActionMenu(e, 6)}>
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Table Footer Pagination */}
            <div className="px-4 py-2.5 bg-slate-50/50 border-t border-[#E5EAF1] flex items-center justify-between text-slate-500 text-[12px]">
              <span className="font-mono text-[11px]">Showing rows 1 - 7 of 12 total</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded bg-slate-100 text-slate-400 cursor-not-allowed text-[11px] border border-slate-200" disabled>Previous</button>
                <button className="px-2 py-1 rounded bg-blue-600 text-white font-mono text-[11px] font-semibold">1</button>
                <button className="px-2 py-1 rounded bg-white text-slate-700 hover:bg-slate-100 font-mono text-[11px] border border-[#E5EAF1]">2</button>
                <button className="px-2 py-1 rounded bg-white text-slate-700 hover:bg-slate-100 text-[11px] border border-[#E5EAF1]">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed hidden bg-white rounded-xl shadow-xl z-50 py-1 border border-[#E5EAF1] w-48 text-[12.5px] text-slate-700 font-medium" id="table-popup-menu">
        <button className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-left text-slate-700" onClick={(e) => ui(e).handleMenuAction('view')}>
          <span className="material-symbols-outlined text-[16px] text-slate-400">visibility</span>
          <span>View Details</span>
        </button>
        {" "}
        <button className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-left text-slate-700" onClick={(e) => ui(e).handleMenuAction('edit')}>
          <span className="material-symbols-outlined text-[16px] text-slate-400">edit_note</span>
          <span>Edit Configuration</span>
        </button>
        {" "}
        <button className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-left text-slate-700" id="menu-pause-btn" onClick={(e) => ui(e).handleMenuAction('toggle-pause')}>
          <span className="material-symbols-outlined text-[16px] text-slate-400" id="menu-pause-icon">pause</span>
          <span id="menu-pause-text">Pause Campaign</span>
        </button>
        {" "}
        <button className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 text-left text-slate-700" onClick={(e) => ui(e).handleMenuAction('duplicate')}>
          <span className="material-symbols-outlined text-[16px] text-slate-400">content_copy</span>
          <span>Duplicate</span>
        </button>
        <div className="h-px bg-slate-100 my-1" />
        <button className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 text-left text-red-600" onClick={(e) => ui(e).handleMenuAction('stop')}>
          <span className="material-symbols-outlined text-[16px] text-red-500">stop_circle</span>
          <span>Stop Campaign</span>
        </button>
      </div>
      <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[1px] z-50 transition-opacity duration-300 opacity-0 pointer-events-none" id="details-backdrop" onClick={(e) => ui(e).closeDetailsDrawer()} />
      <aside className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-out flex flex-col justify-between border-l border-[#E5EAF1]" id="details-drawer">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-4 bg-slate-50/70 border-b border-[#E5EAF1] flex items-start justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200/60" id="drawer-campaign-id">#CMP-104</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200/60" id="drawer-campaign-status">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Running
                </span>
              </div>
              <h2 className="text-[17px] font-bold text-slate-900 mt-1 truncate" id="drawer-campaign-name">Q3 Renewal Outreach</h2>
              <span className="text-[12px] text-slate-500">Real-time pacing and provider telemetry</span>
            </div>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer transition-colors" onClick={(e) => ui(e).closeDetailsDrawer()} title="Close Panel">
              <span className="material-symbols-outlined text-[19px]">close</span>
            </button>
          </div>
          {/* Drawer Content */}
          <div className="p-4 flex flex-col gap-4">
            {/* Safety Controller Alert Banner */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-blue-600 text-[19px] shrink-0 mt-0.5">verified_user</span>
              <div className="flex flex-col">
                <span className="text-[12.5px] font-semibold text-blue-900 leading-tight">Safety Controller Active</span>
                <span className="text-[11.5px] text-blue-700 mt-0.5 leading-snug">
                  Automatic rate limiting enabled to prevent queue drop spikes{" "}
                  &amp;
                  {" "}preserve carrier reputation.
                </span>
              </div>
            </div>
            {/* Telemetry 2-Column Info Grid */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-400">OPERATIONAL TELEMETRY</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col">
                  <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">DIALING MODE</span>
                  <span className="text-[13px] text-slate-900 font-semibold mt-0.5" id="drawer-mode">Predictive</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col" id="drawer-screening-box">
                  <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">AI SCREENING ENGINE</span>
                  <span className="text-[13px] text-purple-700 font-semibold mt-0.5 truncate" id="drawer-screening">Voice Bot DialX-v2.1</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col">
                  <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">SIP AUDIO PROVIDER</span>
                  <span className="text-[12.5px] text-slate-900 font-medium mt-0.5">Mock SIP Gateway (A)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col">
                  <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">TARGET VS DIALED</span>
                  <span className="font-mono text-[12.5px] text-slate-900 font-semibold mt-0.5" id="drawer-targets">842 / 2,500</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col screening-metric" id="drawer-screen-attempts-box">
                  <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">SCREENING ATTEMPTS</span>
                  <span className="font-mono text-[12.5px] text-slate-900 font-semibold mt-0.5" id="drawer-screening-attempts">1,420</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col screening-metric" id="drawer-willing-box">
                  <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">WILLING RESPONDENTS</span>
                  <span className="font-mono text-[12.5px] text-emerald-700 font-semibold mt-0.5" id="drawer-willing">885 (62.3% yield)</span>
                </div>
                {/* Transfer Integrity Bar */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">TRANSFER INTEGRITY</span>
                    <span className="font-mono text-[10.5px] text-emerald-700 font-semibold">95.1% confirmed</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "95.1%" }} />
                  </div>
                </div>
                {/* Current Agent Pool */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-[#E5EAF1] flex flex-col col-span-2">
                  <span className="font-mono text-[9.5px] text-slate-400 uppercase font-semibold">CURRENT AGENT POOL</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">groups</span>
                    <span className="text-[12.5px] text-slate-900 font-semibold" id="drawer-pool">Retention Specialists (12 active)</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Realtime Trunk Waveform Visualizer */}
            <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  REALTIME TRUNK WAVEFORM
                </span>
                <span className="font-mono text-[10px] text-blue-400 font-medium">Channel 04 • 8000Hz</span>
              </div>
              <div className="h-12 w-full bg-slate-950/80 rounded-lg flex items-center justify-between px-3 overflow-hidden gap-1 border border-slate-800">
                <span className="w-1 bg-blue-500 rounded-full anim-bar-1" style={{ height: "35%" }} />
                <span className="w-1 bg-blue-400 rounded-full anim-bar-2" style={{ height: "65%" }} />
                <span className="w-1 bg-cyan-400 rounded-full anim-bar-3" style={{ height: "25%" }} />
                <span className="w-1 bg-blue-500 rounded-full anim-bar-4" style={{ height: "85%" }} />
                <span className="w-1 bg-indigo-400 rounded-full anim-bar-5" style={{ height: "55%" }} />
                <span className="w-1 bg-blue-400 rounded-full anim-bar-2" style={{ height: "40%" }} />
                <span className="w-1 bg-cyan-300 rounded-full anim-bar-3" style={{ height: "90%" }} />
                <span className="w-1 bg-blue-500 rounded-full anim-bar-1" style={{ height: "50%" }} />
                <span className="w-1 bg-indigo-500 rounded-full anim-bar-4" style={{ height: "70%" }} />
                <span className="w-1 bg-blue-400 rounded-full anim-bar-5" style={{ height: "80%" }} />
                <span className="w-1 bg-cyan-400 rounded-full anim-bar-2" style={{ height: "35%" }} />
                <span className="w-1 bg-blue-500 rounded-full anim-bar-3" style={{ height: "60%" }} />
                <span className="w-1 bg-blue-400 rounded-full anim-bar-1" style={{ height: "85%" }} />
                <span className="w-1 bg-cyan-300 rounded-full anim-bar-4" style={{ height: "30%" }} />
                <span className="w-1 bg-blue-500 rounded-full anim-bar-5" style={{ height: "75%" }} />
              </div>
            </div>
            {/* Recent Activity Log Stream */}
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-400">RECENT ACTIVITY LOG</span>
              <div className="flex flex-col gap-1.5 font-mono text-[10.5px]">
                <div className="p-2 bg-slate-50 rounded border-l-2 border-amber-500 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>02:14:10 PM</span>
                    <span className="text-amber-700 font-semibold font-mono text-[9.5px]">PACING_ADAPT</span>
                  </div>
                  <span className="text-slate-800 text-[11px] font-sans">Pacing throttled: Agent pool occupancy 92%</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border-l-2 border-blue-500 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>02:12:04 PM</span>
                    <span className="text-blue-700 font-semibold font-mono text-[9.5px]">DISPATCH_SIP</span>
                  </div>
                  <span className="text-slate-800 text-[11px] font-sans">Batch 4 dispatches handed off to SIP-Sim</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border-l-2 border-emerald-500 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>02:08:45 PM</span>
                    <span className="text-emerald-700 font-semibold font-mono text-[9.5px]">AI_SCREEN</span>
                  </div>
                  <span className="text-slate-800 text-[11px] font-sans">Screening bot completed 45 valid handshakes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Drawer Bottom Action Bar */}
        <div className="p-4 bg-slate-50/70 border-t border-[#E5EAF1] flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="h-8 rounded-lg bg-white border border-[#E5EAF1] hover:bg-slate-100 text-slate-700 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer" id="drawer-toggle-pause-btn" onClick={(e) => ui(e).togglePauseCurrentCampaign()}>
              <span className="material-symbols-outlined text-[16px]">pause</span>
              <span>Pause Campaign</span>
            </button>
            <button className="h-8 rounded-lg bg-white border border-[#E5EAF1] hover:bg-slate-100 text-slate-700 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer" onClick={(e) => ui(e).openEditModalFromDrawer()}>
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Edit Config</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="h-8 rounded-lg bg-white border border-[#E5EAF1] hover:bg-slate-100 text-slate-600 text-[12px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer" onClick={(e) => ui(e).duplicateCurrentCampaign()}>
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>Duplicate</span>
            </button>
            <button className="h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-700 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer" onClick={(e) => ui(e).confirmStopCampaign()}>
              <span className="material-symbols-outlined text-[16px]">stop_circle</span>
              <span>Stop Campaign</span>
            </button>
          </div>
        </div>
      </aside>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity duration-200 opacity-0 pointer-events-none flex items-center justify-center p-4" id="create-modal-backdrop">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col scale-95 transition-transform duration-200 border border-[#E5EAF1]" id="create-modal-container">
          {/* Modal Header */}
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-[#E5EAF1] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[19px]">campaign</span>
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Create New Campaign</h3>
                <p className="text-[11.5px] text-slate-500">
                  Configure dispatch rules, automated screening{" "}
                  &amp;
                  {" "}agent pools.
                </p>
              </div>
            </div>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer transition-colors" onClick={(e) => ui(e).closeCreateModal()}>
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          {/* Modal Body Form */}
          <form className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[78vh]" id="create-campaign-form" onSubmit={(e) => ui(e).handleCreateCampaign(e)}>
            {/* 1. Basic Information */}
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-blue-600">1. Basic Information</span>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-800">Campaign Name</label>
                <input className="h-8 px-3 rounded-lg bg-white text-slate-900 border border-[#E5EAF1] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-[12.5px] outline-none transition-all placeholder:text-slate-400 py-0" id="modal-input-name" placeholder="e.g. Q4 Inactive Customer Re-engagement" required type="text" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-slate-800">Call Targets (Lead count)</label>
                  <input className="h-8 px-3 rounded-lg bg-white text-slate-900 border border-[#E5EAF1] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono text-[12.5px] outline-none transition-all placeholder:text-slate-400 py-0" id="modal-input-targets" min="10" placeholder="2500" required type="number" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-semibold text-slate-800">Mock Telephony Provider</label>
                  <select className="h-8 px-2.5 rounded-lg bg-white text-slate-800 border border-[#E5EAF1] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-[12px] outline-none cursor-pointer py-0" id="modal-input-provider">
                    <option value="Provider A">Provider A (Low Latency SIP)</option>
                    <option value="Provider B">Provider B (Standard Trunk)</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-800">Description / Mission</label>
                <textarea className="px-3 py-1.5 rounded-lg bg-white text-slate-900 border border-[#E5EAF1] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-[12.5px] outline-none transition-all placeholder:text-slate-400 resize-none h-16" id="modal-input-desc" placeholder="Brief campaign mission or target roster segment..." />
              </div>
            </div>
            {/* 2. Dialing & Screening Configuration */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-[#E5EAF1]">
              <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-blue-600">
                2. Dialing{" "}
                &amp;
                {" "}Screening Configuration
              </span>
              <div className="grid grid-cols-2 gap-3">
                {/* Mode Radio */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-800">Dialing Mode</label>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-[#E5EAF1] cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                      <input defaultChecked className="text-blue-600 focus:ring-blue-600" name="dial_mode" type="radio" value="Predictive" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-slate-900">Predictive</span>
                        <span className="font-mono text-[9.5px] text-slate-400">Paces dials ahead of free agents</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-[#E5EAF1] cursor-pointer hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                      <input className="text-blue-600 focus:ring-blue-600" name="dial_mode" type="radio" value="Progressive" />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-slate-900">Progressive</span>
                        <span className="font-mono text-[9.5px] text-slate-400">1:1 dial ratio only on agent ready</span>
                      </div>
                    </label>
                  </div>
                </div>
                {/* AI Screening Toggle Box */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-800">AI Voice Screening</label>
                  <div className="p-2.5 bg-slate-50 border border-[#E5EAF1] rounded-lg flex flex-col justify-between gap-1.5 h-[98px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-slate-900 font-semibold">Enable AI Bot</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input defaultChecked className="sr-only peer" id="modal-screening-toggle" onChange={(e) => ui(e).toggleScreeningOptions(e.currentTarget.checked)} type="checkbox" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                    </div>
                    <span className="text-[10.5px] text-slate-500 leading-snug">Pre-qualifies recipients and weeds out answering machines before routing.</span>
                  </div>
                </div>
              </div>
              {/* Conditional Screening Sub-settings */}
              <div className="p-3 bg-purple-50/60 rounded-xl flex flex-col gap-2.5 border border-purple-200/60" id="screening-conditional-panel">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-purple-900 uppercase font-semibold">
                  <span className="material-symbols-outlined text-[15px]">tune</span>
                  SCREENING PARAMETERS
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9.5px] text-slate-500 font-semibold uppercase">Max Agent Wait</label>
                    <select className="h-7 px-2 bg-white text-slate-800 rounded-md text-[11.5px] border border-purple-200 py-0" defaultValue="30 seconds">
                      <option>20 seconds</option>
                      <option>30 seconds</option>
                      <option>45 seconds</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9.5px] text-slate-500 font-semibold uppercase">Fallback Action</label>
                    <select className="h-7 px-2 bg-white text-slate-800 rounded-md text-[11.5px] border border-purple-200 py-0" defaultValue="Callback Later">
                      <option>Callback Later</option>
                      <option>Graceful Stop</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9.5px] text-slate-500 font-semibold uppercase">Screening Profile</label>
                    <select className="h-7 px-2 bg-white text-slate-800 rounded-md text-[11.5px] border border-purple-200 py-0" defaultValue="High Yield">
                      <option>High Yield</option>
                      <option>Strict Verification</option>
                      <option>Conservative</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {/* 3. Agent Allocation Group */}
            <div className="flex flex-col gap-2 pt-3 border-t border-[#E5EAF1]">
              <span className="font-mono text-[10.5px] uppercase tracking-wider font-semibold text-blue-600">
                3. Agent Allocation{" "}
                &amp;
                {" "}Safety
              </span>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-800">Target Agent Pool</label>
                <select className="h-8 px-2.5 rounded-lg bg-white text-slate-800 border border-[#E5EAF1] focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-[12px] outline-none py-0" id="modal-input-pool">
                  <option value="Retention Specialists (12)">Retention Specialists (12 agents online)</option>
                  <option value="Claims Adjusters (8)">Claims Adjusters (8 agents online)</option>
                  <option value="SDR Outbound (16)">SDR Outbound (16 agents online)</option>
                  <option value="Shared Roster Pool">Shared Roster Pool (Automatic dynamic assignment)</option>
                </select>
              </div>
              {/* Safety Warning Banner */}
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[16px] shrink-0 mt-0.5">warning</span>
                <span className="font-mono text-[10.5px] text-amber-800 leading-snug">Safety Controller will automatically throttle or restrict call initiation regardless of pacing mode if agent standby falls below 15%.</span>
              </div>
            </div>
            {/* Form Actions */}
            <div className="pt-3 border-t border-[#E5EAF1] flex items-center justify-end gap-2">
              <button className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-medium cursor-pointer transition-colors" onClick={(e) => ui(e).closeCreateModal()} type="button">Cancel</button>
              <button className="h-8 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-[12.5px] shadow-xs cursor-pointer transition-colors" type="submit">Create Campaign</button>
            </div>
          </form>
        </div>
      </div>
      <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl p-3 flex items-center gap-2.5 z-50 transform translate-y-16 opacity-0 transition-all duration-300 border border-[#E5EAF1] border-l-4 border-l-blue-600 pointer-events-none" id="action-toast">
        <span className="material-symbols-outlined text-blue-600 text-[20px]" id="toast-icon">check_circle</span>
        <div className="flex flex-col">
          <span className="text-[12.5px] font-semibold text-slate-900" id="toast-title">Campaign Created</span>
          <span className="text-[11.5px] text-slate-500" id="toast-msg">Outreach flow initialized successfully.</span>
        </div>
      </div>
    </>
  );
}
