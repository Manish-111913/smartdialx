import { duration, pct } from "@/lib/format";

export const DEFAULTS = {
  preset: "balanced",
  mode: "predictive",
  screening: true,
  audience: "standard",
  hold_s: 20,
  no_agent_policy: "callback",
  agents: 10,
  borrowers: 500,
  provider: "A",
  fault: "normal",
  seed: 7,
};

export const FAULTS = {
  normal: "Normal operation",
  latency: "Increased latency",
  timeout: "Request timeouts",
  outage: "Provider outage",
  duplicates: "Duplicate events",
  out_of_order: "Out-of-order events",
};

// the backend puts timeouts and outages between one third and half way through the run
export const FAULT_HINTS = {
  normal: "No injected faults.",
  latency: "Slower ring and answer times for the whole run.",
  timeout: "Call requests time out for part of the run; recovery has to reconcile them by token.",
  outage: "The provider refuses requests and holds its callbacks for part of the run.",
  duplicates: "Half of all provider events are delivered twice.",
  out_of_order: "Events are delivered with up to 10s of random delay, so they arrive out of order.",
};

export const isActive = (job) => !!job && (job.status === "queued" || job.status === "running");

export function presetLabel(presets, key) {
  return presets?.[key]?.label ?? key;
}

/** Short facts about a preset, straight from its backend definition. */
export function presetChips(p) {
  if (!p) return [];
  const chips = [];
  if (Array.isArray(p.schedule) && p.schedule.length) {
    chips.push([p.answer_rate, ...p.schedule.map((s) => s[1])].map((r) => pct(r, 0)).join(" → "));
  } else if (p.answer_rate !== undefined) {
    chips.push(`${pct(p.answer_rate, 0)} answer`);
  }
  if (p.talk_s) chips.push(`${p.talk_s}s talk`);
  if (p.provider) chips.push(`Provider ${p.provider}`);
  if (p.fault) chips.push(FAULTS[p.fault] ?? p.fault);
  if (p.duration_s) chips.push(`${duration(p.duration_s)} run`);
  return chips;
}

export function formFromParams(params) {
  const form = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    if (params?.[key] !== undefined && params[key] !== null) form[key] = params[key];
  }
  return form;
}

export function strategyLabel(scenario) {
  const mode = scenario.mode === "predictive" ? "Predictive" : "Progressive";
  return scenario.screening ? `${mode} + AI screening` : `${mode} only`;
}

function cell(value) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows) {
  return rows.map((row) => row.map(cell).join(",")).join("\n");
}

export function download(filename, text, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
