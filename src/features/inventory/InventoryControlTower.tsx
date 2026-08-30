"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Boxes,
  CircleCheck,
  Microscope,
  PackageOpen,
  ScrollText,
  TriangleAlert,
  Warehouse,
} from "lucide-react";
import { PageHeader, KpiRow } from "@/components/workspace/PageHeader";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Progress } from "@/components/ui/Progress";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { AreaTrend, DonutSplit, GroupedBars, HBar, ParetoBars } from "@/components/charts/Charts";
import { groupSum, groupedSeries, paretoSeries, timeSeries } from "@/lib/data/aggregate";
import { getSpec } from "@/lib/data/datasets";
import { useStore } from "@/store/app-store";
import type { ScreenProps } from "@/features/common/ModuleScreen";
import { currency, num, pct } from "@/lib/utils/format";

const FLOW = [
  { key: "receiving", label: "Gate receiving", href: "/inventory/receiving-management/shipment-receiving", icon: PackageOpen },
  { key: "grn", label: "GRN posted", href: "/inventory/grn-management/grn-status", icon: ScrollText },
  { key: "iqc", label: "IQC inspected", href: "/inventory/iqc-incoming-quality-control/inspection-result", icon: Microscope },
  { key: "stock", label: "Stock lines", href: "/inventory/stock-management/stock-balance", icon: Boxes },
] as const;

