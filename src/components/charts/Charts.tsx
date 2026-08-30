"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, SERIES, seriesColor } from "./palette";
import { compact, currency, num } from "@/lib/utils/format";
import type { ParetoPoint, Slice } from "@/lib/data/aggregate";

type Unit = "currency" | "num" | "percent" | undefined;

const fmt = (v: number, unit: Unit) => {
  if (unit === "currency") return currency(v, { compact: Math.abs(v) >= 10_000 });
  if (unit === "percent") return `${Number(v).toFixed(1)}%`;
  return num(v, Number.isInteger(v) ? 0 : 1);
};

const axisFmt = (unit: Unit) => (v: number) =>
  unit === "currency" ? `$${compact(v)}` : unit === "percent" ? `${v}%` : compact(v);

const truncate = (s: string, n = 16) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/* ── Tooltip ──────────────────────────────────────────────────────────────── */

interface TipPayload {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
  singleLabel,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string | number;
  unit?: Unit;
  singleLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="pointer-events-none min-w-[150px] rounded-lg border border-ink-200 bg-white/97 px-3 py-2 shadow-pop backdrop-blur-sm">
      <p className="mb-1.5 text-[12px] font-semibold text-ink-900">{String(label ?? "")}</p>
      <ul className="space-y-1">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-ink-600">
              <span className="size-2 shrink-0 rounded-[3px]" style={{ background: p.color }} aria-hidden />
              {singleLabel ?? p.name ?? String(p.dataKey ?? "")}
            </span>
            <span className="font-mono font-medium tabular-nums text-ink-900">{fmt(Number(p.value ?? 0), unit)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const legendStyle = { fontSize: 11.5, paddingTop: 8, color: "#64748b" };

const gridProps = { stroke: AXIS.grid, strokeDasharray: "0", vertical: false } as const;
const xAxisProps = { stroke: AXIS.stroke, tick: AXIS.tick, tickLine: false, axisLine: { stroke: AXIS.grid } } as const;
const yAxisProps = { stroke: AXIS.stroke, tick: AXIS.tick, tickLine: false, axisLine: false, width: 52 } as const;

/* ── Area trend (single series, time on X) ────────────────────────────────── */

export function AreaTrend({ data, unit }: { data: Slice[]; unit?: Unit }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.28} />
            <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...xAxisProps} minTickGap={16} />
        <YAxis {...yAxisProps} tickFormatter={axisFmt(unit)} />
        <Tooltip
          cursor={{ stroke: AXIS.stroke, strokeWidth: 1, strokeDasharray: "4 4" }}
          content={<ChartTooltip unit={unit} singleLabel="Value" />}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Value"
          stroke={SERIES[0]}
          strokeWidth={2}
          fill="url(#areaFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Vertical bars (single series) ────────────────────────────────────────── */

export function BarSeries({ data, unit }: { data: Slice[]; unit?: Unit }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="28%">
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...xAxisProps} tickFormatter={(v: string) => truncate(v, 12)} interval={0} angle={data.length > 6 ? -18 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 52 : 30} />
        <YAxis {...yAxisProps} tickFormatter={axisFmt(unit)} />
        <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip unit={unit} singleLabel="Value" />} />
        <Bar dataKey="value" name="Value" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Horizontal bars — the default for ranked categories ──────────────────── */

export function HBar({ data, unit }: { data: Slice[]; unit?: Unit }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }} barCategoryGap="26%">
        <CartesianGrid stroke={AXIS.grid} horizontal={false} />
        <XAxis type="number" {...xAxisProps} tickFormatter={axisFmt(unit)} />
        <YAxis
          type="category"
          dataKey="name"
          {...yAxisProps}
          width={128}
          tickFormatter={(v: string) => truncate(v, 18)}
        />
        <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip unit={unit} singleLabel="Value" />} />
        {/* One hue: these bars are ranked, and colour must follow the entity, not its rank. */}
        <Bar dataKey="value" name="Value" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Donut (part-to-whole, ≤ 6 slices) ────────────────────────────────────── */

