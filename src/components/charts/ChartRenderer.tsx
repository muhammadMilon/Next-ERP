"use client";

import { useMemo } from "react";
import { ChartFrame } from "./ChartFrame";
import { AreaTrend, BarSeries, DonutSplit, GroupedBars, HBar, ParetoBars, StackedBars } from "./Charts";
import {
  groupAvg,
  groupCount,
  groupSum,
  groupedSeries,
  paretoSeries,
  stackedSeries,
  timeSeries,
} from "@/lib/data/aggregate";
import type { ChartPlan, Row } from "@/lib/data/types";
import { EmptyState } from "@/components/ui/EmptyState";

/** Renders one chart plan against the live rows of a page. */
export function ChartRenderer({ plan, rows, height = 250 }: { plan: ChartPlan; rows: Row[]; height?: number }) {
  const content = useMemo(() => {
    switch (plan.form) {
      case "donut": {
        const data = groupCount(rows, plan.by, 6, true);
        return { node: <DonutSplit data={data} unit="num" />, table: data, unit: "num" as const, valueLabel: "Records" };
      }
      case "hbar": {
        const data = groupSum(rows, plan.by, plan.value, plan.top ?? 8);
        return { node: <HBar data={data} unit={plan.unit} />, table: data, unit: plan.unit, valueLabel: plan.value ? "Value" : "Records" };
      }
      case "bar": {
        // Averages read better than sums for rate-like measures.
        const isRate = /pct|days|hours|rate|score|utilis/i.test(plan.value ?? "");
        const data = plan.value
          ? isRate
            ? groupAvg(rows, plan.by, plan.value, 8)
            : groupSum(rows, plan.by, plan.value, 8)
          : groupCount(rows, plan.by, 8);
        return { node: <BarSeries data={data} unit={plan.unit} />, table: data, unit: plan.unit, valueLabel: "Value" };
      }
      case "area": {
        const data = timeSeries(rows, plan.by, plan.value);
        return { node: <AreaTrend data={data} unit={plan.unit} />, table: data, unit: plan.unit, valueLabel: "Value" };
      }
      case "stacked": {
        const { data, keys } = stackedSeries(rows, plan.by, plan.stack, plan.value, 7);
        const table = data.map((d) => ({
          name: String(d.name),
          value: keys.reduce((s, k) => s + Number(d[k] ?? 0), 0),
        }));
        return { node: <StackedBars data={data} keys={keys} unit={plan.unit} />, table, unit: plan.unit, valueLabel: "Total" };
      }
      case "grouped": {
        const data = groupedSeries(rows, plan.by, plan.series, 7);
        const keys = plan.series.map((s) => s.label);
        const table = data.map((d) => ({
          name: String(d.name),
          value: keys.reduce((s, k) => s + Number(d[k] ?? 0), 0),
        }));
        return { node: <GroupedBars data={data} keys={keys} unit={plan.unit} />, table, unit: plan.unit, valueLabel: "Total" };
      }
      case "pareto": {
        const data = paretoSeries(rows, plan.by, plan.value ?? "value", 8);
        return {
          node: <ParetoBars data={data} unit="num" />,
          table: data.map((d) => ({ name: d.name, value: d.value })),
          unit: "num" as const,
          valueLabel: "Quantity",
        };
      }
      default:
        return null;
    }
  }, [plan, rows]);

  const hasData = content && content.table.length > 0;

  return (
    <ChartFrame
      title={plan.title}
      hint={"hint" in plan ? plan.hint : undefined}
      height={height}
      tableRows={hasData ? content!.table : undefined}
      unit={content?.unit}
      valueLabel={content?.valueLabel}
    >
      {hasData ? (
        content!.node
      ) : (
        <EmptyState title="No data in range" body="Add a record or widen the filter to populate this chart." />
      )}
    </ChartFrame>
  );
}

export function ChartGrid({ plans, rows }: { plans: ChartPlan[]; rows: Row[] }) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {plans.map((p) => (
        <ChartRenderer key={p.title} plan={p} rows={rows} />
      ))}
    </div>
  );
}
