// Formatting helpers. Times from the backend are epoch seconds on the console's
// clock; compare them with the `now` the same response carries, not Date.now(),
// so "3m ago" stays right while the console is still replaying its history.

const DASH = "—";

export function num(n: number | null | undefined): string {
  return n === null || n === undefined ? DASH : n.toLocaleString("en-US");
}

export function pct(x: number | null | undefined, digits = 1): string {
  return x === null || x === undefined || !Number.isFinite(x) ? DASH : `${(x * 100).toFixed(digits)}%`;
}

/** a / b, or null when b is 0 or missing. */
export function rate(a: number | null | undefined, b: number | null | undefined): number | null {
  return a === null || a === undefined || !b ? null : a / b;
}

export function duration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return DASH;
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, "0")}m`;
}

export function ago(at: number | null | undefined, now: number | null | undefined): string {
  if (!at || !now) return DASH;
  const s = Math.max(0, now - at);
  if (s < 5) return "just now";
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function clock(at: number | null | undefined, withSeconds = true): string {
  if (!at) return DASH;
  return new Date(at * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  });
}

export function dateTime(at: number | null | undefined): string {
  if (!at) return DASH;
  return new Date(at * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function seconds(s: number | null | undefined, digits = 1): string {
  return s === null || s === undefined ? DASH : `${s.toFixed(digits)}s`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function plural(n: number, word: string, many = `${word}s`): string {
  return `${num(n)} ${n === 1 ? word : many}`;
}

export const RANGES = [
  { value: 900, label: "Last 15 minutes" },
  { value: 3600, label: "Last hour" },
  { value: 21600, label: "Last 6 hours" },
  { value: 86400, label: "Last 24 hours" },
];

export function rangeLabel(since: number): string {
  return RANGES.find((r) => r.value === since)?.label ?? `Last ${duration(since)}`;
}
