"use client";

import { useState } from "react";
import { num, pct } from "@/lib/format";
import { decision, reason } from "@/lib/labels";
import { EmptyState } from "@/components/ui";

const W = 600;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 34, left: 36 };

// Grouped bars: what the predictive pacer would ask for at each answer rate, and what
// the safety controller would let through. The dashed tick is the naive
// expected-value batch, to show how much the binomial risk limit holds back.
export default function SensitivityChart({ rows }) {
  const [hover, setHover] = useState(null);
  if (!rows?.length) return <EmptyState icon="bar_chart" title="No sensitivity data yet" />;

  const max = Math.max(1, ...rows.flatMap((r) => [r.suggested, r.permitted, r.expected_value ?? 0]));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const group = innerW / rows.length;
  const bar = Math.min(44, group / 4);
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, Math.round(max / 2), max];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={t ? "#eef2f7" : "#dbe3ee"} strokeDasharray={t ? "3,3" : undefined} />
            <text x={PAD.left - 8} y={y(t) + 3} textAnchor="end" className="fill-gray-400" fontSize="10">
              {t}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const cx = PAD.left + group * i + group / 2;
          const held = r.permitted < r.suggested;
          return (
            <g key={r.answer_rate} onMouseEnter={() => setHover(i)} className="cursor-default">
              <rect x={cx - group / 2} y={PAD.top} width={group} height={innerH} fill={hover === i ? "#f8fafc" : "transparent"} />
              <rect x={cx - bar - 2} y={y(r.suggested)} width={bar} height={Math.max(0, y(0) - y(r.suggested))} rx="3" fill="#2563eb" />
              <rect x={cx + 2} y={y(r.permitted)} width={bar} height={Math.max(0, y(0) - y(r.permitted))} rx="3" fill={held ? "#d97706" : "#10b981"} />
              {r.expected_value != null && (
                <line x1={cx - bar - 8} x2={cx + bar + 8} y1={y(r.expected_value)} y2={y(r.expected_value)} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,3" />
              )}
              <text x={cx - bar / 2 - 2} y={y(r.suggested) - 4} textAnchor="middle" fontSize="10" className="fill-gray-700 font-semibold">
                {r.suggested}
              </text>
              <text x={cx + bar / 2 + 2} y={y(r.permitted) - 4} textAnchor="middle" fontSize="10" className="fill-gray-700 font-semibold">
                {r.permitted}
              </text>
              <text x={cx} y={H - 12} textAnchor="middle" fontSize="11" className="fill-gray-600 font-semibold">
                {pct(r.answer_rate, 0)} answer rate
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && <Tooltip row={rows[hover]} left={`${((PAD.left + group * (hover + 0.5)) / W) * 100}%`} />}
    </div>
  );
}

function Tooltip({ row, left }) {
  const verdict = decision(row.action);
  return (
    <div
      className="absolute top-2 -translate-x-1/2 w-56 p-2.5 rounded-lg bg-gray-900 text-white text-[11px] shadow-lg pointer-events-none"
      style={{ left }}
    >
      <div className="font-semibold mb-1">At a {pct(row.answer_rate, 0)} answer rate</div>
      <div className="flex justify-between"><span className="text-gray-300">Pacer would ask for</span><span>{num(row.suggested)}</span></div>
      <div className="flex justify-between"><span className="text-gray-300">Safety would allow</span><span>{num(row.permitted)}</span></div>
      <div className="flex justify-between"><span className="text-gray-300">Expected-value batch</span><span>{num(row.expected_value)}</span></div>
      <div className="flex justify-between"><span className="text-gray-300">Capacity planned with</span><span>{num(row.capacity)}</span></div>
      <div className="mt-1 pt-1 border-t border-white/10 text-gray-300">
        {verdict.label}
        {row.reasons?.length ? `: ${reason(row.reasons[0]).label}` : ""}
      </div>
    </div>
  );
}
