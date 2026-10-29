// Every setting the console exposes, grouped the way the screen shows them.
// `path` is "<section>.<key>" in the backend's Settings (config.py). Percent fields
// are stored as fractions and shown as percentages.

export const GROUPS = [
  {
    id: "pacing",
    title: "Pacing",
    icon: "speed",
    intro:
      "How the predictive pacer estimates the answer rate and sizes each batch. Progressive pacing doesn't use these; it dials one call per free agent.",
    fields: [
      {
        path: "pacing.prior_answer_rate",
        label: "Starting answer-rate estimate",
        help: "Used before a campaign has enough ring outcomes, then blended with what's observed.",
        kind: "percent",
        min: 1,
        max: 100,
      },
      {
        path: "pacing.prior_weight",
        label: "Weight of the starting estimate",
        help: "How many imaginary calls the starting estimate counts as. Higher means slower to react.",
        kind: "number",
        unit: "calls",
        min: 0,
        max: 1000,
      },
      {
        path: "pacing.answer_window",
        label: "Answer-rate window",
        help: "Most recent ring outcomes used to estimate the answer rate.",
        kind: "int",
        unit: "calls",
        min: 10,
        max: 5000,
      },
      {
        path: "pacing.confidence_z",
        label: "Confidence margin (z)",
        help: "The pacer plans with an upper bound on the answer rate; larger z is more cautious.",
        kind: "number",
        min: 0,
        max: 4,
        step: 0.1,
      },
      {
        path: "pacing.max_abandon_risk",
        label: "Acceptable over-dial risk per decision",
        help: "Largest chance, per pacing decision, that answers outnumber free agents.",
        kind: "percent",
        min: 0.1,
        max: 50,
        step: 0.1,
      },
      {
        path: "pacing.max_request",
        label: "Largest batch the pacer may ask for",
        kind: "int",
        unit: "calls",
        min: 1,
        max: 1000,
      },
      {
        path: "pacing.count_wrap_up_ending_soon",
        label: "Count agents finishing wrap-up as capacity",
        help: "Agents whose wrap-up ends before a new call would likely be answered.",
        kind: "bool",
      },
    ],
  },
  {
    id: "safety",
    title: "Safety limits",
    icon: "shield",
    intro:
      "The safety controller recomputes these from the database on every decision and can reduce, block or force progressive mode no matter what the pacer asks for.",
    fields: [
      { path: "safety.max_active_calls", label: "Live calls per campaign", kind: "int", unit: "calls", min: 1, max: 10000 },
      {
        path: "safety.max_overdial_ratio",
        label: "Predictive calls in flight per free agent",
        help: "Backstop on over-dialing. Must be at least 1.",
        kind: "number",
        unit: "x",
        min: 1,
        max: 20,
        step: 0.1,
      },
      {
        path: "safety.max_abandon_rate",
        label: "Abandon-rate limit",
        help: "Abandoned / answered. Above it, predictive is forced back to progressive.",
        kind: "percent",
        min: 0,
        max: 100,
        step: 0.1,
      },
      { path: "safety.abandon_window", label: "Abandon-rate window", kind: "int", unit: "answered calls", min: 10, max: 5000 },
      {
        path: "safety.abandon_min_samples",
        label: "Answered calls before the abandon rate counts",
        kind: "int",
        unit: "calls",
        min: 1,
        max: 1000,
      },
      { path: "safety.max_calls_per_tick", label: "Calls started per pacing round", kind: "int", unit: "calls", min: 1, max: 1000 },
      {
        path: "safety.max_calls_per_campaign",
        label: "Calls per campaign",
        help: "Optional cap on calls one campaign may start. Leave empty for no limit.",
        kind: "int",
        unit: "calls",
        min: 1,
        max: 1000000,
        nullable: true,
      },
    ],
  },
  {
    id: "predictive",
    title: "Predictive guards",
    icon: "query_stats",
    intro: "When predictive dialing isn't trusted yet, or the answer rate moves too fast to trust, safety forces progressive.",
    fields: [
      {
        path: "safety.min_samples_for_predictive",
        label: "Ring outcomes before predictive is allowed",
        kind: "int",
        unit: "calls",
        min: 0,
        max: 5000,
      },
      { path: "safety.answer_rate_short_window", label: "Short window for jump detection", kind: "int", unit: "calls", min: 5, max: 1000 },
      {
        path: "safety.answer_rate_jump_ratio",
        label: "Jump ratio",
        help: "Short-window rate above long-window rate by this factor...",
        kind: "number",
        unit: "x",
        min: 1,
        max: 10,
        step: 0.1,
      },
      {
        path: "safety.answer_rate_jump_min",
        label: "Jump size",
        help: "...and by at least this many points.",
        kind: "percent",
        min: 0,
        max: 100,
      },
    ],
  },
  {
    id: "providers",
    title: "Provider health",
    icon: "cloud_sync",
    intro:
      "A circuit breaker per provider. Above the error rate no new calls start on that provider; calls already live carry on.",
    fields: [
      { path: "safety.provider_window_s", label: "Error-rate window", kind: "number", unit: "s", min: 5, max: 3600 },
      { path: "safety.provider_min_requests", label: "Requests before the breaker can trip", kind: "int", unit: "requests", min: 1, max: 1000 },
      { path: "safety.provider_max_error_rate", label: "Error-rate limit", kind: "percent", min: 1, max: 100 },
      {
        path: "safety.provider_probe_calls",
        label: "Probe calls while it looks bad",
        help: "Calls still allowed to test a provider that is failing on low volume.",
        kind: "int",
        unit: "calls",
        min: 0,
        max: 100,
      },
    ],
  },
  {
    id: "recovery",
    title: "Timeouts & recovery",
    icon: "healing",
    intro:
      "Leases and timeouts recovery works from. A provider request must time out before the lease expires, otherwise recovery could act on a call the worker is still placing.",
    fields: [
      { path: "timeouts.lease_s", label: "Reservation lease", kind: "number", unit: "s", min: 1, max: 600 },
      {
        path: "timeouts.provider_request_s",
        label: "Provider request timeout",
        help: "Must be shorter than the lease.",
        kind: "number",
        unit: "s",
        min: 0.5,
        max: 300,
        step: 0.5,
      },
      { path: "timeouts.stuck_call_s", label: "Quiet call before reconciling", kind: "number", unit: "s", min: 10, max: 3600 },
      {
        path: "timeouts.ambiguous_give_up_s",
        label: "Give up on an unreachable provider after",
        kind: "number",
        unit: "s",
        min: 10,
        max: 86400,
      },
      { path: "timeouts.wrap_up_s", label: "Agent wrap-up time", kind: "number", unit: "s", min: 0, max: 600 },
      {
        path: "timeouts.wrap_up_preempt_s",
        label: "Pull an agent out of wrap-up up to",
        kind: "number",
        unit: "s early",
        min: 0,
        max: 600,
      },
      { path: "timeouts.retry_delay_s", label: "Retry delay after no answer / busy", kind: "number", unit: "s", min: 0, max: 86400 },
      {
        path: "timeouts.max_attempts",
        label: "Attempts per borrower",
        help: "Applies to campaigns created after the change.",
        kind: "int",
        unit: "attempts",
        min: 1,
        max: 20,
      },
    ],
  },
  {
    id: "screening",
    title: "Screening",
    icon: "smart_toy",
    intro:
      "The mock screening bot calls first and only borrowers it records as willing are transferred. A campaign can override the wait time and no-agent policy for itself.",
    fields: [
      { path: "screening.hold_s", label: "Wait for an agent (default)", kind: "number", unit: "s", min: 1, max: 600 },
      {
        path: "screening.no_agent_policy",
        label: "If no agent frees up in time (default)",
        kind: "select",
        options: [
          { value: "callback", label: "Schedule a callback" },
          { value: "end", label: "End politely, no callback" },
        ],
      },
      { path: "screening.callback_delay_s", label: "Callback delay", kind: "number", unit: "s", min: 0, max: 86400 },
      { path: "screening.unavailable_retry_s", label: "Retry \"can't talk now\" after", kind: "number", unit: "s", min: 0, max: 86400 },
      {
        path: "screening.prior_willing_rate",
        label: "Starting willing-rate estimate",
        help: "Share of ring outcomes expected to end willing, before there's data.",
        kind: "percent",
        min: 1,
        max: 100,
      },
      {
        path: "safety.max_screening_ratio",
        label: "Bot calls in flight per free agent (predictive)",
        kind: "number",
        unit: "x",
        min: 1,
        max: 50,
        step: 0.5,
      },
      {
        path: "safety.max_transfer_fail_rate",
        label: "Missed willing borrowers limit",
        help: "Above it, predictive screening falls back to progressive.",
        kind: "percent",
        min: 0,
        max: 100,
        step: 0.5,
      },
      { path: "safety.max_bot_calls", label: "Bot conversations at once", kind: "int", unit: "calls", min: 1, max: 10000 },
    ],
  },
];

