"use client";

import { useScreen } from "@/lib/useScreen";
import { mount } from "./behavior";

export default function ProviderMonitoringScreen() {
  const ui = useScreen(mount);

  return (
    <>
      <div className="font-body-md text-po-on-surface antialiased bg-po-surface px-6 py-6 min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col w-full gap-5 pb-16">
          {/* 3. PAGE HEADER & FILTER ACTION BAR */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-po-surface-container-lowest p-5 rounded-xl border border-po-surface-container shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-headline-lg text-[24px] text-po-primary tracking-tight font-bold">Provider Monitoring</h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-po-surface-container text-po-primary font-label-mono-xs text-[11px] font-medium border border-po-surface-container-high">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-po-on-tertiary-container opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-po-on-tertiary-container" />
                  </span>
                  <span>Simulation Environment • SIP Mesh v2</span>
                </div>
              </div>
              <p className="font-body-md text-[13px] text-po-on-surface-variant">Monitor mock provider availability, request outcomes, synthetic latency, and webhook delivery resilience.</p>
            </div>
            {/* Controls Row */}
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="relative">
                <select className="h-8 pl-3 pr-8 bg-po-surface-container-low hover:bg-po-surface-container text-po-primary font-body-sm text-[13px] rounded-lg border-0 appearance-none cursor-pointer focus:ring-1 focus:ring-po-secondary transition-colors py-0">
                  <option>All Campaigns (3)</option>
                  <option>Inbound Inquiries Core</option>
                  <option>Lead Recovery Dialing</option>
                  <option>Tier 1 Outbound Survey</option>
                </select>
                {" "}
                <span className="material-symbols-outlined text-[16px] text-po-on-surface-variant absolute right-2 top-2 pointer-events-none">expand_more</span>
              </div>
              <div className="relative">
                <select className="h-8 pl-3 pr-8 bg-po-surface-container-low hover:bg-po-surface-container text-po-primary font-body-sm text-[13px] rounded-lg border-0 appearance-none cursor-pointer focus:ring-1 focus:ring-po-secondary transition-colors py-0">
                  <option>Last 24 hours</option>
                  <option>Last 6 hours</option>
                  <option>Last 1 hour</option>
                  <option>Last 7 days</option>
                </select>
                {" "}
                <span className="material-symbols-outlined text-[16px] text-po-on-surface-variant absolute right-2 top-2 pointer-events-none">expand_more</span>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined text-[16px] text-po-outline absolute left-2.5 pointer-events-none">search</span>
                <input className="h-8 pl-8 pr-3 bg-po-surface-container-low text-po-primary placeholder-po-outline font-body-sm text-[13px] rounded-lg border-0 focus:ring-1 focus:ring-po-secondary transition-all w-48 xl:w-56 py-0" id="provider-search-input" placeholder="Search provider or endpoint..." type="text" />
              </div>
              <button className="w-8 h-8 rounded-lg bg-po-surface-container-low text-po-on-surface-variant hover:text-po-primary hover:bg-po-surface-container flex items-center justify-center transition-colors" id="btn-refresh-telemetry" onClick={(e) => ui(e).handleTelemetryRefresh()} title="Refresh Telemetry">
                <span className="material-symbols-outlined text-[18px]" id="refresh-icon">refresh</span>
              </button>
              <button className="h-8 px-3.5 rounded-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-[13px] font-medium flex items-center gap-1.5 transition-colors shadow-sm" onClick={(e) => ui(e).openDrawer('gateway-b')}>
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Configure Mock Latency</span>
              </button>
            </div>
          </div>
          {/* 4. FOUR SUMMARY KPI CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-po-surface-container-lowest p-4 rounded-xl border border-po-surface-container shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold tracking-wider">CONFIGURED PROVIDERS</span>
                <span className="px-2 py-0.5 rounded bg-po-surface-container-high text-po-secondary font-label-mono-xs text-[11px] font-semibold">Active Mesh</span>
              </div>
              <div className="my-2 flex items-baseline gap-1.5">
                <span className="font-display-kpi text-[32px] leading-tight text-po-primary font-bold">2</span>
                <span className="font-label-mono-sm text-[12px] text-po-on-surface-variant font-medium">Gateways</span>
              </div>
              <div className="pt-2 border-t border-po-surface-container-low flex items-center justify-between text-po-on-surface-variant font-body-sm text-[12px]">
                <span>
                  Mock SIP Gateway A{" "}
                  &amp;
                  {" "}B
                </span>
                <span className="material-symbols-outlined text-[16px] text-po-secondary">hub</span>
              </div>
            </div>
            {/* KPI 2 */}
            <div className="bg-po-surface-container-lowest p-4 rounded-xl border border-po-surface-container shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold tracking-wider">SUCCESSFUL REQUESTS</span>
                <span className="px-2 py-0.5 rounded bg-po-tertiary-fixed text-po-on-tertiary-fixed font-label-mono-xs text-[11px] font-semibold">+18% vol</span>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="font-display-kpi text-[32px] leading-tight text-po-primary font-bold">1,284</span>
                <span className="font-label-mono-sm text-[12px] text-po-on-tertiary-container font-semibold">94.1%</span>
              </div>
              <div className="pt-2 border-t border-po-surface-container-low flex items-center justify-between text-po-on-surface-variant font-body-sm text-[12px]">
                <span>SIP 200 OK completions</span>
                <span className="material-symbols-outlined text-[16px] text-po-on-tertiary-container">check_circle</span>
              </div>
            </div>
            {/* KPI 3 */}
            <div className="bg-po-surface-container-lowest p-4 rounded-xl border border-po-surface-container shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold tracking-wider">TIMEOUTS (SIP 408)</span>
                <span className="px-2 py-0.5 rounded bg-po-surface-container text-po-on-secondary-fixed-variant font-label-mono-xs text-[11px] font-semibold">Reconciled</span>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="font-display-kpi text-[32px] leading-tight text-po-primary font-bold">68</span>
                <span className="font-label-mono-sm text-[12px] text-po-on-surface-variant font-medium">5.0% rate</span>
              </div>
              <div className="pt-2 border-t border-po-surface-container-low flex items-center justify-between text-po-on-surface-variant font-body-sm text-[12px]">
                <span>
                  Safely polled{" "}
                  &amp;
                  {" "}deduplicated
                </span>
                <span className="material-symbols-outlined text-[16px] text-po-secondary">hourglass_empty</span>
              </div>
            </div>
            {/* KPI 4 */}
            <div className="bg-po-surface-container-lowest p-4 rounded-xl border border-po-surface-container shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold tracking-wider">PROVIDER ERRORS</span>
                <span className="px-2 py-0.5 rounded bg-po-surface-container text-po-primary font-label-mono-xs text-[11px] font-semibold">Circuit Safe</span>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="font-display-kpi text-[32px] leading-tight text-po-primary font-bold">12</span>
                <span className="font-label-mono-sm text-[12px] text-po-error font-medium">0.9% 503/504</span>
              </div>
              <div className="pt-2 border-t border-po-surface-container-low flex items-center justify-between text-po-on-surface-variant font-body-sm text-[12px]">
                <span>Zero unhandled exceptions</span>
                <span className="material-symbols-outlined text-[16px] text-po-error">shield</span>
              </div>
            </div>
          </div>
          {/* SIMULATION DISCLAIMER SUB-BAR */}
          <div className="px-4 py-2.5 rounded-xl bg-po-surface-container-low border border-po-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-po-on-surface-variant font-body-sm text-[12px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-po-secondary shrink-0">info</span>
              <span>Frontend Simulation Data — No live carrier network attached. Mock data calibrated against synthetic RFC-3261 handshakes.</span>
            </div>
            <span className="font-label-mono-xs text-[11px] uppercase text-po-outline shrink-0">ENGINE: SIP-SIM V2.8 (ACTIVE)</span>
          </div>
          {/* 5. PROVIDER COMPARISON CARDS (2 COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* PROVIDER A (FAST & RELIABLE) */}
            <div className="bg-po-surface-container-lowest rounded-xl p-5 border border-po-surface-container shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-po-on-tertiary-container" />
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-md text-[18px] text-po-primary font-bold">Mock SIP Gateway A</span>
                      <span className="font-label-mono-xs text-[11px] px-2 py-0.5 rounded bg-po-surface-container text-po-on-surface-variant font-semibold">PRI-EAST-01</span>
                    </div>
                    <p className="font-body-sm text-[12px] text-po-on-surface-variant">
                      Primary Tier-1 Voice Gateway • Fast{" "}
                      &amp;
                      {" "}Predictable
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-po-tertiary-fixed text-po-on-tertiary-fixed font-label-mono-xs text-[11px] font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-po-on-tertiary-container" />
                    Operational
                  </span>
                </div>
                {/* Latency & Metric Banner */}
                <div className="grid grid-cols-3 gap-3 my-4 p-3.5 rounded-lg bg-po-surface-container-low border border-po-surface-container">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">AVG LATENCY</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-headline-lg text-[22px] text-po-primary font-bold">24ms</span>
                      <span className="font-label-mono-xs text-[11px] text-po-on-tertiary-container font-semibold">Low</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">SUCCESS RATE</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-headline-lg text-[22px] text-po-primary font-bold">98.4%</span>
                      <span className="font-label-mono-xs text-[11px] text-po-outline">1,120 req</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">CIRCUIT HEALTH</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-headline-lg text-[22px] text-po-on-tertiary-container font-bold">100%</span>
                      <span className="font-label-mono-xs text-[11px] text-po-outline">0 trips</span>
                    </div>
                  </div>
                </div>
                {/* Telemetry Details */}
                <div className="flex flex-col gap-1.5 font-body-sm text-[12.5px]">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-po-on-surface-variant">Request Behavior:</span>
                    <span className="font-medium text-po-primary text-right">Fast responses and predictable outcomes across SIP handshakes</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-po-on-surface-variant">Event Delivery:</span>
                    <span className="font-medium text-po-primary text-right">Normal simulated delivery • Zero dropped webhooks</span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-2">
                    <div className="flex justify-between font-label-mono-xs text-[11px] text-po-on-surface-variant">
                      <span>Volume Split: 1,120 Successful</span>
                      <span>18 Timeouts • 0 Errors</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-po-surface-container overflow-hidden flex">
                      <div className="h-full bg-po-on-tertiary-container rounded-full" style={{ width: "98.4%" }} />
                      <div className="h-full bg-po-secondary-fixed-dim" style={{ width: "1.6%" }} />
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-po-surface-container">
                <div className="flex items-center gap-1.5 text-po-on-surface-variant font-label-mono-xs text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-po-on-tertiary-container">dns</span>
                  <span>sip-gw-a.mock.mesh:5060</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-8 px-3 rounded-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-[12px] font-medium transition-colors" onClick={(e) => ui(e).openDrawer('gateway-a')}>Inspect SIP Trunks</button>
                  <button className="h-8 px-3.5 rounded-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-[12px] font-medium transition-colors shadow-sm" onClick={(e) => ui(e).openDrawer('gateway-a')}>View Details</button>
                </div>
              </div>
            </div>
            {/* PROVIDER B (SLOW & UNRELIABLE) */}
            <div className="bg-po-surface-container-lowest rounded-xl p-5 border border-po-surface-container shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-po-secondary" />
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-md text-[18px] text-po-primary font-bold">Mock SIP Gateway B</span>
                      <span className="font-label-mono-xs text-[11px] px-2 py-0.5 rounded bg-po-surface-container text-po-on-surface-variant font-semibold">SEC-WEST-02</span>
                    </div>
                    <p className="font-body-sm text-[12px] text-po-on-surface-variant">Secondary Fallback Gateway • Fault Injection Target</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-po-surface-container-highest text-po-secondary font-label-mono-xs text-[11px] font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-po-secondary" />
                    Degraded / Monitoring
                  </span>
                </div>
                {/* Latency & Metric Banner */}
                <div className="grid grid-cols-3 gap-3 my-4 p-3.5 rounded-lg bg-po-surface-container-low border border-po-surface-container">
                  <div className="flex flex-col">
                    <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">AVG LATENCY</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-headline-lg text-[22px] text-po-primary font-bold">318ms</span>
                      <span className="font-label-mono-xs text-[11px] text-po-secondary font-semibold">Elevated</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">SUCCESS RATE</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-headline-lg text-[22px] text-po-primary font-bold">72.8%</span>
                      <span className="font-label-mono-xs text-[11px] text-po-outline">226 total</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">EVENT ANOMALY</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-headline-lg text-[22px] text-po-secondary font-bold">22</span>
                      <span className="font-label-mono-xs text-[11px] text-po-outline">Dups/Order</span>
                    </div>
                  </div>
                </div>
                {/* Telemetry Details */}
                <div className="flex flex-col gap-1.5 font-body-sm text-[12.5px]">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-po-on-surface-variant">Request Behavior:</span>
                    <span className="font-medium text-po-primary text-right">Delays, timeouts, and transient SIP 504 failures under load</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-po-on-surface-variant">Event Delivery:</span>
                    <span className="font-medium text-po-primary text-right">
                      Duplicate (14){" "}
                      &amp;
                      {" "}out-of-order (8) event delivery observed
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-2">
                    <div className="flex justify-between font-label-mono-xs text-[11px] text-po-on-surface-variant">
                      <span>Volume Split: 164 Successful</span>
                      <span>50 Timeouts • 12 SIP Errors</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-po-surface-container overflow-hidden flex">
                      <div className="h-full bg-po-on-tertiary-container rounded-full" style={{ width: "72.8%" }} />
                      <div className="h-full bg-po-secondary-container" style={{ width: "21.9%" }} />
                      <div className="h-full bg-po-error" style={{ width: "5.3%" }} />
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Footer */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-po-surface-container">
                <div className="flex items-center gap-1.5 text-po-on-surface-variant font-label-mono-xs text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-po-secondary">wifi_channel</span>
                  <span>sip-gw-b.mock.mesh:5060</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-8 px-3 rounded-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-[12px] font-medium transition-colors flex items-center gap-1.5" id="btn-reconnect" onClick={(e) => ui(e).triggerReconnect()}>
                    <span className="material-symbols-outlined text-[14px]">sync</span>
                    <span>Trigger Reconnect</span>
                  </button>
                  <button className="h-8 px-3.5 rounded-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-[12px] font-medium transition-colors shadow-sm" onClick={(e) => ui(e).openDrawer('gateway-b')}>View Details</button>
                </div>
              </div>
            </div>
          </div>
          {/* 6. REQUEST PERFORMANCE CHART & FAULT SIMULATION LAB */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* COLUMN 1: CHART (7 COLS) */}
            <div className="lg:col-span-7 bg-po-surface-container-lowest rounded-xl p-5 border border-po-surface-container shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex flex-col">
                    <h2 className="font-headline-md text-[18px] text-po-primary font-bold">Request Performance</h2>
                    <span className="font-body-sm text-[12px] text-po-on-surface-variant">Throughput and error distribution aggregated by hourly intervals</span>
                  </div>
                  {/* Time Range Filter Pills */}
                  <div className="flex items-center gap-1 bg-po-surface-container-low p-1 rounded-lg border border-po-surface-container">
                    <button className="px-2.5 py-0.5 rounded bg-po-surface-container-lowest text-po-primary font-label-mono-xs text-[11px] font-semibold shadow-sm">24h</button>
                    <button className="px-2.5 py-0.5 rounded text-po-on-surface-variant hover:text-po-primary font-label-mono-xs text-[11px]">6h</button>
                    <button className="px-2.5 py-0.5 rounded text-po-on-surface-variant hover:text-po-primary font-label-mono-xs text-[11px]">7d</button>
                  </div>
                </div>
                {/* Chart Legend */}
                <div className="flex items-center flex-wrap gap-4 mb-4 pb-2 border-b border-po-surface-container-low">
                  <div className="flex items-center gap-1.5 font-body-sm text-[12px] text-po-on-surface-variant">
                    <span className="w-2.5 h-2.5 rounded-sm bg-po-on-tertiary-container" />
                    <span>Successful (SIP 200 OK)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-body-sm text-[12px] text-po-on-surface-variant">
                    <span className="w-2.5 h-2.5 rounded-sm bg-po-secondary" />
                    <span>Timed-out (SIP 408)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-body-sm text-[12px] text-po-on-surface-variant">
                    <span className="w-2.5 h-2.5 rounded-sm bg-po-error" />
                    <span>Failed (SIP 503/504)</span>
                  </div>
                </div>
                {/* Hourly Stacked Bar Chart */}
                <div className="w-full h-56 flex flex-col justify-end pt-2">
                  <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 160">
                    {/* Grid Lines */}
                    <line stroke="#eaedff" strokeDasharray="2,2" strokeWidth="1" x1="0" x2="600" y1="10" y2="10" />
                    <line stroke="#eaedff" strokeDasharray="2,2" strokeWidth="1" x1="0" x2="600" y1="55" y2="55" />
                    <line stroke="#eaedff" strokeDasharray="2,2" strokeWidth="1" x1="0" x2="600" y1="100" y2="100" />
                    <line stroke="#dae2fd" strokeWidth="1" x1="0" x2="600" y1="145" y2="145" />
                    {/* 00:00 */}
                    <g className="transition-opacity hover:opacity-80 cursor-pointer">
                      <rect fill="#28a094" height="80" rx="3" width="30" x="35" y="65" />
                      <rect fill="#4e45d5" height="6" rx="1" width="30" x="35" y="58" />
                      <rect fill="#ba1a1a" height="3" rx="1" width="30" x="35" y="54" />
                    </g>
                    {/* 04:00 */}
                    <g className="transition-opacity hover:opacity-80 cursor-pointer">
                      <rect fill="#28a094" height="55" rx="3" width="30" x="135" y="90" />
                      <rect fill="#4e45d5" height="3" rx="1" width="30" x="135" y="86" />
                    </g>
                    {/* 08:00 */}
                    <g className="transition-opacity hover:opacity-80 cursor-pointer">
                      <rect fill="#28a094" height="115" rx="3" width="30" x="235" y="30" />
                      <rect fill="#4e45d5" height="5" rx="1" width="30" x="235" y="24" />
                      <rect fill="#ba1a1a" height="1" rx="1" width="30" x="235" y="22" />
                    </g>
                    {/* 12:00 */}
                    <g className="transition-opacity hover:opacity-80 cursor-pointer">
                      <rect fill="#28a094" height="125" rx="3" width="30" x="335" y="20" />
                      <rect fill="#4e45d5" height="9" rx="1" width="30" x="335" y="10" />
                      <rect fill="#ba1a1a" height="4" rx="1" width="30" x="335" y="5" />
                    </g>
                    {/* 16:00 */}
                    <g className="transition-opacity hover:opacity-80 cursor-pointer">
                      <rect fill="#28a094" height="103" rx="3" width="30" x="435" y="42" />
                      <rect fill="#4e45d5" height="7" rx="1" width="30" x="435" y="34" />
                      <rect fill="#ba1a1a" height="1" rx="1" width="30" x="435" y="32" />
                    </g>
                    {/* 20:00 (Now) */}
                    <g className="transition-opacity hover:opacity-80 cursor-pointer">
                      <rect fill="#28a094" height="93" rx="3" width="30" x="535" y="52" />
                      <rect fill="#4e45d5" height="5" rx="1" width="30" x="535" y="46" />
                      <rect fill="#ba1a1a" height="2" rx="1" width="30" x="535" y="43" />
                    </g>
                  </svg>
                  {/* X Axis Labels */}
                  <div className="flex justify-between px-3 pt-2 font-label-mono-xs text-[11px] text-po-on-surface-variant border-t border-po-surface-container">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span>08:00</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span className="font-semibold text-po-primary">20:00 (Now)</span>
                  </div>
                </div>
              </div>
              {/* Footer note */}
              <div className="mt-4 pt-3 border-t border-po-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-label-mono-xs text-[11px] text-po-outline">
                <span>Illustrative Simulation Data • Carrier benchmarks simulated via SIP-Sim v2 engine</span>
                <span className="text-po-primary font-semibold">Throughput: 98 req/min</span>
              </div>
            </div>
            {/* COLUMN 2: FAULT SIMULATION LAB (5 COLS) */}
            <div className="lg:col-span-5 bg-po-surface-container-lowest rounded-xl p-5 border border-po-surface-container shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-po-secondary">science</span>
                    <h2 className="font-headline-md text-[18px] text-po-primary font-bold">Fault Simulation Lab</h2>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-po-surface-container text-po-secondary font-label-mono-xs text-[11px] font-semibold">Safe Sandbox</span>
                </div>
                <p className="font-body-sm text-[12.5px] text-po-on-surface-variant">Exercise SmartDialX&#39;s recovery orchestrator, deduplication pipeline, and pacing safety throttles using deterministic mock faults.</p>
                {/* Form Controls */}
                <div className="flex flex-col gap-3 mt-1">
                  {/* Target Gateway Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-ui text-[11px] text-po-primary uppercase font-semibold">TARGET GATEWAY</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="px-3 py-1.5 rounded-lg text-po-on-surface-variant bg-po-surface-container-low font-body-sm text-[13px] font-medium hover:bg-po-surface-container transition-colors" id="sim-btn-gwa" onClick={(e) => ui(e).selectSimProvider('gw-a')} type="button">Mock Gateway A</button>
                      <button className="px-3 py-1.5 rounded-lg text-po-primary bg-po-surface-container-high font-body-sm text-[13px] font-semibold transition-colors" id="sim-btn-gwb" onClick={(e) => ui(e).selectSimProvider('gw-b')} type="button">Mock Gateway B</button>
                    </div>
                  </div>
                  {/* Simulated Behavior */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-ui text-[11px] text-po-primary uppercase font-semibold">SIMULATED BEHAVIOR / FAULT</label>
                    <div className="relative">
                      <select className="w-full h-8 pl-3 pr-8 bg-po-surface-container-low hover:bg-po-surface-container text-po-primary font-body-sm text-[13px] rounded-lg border-0 appearance-none focus:ring-1 focus:ring-po-secondary transition-colors cursor-pointer py-0" id="sim-scenario-select" onChange={(e) => ui(e).updateSimPreview()}>
                        <option value="timeout">Request timeouts (SIP 408)</option>
                        <option value="latency">Increased latency (+350ms)</option>
                        <option value="outage">Temporary provider outage (SIP 503)</option>
                        <option value="duplicates">Duplicate webhook events (x2)</option>
                        <option value="reorder">Out-of-order event sequence</option>
                        <option value="normal">Normal operation (Baseline)</option>
                      </select>
                      {" "}
                      <span className="material-symbols-outlined text-[16px] text-po-on-surface-variant absolute right-2.5 top-2 pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  {/* Duration Pills */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-ui text-[11px] text-po-primary uppercase font-semibold">TEST WINDOW DURATION</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button className="py-1 rounded-lg bg-po-surface-container-high text-po-primary font-label-mono-xs text-[11px] font-semibold transition-colors" id="dur-1m" onClick={(e) => ui(e).selectSimDuration('1m')} type="button">1 minute</button>
                      <button className="py-1 rounded-lg bg-po-surface-container-low text-po-on-surface-variant font-label-mono-xs text-[11px] font-medium hover:bg-po-surface-container transition-colors" id="dur-5m" onClick={(e) => ui(e).selectSimDuration('5m')} type="button">5 minutes</button>
                      <button className="py-1 rounded-lg bg-po-surface-container-low text-po-on-surface-variant font-label-mono-xs text-[11px] font-medium hover:bg-po-surface-container transition-colors" id="dur-15m" onClick={(e) => ui(e).selectSimDuration('15m')} type="button">15 minutes</button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Dynamic Scenario Box & Run Button */}
              <div className="flex flex-col gap-3 mt-4">
                <div className="p-3 rounded-lg bg-po-surface-container-low border-l-4 border-l-po-secondary flex flex-col gap-1 transition-all" id="sim-result-box">
                  <div className="flex items-center justify-between font-label-mono-xs text-[11px]">
                    <span className="font-semibold text-po-primary" id="sim-preview-title">Scenario: SIP 408 on Gateway B</span>
                    <span className="text-po-secondary font-semibold" id="sim-preview-status">Ready to Inject</span>
                  </div>
                  <p className="font-body-sm text-[12px] text-po-on-surface-variant leading-relaxed" id="sim-preview-desc">Pacing controller throttles batch rate to 1:1 Progressive and initiates automated webhook deduplication without carrier dropped calls.</p>
                </div>
                <button className="w-full h-9 rounded-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm" id="btn-run-sim" onClick={(e) => ui(e).runSimulation()}>
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Run Simulation</span>
                </button>
              </div>
            </div>
          </div>
          {/* 7. PROVIDER METRICS COMPARATIVE TABLE */}
          <div className="bg-po-surface-container-lowest rounded-xl border border-po-surface-container shadow-sm overflow-hidden">
            <div className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-po-surface-container-low">
              <div>
                <h2 className="font-headline-md text-[18px] text-po-primary font-bold">Provider Metrics</h2>
                <p className="font-body-sm text-[12px] text-po-on-surface-variant">Comparative reliability telemetry across configured mock providers</p>
              </div>
              <span className="font-label-mono-xs text-[11px] px-2.5 py-1 rounded bg-po-surface-container text-po-on-surface-variant font-semibold self-start sm:self-auto">Synthetic SLA Target: 99.0%</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-[11px] uppercase tracking-wider border-b border-po-surface-container">
                    <th className="py-2.5 px-5">Provider</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Avg Latency</th>
                    <th className="py-2.5 px-3 text-right">Successful Requests</th>
                    <th className="py-2.5 px-3 text-right">Timeouts</th>
                    <th className="py-2.5 px-3 text-right">Errors</th>
                    <th className="py-2.5 px-3 text-right">Event Issues</th>
                    <th className="py-2.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-po-surface-container font-body-sm text-[13px]">
                  {/* Row 1: Gateway A */}
                  <tr className="hover:bg-po-surface-container/60 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-po-surface-container-high flex items-center justify-center text-po-primary font-bold text-[11px]">A</div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-po-primary">Mock SIP Gateway A</span>
                          <span className="font-label-mono-xs text-[11px] text-po-outline">PRI • sip-gw-a.internal</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-po-tertiary-fixed text-po-on-tertiary-fixed font-label-mono-xs text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-po-on-tertiary-container" />
                        Operational
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-label-mono-sm text-[12px] font-semibold text-po-primary">24ms</td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-label-mono-sm text-[12px] font-medium text-po-primary">1,120</span>
                      {" "}
                      <span className="font-label-mono-xs text-[11px] text-po-on-tertiary-container ml-1">(98.4%)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-label-mono-sm text-[12px] font-medium text-po-primary">18</span>
                      {" "}
                      <span className="font-label-mono-xs text-[11px] text-po-outline ml-1">(1.6%)</span>
                    </td>
                    <td className="py-3 px-3 text-right font-label-mono-sm text-[12px] text-po-on-surface-variant">
                      0{" "}
                      <span className="text-po-outline text-[10px]">(0.0%)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-po-surface-container text-po-on-surface-variant font-label-mono-xs text-[11px]">0 anomalies</span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button className="h-7 px-3 rounded-lg bg-po-surface-container-low hover:bg-po-surface-container text-po-primary font-body-sm text-[12px] font-medium transition-colors" onClick={(e) => ui(e).openDrawer('gateway-a')}>Inspect</button>
                    </td>
                  </tr>
                  {/* Row 2: Gateway B */}
                  <tr className="hover:bg-po-surface-container/60 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-po-surface-container-high flex items-center justify-center text-po-primary font-bold text-[11px]">B</div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-po-primary">Mock SIP Gateway B</span>
                          <span className="font-label-mono-xs text-[11px] text-po-outline">SEC • sip-gw-b.internal</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-po-surface-container-highest text-po-secondary font-label-mono-xs text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-po-secondary" />
                        Degraded
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-label-mono-sm text-[12px] font-semibold text-po-secondary">318ms</td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-label-mono-sm text-[12px] font-medium text-po-primary">164</span>
                      {" "}
                      <span className="font-label-mono-xs text-[11px] text-po-outline ml-1">(72.8%)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-label-mono-sm text-[12px] font-medium text-po-secondary">50</span>
                      {" "}
                      <span className="font-label-mono-xs text-[11px] text-po-secondary ml-1">(22.2%)</span>
                    </td>
                    <td className="py-3 px-3 text-right font-label-mono-sm text-[12px] text-po-error font-medium">
                      12{" "}
                      <span className="text-po-outline text-[10px]">(5.3%)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-po-surface-container-highest text-po-secondary font-label-mono-xs text-[11px] font-semibold">22 (dups/order)</span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button className="h-7 px-3 rounded-lg bg-po-surface-container-low hover:bg-po-surface-container text-po-primary font-body-sm text-[12px] font-medium transition-colors" onClick={(e) => ui(e).openDrawer('gateway-b')}>Inspect</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-3.5 bg-po-surface-container-low border-t border-po-surface-container flex items-center justify-between text-po-on-surface-variant font-label-mono-xs text-[11px]">
              <span>All metrics reflect mock telemetry generated for testing failover resilience.</span>
              <span className="text-po-outline">Heartbeat Frequency: 2000ms</span>
            </div>
          </div>
          {/* 8. RECENT PROVIDER EVENTS & RECOVERY STREAM */}
          <div className="bg-po-surface-container-lowest rounded-xl border border-po-surface-container shadow-sm overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between border-b border-po-surface-container-low">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-[18px] text-po-primary font-bold">Recent Provider Events</h2>
                <span className="w-2 h-2 rounded-full bg-po-secondary" />
              </div>
              <a className="font-body-sm text-[12px] font-semibold text-po-secondary hover:text-po-secondary-container flex items-center gap-1 transition-colors" data-path="event-logs-and-recovery" href="#">
                <span>
                  View All Event Logs{" "}
                  &amp;
                  {" "}Recovery
                </span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-[11px] uppercase tracking-wider border-b border-po-surface-container">
                    <th className="py-2.5 px-5">Time</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Recovery Status</th>
                    <th className="py-2.5 px-5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-po-surface-container font-body-sm text-[13px]">
                  {/* Event 1 */}
                  <tr className="hover:bg-po-surface-container/60 transition-colors">
                    <td className="py-2.5 px-5 font-label-mono-xs text-[11px] text-po-outline">14:38:12.410</td>
                    <td className="py-2.5 px-3 font-semibold text-po-primary">Gateway A</td>
                    <td className="py-2.5 px-3">Call request accepted</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-po-tertiary-fixed text-po-on-tertiary-fixed font-label-mono-xs text-[11px] font-semibold">SIP 200 OK</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-label-mono-xs text-[11px] text-po-on-tertiary-container font-semibold">Normal</span>
                    </td>
                    <td className="py-2.5 px-5 text-po-on-surface-variant font-body-sm text-[12px]">Agent handshake completed; channel #88 ready</td>
                  </tr>
                  {/* Event 2 */}
                  <tr className="hover:bg-po-surface-container/60 transition-colors">
                    <td className="py-2.5 px-5 font-label-mono-xs text-[11px] text-po-outline">14:35:40.892</td>
                    <td className="py-2.5 px-3 font-semibold text-po-primary">Gateway B</td>
                    <td className="py-2.5 px-3">Request timed out</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-po-surface-container-highest text-po-secondary font-label-mono-xs text-[11px] font-semibold">SIP 408 Timeout</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-label-mono-xs text-[11px] text-po-secondary font-semibold">Auto-Reconciled</span>
                    </td>
                    <td className="py-2.5 px-5 text-po-on-surface-variant font-body-sm text-[12px]">Reconciled via secondary poll; duplicate call initiation prevented</td>
                  </tr>
                  {/* Event 3 */}
                  <tr className="hover:bg-po-surface-container/60 transition-colors">
                    <td className="py-2.5 px-5 font-label-mono-xs text-[11px] text-po-outline">14:33:19.102</td>
                    <td className="py-2.5 px-3 font-semibold text-po-primary">Gateway B</td>
                    <td className="py-2.5 px-3">Duplicate event received</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-po-surface-container text-po-on-surface-variant font-label-mono-xs text-[11px] font-medium">Ignored</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-label-mono-xs text-[11px] text-po-primary font-semibold">Deduplicated</span>
                    </td>
                    <td className="py-2.5 px-5 text-po-on-surface-variant font-body-sm text-[12px]">
                      Hash matched event{" "}
                      <span className="font-label-mono-xs text-[11px] text-po-primary font-medium">#EV-9902</span>
                      ; discarded safely
                    </td>
                  </tr>
                  {/* Event 4 */}
                  <tr className="hover:bg-po-surface-container/60 transition-colors">
                    <td className="py-2.5 px-5 font-label-mono-xs text-[11px] text-po-outline">14:30:05.614</td>
                    <td className="py-2.5 px-3 font-semibold text-po-primary">Gateway B</td>
                    <td className="py-2.5 px-3">Out-of-order event</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-po-surface-container-high text-po-primary font-label-mono-xs text-[11px] font-medium">Recorded</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-label-mono-xs text-[11px] text-po-secondary font-semibold">Realignment</span>
                    </td>
                    <td className="py-2.5 px-5 text-po-on-surface-variant font-body-sm text-[12px]">Event re-sequenced before state transition dispatch</td>
                  </tr>
                  {/* Event 5 */}
                  <tr className="hover:bg-po-surface-container/60 transition-colors">
                    <td className="py-2.5 px-5 font-label-mono-xs text-[11px] text-po-outline">14:26:44.200</td>
                    <td className="py-2.5 px-3 font-semibold text-po-primary">Gateway A</td>
                    <td className="py-2.5 px-3">Provider lookup completed</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-po-tertiary-fixed text-po-on-tertiary-fixed font-label-mono-xs text-[11px] font-semibold">Verified</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-label-mono-xs text-[11px] text-po-on-tertiary-container font-semibold">Operational</span>
                    </td>
                    <td className="py-2.5 px-5 text-po-on-surface-variant font-body-sm text-[12px]">DNS SRV health ping resolved in 18ms • 0 packet jitter</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Compliance Notice Footer */}
            <div className="p-3.5 bg-po-surface-container-low border-t border-po-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-po-on-surface-variant font-body-sm text-[12px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-po-on-tertiary-container shrink-0">verified_user</span>
                <span>Privacy-Compliant Mode: No customer phone numbers or live SIP trunks involved in mock telemetry.</span>
              </div>
              <span className="font-label-mono-xs text-[11px] text-po-outline">Audit Hash: #0x92b-8a4d</span>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 hidden transition-opacity duration-200" id="provider-drawer-backdrop" onClick={(e) => ui(e).closeDrawer()} />
      <aside className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col justify-between overflow-y-auto" id="provider-drawer">
        {/* Header */}
        <div className="p-5 bg-po-surface-container-low border-b border-po-surface-container flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-label-mono-xs text-[11px] px-2 py-0.5 rounded bg-po-surface-container text-po-primary uppercase font-bold" id="drawer-provider-id">GW-MOCK-A</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-po-tertiary-fixed text-po-on-tertiary-fixed font-label-mono-xs text-[11px] font-semibold" id="drawer-provider-badge">Operational</span>
            </div>
            <h2 className="font-headline-lg text-[20px] text-po-primary font-bold" id="drawer-provider-name">Mock SIP Gateway A</h2>
            <span className="font-body-sm text-[12px] text-po-on-surface-variant">
              Detailed telemetry{" "}
              &amp;
              {" "}fault resilience profile
            </span>
          </div>
          <button className="w-8 h-8 rounded-lg hover:bg-po-surface-container flex items-center justify-center text-po-on-surface-variant hover:text-po-primary transition-colors" onClick={(e) => ui(e).closeDrawer()} title="Close drawer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {/* Body */}
        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Key Telemetry Summary */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-po-surface-container-low border border-po-surface-container">
            <div className="flex flex-col">
              <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">REGION</span>
              <span className="font-label-mono-sm text-[12px] text-po-primary font-semibold mt-1" id="drawer-region">us-east-1 (N. Virginia)</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">TRANSPORT</span>
              <span className="font-label-mono-sm text-[12px] text-po-primary font-semibold mt-1">TLS / SRTP (Mock)</span>
            </div>
            <div className="flex flex-col mt-1">
              <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">ACTIVE CHANNELS</span>
              <span className="font-label-mono-sm text-[12px] text-po-primary font-semibold mt-1" id="drawer-channels">64 / 250 Allocated</span>
            </div>
            <div className="flex flex-col mt-1">
              <span className="font-label-ui text-[11px] text-po-on-surface-variant uppercase font-semibold">SRV CLUSTER</span>
              <span className="font-label-mono-sm text-[12px] text-po-secondary font-semibold mt-1" id="drawer-cluster">cluster-sip-node-04</span>
            </div>
          </div>
          {/* Ambiguous Timeout Safeguard Banner */}
          <div className="p-3.5 rounded-xl bg-po-surface-container-highest border border-po-surface-container text-po-on-secondary-fixed flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-semibold font-body-sm text-[12.5px] text-po-secondary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Ambiguous Timeout Safeguard</span>
            </div>
            <p className="font-body-sm text-[12px] text-po-on-surface leading-relaxed">When a call request times out (SIP 408), SmartDialX reconciles the call state with the mock provider via asynchronous lookup before initiating any retries — preventing double-dialing.</p>
          </div>
          {/* Failure Handling Matrix */}
          <div className="flex flex-col gap-2">
            <h3 className="font-label-ui text-[11px] text-po-primary uppercase font-bold tracking-wider">SUPPORTED FAILURE HANDLING</h3>
            <div className="flex flex-col gap-2 font-body-sm text-[12px]">
              <div className="p-3 rounded-lg bg-po-surface-container-low border border-po-surface-container flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-po-on-tertiary-container mt-0.5 shrink-0">check_circle</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-po-primary">SIP 503 Circuit Trip Protection</span>
                  <span className="text-po-on-surface-variant text-[11.5px] mt-0.5">Automatically switches to backup routes when threshold exceeds 5% failures within 60s.</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-po-surface-container-low border border-po-surface-container flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-po-on-tertiary-container mt-0.5 shrink-0">check_circle</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-po-primary">Webhook Idempotency Keying</span>
                  <span className="text-po-on-surface-variant text-[11.5px] mt-0.5">SHA-256 event fingerprinting drops redundant webhooks within a 30-minute deduplication window.</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-po-surface-container-low border border-po-surface-container flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-po-on-tertiary-container mt-0.5 shrink-0">check_circle</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-po-primary">Adaptive Pacing Downshift</span>
                  <span className="text-po-on-surface-variant text-[11.5px] mt-0.5">Dynamically scales concurrency down to 1:1 progressive if provider latency passes 200ms.</span>
                </div>
              </div>
            </div>
          </div>
          {/* Simulated Heartbeat Log */}
          <div className="flex flex-col gap-1.5">
            <h3 className="font-label-ui text-[11px] text-po-primary uppercase font-bold tracking-wider">SIMULATED HEARTBEAT LOG</h3>
            <div className="space-y-1.5 font-label-mono-xs text-[11px] text-po-on-surface-variant bg-po-surface-container-low p-3.5 rounded-xl border border-po-surface-container">
              <div className="flex items-center justify-between">
                <span className="text-po-outline">14:38:00</span>
                <span className="text-po-on-tertiary-container font-medium">OPTIONS sip-health-ping (200 OK)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-po-outline">14:36:00</span>
                <span className="text-po-on-tertiary-container font-medium">OPTIONS sip-health-ping (200 OK)</span>
              </div>
              <div className="flex items-center justify-between" id="drawer-recent-anomaly">
                <span className="text-po-outline">14:34:00</span>
                <span className="text-po-on-tertiary-container font-medium">OPTIONS sip-health-ping (200 OK)</span>
              </div>
            </div>
          </div>
        </div>
        {/* Footer Actions */}
        <div className="p-5 bg-po-surface-container-low border-t border-po-surface-container flex items-center justify-between gap-3">
          <button className="h-8 px-3 rounded-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-[12px] font-medium transition-colors flex items-center gap-1.5" id="btn-ping" onClick={(e) => ui(e).triggerPingTest()}>
            <span className="material-symbols-outlined text-[16px]">network_ping</span>
            <span>Simulate Ping</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 rounded-lg bg-po-secondary text-po-on-secondary font-body-sm text-[12px] font-medium hover:bg-po-secondary-container transition-colors" id="btn-reroute" onClick={(e) => ui(e).rerouteFallback()}>Force Fallback</button>
            <button className="h-8 px-3.5 rounded-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-[12px] font-medium transition-colors shadow-sm" onClick={(e) => ui(e).closeDrawer()}>Done</button>
          </div>
        </div>
      </aside>
    </>
  );
}
