/** Navigation contract for the BAY CPS prototype. The shell header, the left
 *  rail and the prototype-navigation screen all read from this one list. */

import type { Permission } from "./types";

export interface CpsNavItem {
  href: string;
  label: string;
  /** Header title on the dark command bar. */
  title: string;
  /** Header breadcrumb, e.g. "Masters / Company Units / New". */
  breadcrumb: string;
  hint: string;
  /** Number shown on the prototype-navigation cards. */
  code?: string;
  permission?: Permission;
}

export interface CpsNavGroup {
  label: string;
  icon: string;
  items: CpsNavItem[];
}

export const CPS_HOME = "/cps";

export const CPS_NAV: CpsNavGroup[] = [
  {
    label: "Dashboard",
    icon: "LayoutDashboard",
    items: [
      {
        href: "/cps/dashboard",
        label: "Dashboard",
        title: "Dashboard",
        breadcrumb: "Central Procurement / Management View",
        hint: "Live procurement position across every unit",
      },
    ],
  },
  {
    label: "Masters",
    icon: "Layers",
    items: [
      {
        href: "/cps/masters/company-units",
        label: "Company Unit",
        title: "Company Unit Registration",
        breadcrumb: "Masters / Company Units / New",
        hint: "Controlled master registration",
        code: "01",
        permission: "manageMasters",
      },
      {
        href: "/cps/masters/company-users",
        label: "Company User",
        title: "Company User Registration",
        breadcrumb: "Masters / Users / New",
        hint: "Controlled master registration",
        code: "02",
        permission: "manageMasters",
      },
      {
        href: "/cps/masters/items",
        label: "Item Master",
        title: "Item Master Registration",
        breadcrumb: "Masters / Indirect & CAPEX Items / New",
        hint: "Controlled master registration",
        code: "03",
        permission: "manageMasters",
      },
      {
        href: "/cps/masters/suppliers",
        label: "Supplier Master",
        title: "Supplier Master Registration",
        breadcrumb: "Masters / Suppliers / New",
        hint: "Controlled master registration",
        code: "04",
        permission: "manageMasters",
      },
    ],
  },
  {
    label: "Purchase Requisition",
    icon: "FileText",
    items: [
      {
        href: "/cps/purchase-requisition",
        label: "Create & Register",
        title: "Purchase Requisition",
        breadcrumb: "Transactions / PR / New",
        hint: "Traceable workflow",
        code: "05",
        permission: "createPR",
      },
      {
        href: "/cps/purchase-requisition/approval",
        label: "PR Approval",
        title: "Purchase Requisition Approval",
        breadcrumb: "Transactions / PR Approval / Pending",
        hint: "Review, decide and record the audit trail",
        permission: "approvePR",
      },
    ],
  },
  {
    label: "Demand Consolidation",
    icon: "GitCompareArrows",
    items: [
      {
        href: "/cps/demand-consolidation",
        label: "Demand Consolidation",
        title: "Demand Consolidation",
        breadcrumb: "Transactions / Central Procurement / New",
        hint: "Traceable workflow",
        code: "06",
        permission: "consolidateDemand",
      },
    ],
  },
  {
    label: "Purchase Order",
    icon: "ClipboardList",
    items: [
      {
        href: "/cps/purchase-order",
        label: "Purchase Order",
        title: "Purchase Order",
        breadcrumb: "Transactions / PO / New from Consolidation",
        hint: "Traceable workflow",
        code: "07",
        permission: "createPO",
      },
    ],
  },
  {
    label: "Reports",
    icon: "ChartColumnBig",
    items: [
      {
        href: "/cps/reports",
        label: "Reports",
        title: "Reports",
        breadcrumb: "Central Procurement / Reports",
        hint: "Registers, item-wise demand and full PO traceability",
      },
    ],
  },
  {
    label: "Administration",
    icon: "ShieldCheck",
    items: [
      {
        href: "/cps/administration",
        label: "Administration",
        title: "Administration",
        breadcrumb: "Central Procurement / Administration",
        hint: "Roles, access matrix, audit trail and prototype data",
      },
      {
        href: "/cps/notes",
        label: "Prototype Notes",
        title: "Prototype Notes & Recommended Next Step",
        breadcrumb: "Central Procurement / Phase 1 Scope",
        hint: "Functional UI concepts to validate during the Functional Blueprint stage",
      },
    ],
  },
];

export const CPS_ITEMS: CpsNavItem[] = CPS_NAV.flatMap((g) => g.items);

export const CPS_HOME_ITEM: CpsNavItem = {
  href: CPS_HOME,
  label: "Prototype Navigation",
  title: "Prototype Navigation",
  breadcrumb: "Simple, controlled, traceable",
  hint: "Phase 1 functions translated into practical web ERP screens",
};

export const CPS_SCREEN_COUNT = CPS_ITEMS.length + 1;

export const findCpsItem = (pathname: string): CpsNavItem =>
  CPS_ITEMS.find((i) => i.href === pathname) ??
  CPS_ITEMS.find((i) => pathname.startsWith(`${i.href}/`)) ??
  CPS_HOME_ITEM;

/** The master-data and transaction cards on the prototype-navigation screen. */
export const CPS_MASTER_CARDS = CPS_NAV.find((g) => g.label === "Masters")!.items;

export const CPS_TRANSACTION_CARDS = [
  CPS_NAV.find((g) => g.label === "Purchase Requisition")!.items[0],
  CPS_NAV.find((g) => g.label === "Demand Consolidation")!.items[0],
  CPS_NAV.find((g) => g.label === "Purchase Order")!.items[0],
];
