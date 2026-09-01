"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type { DatasetKey } from "@/lib/nav/types";
import { getSpec, seedDataset } from "@/lib/data/datasets";
import type { Row } from "@/lib/data/types";
import { uid } from "@/lib/utils/random";

/* ══════════════════════════════════════════════════════════════════════════
   State
   ══════════════════════════════════════════════════════════════════════════
   Only the *delta* against the deterministic seed is persisted, so the
   browser store stays small and a reset is a single key removal. */

export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  action: "created" | "updated" | "deleted" | "approved" | "rejected" | "held" | "exported" | "signed-in";
  entity: string;
  ref: string;
  by: string;
  href?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  tone: "info" | "warn" | "good" | "critical";
  href?: string;
}

interface Delta {
  created: Row[];
  updated: Record<string, Row>;
  deleted: string[];
}

interface State {
  hydrated: boolean;
  user: AuthUser | null;
  deltas: Partial<Record<DatasetKey, Delta>>;
  activity: ActivityEntry[];
  notifications: AppNotification[];
  messagesUnread: number;
  bookmarks: string[];
  sidebarCollapsed: boolean;
}

type Action =
  | { type: "hydrate"; payload: Partial<State> }
  | { type: "signIn"; user: AuthUser }
  | { type: "signOut" }
  | { type: "create"; key: DatasetKey; row: Row }
  | { type: "update"; key: DatasetKey; row: Row }
  | { type: "delete"; key: DatasetKey; id: string }
  | { type: "resetDataset"; key: DatasetKey }
  | { type: "activity"; entry: ActivityEntry }
  | { type: "notify"; note: AppNotification }
  | { type: "readNotification"; id: string }
  | { type: "readAllNotifications" }
  | { type: "readMessages" }
  | { type: "toggleBookmark"; href: string }
  | { type: "toggleSidebar" }
  | { type: "resetAll" };

const EMPTY_DELTA: Delta = { created: [], updated: {}, deleted: [] };

const initialState: State = {
  hydrated: false,
  user: null,
  deltas: {},
  activity: [],
  notifications: [],
  messagesUnread: 5,
  bookmarks: [],
  sidebarCollapsed: false,
};

function deltaFor(state: State, key: DatasetKey): Delta {
  return state.deltas[key] ?? EMPTY_DELTA;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.payload, hydrated: true };

    case "signIn":
      return { ...state, user: action.user };

    case "signOut":
      return { ...state, user: null };

    case "create": {
      const d = deltaFor(state, action.key);
      return {
        ...state,
        deltas: { ...state.deltas, [action.key]: { ...d, created: [action.row, ...d.created] } },
      };
    }

    case "update": {
      const d = deltaFor(state, action.key);
      const id = String(action.row.id);
      const isNew = d.created.some((r) => String(r.id) === id);
      if (isNew) {
        return {
          ...state,
          deltas: {
            ...state.deltas,
            [action.key]: { ...d, created: d.created.map((r) => (String(r.id) === id ? action.row : r)) },
          },
        };
      }
      return {
        ...state,
        deltas: { ...state.deltas, [action.key]: { ...d, updated: { ...d.updated, [id]: action.row } } },
      };
    }

    case "delete": {
      const d = deltaFor(state, action.key);
      return {
        ...state,
        deltas: {
          ...state.deltas,
          [action.key]: {
            created: d.created.filter((r) => String(r.id) !== action.id),
            updated: Object.fromEntries(Object.entries(d.updated).filter(([k]) => k !== action.id)),
            deleted: d.deleted.includes(action.id) ? d.deleted : [...d.deleted, action.id],
          },
        },
      };
    }

    case "resetDataset": {
      const next = { ...state.deltas };
      delete next[action.key];
      return { ...state, deltas: next };
    }

    case "activity":
      return { ...state, activity: [action.entry, ...state.activity].slice(0, 40) };

    case "notify":
      return { ...state, notifications: [action.note, ...state.notifications].slice(0, 30) };

    case "readNotification":
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      };

    case "readAllNotifications":
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    case "readMessages":
      return { ...state, messagesUnread: 0 };

    case "toggleBookmark":
      return {
        ...state,
        bookmarks: state.bookmarks.includes(action.href)
          ? state.bookmarks.filter((b) => b !== action.href)
          : [action.href, ...state.bookmarks].slice(0, 12),
      };

    case "toggleSidebar":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case "resetAll":
      return { ...initialState, hydrated: true, user: state.user, notifications: seedNotifications() };

    default:
      return state;
  }
}

/* ── Seed notifications ───────────────────────────────────────────────────── */

function seedNotifications(): AppNotification[] {
  const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();
  return [
    {
      id: "n1",
      title: "5 requisitions breached SLA",
      body: "Unit 02 — Woven Garments has requisitions waiting more than 7 days at Unit Finance.",
      at: ago(12),
      read: false,
      tone: "critical",
      href: "/purchase/purchase-control-tower/pending-approval",
    },
    {
      id: "n2",
      title: "MTR failed — shipment blocked",
      body: "MTR-25-8043 from Hangzhou Yarn Group failed verification. The shipment gate is closed.",
      at: ago(48),
      read: false,
      tone: "warn",
      href: "/purchase/mtr-and-shipment-management/mtr-fail",
    },
    {
      id: "n3",
      title: "IQC rejection above threshold",
      body: "Shade variation on lot IQC-25-4021 pushed the rejection rate past 8%.",
      at: ago(96),
      read: false,
      tone: "warn",
      href: "/inventory/iqc-incoming-quality-control/defects",
    },
    {
      id: "n4",
      title: "12 quotations received",
      body: "RFQ-25-4009 closed with 12 of 14 invited suppliers responding.",
      at: ago(190),
      read: false,
      tone: "good",
      href: "/purchase/supplier-quotation/supplier-quotation",
    },
    {
      id: "n5",
      title: "Stock below reorder level",
      body: "Nylon Zipper #5 in the Trims store has fallen under its reorder point.",
      at: ago(320),
      read: false,
      tone: "info",
      href: "/inventory/stock-management/available-stock",
    },
  ];
}

