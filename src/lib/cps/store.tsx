"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { addDays, todayISO } from "@/lib/utils/format";
import { buildConsolidationLines, nextSequence, seedCpsState } from "./seed";
import {
  ROLE_ACCESS,
  allocatedQty,
  allocationValue,
  lineValue,
  type CpsAudit,
  type CpsConsolidation,
  type CpsItem,
  type CpsPo,
  type CpsPr,
  type CpsRole,
  type CpsState,
  type CpsSupplier,
  type CpsUnit,
  type CpsUser,
  type ItemCategory,
  type Permission,
  type PrStatus,
} from "./types";

const STORAGE_KEY = "noor-cps:v1";

type Action =
  | { type: "hydrate"; state: CpsState }
  | { type: "setRole"; role: CpsRole }
  | { type: "saveUnit"; unit: CpsUnit }
  | { type: "removeUnit"; id: string }
  | { type: "saveUser"; user: CpsUser }
  | { type: "removeUser"; id: string }
  | { type: "saveItem"; item: CpsItem }
  | { type: "removeItem"; id: string }
  | { type: "saveSupplier"; supplier: CpsSupplier }
  | { type: "removeSupplier"; id: string }
  | { type: "savePr"; pr: CpsPr }
  | { type: "removePr"; id: string }
  | { type: "decidePr"; prNo: string; status: PrStatus; comment: string; approver: string }
  | { type: "saveConsolidation"; consolidation: CpsConsolidation }
  | { type: "confirmConsolidation"; dcNo: string }
  | { type: "removeConsolidation"; dcNo: string }
  | { type: "savePo"; po: CpsPo }
  | { type: "setPoStatus"; poNo: string; status: CpsPo["status"] }
  | { type: "removePo"; id: string }
  | { type: "audit"; entry: CpsAudit }
  | { type: "reset" };

const upsert = <T extends { id: string }>(list: T[], next: T) =>
  list.some((x) => x.id === next.id) ? list.map((x) => (x.id === next.id ? next : x)) : [next, ...list];

function reducer(state: CpsState, action: Action): CpsState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "setRole":
      return { ...state, role: action.role };

    case "saveUnit":
      return { ...state, units: upsert(state.units, action.unit) };
    case "removeUnit":
      return { ...state, units: state.units.filter((u) => u.id !== action.id) };

    case "saveUser":
      return { ...state, users: upsert(state.users, action.user) };
    case "removeUser":
      return { ...state, users: state.users.filter((u) => u.id !== action.id) };

    case "saveItem":
      return { ...state, items: upsert(state.items, action.item) };
    case "removeItem":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "saveSupplier":
      return { ...state, suppliers: upsert(state.suppliers, action.supplier) };
    case "removeSupplier":
      return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.id) };

    case "savePr":
      return { ...state, prs: upsert(state.prs, action.pr) };
    case "removePr":
      return { ...state, prs: state.prs.filter((p) => p.id !== action.id) };

    case "decidePr":
      return {
        ...state,
        prs: state.prs.map((p) =>
          p.prNo === action.prNo
            ? {
                ...p,
                status: action.status,
                approverComment: action.comment,
                approver: action.approver,
                decidedAt: new Date().toISOString(),
              }
            : p,
        ),
      };

    case "saveConsolidation": {
      const list = state.consolidations;
      const next = list.some((c) => c.id === action.consolidation.id)
        ? list.map((c) => (c.id === action.consolidation.id ? action.consolidation : c))
        : [action.consolidation, ...list];
      return { ...state, consolidations: next };
    }

    case "confirmConsolidation": {
      const dc = state.consolidations.find((c) => c.dcNo === action.dcNo);
      if (!dc) return state;
      const sourced = new Set(dc.sourcePrNos);
      return {
        ...state,
        consolidations: state.consolidations.map((c) =>
          c.dcNo === action.dcNo
            ? { ...c, status: "Confirmed", confirmedAt: new Date().toISOString() }
            : c,
        ),
        prs: state.prs.map((p) => (sourced.has(p.prNo) ? { ...p, consolidatedIn: action.dcNo } : p)),
      };
    }

    case "removeConsolidation": {
      const dc = state.consolidations.find((c) => c.dcNo === action.dcNo);
      return {
        ...state,
        consolidations: state.consolidations.filter((c) => c.dcNo !== action.dcNo),
        pos: state.pos.filter((p) => p.dcNo !== action.dcNo),
        prs: dc
          ? state.prs.map((p) => (p.consolidatedIn === action.dcNo ? { ...p, consolidatedIn: undefined } : p))
          : state.prs,
      };
    }

    case "savePo":
      return { ...state, pos: upsert(state.pos, action.po) };
    case "setPoStatus":
      return {
        ...state,
        pos: state.pos.map((p) =>
          p.poNo === action.poNo
            ? {
                ...p,
                status: action.status,
                releasedAt: action.status === "Released" ? new Date().toISOString() : p.releasedAt,
              }
            : p,
        ),
      };
    case "removePo":
      return { ...state, pos: state.pos.filter((p) => p.id !== action.id) };

    case "audit":
      return { ...state, audit: [action.entry, ...state.audit].slice(0, 200) };

    case "reset":
      return { ...seedCpsState(), role: state.role, actor: state.actor };

    default:
      return state;
  }
}

