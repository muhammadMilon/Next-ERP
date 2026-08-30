"use client";

import { useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowRight,
  Boxes,
  CircleCheck,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Microscope,
  PackageOpen,
  Plus,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { Card, CardBody, CardHeader, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { StatusPill } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { AreaTrend, DonutSplit, GroupedBars, HBar, ParetoBars, StackedBars } from "@/components/charts/Charts";
import { groupSum, groupedSeries, paretoSeries, stackedSeries, timeSeries } from "@/lib/data/aggregate";
import { MODULES } from "@/lib/nav/registry";
import { COMPANY } from "@/lib/data/reference";
import { useStore } from "@/store/app-store";
import { currency, dateShort, num, relative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const QUICK_ACTIONS = [
  { label: "Create PR", href: "/purchase/purchase-requisition-pr/create-pr", icon: FileText },
  { label: "Raise RFQ", href: "/purchase/rfq-management/rfq-creation", icon: ClipboardList },
  { label: "Post GRN", href: "/inventory/grn-management/grn-creation", icon: PackageOpen },
  { label: "Log IQC", href: "/inventory/iqc-incoming-quality-control/iqc-inspection", icon: Microscope },
];

const MODULE_META: Record<string, { icon: typeof ShoppingCart; blurb: string; href: string }> = {
  purchase: {
    icon: ShoppingCart,
    blurb: "Requisition, RFQ, TCO evaluation, supplier award, purchase orders and payment control.",
    href: "/purchase/purchase-control-tower/purchase-dashboard",
  },
  inventory: {
    icon: Boxes,
    blurb: "Gate receiving, GRN posting, incoming quality, warehouse operations and the stock ledger.",
    href: "/inventory/inventory-control-tower/dashboard",
  },
};

export default function DashboardPage() {
  const { rowsFor, activity, user, notify } = useStore();

  const spend = rowsFor("spend");
  const po = rowsFor("po");
  const pr = rowsFor("pr");
  const approval = rowsFor("approval");
  const stock = rowsFor("stock");
  const iqc = rowsFor("iqc");
  const grn = rowsFor("grn");
  const supplier = rowsFor("supplier");
  const recon = rowsFor("inventoryRecon");

  const kpis = useMemo(() => {
    const totalSpend = spend.reduce((s, r) => s + Number(r.spend || 0), 0);
    const savings = spend.reduce((s, r) => s + Number(r.savings || 0), 0);
    const orderBook = po.reduce((s, r) => s + Number(r.value || 0), 0);
    const stockValue = stock.reduce((s, r) => s + Number(r.value || 0), 0);
    const pendingApprovals = approval.filter((r) => r.status === "Pending").length;
    const lot = iqc.reduce((s, r) => s + Number(r.lotQty || 0), 0);
    const accepted = iqc.reduce((s, r) => s + Number(r.acceptedQty || 0), 0);
    const acceptance = lot ? (accepted / lot) * 100 : 0;
    const cycle = spend.length ? spend.reduce((s, r) => s + Number(r.avgCycleDays || 0), 0) / spend.length : 0;
    return { totalSpend, savings, orderBook, stockValue, pendingApprovals, acceptance, cycle };
  }, [spend, po, stock, approval, iqc]);

  const spendVsBudget = useMemo(
    () => groupedSeries(spend, "month", [{ key: "spend", label: "Actual spend" }, { key: "budget", label: "Budget" }], 12),
    [spend],
  );
  const orderTrend = useMemo(() => timeSeries(po, "orderDate", "value"), [po]);
  const stockByCategory = useMemo(() => groupSum(stock, "category", "value", 6), [stock]);
  const defectPareto = useMemo(() => paretoSeries(iqc, "defect", "rejectedQty", 8), [iqc]);
  const approvalLoad = useMemo(() => stackedSeries(approval, "stage", "status", undefined, 4), [approval]);
  const topSuppliers = useMemo(() => groupSum(supplier, "name", "spendYtd", 8), [supplier]);

  const exceptions = useMemo(() => {
    const rows = [
      ...pr
        .filter((r) => r.status === "Pending")
        .slice(0, 4)
        .map((r) => ({
          id: `x-pr-${r.id}`,
          ref: r.prNo,
          area: "Purchase Requisition",
          issue: "Awaiting approval",
          owner: r.requester,
          value: r.estValue,
          status: "Pending",
        })),
      ...po
        .filter((r) => r.ackStatus === "Pending" && r.status === "Released")
        .slice(0, 4)
        .map((r) => ({
          id: `x-po-${r.id}`,
          ref: r.poNo,
          area: "Purchase Order",
          issue: "No supplier acknowledgement",
          owner: r.supplier,
          value: r.value,
          status: "On Hold",
        })),
      ...iqc
        .filter((r) => r.decision === "Rejected")
        .slice(0, 4)
        .map((r) => ({
          id: `x-iqc-${r.id}`,
          ref: r.iqcNo,
          area: "Incoming Quality",
          issue: `Lot rejected — ${r.defect}`,
          owner: r.supplier,
          value: r.rejectedQty,
          status: "Rejected",
        })),
      ...recon
        .filter((r) => r.status === "Variance")
        .slice(0, 4)
        .map((r) => ({
          id: `x-rc-${r.id}`,
          ref: r.reconNo,
          area: "Reconciliation",
          issue: "Quantity variance beyond tolerance",
          owner: r.supplier,
          value: r.value,
          status: "Variance",
        })),
    ];
    return rows;
  }, [pr, po, iqc, recon]);

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative mb-4 overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand-200/30 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-brand-600">
              <Sparkles className="size-3.5" aria-hidden />
              Command Center
            </p>
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink-900">
              {greeting}, {user?.name?.split(" ")[0] ?? "Sayem"}
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-600">
              {dateShort(today.toISOString())} · {COMPANY.product} at {COMPANY.name} ·{" "}
              <span className="font-medium text-brand-700">{kpis.pendingApprovals} approvals</span> need your attention
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="focus-brand inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 text-[12.5px] font-medium text-ink-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700"
              >
                <a.icon className="size-3.5 text-brand-500" aria-hidden />
                {a.label}
              </Link>
            ))}
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={() => {
                notify({
                  title: "Daily briefing generated",
                  body: `Spend at ${currency(kpis.totalSpend, { compact: true })}, ${kpis.pendingApprovals} approvals open and acceptance at ${kpis.acceptance.toFixed(1)}%.`,
                  tone: "info",
                  href: "/dashboard",
                });
                toast.success("Daily briefing added to your notifications");
              }}
            >
              Daily briefing
            </Button>
          </div>
        </div>
      </section>

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Spend" value={kpis.totalSpend} unit="currency" hint="Actual procurement spend" delta={4.8} goodWhenUp={false} icon={<CircleDollarSign className="size-4" />} spark={[3, 5, 4, 7, 6, 9, 8]} />
        <StatCard label="Savings Delivered" value={kpis.savings} unit="currency" hint="Against approved budget" delta={11.2} goodWhenUp icon={<TrendingUp className="size-4" />} spark={[2, 3, 3, 5, 6, 6, 8]} />
        <StatCard label="Order Book" value={kpis.orderBook} unit="currency" hint="Value on open purchase orders" delta={2.1} goodWhenUp icon={<ClipboardList className="size-4" />} spark={[6, 5, 7, 6, 8, 7, 9]} />
        <StatCard label="Stock Value" value={kpis.stockValue} unit="currency" hint="Inventory at valuation rate" delta={-3.4} goodWhenUp={false} icon={<Warehouse className="size-4" />} spark={[9, 8, 8, 7, 6, 6, 5]} />
        <StatCard label="Pending Approvals" value={kpis.pendingApprovals} unit="num" hint="Blocked in the DOA chain" delta={-6.5} goodWhenUp={false} icon={<ShieldAlert className="size-4" />} spark={[8, 7, 7, 6, 5, 5, 4]} />
        <StatCard label="IQC Acceptance" value={kpis.acceptance} unit="percent" hint="Accepted ÷ presented quantity" delta={1.7} goodWhenUp icon={<CircleCheck className="size-4" />} spark={[6, 6, 7, 7, 8, 8, 9]} />
      </div>

      {/* ── Primary charts ───────────────────────────────────────────────── */}
      <SectionTitle hint="Live from the registers — every record you add is reflected here">Performance</SectionTitle>
      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartFrame
            title="Spend against budget by month"
            hint="Actual procurement spend versus approved budget, all business units"
            icon={<CircleDollarSign className="size-4" />}
            height={280}
            unit="currency"
            valueLabel="Total"
            tableRows={spendVsBudget.map((d) => ({ name: String(d.name), value: Number(d["Actual spend"] ?? 0) }))}
          >
            <GroupedBars data={spendVsBudget} keys={["Actual spend", "Budget"]} unit="currency" />
          </ChartFrame>
        </div>
        <ChartFrame
          title="Stock value by category"
          hint="Where inventory value is concentrated"
          icon={<Boxes className="size-4" />}
          height={280}
          unit="currency"
          tableRows={stockByCategory}
        >
          <DonutSplit data={stockByCategory} unit="currency" />
        </ChartFrame>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-2">
        <ChartFrame
          title="Order value released per month"
          hint="Purchase orders released to suppliers"
          icon={<ClipboardList className="size-4" />}
          height={250}
          unit="currency"
          tableRows={orderTrend}
        >
          <AreaTrend data={orderTrend} unit="currency" />
        </ChartFrame>
        <ChartFrame
          title="Rejection by defect type"
          hint="The few defects driving most rejected quantity — cumulative share labelled on each bar"
          icon={<Microscope className="size-4" />}
          height={250}
          unit="num"
          valueLabel="Rejected qty"
          tableRows={defectPareto.map((d) => ({ name: d.name, value: d.value }))}
        >
          <ParetoBars data={defectPareto} unit="num" />
        </ChartFrame>
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-2">
        <ChartFrame
          title="Approval load by stage"
          hint="Task count at each DOA stage, split by outcome"
          icon={<ShieldAlert className="size-4" />}
          height={250}
          unit="num"
          valueLabel="Tasks"
          tableRows={approvalLoad.data.map((d) => ({
            name: String(d.name),
            value: approvalLoad.keys.reduce((s, k) => s + Number(d[k] ?? 0), 0),
          }))}
        >
          <StackedBars data={approvalLoad.data} keys={approvalLoad.keys} unit="num" />
        </ChartFrame>
        <ChartFrame
          title="Spend by supplier"
          hint="Year-to-date spend across the active panel"
          icon={<ShoppingCart className="size-4" />}
          height={250}
          unit="currency"
          tableRows={topSuppliers}
        >
          <HBar data={topSuppliers} unit="currency" />
        </ChartFrame>
      </div>

      {/* ── Modules ──────────────────────────────────────────────────────── */}
      <SectionTitle hint="Two modules · 21 sub-modules">Modules</SectionTitle>
      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        {MODULES.map((m) => {
          const meta = MODULE_META[m.slug];
          const screens = m.groups.reduce((s, g) => s + g.leaves.length, 0);
          return (
            <Card key={m.slug} className="overflow-hidden">
              <div className="flex items-start gap-3.5 border-b border-ink-100 bg-gradient-to-r from-brand-50/60 to-transparent p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 text-white shadow-sm">
                  <meta.icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-brand-400">{m.code}</span>
                    <span className="text-[15px] font-semibold tracking-tight text-ink-900">{m.label}</span>
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">{meta.blurb}</p>
                </div>
                <Link
                  href={meta.href}
                  className="focus-brand inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 text-[12.5px] font-medium text-brand-700 ring-1 ring-brand-200 transition-colors hover:bg-brand-50"
                >
                  Open <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <CardBody className="p-3">
                <div className="mb-2 flex items-center gap-3 px-1 text-[11.5px] text-ink-500">
                  <span>
                    <strong className="font-mono font-semibold text-ink-800">{m.groups.length}</strong> sub-modules
                  </span>
                  <span className="text-ink-300">·</span>
                  <span>
                    <strong className="font-mono font-semibold text-ink-800">{screens}</strong> screens
                  </span>
                </div>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {m.groups.map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/${m.slug}/${g.slug}/${g.leaves[0].slug}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        <span className="font-mono text-[10px] text-brand-400">{g.code}</span>
                        <span className="min-w-0 flex-1 truncate">{g.label}</span>
                        <span className="shrink-0 rounded bg-ink-100 px-1 font-mono text-[9.5px] text-ink-400">
                          {g.leaves.length}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* ── Exceptions + activity ────────────────────────────────────────── */}
      <SectionTitle hint="What needs a decision today">Attention required</SectionTitle>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <DataTable
          title="Exception queue"
          columns={[
            { key: "ref", label: "Reference", type: "mono", width: "132px" },
            { key: "area", label: "Area", type: "chip" },
            { key: "issue", label: "Issue" },
            { key: "owner", label: "Owner", secondary: true },
            { key: "value", label: "Value", type: "num", align: "right" },
            { key: "status", label: "Status", type: "status" },
          ]}
          rows={exceptions}
          searchFields={["ref", "area", "issue", "owner"]}
          statusField="status"
          statusOptions={["Pending", "On Hold", "Rejected", "Variance"]}
          exportName="exception-queue"
          pageSize={8}
          onView={(row) => toast(`${row.ref} — ${row.issue}`, { icon: "🔎" })}
          onExported={(n) => toast.success(`${n} exceptions exported`)}
        />

        <Card className="flex flex-col">
          <CardHeader
            title="Activity"
            hint="Everything you have posted in this session"
            icon={<Activity className="size-4" />}
          />
          <CardBody className="flex-1 p-0">
            {activity.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] font-medium text-ink-700">No activity yet</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                  Create, approve or export a record and it will be logged here.
                </p>
              </div>
            ) : (
              <ul className="max-h-[420px] overflow-y-auto">
                {activity.map((a) => (
                  <li key={a.id} className="flex gap-2.5 border-b border-ink-100 px-4 py-2.5 last:border-0">
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        a.action === "created"
                          ? "bg-emerald-500"
                          : a.action === "deleted" || a.action === "rejected"
                            ? "bg-red-500"
                            : a.action === "approved"
                              ? "bg-sky-500"
                              : "bg-amber-500",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] text-ink-800">
                        <span className="font-medium capitalize">{a.action}</span>{" "}
                        <span className="text-ink-500">{a.entity}</span>{" "}
                        <span className="font-mono text-[11.5px] text-ink-900">{a.ref}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {a.by} · {relative(a.at)}
                      </p>
                    </div>
                    {a.href && (
                      <Link href={a.href} className="shrink-0 self-center text-ink-300 transition-colors hover:text-brand-500">
                        <ArrowRight className="size-3.5" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Footnote strip ───────────────────────────────────────────────── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Suppliers on panel", value: supplier.filter((s) => s.status === "Approved").length, sub: `${supplier.length} enlisted in total` },
          { label: "GRNs posted", value: grn.filter((g) => g.status === "Posted").length, sub: `${num(grn.length)} receipts recorded` },
          { label: "Lots inspected", value: iqc.length, sub: `${iqc.filter((i) => i.decision === "Hold").length} currently on hold` },
          { label: "Avg. PR→PO cycle", value: Math.round(kpis.cycle), sub: "days, across all units" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ink-200/80 bg-white p-3.5 shadow-card">
            <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-500">{s.label}</p>
            <p className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-ink-900">{num(s.value)}</p>
            <p className="mt-0.5 text-[11.5px] text-ink-400">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 bg-white px-4 py-3">
        <p className="text-[12.5px] text-ink-500">
          Reconciliation health:{" "}
          <StatusPill value={recon.filter((r) => r.status === "Matched").length > recon.length / 2 ? "Matched" : "Variance"} />
        </p>
        <Link
          href="/inventory/po-grn-iqc-reconciliation/po-grn-iqc-reconciliation"
          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:underline"
        >
          Open the three-way match <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </>
  );
}
