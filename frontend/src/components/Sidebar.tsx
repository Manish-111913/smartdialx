"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApi } from "@/lib/api";
import { providerStatus, TONE } from "@/lib/labels";
import type { Health } from "@/lib/types";
import { isActive, navGroups, type NavItem } from "./nav";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname();
  const { data: health, error } = useApi<Health>("/health", { interval: 5000 });
  const backend = error ? "unreachable" : !health ? "connecting" : health.warming_up ? "warming" : "connected";
  const dot = { connected: "bg-emerald-500", warming: "bg-amber-400", connecting: "bg-slate-300", unreachable: "bg-rose-500" }[backend];
  const label = { connected: "Connected", warming: "Replaying history", connecting: "Connecting…", unreachable: "Unreachable" }[backend];

  return (
    <aside
      className={`sidebar-transition fixed left-0 top-0 h-screen ${collapsed ? "w-[72px]" : "w-64"} bg-surface-container-lowest border-r border-slate-200/80 z-50 flex flex-col justify-between select-none shadow-[2px_0_12px_rgba(15,23,42,0.03)]`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <div
          className={`h-14 border-b border-slate-100 flex items-center gap-space-sm bg-gradient-to-r from-slate-50/70 to-white ${collapsed ? "justify-center px-0" : "justify-between px-space-md"}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/20">
              <span className="material-symbols-outlined text-[19px]">hub</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-headline-sm text-body-sm font-bold tracking-tight text-slate-900 truncate">SmartDialX</span>
                <span className="font-label-mono-xs text-[9.5px] font-semibold text-indigo-600 uppercase tracking-wider">AI Orchestrator</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={onToggle}
              title="Collapse sidebar"
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
            </button>
          )}
        </div>

        <div className="px-space-sm pt-space-md pb-space-lg flex flex-col gap-space-md">
          {navGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              {!collapsed && (
                <span className="px-space-xs font-label-ui text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                  {group.title}
                </span>
              )}
              <nav className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(item, pathname)} collapsed={collapsed} />
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="p-space-sm border-t border-slate-100 bg-slate-50/70">
        {collapsed ? (
          <div className="flex flex-col items-center justify-center py-2" title={`Backend: ${label}`}>
            <span className={`w-3 h-3 rounded-full ring-2 ring-white ${dot}`} />
          </div>
        ) : (
          <div className="p-2 rounded-lg bg-white border border-slate-200/70 shadow-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-label-mono-xs text-label-mono-xs">
              <span className="text-slate-400 uppercase font-semibold">Backend</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <span className={`w-2 h-2 rounded-full ${dot} ${backend === "connected" ? "animate-pulse" : ""}`} />
                {label}
              </span>
            </div>
            <div className="flex items-center justify-between font-label-mono-xs text-label-mono-xs">
              <span className="text-slate-400 uppercase font-semibold">Env</span>
              <span className="font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Simulation</span>
            </div>
            {health && (
              <div className="flex items-center justify-between font-label-mono-xs text-label-mono-xs">
                <span className="text-slate-400 uppercase font-semibold">Providers</span>
                <span className="flex items-center gap-2">
                  {Object.entries(health.providers).map(([name, status]) => (
                    <span key={name} title={`Mock provider ${name}: ${providerStatus(status).label}`} className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                      <span className={`w-1.5 h-1.5 rounded-full ${TONE[providerStatus(status).tone].dot}`} />
                      {name}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const layout = collapsed ? "justify-center px-0" : "px-space-sm";
  const look = active
    ? "transition-all bg-gradient-to-r from-indigo-50 to-indigo-50/40 text-indigo-700 font-semibold border border-indigo-100/80 shadow-xs"
    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-colors";

  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-space-sm py-2 rounded-lg text-[13px] ${layout} ${look}`}
    >
      <span
        className={`material-symbols-outlined text-[18px] shrink-0 ${active ? "text-indigo-600" : `text-slate-400 transition-colors ${item.hover}`}`}
      >
        {item.icon}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
