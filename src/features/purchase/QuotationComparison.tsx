"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Award, Crown, Scale, Timer, TrendingDown } from "lucide-react";
import { PageHeader, KpiRow } from "@/components/workspace/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Chip, StatusPill } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { HBar, GroupedBars } from "@/components/charts/Charts";
import { useStore } from "@/store/app-store";
import type { ScreenProps } from "@/features/common/ModuleScreen";
import type { Row } from "@/lib/data/types";
import { currency, dateShort, num } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const CRITERIA = [
  { key: "unitPrice", label: "Unit price", type: "currency", lowerIsBetter: true },
  { key: "totalValue", label: "Total value", type: "currency", lowerIsBetter: true },
  { key: "qty", label: "Offered quantity", type: "num", lowerIsBetter: false },
  { key: "leadTimeDays", label: "Lead time (days)", type: "num", lowerIsBetter: true },
  { key: "techScore", label: "Technical score", type: "num", lowerIsBetter: false },
] as const;

export function QuotationComparison({ loc }: ScreenProps) {
  const { rowsFor, updateRow, logActivity } = useStore();
  const quotations = rowsFor("quotation");

  const rfqOptions = useMemo(() => {
    // Count distinct suppliers — that is what the comparison actually shows.
    const bidders = new Map<string, Set<string>>();
    for (const q of quotations) {
      const key = String(q.rfqNo);
      if (!bidders.has(key)) bidders.set(key, new Set());
      bidders.get(key)!.add(String(q.supplier));
    }
    return [...bidders.entries()]
      .map(([rfq, set]) => ({ rfq, n: set.size }))
      .filter((x) => x.n >= 2)
      .sort((a, b) => b.n - a.n || a.rfq.localeCompare(b.rfq))
      .slice(0, 24);
  }, [quotations]);

  const [rfqNo, setRfqNo] = useState(rfqOptions[0]?.rfq ?? "");

  /** One row per supplier — a revised quote replaces the earlier, dearer one. */
  const offers = useMemo(() => {
    const bySupplier = new Map<string, Row>();
    for (const q of quotations) {
      if (String(q.rfqNo) !== rfqNo) continue;
      const key = String(q.supplier);
      const held = bySupplier.get(key);
      if (!held || Number(q.unitPrice) < Number(held.unitPrice)) bySupplier.set(key, q);
    }
    return [...bySupplier.values()].sort((a, b) => Number(a.unitPrice) - Number(b.unitPrice)).slice(0, 6);
  }, [quotations, rfqNo]);

  /** Best value per criterion — omitted where every offer is identical,
   *  since highlighting the whole row says nothing. */
  const best = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of CRITERIA) {
      const values = offers.map((o) => Number(o[c.key] ?? 0)).filter((v) => Number.isFinite(v));
      if (!values.length) continue;
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min === max) continue;
      out[c.key] = c.lowerIsBetter ? min : max;
    }
    return out;
  }, [offers]);

  const lowest = offers[0];
  const avgPrice = offers.length ? offers.reduce((s, o) => s + Number(o.unitPrice), 0) / offers.length : 0;
  const spread = offers.length > 1 ? ((Number(offers[offers.length - 1].unitPrice) - Number(offers[0].unitPrice)) / Number(offers[0].unitPrice)) * 100 : 0;
  const potentialSaving = offers.length ? (avgPrice - Number(lowest.unitPrice)) * Number(lowest.qty ?? 0) : 0;

  const priceChart = offers.map((o) => ({ name: String(o.supplier), value: Number(o.unitPrice) }));
  const commercialChart = offers.map((o) => ({
    name: String(o.supplier),
    "Total value": Number(o.totalValue),
  }));

  const award = (row: Row) => {
    offers.forEach((o) =>
      updateRow("quotation", { ...o, status: String(o.id) === String(row.id) ? "Qualified" : "Disqualified" }),
    );
    logActivity({ action: "approved", entity: "Quotation", ref: String(row.quoteNo), href: loc.href });
    toast.success(`${row.supplier} awarded on ${rfqNo}`, { icon: "🏆", duration: 4000 });
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
                  {o.rfq} · {o.n} offers
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              icon={<Scale className="size-4" />}
              onClick={() =>
                toast.promise(new Promise((r) => window.setTimeout(r, 800)), {
                  loading: "Building the comparative statement…",
                  success: `Comparative statement for ${rfqNo} is ready`,
                  error: "Could not build the statement",
                })
              }
            >
              Generate CS
            </Button>
          </>
        }
      />

      {offers.length === 0 ? (
        <Card>
          <EmptyState
            title="No comparable offers"
            body="This RFQ has fewer than two quotations. Capture more supplier responses before running a comparison."
          />
        </Card>
      ) : (
        <>
          <KpiRow>
            <StatCard label="Offers Compared" value={offers.length} unit="num" hint={`Against ${rfqNo}`} icon={<Scale className="size-4" />} />
            <StatCard label="Lowest Unit Price" value={Number(lowest.unitPrice)} unit="currency" hint={String(lowest.supplier)} goodWhenUp={false} delta={-Math.abs(spread) / 2} icon={<TrendingDown className="size-4" />} />
            <StatCard label="Price Spread" value={spread} unit="percent" hint="Highest against lowest offer" goodWhenUp={false} delta={spread / 4} icon={<Scale className="size-4" />} />
            <StatCard label="Potential Saving" value={potentialSaving} unit="currency" hint="Lowest offer against the average" goodWhenUp delta={8.4} icon={<Award className="size-4" />} />
          </KpiRow>

          <div className="mb-4 grid gap-3 xl:grid-cols-2">
            <ChartFrame title="Unit price by supplier" hint="Lower is better — the leftmost bar is the recommended offer" height={240} unit="currency" tableRows={priceChart}>
              <HBar data={priceChart} unit="currency" />
            </ChartFrame>
            <ChartFrame
              title="Total offered value by supplier"
              hint="Quantity × unit price for each response"
              height={240}
              unit="currency"
              tableRows={commercialChart.map((c) => ({ name: c.name, value: Number(c["Total value"]) }))}
            >
              <GroupedBars data={commercialChart} keys={["Total value"]} unit="currency" />
            </ChartFrame>
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title={`Comparative statement — ${rfqNo}`}
              hint="Best value on each criterion is highlighted. Awarding one offer disqualifies the rest."
              icon={<Crown className="size-4" />}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-brand-400 bg-brand-500">
                    <th className="sticky left-0 z-10 bg-brand-500 px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wide text-white/90">
                      Criterion
                    </th>
                    {offers.map((o, i) => (
                      <th key={String(o.id)} className="min-w-[180px] px-3 py-2.5 text-left">
                        <span className="flex items-center gap-1.5">
                          {i === 0 && <Crown className="size-3.5 text-amber-400" aria-label="Lowest price" />}
                          <span className="text-[12.5px] font-semibold text-white">{String(o.supplier)}</span>
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] text-white/70">{String(o.quoteNo)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIA.map((c) => (
                    <tr key={c.key} className="border-b border-ink-100">
                      <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-600">
                        {c.label}
                        <span className="ml-1 text-[10.5px] text-ink-400">{c.lowerIsBetter ? "↓ better" : "↑ better"}</span>
                      </th>
                      {offers.map((o) => {
                        const v = Number(o[c.key] ?? 0);
                        const isBest = best[c.key] === v;
                        return (
                          <td key={String(o.id)} className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-block rounded-md px-1.5 py-0.5 font-mono text-[12.5px] tabular-nums",
                                isBest ? "bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-600/20" : "text-ink-700",
                              )}
                            >
                              {c.type === "currency" ? currency(v) : num(v)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {(
                    [
                      { key: "incoterm", label: "Incoterm" },
                      { key: "paymentTerm", label: "Payment term" },
                      { key: "currency", label: "Currency" },
                    ] as const
                  ).map((c) => (
                    <tr key={c.key} className="border-b border-ink-100">
                      <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-600">{c.label}</th>
                      {offers.map((o) => (
                        <td key={String(o.id)} className="px-3 py-2.5">
                          <Chip>{String(o[c.key] ?? "—")}</Chip>
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr className="border-b border-ink-100">
                    <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-600">Valid till</th>
                    {offers.map((o) => (
                      <td key={String(o.id)} className="px-3 py-2.5 text-ink-700">
                        {dateShort(String(o.validTill))}
                      </td>
                    ))}
                  </tr>

                  <tr className="border-b border-ink-100">
                    <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 text-left text-[12.5px] font-medium text-ink-600">Status</th>
                    {offers.map((o) => (
                      <td key={String(o.id)} className="px-3 py-2.5">
                        <StatusPill value={String(o.status)} />
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-ink-50/50">
                    <th className="sticky left-0 z-10 bg-ink-50/95 px-3 py-3 text-left text-[12.5px] font-medium text-ink-600">Decision</th>
                    {offers.map((o) => (
                      <td key={String(o.id)} className="px-3 py-3">
                        <Button
                          size="xs"
                          variant={o.status === "Qualified" ? "primary" : "secondary"}
                          icon={<Award className="size-3.5" />}
                          onClick={() => award(o)}
                        >
                          {o.status === "Qualified" ? "Awarded" : "Award"}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <CardBody className="border-t border-ink-100 bg-ink-50/40 py-2.5">
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-500">
                <span className="flex items-center gap-1.5">
                  <Timer className="size-3.5 text-ink-400" aria-hidden />
                  Fastest delivery: <strong className="font-medium text-ink-800">{num(best.leadTimeDays ?? 0)} days</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="size-3.5 text-ink-400" aria-hidden />
                  Average unit price: <strong className="font-mono font-medium text-ink-800">{currency(avgPrice)}</strong>
                </span>
                <span>
                  Best technical score: <strong className="font-medium text-ink-800">{num(best.techScore ?? 0)}</strong>
                </span>
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
