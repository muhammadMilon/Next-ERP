import type { DatasetKey } from "@/lib/nav/types";
import { hashString, makeRng } from "@/lib/utils/random";
import {
  approvalSpec,
  demandSpec,
  inventoryReconSpec,
  itemSpec,
  mtrSpec,
  poSpec,
  prSpec,
  purchaseReconSpec,
  quotationSpec,
  rfqSpec,
  spendSpec,
  supplierSpec,
  tcoSpec,
} from "./datasets.purchase";
import {
  grnSpec,
  iqcSpec,
  movementSpec,
  receivingSpec,
  stockSpec,
  warehouseSpec,
} from "./datasets.inventory";
import type { DatasetSpec, Row } from "./types";

export const DATASETS: Record<DatasetKey, DatasetSpec> = {
  pr: prSpec,
  demand: demandSpec,
  approval: approvalSpec,
  rfq: rfqSpec,
  quotation: quotationSpec,
  tco: tcoSpec,
  supplier: supplierSpec,
  po: poSpec,
  mtr: mtrSpec,
  purchaseRecon: purchaseReconSpec,
  spend: spendSpec,
  item: itemSpec,
  receiving: receivingSpec,
  grn: grnSpec,
  iqc: iqcSpec,
  warehouse: warehouseSpec,
  stock: stockSpec,
  movement: movementSpec,
  inventoryRecon: inventoryReconSpec,
};

export const getSpec = (key: DatasetKey): DatasetSpec => DATASETS[key];

/** Deterministic seed — the demo must look like a system of record, not a shuffle. */
export function seedDataset(key: DatasetKey): Row[] {
  const spec = DATASETS[key];
  const rng = makeRng(hashString(key) || 7);
  return Array.from({ length: spec.seedCount }, (_, i) => ({
    id: `${spec.idPrefix}-${i}`,
    ...spec.make(rng, i),
  }));
}

/* ── Status tone ──────────────────────────────────────────────────────────── */

export type Tone = "good" | "warn" | "serious" | "critical" | "info" | "neutral";

const TONES: Record<string, Tone> = {
  // positive / terminal-good
  Approved: "good",
  Accepted: "good",
  Matched: "good",
  Posted: "good",
  Verified: "good",
  Cleared: "good",
  Pass: "good",
  Qualified: "good",
  Released: "good",
  Acknowledged: "good",
  Active: "good",
  Healthy: "good",
  Complete: "good",
  Prequalified: "good",
  Audited: "good",
  Recommended: "good",
  Converted: "good",
  Closed: "good",
  "Put-away": "good",
  "Under Budget": "good",
  Received: "good",
  Arrived: "good",
  Low: "good",

  // in-flight / neutral-informational
  Draft: "neutral",
  Pending: "warn",
  Open: "info",
  Invited: "info",
  Submitted: "info",
  "Under Review": "info",
  "Under Evaluation": "info",
  "In Progress": "info",
  Evaluated: "info",
  Applied: "info",
  Aggregated: "info",
  "In Transit": "info",
  "On Budget": "info",
  Medium: "info",

  // needs attention
  "On Hold": "serious",
  Hold: "serious",
  Held: "serious",
  "Partially Accepted": "warn",
  "Partially Matched": "warn",
  "Partially Received": "warn",
  Returned: "warn",
  Delegated: "warn",
  Variance: "serious",
  Partial: "warn",
  Blocked: "serious",
  Excess: "warn",
  Inactive: "neutral",
  "Under Maintenance": "warn",
  "Under Review ": "info",
  Expired: "serious",
  "Over Budget": "serious",
  High: "critical",

  // failure / terminal-bad
  Rejected: "critical",
  Fail: "critical",
  Cancelled: "critical",
  Declined: "critical",
  Disqualified: "critical",
  Suspended: "critical",
  Blacklisted: "critical",
  Dead: "critical",
  Reversed: "critical",
};

export const statusTone = (value: string): Tone => TONES[value] ?? "neutral";

export const TONE_CLASS: Record<Tone, string> = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warn: "bg-amber-50 text-amber-800 ring-amber-600/25",
  serious: "bg-orange-50 text-orange-800 ring-orange-600/25",
  critical: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-sky-50 text-sky-700 ring-sky-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-400/25",
};

export const TONE_DOT: Record<Tone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  serious: "bg-orange-500",
  critical: "bg-red-500",
  info: "bg-sky-500",
  neutral: "bg-slate-400",
};
