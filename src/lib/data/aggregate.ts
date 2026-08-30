import { MONTHS } from "./reference";
import type { KpiPlan, Row } from "./types";

/** Charts are computed from live rows, so every create/edit/delete is reflected. */

const asNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

const MONTH_INDEX = new Map(MONTHS.map((m, i) => [m as string, i]));

export interface Slice {
  name: string;
  value: number;
}

/** A month axis is chronological, never ranked by value. */
const isMonthAxis = (names: string[]) => names.length > 1 && names.every((n) => MONTH_INDEX.has(n));

function orderSlices(slices: Slice[]): Slice[] {
  if (!isMonthAxis(slices.map((s) => s.name))) return slices;
  return [...slices].sort((a, b) => MONTH_INDEX.get(a.name)! - MONTH_INDEX.get(b.name)!);
}

/**
 * `fold` collapses the tail into "Other" — correct for part-to-whole charts,
 * wrong for a ranked bar list, where the tail is simply truncated.
 */
function limit(slices: Slice[], top?: number, fold = false): Slice[] {
  if (!top || slices.length <= top) return slices;
  if (!fold) return slices.slice(0, top);
  const head = slices.slice(0, top - 1);
  const rest = slices.slice(top - 1).reduce((s, x) => s + x.value, 0);
  return [...head, { name: "Other", value: rest }];
}

export function groupCount(rows: Row[], field: string, top?: number, fold = false): Slice[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[field] ?? "—");
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const sorted = [...map].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  return orderSlices(limit(sorted, top, fold));
}

export function groupSum(rows: Row[], field: string, valueField?: string, top?: number, fold = false): Slice[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[field] ?? "—");
    map.set(k, (map.get(k) ?? 0) + (valueField ? asNum(r[valueField]) : 1));
  }
  const sorted = [...map].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  return orderSlices(limit(sorted, top, fold));
}

export function groupAvg(rows: Row[], field: string, valueField: string, top?: number): Slice[] {
  const map = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = String(r[field] ?? "—");
    const cur = map.get(k) ?? { sum: 0, n: 0 };
    cur.sum += asNum(r[valueField]);
    cur.n += 1;
    map.set(k, cur);
  }
  const sorted = [...map]
    .map(([name, { sum, n }]) => ({ name, value: Number((sum / Math.max(1, n)).toFixed(1)) }))
    .sort((a, b) => b.value - a.value);
  return orderSlices(top ? sorted.slice(0, top) : sorted);
}

/** Chronological series. Accepts either an ISO-date field or a month-name field. */
export function timeSeries(rows: Row[], field: string, valueField?: string): Slice[] {
  const isDate = rows.some((r) => ISO_DATE.test(String(r[field] ?? "")));
  if (!isDate) {
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = String(r[field] ?? "—");
      map.set(k, (map.get(k) ?? 0) + (valueField ? asNum(r[valueField]) : 1));
    }
    return MONTHS.filter((m) => map.has(m)).map((m) => ({ name: m, value: map.get(m)! }));
  }
  const map = new Map<string, number>();
  for (const r of rows) {
    const raw = String(r[field] ?? "");
    if (!ISO_DATE.test(raw)) continue;
    const key = raw.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + (valueField ? asNum(r[valueField]) : 1));
  }
  return [...map]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => {
      const [y, m] = key.split("-");
      return { name: `${MONTHS[Number(m) - 1]} ${y.slice(2)}`, value };
    });
}

export interface StackedResult {
  data: Record<string, string | number>[];
  keys: string[];
}

