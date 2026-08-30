import { chance, intBetween, pick } from "@/lib/utils/random";
import { offsetISO } from "./datasets.purchase";
import {
  DEFECTS,
  DOC_TYPES,
  INSPECTORS,
  ITEMS,
  ITEM_CATEGORIES,
  PEOPLE,
  SUPPLIERS,
  UNITS,
  WAREHOUSES,
  ZONES,
} from "./reference";
import type { DatasetSpec } from "./types";

const pad = (n: number, w = 4) => String(n).padStart(w, "0");
const round = (n: number, dp = 2) => Number(n.toFixed(dp));
const WH_NAMES = WAREHOUSES.map((w) => w.name);

/** Realistic holding quantities per item category. */
const QTY_BANDS: Record<string, [number, number]> = {
  Fabric: [2_000, 60_000],
  "Trims & Accessories": [8_000, 220_000],
  "Dyes & Chemicals": [400, 18_000],
  Packaging: [4_000, 140_000],
  Machinery: [2, 46],
  "Spare Parts": [20, 1_400],
};

/* ══════════════════════════════════════════════════════════════════════════
   RECEIVING
   ══════════════════════════════════════════════════════════════════════════ */

const RECEIVING_STATUS = ["Pending", "Received", "Verified", "Put-away", "Rejected"] as const;

