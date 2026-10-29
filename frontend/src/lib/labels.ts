// What the backend's enums and codes mean on screen, in one place so every screen
// names and colours them the same way.

export type Tone = "teal" | "amber" | "blue" | "green" | "violet" | "slate" | "gray" | "red" | "indigo";

export const TONE: Record<Tone, { badge: string; dot: string; bar: string; text: string }> = {
  teal: { badge: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500", bar: "bg-teal-500", text: "text-teal-700" },
  amber: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", bar: "bg-amber-400", text: "text-amber-700" },
  blue: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", bar: "bg-blue-500", text: "text-blue-700" },
  green: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-700" },
  violet: { badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-400", bar: "bg-violet-400", text: "text-violet-700" },
  slate: { badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-500", bar: "bg-slate-400", text: "text-slate-700" },
  gray: { badge: "bg-slate-50 text-slate-500 border-slate-200", dot: "bg-slate-300", bar: "bg-slate-200", text: "text-slate-500" },
  red: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", bar: "bg-rose-500", text: "text-rose-700" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500", bar: "bg-indigo-500", text: "text-indigo-700" },
};

type Label = { label: string; tone: Tone; hint?: string };

function lookup(map: Record<string, Label>, key: string | null | undefined, fallback: Tone = "slate"): Label {
  if (!key) return { label: "—", tone: "gray" };
  return map[key] ?? { label: humanize(key), tone: fallback };
}

export function humanize(key: string): string {
  const text = key.replace(/[_:]+/g, " ").trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const AGENT_STATES: Record<string, Label> = {
  AVAILABLE: { label: "Available", tone: "teal", hint: "Free for the next call or transfer" },
  RESERVED: { label: "Reserved", tone: "amber", hint: "Held for a call or a screened borrower" },
  DIALING: { label: "Dialing", tone: "blue", hint: "Call placed, borrower not on the line yet" },
  CONNECTED: { label: "Connected", tone: "green", hint: "Talking to a borrower" },
  WRAP_UP: { label: "Wrap-up", tone: "violet", hint: "Finishing notes after a call" },
  PAUSED: { label: "Paused", tone: "slate", hint: "Not taking calls" },
  OFFLINE: { label: "Offline", tone: "gray", hint: "Logged out" },
};
export const AGENT_STATE_ORDER = ["AVAILABLE", "RESERVED", "DIALING", "CONNECTED", "WRAP_UP", "PAUSED", "OFFLINE"];
export const agentState = (s: string | null | undefined) => lookup(AGENT_STATES, s);

export const CALL_STATES: Record<string, Label> = {
  QUEUED: { label: "Queued", tone: "gray" },
  RESERVED: { label: "Reserved", tone: "amber" },
  INITIATED: { label: "Initiated", tone: "blue" },
  RINGING: { label: "Ringing", tone: "blue" },
  ANSWERED: { label: "Answered", tone: "indigo" },
  SCREENING: { label: "Screening", tone: "indigo", hint: "Mock bot talking to the borrower" },
  TRANSFER_PENDING: { label: "Transfer pending", tone: "amber", hint: "Willing, waiting for or being handed to an agent" },
  CONNECTED: { label: "Connected", tone: "green" },
  COMPLETED: { label: "Completed", tone: "slate" },
  FAILED: { label: "Failed", tone: "red" },
  CANCELLED: { label: "Cancelled", tone: "gray" },
  ABANDONED: { label: "Abandoned", tone: "red", hint: "Answered with no agent free" },
};
export const LIVE_CALL_STATES = ["RESERVED", "INITIATED", "RINGING", "ANSWERED", "SCREENING", "TRANSFER_PENDING", "CONNECTED"];
export const callState = (s: string | null | undefined) => lookup(CALL_STATES, s);

export const OUTCOMES: Record<string, Label> = {
  in_progress: { label: "Screening in progress", tone: "blue" },
  willing: { label: "Willing to talk", tone: "green" },
  callback_later: { label: "Callback later", tone: "amber" },
  declined: { label: "Declined", tone: "slate" },
  no_answer: { label: "No answer", tone: "gray" },
  busy: { label: "Busy", tone: "gray" },
  screening_failed: { label: "Screening failed", tone: "red" },
  not_reached: { label: "Not reached", tone: "gray" },
  not_started: { label: "Not started", tone: "gray" },
};
export const outcome = (o: string | null | undefined) =>
  o ? lookup(OUTCOMES, o) : { label: "Direct call", tone: "gray" as Tone, hint: "No screening on this campaign" };

export const CAMPAIGN_STATUS: Record<string, Label> = {
  RUNNING: { label: "Running", tone: "green" },
  PAUSED: { label: "Paused", tone: "amber" },
  STOPPED: { label: "Stopped", tone: "red" },
  COMPLETED: { label: "Completed", tone: "slate", hint: "Every borrower has an outcome" },
};
export const campaignStatus = (s: string | null | undefined) => lookup(CAMPAIGN_STATUS, s);

export const DECISIONS: Record<string, Label> = {
  APPROVE: { label: "Approved", tone: "green" },
  REDUCE: { label: "Reduced", tone: "amber" },
  REJECT: { label: "Blocked", tone: "red" },
  FORCE_PROGRESSIVE: { label: "Forced progressive", tone: "violet" },
};
export const decision = (a: string | null | undefined) => lookup(DECISIONS, a);

export const SAFETY_STATUS: Record<string, Label> = {
  operational: { label: "Operational", tone: "green", hint: "Pacing requests are being approved" },
  restricted: { label: "Restricted", tone: "amber", hint: "Requests are being reduced or blocked" },
  forced_progressive: { label: "Forced progressive", tone: "violet", hint: "Predictive pacing is suspended" },
  provider_unavailable: { label: "Provider unavailable", tone: "red", hint: "New calls stopped on a failing provider" },
  idle: { label: "Idle", tone: "gray", hint: "No running campaign" },
};
export const safetyStatus = (s: string | null | undefined) => lookup(SAFETY_STATUS, s);

export const PROVIDER_STATUS: Record<string, Label> = {
  operational: { label: "Operational", tone: "green" },
  degraded: { label: "Degraded", tone: "amber" },
  outage: { label: "Outage", tone: "red" },
};
export const providerStatus = (s: string | null | undefined) => lookup(PROVIDER_STATUS, s);

// safety controller reasons arrive as "key: detail"
const REASONS: Record<string, string> = {
  campaign_not_running: "Campaign not running",
  provider_unhealthy: "Provider error rate over the limit",
  cold_start: "Not enough outcomes yet for predictive",
  abandon_rate: "Abandon rate over the limit",
  answer_rate_jump: "Answer rate jumped suddenly",
  bound_cap: "Limited to free agents",
  overdial_cap: "Predictive over-dial limit",
  active_cap: "Live call ceiling",
  tick_cap: "Per-round call limit",
  campaign_cap: "Campaign call limit",
  provider_probe: "Probing a failing provider",
  transfer_backlog: "Willing borrowers already waiting",
  screening_cap: "Bot calls limited to free agents",
  screening_overdial_cap: "Screening over-dial limit",
  bot_cap: "Bot concurrency limit",
  transfer_fail_rate: "Too many willing borrowers missed",
};

export function reason(raw: string): { key: string; label: string; detail: string } {
  const i = raw.indexOf(":");
  const key = i === -1 ? raw : raw.slice(0, i);
  const detail = i === -1 ? "" : raw.slice(i + 1).trim();
  return { key, label: REASONS[key] ?? humanize(key), detail };
}

export const END_REASONS: Record<string, string> = {
  completed: "Completed",
  hangup: "Hung up",
  not_interested: "Not interested (short call)",
  no_answer: "No answer",
  busy: "Busy",
  failed: "Provider failure",
  network: "Network drop",
  timed_out: "Timed out",
  provider_rejected: "Provider rejected the request",
  not_placed: "Never placed (confirmed with provider)",
  unreconciled: "Provider unreachable, gave up",
  lost: "Provider had no record",
  agent_left: "Agent logged off",
  answered_no_agent: "Answered, no agent free",
  no_agent: "Answered, no agent free",
  screen_unavailable: "Can't talk now (callback)",
  screen_declined: "Declined an agent",
  screen_failed: "Bot couldn't finish",
  no_agent_transfer: "No agent within the wait time",
  caller_left_hold: "Hung up while waiting",
  transfer_blocked: "Transfer blocked by safety",
  caller_hung_up: "Hung up",
  bot_ended: "Bot ended the call",
  campaign_stopped: "Campaign stopped",
  declined: "Declined",
  lease_expired: "Reservation expired",
};
export const endReason = (r: string | null | undefined) => (r ? END_REASONS[r] ?? humanize(r) : "—");

export const RECOVERY_ACTIONS: Record<string, Label> = {
  released: { label: "Expired reservation released", tone: "teal" },
  not_placed: { label: "Request not found at provider", tone: "teal", hint: "Safe to retry, nothing was dialed" },
  adopted: { label: "Call found at provider and adopted", tone: "blue" },
  gave_up: { label: "Gave up on unreachable provider", tone: "red" },
  lost: { label: "Provider had no record of the call", tone: "amber" },
  reconciled: { label: "Call state reconciled", tone: "blue" },
  transfer_adopted: { label: "Transfer confirmed by lookup", tone: "green" },
  transfer_resent: { label: "Transfer resent with same token", tone: "blue" },
  transfer_released: { label: "Transfer rejected, agent freed", tone: "amber" },
  agent_freed: { label: "Stuck agent freed", tone: "teal" },
  worker_dead: { label: "Worker marked dead", tone: "red" },
};
export const recoveryAction = (a: string | null | undefined) => lookup(RECOVERY_ACTIONS, a, "blue");

export const EVENT_STATUS: Record<string, Label> = {
  processed: { label: "Processed", tone: "green" },
  confirmation: { label: "Already applied", tone: "slate", hint: "Repeated a state the call was already in" },
  ignored_stale: { label: "Ignored (out of order)", tone: "amber" },
  ignored_late: { label: "Ignored (after call ended)", tone: "amber" },
  rejected_invalid: { label: "Rejected (invalid)", tone: "red" },
  orphan: { label: "No matching call", tone: "red" },
  pending: { label: "Pending", tone: "amber" },
};
export const eventStatus = (s: string | null | undefined) => lookup(EVENT_STATUS, s);

export const EVENT_TYPES: Record<string, string> = {
  INITIATED: "Call initiated",
  RINGING: "Ringing",
  ANSWERED: "Answered",
  COMPLETED: "Completed",
  NO_ANSWER: "No answer",
  BUSY: "Busy",
  FAILED: "Failed",
  TIMED_OUT: "Timed out",
  CANCELLED: "Cancelled",
  SCREEN_RESULT: "Screening result",
  TRANSFERRED: "Transferred to agent",
};
export const eventType = (t: string | null | undefined) => (t ? EVENT_TYPES[t] ?? humanize(t) : "—");

export const OPERATOR_ACTIONS: Record<string, string> = {
  console_started: "Console started",
  agent_added: "Agent added",
  agent_available: "Agent set available",
  agent_paused: "Agent paused",
  agent_offline: "Agent logged off",
  agent_pause_requested: "Pause requested after call",
  agent_pause_cancelled: "Pause request cancelled",
  campaign_created: "Campaign created",
  campaign_updated: "Campaign configuration changed",
  campaign_running: "Campaign resumed",
  campaign_paused: "Campaign paused",
  campaign_stopped: "Campaign stopped",
  fault_started: "Fault injected",
  fault_cleared: "Provider back to normal",
  settings_changed: "Settings changed",
  settings_reset: "Settings reset to defaults",
};
export const operatorAction = (a: string | null | undefined) => (a ? OPERATOR_ACTIONS[a] ?? humanize(a) : "—");

export const FEED_KINDS: Record<string, Label> = {
  screening_outcome: { label: "Screening outcome recorded", tone: "indigo" },
  transfer_confirmed: { label: "Transfer confirmed", tone: "green" },
  agent_connected: { label: "Agent connected", tone: "green" },
  call_abandoned: { label: "Call abandoned", tone: "red" },
  call_ended: { label: "Call ended", tone: "slate" },
  recovery: { label: "Recovery action", tone: "blue" },
  safety_decision: { label: "Safety decision", tone: "violet" },
  operator: { label: "Operator action", tone: "slate" },
};
export const feedKind = (k: string | null | undefined) => lookup(FEED_KINDS, k);

/** One-line result text for an activity feed item. */
export function feedResult(item: { kind: string; result?: string | null }): Label {
  switch (item.kind) {
    case "screening_outcome":
      return outcome(item.result === "unavailable" ? "callback_later" : item.result === "failed" ? "screening_failed" : item.result);
    case "transfer_confirmed":
    case "agent_connected":
      return { label: "Agent connected", tone: "green" };
    case "call_abandoned":
      return { label: "Abandoned", tone: "red" };
    case "call_ended":
      return { label: endReason(item.result), tone: "slate" };
    case "recovery":
      return recoveryAction(item.result);
    case "safety_decision":
      return decision(item.result);
    case "operator":
      return { label: operatorAction(item.result), tone: "slate" };
    default:
      return { label: item.result ? humanize(item.result) : "—", tone: "slate" };
  }
}

export const AUDIENCE_HINT =
  "Mock audience: how likely the simulated borrowers are to answer and agree to talk. Outcomes are random draws, not real conversations.";

export const PROVIDER_NAMES: Record<string, string> = { A: "Mock provider A", B: "Mock provider B" };
export const providerName = (p: string | null | undefined) => (p ? PROVIDER_NAMES[p] ?? `Provider ${p}` : "—");
