import { chance, intBetween, pick, type Rng } from "@/lib/utils/random";
import {
  APPROVAL_STAGES,
  APPROVERS,
  CATEGORIES,
  CURRENCIES,
  DOC_TYPES,
  INCOTERMS,
  ITEM_CATEGORIES,
  ITEMS,
  MONTHS,
  PAYMENT_TERMS,
  PEOPLE,
  PRIORITIES,
  SHORT_UNITS,
  SUPPLIERS,
  UNITS,
} from "./reference";
import type { DatasetSpec, Row } from "./types";

/* ── shared helpers ───────────────────────────────────────────────────────── */

const pad = (n: number, w = 4) => String(n).padStart(w, "0");

/** ISO date offset from today; negative = past. */
export const offsetISO = (days: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const round = (n: number, dp = 2) => Number(n.toFixed(dp));

const COUNTRIES = ["Bangladesh", "China", "India", "Vietnam", "Türkiye", "Pakistan", "Indonesia"];

/* ══════════════════════════════════════════════════════════════════════════
   PURCHASE REQUISITION
   ══════════════════════════════════════════════════════════════════════════ */

const PR_STATUS = ["Draft", "Pending", "Approved", "On Hold", "Rejected", "Closed"] as const;

export const prSpec: DatasetSpec = {
  key: "pr",
  entity: "Requisition",
  entityPlural: "Requisitions",
  idField: "prNo",
  idPrefix: "PR",
  statusField: "status",
  statusOptions: PR_STATUS,
  searchFields: ["prNo", "unit", "requester", "itemCategory"],
  seedCount: 96,
  columns: [
    { key: "prNo", label: "PR No.", type: "mono", width: "128px" },
    { key: "unit", label: "Business Unit" },
    { key: "itemCategory", label: "Category", type: "chip", secondary: true },
    { key: "lines", label: "Lines", type: "num", align: "right", secondary: true },
    { key: "qty", label: "Quantity", type: "num", align: "right" },
    { key: "estValue", label: "Est. Value", type: "currency", align: "right" },
    { key: "priority", label: "Priority", type: "chip" },
    { key: "requester", label: "Requester", secondary: true },
    { key: "requiredBy", label: "Required By", type: "date", secondary: true },
    { key: "stage", label: "Stage", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "unit", label: "Business Unit", type: "select", options: UNITS, required: true, span: 2 },
    { key: "itemCategory", label: "Item Category", type: "select", options: ITEM_CATEGORIES, required: true },
    { key: "priority", label: "Priority", type: "select", options: PRIORITIES, required: true },
    { key: "lines", label: "Line Items", type: "number", min: 1, max: 40, required: true },
    { key: "qty", label: "Total Quantity", type: "number", min: 1, required: true },
    { key: "estValue", label: "Estimated Value", type: "currency", min: 0, required: true },
    { key: "requiredBy", label: "Required By", type: "date", required: true },
    { key: "requester", label: "Requester", type: "select", options: PEOPLE.map((p) => p.name), required: true },
    { key: "stage", label: "Current Stage", type: "select", options: APPROVAL_STAGES },
    { key: "status", label: "Status", type: "select", options: PR_STATUS, required: true },
    { key: "justification", label: "Business Justification", type: "textarea", span: 2, placeholder: "Why is this purchase required?" },
  ],
  kpis: [
    { label: "Total Requisitions", expr: "count", unit: "num", hint: "All requisitions in scope" },
    { label: "Requisition Value", expr: "sum:estValue", unit: "currency", hint: "Estimated value of the register" },
    { label: "Awaiting Approval", expr: "countWhere:status=Pending", unit: "num", hint: "Blocked in the approval chain", goodWhenUp: false },
    { label: "Approval Rate", expr: "pctWhere:status=Approved", unit: "percent", hint: "Share approved", goodWhenUp: true },
  ],
  charts: [
    { form: "area", title: "Requisition value by required-by month", hint: "Estimated value of demand landing each month", by: "requiredBy", value: "estValue", unit: "currency" },
    { form: "donut", title: "Requisitions by status", hint: "Where the register sits today", by: "status" },
    { form: "stacked", title: "Unit demand by priority", hint: "Requisition count per unit, split by priority", by: "unit", stack: "priority" },
    { form: "hbar", title: "Top categories by value", hint: "Estimated value per item category", by: "itemCategory", value: "estValue", unit: "currency", top: 6 },
  ],
  make: (rng, i) => {
    const unit = pick(rng, UNITS);
    const cat = pick(rng, ITEM_CATEGORIES);
    const lines = intBetween(rng, 1, 18);
    const qty = intBetween(rng, 50, 24_000);
    const status = pick(rng, PR_STATUS);
    return {
      prNo: `PR-25-${pad(1000 + i)}`,
      unit,
      itemCategory: cat,
      lines,
      qty,
      estValue: round(qty * (0.3 + rng() * 9), 0),
      priority: pick(rng, PRIORITIES),
      requester: pick(rng, PEOPLE).name,
      requiredBy: offsetISO(intBetween(rng, -40, 120)),
      raisedOn: offsetISO(-intBetween(rng, 1, 150)),
      stage: status === "Approved" || status === "Closed" ? "Completed" : pick(rng, APPROVAL_STAGES),
      status,
      justification: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   DEMAND CONSOLIDATION
   ══════════════════════════════════════════════════════════════════════════ */

const DEMAND_STATUS = ["Open", "Aggregated", "Converted", "Closed"] as const;

export const demandSpec: DatasetSpec = {
  key: "demand",
  entity: "Demand Line",
  entityPlural: "Demand Lines",
  idField: "demandNo",
  idPrefix: "DM",
  statusField: "status",
  statusOptions: DEMAND_STATUS,
  searchFields: ["demandNo", "unit", "itemCode", "itemName"],
  seedCount: 110,
  columns: [
    { key: "demandNo", label: "Demand No.", type: "mono", width: "128px" },
    { key: "unit", label: "Unit" },
    { key: "itemCode", label: "Item Code", type: "mono" },
    { key: "itemName", label: "Item", secondary: true },
    { key: "uom", label: "UOM", align: "center", secondary: true },
    { key: "requiredQty", label: "Required", type: "num", align: "right" },
    { key: "consolidatedQty", label: "Consolidated", type: "num", align: "right" },
    { key: "estValue", label: "Est. Value", type: "currency", align: "right" },
    { key: "month", label: "Period", align: "center", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "unit", label: "Business Unit", type: "select", options: UNITS, required: true, span: 2 },
    { key: "itemCode", label: "Item Code", type: "select", options: ITEMS.map((it) => it.code), required: true },
    { key: "itemName", label: "Item Description", type: "text", required: true },
    { key: "uom", label: "UOM", type: "select", options: ["KG", "PCS", "YDS", "MTR", "LTR", "SET", "CONE", "GRS"] },
    { key: "requiredQty", label: "Required Quantity", type: "number", min: 1, required: true },
    { key: "consolidatedQty", label: "Consolidated Quantity", type: "number", min: 0 },
    { key: "estValue", label: "Estimated Value", type: "currency", min: 0 },
    { key: "month", label: "Demand Period", type: "select", options: MONTHS },
    { key: "status", label: "Status", type: "select", options: DEMAND_STATUS, required: true },
  ],
  kpis: [
    { label: "Demand Lines", expr: "count", unit: "num" },
    { label: "Consolidated Value", expr: "sum:estValue", unit: "currency" },
    { label: "Open Demand", expr: "countWhere:status=Open", unit: "num", goodWhenUp: false },
    { label: "Conversion Rate", expr: "pctWhere:status=Converted", unit: "percent", goodWhenUp: true },
  ],
  charts: [
    { form: "bar", title: "Demand value by period", hint: "Consolidated requirement per month", by: "month", value: "estValue", unit: "currency" },
    { form: "hbar", title: "Top items by demand value", by: "itemName", value: "estValue", unit: "currency", top: 8 },
    { form: "stacked", title: "Unit demand by status", hint: "Line count per unit across the consolidation stages", by: "unit", stack: "status" },
    { form: "donut", title: "Demand by status", by: "status" },
  ],
  make: (rng, i) => {
    const item = pick(rng, ITEMS);
    const req = intBetween(rng, 100, 40_000);
    const status = pick(rng, DEMAND_STATUS);
    return {
      demandNo: `DM-25-${pad(2000 + i)}`,
      unit: pick(rng, UNITS),
      itemCode: item.code,
      itemName: item.name,
      uom: item.uom,
      requiredQty: req,
      consolidatedQty: status === "Open" ? 0 : Math.round(req * (0.85 + rng() * 0.3)),
      estValue: round(req * item.rate, 0),
      month: pick(rng, MONTHS),
      status,
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   APPROVAL & DOA
   ══════════════════════════════════════════════════════════════════════════ */

const APPROVAL_STATUS = ["Pending", "Approved", "Rejected", "Returned", "Delegated"] as const;

export const approvalSpec: DatasetSpec = {
  key: "approval",
  entity: "Approval Task",
  entityPlural: "Approval Tasks",
  idField: "taskNo",
  idPrefix: "AP",
  statusField: "status",
  statusOptions: APPROVAL_STATUS,
  searchFields: ["taskNo", "docNo", "approver", "unit", "stage"],
  seedCount: 88,
  columns: [
    { key: "taskNo", label: "Task No.", type: "mono", width: "120px" },
    { key: "docType", label: "Document", type: "chip" },
    { key: "docNo", label: "Doc No.", type: "mono" },
    { key: "unit", label: "Unit", secondary: true },
    { key: "stage", label: "Stage" },
    { key: "approver", label: "Approver" },
    { key: "value", label: "Value", type: "currency", align: "right" },
    { key: "submittedOn", label: "Submitted", type: "date", secondary: true },
    { key: "ageDays", label: "Age (d)", type: "num", align: "right" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "docType", label: "Document Type", type: "select", options: ["PR", "PO", "RFQ", "Supplier", "TCO", "GRN"], required: true },
    { key: "docNo", label: "Document No.", type: "text", required: true },
    { key: "unit", label: "Business Unit", type: "select", options: UNITS, required: true, span: 2 },
    { key: "stage", label: "Approval Stage", type: "select", options: APPROVAL_STAGES, required: true },
    { key: "approver", label: "Approver", type: "select", options: APPROVERS.map((a) => a.name), required: true },
    { key: "value", label: "Document Value", type: "currency", min: 0, required: true },
    { key: "submittedOn", label: "Submitted On", type: "date", required: true },
    { key: "ageDays", label: "Age in Days", type: "number", min: 0 },
    { key: "status", label: "Status", type: "select", options: APPROVAL_STATUS, required: true },
    { key: "remarks", label: "Approver Remarks", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Open Tasks", expr: "countWhere:status=Pending", unit: "num", goodWhenUp: false },
    { label: "Value in Approval", expr: "sumWhere:status=Pending:value", unit: "currency", goodWhenUp: false },
    { label: "Avg. Ageing", expr: "avg:ageDays", unit: "num", hint: "Days waiting on a decision", goodWhenUp: false },
    { label: "Approved", expr: "pctWhere:status=Approved", unit: "percent", goodWhenUp: true },
  ],
  charts: [
    { form: "stacked", title: "Approval load by stage", hint: "Task count per stage, split by outcome", by: "stage", stack: "status" },
    { form: "hbar", title: "Value pending per approver", by: "approver", value: "value", unit: "currency", top: 8 },
    { form: "donut", title: "Tasks by document type", by: "docType" },
    { form: "bar", title: "Ageing by stage", hint: "Total waiting days accumulated at each stage", by: "stage", value: "ageDays", unit: "num" },
  ],
  make: (rng, i) => {
    const status = pick(rng, APPROVAL_STATUS);
    const age = status === "Pending" ? intBetween(rng, 1, 21) : intBetween(rng, 0, 9);
    return {
      taskNo: `AP-25-${pad(3000 + i)}`,
      docType: pick(rng, ["PR", "PO", "RFQ", "Supplier", "TCO", "GRN"]),
      docNo: `${pick(rng, ["PR", "PO", "RFQ", "SUP", "TCO", "GRN"])}-25-${pad(intBetween(rng, 1000, 4999))}`,
      unit: pick(rng, UNITS),
      stage: pick(rng, APPROVAL_STAGES),
      approver: pick(rng, APPROVERS).name,
      value: round(intBetween(rng, 2_000, 480_000), 0),
      submittedOn: offsetISO(-age),
      ageDays: age,
      status,
      remarks: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   RFQ
   ══════════════════════════════════════════════════════════════════════════ */

const RFQ_STATUS = ["Draft", "Invited", "Open", "Closed", "Cancelled"] as const;

export const rfqSpec: DatasetSpec = {
  key: "rfq",
  entity: "RFQ",
  entityPlural: "RFQs",
  idField: "rfqNo",
  idPrefix: "RFQ",
  statusField: "status",
  statusOptions: RFQ_STATUS,
  searchFields: ["rfqNo", "title", "category", "unit"],
  seedCount: 72,
  columns: [
    { key: "rfqNo", label: "RFQ No.", type: "mono", width: "132px" },
    { key: "title", label: "RFQ Title" },
    { key: "category", label: "Category", type: "chip", secondary: true },
    { key: "unit", label: "Unit", secondary: true },
    { key: "invited", label: "Invited", type: "num", align: "right" },
    { key: "responded", label: "Responded", type: "num", align: "right" },
    { key: "responseRate", label: "Response", type: "progress", align: "right" },
    { key: "estValue", label: "Est. Value", type: "currency", align: "right" },
    { key: "issuedOn", label: "Issued", type: "date", secondary: true },
    { key: "closingOn", label: "Closing", type: "date" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "title", label: "RFQ Title", type: "text", required: true, span: 2, placeholder: "e.g. Q3 Single Jersey Fabric — Knit Unit" },
    { key: "category", label: "Item Category", type: "select", options: ITEM_CATEGORIES, required: true },
    { key: "unit", label: "Business Unit", type: "select", options: UNITS, required: true },
    { key: "invited", label: "Suppliers Invited", type: "number", min: 1, max: 20, required: true },
    { key: "responded", label: "Responses Received", type: "number", min: 0, max: 20 },
    { key: "estValue", label: "Estimated Value", type: "currency", min: 0, required: true },
    { key: "issuedOn", label: "Issued On", type: "date", required: true },
    { key: "closingOn", label: "Closing On", type: "date", required: true },
    { key: "incoterm", label: "Incoterm", type: "select", options: INCOTERMS },
    { key: "status", label: "Status", type: "select", options: RFQ_STATUS, required: true },
    { key: "scope", label: "Scope of Supply", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Active RFQs", expr: "countWhere:status=Open", unit: "num", goodWhenUp: true },
    { label: "RFQ Value", expr: "sum:estValue", unit: "currency" },
    { label: "Avg. Response Rate", expr: "avg:responseRate", unit: "percent", goodWhenUp: true },
    { label: "Closed Events", expr: "countWhere:status=Closed", unit: "num" },
  ],
  charts: [
    { form: "area", title: "RFQ value issued per month", by: "issuedOn", value: "estValue", unit: "currency" },
    { form: "grouped", title: "Invitations versus responses", hint: "Supplier engagement by category", by: "category", series: [{ key: "invited", label: "Invited" }, { key: "responded", label: "Responded" }], unit: "num" },
    { form: "donut", title: "RFQs by status", by: "status" },
    { form: "hbar", title: "RFQ value by unit", by: "unit", value: "estValue", unit: "currency", top: 6 },
  ],
  make: (rng, i) => {
    const invited = intBetween(rng, 3, 12);
    const status = pick(rng, RFQ_STATUS);
    const responded = status === "Draft" ? 0 : Math.min(invited, intBetween(rng, 1, invited));
    const cat = pick(rng, ITEM_CATEGORIES);
    return {
      rfqNo: `RFQ-25-${pad(4000 + i)}`,
      title: `${cat} — ${pick(rng, SHORT_UNITS)} ${pick(rng, ["Q1", "Q2", "Q3", "Q4"])} Buy`,
      category: cat,
      unit: pick(rng, UNITS),
      invited,
      responded,
      responseRate: Math.round((responded / invited) * 100),
      estValue: round(intBetween(rng, 8_000, 620_000), 0),
      issuedOn: offsetISO(-intBetween(rng, 2, 180)),
      closingOn: offsetISO(intBetween(rng, -60, 30)),
      incoterm: pick(rng, INCOTERMS),
      status,
      scope: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   SUPPLIER QUOTATION
   ══════════════════════════════════════════════════════════════════════════ */

const QUOTE_STATUS = ["Received", "Under Evaluation", "Qualified", "Disqualified", "Expired"] as const;

export const quotationSpec: DatasetSpec = {
  key: "quotation",
  entity: "Quotation",
  entityPlural: "Quotations",
  idField: "quoteNo",
  idPrefix: "QT",
  statusField: "status",
  statusOptions: QUOTE_STATUS,
  searchFields: ["quoteNo", "rfqNo", "supplier", "itemCode"],
  seedCount: 130,
  columns: [
    { key: "quoteNo", label: "Quote No.", type: "mono", width: "126px" },
    { key: "rfqNo", label: "RFQ Ref.", type: "mono", secondary: true },
    { key: "supplier", label: "Supplier" },
    { key: "itemCode", label: "Item", type: "mono", secondary: true },
    { key: "qty", label: "Qty", type: "num", align: "right" },
    { key: "unitPrice", label: "Unit Price", type: "currency", align: "right" },
    { key: "totalValue", label: "Total Value", type: "currency", align: "right" },
    { key: "leadTimeDays", label: "Lead (d)", type: "num", align: "right", secondary: true },
    { key: "incoterm", label: "Incoterm", type: "chip", secondary: true },
    { key: "paymentTerm", label: "Payment Term", secondary: true },
    { key: "techScore", label: "Tech Score", type: "score", align: "right" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "rfqNo", label: "RFQ Reference", type: "text", required: true },
    { key: "supplier", label: "Supplier", type: "select", options: SUPPLIERS, required: true },
    { key: "itemCode", label: "Item Code", type: "select", options: ITEMS.map((it) => it.code), required: true },
    { key: "qty", label: "Offered Quantity", type: "number", min: 1, required: true },
    { key: "unitPrice", label: "Unit Price", type: "currency", min: 0, step: 0.01, required: true },
    { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
    { key: "totalValue", label: "Total Value", type: "currency", derived: (r) => round(Number(r.qty || 0) * Number(r.unitPrice || 0), 2), help: "Quantity × unit price" },
    { key: "leadTimeDays", label: "Lead Time (days)", type: "number", min: 1, max: 240, required: true },
    { key: "incoterm", label: "Incoterm", type: "select", options: INCOTERMS, required: true },
    { key: "paymentTerm", label: "Payment Term", type: "select", options: PAYMENT_TERMS, required: true },
    { key: "validTill", label: "Valid Till", type: "date", required: true },
    { key: "techScore", label: "Technical Score", type: "number", min: 0, max: 100 },
    { key: "status", label: "Status", type: "select", options: QUOTE_STATUS, required: true },
    { key: "specification", label: "Specification Notes", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Quotations", expr: "count", unit: "num" },
    { label: "Quoted Value", expr: "sum:totalValue", unit: "currency" },
    { label: "Avg. Lead Time", expr: "avg:leadTimeDays", unit: "num", hint: "Days from order to delivery", goodWhenUp: false },
    { label: "Qualified", expr: "pctWhere:status=Qualified", unit: "percent", goodWhenUp: true },
  ],
  charts: [
    { form: "hbar", title: "Quoted value by supplier", by: "supplier", value: "totalValue", unit: "currency", top: 8 },
    { form: "donut", title: "Quotations by status", by: "status" },
    { form: "bar", title: "Average lead time by incoterm", by: "incoterm", value: "leadTimeDays", unit: "num" },
    { form: "stacked", title: "Payment terms offered by supplier", hint: "Quotation count per supplier, split by term", by: "supplier", stack: "paymentTerm" },
  ],
  make: (rng, i) => {
    // Every quotation against one RFQ quotes the same item and the same
    // requirement — that is what makes the comparative statement meaningful.
    const rfqIndex = intBetween(rng, 0, 71);
    const item = ITEMS[rfqIndex % ITEMS.length];
    const qty = 500 + ((rfqIndex * 137) % 24_500);
    const price = round(item.rate * (0.85 + rng() * 0.4), 3);
    return {
      quoteNo: `QT-25-${pad(5000 + i)}`,
      rfqNo: `RFQ-25-${pad(4000 + rfqIndex)}`,
      supplier: pick(rng, SUPPLIERS),
      itemCode: item.code,
      itemName: item.name,
      qty,
      unitPrice: price,
      currency: pick(rng, CURRENCIES),
      totalValue: round(qty * price, 0),
      leadTimeDays: intBetween(rng, 12, 120),
      incoterm: pick(rng, INCOTERMS),
      paymentTerm: pick(rng, PAYMENT_TERMS),
      validTill: offsetISO(intBetween(rng, -20, 75)),
      techScore: intBetween(rng, 58, 98),
      status: pick(rng, QUOTE_STATUS),
      specification: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   TCO EVALUATION
   ══════════════════════════════════════════════════════════════════════════ */

const TCO_STATUS = ["Draft", "Evaluated", "Recommended", "Approved", "Rejected"] as const;

export const tcoSpec: DatasetSpec = {
  key: "tco",
  entity: "TCO Evaluation",
  entityPlural: "TCO Evaluations",
  idField: "tcoNo",
  idPrefix: "TCO",
  statusField: "status",
  statusOptions: TCO_STATUS,
  searchFields: ["tcoNo", "rfqNo", "supplier", "itemCode"],
  seedCount: 84,
  columns: [
    { key: "tcoNo", label: "TCO No.", type: "mono", width: "126px" },
    { key: "supplier", label: "Supplier" },
    { key: "itemCode", label: "Item", type: "mono", secondary: true },
    { key: "qty", label: "Qty", type: "num", align: "right", secondary: true },
    { key: "basePrice", label: "Base Price", type: "currency", align: "right" },
    { key: "freight", label: "Freight", type: "currency", align: "right", secondary: true },
    { key: "duty", label: "Duty & Tax", type: "currency", align: "right", secondary: true },
    { key: "financeCost", label: "Finance Cost", type: "currency", align: "right", secondary: true },
    { key: "qualityRisk", label: "Quality Risk", type: "currency", align: "right", secondary: true },
    { key: "tcoTotal", label: "Total TCO", type: "currency", align: "right" },
    { key: "tcoPerUnit", label: "TCO / Unit", type: "currency", align: "right" },
    { key: "rank", label: "Rank", type: "num", align: "center" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "rfqNo", label: "RFQ Reference", type: "text", required: true },
    { key: "supplier", label: "Supplier", type: "select", options: SUPPLIERS, required: true },
    { key: "itemCode", label: "Item Code", type: "select", options: ITEMS.map((it) => it.code), required: true },
    { key: "qty", label: "Quantity", type: "number", min: 1, required: true },
    { key: "basePrice", label: "Base Price", type: "currency", min: 0, required: true, help: "Ex-works value of the offer" },
    { key: "freight", label: "Freight & Handling", type: "currency", min: 0, required: true },
    { key: "duty", label: "Duty, Tax & Clearance", type: "currency", min: 0, required: true },
    { key: "financeCost", label: "Cost of Payment Terms", type: "currency", min: 0 },
    { key: "qualityRisk", label: "Expected Quality Cost", type: "currency", min: 0, help: "Rejection and rework provision" },
    {
      key: "tcoTotal",
      label: "Total Cost of Ownership",
      type: "currency",
      derived: (r) =>
        round(
          Number(r.basePrice || 0) + Number(r.freight || 0) + Number(r.duty || 0) + Number(r.financeCost || 0) + Number(r.qualityRisk || 0),
          2,
        ),
      help: "Base + freight + duty + finance + quality",
    },
    {
      key: "tcoPerUnit",
      label: "TCO per Unit",
      type: "currency",
      derived: (r) => {
        const total =
          Number(r.basePrice || 0) + Number(r.freight || 0) + Number(r.duty || 0) + Number(r.financeCost || 0) + Number(r.qualityRisk || 0);
        const q = Number(r.qty || 0);
        return q > 0 ? round(total / q, 4) : 0;
      },
    },
    { key: "rank", label: "Rank", type: "number", min: 1, max: 20 },
    { key: "status", label: "Status", type: "select", options: TCO_STATUS, required: true },
    { key: "recommendation", label: "Recommendation", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Evaluations", expr: "count", unit: "num" },
    { label: "Total Cost Evaluated", expr: "sum:tcoTotal", unit: "currency" },
    { label: "Non-price Share", expr: "ratio:freight+duty+financeCost+qualityRisk:tcoTotal", unit: "percent", hint: "Cost that is not base price", goodWhenUp: false },
    { label: "Recommended", expr: "countWhere:status=Recommended", unit: "num", goodWhenUp: true },
  ],
  charts: [
    { form: "grouped", title: "Where total cost accumulates", hint: "Cost components by supplier", by: "supplier", series: [{ key: "basePrice", label: "Base price" }, { key: "freight", label: "Freight" }, { key: "duty", label: "Duty & tax" }, { key: "qualityRisk", label: "Quality risk" }], unit: "currency" },
    { form: "hbar", title: "Total TCO by supplier", by: "supplier", value: "tcoTotal", unit: "currency", top: 8 },
    { form: "donut", title: "Evaluations by status", by: "status" },
    { form: "bar", title: "Quality risk provision by item", by: "itemCode", value: "qualityRisk", unit: "currency" },
  ],
  make: (rng, i) => {
    // Same rule as quotations: one RFQ, one item, one requirement quantity.
    const rfqIndex = intBetween(rng, 0, 71);
    const item = ITEMS[rfqIndex % ITEMS.length];
    const qty = 500 + ((rfqIndex * 137) % 24_500);
    const base = round(qty * item.rate * (0.9 + rng() * 0.3), 0);
    const freight = round(base * (0.03 + rng() * 0.09), 0);
    const duty = round(base * (0.02 + rng() * 0.11), 0);
    const finance = round(base * (0.005 + rng() * 0.03), 0);
    const quality = round(base * (0.004 + rng() * 0.04), 0);
    const total = base + freight + duty + finance + quality;
    return {
      tcoNo: `TCO-25-${pad(6000 + i)}`,
      rfqNo: `RFQ-25-${pad(4000 + rfqIndex)}`,
      supplier: pick(rng, SUPPLIERS),
      itemCode: item.code,
      qty,
      basePrice: base,
      freight,
      duty,
      financeCost: finance,
      qualityRisk: quality,
      tcoTotal: total,
      tcoPerUnit: round(total / qty, 4),
      rank: intBetween(rng, 1, 6),
      status: pick(rng, TCO_STATUS),
      recommendation: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   SUPPLIER MASTER
   ══════════════════════════════════════════════════════════════════════════ */

const SUPPLIER_STATUS = ["Applied", "Prequalified", "Audited", "Approved", "Suspended", "Blacklisted"] as const;

export const supplierSpec: DatasetSpec = {
  key: "supplier",
  entity: "Supplier",
  entityPlural: "Suppliers",
  idField: "code",
  idPrefix: "SUP",
  statusField: "status",
  statusOptions: SUPPLIER_STATUS,
  searchFields: ["code", "name", "category", "country", "contact"],
  seedCount: 64,
  columns: [
    { key: "code", label: "Code", type: "mono", width: "110px" },
    { key: "name", label: "Supplier Name" },
    { key: "category", label: "Class", type: "chip" },
    { key: "country", label: "Country", secondary: true },
    { key: "contact", label: "Contact Person", secondary: true },
    { key: "score", label: "Score", type: "score", align: "right" },
    { key: "otdPct", label: "On-time", type: "percent", align: "right" },
    { key: "qualityPct", label: "Quality", type: "percent", align: "right" },
    { key: "spendYtd", label: "Spend YTD", type: "currency", align: "right" },
    { key: "riskBand", label: "Risk", type: "chip", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "name", label: "Supplier Name", type: "text", required: true, span: 2 },
    { key: "category", label: "Classification", type: "select", options: CATEGORIES, required: true, help: "RMS · FGS · CAPEX" },
    { key: "country", label: "Country", type: "select", options: COUNTRIES, required: true },
    { key: "contact", label: "Contact Person", type: "text", required: true },
    { key: "phone", label: "Phone", type: "text", placeholder: "+8801XXXXXXXXX" },
    { key: "email", label: "Email", type: "text", placeholder: "sales@supplier.com", span: 2 },
    { key: "score", label: "Overall Score", type: "number", min: 0, max: 100 },
    { key: "otdPct", label: "On-time Delivery %", type: "number", min: 0, max: 100 },
    { key: "qualityPct", label: "Quality Acceptance %", type: "number", min: 0, max: 100 },
    { key: "spendYtd", label: "Spend YTD", type: "currency", min: 0 },
    { key: "riskBand", label: "Risk Band", type: "select", options: ["Low", "Medium", "High"] },
    { key: "docStatus", label: "Document Status", type: "select", options: ["Complete", "Partial", "Expired"] },
    { key: "bankAccount", label: "Bank Account", type: "text", placeholder: "IBAN / Account No." },
    { key: "bankName", label: "Bank Name", type: "text" },
    { key: "status", label: "Status", type: "select", options: SUPPLIER_STATUS, required: true },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Active Panel", expr: "countWhere:status=Approved", unit: "num", goodWhenUp: true },
    { label: "Spend YTD", expr: "sum:spendYtd", unit: "currency" },
    { label: "Avg. Supplier Score", expr: "avg:score", unit: "num", goodWhenUp: true },
    { label: "High-risk Suppliers", expr: "countWhere:riskBand=High", unit: "num", goodWhenUp: false },
  ],
  charts: [
    { form: "hbar", title: "Spend by supplier", by: "name", value: "spendYtd", unit: "currency", top: 8 },
    { form: "donut", title: "Panel by classification", hint: "RMS, FGS and CAPEX split", by: "category" },
    { form: "bar", title: "Average score by country", by: "country", value: "score", unit: "num" },
    { form: "stacked", title: "Risk profile by classification", by: "category", stack: "riskBand" },
  ],
  make: (rng, i) => {
    const name = SUPPLIERS[i % SUPPLIERS.length];
    const suffix = i >= SUPPLIERS.length ? ` (${["Unit II", "Trading", "Intl.", "Group"][Math.floor(i / SUPPLIERS.length) - 1] ?? "Div."})` : "";
    const score = intBetween(rng, 52, 97);
    return {
      code: `SUP-${pad(100 + i, 3)}`,
      name: `${name}${suffix}`,
      category: pick(rng, CATEGORIES),
      country: pick(rng, COUNTRIES),
      contact: pick(rng, PEOPLE).name,
      phone: `+8801${intBetween(rng, 300, 999)}-${intBetween(rng, 100000, 999999)}`,
      email: `sales@${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}.com`,
      score,
      otdPct: intBetween(rng, 62, 99),
      qualityPct: intBetween(rng, 70, 100),
      spendYtd: round(intBetween(rng, 15_000, 1_450_000), 0),
      riskBand: score > 82 ? "Low" : score > 68 ? "Medium" : "High",
      docStatus: pick(rng, ["Complete", "Partial", "Expired"]),
      bankAccount: `BD${intBetween(rng, 10, 99)}SGIT${intBetween(rng, 100000, 999999)}`,
      bankName: pick(rng, ["City Bank", "BRAC Bank", "HSBC", "Standard Chartered", "Eastern Bank"]),
      status: pick(rng, SUPPLIER_STATUS),
      docType: pick(rng, DOC_TYPES),
      notes: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   PURCHASE ORDER
   ══════════════════════════════════════════════════════════════════════════ */

const PO_STATUS = [
  "Draft",
  "Pending",
  "Approved",
  "Released",
  "Acknowledged",
  "Partially Received",
  "Closed",
  "Cancelled",
] as const;

export const poSpec: DatasetSpec = {
  key: "po",
  entity: "Purchase Order",
  entityPlural: "Purchase Orders",
  idField: "poNo",
  idPrefix: "PO",
  statusField: "status",
  statusOptions: PO_STATUS,
  searchFields: ["poNo", "supplier", "unit", "itemCategory"],
  seedCount: 118,
  columns: [
    { key: "poNo", label: "PO No.", type: "mono", width: "128px" },
    { key: "supplier", label: "Supplier" },
    { key: "unit", label: "Unit", secondary: true },
    { key: "itemCategory", label: "Category", type: "chip", secondary: true },
    { key: "qty", label: "Qty", type: "num", align: "right" },
    { key: "value", label: "Order Value", type: "currency", align: "right" },
    { key: "orderDate", label: "Order Date", type: "date", secondary: true },
    { key: "deliveryDate", label: "Delivery", type: "date" },
    { key: "receivedPct", label: "Received", type: "progress", align: "right" },
    { key: "ackStatus", label: "Ack.", type: "chip", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "supplier", label: "Supplier", type: "select", options: SUPPLIERS, required: true, span: 2 },
    { key: "unit", label: "Business Unit", type: "select", options: UNITS, required: true, span: 2 },
    { key: "itemCategory", label: "Item Category", type: "select", options: ITEM_CATEGORIES, required: true },
    { key: "currency", label: "Currency", type: "select", options: CURRENCIES },
    { key: "qty", label: "Order Quantity", type: "number", min: 1, required: true },
    { key: "value", label: "Order Value", type: "currency", min: 0, required: true },
    { key: "orderDate", label: "Order Date", type: "date", required: true },
    { key: "deliveryDate", label: "Delivery Date", type: "date", required: true },
    { key: "incoterm", label: "Incoterm", type: "select", options: INCOTERMS },
    { key: "paymentTerm", label: "Payment Term", type: "select", options: PAYMENT_TERMS },
    { key: "receivedPct", label: "Received %", type: "number", min: 0, max: 100 },
    { key: "ackStatus", label: "Acknowledgement", type: "select", options: ["Pending", "Acknowledged", "Declined"] },
    { key: "status", label: "Status", type: "select", options: PO_STATUS, required: true },
    { key: "terms", label: "Special Terms", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "Open Orders", expr: "countWhere:status=Released", unit: "num" },
    { label: "Order Book Value", expr: "sum:value", unit: "currency" },
    { label: "On-time Delivery", expr: "avg:otdScore", unit: "percent", goodWhenUp: true },
    { label: "Awaiting Acknowledgement", expr: "countWhere:ackStatus=Pending", unit: "num", goodWhenUp: false },
  ],
  charts: [
    { form: "area", title: "Order value released per month", by: "orderDate", value: "value", unit: "currency" },
    { form: "hbar", title: "Order book by supplier", by: "supplier", value: "value", unit: "currency", top: 8 },
    { form: "stacked", title: "Order status by business unit", by: "unit", stack: "status" },
    { form: "donut", title: "Order value by category", hint: "Share of the order book", by: "itemCategory" },
  ],
  make: (rng, i) => {
    const status = pick(rng, PO_STATUS);
    const qty = intBetween(rng, 300, 40_000);
    const received =
      status === "Closed" ? 100 : status === "Partially Received" ? intBetween(rng, 20, 90) : status === "Released" || status === "Acknowledged" ? intBetween(rng, 0, 30) : 0;
    return {
      poNo: `PO-25-${pad(7000 + i)}`,
      supplier: pick(rng, SUPPLIERS),
      unit: pick(rng, UNITS),
      itemCategory: pick(rng, ITEM_CATEGORIES),
      currency: pick(rng, CURRENCIES),
      qty,
      value: round(intBetween(rng, 4_000, 720_000), 0),
      orderDate: offsetISO(-intBetween(rng, 3, 300)),
      deliveryDate: offsetISO(intBetween(rng, -70, 90)),
      incoterm: pick(rng, INCOTERMS),
      paymentTerm: pick(rng, PAYMENT_TERMS),
      receivedPct: received,
      otdScore: intBetween(rng, 60, 100),
      ackStatus: status === "Draft" || status === "Pending" ? "Pending" : pick(rng, ["Acknowledged", "Acknowledged", "Pending", "Declined"]),
      status,
      terms: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   MTR & SHIPMENT
   ══════════════════════════════════════════════════════════════════════════ */

const MTR_STATUS = ["Submitted", "Under Review", "Verified", "Cleared", "Rejected"] as const;

export const mtrSpec: DatasetSpec = {
  key: "mtr",
  entity: "MTR",
  entityPlural: "MTRs",
  idField: "mtrNo",
  idPrefix: "MTR",
  statusField: "status",
  statusOptions: MTR_STATUS,
  searchFields: ["mtrNo", "poNo", "supplier", "heatNo", "itemCode"],
  seedCount: 76,
  columns: [
    { key: "mtrNo", label: "MTR No.", type: "mono", width: "126px" },
    { key: "poNo", label: "PO Ref.", type: "mono", secondary: true },
    { key: "supplier", label: "Supplier" },
    { key: "itemCode", label: "Item", type: "mono", secondary: true },
    { key: "heatNo", label: "Heat / Lot", type: "mono", secondary: true },
    { key: "qty", label: "Qty", type: "num", align: "right" },
    { key: "submittedOn", label: "Submitted", type: "date", secondary: true },
    { key: "reviewer", label: "Reviewer", secondary: true },
    { key: "result", label: "Result", type: "status" },
    { key: "shipmentStatus", label: "Shipment", type: "chip" },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "poNo", label: "PO Reference", type: "text", required: true },
    { key: "supplier", label: "Supplier", type: "select", options: SUPPLIERS, required: true },
    { key: "itemCode", label: "Item Code", type: "select", options: ITEMS.map((it) => it.code), required: true },
    { key: "heatNo", label: "Heat / Lot No.", type: "text", required: true },
    { key: "qty", label: "Lot Quantity", type: "number", min: 1, required: true },
    { key: "submittedOn", label: "Submitted On", type: "date", required: true },
    { key: "reviewer", label: "Technical Reviewer", type: "select", options: PEOPLE.map((p) => p.name) },
    { key: "result", label: "Test Result", type: "select", options: ["Pending", "Pass", "Fail"], required: true },
    { key: "shipmentStatus", label: "Shipment Status", type: "select", options: ["Blocked", "Approved", "In Transit", "Arrived"], required: true },
    { key: "status", label: "Status", type: "select", options: MTR_STATUS, required: true },
    { key: "findings", label: "Review Findings", type: "textarea", span: 2 },
  ],
  kpis: [
    { label: "MTRs Submitted", expr: "count", unit: "num" },
    { label: "Pass Rate", expr: "pctWhere:result=Pass", unit: "percent", goodWhenUp: true },
    { label: "Shipments Blocked", expr: "countWhere:shipmentStatus=Blocked", unit: "num", goodWhenUp: false },
    { label: "Quantity Under Gate", expr: "sumWhere:shipmentStatus=Blocked:qty", unit: "num", goodWhenUp: false },
  ],
  charts: [
    { form: "stacked", title: "MTR result by supplier", hint: "Pass, fail and pending per supplier", by: "supplier", stack: "result" },
    { form: "donut", title: "Shipment gate position", by: "shipmentStatus" },
    { form: "bar", title: "Quantity submitted by item", by: "itemCode", value: "qty", unit: "num" },
    { form: "area", title: "MTR submissions over time", by: "submittedOn", unit: "num" },
  ],
  make: (rng, i) => {
    const result = pick(rng, ["Pass", "Pass", "Pass", "Fail", "Pending"]);
    return {
      mtrNo: `MTR-25-${pad(8000 + i)}`,
      poNo: `PO-25-${pad(7000 + intBetween(rng, 0, 117))}`,
      supplier: pick(rng, SUPPLIERS),
      itemCode: pick(rng, ITEMS).code,
      heatNo: `HT-${intBetween(rng, 10000, 99999)}`,
      qty: intBetween(rng, 200, 20_000),
      submittedOn: offsetISO(-intBetween(rng, 1, 140)),
      reviewer: pick(rng, PEOPLE).name,
      result,
      shipmentStatus: result === "Fail" ? "Blocked" : pick(rng, ["Approved", "In Transit", "Arrived", "Blocked"]),
      status: result === "Pending" ? "Under Review" : pick(rng, MTR_STATUS),
      docType: "Mill Test Report",
      findings: "",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   PURCHASE RECONCILIATION
   ══════════════════════════════════════════════════════════════════════════ */

const RECON_STATUS = ["Matched", "Partially Matched", "Variance", "Pending"] as const;

const makeRecon = (prefix: string) => (rng: Rng, i: number): Row => {
  const item = pick(rng, ITEMS);
  const ordered = intBetween(rng, 500, 30_000);
  const received = Math.round(ordered * (0.9 + rng() * 0.12));
  const rejected = Math.round(received * (rng() * 0.08));
  const accepted = received - rejected;
  const variance = ordered - received;
  const status: string =
    variance === 0 && rejected === 0 ? "Matched" : Math.abs(variance) / ordered < 0.02 ? "Partially Matched" : chance(rng, 0.25) ? "Pending" : "Variance";
  return {
    reconNo: `${prefix}-25-${pad(9000 + i)}`,
    poNo: `PO-25-${pad(7000 + intBetween(rng, 0, 117))}`,
    grnNo: `GRN-25-${pad(3000 + intBetween(rng, 0, 119))}`,
    iqcNo: `IQC-25-${pad(4000 + intBetween(rng, 0, 109))}`,
    supplier: pick(rng, SUPPLIERS),
    itemCode: item.code,
    orderedQty: ordered,
    receivedQty: received,
    acceptedQty: accepted,
    rejectedQty: rejected,
    variance,
    variancePct: round((variance / ordered) * 100, 2),
    value: round(accepted * item.rate, 0),
    paymentHold: status === "Variance" ? "Held" : "Released",
    status,
  };
};

const reconColumns = [
  { key: "reconNo", label: "Recon No.", type: "mono" as const, width: "132px" },
  { key: "poNo", label: "PO Ref.", type: "mono" as const },
  { key: "grnNo", label: "GRN Ref.", type: "mono" as const, secondary: true },
  { key: "iqcNo", label: "IQC Ref.", type: "mono" as const, secondary: true },
  { key: "supplier", label: "Supplier", secondary: true },
  { key: "itemCode", label: "Item", type: "mono" as const, secondary: true },
  { key: "orderedQty", label: "Ordered", type: "num" as const, align: "right" as const },
  { key: "receivedQty", label: "Received", type: "num" as const, align: "right" as const },
  { key: "acceptedQty", label: "Accepted", type: "num" as const, align: "right" as const },
  { key: "rejectedQty", label: "Rejected", type: "num" as const, align: "right" as const },
  { key: "variancePct", label: "Variance", type: "delta" as const, align: "right" as const },
  { key: "paymentHold", label: "Payment", type: "chip" as const },
  { key: "status", label: "Status", type: "status" as const },
];

const reconFields = [
  { key: "poNo", label: "PO Reference", type: "text" as const, required: true },
  { key: "grnNo", label: "GRN Reference", type: "text" as const },
  { key: "iqcNo", label: "IQC Reference", type: "text" as const },
  { key: "supplier", label: "Supplier", type: "select" as const, options: SUPPLIERS, span: 2 as const },
  { key: "itemCode", label: "Item Code", type: "select" as const, options: ITEMS.map((it) => it.code), required: true },
  { key: "orderedQty", label: "Ordered Quantity", type: "number" as const, min: 0, required: true },
  { key: "receivedQty", label: "Received Quantity", type: "number" as const, min: 0, required: true },
  { key: "acceptedQty", label: "Accepted Quantity", type: "number" as const, min: 0, required: true },
  { key: "rejectedQty", label: "Rejected Quantity", type: "number" as const, min: 0 },
  {
    key: "variance",
    label: "Quantity Variance",
    type: "number" as const,
    derived: (r: Row) => Number(r.orderedQty || 0) - Number(r.receivedQty || 0),
    help: "Ordered − received",
  },
  { key: "paymentHold", label: "Payment Control", type: "select" as const, options: ["Released", "Held"] },
  { key: "status", label: "Reconciliation Status", type: "select" as const, options: RECON_STATUS, required: true },
];

const reconKpis = [
  { label: "Lines Reconciled", expr: "count", unit: "num" as const },
  { label: "Clean Match Rate", expr: "pctWhere:status=Matched", unit: "percent" as const, goodWhenUp: true },
  { label: "Quantity Variance", expr: "sum:variance", unit: "num" as const, hint: "Ordered minus received", goodWhenUp: false },
  { label: "Payments Held", expr: "countWhere:paymentHold=Held", unit: "num" as const, goodWhenUp: false },
];

const reconCharts = [
  {
    form: "grouped" as const,
    title: "Ordered, received and accepted",
    hint: "Quantity flow across the three-way match, by supplier",
    by: "supplier",
    series: [
      { key: "orderedQty", label: "Ordered" },
      { key: "receivedQty", label: "Received" },
      { key: "acceptedQty", label: "Accepted" },
    ],
    unit: "num" as const,
  },
  { form: "donut" as const, title: "Reconciliation status", by: "status" },
  { form: "pareto" as const, title: "Rejected quantity by item", hint: "Where quantity is lost", by: "itemCode", value: "rejectedQty" },
  { form: "hbar" as const, title: "Value held from payment", by: "supplier", value: "value", unit: "currency" as const, top: 8 },
];

export const purchaseReconSpec: DatasetSpec = {
  key: "purchaseRecon",
  entity: "Reconciliation",
  entityPlural: "Reconciliations",
  idField: "reconNo",
  idPrefix: "PREC",
  statusField: "status",
  statusOptions: RECON_STATUS,
  searchFields: ["reconNo", "poNo", "grnNo", "supplier", "itemCode"],
  seedCount: 104,
  columns: reconColumns,
  fields: reconFields,
  kpis: reconKpis,
  charts: reconCharts,
  make: makeRecon("PREC"),
};

export const inventoryReconSpec: DatasetSpec = {
  ...purchaseReconSpec,
  key: "inventoryRecon",
  idPrefix: "IREC",
  seedCount: 112,
  make: makeRecon("IREC"),
};

/* ══════════════════════════════════════════════════════════════════════════
   SPEND ANALYTICS
   ══════════════════════════════════════════════════════════════════════════ */

export const spendSpec: DatasetSpec = {
  key: "spend",
  entity: "Spend Record",
  entityPlural: "Spend Records",
  idField: "recordNo",
  idPrefix: "SPD",
  statusField: "trend",
  statusOptions: ["Under Budget", "On Budget", "Over Budget"],
  searchFields: ["recordNo", "unit", "category", "supplier", "month"],
  seedCount: 144,
  columns: [
    { key: "recordNo", label: "Record", type: "mono", width: "120px" },
    { key: "month", label: "Period", align: "center" },
    { key: "unit", label: "Business Unit" },
    { key: "category", label: "Category", type: "chip" },
    { key: "supplier", label: "Supplier", secondary: true },
    { key: "spend", label: "Actual Spend", type: "currency", align: "right" },
    { key: "budget", label: "Budget", type: "currency", align: "right", secondary: true },
    { key: "savings", label: "Savings", type: "currency", align: "right" },
    { key: "poCount", label: "Orders", type: "num", align: "right", secondary: true },
    { key: "avgCycleDays", label: "Cycle (d)", type: "num", align: "right", secondary: true },
    { key: "trend", label: "Budget", type: "status" },
  ],
  fields: [
    { key: "month", label: "Period", type: "select", options: MONTHS, required: true },
    { key: "unit", label: "Business Unit", type: "select", options: UNITS, required: true },
    { key: "category", label: "Category", type: "select", options: ITEM_CATEGORIES, required: true },
    { key: "supplier", label: "Supplier", type: "select", options: SUPPLIERS },
    { key: "spend", label: "Actual Spend", type: "currency", min: 0, required: true },
    { key: "budget", label: "Budget", type: "currency", min: 0, required: true },
    { key: "savings", label: "Savings Delivered", type: "currency" },
    { key: "poCount", label: "Purchase Orders", type: "number", min: 0 },
    { key: "avgCycleDays", label: "Avg. Cycle Time (days)", type: "number", min: 0 },
    { key: "trend", label: "Budget Position", type: "select", options: ["Under Budget", "On Budget", "Over Budget"], required: true },
  ],
  kpis: [
    { label: "Total Spend", expr: "sum:spend", unit: "currency", hint: "Actual procurement spend" },
    { label: "Savings Delivered", expr: "sum:savings", unit: "currency", goodWhenUp: true },
    { label: "Budget Utilisation", expr: "ratio:spend:budget", unit: "percent", hint: "Spend against budget", goodWhenUp: false },
    { label: "Avg. Cycle Time", expr: "avg:avgCycleDays", unit: "num", hint: "PR to PO, in days", goodWhenUp: false },
  ],
  charts: [
    { form: "grouped", title: "Spend against budget by month", hint: "Actual spend versus approved budget", by: "month", series: [{ key: "spend", label: "Actual spend" }, { key: "budget", label: "Budget" }], unit: "currency" },
    { form: "hbar", title: "Spend by category", by: "category", value: "spend", unit: "currency", top: 6 },
    { form: "stacked", title: "Spend mix by unit", hint: "Order count per unit, split by category", by: "unit", stack: "category" },
    { form: "area", title: "Savings delivered by month", by: "month", value: "savings", unit: "currency" },
  ],
  make: (rng, i) => {
    const spend = round(intBetween(rng, 40_000, 900_000), 0);
    const budget = round(spend * (0.82 + rng() * 0.4), 0);
    return {
      recordNo: `SPD-25-${pad(100 + i)}`,
      month: MONTHS[i % 12],
      unit: pick(rng, UNITS),
      category: pick(rng, ITEM_CATEGORIES),
      supplier: pick(rng, SUPPLIERS),
      spend,
      budget,
      savings: round(Math.max(0, budget - spend) * (0.4 + rng() * 0.6), 0),
      poCount: intBetween(rng, 3, 48),
      avgCycleDays: intBetween(rng, 6, 34),
      trend: spend > budget * 1.02 ? "Over Budget" : spend > budget * 0.97 ? "On Budget" : "Under Budget",
    };
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   ITEM MASTER
   ══════════════════════════════════════════════════════════════════════════ */

export const itemSpec: DatasetSpec = {
  key: "item",
  entity: "Item",
  entityPlural: "Items",
  idField: "code",
  idPrefix: "ITM",
  statusField: "status",
  statusOptions: ["Active", "Inactive", "Under Review"],
  searchFields: ["code", "name", "category"],
  seedCount: ITEMS.length,
  columns: [
    { key: "code", label: "Item Code", type: "mono", width: "120px" },
    { key: "name", label: "Description" },
    { key: "category", label: "Category", type: "chip" },
    { key: "uom", label: "UOM", align: "center" },
    { key: "rate", label: "Std. Rate", type: "currency", align: "right" },
    { key: "leadTime", label: "Lead (d)", type: "num", align: "right", secondary: true },
    { key: "moq", label: "MOQ", type: "num", align: "right", secondary: true },
    { key: "status", label: "Status", type: "status" },
  ],
  fields: [
    { key: "code", label: "Item Code", type: "text", required: true },
    { key: "name", label: "Description", type: "text", required: true, span: 2 },
    { key: "category", label: "Category", type: "select", options: ITEM_CATEGORIES, required: true },
    { key: "uom", label: "UOM", type: "select", options: ["KG", "PCS", "YDS", "MTR", "LTR", "SET", "CONE", "GRS"], required: true },
    { key: "rate", label: "Standard Rate", type: "currency", min: 0, step: 0.01, required: true },
    { key: "leadTime", label: "Lead Time (days)", type: "number", min: 0 },
    { key: "moq", label: "Minimum Order Qty", type: "number", min: 0 },
    { key: "status", label: "Status", type: "select", options: ["Active", "Inactive", "Under Review"], required: true },
  ],
  kpis: [
    { label: "Items", expr: "count", unit: "num" },
    { label: "Avg. Standard Rate", expr: "avg:rate", unit: "currency" },
    { label: "Avg. Lead Time", expr: "avg:leadTime", unit: "num", goodWhenUp: false },
    { label: "Active Items", expr: "pctWhere:status=Active", unit: "percent", goodWhenUp: true },
  ],
  charts: [
    { form: "donut", title: "Items by category", by: "category" },
    { form: "hbar", title: "Standard rate by item", by: "name", value: "rate", unit: "currency", top: 8 },
    { form: "bar", title: "Lead time by category", by: "category", value: "leadTime", unit: "num" },
    { form: "stacked", title: "Item status by category", by: "category", stack: "status" },
  ],
  make: (rng, i) => {
    const item = ITEMS[i % ITEMS.length];
    return {
      code: item.code,
      name: item.name,
      category: item.category,
      uom: item.uom,
      rate: item.rate,
      leadTime: intBetween(rng, 7, 90),
      moq: intBetween(rng, 50, 5000),
      status: pick(rng, ["Active", "Active", "Active", "Under Review", "Inactive"]),
    };
  },
};
