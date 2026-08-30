"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { currency, num, pct } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps {
  label: string;
  value: number;
  unit?: "currency" | "num" | "percent";
  hint?: string;
  delta?: number;
  goodWhenUp?: boolean;
  icon?: React.ReactNode;
  /** Bare values (0–1 normalised) drawn as a recessive sparkline. */
  spark?: number[];
}

const formatValue = (value: number, unit?: StatCardProps["unit"]) => {
  if (unit === "currency") return currency(value, { compact: Math.abs(value) >= 100_000 });
  if (unit === "percent") return pct(value);
  return num(value, Number.isInteger(value) ? 0 : 1);
};

export function StatCard({ label, value, unit, hint, delta, goodWhenUp = true, icon, spark }: StatCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) > 0;
  const flat = (delta ?? 0) === 0;
  const positive = flat ? null : up === goodWhenUp;

  return (
    <article className="group relative overflow-hidden rounded-xl border border-ink-200/80 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-400 to-amber-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-500">{label}</p>
        {icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500 transition-colors group-hover:bg-brand-100">
            {icon}
          </span>
        )}
      </div>

      <p className="mt-2 font-mono text-[24px] font-semibold leading-none tracking-tight tabular-nums text-ink-900">
        {formatValue(value, unit)}
      </p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums",
                positive === null
                  ? "bg-slate-100 text-slate-600"
                  : positive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700",
              )}
            >
              {flat ? <Minus className="size-3" /> : up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(delta!).toFixed(1)}%
            </span>
          )}
          {hint && <p className="line-clamp-1 text-[11.5px] text-ink-400">{hint}</p>}
        </div>
        {spark && spark.length > 1 && <Sparkline points={spark} positive={positive !== false} />}
      </div>
    </article>
  );
}

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  const w = 56;
  const h = 18;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - ((p - min) / span) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible" aria-hidden>
      <path d={d} fill="none" stroke={positive ? "#1baf7a" : "#e34948"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
