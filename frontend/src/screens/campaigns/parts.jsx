"use client";

import { campaignStatus, TONE } from "@/lib/labels";

export function StatusBadge({ status }) {
  const s = campaignStatus(status);
  return (
    <span
      title={s.hint}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[11px] font-semibold whitespace-nowrap ${TONE[s.tone].badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${TONE[s.tone].dot} ${status === "RUNNING" ? "animate-pulse" : ""}`} />
      {s.label}
    </span>
  );
}

export function ModeBadge({ mode }) {
  const predictive = mode === "predictive";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border font-mono text-[11px] font-medium ${
        predictive ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-teal-50 text-teal-700 border-teal-100"
      }`}
    >
      {predictive ? "Predictive" : "Progressive"}
    </span>
  );
}

export function ScreeningBadge({ screening }) {
  return screening ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[11px] font-medium border border-purple-100">
      <span className="material-symbols-outlined text-[13px]">smart_toy</span>
      AI screening
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-medium border border-slate-200">
      Direct dial
    </span>
  );
}

/**
 * Row and drawer actions. Status changes follow the backend's rules: a stopped
 * campaign is final, and a completed one has nothing left to pause or resume.
 */
export function campaignActions(c, act, { includeView = true } = {}) {
  const stopped = c.display_status === "STOPPED";
  const completed = c.display_status === "COMPLETED";
  const items = [];
  if (includeView) items.push({ label: "View details", icon: "visibility", onClick: () => act.view(c) });
  items.push({
    label: "Edit configuration",
    short: "Edit config",
    icon: "edit_note",
    disabled: stopped,
    hint: "A stopped campaign can't be changed",
    onClick: () => act.edit(c),
  });
  if (c.status === "PAUSED") {
    items.push({
      label: "Resume campaign",
      short: "Resume",
      icon: "play_arrow",
      disabled: completed,
      hint: "Every borrower already has an outcome",
      onClick: () => act.setStatus(c, "RUNNING"),
    });
  } else {
    items.push({
      label: "Pause campaign",
      short: "Pause",
      icon: "pause",
      disabled: stopped || completed,
      hint: stopped ? "A stopped campaign can't be paused" : "Every borrower already has an outcome",
      onClick: () => act.setStatus(c, "PAUSED"),
    });
  }
  items.push({ label: "Duplicate", icon: "content_copy", onClick: () => act.duplicate(c) });
  items.push({
    label: "Stop campaign",
    short: "Stop",
    icon: "stop_circle",
    danger: true,
    disabled: stopped,
    hint: "Already stopped",
    onClick: () => act.stop(c),
  });
  return items;
}