/* ── Derived reads ────────────────────────────────────────────────────────── */

export interface CpsKpis {
  pendingPrs: number;
  approvedPrs: number;
  itemsConsolidated: number;
  posReleased: number;
  cycleDays: number;
  unprocessedApproved: number;
  consolidatedValue: number;
  supplierAllocations: number;
  demandConsolidated: number;
  poValueReleased: number;
}

export function computeKpis(state: CpsState): CpsKpis {
  const pendingPrs = state.prs.filter((p) => p.status === "Pending Approval").length;
  const approved = state.prs.filter((p) => p.status === "Approved");
  const confirmed = state.consolidations.filter((c) => c.status === "Confirmed");
  const items = new Set<string>();
  let allocations = 0;
  let value = 0;
  for (const dc of confirmed) {
    for (const line of dc.lines) {
      items.add(line.uic);
      allocations += line.allocations.length;
      value += allocationValue(line);
    }
  }
  const released = state.pos.filter((p) => p.status === "Released");
  const cycles = released
    .map((po) => {
      const dc = state.consolidations.find((c) => c.dcNo === po.dcNo);
      if (!dc) return null;
      const dates = state.prs
        .filter((p) => dc.sourcePrNos.includes(p.prNo))
        .map((p) => new Date(p.prDate).getTime());
      if (!dates.length) return null;
      const days = (new Date(po.poDate).getTime() - Math.max(...dates)) / 86_400_000;
      return days >= 0 ? days : 0;
    })
    .filter((d): d is number => d !== null);

  return {
    pendingPrs,
    approvedPrs: approved.length,
    itemsConsolidated: items.size,
    posReleased: released.length,
    cycleDays: cycles.length ? Math.round((cycles.reduce((s, d) => s + d, 0) / cycles.length) * 10) / 10 : 0,
    unprocessedApproved: approved.filter((p) => !p.consolidatedIn).length,
    consolidatedValue: value,
    supplierAllocations: allocations,
    demandConsolidated: confirmed.reduce((s, c) => s + c.lines.length, 0),
    poValueReleased: released.reduce(
      (s, po) => s + po.lines.reduce((t, l) => t + lineValue(l.qty, l.unitPrice), 0),
      0,
    ),
  };
}

/** Approved requisitions that have not yet been pulled into a consolidation. */
export const openApprovedPrs = (state: CpsState, category: ItemCategory | "All", period?: string) => {
  const itemsByUic = new Map(state.items.map((i) => [i.uic, i]));
  return state.prs.filter((pr) => {
    if (pr.status !== "Approved" || pr.consolidatedIn) return false;
    if (period && pr.prDate.slice(0, 7) !== period) return false;
    if (category === "All") return true;
    return pr.lines.some((l) => itemsByUic.get(l.uic)?.category === category);
  });
};

/* ── Context ──────────────────────────────────────────────────────────────── */

interface CpsValue {
  hydrated: boolean;
  state: CpsState;
  can: (permission: Permission) => boolean;
  setRole: (role: CpsRole) => void;
  unitByCode: (code: string) => CpsUnit | undefined;
  itemByUic: (uic: string) => CpsItem | undefined;
  supplierByCode: (code: string) => CpsSupplier | undefined;
  kpis: CpsKpis;

  saveUnit: (unit: CpsUnit) => void;
  removeUnit: (unit: CpsUnit) => void;
  saveUser: (user: CpsUser) => void;
  removeUser: (user: CpsUser) => void;
  saveItem: (item: CpsItem) => void;
  removeItem: (item: CpsItem) => void;
  saveSupplier: (supplier: CpsSupplier) => void;
  removeSupplier: (supplier: CpsSupplier) => void;

  nextPrNo: () => string;
  savePr: (pr: CpsPr, note?: string) => void;
  removePr: (pr: CpsPr) => void;
  submitPr: (pr: CpsPr) => void;
  decidePr: (pr: CpsPr, status: Extract<PrStatus, "Approved" | "Rejected" | "Returned">, comment: string) => void;

