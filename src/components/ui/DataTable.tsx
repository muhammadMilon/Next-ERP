"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "./Button";
import { Chip, StatusPill } from "./Badge";
import { Dropdown, MenuDivider, MenuItem } from "./Dropdown";
import { EmptyState } from "./EmptyState";
import { Progress } from "./Progress";
import type { ColumnSpec, Row } from "@/lib/data/types";
import { currency, dateShort, num } from "@/lib/utils/format";
import { downloadCsv, toCsv } from "@/lib/utils/csv";
import { cn } from "@/lib/utils/cn";

export interface RowAction {
  label: string;
  icon?: ReactNode;
  onClick: (row: Row) => void;
  danger?: boolean;
}

export interface DataTableProps {
  columns: ColumnSpec[];
  rows: Row[];
  searchFields?: string[];
  statusField?: string;
  statusOptions?: readonly string[];
  title?: string;
  exportName?: string;
  pageSize?: number;
  onView?: (row: Row) => void;
  onEdit?: (row: Row) => void;
  onDelete?: (row: Row) => void;
  rowActions?: RowAction[];
  toolbar?: ReactNode;
  onExported?: (count: number) => void;
  emptyAction?: ReactNode;
  /** Rendered before the row actions cell — used by approval queues. */
  inlineActions?: (row: Row) => ReactNode;
}

const cellValue = (row: Row, col: ColumnSpec): ReactNode => {
  const raw = row[col.key];
  if (raw === undefined || raw === null || raw === "") return <span className="text-ink-300">—</span>;

  switch (col.type) {
    case "status":
      return <StatusPill value={String(raw)} />;
    case "chip":
      return <Chip>{String(raw)}</Chip>;
    case "mono":
      return <span className="font-mono text-[12.5px] font-medium text-ink-800">{String(raw)}</span>;
    case "currency":
      return <span className="font-mono tabular-nums text-ink-800">{currency(Number(raw))}</span>;
    case "num":
      return <span className="font-mono tabular-nums text-ink-800">{num(Number(raw))}</span>;
    case "percent":
      return <span className="font-mono tabular-nums text-ink-800">{Number(raw).toFixed(1)}%</span>;
    case "date":
      return <span className="whitespace-nowrap text-ink-600">{dateShort(String(raw))}</span>;
    case "progress":
      return <Progress value={Number(raw)} />;
    case "score": {
      const v = Number(raw);
      return (
        <span
          className={cn(
            "inline-block rounded-md px-1.5 py-0.5 font-mono text-[12px] font-semibold tabular-nums",
            v >= 85 ? "bg-emerald-50 text-emerald-700" : v >= 70 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700",
          )}
        >
          {v}
        </span>
      );
    }
    case "delta": {
      const v = Number(raw);
      return (
        <span className={cn("font-mono tabular-nums", v > 0 ? "text-red-600" : v < 0 ? "text-amber-700" : "text-ink-500")}>
          {v > 0 ? "+" : ""}
          {v.toFixed(2)}%
        </span>
      );
    }
    default:
      return <span className="text-ink-700">{String(raw)}</span>;
  }
};

