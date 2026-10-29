"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Every request goes to /api on the same origin; next.config.ts proxies it to the
// Python backend (python -m smartdialx.main serve).

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const OFFLINE =
  "Can't reach the SmartDialX backend. Start it from backend/ with: python -m smartdialx.main serve";

export async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(OFFLINE, 0);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // the proxy answers with an HTML error page when the backend is down
    throw new ApiError(res.status >= 500 ? OFFLINE : `Unexpected response (${res.status})`, res.status);
  }
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error;
    throw new ApiError(message || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const post = <T = unknown>(path: string, body: unknown = {}) => api<T>(path, "POST", body);
export const put = <T = unknown>(path: string, body: unknown) => api<T>(path, "PUT", body);
export const patch = <T = unknown>(path: string, body: unknown) => api<T>(path, "PATCH", body);

/** Build a query string, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

type Result<T> = { path: string; data: T | null; error: string | null };

/**
 * Fetch `path` and keep polling it. Old data stays on screen while a new path loads,
 * so changing a filter doesn't blank the page; `loading` is true until the first
 * answer for the current path. Polling pauses while the tab is hidden. Pass null to
 * skip fetching (e.g. a drawer with nothing selected).
 */
export function useApi<T = unknown>(path: string | null, { interval = 4000 }: { interval?: number } = {}) {
  const [result, setResult] = useState<Result<T> | null>(null);
  const current = useRef<string | null>(null);

  const load = useCallback(async () => {
    const requested = current.current;
    if (requested === null) return;
    try {
      const data = await api<T>(requested);
      if (current.current === requested) setResult({ path: requested, data, error: null });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      if (current.current === requested) setResult((prev) => ({ path: requested, data: prev?.data ?? null, error }));
    }
  }, []);

  useEffect(() => {
    current.current = path;
    if (path === null) return;
    load();
    if (!interval) return;
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, interval);
    return () => clearInterval(timer);
  }, [path, interval, load]);

  return {
    data: path === null ? null : (result?.data ?? null),
    error: path === null ? null : (result?.error ?? null),
    loading: path !== null && result?.path !== path,
    refresh: load,
  };
}
