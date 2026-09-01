"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/ui/Badge";
import { DataGrid, NoteBar, ScreenTitle, SectionHeading, lakh, money } from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import { allocationValue, poValue, type CpsPo, type CpsPr } from "@/lib/cps/types";
import { dateShort } from "@/lib/utils/format";

interface TopItem {
  uic: string;
  description: string;
  qty: number;
  value: number;
}

export function CpsDashboard() {
  const { state, kpis, supplierByCode } = useCps();

  const recentPrs = useMemo(() => state.prs.slice(0, 6), [state.prs]);
  const recentPos = useMemo(() => state.pos.slice(0, 6), [state.pos]);

  const topItems = useMemo<TopItem[]>(() => {
    const map = new Map<string, TopItem>();
    for (const dc of state.consolidations) {
      if (dc.status !== "Confirmed") continue;
      for (const line of dc.lines) {
        const cur = map.get(line.uic) ?? { uic: line.uic, description: line.description, qty: 0, value: 0 };
        cur.qty += line.demandQty;
        cur.value += allocationValue(line);
        map.set(line.uic, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 6);
  }, [state.consolidations]);

  const tiles = [
    { label: "Pending PRs", value: kpis.pendingPrs, href: "/cps/purchase-requisition/approval" },
    { label: "Approved PRs", value: kpis.approvedPrs, href: "/cps/purchase-requisition" },
    { label: "Items Consolidated", value: kpis.itemsConsolidated, href: "/cps/demand-consolidation" },
    { label: "POs Released", value: kpis.posReleased, href: "/cps/purchase-order" },
  ];

  const managementKpis = [
    { label: "PR → PO Cycle Time", value: `${kpis.cycleDays} days` },
    { label: "Unprocessed Approved PR", value: money(kpis.unprocessedApproved) },
    { label: "Consolidated Demand Value", value: `BDT ${lakh(kpis.consolidatedValue)}` },
    { label: "Supplier Allocations", value: money(kpis.supplierAllocations) },
  ];

  const process = [
    { count: kpis.approvedPrs, label: "PR Approved" },
    { count: kpis.demandConsolidated, label: "Demand Consolidated" },
    { count: kpis.posReleased, label: "PO Released" },
  ];

  return (
    <>
      <ScreenTitle
        title="Central Procurement Dashboard"
        hint="Everything below is computed from the live prototype data — create a PR and the numbers move."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group rounded-xl border border-ink-200 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop"
          >
            <p className="flex items-center justify-between text-[12.5px] font-medium text-ink-500">
              {t.label}
              <ArrowRight className="size-3.5 text-ink-300 transition-colors group-hover:text-brand-600" aria-hidden />
            </p>
            <p className="mt-2 font-mono text-[30px] font-bold leading-none text-brand-700">{t.value}</p>
          </Link>
        ))}
      </div>

      <SectionHeading>Key Management KPIs</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-2">
        {managementKpis.map((k) => (
          <div
            key={k.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3.5 shadow-card"
          >
            <span className="text-[12.5px] font-medium text-ink-500">{k.label}</span>
            <span className="font-mono text-[17px] font-bold text-ink-900">{k.value}</span>
          </div>
        ))}
      </div>

      <SectionHeading>Process Status</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-3">
        {process.map((p) => (
          <div key={p.label} className="rounded-xl bg-brand-50 px-4 py-4 ring-1 ring-inset ring-brand-100">
            <p className="font-mono text-[24px] font-bold leading-none text-brand-800">{p.count}</p>
            <p className="mt-1.5 text-[12.5px] font-medium text-brand-800">{p.label}</p>
          </div>
        ))}
      </div>

      <SectionHeading>Top Consolidated Items by Value</SectionHeading>
      <DataGrid
        columns={[
          { key: "uic", label: "Item / UIC", mono: true, width: "150px" },
          { key: "description", label: "Description" },
          { key: "qty", label: "Consolidated Qty", align: "right", width: "160px", render: (r: TopItem) => money(r.qty) },
          {
            key: "value",
            label: "Allocation Value (BDT)",
            align: "right",
            width: "190px",
            render: (r: TopItem) => money(r.value),
          },
        ]}
        rows={topItems}
        rowKey={(r) => r.uic}
        empty="Confirm a consolidation to see the group position."
        dense
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionHeading>Latest Requisitions</SectionHeading>
          <DataGrid
            columns={[
              { key: "prNo", label: "PR No.", mono: true, width: "140px" },
              { key: "unitCode", label: "Unit", mono: true, width: "100px" },
              { key: "prDate", label: "Date", width: "110px", render: (p: CpsPr) => dateShort(p.prDate) },
              { key: "status", label: "Status", render: (p: CpsPr) => <StatusPill value={p.status} /> },
            ]}
            rows={recentPrs}
            rowKey={(p) => p.id}
            dense
            empty="No requisition yet."
          />
        </div>
        <div>
          <SectionHeading>Latest Purchase Orders</SectionHeading>
          <DataGrid
            columns={[
              { key: "poNo", label: "PO No.", mono: true, width: "140px" },
              {
                key: "supplier",
                label: "Supplier",
                render: (p: CpsPo) => supplierByCode(p.supplierCode)?.name ?? p.supplierCode,
              },
              { key: "value", label: "Value", align: "right", width: "120px", render: (p: CpsPo) => money(poValue(p)) },
              { key: "status", label: "Status", width: "130px", render: (p: CpsPo) => <StatusPill value={p.status} /> },
            ]}
            rows={recentPos}
            rowKey={(p) => p.id}
            dense
            empty="No purchase order yet."
          />
        </div>
      </div>

      <NoteBar tone="navy" className="mt-6">
        Phase 1: Unit PR → Approval → Central Consolidation → Supplier Allocation → Consolidated PO
      </NoteBar>
    </>
  );
}
