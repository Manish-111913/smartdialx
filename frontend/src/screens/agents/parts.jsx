"use client";

import { initials } from "@/lib/format";
import { agentState, TONE } from "@/lib/labels";

export const BUSY = ["RESERVED", "DIALING", "CONNECTED"];

export const AVAILABILITY = {
  available: ["AVAILABLE"],
  busy: ["RESERVED", "DIALING", "CONNECTED", "WRAP_UP"],
  inactive: ["PAUSED", "OFFLINE"],
};

const AVATAR = {
  teal: "from-teal-600 to-cyan-500 ring-teal-100",
  green: "from-emerald-600 to-teal-500 ring-emerald-100",
  amber: "from-amber-500 to-orange-400 ring-amber-100",
  blue: "from-blue-600 to-indigo-500 ring-blue-100",
  violet: "from-violet-600 to-indigo-500 ring-violet-100",
  slate: "from-slate-500 to-slate-400 ring-slate-100",
  gray: "from-slate-400 to-slate-300 ring-slate-100",
};

export const LEGEND = {
  teal: "bg-teal-50/60 border-teal-100/80 hover:bg-teal-100/60 text-teal-800",
  amber: "bg-amber-50/60 border-amber-100/80 hover:bg-amber-100/60 text-amber-800",
  blue: "bg-blue-50/60 border-blue-100/80 hover:bg-blue-100/60 text-blue-800",
  green: "bg-emerald-50/60 border-emerald-100/80 hover:bg-emerald-100/60 text-emerald-800",
  violet: "bg-violet-50/60 border-violet-100/80 hover:bg-violet-100/60 text-violet-800",
  slate: "bg-slate-100/70 border-slate-200/70 hover:bg-slate-200/60 text-slate-800",
  gray: "bg-slate-50 border-slate-200/70 hover:bg-slate-100 text-slate-700",
};

export function Avatar({ name, state, size = "w-8 h-8 text-[11px]" }) {
  const tone = agentState(state).tone;
  return (
    <div
      className={`${size} rounded-full bg-gradient-to-tr ${AVATAR[tone] ?? AVATAR.slate} text-white flex items-center justify-center font-label-mono-xs font-bold shrink-0 shadow-xs ring-2`}
    >
      {initials(name)}
    </div>
  );
}

export function StateBadge({ state, pauseRequested = false }) {
  const s = agentState(state);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        title={s.hint}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-label-mono-xs text-[11px] font-semibold ${TONE[s.tone].badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${TONE[s.tone].dot} ${state === "CONNECTED" ? "animate-pulse" : ""}`} />
        {s.label}
      </span>
      {pauseRequested && (
        <span
          title="Will be paused as soon as the current call ends"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold"
        >
          <span className="material-symbols-outlined text-[12px]">pause</span>
          after call
        </span>
      )}
    </span>
  );
}

/**
 * What an operator may do with an agent right now. Busy agents can't be switched
 * straight to available or paused; the backend refuses that too.
 */
export function agentActions(agent, act) {
  const { state } = agent;
  if (BUSY.includes(state)) {
    return [
      agent.pause_requested
        ? { label: "Cancel pause after call", icon: "play_circle", onClick: () => act.requestPause(agent, false) }
        : { label: "Pause after call", icon: "pause", onClick: () => act.requestPause(agent, true) },
      { label: "Log off now", icon: "logout", danger: true, onClick: () => act.confirmLogoff(agent) },
    ];
  }
  if (state === "OFFLINE") {
    return [{ label: "Log in", icon: "login", primary: true, onClick: () => act.setState(agent, "AVAILABLE") }];
  }
  const items = [];
  if (state === "WRAP_UP" || state === "PAUSED") {
    items.push({ label: "Mark available", icon: "how_to_reg", primary: true, onClick: () => act.setState(agent, "AVAILABLE") });
  }
  if (state === "AVAILABLE" || state === "WRAP_UP") {
    items.push({ label: "Pause", icon: "pause_circle", onClick: () => act.setState(agent, "PAUSED") });
  }
  if (state !== "WRAP_UP") {
    items.push({ label: "Log off", icon: "logout", onClick: () => act.setState(agent, "OFFLINE") });
  }
  return items;
}