export function DonutSplit({ data, unit }: { data: Slice[]; unit?: Unit }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="#ffffff"
            strokeWidth={2}
            minAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={seriesColor(i)} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip unit={unit} />} />
          <Legend verticalAlign="bottom" height={30} iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[36%] -translate-y-1/2 text-center">
        <p className="font-mono text-[19px] font-semibold leading-none tabular-nums text-ink-900">
          {unit === "currency" ? currency(total, { compact: true }) : compact(total)}
        </p>
        <p className="mt-1 text-[10.5px] uppercase tracking-[0.1em] text-ink-400">Total</p>
      </div>
    </div>
  );
}

/* ── Stacked bars ─────────────────────────────────────────────────────────── */

export function StackedBars({
  data,
  keys,
  unit,
}: {
  data: Record<string, string | number>[];
  keys: string[];
  unit?: Unit;
}) {
  const shown = keys.slice(0, 8);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="26%">
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...xAxisProps} tickFormatter={(v: string) => truncate(v, 12)} interval={0} angle={data.length > 5 ? -18 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 56 : 30} />
        <YAxis {...yAxisProps} tickFormatter={axisFmt(unit)} />
        <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip unit={unit} />} />
        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
        {shown.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            name={k}
            stackId="a"
            fill={seriesColor(i)}
            stroke="#ffffff"
            strokeWidth={2}
            radius={i === shown.length - 1 ? [4, 4, 0, 0] : 0}
            maxBarSize={46}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Grouped bars (compare 2–4 measures on one scale) ─────────────────────── */

export function GroupedBars({
  data,
  keys,
  unit,
}: {
  data: Record<string, string | number>[];
  keys: string[];
  unit?: Unit;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="24%" barGap={2}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...xAxisProps} tickFormatter={(v: string) => truncate(v, 12)} interval={0} angle={data.length > 4 ? -18 : 0} textAnchor={data.length > 4 ? "end" : "middle"} height={data.length > 4 ? 56 : 30} />
        <YAxis {...yAxisProps} tickFormatter={axisFmt(unit)} />
        <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip unit={unit} />} />
        {keys.length > 1 && <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={legendStyle} />}
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} name={k} fill={seriesColor(i)} radius={[4, 4, 0, 0]} maxBarSize={26} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Multi-line trend ─────────────────────────────────────────────────────── */

export function LineTrend({
  data,
  keys,
  unit,
}: {
  data: Record<string, string | number>[];
  keys: string[];
  unit?: Unit;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...xAxisProps} minTickGap={16} />
        <YAxis {...yAxisProps} tickFormatter={axisFmt(unit)} />
        <Tooltip cursor={{ stroke: AXIS.stroke, strokeWidth: 1, strokeDasharray: "4 4" }} content={<ChartTooltip unit={unit} />} />
        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
        {keys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            name={k}
            stroke={seriesColor(i)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Pareto — single axis; cumulative share is a direct label, not a 2nd scale ─ */

export function ParetoBars({ data, unit }: { data: ParetoPoint[]; unit?: Unit }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 12, bottom: 0, left: 0 }} barCategoryGap="26%">
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="name"
          {...xAxisProps}
          tickFormatter={(v: string) => truncate(v, 12)}
          interval={0}
          angle={-18}
          textAnchor="end"
          height={58}
        />
        <YAxis {...yAxisProps} tickFormatter={axisFmt(unit)} />
        <Tooltip
          cursor={{ fill: "#f8fafc" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as ParetoPoint;
            return (
              <div className="pointer-events-none min-w-[170px] rounded-lg border border-ink-200 bg-white/97 px-3 py-2 shadow-pop">
                <p className="mb-1.5 text-[12px] font-semibold text-ink-900">{String(label)}</p>
                <p className="flex justify-between gap-4 text-[12px] text-ink-600">
                  Quantity <span className="font-mono font-medium text-ink-900">{fmt(p.value, unit)}</span>
                </p>
                <p className="flex justify-between gap-4 text-[12px] text-ink-600">
                  Cumulative <span className="font-mono font-medium text-ink-900">{p.cumulative}%</span>
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="value" name="Quantity" radius={[4, 4, 0, 0]} maxBarSize={44}>
          <LabelList
            dataKey="cumulative"
            position="top"
            fontSize={10.5}
            fill="#64748b"
            formatter={(v: unknown) => `${v}%`}
          />
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? SERIES[0] : i < 3 ? "#f79263" : "#fdb68f"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