export function InventoryControlTower({ loc }: ScreenProps) {
  const { rowsFor } = useStore();
  const [tab, setTab] = useState("receiving");

  const receiving = rowsFor("receiving");
  const grn = rowsFor("grn");
  const iqc = rowsFor("iqc");
  const stock = rowsFor("stock");
  const movement = rowsFor("movement");
  const warehouse = rowsFor("warehouse");
  const recon = rowsFor("inventoryRecon");

  const kpis = useMemo(() => {
    const stockValue = stock.reduce((s, r) => s + Number(r.value || 0), 0);
    const freeQty = stock.reduce((s, r) => s + Number(r.freeQty || 0), 0);
    const blocked = stock.reduce((s, r) => s + Number(r.holdQty || 0) + Number(r.quarantineQty || 0), 0);
    const lot = iqc.reduce((s, r) => s + Number(r.lotQty || 0), 0);
    const accepted = iqc.reduce((s, r) => s + Number(r.acceptedQty || 0), 0);
    const rejected = iqc.reduce((s, r) => s + Number(r.rejectedQty || 0), 0);
    const pendingGrn = grn.filter((g) => g.status === "Pending").length;
    const pendingIqc = iqc.filter((i) => i.status === "Pending").length;
    const pendingReceipt = receiving.filter((r) => r.status === "Pending").length;
    const cycle = receiving.length ? receiving.reduce((s, r) => s + Number(r.cycleHours || 0), 0) / receiving.length : 0;
    return {
      stockValue,
      freeQty,
      blocked,
      acceptance: lot ? (accepted / lot) * 100 : 0,
      rejected,
      pendingGrn,
      pendingIqc,
      pendingReceipt,
      cycle,
    };
  }, [stock, iqc, grn, receiving]);

  const counts: Record<string, number> = {
    receiving: receiving.length,
    grn: grn.length,
    iqc: iqc.length,
    stock: stock.length,
  };
  const maxCount = Math.max(...Object.values(counts));

  const receivedTrend = useMemo(() => timeSeries(grn, "grnDate", "value"), [grn]);
  const stockByWarehouse = useMemo(() => groupSum(stock, "warehouse", "value", 8), [stock]);
  const stockByCategory = useMemo(() => groupSum(stock, "category", "value", 6), [stock]);
  const defectPareto = useMemo(() => paretoSeries(iqc, "defect", "rejectedQty", 8), [iqc]);
  const disposition = useMemo(
    () =>
      groupedSeries(
        stock,
        "category",
        [
          { key: "freeQty", label: "Free" },
          { key: "holdQty", label: "Hold" },
          { key: "quarantineQty", label: "Quarantine" },
          { key: "rejectedQty", label: "Rejected" },
        ],
        6,
      ),
    [stock],
  );

  const registers = {
    receiving: { rows: receiving, key: "receiving" as const },
    grn: { rows: grn, key: "grn" as const },
    iqc: { rows: iqc, key: "iqc" as const },
    stock: { rows: stock, key: "stock" as const },
  };
  const active = registers[tab as keyof typeof registers];
  const activeSpec = getSpec(active.key);

  const matched = recon.filter((r) => r.status === "Matched").length;
  const matchRate = recon.length ? (matched / recon.length) * 100 : 0;

  return (
    <>
      <PageHeader
        loc={loc}
        actions={
          <>
            <Button
              size="sm"
              icon={<TriangleAlert className="size-3.5" />}
              onClick={() =>
                toast(`${stock.filter((s) => s.status === "Low").length} stock lines are below reorder level`, {
                  icon: "⚠️",
                  duration: 4000,
                })
              }
            >
              Reorder alerts
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Boxes className="size-4" />}
              onClick={() =>
                toast.promise(new Promise((r) => window.setTimeout(r, 900)), {
                  loading: "Valuing inventory at current rates…",
                  success: `Inventory valued at ${currency(kpis.stockValue, { compact: true })}`,
                  error: "Valuation failed",
                })
              }
            >
              Run valuation
            </Button>
          </>
        }
      />

      <KpiRow>
        <StatCard label="Stock Value" value={kpis.stockValue} unit="currency" hint="At current valuation rate" delta={-2.6} goodWhenUp={false} icon={<Warehouse className="size-4" />} />
        <StatCard label="Free Stock" value={kpis.freeQty} unit="num" hint="Available to issue" delta={3.9} goodWhenUp icon={<Boxes className="size-4" />} />
        <StatCard label="IQC Acceptance" value={kpis.acceptance} unit="percent" hint="Accepted ÷ presented quantity" delta={1.4} goodWhenUp icon={<CircleCheck className="size-4" />} />
        <StatCard label="Blocked Quantity" value={kpis.blocked} unit="num" hint="Held and quarantined stock" delta={5.2} goodWhenUp={false} icon={<TriangleAlert className="size-4" />} />
      </KpiRow>

      {/* Pending queues */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Pending receiving", value: kpis.pendingReceipt, href: "/inventory/inventory-control-tower/pending-receiving", tone: "Pending" },
          { label: "Pending GRN", value: kpis.pendingGrn, href: "/inventory/inventory-control-tower/pending-grn", tone: "Pending" },
          { label: "Pending IQC", value: kpis.pendingIqc, href: "/inventory/inventory-control-tower/pending-iqc", tone: "Pending" },
        ].map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className="group flex items-center justify-between gap-3 rounded-xl border border-ink-200/80 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop"
          >
            <div>
              <p className="text-[12px] uppercase tracking-[0.06em] text-ink-500">{q.label}</p>
              <p className="mt-1 font-mono text-[24px] font-semibold leading-none tabular-nums text-ink-900">{num(q.value)}</p>
              <StatusPill value={q.tone} className="mt-2" />
            </div>
            <ArrowRight className="size-4 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden />
          </Link>
        ))}
      </div>

      {/* Flow */}
      <SectionTitle hint="Document volume from gate to stock ledger">Inbound flow</SectionTitle>
      <Card className="mb-4">
        <CardBody className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {FLOW.map((stage, i) => {
            const value = counts[stage.key];
            const share = maxCount ? (value / maxCount) * 100 : 0;
            return (
              <Link
                key={stage.key}
                href={stage.href}
                className="group flex flex-col gap-2 rounded-xl border border-ink-200/80 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <stage.icon className="size-4" aria-hidden />
                  </span>
                  <span className="font-mono text-[10px] font-semibold text-ink-300">0{i + 1}</span>
                </div>
                <p className="text-[12px] font-medium text-ink-600">{stage.label}</p>
                <p className="font-mono text-[22px] font-semibold leading-none tabular-nums text-ink-900">{num(value)}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500" style={{ width: `${share}%` }} />
                </div>
              </Link>
            );
          })}
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartFrame
            title="Stock disposition by category"
            hint="Free, hold, quarantine and rejected quantity on one scale"
            height={270}
            unit="num"
            valueLabel="Total qty"
            tableRows={disposition.map((d) => ({
              name: String(d.name),
              value: ["Free", "Hold", "Quarantine", "Rejected"].reduce((s, k) => s + Number(d[k] ?? 0), 0),
            }))}
          >
            <GroupedBars data={disposition} keys={["Free", "Hold", "Quarantine", "Rejected"]} unit="num" />
          </ChartFrame>
        </div>
        <ChartFrame title="Stock value by category" height={270} unit="currency" tableRows={stockByCategory}>
          <DonutSplit data={stockByCategory} unit="currency" />
        </ChartFrame>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <ChartFrame title="GRN value posted per month" height={240} unit="currency" tableRows={receivedTrend}>
          <AreaTrend data={receivedTrend} unit="currency" />
        </ChartFrame>
        <ChartFrame
          title="Rejection by defect type"
          hint="Cumulative share is labelled on each bar"
          height={240}
          unit="num"
          valueLabel="Rejected qty"
          tableRows={defectPareto.map((d) => ({ name: d.name, value: d.value }))}
        >
          <ParetoBars data={defectPareto} unit="num" />
        </ChartFrame>
        <ChartFrame title="Stock value by warehouse" height={240} unit="currency" tableRows={stockByWarehouse}>
          <HBar data={stockByWarehouse} unit="currency" />
        </ChartFrame>
      </div>

      {/* Warehouse utilisation + reconciliation */}
      <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader title="Warehouse utilisation" hint="Capacity consumed per store, with the value it holds" icon={<Warehouse className="size-4" />} />
          <CardBody className="space-y-2.5">
            {warehouse.slice(0, 6).map((w) => (
              <div key={String(w.id)} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink-800">{String(w.name)}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {String(w.type)} · {String(w.bins)} bins · {currency(Number(w.stockValue), { compact: true })}
                  </p>
                </div>
                <div className="w-40 shrink-0">
                  <Progress value={Number(w.utilisedPct)} tone={Number(w.utilisedPct) > 88 ? "warn" : "brand"} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Three-way match" hint="PO against GRN against IQC" icon={<CircleCheck className="size-4" />} />
          <CardBody className="space-y-3">
            <div>
              <p className="font-mono text-[30px] font-semibold leading-none tabular-nums text-ink-900">{pct(matchRate)}</p>
              <p className="mt-1 text-[12px] text-ink-500">clean matches across {num(recon.length)} reconciled lines</p>
            </div>
            <ul className="space-y-1.5">
              {["Matched", "Partially Matched", "Variance", "Pending"].map((s) => {
                const n = recon.filter((r) => r.status === s).length;
                return (
                  <li key={s} className="flex items-center justify-between gap-2">
                    <StatusPill value={s} />
                    <span className="font-mono text-[12.5px] tabular-nums text-ink-700">{num(n)}</span>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/inventory/po-grn-iqc-reconciliation/po-grn-iqc-reconciliation"
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:underline"
            >
              Open the reconciliation <ArrowRight className="size-3.5" />
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Registers */}
      <SectionTitle hint="Switch between the registers behind each stage">Live registers</SectionTitle>
      <div className="mb-3">
        <Tabs value={tab} onChange={setTab} items={FLOW.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] }))} />
      </div>

      <DataTable
        columns={activeSpec.columns}
        rows={active.rows}
        searchFields={activeSpec.searchFields}
        statusField={activeSpec.statusField}
        statusOptions={activeSpec.statusOptions}
        exportName={`inventory-tower-${tab}`}
        pageSize={10}
        onView={(row) => toast(`${row[activeSpec.idField]} — ${activeSpec.entity}`, { icon: "🔎" })}
        onExported={(n) => toast.success(`${n} ${activeSpec.entityPlural.toLowerCase()} exported`)}
        toolbar={
          <Link
            href={FLOW.find((f) => f.key === tab)!.href}
            className="focus-brand inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-50 px-3 text-[13px] font-medium text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100"
          >
            Open module <ArrowRight className="size-3.5" />
          </Link>
        }
      />

      <p className="mt-3 text-[12px] text-ink-400">
        Gate-to-GRN cycle averages <strong className="font-mono text-ink-600">{kpis.cycle.toFixed(1)} hours</strong> across{" "}
        {num(receiving.length)} receipts · {num(movement.length)} stock movements posted.
      </p>
    </>
  );
}
