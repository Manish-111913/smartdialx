"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

// The campaign and time range picked in the header. Screens that can be filtered
// read them from here. The choice lives in localStorage so it survives a reload;
// useSyncExternalStore renders the defaults on the server and swaps in the saved
// value after hydration without a mismatch.

type Saved = { campaignId: number | null; since: number };
type Filters = Saved & {
  setCampaignId: (id: number | null) => void;
  setSince: (seconds: number) => void;
};

const KEY = "smartdialx.filters";
const DEFAULTS: Saved = { campaignId: null, since: 86400 };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const read = () => localStorage.getItem(KEY) ?? "";

function parse(raw: string): Saved {
  try {
    const saved = JSON.parse(raw || "{}");
    return {
      campaignId: typeof saved.campaignId === "number" ? saved.campaignId : null,
      since: typeof saved.since === "number" ? saved.since : DEFAULTS.since,
    };
  } catch {
    return DEFAULTS;
  }
}

const FiltersContext = createContext<Filters>({ ...DEFAULTS, setCampaignId: () => {}, setSince: () => {} });

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const saved = useMemo(() => parse(raw), [raw]);

  const save = useCallback((next: Partial<Saved>) => {
    localStorage.setItem(KEY, JSON.stringify({ ...parse(read()), ...next }));
    listeners.forEach((l) => l());
  }, []);

  const value = useMemo<Filters>(
    () => ({
      ...saved,
      setCampaignId: (campaignId) => save({ campaignId }),
      setSince: (since) => save({ since }),
    }),
    [saved, save],
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): Filters {
  return useContext(FiltersContext);
}
