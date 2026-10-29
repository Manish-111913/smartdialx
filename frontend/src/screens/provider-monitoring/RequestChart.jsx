"use client";

import { useState } from "react";
import { clock, duration, num } from "@/lib/format";
import { EmptyState } from "@/components/ui";

export const SERIES = [
  { key: "accepted", label: "Accepted", color: "#28a094", swatch: "bg-po-on-tertiary-container" },
  { key: "timeout", label: "Timed out", color: "#4e45d5", swatch: "bg-po-secondary" },
  { key: "rejected", label: "Rejected", color: "#ba1a1a", swatch: "bg-po-error" },
];

const W = 600;
const H = 170;
const PAD = { top: 10, right: 8, bottom: 22, left: 30 };

// Stacked bars of provider requests per time bucket. `provider` picks the per-provider
// keys the backend adds (A_accepted, B_timeout, ...); null means both providers.
export default function RequestChart({ series, provider }) {
  const [hover, setHover] = useState(null);
  const points = series?.points ?? [];
  const field = (p, key) => (provider ? p[`${provider}_${key}`] ?? 0 : p[key] ?? 0);
  const totals = points.map((p) => SERIES.reduce((sum, s) => sum + field(p, s.key), 0));
  if (!points.length || totals.every((t) => t === 0)) {
    return <EmptyState icon="bar_chart" title="No requests in this range" detail="Requests appear here as campaigns place calls." />;
  }

  const max = Math.max(1, ...totals);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const bar = Math.max(2, Math.min(28, slot * 0.6));
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const labelEvery = Math.ceil(points.length / 6);
  const size = series.bucket_s;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48 overflow-visible" onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(max * f)} y2={y(max * f)} stroke={f ? "#eaedff" : "#dae2fd"} strokeDasharray={f ? "2,2" : undefined} />
            <text x={PAD.left - 6} y={y(max * f) + 3} textAnchor="end" fontSize="9" fill="#76777d">
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        {points.map((p, i) => {
          const x = PAD.left + slot * i + (slot - bar) / 2;
          let base = 0;
          return (
            <g key={p.t} onMouseEnter={() => setHover(i)} className="cursor-default">
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill={hover === i ? "#f2f3ff" : "transparent"} />
              {SERIES.map((s) => {
                const v = field(p, s.key);
                if (!v) return null;
                const top = y(base + v);
                const height = y(base) - top;
                base += v;
                return <rect key={s.key} x={x} y={top} width={bar} height={Math.max(1, height)} rx="1.5" fill={s.color} />;
              })}
              {i % labelEvery === 0 && (
                <text x={x + bar / 2} y={H - 6} textAnchor="middle" fontSize="9" fill="#45464d">
                  {clock(p.t, false)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="absolute top-0 -translate-x-1/2 w-44 p-2 rounded-lg bg-po-primary text-po-on-primary text-[11px] shadow-lg pointer-events-none"
          style={{ left: `${((PAD.left + slot * (hover + 0.5)) / W) * 100}%` }}
        >
          <div className="font-semibold mb-1">
            {clock(points[hover].t, false)} – {clock(points[hover].t + size, false)}
          </div>
          {SERIES.map((s) => (
            <div key={s.key} className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                {s.label}
              </span>
              <span>{num(field(points[hover], s.key))}</span>
            </div>
          ))}
          <div className="mt-1 pt-1 border-t border-white/20 text-white/70">{duration(size)} bucket</div>
        </div>
      )}
    </div>
  );
}
