"use client";

import { useState } from "react";
import { num } from "@/lib/format";
import { decision } from "@/lib/labels";

const W = 600;
const H = 180;
const TOP = 10;
const BOTTOM = 170;

const SERIES = [
  { key: "talking", label: "Talking", color: "#4e45d5" },
  { key: "available", label: "Free", color: "#28a094" },
  { key: "wrap_up", label: "Wrap-up", color: "#75777d" },
  { key: "on_hold", label: "Willing, on hold", color: "#d97706", screeningOnly: true },
];

const minutes = (t) => `${Math.round(t / 60)}m`;

/** Agents talking / free / in wrap-up per sample, against the staffed ceiling. */
export default function TimelineChart({ timeline, screening }) {
  const [hover, setHover] = useState(null);
  const series = SERIES.filter((s) => !s.screeningOnly || screening);
  const n = timeline.length;
  if (n === 0) return null;

  const max = Math.max(1, ...timeline.flatMap((p) => [p.staffed, ...series.map((s) => p[s.key] ?? 0)]));
  const x = (i) => (n > 1 ? (i / (n - 1)) * W : W / 2);
  const y = (v) => BOTTOM - ((v ?? 0) / max) * (BOTTOM - TOP);
  const path = (key) => timeline.map((p, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
  const staffed = timeline.map((p, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(p.staffed).toFixed(1)}`).join(" ");
  const ticks = n > 1 ? [0, 0.25, 0.5, 0.75, 1].map((f) => timeline[Math.round(f * (n - 1))]) : timeline;
  const point = hover === null ? null : timeline[hover];

  function onMove(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setHover(Math.round(frac * (n - 1)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 font-label-mono-xs text-[10.5px] text-po-on-surface-variant">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="w-3 h-[3px] rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 border-t-2 border-dashed border-po-error" />
          Staffed agents
        </span>
        {timeline.some((p) => p.outage) && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-2.5 rounded-sm bg-po-error-container" />
            Provider fault active
          </span>
        )}
      </div>
      <div className="relative w-full h-44 cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} stroke="#dae2fd" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" x1="0" x2={W} y1={y(max * f)} y2={y(max * f)} />
          ))}
          <line stroke="#dae2fd" vectorEffect="non-scaling-stroke" x1="0" x2={W} y1={BOTTOM} y2={BOTTOM} />
          {timeline.map((p, i) =>
            p.outage && i < n - 1 ? (
              <rect key={`o${i}`} x={x(i)} y={TOP} width={x(i + 1) - x(i)} height={BOTTOM - TOP} fill="#ffdad6" opacity="0.7" />
            ) : null,
          )}
          <path d={`${path("talking")} L ${x(n - 1)} ${BOTTOM} L 0 ${BOTTOM} Z`} fill="#4e45d5" opacity="0.12" />
          {series.map((s) => (
            <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={staffed} fill="none" stroke="#ba1a1a" strokeDasharray="6 4" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          {point && <line x1={x(hover)} x2={x(hover)} y1={TOP} y2={BOTTOM} stroke="#091426" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" />}
        </svg>
        {point && (
          <div
            className="absolute top-0 z-10 pointer-events-none min-w-[170px] p-2 rounded-po-lg bg-po-primary text-white font-label-mono-xs text-[10.5px] shadow-lg"
            style={{ left: `${(hover / Math.max(1, n - 1)) * 100}%`, transform: hover > n / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}
          >
            <p className="font-semibold mb-1">Minute {Math.round(point.t / 60)}</p>
            <p>Staffed {num(point.staffed)} · talking {num(point.talking)}</p>
            <p>Free {num(point.available)} · wrap-up {num(point.wrap_up)}</p>
            {screening && <p>On hold {num(point.on_hold ?? 0)}</p>}
            <p className="mt-1 text-white/70">
              Pacer asked {num(point.requested)}, safety allowed {num(point.approved)}
            </p>
            <p className="text-white/70">{decision(point.action).label}</p>
            {point.outage && <p className="text-rose-200">Provider fault: {point.outage}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between font-label-mono-xs text-[10px] text-po-on-surface-variant px-1 mt-1">
        {ticks.map((p, i) => (
          <span key={i}>{minutes(p.t)}</span>
        ))}
      </div>
    </div>
  );
}
