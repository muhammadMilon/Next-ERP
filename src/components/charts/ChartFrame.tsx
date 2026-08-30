"use client";

import { useState, type ReactNode } from "react";
import { Table2, ChartColumnBig } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { num, currency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/** Every chart ships with a table view — the accessibility fallback and the
 *  relief required by the palette's sub-3:1 contrast slots. */
export function ChartFrame({
  title,
  hint,
  icon,
  height = 260,
  tableRows,
  unit,
  valueLabel = "Value",
  children,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
  height?: number;
  tableRows?: { name: string; value: number }[];
  unit?: "currency" | "num" | "percent";
  valueLabel?: string;
  children: ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const fmt = (v: number) => (unit === "currency" ? currency(v, { compact: Math.abs(v) >= 100_000 }) : unit === "percent" ? `${v.toFixed(1)}%` : num(v, Number.isInteger(v) ? 0 : 1));

  return (
    <Card className="flex flex-col">
      <CardHeader
        title={title}
        hint={hint}
        icon={icon}
        actions={
          tableRows ? (
            <div className="flex rounded-lg bg-ink-100 p-0.5">
              {(["chart", "table"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-label={v === "chart" ? "Chart view" : "Table view"}
                  className={cn(
                    "focus-brand grid size-6 place-items-center rounded-md transition-colors",
                    view === v ? "bg-white text-brand-600 shadow-sm" : "text-ink-400 hover:text-ink-600",
                  )}
                >
                  {v === "chart" ? <ChartColumnBig className="size-3.5" /> : <Table2 className="size-3.5" />}
                </button>
              ))}
            </div>
          ) : null
        }
      />
      <div className="flex-1 p-3 pt-4">
        {view === "chart" ? (
          <div style={{ height }} className="w-full">
            {children}
          </div>
        ) : (
          <div className="max-h-[260px] overflow-auto rounded-lg border border-ink-100">
            <table className="w-full text-[12.5px]">
              <thead className="sticky top-0 bg-ink-50">
                <tr className="border-b border-ink-200">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-ink-500">Category</th>
                  <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide text-ink-500">{valueLabel}</th>
                </tr>
              </thead>
              <tbody>
                {tableRows?.map((r) => (
                  <tr key={r.name} className="border-b border-ink-100 last:border-0">
                    <td className="px-3 py-1.5 text-ink-700">{r.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono tabular-nums text-ink-800">{fmt(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
