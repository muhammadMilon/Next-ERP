"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BanknoteArrowDown, CircleCheck, GitCompareArrows, Lock, TriangleAlert } from "lucide-react";
import { PageHeader, KpiRow } from "@/components/workspace/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { DonutSplit, GroupedBars, ParetoBars } from "@/components/charts/Charts";
import { groupCount, groupedSeries, paretoSeries } from "@/lib/data/aggregate";
import { getSpec } from "@/lib/data/datasets";
import { useStore } from "@/store/app-store";
import type { ScreenProps } from "@/features/common/ModuleScreen";
import type { Row } from "@/lib/data/types";
import { currency, num, pct } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "all", label: "All lines", filter: () => true },
  { key: "Matched", label: "Matched", filter: (r: Row) => r.status === "Matched" },
  { key: "Partially Matched", label: "Partial", filter: (r: Row) => r.status === "Partially Matched" },
  { key: "Variance", label: "Variance", filter: (r: Row) => r.status === "Variance" },
  { key: "Pending", label: "Pending", filter: (r: Row) => r.status === "Pending" },
] as const;

export function ThreeWayMatch({ loc }: ScreenProps) {
  const { rowsFor, updateRow, logActivity } = useStore();
  const spec = getSpec("inventoryRecon");
  const rows = rowsFor("inventoryRecon");
  const [tab, setTab] = useState<string>("all");

  const filtered = useMemo(() => {
    const t = TABS.find((x) => x.key === tab) ?? TABS[0];
    return rows.filter(t.filter);
  }, [rows, tab]);

  const totals = useMemo(() => {
    const ordered = rows.reduce((s, r) => s + Number(r.orderedQty || 0), 0);
    const received = rows.reduce((s, r) => s + Number(r.receivedQty || 0), 0);
    const accepted = rows.reduce((s, r) => s + Number(r.acceptedQty || 0), 0);
    const rejected = rows.reduce((s, r) => s + Number(r.rejectedQty || 0), 0);
    const held = rows.filter((r) => r.paymentHold === "Held");
    const matched = rows.filter((r) => r.status === "Matched").length;
    return {
      ordered,
      received,
      accepted,
      rejected,
      heldCount: held.length,
      heldValue: held.reduce((s, r) => s + Number(r.value || 0), 0),
      matchRate: rows.length ? (matched / rows.length) * 100 : 0,
      leakage: ordered ? ((ordered - accepted) / ordered) * 100 : 0,
    };
  }, [rows]);

  const flow = [
    { label: "Ordered", value: totals.ordered, source: "Purchase Order" },
    { label: "Received", value: totals.received, source: "Goods Receipt Note" },
    { label: "Accepted", value: totals.accepted, source: "Incoming Quality Control" },
  ];

  const bySupplier = useMemo(
    () =>
      groupedSeries(
        rows,
        "supplier",
        [
          { key: "orderedQty", label: "Ordered" },
          { key: "receivedQty", label: "Received" },
          { key: "acceptedQty", label: "Accepted" },
        ],
        7,
      ),
    [rows],
  );
  const statusSplit = useMemo(() => groupCount(rows, "status", 5), [rows]);
  const leakByItem = useMemo(() => paretoSeries(rows, "itemCode", "rejectedQty", 8), [rows]);

  const releasePayment = (row: Row) => {
    updateRow("inventoryRecon", { ...row, paymentHold: "Released", status: "Matched" });
    logActivity({ action: "approved", entity: "Reconciliation", ref: String(row.reconNo), href: loc.href });
    toast.success(`Payment released on ${row.reconNo}`, { icon: "💵" });
  };

  const holdPayment = (row: Row) => {
    updateRow("inventoryRecon", { ...row, paymentHold: "Held" });
    logActivity({ action: "held", entity: "Reconciliation", ref: String(row.reconNo), href: loc.href });
    toast(`Payment held on ${row.reconNo}`, { icon: "🔒" });
  };

  return (
    <>
      <PageHeader
        loc={loc}
        actions={
          <>
            <Button
              size="sm"
              icon={<Lock className="size-3.5" />}
              onClick={() => toast(`${totals.heldCount} lines are blocking ${currency(totals.heldValue, { compact: true })} of payment`, { icon: "🔒", duration: 4200 })}
            >
              Payment holds
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<GitCompareArrows className="size-4" />}
              onClick={() =>
                toast.promise(new Promise((r) => window.setTimeout(r, 1000)), {
                  loading: "Running the three-way match…",
                  success: `Match complete — ${pct(totals.matchRate)} clean`,
                  error: "Reconciliation run failed",
                })
              }
            >
              Run match
            </Button>
          </>
        }
      />

      <KpiRow>
        <StatCard label="Clean Match Rate" value={totals.matchRate} unit="percent" hint="Lines matching on all three documents" delta={2.8} goodWhenUp icon={<CircleCheck className="size-4" />} />
        <StatCard label="Quantity Leakage" value={totals.leakage} unit="percent" hint="Ordered quantity never accepted" delta={1.1} goodWhenUp={false} icon={<TriangleAlert className="size-4" />} />
        <StatCard label="Rejected Quantity" value={totals.rejected} unit="num" hint="Failed at incoming quality" delta={4.3} goodWhenUp={false} icon={<TriangleAlert className="size-4" />} />
        <StatCard label="Payment Held" value={totals.heldValue} unit="currency" hint={`${totals.heldCount} lines blocked from payment`} delta={-3.5} goodWhenUp={false} icon={<BanknoteArrowDown className="size-4" />} />
      </KpiRow>

      {/* Quantity flow */}
      <Card className="mb-4">
        <CardHeader
          title="Quantity flow across the chain"
          hint="Every unit ordered, tracked through receiving and incoming quality"
          icon={<GitCompareArrows className="size-4" />}
        />
        <CardBody className="grid gap-3 sm:grid-cols-3">
          {flow.map((f, i) => {
            const share = totals.ordered ? (f.value / totals.ordered) * 100 : 0;
            const loss = i === 0 ? 0 : flow[i - 1].value - f.value;
            return (
              <div key={f.label} className="rounded-xl border border-ink-200/80 bg-white p-3.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-500">{f.label}</p>
                  <span className="font-mono text-[11px] text-ink-400">{pct(share, 1)}</span>
                </div>
                <p className="mt-1.5 font-mono text-[24px] font-semibold leading-none tabular-nums text-ink-900">{num(f.value)}</p>
                <p className="mt-1 text-[11.5px] text-ink-400">from {f.source}</p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", i === 2 ? "bg-emerald-500" : "bg-gradient-to-r from-brand-400 to-brand-500")}
                    style={{ width: `${share}%` }}
                  />
                </div>
                {loss > 0 && (
                  <p className="mt-2 text-[11.5px] font-medium text-red-600">−{num(loss)} lost at this step</p>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>

      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartFrame
            title="Ordered, received and accepted by supplier"
            hint="Three measures on one scale — the gap is the leakage"
            height={260}
            unit="num"
            valueLabel="Total qty"
            tableRows={bySupplier.map((d) => ({ name: String(d.name), value: Number(d.Ordered ?? 0) }))}
          >
            <GroupedBars data={bySupplier} keys={["Ordered", "Received", "Accepted"]} unit="num" />
          </ChartFrame>
        </div>
        <ChartFrame title="Reconciliation status" height={260} unit="num" valueLabel="Lines" tableRows={statusSplit}>
          <DonutSplit data={statusSplit} unit="num" />
        </ChartFrame>
      </div>

      <div className="mb-4">
        <ChartFrame
          title="Rejected quantity by item"
          hint="Where quantity is lost — cumulative share labelled on each bar"
          height={240}
          unit="num"
          valueLabel="Rejected qty"
          tableRows={leakByItem.map((d) => ({ name: d.name, value: d.value }))}
        >
          <ParetoBars data={leakByItem} unit="num" />
        </ChartFrame>
      </div>

      <div className="mb-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={TABS.map((t) => ({ key: t.key, label: t.label, count: rows.filter(t.filter).length }))}
        />
      </div>

      <DataTable
        title="Reconciliation register"
        columns={spec.columns}
        rows={filtered}
        searchFields={spec.searchFields}
        statusField="paymentHold"
        statusOptions={["Released", "Held"]}
        exportName="three-way-match"
        pageSize={12}
        onView={(row) => toast(`${row.reconNo}: ordered ${num(Number(row.orderedQty))}, accepted ${num(Number(row.acceptedQty))}`, { icon: "🔎", duration: 4000 })}
        onExported={(n) => toast.success(`${n} reconciliation lines exported`)}
        inlineActions={(row) => (
          <span className="flex items-center gap-1">
            <button
              onClick={() => releasePayment(row)}
              title="Release payment"
              aria-label={`Release payment on ${row.reconNo}`}
              className="focus-brand grid size-7 place-items-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              <CircleCheck className="size-4" />
            </button>
            <button
              onClick={() => holdPayment(row)}
              title="Hold payment"
              aria-label={`Hold payment on ${row.reconNo}`}
              className="focus-brand grid size-7 place-items-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50"
            >
              <Lock className="size-3.5" />
            </button>
          </span>
        )}
        toolbar={
          <Button
            size="sm"
            icon={<CircleCheck className="size-3.5" />}
            onClick={() => {
              const clean = filtered.filter((r) => r.status === "Matched" && r.paymentHold === "Held");
              if (!clean.length) {
                toast("No clean matches are being held", { icon: "👌" });
                return;
              }
              toast.promise(
                new Promise<number>((resolve) =>
                  window.setTimeout(() => {
                    clean.forEach((r) => updateRow("inventoryRecon", { ...r, paymentHold: "Released" }));
                    resolve(clean.length);
                  }, 800),
                ),
                {
                  loading: "Releasing payment on clean matches…",
                  success: (n) => `Payment released on ${n} lines`,
                  error: "Release failed",
                },
              );
            }}
          >
            <span className="hidden sm:inline">Release clean matches</span>
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 text-[12.5px] text-ink-500">
        <StatusPill value={totals.matchRate > 60 ? "Matched" : "Variance"} />
        <span>
          {num(rows.length)} lines reconciled · {num(totals.heldCount)} held ·{" "}
          <strong className="font-medium text-ink-800">{currency(totals.heldValue)}</strong> blocked from payment
        </span>
      </div>
    </>
  );
}