export const receivingSpec: DatasetSpec = {
  key: "receiving",
  entity: "Receipt",
  entityPlural: "Receipts",
  idField: "receiptNo",
  idPrefix: "RCV",
  statusField: "status",
  statusOptions: RECEIVING_STATUS,
  searchFields: ["receiptNo", "poNo", "supplier", "challanNo", "warehouse"],
  seedCount: 108,
  columns: [
    { key: "receiptNo", label: "Receipt No.", type: "mono", width: "130px" },
    { key: "poNo", label: "PO Ref.", type: "mono" },
    { key: "supplier", label: "Supplier" },
    { key: "challanNo", label: "Challan", type: "mono", secondary: true },
    { key: "warehouse", label: "Warehouse", secondary: true },
    { key: "dispatchedQty", label: "Dispatched", type: "num", align: "right", secondary: true },
    { key: "receivedQty", label: "Received", type: "num", align: "right" },
    { key: "shortQty", label: "Short", type: "num", align: "right" },
    { key: "receivedOn", label: "Received On", type: "date" },
    { key: "cycleHours", label: "Gate→GRN (h)", type: "num", align: "right", secondary: true },
    { key: "verifiedBy", label: "Verified By", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "poNo", label: "PO Reference", type: "text", required: true },
    { key: "supplier", label: "Supplier", type: "select", options: SUPPLIERS, required: true },
    { key: "challanNo", label: "Challan / Invoice No.", type: "text", required: true },
    { key: "warehouse", label: "Receiving Warehouse", type: "select", options: WH_NAMES, required: true },
    { key: "dispatchedQty", label: "Dispatched Quantity", type: "number", min: 0, required: true },
    { key: "receivedQty", label: "Received Quantity", type: "number", min: 0, required: true },
    {
      key: "shortQty",
      label: "Short Quantity",
      type: "number",
      derived: (r) => Math.max(0, Number(r.dispatchedQty || 0) - Number(r.receivedQty || 0)),
      help: "Dispatched − received",
    },
    { key: "receivedOn", label: "Received On", type: "date", required: true },
    { key: "vehicleNo", label: "Vehicle / Container No.", type: "text" },
    { key: "cycleHours", label: "Gate to GRN (hours)", type: "number", min: 0 },
    { key: "verifiedBy", label: "Verified By", type: "select", options: PEOPLE.map((p) => p.name) },
    { key: "status", label: "Status", type: "select", options: RECEIVING_STATUS, required: true },
    { key: "remarks", label: "Gate Remarks", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Receipts Booked", expr: "count", unit: "num" },
    { label: "Quantity Received", expr: "sum:receivedQty", unit: "num" },
    { label: "Awaiting Verification", expr: "countWhere:status=Pending", unit: "num", goodWhenUp: false },
    { label: "Avg. Gate→GRN", expr: "avg:cycleHours", unit: "num", hint: "Hours from gate entry to GRN", goodWhenUp: false },
  ],
  charts: [
    { form: "area", title: "Quantity received per month", by: "receivedOn", value: "receivedQty", unit: "num" },
    { form: "grouped", title: "Dispatched versus received", hint: "Short receipts by supplier", by: "supplier", series: [{ key: "dispatchedQty", label: "Dispatched" }, { key: "receivedQty", label: "Received" }], unit: "num" },
    { form: "donut", title: "Receipts by status", by: "status" },
    { form: "bar", title: "Gate-to-GRN cycle by warehouse", hint: "Total hours accumulated per store", by: "warehouse", value: "cycleHours", unit: "num" },
  ],
  make: (rng, i) => {
    const dispatched = intBetween(rng, 200, 30_000);
    const received = Math.round(dispatched * (0.93 + rng() * 0.08));
    return {
      receiptNo: `RCV-25-${pad(2000 + i)}`,
      poNo: `PO-25-${pad(7000 + intBetween(rng, 0, 117))}`,
      supplier: pick(rng, SUPPLIERS),
      challanNo: `CH-${intBetween(rng, 10000, 99999)}`,
      warehouse: pick(rng, WH_NAMES),
      dispatchedQty: dispatched,
      receivedQty: Math.min(dispatched, received),
      shortQty: Math.max(0, dispatched - received),
      receivedOn: offsetISO(-intBetween(rng, 1, 170)),
      vehicleNo: `CTG-${intBetween(rng, 11, 99)}-${intBetween(rng, 1000, 9999)}`,
      cycleHours: intBetween(rng, 2, 72),
      verifiedBy: pick(rng, PEOPLE).name,
      status: pick(rng, RECEIVING_STATUS),
      docType: pick(rng, DOC_TYPES),
      remarks: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   GRN
   ══════════════════════════════════════════════════════════════════════════ */

const GRN_STATUS = ["Pending", "Draft", "Posted", "Verified", "Reversed"] as const;

export const grnSpec: DatasetSpec = {
  key: "grn",
  entity: "GRN",
  entityPlural: "GRNs",
  idField: "grnNo",
  idPrefix: "GRN",
  statusField: "status",
  statusOptions: GRN_STATUS,
  searchFields: ["grnNo", "poNo", "receiptNo", "supplier", "itemCode"],
  seedCount: 120,
  columns: [
    { key: "grnNo", label: "GRN No.", type: "mono", width: "128px" },
    { key: "poNo", label: "PO Ref.", type: "mono" },
    { key: "receiptNo", label: "Receipt Ref.", type: "mono", secondary: true },
    { key: "supplier", label: "Supplier" },
    { key: "itemCode", label: "Item", type: "mono", secondary: true },
    { key: "warehouse", label: "Warehouse", secondary: true },
    { key: "orderedQty", label: "Ordered", type: "num", align: "right", secondary: true },
    { key: "receivedQty", label: "Received", type: "num", align: "right" },
    { key: "value", label: "GRN Value", type: "currency", align: "right" },
    { key: "grnDate", label: "GRN Date", type: "date" },
    { key: "preparedBy", label: "Prepared By", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "poNo", label: "PO Reference", type: "text", required: true },
    { key: "receiptNo", label: "Receipt Reference", type: "text" },
    { key: "supplier", label: "Supplier", type: "select", options: SUPPLIERS, required: true, span: 2 },
    { key: "itemCode", label: "Item Code", type: "select", options: ITEMS.map((it) => it.code), required: true },
    { key: "warehouse", label: "Warehouse", type: "select", options: WH_NAMES, required: true },
    { key: "orderedQty", label: "Ordered Quantity", type: "number", min: 0, required: true },
    { key: "receivedQty", label: "Received Quantity", type: "number", min: 0, required: true },
    { key: "rate", label: "Unit Rate", type: "currency", min: 0, step: 0.01, required: true },
    {
      key: "value",
      label: "GRN Value",
      type: "currency",
      derived: (r) => round(Number(r.receivedQty || 0) * Number(r.rate || 0), 2),
      help: "Received quantity × unit rate",
    },
    { key: "grnDate", label: "GRN Date", type: "date", required: true },
    { key: "preparedBy", label: "Prepared By", type: "select", options: PEOPLE.map((p) => p.name) },
    { key: "status", label: "Status", type: "select", options: GRN_STATUS, required: true },
    { key: "remarks", label: "Remarks", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "GRNs Posted", expr: "countWhere:status=Posted", unit: "num", goodWhenUp: true },
    { label: "GRN Value", expr: "sum:value", unit: "currency" },
    { label: "Quantity Received", expr: "sum:receivedQty", unit: "num" },
    { label: "Pending GRN", expr: "countWhere:status=Pending", unit: "num", goodWhenUp: false },
  ],
  charts: [
    { form: "area", title: "GRN value posted per month", by: "grnDate", value: "value", unit: "currency" },
    { form: "hbar", title: "GRN value by supplier", by: "supplier", value: "value", unit: "currency", top: 8 },
    { form: "stacked", title: "GRN status by warehouse", by: "warehouse", stack: "status" },
    { form: "grouped", title: "Ordered versus received quantity", by: "itemCode", series: [{ key: "orderedQty", label: "Ordered" }, { key: "receivedQty", label: "Received" }], unit: "num" },
  ],
  make: (rng, i) => {
    const item = pick(rng, ITEMS);
    const ordered = intBetween(rng, 300, 28_000);
    const received = Math.round(ordered * (0.9 + rng() * 0.12));
    const rate = round(item.rate * (0.92 + rng() * 0.2), 3);
    return {
      grnNo: `GRN-25-${pad(3000 + i)}`,
      poNo: `PO-25-${pad(7000 + intBetween(rng, 0, 117))}`,
      receiptNo: `RCV-25-${pad(2000 + intBetween(rng, 0, 107))}`,
      supplier: pick(rng, SUPPLIERS),
      itemCode: item.code,
      itemName: item.name,
      warehouse: pick(rng, WH_NAMES),
      orderedQty: ordered,
      receivedQty: received,
      rate,
      value: round(received * rate, 0),
      grnDate: offsetISO(-intBetween(rng, 1, 165)),
      preparedBy: pick(rng, PEOPLE).name,
      status: pick(rng, GRN_STATUS),
      docType: "Goods Receipt Note",
      remarks: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   IQC — INCOMING QUALITY CONTROL
   ══════════════════════════════════════════════════════════════════════════ */

const IQC_STATUS = ["Pending", "In Progress", "Completed"] as const;
const IQC_DECISION = ["Accepted", "Partially Accepted", "Rejected", "Hold"] as const;

export const iqcSpec: DatasetSpec = {
  key: "iqc",
  entity: "Inspection",
  entityPlural: "Inspections",
  idField: "iqcNo",
  idPrefix: "IQC",
  statusField: "decision",
  statusOptions: IQC_DECISION,
  searchFields: ["iqcNo", "grnNo", "itemCode", "supplier", "inspector", "defect"],
  seedCount: 110,
  columns: [
    { key: "iqcNo", label: "IQC No.", type: "mono", width: "126px" },
    { key: "grnNo", label: "GRN Ref.", type: "mono" },
    { key: "supplier", label: "Supplier" },
    { key: "itemCode", label: "Item", type: "mono", secondary: true },
    { key: "lotQty", label: "Lot Qty", type: "num", align: "right" },
    { key: "sampleQty", label: "Sample", type: "num", align: "right", secondary: true },
    { key: "acceptedQty", label: "Accepted", type: "num", align: "right" },
    { key: "rejectedQty", label: "Rejected", type: "num", align: "right" },
    { key: "defectPct", label: "Defect %", type: "delta", align: "right" },
    { key: "defect", label: "Primary Defect", secondary: true },
    { key: "inspector", label: "Inspector", secondary: true },
    { key: "inspectedOn", label: "Inspected", type: "date", secondary: true },
    { key: "decision", label: "Decision", type: "status" },
  ],
  fields: [
    { key: "grnNo", label: "GRN Reference", type: "text", required: true },
    { key: "supplier", label: "Supplier", type: "select", options: SUPPLIERS, required: true },
    { key: "itemCode", label: "Item Code", type: "select", options: ITEMS.map((it) => it.code), required: true },
    { key: "warehouse", label: "Warehouse", type: "select", options: WH_NAMES },
    { key: "lotQty", label: "Lot Quantity", type: "number", min: 1, required: true },
    { key: "sampleQty", label: "Sample Size", type: "number", min: 1, required: true, help: "AQL 2.5 general inspection level II" },
    { key: "acceptedQty", label: "Accepted Quantity", type: "number", min: 0, required: true },
    { key: "rejectedQty", label: "Rejected Quantity", type: "number", min: 0, required: true },
    {
      key: "defectPct",
      label: "Defect Rate %",
      type: "number",
      derived: (r) => {
        const lot = Number(r.lotQty || 0);
        return lot > 0 ? round((Number(r.rejectedQty || 0) / lot) * 100, 2) : 0;
      },
      help: "Rejected ÷ lot quantity",
    },
    { key: "defect", label: "Primary Defect", type: "select", options: DEFECTS },
    { key: "inspector", label: "Inspector", type: "select", options: INSPECTORS, required: true },
    { key: "inspectedOn", label: "Inspection Date", type: "date", required: true },
    { key: "decision", label: "IQC Decision", type: "select", options: IQC_DECISION, required: true },
    { key: "status", label: "Inspection Status", type: "select", options: IQC_STATUS, required: true },
    { key: "findings", label: "Inspection Findings", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Lots Inspected", expr: "count", unit: "num" },
    { label: "Acceptance Rate", expr: "ratio:acceptedQty:lotQty", unit: "percent", goodWhenUp: true, hint: "Accepted ÷ presented quantity" },
    { label: "Rejected Quantity", expr: "sum:rejectedQty", unit: "num", goodWhenUp: false },
    { label: "Lots on Hold", expr: "countWhere:decision=Hold", unit: "num", goodWhenUp: false },
  ],
  charts: [
    { form: "pareto", title: "Rejection by defect type", hint: "The few defects driving most rejection", by: "defect", value: "rejectedQty" },
    { form: "donut", title: "Inspection decisions", by: "decision" },
    { form: "grouped", title: "Accepted versus rejected by supplier", by: "supplier", series: [{ key: "acceptedQty", label: "Accepted" }, { key: "rejectedQty", label: "Rejected" }], unit: "num" },
    { form: "area", title: "Rejected quantity over time", by: "inspectedOn", value: "rejectedQty", unit: "num" },
  ],
  make: (rng, i) => {
    const item = pick(rng, ITEMS);
    const lot = intBetween(rng, 300, 25_000);
    const sample = Math.max(8, Math.round(Math.sqrt(lot) * 1.4));
    const decision = pick(rng, [...IQC_DECISION, "Accepted", "Accepted"] as const);
    const rejectRate = decision === "Accepted" ? 0 : decision === "Partially Accepted" ? rng() * 0.12 : decision === "Rejected" ? 0.3 + rng() * 0.6 : rng() * 0.2;
    const rejected = Math.round(lot * rejectRate);
    return {
      iqcNo: `IQC-25-${pad(4000 + i)}`,
      grnNo: `GRN-25-${pad(3000 + intBetween(rng, 0, 119))}`,
      supplier: pick(rng, SUPPLIERS),
      itemCode: item.code,
      itemName: item.name,
      warehouse: pick(rng, WH_NAMES),
      lotQty: lot,
      sampleQty: sample,
      acceptedQty: lot - rejected,
      rejectedQty: rejected,
      defectPct: round((rejected / lot) * 100, 2),
      defect: rejected > 0 ? pick(rng, DEFECTS) : "None",
      inspector: pick(rng, INSPECTORS),
      inspectedOn: offsetISO(-intBetween(rng, 1, 160)),
      decision,
      status: pick(rng, IQC_STATUS),
      docType: "Inspection Report",
      findings: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   WAREHOUSE MASTER
   ══════════════════════════════════════════════════════════════════════════ */

const WH_STATUS = ["Active", "Inactive", "Under Maintenance"] as const;

export const warehouseSpec: DatasetSpec = {
  key: "warehouse",
  entity: "Warehouse",
  entityPlural: "Warehouses",
  idField: "code",
  idPrefix: "WH",
  statusField: "status",
  statusOptions: WH_STATUS,
  searchFields: ["code", "name", "type", "location", "zone"],
  seedCount: 24,
  columns: [
    { key: "code", label: "Code", type: "mono", width: "116px" },
    { key: "name", label: "Warehouse" },
    { key: "type", label: "Type", type: "chip" },
    { key: "location", label: "Location", secondary: true },
    { key: "zone", label: "Zone", align: "center", secondary: true },
    { key: "bins", label: "Bins", type: "num", align: "right", secondary: true },
    { key: "utilisedPct", label: "Utilisation", type: "progress", align: "right" },
    { key: "stockValue", label: "Stock Value", type: "currency", align: "right" },
    { key: "inCharge", label: "In-charge", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "code", label: "Warehouse Code", type: "text", required: true },
    { key: "name", label: "Warehouse Name", type: "text", required: true, span: 2 },
    { key: "type", label: "Warehouse Type", type: "select", options: ["Raw Material", "Finished Goods", "Bonded", "Quarantine"], required: true },
    { key: "location", label: "Location", type: "text", required: true },
    { key: "zone", label: "Zone", type: "select", options: ZONES },
    { key: "rack", label: "Rack", type: "text", placeholder: "e.g. R-12" },
    { key: "shelf", label: "Shelf", type: "text", placeholder: "e.g. S-04" },
    { key: "bins", label: "Bin Count", type: "number", min: 0 },
    { key: "capacity", label: "Capacity (units)", type: "number", min: 0 },
    { key: "utilisedPct", label: "Utilisation %", type: "number", min: 0, max: 100 },
    { key: "stockValue", label: "Stock Value", type: "currency", min: 0 },
    { key: "inCharge", label: "Store In-charge", type: "select", options: PEOPLE.map((p) => p.name) },
    { key: "status", label: "Status", type: "select", options: WH_STATUS, required: true },
  ],
  kpis: [
    { label: "Warehouses", expr: "count", unit: "num" },
    { label: "Stock Value Held", expr: "sum:stockValue", unit: "currency" },
    { label: "Avg. Utilisation", expr: "avg:utilisedPct", unit: "percent" },
    { label: "Total Bins", expr: "sum:bins", unit: "num" },
  ],
  charts: [
    { form: "hbar", title: "Stock value by warehouse", by: "name", value: "stockValue", unit: "currency", top: 8 },
    { form: "bar", title: "Utilisation by warehouse type", by: "type", value: "utilisedPct", unit: "num" },
    { form: "donut", title: "Warehouses by type", by: "type" },
    { form: "stacked", title: "Zone coverage by type", by: "type", stack: "zone" },
  ],
  make: (rng, i) => {
    const base = WAREHOUSES[i % WAREHOUSES.length];
    const suffix = i >= WAREHOUSES.length ? ` — Zone ${ZONES[Math.floor(i / WAREHOUSES.length) - 1] ?? "E"}` : "";
    return {
      code: `${base.code}${i >= WAREHOUSES.length ? `-${i}` : ""}`,
      name: `${base.name}${suffix}`,
      type: base.type,
      location: base.location,
      zone: pick(rng, ZONES),
      rack: `R-${intBetween(rng, 1, 40)}`,
      shelf: `S-${intBetween(rng, 1, 12)}`,
      bins: intBetween(rng, 40, 620),
      capacity: intBetween(rng, 20_000, 400_000),
      utilisedPct: intBetween(rng, 28, 96),
      stockValue: round(intBetween(rng, 30_000, 1_800_000), 0),
      inCharge: pick(rng, PEOPLE).name,
      status: pick(rng, [...WH_STATUS, "Active", "Active"] as const),
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   STOCK
   ══════════════════════════════════════════════════════════════════════════ */

const STOCK_STATUS = ["Healthy", "Low", "Excess", "Dead"] as const;

export const stockSpec: DatasetSpec = {
  key: "stock",
  entity: "Stock Line",
  entityPlural: "Stock Lines",
  idField: "stockNo",
  idPrefix: "STK",
  statusField: "status",
  statusOptions: STOCK_STATUS,
  searchFields: ["stockNo", "itemCode", "itemName", "warehouse", "category", "bin"],
  seedCount: 128,
  columns: [
    { key: "itemCode", label: "Item Code", type: "mono", width: "118px" },
    { key: "itemName", label: "Description" },
    { key: "category", label: "Category", type: "chip", secondary: true },
    { key: "warehouse", label: "Warehouse", secondary: true },
    { key: "bin", label: "Bin", type: "mono", secondary: true },
    { key: "freeQty", label: "Free", type: "num", align: "right" },
    { key: "holdQty", label: "Hold", type: "num", align: "right", secondary: true },
    { key: "quarantineQty", label: "Quarantine", type: "num", align: "right", secondary: true },
    { key: "rejectedQty", label: "Rejected", type: "num", align: "right", secondary: true },
    { key: "totalQty", label: "Total", type: "num", align: "right" },
    { key: "value", label: "Value", type: "currency", align: "right" },
    { key: "ageingDays", label: "Ageing (d)", type: "num", align: "right", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "itemCode", label: "Item Code", type: "select", options: ITEMS.map((it) => it.code), required: true },
    { key: "itemName", label: "Description", type: "text", required: true, span: 2 },
    { key: "category", label: "Category", type: "select", options: ITEM_CATEGORIES, required: true },
    { key: "warehouse", label: "Warehouse", type: "select", options: WH_NAMES, required: true },
    { key: "bin", label: "Bin / Rack / Shelf", type: "text", placeholder: "A-R12-S04" },
    { key: "uom", label: "UOM", type: "select", options: ["KG", "PCS", "YDS", "MTR", "LTR", "SET", "CONE", "GRS"] },
    { key: "freeQty", label: "Free Stock", type: "number", min: 0, required: true },
    { key: "holdQty", label: "Hold Stock", type: "number", min: 0 },
    { key: "quarantineQty", label: "Quarantine Stock", type: "number", min: 0 },
    { key: "rejectedQty", label: "Rejected Stock", type: "number", min: 0 },
    {
      key: "totalQty",
      label: "Total Stock",
      type: "number",
      derived: (r) =>
        Number(r.freeQty || 0) + Number(r.holdQty || 0) + Number(r.quarantineQty || 0) + Number(r.rejectedQty || 0),
      help: "Free + hold + quarantine + rejected",
    },
    { key: "rate", label: "Valuation Rate", type: "currency", min: 0, step: 0.01, required: true },
    {
      key: "value",
      label: "Stock Value",
      type: "currency",
      derived: (r) => {
        const total =
          Number(r.freeQty || 0) + Number(r.holdQty || 0) + Number(r.quarantineQty || 0) + Number(r.rejectedQty || 0);
        return round(total * Number(r.rate || 0), 2);
      },
    },
    { key: "reorderLevel", label: "Reorder Level", type: "number", min: 0 },
    { key: "ageingDays", label: "Ageing (days)", type: "number", min: 0 },
    { key: "status", label: "Stock Status", type: "select", options: STOCK_STATUS, required: true },
  ],
  kpis: [
    { label: "Stock Value", expr: "sum:value", unit: "currency", hint: "Total inventory valuation" },
    { label: "Free Stock", expr: "sum:freeQty", unit: "num", hint: "Available to issue", goodWhenUp: true },
    { label: "Blocked Quantity", expr: "sum:holdQty", unit: "num", hint: "Held and quarantined", goodWhenUp: false },
    { label: "Lines Below Reorder", expr: "countWhere:status=Low", unit: "num", goodWhenUp: false },
  ],
  charts: [
    { form: "hbar", title: "Stock value by warehouse", by: "warehouse", value: "value", unit: "currency", top: 8 },
    { form: "donut", title: "Stock value by category", by: "category" },
    { form: "grouped", title: "Stock disposition by category", hint: "Free, hold, quarantine and rejected quantity", by: "category", series: [{ key: "freeQty", label: "Free" }, { key: "holdQty", label: "Hold" }, { key: "quarantineQty", label: "Quarantine" }, { key: "rejectedQty", label: "Rejected" }], unit: "num" },
    { form: "pareto", title: "Ageing exposure by item", hint: "Value sitting on the oldest lines", by: "itemName", value: "value" },
  ],
  make: (rng, i) => {
    const item = pick(rng, ITEMS);
    // Holding quantity is category-dependent: you stock trims by the hundred
    // thousand and sewing machines by the dozen.
    const band = QTY_BANDS[item.category] ?? [500, 20_000];
    const free = intBetween(rng, band[0], band[1]);
    const hold = Math.round(free * (rng() * 0.08));
    const quar = Math.round(free * (rng() * 0.05));
    const rej = Math.round(free * (rng() * 0.03));
    const total = free + hold + quar + rej;
    const reorder = Math.round(free * (0.2 + rng() * 1.4));
    const ageing = intBetween(rng, 2, 420);
    return {
      stockNo: `STK-${pad(1000 + i)}`,
      itemCode: item.code,
      itemName: item.name,
      category: item.category,
      warehouse: pick(rng, WH_NAMES),
      bin: `${pick(rng, ZONES)}-R${intBetween(rng, 1, 40)}-S${intBetween(rng, 1, 12)}`,
      uom: item.uom,
      freeQty: free,
      holdQty: hold,
      quarantineQty: quar,
      rejectedQty: rej,
      totalQty: total,
      rate: item.rate,
      value: round(total * item.rate, 0),
      reorderLevel: reorder,
      ageingDays: ageing,
      status: ageing > 300 ? "Dead" : free < reorder ? "Low" : free > reorder * 6 ? "Excess" : "Healthy",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   STOCK MOVEMENT / LEDGER
   ══════════════════════════════════════════════════════════════════════════ */

const MOVEMENT_TYPES = [
  "Stock In",
  "Stock Out",
  "Transfer",
  "Adjustment",
  "Return",
  "Issue",
  "Put-away",
  "Picking",
] as const;

const MOVEMENT_STATUS = ["Posted", "Draft", "Cancelled"] as const;

export const movementSpec: DatasetSpec = {
  key: "movement",
  entity: "Movement",
  entityPlural: "Movements",
  idField: "docNo",
  idPrefix: "MOV",
  statusField: "status",
  statusOptions: MOVEMENT_STATUS,
  searchFields: ["docNo", "itemCode", "itemName", "warehouse", "type", "reference"],
  seedCount: 150,
  columns: [
    { key: "docNo", label: "Document", type: "mono", width: "128px" },
    { key: "date", label: "Posted On", type: "date" },
    { key: "type", label: "Movement", type: "chip" },
    { key: "itemCode", label: "Item", type: "mono" },
    { key: "itemName", label: "Description", secondary: true },
    { key: "warehouse", label: "Warehouse", secondary: true },
    { key: "fromLoc", label: "From", type: "mono", secondary: true },
    { key: "toLoc", label: "To", type: "mono", secondary: true },
    { key: "qty", label: "Quantity", type: "num", align: "right" },
    { key: "balance", label: "Balance", type: "num", align: "right" },
    { key: "value", label: "Value", type: "currency", align: "right", secondary: true },
    { key: "reference", label: "Reference", type: "mono", secondary: true },
    { key: "doneBy", label: "Posted By", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "type", label: "Movement Type", type: "select", options: MOVEMENT_TYPES, required: true },
    { key: "date", label: "Posting Date", type: "date", required: true },
    { key: "itemCode", label: "Item Code", type: "select", options: ITEMS.map((it) => it.code), required: true },
    { key: "itemName", label: "Description", type: "text", span: 2 },
    { key: "warehouse", label: "Warehouse", type: "select", options: WH_NAMES, required: true },
    { key: "fromLoc", label: "From Location", type: "text", placeholder: "A-R12-S04" },
    { key: "toLoc", label: "To Location", type: "text", placeholder: "B-R03-S01" },
    { key: "qty", label: "Quantity", type: "number", min: 1, required: true },
    { key: "rate", label: "Rate", type: "currency", min: 0, step: 0.01 },
    {
      key: "value",
      label: "Movement Value",
      type: "currency",
      derived: (r) => round(Number(r.qty || 0) * Number(r.rate || 0), 2),
    },
    { key: "balance", label: "Closing Balance", type: "number", min: 0 },
    { key: "reference", label: "Reference Document", type: "text", placeholder: "GRN / PO / Issue No." },
    { key: "doneBy", label: "Posted By", type: "select", options: PEOPLE.map((p) => p.name) },
    { key: "status", label: "Status", type: "select", options: MOVEMENT_STATUS, required: true },
    { key: "remarks", label: "Remarks", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Movements Posted", expr: "count", unit: "num" },
    { label: "Inward Quantity", expr: "sumWhere:direction=In:qty", unit: "num", goodWhenUp: true },
    { label: "Outward Quantity", expr: "sumWhere:direction=Out:qty", unit: "num" },
    { label: "Movement Value", expr: "sum:value", unit: "currency" },
  ],
  charts: [
    { form: "area", title: "Movement value by month", by: "date", value: "value", unit: "currency" },
    { form: "stacked", title: "Movement type by warehouse", by: "warehouse", stack: "type" },
    { form: "donut", title: "Inward against outward", by: "direction" },
    { form: "hbar", title: "Most-moved items", by: "itemName", value: "qty", unit: "num", top: 8 },
  ],
  make: (rng, i) => {
    const item = pick(rng, ITEMS);
    const type = pick(rng, MOVEMENT_TYPES);
    const inward = ["Stock In", "Return", "Put-away"].includes(type);
    const qty = intBetween(rng, 20, 12_000);
    return {
      docNo: `MOV-25-${pad(5000 + i)}`,
      date: offsetISO(-intBetween(rng, 0, 180)),
      type,
      direction: inward ? "In" : "Out",
      itemCode: item.code,
      itemName: item.name,
      warehouse: pick(rng, WH_NAMES),
      fromLoc: inward ? "GATE" : `${pick(rng, ZONES)}-R${intBetween(rng, 1, 40)}`,
      toLoc: inward ? `${pick(rng, ZONES)}-R${intBetween(rng, 1, 40)}` : pick(rng, [...UNITS]),
      qty,
      rate: item.rate,
      value: round(qty * item.rate, 0),
      balance: intBetween(rng, 500, 60_000),
      reference: `${pick(rng, ["GRN", "PO", "ISS", "TRF"])}-25-${intBetween(rng, 1000, 8999)}`,
      doneBy: pick(rng, PEOPLE).name,
      status: chance(rng, 0.86) ? "Posted" : pick(rng, MOVEMENT_STATUS),
      remarks: "",
    };
  },
};
