"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, CircleDollarSign, Clock, FileText, Send, ShieldAlert, TrendingUp } from "lucide-react";
import { PageHeader, KpiRow } from "@/components/workspace/PageHeader";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { AreaTrend, DonutSplit, GroupedBars, HBar, StackedBars } from "@/components/charts/Charts";
import { groupSum, groupedSeries, stackedSeries, timeSeries } from "@/lib/data/aggregate";
import { getSpec } from "@/lib/data/datasets";
import type { DatasetKey } from "@/lib/nav/types";
import { useStore } from "@/store/app-store";
import type { ScreenProps } from "@/features/common/ModuleScreen";
import { currency, num, pct } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const STAGES = [
  { key: "pr", label: "Requisitions", href: "/purchase/purchase-requisition-pr/pr-status", icon: FileText },
  { key: "rfq", label: "RFQs issued", href: "/purchase/rfq-management/rfq-tracking", icon: Send },
  { key: "quotation", label: "Quotations", href: "/purchase/supplier-quotation/supplier-quotation", icon: FileText },
  { key: "tco", label: "TCO evaluated", href: "/purchase/tco-evaluation/tco-calculation", icon: TrendingUp },
  { key: "po", label: "Orders released", href: "/purchase/purchase-order-po/po-tracking", icon: CircleDollarSign },
] as const;