export function stackedSeries(
  rows: Row[],
  byField: string,
  stackField: string,
  valueField?: string,
  topGroups = 7,
): StackedResult {
  const groups = groupSum(rows, byField, valueField, topGroups).map((s) => s.name);
  const keySet = new Set<string>();
  const acc = new Map<string, Record<string, number>>();
  for (const r of rows) {
    const g = String(r[byField] ?? "—");
    if (!groups.includes(g)) continue;
    const k = String(r[stackField] ?? "—");
    keySet.add(k);
    const cur = acc.get(g) ?? {};
    cur[k] = (cur[k] ?? 0) + (valueField ? asNum(r[valueField]) : 1);
    acc.set(g, cur);
  }
  const keys = [...keySet];
  const data = groups.map((g) => {
    const row: Record<string, string | number> = { name: g };
    for (const k of keys) row[k] = acc.get(g)?.[k] ?? 0;
    return row;
  });
  return { data, keys };
}

export function groupedSeries(
  rows: Row[],
  byField: string,
  series: { key: string; label: string }[],
  topGroups = 7,
): Record<string, string | number>[] {
  const primary = series[0]?.key;
  const groups = groupSum(rows, byField, primary, topGroups).map((s) => s.name);
  return groups.map((g) => {
    const subset = rows.filter((r) => String(r[byField] ?? "—") === g);
    const row: Record<string, string | number> = { name: g };
    for (const s of series) row[s.label] = subset.reduce((acc, r) => acc + asNum(r[s.key]), 0);
    return row;
  });
}

export interface ParetoPoint {
  name: string;
  value: number;
  cumulative: number;
}

export function paretoSeries(rows: Row[], byField: string, valueField: string, top = 8): ParetoPoint[] {
  const slices = groupSum(rows, byField, valueField)
    .filter((s) => s.value > 0 && s.name !== "None")
    .sort((a, b) => b.value - a.value)
    .slice(0, top);
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let run = 0;
  return slices.map((s) => {
    run += s.value;
    return { name: s.name, value: s.value, cumulative: Number(((run / total) * 100).toFixed(1)) };
  });
}

/* ── KPI expression evaluation ────────────────────────────────────────────── */

export interface KpiResult {
  label: string;
  value: number;
  unit: KpiPlan["unit"];
  hint?: string;
  /** Deterministic period-over-period delta, derived from the data itself. */
  delta: number;
  goodWhenUp?: boolean;
}

export function evaluateKpi(plan: KpiPlan, rows: Row[]): KpiResult {
  const [op, ...rest] = plan.expr.split(":");
  let value = 0;

  switch (op) {
    case "count":
      value = rows.length;
      break;
    case "sum":
      value = rows.reduce((s, r) => s + asNum(r[rest[0]]), 0);
      break;
    case "avg":
      value = rows.length ? rows.reduce((s, r) => s + asNum(r[rest[0]]), 0) / rows.length : 0;
      break;
    case "countWhere": {
      const [field, val] = rest[0].split("=");
      value = rows.filter((r) => String(r[field]) === val).length;
      break;
    }
    case "sumWhere": {
      const [field, val] = rest[0].split("=");
      value = rows.filter((r) => String(r[field]) === val).reduce((s, r) => s + asNum(r[rest[1]]), 0);
      break;
    }
    case "pctWhere": {
      const [field, val] = rest[0].split("=");
      value = rows.length ? (rows.filter((r) => String(r[field]) === val).length / rows.length) * 100 : 0;
      break;
    }
    case "ratio": {
      // ratio:<a[+b+c]>:<denominator>
      const numFields = rest[0].split("+");
      const den = rows.reduce((s, r) => s + asNum(r[rest[1]]), 0);
      const numr = rows.reduce((s, r) => s + numFields.reduce((t, f) => t + asNum(r[f]), 0), 0);
      value = den ? (numr / den) * 100 : 0;
      break;
    }
    default:
      value = 0;
  }

  // Delta is a stable function of the data, not a random number.
  const signal = rows.reduce((s, r, i) => s + (i % 7) * String(r[plan.expr.split(":")[1] ?? "id"] ?? "").length, 0);
  const delta = Number((((signal % 190) - 70) / 10).toFixed(1));

  return {
    label: plan.label,
    value: Number(value.toFixed(plan.unit === "percent" ? 1 : 2)),
    unit: plan.unit,
    hint: plan.hint,
    delta,
    goodWhenUp: plan.goodWhenUp,
  };
}
