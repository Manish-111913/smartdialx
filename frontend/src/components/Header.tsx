"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApi } from "@/lib/api";
import { ago, RANGES, rangeLabel } from "@/lib/format";
import { campaignStatus } from "@/lib/labels";
import type { CampaignList, LiveSummary } from "@/lib/types";
import { useFilters } from "./Filters";
import { currentPage } from "./nav";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

const ALERT_ICON: Record<string, string> = { error: "error", warning: "warning", info: "info" };
const ALERT_COLOR: Record<string, string> = { error: "text-rose-600", warning: "text-amber-600", info: "text-indigo-500" };

export default function Header({ collapsed, onToggle }: Props) {
  const { group, item } = currentPage(usePathname());
  const { campaignId, setCampaignId, since, setSince } = useFilters();
  const { data: campaigns } = useApi<CampaignList>("/campaigns", { interval: 15000 });
  const { data: live } = useApi<LiveSummary>("/live?since=3600", { interval: 8000 });

  const list = campaigns?.campaigns ?? [];
  const selected = list.find((c) => c.id === campaignId);

  // a remembered campaign can disappear after a console reset
  useEffect(() => {
    if (campaigns && campaignId !== null && !selected) setCampaignId(null);
  }, [campaigns, campaignId, selected, setCampaignId]);

  const alerts = live?.alerts ?? [];
  const urgent = alerts.filter((a) => a.level !== "info").length;

  return (
    <header
      className={`main-transition fixed top-0 ${collapsed ? "left-[72px]" : "left-64"} right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 flex items-center justify-between px-space-lg select-none shadow-xs`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          title="Toggle navigation"
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
          <Dropdown icon="tune" label={selected ? selected.name : "All Campaigns"} width="w-72">
            {(close) => (
              <>
                <MenuItem
                  active={campaignId === null}
                  onClick={() => {
                    setCampaignId(null);
                    close();
                  }}
                >
                  All Campaigns
                </MenuItem>
                {list.map((c) => (
                  <MenuItem
                    key={c.id}
                    active={c.id === campaignId}
                    onClick={() => {
                      setCampaignId(c.id);
                      close();
                    }}
                    aside={campaignStatus(c.display_status).label}
                  >
                    {c.name}
                  </MenuItem>
                ))}
              </>
            )}
          </Dropdown>
          <Dropdown icon="calendar_today" label={rangeLabel(since)} width="w-48">
            {(close) =>
              RANGES.map((r) => (
                <MenuItem
                  key={r.value}
                  active={r.value === since}
                  onClick={() => {
                    setSince(r.value);
                    close();
                  }}
                >
                  {r.label}
                </MenuItem>
              ))
            }
          </Dropdown>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-space-sm">
          <Dropdown
            width="w-96"
            align="right"
            trigger={
              <span
                title="Operational alerts"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors relative"
              >
                <span className="material-symbols-outlined text-[19px]">notifications</span>
                {urgent > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9.5px] font-bold flex items-center justify-center ring-2 ring-white">
                    {urgent}
                  </span>
                )}
              </span>
            }
          >
            {(close) => (
              <div className="flex flex-col">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-slate-800">Operational alerts</span>
                  <Link href="/live-operations" onClick={close} className="text-[11.5px] font-semibold text-indigo-600 hover:underline">
                    Live Operations
                  </Link>
                </div>
                {alerts.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[12px] text-slate-400">Nothing needs attention right now.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {alerts.map((a, i) => (
                      <div key={i} className="px-3 py-2 flex gap-2 border-b border-slate-50 last:border-0">
                        <span className={`material-symbols-outlined text-[17px] mt-0.5 ${ALERT_COLOR[a.level]}`}>{ALERT_ICON[a.level]}</span>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-slate-800">{a.title}</p>
                          <p className="text-[11.5px] text-slate-500">{a.detail}</p>
                          <p className="text-[10.5px] text-slate-400 mt-0.5">{ago(a.at, live?.now)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Dropdown>
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-700 flex items-center justify-center text-white font-label-mono-xs text-label-mono-xs font-semibold ring-2 ring-indigo-100">
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

function Dropdown({
  icon,
  label,
  trigger,
  width,
  align = "left",
  children,
}: {
  icon?: string;
  label?: string;
  trigger?: React.ReactNode;
  width: string;
  align?: "left" | "right";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {trigger ?? (
          <span
            className={`flex items-center h-8 px-space-sm rounded-lg border font-body-sm text-body-sm gap-space-xs transition-colors max-w-[240px] ${
              open
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700"
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-slate-400">{icon}</span>
            <span className="font-medium truncate">{label}</span>
            <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
          </span>
        )}
      </button>
      {open && (
        <div
          className={`absolute top-10 ${align === "right" ? "right-0" : "left-0"} ${width} z-50 py-1 bg-white rounded-lg border border-slate-200 shadow-xl`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  active,
  onClick,
  aside,
  children,
}: {
  active: boolean;
  onClick: () => void;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left text-[12.5px] ${
        active ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className="truncate">{children}</span>
      {aside && <span className="text-[10.5px] text-slate-400 shrink-0">{aside}</span>}
    </button>
  );
}
