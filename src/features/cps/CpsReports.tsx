"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { DataGrid, NoteBar, ScreenTitle, SectionHeading, money } from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import { allocatedQty, allocationValue, poValue, prQty } from "@/lib/cps/types";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { dateShort } from "@/lib/utils/format";

type TabKey = "unit" | "item" | "supplier" | "trace";

interface UnitRow {
  code: string;
  name: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  qty: number;
  consolidated: number;
}

interface ItemRow {
  uic: string;
  description: string;
  approved: number;
  consolidated: number;
  ordered: number;
  value: number;
}

interface SupplierRow {
  code: string;
  name: string;
  type: string;
  allocations: number;
  allocatedValue: number;
  orders: number;
  released: number;
  orderValue: number;
}

interface TraceRow {
  poNo: string;
  status: string;
  supplier: string;
  dcNo: string;
  period: string;
  prs: number;
  units: number;
  value: number;
  poDate: string;
}

export function CpsReports() {
  const { state, supplierByCode } = useCps();
  const [tab, setTab] = useState<TabKey>("unit");

  const unitRows = useMemo<UnitRow[]>(
    () =>
      state.units.map((u) => {
        const prs = state.prs.filter((p) => p.unitCode === u.code);
        return {
          code: u.code,
          name: u.name,
          total: prs.length,
          pending: prs.filter((p) => p.status === "Pending Approval").length,
          approved: prs.filter((p) => p.status === "Approved").length,
          rejected: prs.filter((p) => p.status === "Rejected").length,
          qty: prs.reduce((s, p) => s + prQty(p), 0),
          consolidated: prs.filter((p) => p.consolidatedIn).length,
        };
      }),
    [state.units, state.prs],
  );

  const itemRows = useMemo<ItemRow[]>(() => {
    const map = new Map<string, ItemRow>();
    for (const pr of state.prs) {
      if (pr.status !== "Approved") continue;
      for (const line of pr.lines) {
        const cur = map.get(line.uic) ?? {
          uic: line.uic,
          description: line.description,
          approved: 0,
          consolidated: 0,
          ordered: 0,
          value: 0,
        };
        cur.approved += line.qty;
        map.set(line.uic, cur);
      }
    }
    for (const dc of state.consolidations) {
      if (dc.status !== "Confirmed") continue;
      for (const line of dc.lines) {
        const cur = map.get(line.uic) ?? {
          uic: line.uic,
          description: line.description,
          approved: 0,
          consolidated: 0,
          ordered: 0,
          value: 0,
        };
        cur.consolidated += line.demandQty;
        cur.value += allocationValue(line);
        map.set(line.uic, cur);
      }
    }
    for (const po of state.pos) {
      for (const line of po.lines) {
        const cur = map.get(line.uic);
        if (cur) cur.ordered += line.qty;
      }
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [state.prs, state.consolidations, state.pos]);

  const supplierRows = useMemo<SupplierRow[]>(
    () =>
      state.suppliers
        .map((s) => {
          const pos = state.pos.filter((p) => p.supplierCode === s.code);
          let allocations = 0;
          let allocatedValue = 0;
          for (const dc of state.consolidations) {
            for (const line of dc.lines) {
              for (const a of line.allocations) {
                if (a.supplierCode !== s.code) continue;
                allocations += 1;
                allocatedValue += a.qty * a.unitPrice;
              }
            }
          }
          return {
            code: s.code,
            name: s.name,
            type: s.type,
            allocations,
            allocatedValue,
            orders: pos.length,
            released: pos.filter((p) => p.status === "Released").length,
            orderValue: pos.reduce((t, p) => t + poValue(p), 0),
          };
        })
        .sort((a, b) => b.orderValue - a.orderValue),
    [state.suppliers, state.consolidations, state.pos],
  );

  const traceRows = useMemo<TraceRow[]>(
    () =>
      state.pos.map((po) => {
        const dc = state.consolidations.find((c) => c.dcNo === po.dcNo);
        const prs = dc ? state.prs.filter((p) => dc.sourcePrNos.includes(p.prNo)) : [];
        const units = new Set(prs.map((p) => p.unitCode));
        return {
          poNo: po.poNo,
          status: po.status,
          supplier: supplierByCode(po.supplierCode)?.name ?? po.supplierCode,
          dcNo: po.dcNo,
          period: dc?.period ?? "—",
          prs: prs.length,
          units: units.size,
          value: poValue(po),
          poDate: dateShort(po.poDate),
        };
      }),
    [state.pos, state.consolidations, state.prs, supplierByCode],
  );

  const exports: Record<TabKey, () => void> = {
    unit: () =>
      downloadCsv(
        "cps-unit-wise-pr",
        toCsv(unitRows as unknown as Record<string, unknown>[], [
          { key: "code", label: "Unit Code" },
          { key: "name", label: "Unit Name" },
          { key: "total", label: "Total PR" },
          { key: "pending", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
          { key: "consolidated", label: "Consolidated" },
          { key: "qty", label: "Total Qty" },
        ]),
      ),
    item: () =>
      downloadCsv(
        "cps-item-wise-demand",
        toCsv(itemRows as unknown as Record<string, unknown>[], [
          { key: "uic", label: "UIC" },
          { key: "description", label: "Description" },
          { key: "approved", label: "Approved Demand" },
          { key: "consolidated", label: "Consolidated" },
          { key: "ordered", label: "Ordered" },
          { key: "value", label: "Allocation Value" },
        ]),
      ),
    supplier: () =>
      downloadCsv(
        "cps-supplier-allocation",
        toCsv(supplierRows as unknown as Record<string, unknown>[], [
          { key: "code", label: "Supplier Code" },
          { key: "name", label: "Supplier" },
          { key: "type", label: "Type" },
          { key: "allocations", label: "Allocations" },
          { key: "allocatedValue", label: "Allocated Value" },
          { key: "orders", label: "Orders" },
          { key: "released", label: "Released" },
          { key: "orderValue", label: "Order Value" },
        ]),
      ),
    trace: () =>
      downloadCsv(
        "cps-po-traceability",
        toCsv(traceRows as unknown as Record<string, unknown>[], [
          { key: "poNo", label: "PO No." },
          { key: "supplier", label: "Supplier" },
          { key: "dcNo", label: "Consolidation" },
          { key: "period", label: "Period" },
          { key: "prs", label: "Source PRs" },
          { key: "units", label: "Units" },
          { key: "value", label: "PO Value" },
          { key: "poDate", label: "PO Date" },
        ]),
      ),
  };

  return (
    <>
      <ScreenTitle
        title="Reports"
        hint="Registers and roll-ups computed live from the prototype data."
        actions={
          <Button
            variant="primary"
            icon={<Download className="size-3.5" />}
            onClick={() => {
              exports[tab]();
              toast.success("Report exported as CSV");
            }}
          >
            Export CSV
          </Button>
        }
      />

      <Tabs
        items={[
          { key: "unit", label: "Unit-wise PR", count: unitRows.length },
          { key: "item", label: "Item-wise Demand", count: itemRows.length },
          { key: "supplier", label: "Supplier Allocation", count: supplierRows.length },
          { key: "trace", label: "PO Traceability", count: traceRows.length },
        ]}
        value={tab}
        onChange={(k) => setTab(k as TabKey)}
      />

      <div className="mt-4">
        {tab === "unit" && (
          <>
            <SectionHeading>Requisition volume by company unit</SectionHeading>
            <DataGrid
              columns={[
                { key: "code", label: "Unit", mono: true, width: "120px" },
                { key: "name", label: "Unit Name" },
                { key: "total", label: "Total PR", align: "right", width: "100px" },
                { key: "pending", label: "Pending", align: "right", width: "100px" },
                { key: "approved", label: "Approved", align: "right", width: "110px" },
                { key: "rejected", label: "Rejected", align: "right", width: "100px" },
                { key: "consolidated", label: "Consolidated", align: "right", width: "130px" },
                {
                  key: "qty",
                  label: "Total Qty",
                  align: "right",
                  width: "120px",
                  render: (r: UnitRow) => money(r.qty),
                },
              ]}
              rows={unitRows}
              rowKey={(r) => r.code}
              empty="No unit registered."
            />
          </>
        )}

        {tab === "item" && (
          <>
            <SectionHeading>Approved, consolidated and ordered quantity per item</SectionHeading>
            <DataGrid
              columns={[
                { key: "uic", label: "UIC", mono: true, width: "150px" },
                { key: "description", label: "Description" },
                {
                  key: "approved",
                  label: "Approved Demand",
                  align: "right",
                  width: "160px",
                  render: (r: ItemRow) => money(r.approved),
                },
                {
                  key: "consolidated",
                  label: "Consolidated",
                  align: "right",
                  width: "140px",
                  render: (r: ItemRow) => money(r.consolidated),
                },
                {
                  key: "ordered",
                  label: "Ordered",
                  align: "right",
                  width: "120px",
                  render: (r: ItemRow) => money(r.ordered),
                },
                {
                  key: "value",
                  label: "Allocation Value",
                  align: "right",
                  width: "160px",
                  render: (r: ItemRow) => money(r.value),
                },
              ]}
              rows={itemRows}
              rowKey={(r) => r.uic}
              empty="No approved demand yet."
            />
          </>
        )}

        {tab === "supplier" && (
          <>
            <SectionHeading>Allocation and order value by supplier</SectionHeading>
            <DataGrid
              columns={[
                { key: "code", label: "Code", mono: true, width: "120px" },
                { key: "name", label: "Supplier" },
                { key: "type", label: "Type", width: "90px" },
                { key: "allocations", label: "Allocations", align: "right", width: "120px" },
                {
                  key: "allocatedValue",
                  label: "Allocated Value",
                  align: "right",
                  width: "160px",
                  render: (r: SupplierRow) => money(r.allocatedValue),
                },
                { key: "orders", label: "Orders", align: "right", width: "100px" },
                { key: "released", label: "Released", align: "right", width: "110px" },
                {
                  key: "orderValue",
                  label: "Order Value",
                  align: "right",
                  width: "150px",
                  render: (r: SupplierRow) => money(r.orderValue),
                },
              ]}
              rows={supplierRows}
              rowKey={(r) => r.code}
              empty="No supplier registered."
            />
          </>
        )}

        {tab === "trace" && (
          <>
            <SectionHeading>Every order back to the requisitions behind it</SectionHeading>
            <DataGrid
              columns={[
                { key: "poNo", label: "PO No.", mono: true, width: "150px" },
                { key: "supplier", label: "Supplier" },
                { key: "dcNo", label: "Consolidation", mono: true, width: "150px" },
                { key: "period", label: "Period", width: "110px" },
                { key: "prs", label: "Source PRs", align: "right", width: "120px" },
                { key: "units", label: "Units", align: "right", width: "90px" },
                {
                  key: "value",
                  label: "PO Value",
                  align: "right",
                  width: "150px",
                  render: (r: TraceRow) => money(r.value),
                },
                { key: "poDate", label: "PO Date", width: "120px" },
                { key: "status", label: "Status", width: "130px" },
              ]}
              rows={traceRows}
              rowKey={(r) => r.poNo}
              empty="No purchase order raised yet."
            />
          </>
        )}
      </div>

      <NoteBar className="mt-5">
        Allocation totals always reconcile with consolidated demand:{" "}
        {money(
          state.consolidations
            .filter((c) => c.status === "Confirmed")
            .reduce((s, c) => s + c.lines.reduce((t, l) => t + allocatedQty(l), 0), 0),
        )}{" "}
        units allocated across {state.suppliers.length} registered suppliers.
      </NoteBar>
    </>
  );
}
