"use client";

import { usePathname } from "next/navigation";
import { currentPage } from "./nav";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Header({ collapsed, onToggle }: Props) {
  const { group, item } = currentPage(usePathname());

  return (
    <header
      className={`main-transition fixed top-0 ${collapsed ? "left-[72px]" : "left-64"} right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 flex items-center justify-between px-space-lg select-none shadow-xs`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          title="Toggle Navigation Bar"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">{collapsed ? "menu" : "menu_open"}</span>
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-slate-600">
          <span className="font-medium text-slate-400">{group}</span>
          <span className="text-slate-300 font-label-mono-xs">/</span>
          <span className="font-semibold text-slate-800">{item.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-space-md">
        <div className="flex items-center gap-space-xs">
          <FilterPill icon="tune" label="All Campaigns" />
          <FilterPill icon="calendar_today" label="Last 24 hours" />
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            title="Notifications"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative"
          >
            <span className="material-symbols-outlined text-[19px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-2 pl-1 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-700 flex items-center justify-center text-white font-label-mono-xs text-label-mono-xs font-semibold ring-2 ring-indigo-100 group-hover:ring-indigo-300 transition-all">
              <span>KM</span>
            </div>
            <div className="hidden xl:flex flex-col leading-tight">
              <span className="font-body-sm text-body-sm font-semibold text-slate-800">Manish K.</span>
              <span className="font-label-mono-xs text-[10px] text-indigo-600 font-medium uppercase">Operations Lead</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function FilterPill({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center h-8 px-space-sm rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-body-sm text-body-sm gap-space-xs cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors">
      <span className="material-symbols-outlined text-[15px] text-slate-400">{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
    </div>
  );
}