  nextDcNo: () => string;
  createConsolidation: (input: { period: string; category: ItemCategory | "All"; prNos: string[] }) => CpsConsolidation | null;
  saveConsolidation: (consolidation: CpsConsolidation, note?: string) => void;
  confirmConsolidation: (consolidation: CpsConsolidation) => { ok: boolean; message: string };
  removeConsolidation: (consolidation: CpsConsolidation) => void;

  nextPoNo: () => string;
  draftPoFrom: (dcNo: string, supplierCode: string, today: string) => CpsPo | null;
  savePo: (po: CpsPo, note?: string) => void;
  setPoStatus: (po: CpsPo, status: CpsPo["status"]) => void;
  removePo: (po: CpsPo) => void;

  reset: () => void;
}

const CpsContext = createContext<CpsValue | null>(null);

const EMPTY: CpsState = {
  units: [],
  users: [],
  items: [],
  suppliers: [],
  prs: [],
  consolidations: [],
  pos: [],
  audit: [],
  role: "Admin",
  actor: "System Administrator",
};

export function CpsStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY);
  const hydrated = state.units.length > 0 || state.audit.length > 0;

  useEffect(() => {
    let next: CpsState | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CpsState;
        if (parsed && Array.isArray(parsed.units) && parsed.units.length) next = parsed;
      }
    } catch {
      /* corrupt or unavailable storage — fall back to the deterministic seed */
    }
    dispatch({ type: "hydrate", state: next ?? seedCpsState() });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode — the session still works, it just will not persist */
    }
  }, [state, hydrated]);

  const log = useCallback(
    (action: string, entity: string, ref: string, detail?: string) => {
      dispatch({
        type: "audit",
        entry: {
          id: `aud-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          at: new Date().toISOString(),
          actor: state.actor,
          role: state.role,
          action,
          entity,
          ref,
          detail,
        },
      });
    },
    [state.actor, state.role],
  );

  const value = useMemo<CpsValue>(() => {
    const year = todayISO().slice(0, 4);

    const nextPrNo = () => nextSequence(state.prs.map((p) => p.prNo), "PR", year, 6);
    const nextDcNo = () => nextSequence(state.consolidations.map((c) => c.dcNo), "DC", year, 5);
    const nextPoNo = () => nextSequence(state.pos.map((p) => p.poNo), "PO", year, 5);

    return {
      hydrated,
      state,
      kpis: computeKpis(state),
      can: (permission) => ROLE_ACCESS[state.role][permission],
      setRole: (role) => {
        dispatch({ type: "setRole", role });
        log("Switched role", "Session", role);
      },
      unitByCode: (code) => state.units.find((u) => u.code === code),
      itemByUic: (uic) => state.items.find((i) => i.uic === uic),
      supplierByCode: (code) => state.suppliers.find((s) => s.code === code),

      saveUnit: (unit) => {
        dispatch({ type: "saveUnit", unit });
        log("Saved company unit", "Company Unit", unit.code);
      },
      removeUnit: (unit) => {
        dispatch({ type: "removeUnit", id: unit.id });
        log("Deleted company unit", "Company Unit", unit.code);
      },
      saveUser: (user) => {
        dispatch({ type: "saveUser", user });
        log("Saved company user", "Company User", user.userId);
      },
      removeUser: (user) => {
        dispatch({ type: "removeUser", id: user.id });
        log("Deleted company user", "Company User", user.userId);
      },
      saveItem: (item) => {
        dispatch({ type: "saveItem", item });
        log("Saved item master", "Item", item.uic);
      },
      removeItem: (item) => {
        dispatch({ type: "removeItem", id: item.id });
        log("Deleted item master", "Item", item.uic);
      },
      saveSupplier: (supplier) => {
        dispatch({ type: "saveSupplier", supplier });
        log("Saved supplier master", "Supplier", supplier.code);
      },
      removeSupplier: (supplier) => {
        dispatch({ type: "removeSupplier", id: supplier.id });
        log("Deleted supplier master", "Supplier", supplier.code);
      },

      nextPrNo,
      savePr: (pr, note) => {
        dispatch({ type: "savePr", pr });
        log(note ?? "Saved requisition", "Purchase Requisition", pr.prNo);
      },
      removePr: (pr) => {
        dispatch({ type: "removePr", id: pr.id });
        log("Deleted requisition", "Purchase Requisition", pr.prNo);
      },
      submitPr: (pr) => {
        dispatch({
          type: "savePr",
          pr: { ...pr, status: "Pending Approval", submittedAt: new Date().toISOString() },
        });
        log("Submitted for approval", "Purchase Requisition", pr.prNo);
      },
      decidePr: (pr, status, comment) => {
        dispatch({ type: "decidePr", prNo: pr.prNo, status, comment, approver: state.actor });
        log(`${status} requisition`, "Purchase Requisition", pr.prNo, comment);
      },

      nextDcNo,
      createConsolidation: ({ period, category, prNos }) => {
        const sourced = state.prs.filter((p) => prNos.includes(p.prNo));
        if (!sourced.length) return null;
        const itemsByUic = new Map(state.items.map((i) => [i.uic, i]));
        const filtered =
          category === "All"
            ? sourced
            : sourced.map((pr) => ({
                ...pr,
                lines: pr.lines.filter((l) => itemsByUic.get(l.uic)?.category === category),
              })).filter((pr) => pr.lines.length > 0);
        if (!filtered.length) return null;

        const dcNo = nextDcNo();
        const consolidation: CpsConsolidation = {
          id: `dc-${dcNo}`,
          dcNo,
          period,
          category,
          status: "Draft",
          createdAt: new Date().toISOString(),
          lines: buildConsolidationLines(filtered, state.items),
          sourcePrNos: filtered.map((p) => p.prNo),
        };
        dispatch({ type: "saveConsolidation", consolidation });
        log("Created consolidation", "Demand Consolidation", dcNo, `${filtered.length} requisitions`);
        return consolidation;
      },
      saveConsolidation: (consolidation, note) => {
        dispatch({ type: "saveConsolidation", consolidation });
        log(note ?? "Saved consolidation", "Demand Consolidation", consolidation.dcNo);
      },
      confirmConsolidation: (consolidation) => {
        const bad = consolidation.lines.filter((l) => allocatedQty(l) !== l.demandQty);
        if (bad.length) {
          return {
            ok: false,
            message: `${bad.length} item(s) are not fully allocated — allocated quantity must equal consolidated demand.`,
          };
        }
        dispatch({ type: "confirmConsolidation", dcNo: consolidation.dcNo });
        log("Confirmed consolidation", "Demand Consolidation", consolidation.dcNo);
        return { ok: true, message: `${consolidation.dcNo} confirmed — purchase orders can now be raised.` };
      },
      removeConsolidation: (consolidation) => {
        dispatch({ type: "removeConsolidation", dcNo: consolidation.dcNo });
        log("Deleted consolidation", "Demand Consolidation", consolidation.dcNo);
      },

      nextPoNo,
      draftPoFrom: (dcNo, supplierCode, today) => {
        const dc = state.consolidations.find((c) => c.dcNo === dcNo);
        const supplier = state.suppliers.find((s) => s.code === supplierCode);
        if (!dc || !supplier) return null;
        const lines = dc.lines.flatMap((line) =>
          line.allocations
            .filter((a) => a.supplierCode === supplierCode)
            .map((a) => ({
              id: `${dcNo}-${supplierCode}-${line.uic}`,
              uic: line.uic,
              description: line.description,
              qty: a.qty,
              uom: line.uom,
              unitPrice: a.unitPrice,
            })),
        );
        if (!lines.length) return null;
        const poDate = today;
        return {
          id: `po-${dcNo}-${supplierCode}`,
          poNo: nextPoNo(),
          dcNo,
          supplierCode,
          poDate,
          requiredDate: addDays(poDate, 14),
          paymentTerm: supplier.paymentTerm,
          currency: "BDT",
          status: "Draft",
          remarks: "As per negotiated terms",
          lines,
          createdAt: "",
        };
      },
      savePo: (po, note) => {
        const stamped: CpsPo = { ...po, createdAt: po.createdAt || new Date().toISOString() };
        dispatch({ type: "savePo", po: stamped });
        log(note ?? "Saved purchase order", "Purchase Order", stamped.poNo);
      },
      setPoStatus: (po, status) => {
        dispatch({ type: "setPoStatus", poNo: po.poNo, status });
        log(`${status} purchase order`, "Purchase Order", po.poNo);
      },
      removePo: (po) => {
        dispatch({ type: "removePo", id: po.id });
        log("Deleted purchase order", "Purchase Order", po.poNo);
      },

      reset: () => {
        dispatch({ type: "reset" });
        log("Reset prototype data", "Administration", "All modules");
      },
    };
  }, [state, hydrated, log]);

  return <CpsContext.Provider value={value}>{children}</CpsContext.Provider>;
}

export function useCps() {
  const ctx = useContext(CpsContext);
  if (!ctx) throw new Error("useCps must be used inside <CpsStoreProvider>");
  return ctx;
}
