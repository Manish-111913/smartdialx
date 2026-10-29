import { num, pct } from "@/lib/format";

// Settings this screen can edit. Percentages are stored as fractions (0.03) by the
// backend but typed as percentages (3) here. Everything is saved in one PUT.
export const FIELDS = {
  "pacing.prior_answer_rate": { kind: "percent", label: "Expected answer rate" },
  "pacing.max_abandon_risk": { kind: "fraction", label: "Safety margin" },
  "safety.max_active_calls": { kind: "count", label: "Max concurrent calls" },
  "safety.max_overdial_ratio": { kind: "multiple", label: "Max outstanding calls per agent" },
  "safety.max_screening_ratio": { kind: "multiple", label: "Max bot calls per free agent" },
  "safety.max_abandon_rate": { kind: "percent", label: "Max abandon rate" },
  "safety.max_calls_per_campaign": { kind: "count", label: "Max calls per campaign", nullable: true },
  "safety.provider_max_error_rate": { kind: "percent", label: "Provider error-rate limit" },
  "safety.max_transfer_fail_rate": { kind: "percent", label: "Max missed willing borrowers" },
  "safety.max_bot_calls": { kind: "count", label: "Max bot conversations" },
};

export const MARGINS = [
  { value: 0.01, label: "1% · Strict" },
  { value: 0.02, label: "2% · Balanced" },
  { value: 0.05, label: "5% · Relaxed" },
];

export function settingValue(settings, key) {
  const [section, name] = key.split(".");
  return settings?.[section]?.[name];
}

export function toInput(key, value) {
  if (value === null || value === undefined) return "";
  return FIELDS[key].kind === "percent" ? String(Number((value * 100).toFixed(2))) : String(value);
}

function fromInput(key, text) {
  const field = FIELDS[key];
  const raw = String(text).trim();
  if (raw === "") {
    if (field.nullable) return null;
    throw new Error(`${field.label} can't be empty`);
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${field.label} must be a positive number`);
  if (field.kind === "count" && !Number.isInteger(n)) throw new Error(`${field.label} must be a whole number`);
  if (field.kind === "percent" && n > 100) throw new Error(`${field.label} can't be over 100%`);
  return field.kind === "percent" ? n / 100 : n;
}

/** Turn the edited inputs into {pacing: {...}, safety: {...}} for PUT /api/settings. */
export function buildPatch(edits) {
  const body = {};
  for (const [key, text] of Object.entries(edits)) {
    const [section, name] = key.split(".");
    body[section] = { ...body[section], [name]: fromInput(key, text) };
  }
  return body;
}

/** How a threshold's current value or limit reads, by setting kind. */
export function formatLimit(key, value) {
  if (value === null || value === undefined) return "—";
  const kind = FIELDS[`safety.${key}`]?.kind ?? "count";
  if (kind === "percent") return pct(value, 1);
  if (kind === "multiple") return `${Number(value).toFixed(2)}×`;
  return num(value);
}

export const LIMIT_UNIT = { percent: "%", multiple: "×", count: "" };
