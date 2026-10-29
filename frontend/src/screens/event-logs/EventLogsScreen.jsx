"use client";

import { useScreen } from "@/lib/useScreen";
import { mount } from "./behavior";

export default function EventLogsScreen() {
  useScreen(mount);

  return (
    <>
      <div className="font-body-md text-po-on-surface antialiased relative px-space-xl py-space-xl bg-po-background min-h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col w-full space-y-space-lg text-po-on-surface">
          {/* 1. SAFETY & INTEGRITY BANNER */}
          <div className="relative overflow-hidden rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
              <div className="flex items-start md:items-center gap-space-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-po-lg bg-po-surface-container text-po-on-tertiary-container">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-po-primary tracking-tight">Event Integrity Protected</span>
                    <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-on-tertiary-container">
                      <span className="h-1.5 w-1.5 rounded-po-full bg-po-on-tertiary-container" />
                      SHA-256 Idempotency Active
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-po-on-surface-variant mt-0.5">Duplicate events are deduplicated, invalid transitions are prevented, and terminal call states are protected against late events.</p>
                </div>
              </div>
              <div className="flex items-center gap-space-xs shrink-0 self-start md:self-auto">
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant font-medium">PIPELINE: EVT-INGEST-V3</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-po-surface-container-high px-2 py-1 font-label-mono-xs text-label-mono-xs text-po-primary font-semibold">
                  <span className="h-2 w-2 rounded-po-full bg-po-secondary-container animate-pulse" />
                  ZERO LOSS BUFFER
                </span>
              </div>
            </div>
          </div>
          {/* 2. PAGE HEADER CONTROLS (INSPECTION BAR) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <h1 className="font-headline-lg text-headline-lg text-po-primary tracking-tight">
                  Event Logs{" "}
                  &amp;
                  {" "}Recovery
                </h1>
                <span className="rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-secondary font-semibold">RFC-3261 Mock Engine</span>
              </div>
              <p className="font-body-md text-body-md text-po-on-surface-variant">Inspect call events, investigate failures, and review automated reconciliation pipelines in real-time.</p>
            </div>
            {/* Quick Action / Live Sync Hub */}
            <div className="flex flex-wrap items-center gap-space-xs">
              {/* Search Input */}
              <div className="relative min-w-[240px]">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-po-on-surface-variant text-[18px]">search</span>
                {" "}
                <input className="w-full h-8 pl-8 pr-3 rounded-po-lg bg-po-surface-container-lowest text-po-on-surface placeholder:text-po-on-surface-variant/70 font-body-sm text-body-sm outline-none shadow-sm focus:ring-1 focus:ring-po-secondary py-0" id="globalSearchInput" placeholder="Search event ID, call ID, campaign..." type="text" />
              </div>
              {/* Timeframe selector */}
              <div className="relative">
                <select className="h-8 px-2.5 rounded-po-lg bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm outline-none shadow-sm cursor-pointer hover:bg-po-surface-container-low py-0" id="timeRangeSelect" defaultValue="24h">
                  <option value="1h">Last 1 hour</option>
                  <option value="6h">Last 6 hours</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                </select>
              </div>
              {/* Auto sync badge & manual refresh */}
              <button className="h-8 px-3 rounded-po-lg bg-po-surface-container-lowest hover:bg-po-surface-container text-po-on-surface font-body-sm text-body-sm flex items-center gap-1.5 shadow-sm transition-all active:scale-95" id="refreshDataBtn" type="button">
                <span className="material-symbols-outlined text-[16px] text-po-on-tertiary-container animate-spin" id="refreshIcon">sync</span>
                <span className="font-label-mono-xs text-label-mono-xs font-medium">Auto-sync 3s</span>
              </button>
              {/* Simulation Badge */}
              <div className="hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-po-lg bg-po-surface-container-low font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">
                <span className="w-1.5 h-1.5 rounded-po-full bg-po-secondary" />
                <span>Sim Env #US-E2</span>
              </div>
            </div>
          </div>
          {/* 3. KPI CARDS (Executive Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Total Events */}
            <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider">Total Events</span>
                <div className="w-7 h-7 rounded-po-lg bg-po-surface-container flex items-center justify-center text-po-primary">
                  <span className="material-symbols-outlined text-[18px]">dataset</span>
                </div>
              </div>
              <div className="my-space-xs">
                <div className="font-display-kpi text-display-kpi text-po-primary leading-none tracking-tight">1,435</div>
              </div>
              <div className="pt-space-xs flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-po-on-surface-variant truncate">Ingested via mock webhook mesh</span>
                <span className="font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">47.8 evt/s</span>
              </div>
            </div>
            {/* Duplicate Events */}
            <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider">Duplicate Events</span>
                <div className="w-7 h-7 rounded-po-lg bg-po-surface-container flex items-center justify-center text-po-on-tertiary-container">
                  <span className="material-symbols-outlined text-[18px]">filter_vintage</span>
                </div>
              </div>
              <div className="my-space-xs flex items-baseline gap-2">
                <div className="font-display-kpi text-display-kpi text-po-primary leading-none tracking-tight">24</div>
                <span className="rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-tertiary-container font-semibold">1.7% Filtered</span>
              </div>
              <div className="pt-space-xs flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-po-on-surface-variant truncate">Deduplicated via keying</span>
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-tertiary-container font-medium">Zero Impact</span>
              </div>
            </div>
            {/* Failed Operations */}
            <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider">Failed Operations</span>
                <div className="w-7 h-7 rounded-po-lg bg-po-error-container flex items-center justify-center text-po-error">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                </div>
              </div>
              <div className="my-space-xs flex items-baseline gap-2">
                <div className="font-display-kpi text-display-kpi text-po-primary leading-none tracking-tight">12</div>
                <span className="rounded-po-full bg-po-surface-container-high px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-surface font-semibold">0 Unhandled</span>
              </div>
              <div className="pt-space-xs flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-po-on-surface-variant truncate">
                  SIP 503{" "}
                  &amp;
                  {" "}transient errors
                </span>
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface font-medium">100% Caught</span>
              </div>
            </div>
            {/* Recovery Actions */}
            <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-ui text-label-ui text-po-on-surface-variant uppercase tracking-wider">Recovery Actions</span>
                <div className="w-7 h-7 rounded-po-lg bg-po-surface-container flex items-center justify-center text-po-secondary">
                  <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                </div>
              </div>
              <div className="my-space-xs flex items-baseline gap-2">
                <div className="font-display-kpi text-display-kpi text-po-primary leading-none tracking-tight">34</div>
                <span className="rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-secondary font-semibold">100% Resolved</span>
              </div>
              <div className="pt-space-xs flex items-center justify-between">
                <span className="font-body-sm text-body-sm text-po-on-surface-variant truncate">Auto-reconciled safely</span>
                <span className="font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">Safe State</span>
              </div>
            </div>
          </div>
          {/* 4. RECOVERY OVERVIEW SECTION */}
          <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col space-y-space-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-xs">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-po-secondary text-[20px]">healing</span>
                  <h2 className="font-headline-sm text-headline-sm text-po-primary tracking-tight">Recovery Overview</h2>
                </div>
                <p className="font-body-sm text-body-sm text-po-on-surface-variant mt-0.5">SmartDialX reconciles ambiguous provider outcomes before retrying. It does not blindly redial a call merely because a request timed out.</p>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex items-center gap-1.5 rounded-po-lg bg-po-surface-container px-2.5 py-1 font-label-mono-xs text-label-mono-xs text-po-primary font-medium">
                  <span className="h-2 w-2 rounded-po-full bg-po-secondary animate-pulse" />
                  Reconciliation Engine Active
                </span>
              </div>
            </div>
            {/* 3 Compact Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              {/* Pending Reconciliation */}
              <div className="rounded-po-lg bg-po-surface-container-low p-space-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui text-po-on-surface font-semibold uppercase">Pending Reconciliation</span>
                  <span className="px-2 py-0.5 rounded-po-full bg-po-secondary-fixed text-po-on-secondary-fixed font-label-mono-xs text-label-mono-xs font-semibold">Active Polling</span>
                </div>
                <div className="my-space-sm flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-po-primary font-bold">2</span>
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">SIP Ack pending (max 8s)</span>
                </div>
                <p className="font-body-sm text-body-sm text-po-on-surface-variant">Events or call requests awaiting provider confirmation.</p>
              </div>
              {/* Recoverable Reservations */}
              <div className="rounded-po-lg bg-po-surface-container-low p-space-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui text-po-on-surface font-semibold uppercase">Recoverable Reservations</span>
                  <span className="px-2 py-0.5 rounded-po-full bg-po-surface-container text-po-on-tertiary-container font-label-mono-xs text-label-mono-xs font-semibold">Clean</span>
                </div>
                <div className="my-space-sm flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-po-primary font-bold">0</span>
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">0 agent hold locks</span>
                </div>
                <p className="font-body-sm text-body-sm text-po-on-surface-variant">Expired or stale agent reservations eligible for recovery.</p>
              </div>
              {/* Completed Recoveries */}
              <div className="rounded-po-lg bg-po-surface-container-low p-space-md flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui text-po-on-surface font-semibold uppercase">Completed Recoveries</span>
                  <span className="px-2 py-0.5 rounded-po-full bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold">Reconciled</span>
                </div>
                <div className="my-space-sm flex items-baseline gap-2">
                  <span className="font-headline-lg text-headline-lg text-po-primary font-bold">32</span>
                  <span className="font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">100% SLA target</span>
                </div>
                <p className="font-body-sm text-body-sm text-po-on-surface-variant">Requests reconciled or reservations safely restored to pool.</p>
              </div>
            </div>
          </div>
          {/* 5. EVENT STREAM SECTION (MAIN TABLE) */}
          <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col space-y-space-md">
            {/* Table Header & Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <div className="w-2 h-2 rounded-po-full bg-po-secondary" />
                <h2 className="font-headline-sm text-headline-sm text-po-primary tracking-tight">Event Stream</h2>
                <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant bg-po-surface-container px-2 py-0.5 rounded-po" id="recordCountLabel">Showing 8 of 1,435 events</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <button className="h-8 px-3 rounded-po-lg bg-po-surface-container-low hover:bg-po-surface-container text-po-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors" id="exportEventsBtn">
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Export JSON / CSV</span>
                </button>
              </div>
            </div>
            {/* Filter Multi-Select Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-xs p-space-xs bg-po-surface-container-low rounded-po-lg">
              {/* Filter: Event Type */}
              <div>
                <label className="block font-label-mono-xs text-label-mono-xs text-po-on-surface-variant mb-1 px-1">EVENT TYPE</label>
                {" "}
                <select className="w-full h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm outline-none cursor-pointer py-0" id="filterEventType">
                  <option value="ALL">All Event Types</option>
                  <option value="CALL_INITIATED">CALL_INITIATED</option>
                  <option value="BORROWER_WILLING">BORROWER_WILLING</option>
                  <option value="PROVIDER_TIMEOUT">PROVIDER_TIMEOUT</option>
                  <option value="DUPLICATE_EVENT_IGNORED">DUPLICATE_EVENT_IGNORED</option>
                  <option value="SCREENING_COMPLETED">SCREENING_COMPLETED</option>
                  <option value="TRANSFER_CONFIRMED">TRANSFER_CONFIRMED</option>
                  <option value="RECOVERY_COMPLETED">RECOVERY_COMPLETED</option>
                </select>
              </div>
              {/* Filter: Provider */}
              <div>
                <label className="block font-label-mono-xs text-label-mono-xs text-po-on-surface-variant mb-1 px-1">PROVIDER</label>
                {" "}
                <select className="w-full h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm outline-none cursor-pointer py-0" id="filterProvider">
                  <option value="ALL">All Providers</option>
                  <option value="Gateway A">Mock SIP Gateway A</option>
                  <option value="Gateway B">Mock SIP Gateway B</option>
                </select>
              </div>
              {/* Filter: Campaign */}
              <div>
                <label className="block font-label-mono-xs text-label-mono-xs text-po-on-surface-variant mb-1 px-1">CAMPAIGN</label>
                {" "}
                <select className="w-full h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm outline-none cursor-pointer py-0" id="filterCampaign">
                  <option value="ALL">All Campaigns</option>
                  <option value="Q3 Renewal">Q3 Renewal Outreach</option>
                  <option value="Auto Claims">Auto Claims Pilot</option>
                  <option value="Cold Inquiries">Cold Inquiries Tier 1</option>
                </select>
              </div>
              {/* Filter: Severity */}
              <div>
                <label className="block font-label-mono-xs text-label-mono-xs text-po-on-surface-variant mb-1 px-1">SEVERITY</label>
                {" "}
                <select className="w-full h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm outline-none cursor-pointer py-0" id="filterSeverity">
                  <option value="ALL">All Severities</option>
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Error">Error</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              {/* Filter: Status */}
              <div>
                <label className="block font-label-mono-xs text-label-mono-xs text-po-on-surface-variant mb-1 px-1">PROCESSING STATUS</label>
                {" "}
                <select className="w-full h-8 px-2 rounded-po bg-po-surface-container-lowest text-po-on-surface font-body-sm text-body-sm outline-none cursor-pointer py-0" id="filterStatus">
                  <option value="ALL">All Statuses</option>
                  <option value="Processed">Processed</option>
                  <option value="Ignored — Duplicate">Ignored — Duplicate</option>
                  <option value="Rejected — Invalid">Rejected — Invalid</option>
                  <option value="Pending Reconciliation">Pending Reconciliation</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              {/* Reset Filter Action */}
              <div className="flex items-end">
                <button className="w-full h-8 px-2 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-body-sm font-medium flex items-center justify-center gap-1 transition-colors" id="clearFiltersBtn">
                  <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
            {/* Data Grid Container */}
            <div className="overflow-x-auto rounded-po-lg bg-po-surface-container-lowest">
              <table className="w-full text-left border-collapse" id="eventStreamTable">
                <thead>
                  <tr className="h-8 bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-label-ui uppercase tracking-wider">
                    <th className="py-2 px-3 font-semibold">Timestamp</th>
                    <th className="py-2 px-3 font-semibold">Event ID</th>
                    <th className="py-2 px-3 font-semibold">Event Type</th>
                    <th className="py-2 px-3 font-semibold">Call ID</th>
                    <th className="py-2 px-3 font-semibold">Campaign</th>
                    <th className="py-2 px-3 font-semibold">Provider</th>
                    <th className="py-2 px-3 font-semibold text-center">Severity</th>
                    <th className="py-2 px-3 font-semibold">Processing Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-po-surface-container font-body-sm text-body-sm" id="eventStreamBody">
                  {/* Row 1 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors event-row" data-call="CALL-20482" data-camp="Q3 Renewal Outreach" data-decision="Processed (State machine advanced)" data-desc="Handshake completed via SIP re-INVITE. Callee transferred cleanly to human agent buffer AG-104. Latency 310ms." data-id="EVT-83021" data-prov="Gateway A" data-reason="SIP 200 OK received with SDP ACK" data-sev="Info" data-state-change="SCREENING_ACTIVE -> CONNECTED_AGENT" data-status="Processed" data-stored="Yes (Partition #04)" data-time="14:38:12.410 UTC" data-type="TRANSFER_CONFIRMED">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:38:12.410</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">EVT-83021</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-on-tertiary-container">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-on-tertiary-container" />
                        TRANSFER_CONFIRMED
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20482</td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[140px]">Q3 Renewal Outreach</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">Mock SIP Gateway A</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs text-label-mono-xs">Info</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-tertiary-container font-semibold">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-on-tertiary-container" />
                        Processed
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-inspect">Inspect</button>
                    </td>
                  </tr>
                  {/* Row 2 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors event-row" data-call="CALL-20481" data-camp="Auto Claims Pilot" data-decision="Pending (Reconciler locked call)" data-desc="Gateway B failed to return SIP 180 Ringing within 4500ms timeout threshold. Auto-poller invoked secondary verification." data-id="EVT-83020" data-prov="Gateway B" data-reason="SIP 408 Request Timeout" data-sev="Warning" data-state-change="DIALING -> RECONCILIATION_LOCK" data-status="Pending Reconciliation" data-stored="Yes (Partition #04)" data-time="14:37:58.114 UTC" data-type="PROVIDER_TIMEOUT">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:37:58.114</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">EVT-83020</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-surface-container-high px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-on-surface">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-secondary" />
                        PROVIDER_TIMEOUT
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20481</td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[140px]">Auto Claims Pilot</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">Mock SIP Gateway B</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-po bg-po-secondary-fixed text-po-on-secondary-fixed font-label-mono-xs text-label-mono-xs font-semibold">Warning</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-secondary-fixed text-po-on-secondary-fixed px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-semibold">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-secondary animate-pulse" />
                        Pending Reconciliation
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-inspect">Inspect</button>
                    </td>
                  </tr>
                  {/* Row 3 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors event-row" data-call="CALL-20482" data-camp="Q3 Renewal Outreach" data-decision="Ignored (Deduplication match)" data-desc="Webhook delivered twice with identical HMAC sha256 checksum (0x8f2d...41). Suppressed without altering state machine." data-id="EVT-83019" data-prov="Gateway A" data-reason="SHA-256 payload hash collision detected" data-sev="Info" data-state-change="NO_STATE_MUTATION" data-status="Ignored — Duplicate" data-stored="Yes (Audit Log Only)" data-time="14:37:45.890 UTC" data-type="DUPLICATE_EVENT_IGNORED">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:37:45.890</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">EVT-83019</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-on-surface-variant">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-outline" />
                        DUPLICATE_EVENT_IGNORED
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20482</td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[140px]">Q3 Renewal Outreach</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">Mock SIP Gateway A</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs text-label-mono-xs">Info</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant font-semibold">Ignored — Duplicate</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-inspect">Inspect</button>
                    </td>
                  </tr>
                  {/* Row 4 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors event-row" data-call="CALL-20482" data-camp="Q3 Renewal Outreach" data-decision="Processed (Agent reservation secured)" data-desc="AI Screening engine detected positive intent ('Yes I have 5 minutes'). Dispatched priority reservation token to AG-104." data-id="EVT-83018" data-prov="Gateway A" data-reason="Intent confidence 0.94 via DialX-Voice-v2.1" data-sev="Info" data-state-change="SCREENING -> RESERVATION_LOCKED" data-status="Processed" data-stored="Yes (Partition #04)" data-time="14:36:50.002 UTC" data-type="BORROWER_WILLING">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:36:50.002</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">EVT-83018</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-on-tertiary-container">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-on-tertiary-container" />
                        BORROWER_WILLING
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20482</td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[140px]">Q3 Renewal Outreach</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">Mock SIP Gateway A</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs text-label-mono-xs">Info</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-tertiary-container font-semibold">Processed</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-inspect">Inspect</button>
                    </td>
                  </tr>
                  {/* Row 5 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors event-row" data-call="CALL-20475" data-camp="Cold Inquiries Tier 1" data-decision="Recovered (Reconciliation Pipeline REC-4019)" data-desc="Automated reconciliation verified call was never placed by carrier. Pacer rate-limiter capacity returned to bucket cleanly." data-id="EVT-83017" data-prov="Gateway B" data-reason="Carrier CDR confirmed null leg" data-sev="Info" data-state-change="STALE_CALL -> RECONCILED_TERMINATED" data-status="Recovered" data-stored="Yes (Partition #03)" data-time="14:35:42.110 UTC" data-type="RECOVERY_COMPLETED">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:35:42.110</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">EVT-83017</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-secondary">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-secondary" />
                        RECOVERY_COMPLETED
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20475</td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[140px]">Cold Inquiries Tier 1</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">Mock SIP Gateway B</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs text-label-mono-xs">Info</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-secondary font-semibold">Recovered</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-inspect">Inspect</button>
                    </td>
                  </tr>
                  {/* Row 6 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors event-row" data-call="CALL-20478" data-camp="Cold Inquiries Tier 1" data-decision="Processed (Call concluded cleanly)" data-desc="Recipient responded 'Remove me from list'. AI conversational bot cleanly registered DNC tag and initiated BYE sequence." data-id="EVT-83016" data-prov="Gateway A" data-reason="DNC Opt-out detected" data-sev="Info" data-state-change="SCREENING -> DISCONNECTED_DNC" data-status="Processed" data-stored="Yes (Partition #04)" data-time="14:34:10.551 UTC" data-type="SCREENING_COMPLETED">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:34:10.551</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">EVT-83016</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-on-surface">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-outline" />
                        SCREENING_COMPLETED
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20478</td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[140px]">Cold Inquiries Tier 1</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">Mock SIP Gateway A</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs text-label-mono-xs">Info</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-tertiary-container font-semibold">Processed</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-inspect">Inspect</button>
                    </td>
                  </tr>
                  {/* Row 7 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors event-row" data-call="CALL-20482" data-camp="Q3 Renewal Outreach" data-decision="Processed (Outbound leg established)" data-desc="SIP INVITE dispatched. Trunk concurrency allocated at 11/12 rate limit threshold." data-id="EVT-83015" data-prov="Gateway A" data-reason="Safety pacing token authorized" data-sev="Info" data-state-change="IDLE -> DIALING" data-status="Processed" data-stored="Yes (Partition #04)" data-time="14:32:01.004 UTC" data-type="CALL_INITIATED">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:32:01.004</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">EVT-83015</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-secondary">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-secondary" />
                        CALL_INITIATED
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20482</td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[140px]">Q3 Renewal Outreach</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">Mock SIP Gateway A</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-po bg-po-surface-container text-po-on-surface font-label-mono-xs text-label-mono-xs">Info</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-tertiary-container font-semibold">Processed</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-inspect">Inspect</button>
                    </td>
                  </tr>
                  {/* Row 8 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors event-row" data-call="CALL-20469" data-camp="Auto Claims Pilot" data-decision="Rejected (Terminal Call State Protected)" data-desc="Received late SIP 180 Ringing packet after call was already marked TERMINATED. Event rejected to preserve idempotent state integrity." data-id="EVT-83014" data-prov="Gateway B" data-reason="Late packet dropped by state guard" data-sev="Error" data-state-change="NO_MUTATION (Guard Blocked)" data-status="Rejected — Invalid" data-stored="Yes (Audit Log Only)" data-time="14:30:19.822 UTC" data-type="REJECTED_TRANSITION">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:30:19.822</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">EVT-83014</td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po bg-po-error-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs font-medium text-po-error">
                        <span className="h-1.5 w-1.5 rounded-po-full bg-po-error" />
                        REJECTED_TRANSITION
                      </span>
                    </td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20469</td>
                    <td className="py-2 px-3 text-po-on-surface font-medium truncate max-w-[140px]">Auto Claims Pilot</td>
                    <td className="py-2 px-3 text-po-on-surface-variant whitespace-nowrap">Mock SIP Gateway B</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-po bg-po-error-container text-po-error font-label-mono-xs text-label-mono-xs font-bold">Error</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-error-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-error font-semibold">Rejected — Invalid</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-inspect">Inspect</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Table Footer Note */}
            <div className="flex items-center justify-between text-po-on-surface-variant font-body-sm text-body-sm pt-space-xs">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Privacy-Compliant Mode: No raw customer phone numbers or PII are exposed in the activity audit.</span>
              </div>
              <span className="font-label-mono-xs text-label-mono-xs">Partitioned by event timestamp (UTC)</span>
            </div>
          </div>
          {/* 6. RECENT RECOVERY ACTIONS TABLE */}
          <div className="rounded-po-xl bg-po-surface-container-lowest p-space-md shadow-sm flex flex-col space-y-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-po-secondary text-[20px]">rule_folder</span>
                  <h2 className="font-headline-sm text-headline-sm text-po-primary tracking-tight">Recent Recovery Actions</h2>
                </div>
                <p className="font-body-sm text-body-sm text-po-on-surface-variant mt-0.5">Audit log of automated reconciliation pipelines and state machine fixes.</p>
              </div>
              <a className="inline-flex items-center gap-1 text-po-secondary font-headline-sm text-body-sm hover:underline" href="#">
                <span>View Live Operations</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
            </div>
            {/* Recovery Actions Table */}
            <div className="overflow-x-auto rounded-po-lg bg-po-surface-container-lowest">
              <table className="w-full text-left border-collapse" id="recoveryActionsTable">
                <thead>
                  <tr className="h-8 bg-po-surface-container-low text-po-on-surface-variant font-label-ui text-label-ui uppercase tracking-wider">
                    <th className="py-2 px-3 font-semibold">Time</th>
                    <th className="py-2 px-3 font-semibold">Recovery ID</th>
                    <th className="py-2 px-3 font-semibold">Call ID</th>
                    <th className="py-2 px-3 font-semibold">Recovery Type</th>
                    <th className="py-2 px-3 font-semibold">Reason</th>
                    <th className="py-2 px-3 font-semibold">Outcome</th>
                    <th className="py-2 px-3 font-semibold text-center">Status</th>
                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-po-surface-container font-body-sm text-body-sm">
                  {/* Rec 1 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors recovery-row" data-action-taken="Cancelled pending reservation, freed Agent AG-1048 back to available pool without dialing second leg." data-call-id="CALL-20482" data-cond="Ambiguous gateway response on SIP INVITE handshake" data-orig-state="INVITE_SENT" data-provider-res="Queried Gateway B via secondary REST telemetry. Gateway confirmed call was NOT established." data-rec-id="REC-4019" data-step1="SIP 408 Timeout from Carrier Gateway B" data-step2="Initiated asynchronous carrier inquiry via REST webhook" data-step3="Confirmed 0 trunk allocation on carrier switch" data-step4="Cleared call state and restored pacer token" data-step5="Clean auto-reconciliation complete. Agent reservation safely returned.">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:35:40 UTC</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">REC-4019</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20482</td>
                    <td className="py-2 px-3 font-medium text-po-on-surface">Provider lookup after timeout</td>
                    <td className="py-2 px-3 text-po-on-surface-variant truncate max-w-[200px]">SIP 408 timeout on Gateway B</td>
                    <td className="py-2 px-3 text-po-on-surface">Reconciled clean</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-on-tertiary-container font-semibold">Success</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-view-recovery">View Recovery</button>
                    </td>
                  </tr>
                  {/* Rec 2 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors recovery-row" data-action-taken="Released locked reservation, reassigned queue token, updated dispatcher state." data-call-id="CALL-20475" data-cond="Expired Agent reservation lock exceeded maximum allowable threshold" data-orig-state="RESERVED_PENDING" data-provider-res="Agent AG-102 did not acknowledge SIP bridge within 45s SLA." data-rec-id="REC-4018" data-step1="Reservation SLA timer threshold expired (45,000ms)" data-step2="Reconciliation engine verified call is still awaiting connect" data-step3="Revoked reservation lock for agent AG-102" data-step4="Re-queued borrower to high-priority transfer buffer" data-step5="Agent released to pool, pacer queue synchronized.">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:31:12 UTC</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">REC-4018</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20475</td>
                    <td className="py-2 px-3 font-medium text-po-on-surface">Expired reservation released</td>
                    <td className="py-2 px-3 text-po-on-surface-variant truncate max-w-[200px]">Reservation SLA 45s exceeded</td>
                    <td className="py-2 px-3 text-po-on-surface">Agent released to pool</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-secondary font-semibold">Resolved</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-view-recovery">View Recovery</button>
                    </td>
                  </tr>
                  {/* Rec 3 */}
                  <tr className="h-10 hover:bg-po-surface-container-low/70 cursor-pointer transition-colors recovery-row" data-action-taken="Re-aligned state machine sequentially, applied final disconnect status safely." data-call-id="CALL-20468" data-cond="Out-of-order packet sequence caused state misalignment" data-orig-state="SCREENING_DONE" data-provider-res="Carrier delivered BYE before 200 OK transfer confirmation was ingested." data-rec-id="REC-4017" data-step1="Detected out-of-order sequence: BYE before ACK" data-step2="Buffered late packet and invoked carrier leg reconciliation" data-step3="Verified call duration from trunk CDR (18.4s)" data-step4="Synthesized missing intermediate state cleanly" data-step5="State realigned without generating false alarms.">
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-on-surface-variant whitespace-nowrap">14:28:05 UTC</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs font-semibold text-po-primary">REC-4017</td>
                    <td className="py-2 px-3 font-label-mono-xs text-label-mono-xs text-po-secondary font-medium">CALL-20468</td>
                    <td className="py-2 px-3 font-medium text-po-on-surface">Stale call state reconciled</td>
                    <td className="py-2 px-3 text-po-on-surface-variant truncate max-w-[200px]">Out-of-order packet sequence</td>
                    <td className="py-2 px-3 text-po-on-surface">State realigned</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-po-full bg-po-surface-container px-2 py-0.5 font-label-mono-xs text-label-mono-xs text-po-secondary font-semibold">Resolved</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button className="px-2.5 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-label-mono-xs text-label-mono-xs font-semibold transition-colors btn-view-recovery">View Recovery</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* ======================================================== */}
          {/* 7A. INTERACTIVE SLIDE-OVER DRAWER: EVENT DETAILS */}
          {/* ======================================================== */}
          <div className="fixed inset-0 z-50 bg-po-primary/40 backdrop-blur-[2px] transition-opacity duration-200 hidden opacity-0" id="eventDrawerOverlay">
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-md bg-po-surface-container-lowest shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-out" id="eventDrawerPanel">
                {/* Drawer Header */}
                <div className="p-space-md bg-po-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-8 h-8 rounded-po-lg bg-po-surface-container flex items-center justify-center text-po-primary">
                      <span className="material-symbols-outlined text-[20px]">manage_search</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-headline-sm text-po-primary tracking-tight font-bold" id="drawerEventId">EVT-83021</span>
                        <span className="rounded-po px-2 py-0.5 font-label-mono-xs text-label-mono-xs bg-po-surface-container text-po-on-surface font-semibold" id="drawerSeverityBadge">Info</span>
                      </div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">SIP Transaction Event Record</span>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-po-lg hover:bg-po-surface-container flex items-center justify-center text-po-on-surface-variant hover:text-po-on-surface transition-colors" id="closeEventDrawerBtn">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                {/* Drawer Content Body */}
                <div className="p-space-md flex-1 overflow-y-auto space-y-space-md font-body-sm text-body-sm">
                  {/* Key Meta Grid */}
                  <div className="grid grid-cols-2 gap-space-xs bg-po-surface-container-low p-space-sm rounded-po-lg">
                    <div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block uppercase">Timestamp (UTC)</span>
                      {" "}
                      <span className="font-label-mono-xs text-label-mono-xs font-semibold text-po-primary" id="drawerTimestamp">14:38:12.410</span>
                    </div>
                    <div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block uppercase">Event Type</span>
                      {" "}
                      <span className="font-label-mono-xs text-label-mono-xs font-semibold text-po-secondary" id="drawerEventType">TRANSFER_CONFIRMED</span>
                    </div>
                    <div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block uppercase">Call ID</span>
                      {" "}
                      <span className="font-label-mono-xs text-label-mono-xs font-semibold text-po-secondary" id="drawerCallId">CALL-20482</span>
                    </div>
                    <div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block uppercase">Campaign</span>
                      {" "}
                      <span className="font-body-sm text-body-sm font-semibold text-po-primary truncate block" id="drawerCampaign">Q3 Renewal Outreach</span>
                    </div>
                    <div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block uppercase">Carrier Provider</span>
                      {" "}
                      <span className="font-body-sm text-body-sm text-po-on-surface" id="drawerProvider">Mock SIP Gateway A</span>
                    </div>
                    <div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block uppercase">Processing Status</span>
                      {" "}
                      <span className="font-label-mono-xs text-label-mono-xs font-semibold text-po-on-tertiary-container" id="drawerStatus">Processed</span>
                    </div>
                  </div>
                  {/* Description Box */}
                  <div>
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block mb-1">Operational Description</span>
                    <div className="p-space-sm bg-po-surface-container-low rounded-po-lg text-po-on-surface leading-relaxed" id="drawerDesc">Handshake completed via SIP re-INVITE. Callee transferred cleanly to human agent buffer AG-104. Latency 310ms.</div>
                  </div>
                  {/* Processing State Machine Box */}
                  <div className="space-y-space-xs">
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block">State Machine Processing Decision</span>
                    <div className="rounded-po-lg bg-po-surface-container-low p-space-sm space-y-space-xs font-label-mono-xs text-label-mono-xs">
                      <div className="flex justify-between">
                        <span className="text-po-on-surface-variant">Ledger Stored:</span>
                        <span className="text-po-primary font-medium" id="drawerStored">Yes (Partition #04)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-po-on-surface-variant">Decision:</span>
                        <span className="text-po-primary font-semibold" id="drawerDecision">Processed (State machine advanced)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-po-on-surface-variant">Reason:</span>
                        <span className="text-po-on-surface truncate max-w-[220px]" id="drawerReason">SIP 200 OK received with SDP ACK</span>
                      </div>
                      <div className="pt-1 flex flex-col gap-1">
                        <span className="text-po-on-surface-variant">State Transition:</span>
                        <span className="p-1 rounded-po bg-po-surface-container-lowest text-po-secondary font-semibold text-center" id="drawerStateChange">SCREENING_ACTIVE → CONNECTED_AGENT</span>
                      </div>
                    </div>
                  </div>
                  {/* Related Events */}
                  <div>
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block mb-1">Related Sequence In Same Call</span>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-secondary font-label-mono-xs text-label-mono-xs cursor-pointer">← EVT-83018 (BORROWER_WILLING)</span>
                      <span className="px-2 py-1 rounded-po bg-po-surface-container hover:bg-po-surface-container-high text-po-secondary font-label-mono-xs text-label-mono-xs cursor-pointer">← EVT-83015 (CALL_INITIATED)</span>
                    </div>
                  </div>
                </div>
                {/* Drawer Footer */}
                <div className="p-space-md bg-po-surface-container-low flex items-center justify-between">
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Idempotency Key: 0x8fa1..c2</span>
                  <button className="px-3 py-1.5 rounded-po-lg bg-po-primary hover:bg-po-primary-container text-po-on-primary font-body-sm text-body-sm font-medium transition-colors flex items-center gap-1" id="copyJsonBtn">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    <span>Copy Raw JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* ======================================================== */}
          {/* 7B. INTERACTIVE SLIDE-OVER DRAWER: RECOVERY DETAILS */}
          {/* ======================================================== */}
          <div className="fixed inset-0 z-50 bg-po-primary/40 backdrop-blur-[2px] transition-opacity duration-200 hidden opacity-0" id="recoveryDrawerOverlay">
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-lg bg-po-surface-container-lowest shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300 ease-out" id="recoveryDrawerPanel">
                {/* Header */}
                <div className="p-space-md bg-po-surface-container-low flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-8 h-8 rounded-po-lg bg-po-surface-container flex items-center justify-center text-po-secondary">
                      <span className="material-symbols-outlined text-[20px]">rebase_edit</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-headline-sm text-po-primary tracking-tight font-bold" id="recDrawerId">REC-4019</span>
                        <span className="rounded-po px-2 py-0.5 font-label-mono-xs text-label-mono-xs bg-po-surface-container text-po-on-tertiary-container font-semibold">Auto-Reconciled</span>
                      </div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Automated Safe Failure Recovery Pipeline</span>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-po-lg hover:bg-po-surface-container flex items-center justify-center text-po-on-surface-variant hover:text-po-on-surface transition-colors" id="closeRecDrawerBtn">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                {/* Body */}
                <div className="p-space-md flex-1 overflow-y-auto space-y-space-md font-body-sm text-body-sm">
                  {/* Context summary */}
                  <div className="bg-po-surface-container-low p-space-sm rounded-po-lg space-y-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant uppercase">Associated Call ID</span>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-secondary font-bold" id="recDrawerCallId">CALL-20482</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant uppercase">Original Ambiguous State</span>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface bg-po-surface-container-lowest px-1.5 py-0.5 rounded-po" id="recDrawerOrigState">INVITE_SENT</span>
                    </div>
                    <div>
                      <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant uppercase block mb-0.5">Trigger Condition</span>
                      <p className="text-po-on-surface font-medium" id="recDrawerCond">Ambiguous gateway response on SIP INVITE handshake.</p>
                    </div>
                  </div>
                  {/* Provider Lookup & Action Cards */}
                  <div className="space-y-space-xs">
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container-low">
                      <div className="flex items-center gap-1.5 text-po-primary font-label-ui text-label-ui uppercase mb-1">
                        <span className="material-symbols-outlined text-[16px] text-po-secondary">satellite_alt</span>
                        <span>Provider Telemetry Inquiry</span>
                      </div>
                      <p className="text-po-on-surface" id="recDrawerProviderRes">Queried Gateway B via secondary REST telemetry. Gateway confirmed call was NOT established.</p>
                    </div>
                    <div className="p-space-sm rounded-po-lg bg-po-surface-container">
                      <div className="flex items-center gap-1.5 text-po-on-tertiary-container font-label-ui text-label-ui uppercase mb-1">
                        <span className="material-symbols-outlined text-[16px] text-po-on-tertiary-container">check_circle</span>
                        <span>Safe Recovery Action Applied</span>
                      </div>
                      <p className="text-po-on-surface" id="recDrawerActionTaken">Cancelled pending reservation, freed Agent AG-1048 back to available pool without dialing second leg.</p>
                    </div>
                  </div>
                  {/* Step-by-Step Audit Timeline */}
                  <div>
                    <span className="font-label-ui text-label-ui uppercase tracking-wider text-po-on-surface-variant block mb-2">Reconciliation Audit Trail</span>
                    <div className="space-y-space-xs pl-2 border-l-2 border-po-surface-container font-body-sm text-body-sm">
                      <div className="relative pl-4">
                        <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-po-full bg-po-error" />
                        {" "}
                        <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block">1. Problem Detected</span>
                        <p className="text-po-on-surface" id="recStep1">SIP 408 Timeout from Carrier Gateway B</p>
                      </div>
                      <div className="relative pl-4">
                        <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-po-full bg-po-secondary" />
                        {" "}
                        <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block">2. Reconciliation Started</span>
                        <p className="text-po-on-surface" id="recStep2">Initiated asynchronous carrier inquiry via REST webhook</p>
                      </div>
                      <div className="relative pl-4">
                        <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-po-full bg-po-secondary" />
                        {" "}
                        <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block">3. Provider State Checked</span>
                        <p className="text-po-on-surface" id="recStep3">Confirmed 0 trunk allocation on carrier switch</p>
                      </div>
                      <div className="relative pl-4">
                        <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-po-full bg-po-on-tertiary-container" />
                        {" "}
                        <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block">4. Safe Action Applied</span>
                        <p className="text-po-on-surface" id="recStep4">Cleared call state and restored pacer token</p>
                      </div>
                      <div className="relative pl-4">
                        <span className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-po-full bg-po-on-tertiary-container" />
                        {" "}
                        <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant block">5. Final Result Recorded</span>
                        <p className="text-po-on-surface" id="recStep5">Clean auto-reconciliation complete. Agent reservation safely returned.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="p-space-md bg-po-surface-container-low flex items-center justify-between">
                  <span className="font-label-mono-xs text-label-mono-xs text-po-on-surface-variant">Reconciliation SLA: 1.2s total</span>
                  <button className="px-3 py-1.5 rounded-po-lg bg-po-surface-container hover:bg-po-surface-container-high text-po-primary font-body-sm text-body-sm font-medium transition-colors" id="closeRecDrawerFooterBtn">Close Audit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* INTERACTIVITY CONTROLLERS */}
      </div>
    </>
  );
}