export function PurchaseControlTower({ loc }: ScreenProps) {
  const { rowsFor } = useStore();
  const [tab, setTab] = useState("pr");

  const pr = rowsFor("pr");
  const rfq = rowsFor("rfq");
  const quotation = rowsFor("quotation");
  const tco = rowsFor("tco");
  const po = rowsFor("po");
  const approval = rowsFor("approval");
  const spend = rowsFor("spend");

  const counts: Record<string, number> = {
    pr: pr.length,
    rfq: rfq.length,
    quotation: quotation.length,
    tco: tco.length,
    po: po.length,
  };
  const maxCount = Math.max(...Object.values(counts));

  // These derivations are left to the React Compiler rather than hand-memoised.
  const totalSpend = spend.reduce((s, r) => s + Number(r.spend || 0), 0);
  const budget = spend.reduce((s, r) => s + Number(r.budget || 0), 0);
  const kpis = {
    totalSpend,
    budget,
    savings: spend.reduce((s, r) => s + Number(r.savings || 0), 0),
    pendingValue: approval.filter((a) => a.status === "Pending").reduce((s, r) => s + Number(r.value || 0), 0),
    cycle: spend.length ? spend.reduce((s, r) => s + Number(r.avgCycleDays || 0), 0) / spend.length : 0,
    utilisation: budget ? (totalSpend / budget) * 100 : 0,
  };

  const spendVsBudget = groupedSeries(
    spend,
    "month",
    [{ key: "spend", label: "Actual spend" }, { key: "budget", label: "Budget" }],
    12,
  );
  const orderTrend = timeSeries(po, "orderDate", "value");
  const categorySpend = groupSum(spend, "category", "spend", 6);
  const approvalLoad = stackedSeries(approval, "stage", "status", undefined, 4);
  const unitSpend = groupSum(spend, "unit", "spend", 6);

  const activeRows =
    tab === "pr" ? pr : tab === "rfq" ? rfq : tab === "quotation" ? quotation : tab === "tco" ? tco : po;
  const activeSpec = getSpec(tab as DatasetKey);

  return (
    <>
      <PageHeader
        loc={loc}
        actions={
          <>
            <Button
              size="sm"
              icon={<Clock className="size-3.5" />}
              onClick={() => toast.success(`Average PR-to-PO cycle is ${kpis.cycle.toFixed(1)} days`)}
            >
              Cycle time
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<TrendingUp className="size-4" />}
              onClick={() =>
                toast.promise(new Promise((r) => window.setTimeout(r, 900)), {
                  loading: "Compiling the procurement review pack…",
                  success: "Procurement review pack is ready",
                  error: "Could not build the pack",
                })
              }
            >
              Review pack
            </Button>
          </>
        }
      />

      <KpiRow>
        <StatCard label="Total Spend" value={kpis.totalSpend} unit="currency" hint="Actual spend across all units" delta={4.2} goodWhenUp={false} icon={<CircleDollarSign className="size-4" />} />
        <StatCard label="Budget Utilisation" value={kpis.utilisation} unit="percent" hint="Spend against approved budget" delta={-1.8} goodWhenUp={false} icon={<TrendingUp className="size-4" />} />
        <StatCard label="Value in Approval" value={kpis.pendingValue} unit="currency" hint="Documents parked in the DOA chain" delta={7.3} goodWhenUp={false} icon={<ShieldAlert className="size-4" />} />
        <StatCard label="Savings Delivered" value={kpis.savings} unit="currency" hint="Negotiated against budget" delta={9.6} goodWhenUp icon={<TrendingUp className="size-4" />} />
      </KpiRow>

      {/* Pipeline */}
      <SectionTitle hint="Document volume at each stage of the source-to-order chain">Procurement pipeline</SectionTitle>
      <Card className="mb-4">
        <CardBody className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((stage, i) => {
            const value = counts[stage.key];
            const share = maxCount ? (value / maxCount) * 100 : 0;
            const prev = i > 0 ? counts[STAGES[i - 1].key] : value;
            const conversion = prev ? (value / prev) * 100 : 100;
            return (
              <Link
                key={stage.key}
                href={stage.href}
                className="group relative flex flex-col gap-2 rounded-xl border border-ink-200/80 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
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
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
                    style={{ width: `${share}%` }}
                  />
                </div>
                <p className="text-[11px] text-ink-400">
                  {i === 0 ? "Entry point" : `${pct(conversion, 0)} of previous stage`}
                </p>
                <ArrowRight className="absolute right-3 top-3 size-3.5 text-brand-400 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </Link>
            );
          })}
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartFrame
            title="Spend against budget by month"
            hint="Actual procurement spend versus approved budget"
            height={270}
            unit="currency"
            valueLabel="Actual spend"
            tableRows={spendVsBudget.map((d) => ({ name: String(d.name), value: Number(d["Actual spend"] ?? 0) }))}
          >
            <GroupedBars data={spendVsBudget} keys={["Actual spend", "Budget"]} unit="currency" />
          </ChartFrame>
        </div>
        <ChartFrame title="Spend by category" hint="Where the money goes" height={270} unit="currency" tableRows={categorySpend}>
          <DonutSplit data={categorySpend} unit="currency" />
        </ChartFrame>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <ChartFrame title="Order value released per month" height={240} unit="currency" tableRows={orderTrend}>
          <AreaTrend data={orderTrend} unit="currency" />
        </ChartFrame>
        <ChartFrame
          title="Approval load by stage"
          hint="Task count per stage, split by outcome"
          height={240}
          unit="num"
          valueLabel="Tasks"
          tableRows={approvalLoad.data.map((d) => ({
            name: String(d.name),
            value: approvalLoad.keys.reduce((s, k) => s + Number(d[k] ?? 0), 0),
          }))}
        >
          <StackedBars data={approvalLoad.data} keys={approvalLoad.keys} unit="num" />
        </ChartFrame>
        <ChartFrame title="Spend by business unit" height={240} unit="currency" tableRows={unitSpend}>
          <HBar data={unitSpend} unit="currency" />
        </ChartFrame>
      </div>

      {/* Registers */}
      <SectionTitle hint="Switch between the registers behind each pipeline stage">Live registers</SectionTitle>
      <div className="mb-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={STAGES.map((s) => ({ key: s.key, label: s.label, count: counts[s.key] }))}
        />
      </div>

      <DataTable
        columns={activeSpec.columns}
        rows={activeRows}
        searchFields={activeSpec.searchFields}
        statusField={activeSpec.statusField}
        statusOptions={activeSpec.statusOptions}
        exportName={`control-tower-${tab}`}
        pageSize={10}
        onView={(row) => toast(`${row[activeSpec.idField]} — ${activeSpec.entity}`, { icon: "🔎" })}
        onExported={(n) => toast.success(`${n} ${activeSpec.entityPlural.toLowerCase()} exported`)}
        toolbar={
          <Link
            href={STAGES.find((s) => s.key === tab)!.href}
            className={cn(
              "focus-brand inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-50 px-3 text-[13px] font-medium text-brand-700 ring-1 ring-inset ring-brand-200 transition-colors hover:bg-brand-100",
            )}
          >
            Open module <ArrowRight className="size-3.5" />
          </Link>
        }
      />

      <Card className="mt-4">
        <CardHeader title="Budget position" hint="Approved budget against actual spend, group-wide" />
        <CardBody>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11.5px] uppercase tracking-wide text-ink-500">Actual spend</p>
              <p className="font-mono text-[26px] font-semibold tabular-nums text-ink-900">{currency(kpis.totalSpend)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11.5px] uppercase tracking-wide text-ink-500">Approved budget</p>
              <p className="font-mono text-[26px] font-semibold tabular-nums text-ink-500">{currency(kpis.budget)}</p>
            </div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-ink-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                kpis.utilisation > 100 ? "bg-red-500" : "bg-gradient-to-r from-brand-400 to-brand-500",
              )}
              style={{ width: `${Math.min(100, kpis.utilisation)}%` }}
            />
          </div>
          <p className="mt-2 text-[12.5px] text-ink-500">
            {pct(kpis.utilisation)} of budget consumed ·{" "}
            <span className="font-medium text-emerald-700">{currency(kpis.savings)} saved</span> against plan
          </p>
        </CardBody>
      </Card>
    </>
  );
}
