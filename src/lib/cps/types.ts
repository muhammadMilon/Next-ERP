/** BAY CPS — Central Procurement System (Phase 1) domain model.
 *  Indirect & CAPEX materials only: Unit PR → Approval → Central Consolidation
 *  → Supplier Allocation → Consolidated PO. */

export const CPS_ROLES = [
  "Admin",
  "PR Creator",
  "PR Approver",
  "Central Procurement",
  "Viewer",
] as const;
export type CpsRole = (typeof CPS_ROLES)[number];

export const PERMISSIONS = [
  "createPR",
  "submitPR",
  "approvePR",
  "consolidateDemand",
  "createPO",
  "approvePO",
  "manageMasters",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type AccessMatrix = Record<Permission, boolean>;

export const PERMISSION_LABEL: Record<Permission, string> = {
  createPR: "Create PR",
  submitPR: "Submit PR",
  approvePR: "Approve PR",
  consolidateDemand: "Consolidate Demand",
  createPO: "Create PO",
  approvePO: "Approve PO",
  manageMasters: "Manage Masters",
};

/** What each role may do — the prototype's role-based access control. */
export const ROLE_ACCESS: Record<CpsRole, AccessMatrix> = {
  Admin: {
    createPR: true, submitPR: true, approvePR: true, consolidateDemand: true,
    createPO: true, approvePO: true, manageMasters: true,
  },
  "PR Creator": {
    createPR: true, submitPR: true, approvePR: false, consolidateDemand: false,
    createPO: false, approvePO: false, manageMasters: false,
  },
  "PR Approver": {
    createPR: false, submitPR: false, approvePR: true, consolidateDemand: false,
    createPO: false, approvePO: true, manageMasters: false,
  },
  "Central Procurement": {
    createPR: false, submitPR: false, approvePR: false, consolidateDemand: true,
    createPO: true, approvePO: false, manageMasters: true,
  },
  Viewer: {
    createPR: false, submitPR: false, approvePR: false, consolidateDemand: false,
    createPO: false, approvePO: false, manageMasters: false,
  },
};

export const UOMS = ["Pair", "Pcs", "Set", "Ltr", "Kg", "Box", "Roll", "Nos"] as const;
export type Uom = (typeof UOMS)[number];

export const ITEM_CATEGORY = ["Indirect", "CAPEX"] as const;
export type ItemCategory = (typeof ITEM_CATEGORY)[number];

export const SUB_CATEGORIES = [
  "PPE", "Housekeeping", "Stationery", "Electrical", "Mechanical Spares",
  "IT Equipment", "Utility", "Machinery", "Vehicle", "Civil Works",
] as const;

export const ACTIVE_STATUS = ["Active", "Inactive"] as const;
export type ActiveStatus = (typeof ACTIVE_STATUS)[number];

export const PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PAYMENT_TERMS = ["Advance", "15 Days", "30 Days", "45 Days", "60 Days", "90 Days"] as const;

export interface CpsUnit {
  id: string;
  code: string;
  name: string;
  shortName: string;
  legalName: string;
  procurementAuthority: string;
  defaultApprover: string;
  status: ActiveStatus;
  remarks: string;
}

export interface CpsUser {
  id: string;
  userId: string;
  name: string;
  unitCode: string;
  designation: string;
  email: string;
  role: CpsRole;
  approvalLimit: string;
  status: ActiveStatus;
  authentication: "Password / SSO" | "Password" | "SSO";
  access: AccessMatrix;
}

export interface CpsItem {
  id: string;
  uic: string;
  category: ItemCategory;
  description: string;
  uom: Uom;
  specification: string;
  subCategory: string;
  capexFlag: "Yes" | "No";
  status: ActiveStatus;
  remarks: string;
  /** Indicative rate used for allocation pricing defaults (BDT). */
  indicativeRate: number;
}

export interface CpsSupplier {
  id: string;
  code: string;
  name: string;
  type: "Local" | "Foreign";
  status: ActiveStatus;
  contactPerson: string;
  email: string;
  paymentTerm: string;
  taxReg: string;
  remarks: string;
}

export interface CpsPrLine {
  id: string;
  uic: string;
  description: string;
  specification: string;
  qty: number;
  uom: string;
  requiredDate: string;
  remarks: string;
}

export const PR_STATUS = ["Draft", "Pending Approval", "Approved", "Returned", "Rejected"] as const;
export type PrStatus = (typeof PR_STATUS)[number];

export interface CpsPr {
  id: string;
  prNo: string;
  unitCode: string;
  requester: string;
  prDate: string;
  requiredBy: string;
  priority: Priority;
  purpose: string;
  status: PrStatus;
  lines: CpsPrLine[];
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  approver?: string;
  approverComment?: string;
  /** Set when the PR's demand is pulled into a confirmed consolidation. */
  consolidatedIn?: string;
}

export interface CpsAllocation {
  id: string;
  supplierCode: string;
  qty: number;
  unitPrice: number;
}

export interface CpsConsolidationLine {
  id: string;
  uic: string;
  description: string;
  uom: string;
  demandQty: number;
  unitCount: number;
  prCount: number;
  prNos: string[];
  allocations: CpsAllocation[];
}

export const CONSOLIDATION_STATUS = ["Draft", "Confirmed", "Closed"] as const;
export type ConsolidationStatus = (typeof CONSOLIDATION_STATUS)[number];

export interface CpsConsolidation {
  id: string;
  dcNo: string;
  period: string;
  category: ItemCategory | "All";
  status: ConsolidationStatus;
  createdAt: string;
  confirmedAt?: string;
  lines: CpsConsolidationLine[];
  sourcePrNos: string[];
}

export interface CpsPoLine {
  id: string;
  uic: string;
  description: string;
  qty: number;
  uom: string;
  unitPrice: number;
}

export const PO_STATUS = ["Draft", "Pending Approval", "Released", "Cancelled"] as const;
export type PoStatus = (typeof PO_STATUS)[number];

export interface CpsPo {
  id: string;
  poNo: string;
  dcNo: string;
  supplierCode: string;
  poDate: string;
  requiredDate: string;
  paymentTerm: string;
  currency: "BDT" | "USD";
  status: PoStatus;
  remarks: string;
  lines: CpsPoLine[];
  createdAt: string;
  releasedAt?: string;
}

export interface CpsAudit {
  id: string;
  at: string;
  actor: string;
  role: CpsRole;
  action: string;
  entity: string;
  ref: string;
  detail?: string;
}

export interface CpsState {
  units: CpsUnit[];
  users: CpsUser[];
  items: CpsItem[];
  suppliers: CpsSupplier[];
  prs: CpsPr[];
  consolidations: CpsConsolidation[];
  pos: CpsPo[];
  audit: CpsAudit[];
  /** Whoever is driving the prototype right now. */
  role: CpsRole;
  actor: string;
}

export const lineValue = (qty: number, price: number) => Math.round(qty * price * 100) / 100;

export const poValue = (po: Pick<CpsPo, "lines">) =>
  po.lines.reduce((s, l) => s + lineValue(l.qty, l.unitPrice), 0);

export const allocatedQty = (line: Pick<CpsConsolidationLine, "allocations">) =>
  line.allocations.reduce((s, a) => s + a.qty, 0);

export const allocationValue = (line: Pick<CpsConsolidationLine, "allocations">) =>
  line.allocations.reduce((s, a) => s + lineValue(a.qty, a.unitPrice), 0);

export const prQty = (pr: Pick<CpsPr, "lines">) => pr.lines.reduce((s, l) => s + l.qty, 0);