/* ── Persistence ──────────────────────────────────────────────────────────── */

const STORAGE_KEY = "noor-erp:v1";

interface Persisted {
  user: AuthUser | null;
  deltas: Partial<Record<DatasetKey, Delta>>;
  activity: ActivityEntry[];
  notifications: AppNotification[];
  messagesUnread: number;
  bookmarks: string[];
  sidebarCollapsed: boolean;
}

/* ── Context ──────────────────────────────────────────────────────────────── */

interface StoreValue extends State {
  dispatch: React.Dispatch<Action>;
  rowsFor: (key: DatasetKey) => Row[];
  createRow: (key: DatasetKey, values: Row) => Row;
  updateRow: (key: DatasetKey, row: Row) => void;
  deleteRow: (key: DatasetKey, id: string) => void;
  resetDataset: (key: DatasetKey) => void;
  logActivity: (entry: Omit<ActivityEntry, "id" | "at" | "by">) => void;
  notify: (note: Omit<AppNotification, "id" | "at" | "read">) => void;
  unreadCount: number;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const seedCache = useRef(new Map<DatasetKey, Row[]>());

  // Hydrate once on the client. SSR renders the shell; data arrives after mount.
  useEffect(() => {
    let payload: Partial<State> = { notifications: seedNotifications() };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        payload = {
          user: parsed.user ?? null,
          deltas: parsed.deltas ?? {},
          activity: parsed.activity ?? [],
          notifications: parsed.notifications?.length ? parsed.notifications : seedNotifications(),
          messagesUnread: parsed.messagesUnread ?? 5,
          bookmarks: parsed.bookmarks ?? [],
          sidebarCollapsed: parsed.sidebarCollapsed ?? false,
        };
      }
    } catch {
      /* corrupt or unavailable storage — fall back to a clean session */
    }
    dispatch({ type: "hydrate", payload });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      const persisted: Persisted = {
        user: state.user,
        deltas: state.deltas,
        activity: state.activity,
        notifications: state.notifications,
        messagesUnread: state.messagesUnread,
        bookmarks: state.bookmarks,
        sidebarCollapsed: state.sidebarCollapsed,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      /* quota or private mode — the session still works, it just won't persist */
    }
  }, [state]);

  const getSeed = useCallback((key: DatasetKey) => {
    const cached = seedCache.current.get(key);
    if (cached) return cached;
    const rows = seedDataset(key);
    seedCache.current.set(key, rows);
    return rows;
  }, []);

  const rowsFor = useCallback(
    (key: DatasetKey): Row[] => {
      const seed = getSeed(key);
      const delta = state.deltas[key];
      if (!delta) return seed;
      const deleted = new Set(delta.deleted);
      const base = seed
        .filter((r) => !deleted.has(String(r.id)))
        .map((r) => delta.updated[String(r.id)] ?? r);
      return [...delta.created, ...base];
    },
    [state.deltas, getSeed],
  );

  const logActivity = useCallback(
    (entry: Omit<ActivityEntry, "id" | "at" | "by">) => {
      dispatch({
        type: "activity",
        entry: {
          ...entry,
          id: uid("ACT"),
          at: new Date().toISOString(),
          by: state.user?.name ?? "System",
        },
      });
    },
    [state.user?.name],
  );

  const notify = useCallback((note: Omit<AppNotification, "id" | "at" | "read">) => {
    dispatch({ type: "notify", note: { ...note, id: uid("NTF"), at: new Date().toISOString(), read: false } });
  }, []);

  const createRow = useCallback(
    (key: DatasetKey, values: Row) => {
      const spec = getSpec(key);
      const existing = values[spec.idField];
      const row: Row = {
        ...values,
        id: uid(spec.idPrefix),
        [spec.idField]: existing || `${spec.idPrefix}-25-${Math.floor(Math.random() * 9000 + 1000)}`,
      };
      dispatch({ type: "create", key, row });
      return row;
    },
    [],
  );

  const updateRow = useCallback((key: DatasetKey, row: Row) => {
    dispatch({ type: "update", key, row });
  }, []);

  const deleteRow = useCallback((key: DatasetKey, id: string) => {
    dispatch({ type: "delete", key, id });
  }, []);

  const resetDataset = useCallback((key: DatasetKey) => {
    dispatch({ type: "resetDataset", key });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      dispatch,
      rowsFor,
      createRow,
      updateRow,
      deleteRow,
      resetDataset,
      logActivity,
      notify,
      unreadCount: state.notifications.filter((n) => !n.read).length,
    }),
    [state, rowsFor, createRow, updateRow, deleteRow, resetDataset, logActivity, notify],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <AppStoreProvider>");
  return ctx;
}

/** Live rows for a dataset, with the page's built-in filter applied. */
export function useDataset(key: DatasetKey, filter?: { field: string; value: string }) {
  const { rowsFor } = useStore();
  const all = rowsFor(key);
  return useMemo(() => {
    if (!filter) return all;
    return all.filter((r) => String(r[filter.field]) === filter.value);
  }, [all, filter]);
}
