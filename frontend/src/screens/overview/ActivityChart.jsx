"use client";

import { useState } from "react";
import { clock, duration, num } from "@/lib/format";

const W = 700;
const H = 200;
const TOP = 10;
const BOTTOM = 190;

const SERIES = [
  { key: "attempts", label: "All call attempts", stroke: "#4338ca", dot: "bg-indigo-600" },
  { key: "screening_attempts", label: "Screening attempts", stroke: "#818cf8", dot: "bg-indigo-300", dashed: true },
  { key: "connected", label: "Agent connections", stroke: "#0891b2", dot: "bg-cyan-500" },
];

// round the y-axis up to 1, 2 or 5 times a power of ten
function niceMax(value) {
  const exp = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((s) => s * exp >= value);
  return step * exp;
}

export function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-space-md text-slate-600 font-label-mono-xs text-label-mono-xs">
      {SERIES.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-md shadow-xs ${s.dot}`} />
          <span className="font-semibold text-slate-700">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ActivityChart({ points, bucket }) {
  const [hover, setHover] = useState(null);
  const n = points.length;
  const peak = Math.max(0, ...points.flatMap((p) => SERIES.map((s) => p[s.key])));
  const max = niceMax(Math.max(4, peak));
  const x = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v) => BOTTOM - (v / max) * (BOTTOM - TOP);
  const line = (key) => points.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  const ticks = n ? [...new Set(Array.from({ length: Math.min(6, n) }, (_, k) => Math.round((k * (n - 1)) / Math.max(1, Math.min(6, n) - 1))))] : [];
  const point = hover === null ? null : points[hover];

  function onMove(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - box.left) / box.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(f * (n - 1)))));
  }

  return (
    <div className="w-full mt-space-md flex flex-col">
      <div className="relative flex">
        <div className="relative w-8 h-52 shrink-0 font-label-mono-xs text-[10px] text-slate-400">
          {[max, max / 2, 0].map((v) => (
            <span key={v} className="absolute right-2 -translate-y-1/2" style={{ top: `${(y(v) / H) * 100}%` }}>
              {num(v)}
            </span>
          ))}
        </div>
        <div className="relative flex-1 h-52">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
            <defs>
              <linearGradient id="attemptsGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id="connGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
                x1="0" x2={W} y1={y(max * f)} y2={y(max * f)} />
            ))}
            <line stroke="#e2e8f0" strokeWidth="1" vectorEffect="non-scaling-stroke" x1="0" x2={W} y1={BOTTOM} y2={BOTTOM} />
            {n > 1 && (
              <>
                <polygon fill="url(#attemptsGrad)" points={`${line("attempts")} ${x(n - 1)},${BOTTOM} 0,${BOTTOM}`} />
                <polygon fill="url(#connGrad)" points={`${line("connected")} ${x(n - 1)},${BOTTOM} 0,${BOTTOM}`} />
              </>
            )}
            {SERIES.map((s) => (
              <polyline key={s.key} fill="none" points={line(s.key)} stroke={s.stroke} strokeLinecap="round" strokeLinejoin="round"
                strokeWidth="2.5" strokeDasharray={s.dashed ? "6 5" : undefined} vectorEffect="non-scaling-stroke" />
            ))}
            {point && (
              <line stroke="#cbd5e1" strokeWidth="1" vectorEffect="non-scaling-stroke" x1={x(hover)} x2={x(hover)} y1={TOP} y2={BOTTOM} />
            )}
          </svg>
          {point &&
            SERIES.map((s) => (
              <span
                key={s.key}
                className="absolute w-2.5 h-2.5 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(point[s.key]) / H) * 100}%`, background: s.stroke }}
              />
            ))}
          {point && (
            <div
              className="absolute top-0 z-10 pointer-events-none bg-slate-900 text-white rounded-lg px-3 py-2 shadow-xl text-[11.5px] w-52"
              style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > n / 2 ? "calc(-100% - 10px)" : "10px"})` }}
            >
              <p className="font-semibold mb-1">
                {clock(point.t, false)} to {clock(point.t + bucket, false)}
              </p>
              {SERIES.map((s) => (
                <p key={s.key} className="flex justify-between gap-3 text-slate-300">
                  <span>{s.label}</span>
                  <span className="font-semibold text-white">{num(point[s.key])}</span>
                </p>
              ))}
              <p className="flex justify-between gap-3 text-slate-300">
                <span>Marked willing</span>
                <span className="font-semibold text-white">{num(point.willing)}</span>
              </p>
            </div>
          )}
          <div className="absolute inset-0 cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
        </div>
      </div>
      <div className="relative h-5 ml-8 mt-2 text-slate-400 font-label-mono-xs text-label-mono-xs">
        {ticks.map((i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
            style={{ left: `${(x(i) / W) * 100}%` }}
          >
            {clock(points[i].t, false)}
          </span>
        ))}
      </div>
      <p className="ml-8 text-[10.5px] text-slate-400">Each point covers {duration(bucket)}.</p>
    </div>
  );
}
