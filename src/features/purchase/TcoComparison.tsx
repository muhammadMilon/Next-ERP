"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Calculator, CircleCheck, Layers, TrendingDown } from "lucide-react";
import { PageHeader, KpiRow } from "@/components/workspace/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { GroupedBars, HBar } from "@/components/charts/Charts";
import { useStore } from "@/store/app-store";
import type { ScreenProps } from "@/features/common/ModuleScreen";
import type { Row } from "@/lib/data/types";
import { currency, num, pct } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { SERIES } from "@/components/charts/palette";

const COMPONENTS = [
  { key: "basePrice", label: "Base price" },
  { key: "freight", label: "Freight" },
  { key: "duty", label: "Duty & tax" },
  { key: "financeCost", label: "Finance cost" },
  { key: "qualityRisk", label: "Quality risk" },
] as const;

export function TcoComparison({ loc }: ScreenProps) {
  const { rowsFor, updateRow, logActivity } = useStore();
  const tco = rowsFor("tco");

  const rfqOptions = useMemo(() => {
    // Count distinct suppliers — that is what the comparison actually shows.
    const bidders = new Map<string, Set<string>>();
    for (const t of tco) {
      const key = String(t.rfqNo);
      if (!bidders.has(key)) bidders.set(key, new Set());
      bidders.get(key)!.add(String(t.supplier));
    }
    return [...bidders.entries()]
      .map(([rfq, set]) => ({ rfq, n: set.size }))
      .filter((x) => x.n >= 2)
      .sort((a, b) => b.n - a.n || a.rfq.localeCompare(b.rfq))
      .slice(0, 24);
  }, [tco]);

  const [rfqNo, setRfqNo] = useState(rfqOptions[0]?.rfq ?? "");

  /** One evaluation per supplier — the cheapest landed cost stands. */
  const offers = useMemo(() => {
    const bySupplier = new Map<string, Row>();
    for (const t of tco) {
      if (String(t.rfqNo) !== rfqNo) continue;
      const key = String(t.supplier);
      const held = bySupplier.get(key);
      if (!held || Number(t.tcoPerUnit) < Number(held.tcoPerUnit)) bySupplier.set(key, t);
    }
    return [...bySupplier.values()].sort((a, b) => Number(a.tcoPerUnit) - Number(b.tcoPerUnit)).slice(0, 6);
  }, [tco, rfqNo]);

  const stack = offers.map((o) => {
    const row: Record<string, string | number> = { name: String(o.supplier) };
    for (const c of COMPONENTS) row[c.label] = Number(o[c.key] ?? 0);
    return row;
  });
  const perUnit = offers.map((o) => ({ name: String(o.supplier), value: Number(o.tcoPerUnit) }));

  const cheapest = offers[0];
  const dearest = offers[offers.length - 1];
  const totalNonPrice = offers.reduce(
    (s, o) => s + Number(o.freight || 0) + Number(o.duty || 0) + Number(o.financeCost || 0) + Number(o.qualityRisk || 0),
    0,
  );
  const totalTco = offers.reduce((s, o) => s + Number(o.tcoTotal || 0), 0);
  const nonPriceShare = totalTco ? (totalNonPrice / totalTco) * 100 : 0;
  const gap = cheapest && dearest ? Number(dearest.tcoTotal) - Number(cheapest.tcoTotal) : 0;

  const recommend = (row: Row) => {
    offers.forEach((o) =>
      updateRow("tco", { ...o, status: String(o.id) === String(row.id) ? "Recommended" : "Evaluated" }),
    );
    logActivity({ action: "approved", entity: "TCO Evaluation", ref: String(row.tcoNo), href: loc.href });
    toast.success(`${row.supplier} recommended on total cost of ownership`, { icon: "🏅", duration: 4000 });
  };

  return (
    <>
      <PageHeader
        loc={loc}
        actions={
          <>
            <select
              value={rfqNo}
              onChange={(e) => setRfqNo(e.target.value)}
              aria-label="Select RFQ"
              className="focus-brand h-9 rounded-lg border border-ink-200 bg-surface px-3 font-mono text-[13px] text-ink-800 hover:border-ink-300 focus:border-brand-400"
            >
              {rfqOptions.map((o) => (
                <option key={o.rfq} value={o.rfq}>
                  {o.rfq} · {o.n} evaluations
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              icon={<Calculator className="size-4" />}
              onClick={() =>
                toast.promise(new Promise((r) => window.setTimeout(r, 850)), {
                  loading: "Recomputing landed cost…",
                  success: `TCO model refreshed for ${rfqNo}`,
                  error: "Recalculation failed",
                })
              }
            >
              Recalculate
            </Button>
          </>
        }
      />

      {offers.length === 0 ? (
        <Card>
          <EmptyState title="Nothing to compare" body="This RFQ has fewer than two TCO evaluations. Build the cost model for more offers first." />
        </Card>
      ) : (
        <>
          <KpiRow>
            <StatCard label="Offers Evaluated" value={offers.length} unit="num" hint={`Against ${rfqNo}`} icon={<Layers className="size-4" />} />
            <StatCard label="Lowest Total Cost" value={Number(cheapest.tcoTotal)} unit="currency" hint={String(cheapest.supplier)} goodWhenUp={false} delta={-5.1} icon={<TrendingDown className="size-4" />} />
            <StatCard label="Cost Gap" value={gap} unit="currency" hint="Highest against lowest offer" goodWhenUp={false} delta={3.2} icon={<Calculator className="size-4" />} />
            <StatCard label="Non-price Share" value={nonPriceShare} unit="percent" hint="Freight, duty, finance and quality" goodWhenUp={false} delta={2.4} icon={<Layers className="size-4" />} />
          </KpiRow>

          <div className="mb-4 grid gap-3 xl:grid-cols-2">
            <ChartFrame
              title="Where total cost accumulates"
              hint="Cost components per supplier, stacked on one scale"
              height={260}
              unit="currency"
              valueLabel="Total TCO"
              tableRows={stack.map((s) => ({
                name: String(s.name),
                value: COMPONENTS.reduce((t, c) => t + Number(s[c.label] ?? 0), 0),
              }))}
            >
              <GroupedBars data={stack} keys={COMPONENTS.map((c) => c.label)} unit="currency" />
            </ChartFrame>
            <ChartFrame title="TCO per unit" hint="The number that should drive the award" height={260} unit="currency" tableRows={perUnit}>
              <HBar data={perUnit} unit="currency" />
            </ChartFrame>
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title={`Total cost of ownership — ${rfqNo}`}
              hint="Ranked by cost per unit. The recommendation drives the CPT and CSCO decision."
              icon={<CircleCheck className="size-4" />}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-brand-400 bg-brand-500">
                    {["Rank", "Supplier", "Qty", ...COMPONENTS.map((c) => c.label), "Total TCO", "Per unit", "Share", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className={cn(
                          "whitespace-nowrap px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-white/90",
                          ["Rank", "Supplier", "Status"].includes(h) ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o, i) => {
                    const total = Number(o.tcoTotal);
                    const share = totalTco ? (total / totalTco) * 100 : 0;
                    return (
                      <tr key={String(o.id)} className={cn("border-b border-ink-100 transition-colors hover:bg-brand-50/40", i === 0 && "bg-emerald-50/40")}>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "grid size-6 place-items-center rounded-full font-mono text-[11px] font-bold",
                              i === 0 ? "bg-emerald-600 text-canvas" : "bg-ink-100 text-ink-600",
                            )}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-[13px] font-medium text-ink-900">{String(o.supplier)}</p>
                          <p className="font-mono text-[11px] text-ink-400">{String(o.tcoNo)}</p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-700">{num(Number(o.qty))}</td>
                        {COMPONENTS.map((c, ci) => (
                          <td key={c.key} className="px-3 py-2.5 text-right">
                            <span className="flex items-center justify-end gap-1.5 font-mono tabular-nums text-ink-700">
                              <span className="size-2 shrink-0 rounded-[3px]" style={{ background: SERIES[ci] }} aria-hidden />
                              {currency(Number(o[c.key] ?? 0))}
                            </span>
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-ink-900">{currency(total)}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-800">{currency(Number(o.tcoPerUnit))}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-500">{pct(share)}</td>
                        <td className="px-3 py-2.5">
                          <StatusPill value={String(o.status)} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            size="xs"
                            variant={o.status === "Recommended" ? "primary" : "secondary"}
                            onClick={() => recommend(o)}
                          >
                            {o.status === "Recommended" ? "Recommended" : "Recommend"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <CardBody className="border-t border-ink-100 bg-ink-50/40 py-2.5">
              <p className="text-[12px] leading-relaxed text-ink-500">
                Lowest base price does not always win: non-price components carry{" "}
                <strong className="font-medium text-ink-800">{pct(nonPriceShare)}</strong> of total cost across these{" "}
                {offers.length} offers. The recommended supplier is{" "}
                <strong className="font-medium text-ink-800">{String(cheapest.supplier)}</strong> at{" "}
                <strong className="font-mono text-ink-800">{currency(Number(cheapest.tcoPerUnit))}</strong> per unit.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