export function DataTable({
  columns,
  rows,
  searchFields = [],
  statusField,
  statusOptions,
  title,
  exportName = "export",
  pageSize = 12,
  onView,
  onEdit,
  onDelete,
  rowActions = [],
  toolbar,
  onExported,
  emptyAction,
  inlineActions,
}: DataTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);

  const visibleColumns = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      const fields = searchFields.length ? searchFields : columns.map((c) => c.key);
      out = out.filter((r) => fields.some((f) => String(r[f] ?? "").toLowerCase().includes(q)));
    }
    if (statusFilter && statusField) out = out.filter((r) => String(r[statusField]) === statusFilter);
    if (sort) {
      const { key, dir } = sort;
      out = [...out].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        const an = typeof av === "number" ? av : Number(av);
        const bn = typeof bv === "number" ? bv : Number(bv);
        const cmp =
          Number.isFinite(an) && Number.isFinite(bn) && String(av).trim() !== "" && String(bv).trim() !== ""
            ? an - bn
            : String(av ?? "").localeCompare(String(bv ?? ""));
        return dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, query, statusFilter, sort, searchFields, statusField, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));

  const handleExport = () => {
    downloadCsv(exportName, toCsv(filtered, visibleColumns.map((c) => ({ key: c.key, label: c.label }))));
    onExported?.(filtered.length);
  };

  const hasActions = Boolean(onView || onEdit || onDelete || rowActions.length || inlineActions);

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200/80 bg-white shadow-card">
      {/* Toolbar — filters live in one row above the table */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 px-3 py-2.5">
        {title && <h3 className="mr-1 text-[14px] font-semibold tracking-tight text-ink-900">{title}</h3>}

        <div className="relative min-w-[180px] flex-1 sm:max-w-[280px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search records…"
            aria-label="Search records"
            className="focus-brand h-9 w-full rounded-lg border border-ink-200 bg-white pl-8 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-400"
          />
        </div>

        {statusField && statusOptions?.length ? (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            aria-label="Filter by status"
            className="focus-brand h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-[13px] text-ink-700 hover:border-ink-300 focus:border-brand-400"
          >
            <option value="">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : null}

        <span className="ml-auto flex items-center gap-1.5">
          {toolbar}
          <Dropdown
            trigger={() => (
              <span className="focus-brand inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-[13px] font-medium text-ink-700 ring-1 ring-inset ring-ink-200 transition-colors hover:bg-ink-50">
                <Columns3 className="size-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </span>
            )}
            panelClassName="max-h-[300px] overflow-y-auto"
          >
            {() => (
              <>
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] text-ink-700 hover:bg-ink-50"
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 accent-brand-500"
                      checked={!hidden.includes(c.key)}
                      onChange={() =>
                        setHidden((h) => (h.includes(c.key) ? h.filter((k) => k !== c.key) : [...h, c.key]))
                      }
                    />
                    {c.label}
                  </label>
                ))}
              </>
            )}
          </Dropdown>
          <Button size="sm" icon={<Download className="size-3.5" />} onClick={handleExport}>
            <span className="hidden sm:inline">Export</span>
          </Button>
        </span>
      </div>

      {/* Table — wide content scrolls inside its own container */}
      {pageRows.length === 0 ? (
        <EmptyState
          title="No matching records"
          body={query || statusFilter ? "Adjust the search or status filter to widen the result set." : "There is nothing in this register yet."}
          action={emptyAction}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50/70">
                {visibleColumns.map((c) => (
                  <th
                    key={c.key}
                    style={{ width: c.width }}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-500",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                      c.secondary && "hidden xl:table-cell",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "focus-brand inline-flex items-center gap-1 rounded transition-colors hover:text-ink-800",
                        sort?.key === c.key && "text-brand-600",
                      )}
                    >
                      {c.label}
                      <ArrowUpDown className={cn("size-3 opacity-40", sort?.key === c.key && "opacity-100")} />
                    </button>
                  </th>
                ))}
                {hasActions && <th className="w-px px-3 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={String(row.id ?? i)}
                  className="group border-b border-ink-100 transition-colors last:border-0 hover:bg-brand-50/40"
                >
                  {visibleColumns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 py-2.5 align-middle",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.secondary && "hidden xl:table-cell",
                      )}
                    >
                      {cellValue(row, c)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <span className="flex items-center justify-end gap-1">
                        {inlineActions?.(row)}
                        {(onView || onEdit || onDelete || rowActions.length > 0) && (
                          <Dropdown
                            trigger={() => (
                              <span className="grid size-7 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700">
                                <MoreHorizontal className="size-4" />
                              </span>
                            )}
                          >
                            {(close) => (
                              <>
                                {onView && (
                                  <MenuItem icon={<Eye className="size-3.5" />} onClick={() => { close(); onView(row); }}>
                                    View details
                                  </MenuItem>
                                )}
                                {onEdit && (
                                  <MenuItem icon={<Pencil className="size-3.5" />} onClick={() => { close(); onEdit(row); }}>
                                    Edit record
                                  </MenuItem>
                                )}
                                {rowActions.map((a) => (
                                  <MenuItem key={a.label} icon={a.icon} danger={a.danger} onClick={() => { close(); a.onClick(row); }}>
                                    {a.label}
                                  </MenuItem>
                                ))}
                                {onDelete && (
                                  <>
                                    <MenuDivider />
                                    <MenuItem icon={<Trash2 className="size-3.5" />} danger onClick={() => { close(); onDelete(row); }}>
                                      Delete
                                    </MenuItem>
                                  </>
                                )}
                              </>
                            )}
                          </Dropdown>
                        )}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 bg-ink-50/40 px-3 py-2.5">
        <p className="text-[12px] text-ink-500">
          Showing{" "}
          <span className="font-mono font-medium tabular-nums text-ink-700">
            {filtered.length === 0 ? 0 : safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)}
          </span>{" "}
          of <span className="font-mono font-medium tabular-nums text-ink-700">{num(filtered.length)}</span>
          {filtered.length !== rows.length && <span className="text-ink-400"> (filtered from {num(rows.length)})</span>}
        </p>
        <div className="flex items-center gap-1">
          <Button size="xs" onClick={() => setPage(Math.max(0, safePage - 1))} disabled={safePage === 0} icon={<ChevronLeft className="size-3.5" />}>
            Prev
          </Button>
          <span className="px-2 font-mono text-[12px] tabular-nums text-ink-500">
            {safePage + 1} / {pageCount}
          </span>
          <Button
            size="xs"
            onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            iconRight={<ChevronRight className="size-3.5" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