export function getValue(settings, path) {
  const [section, key] = path.split(".");
  return settings?.[section]?.[key];
}

/** Value as it appears in the input. */
export function toInput(field, value) {
  if (value === null || value === undefined) return "";
  if (field.kind === "bool" || field.kind === "select") return value;
  if (field.kind === "percent") return String(Math.round(value * 1000) / 10);
  return String(value);
}

/** Parse what was typed back into the backend's value, or return { error }. */
export function fromInput(field, raw) {
  if (field.kind === "bool" || field.kind === "select") return { value: raw };
  const text = String(raw).trim();
  if (text === "") {
    return field.nullable ? { value: null } : { error: "Required" };
  }
  const n = Number(text);
  if (!Number.isFinite(n)) return { error: "Enter a number" };
  if (field.kind === "int" && !Number.isInteger(n)) return { error: "Whole numbers only" };
  if (field.min !== undefined && n < field.min) return { error: `At least ${field.min}` };
  if (field.max !== undefined && n > field.max) return { error: `At most ${field.max}` };
  return { value: field.kind === "percent" ? Math.round(n * 10) / 1000 : n };
}

export function display(field, value) {
  if (value === null || value === undefined) return field.nullable ? "no limit" : "—";
  if (field.kind === "bool") return value ? "on" : "off";
  if (field.kind === "select") return field.options.find((o) => o.value === value)?.label ?? value;
  if (field.kind === "percent") return `${Math.round(value * 1000) / 10}%`;
  if (field.unit === "x") return `${value}x`;
  return `${value}${field.unit ? ` ${field.unit}` : ""}`;
}
