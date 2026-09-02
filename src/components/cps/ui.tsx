"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── Numbers ──────────────────────────────────────────────────────────────── */

export const money = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const bdt = (n: number) => `BDT ${money(n)}`;

/** 48,60,000 → "48.6 L" — the lakh scale used across the management view. */
export const lakh = (n: number) => {
  if (Math.abs(n) >= 10_000_000) return `${(n / 10_000_000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100_000) return `${(n / 100_000).toFixed(1)} L`;
  return money(n);
};

/* ── Page furniture ───────────────────────────────────────────────────────── */

export function ScreenTitle({
  title,
  hint,
  actions,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[22px] font-bold tracking-tight text-ink-900 sm:text-[24px]">{title}</h2>
        {hint && <p className="mt-1 text-[13px] text-ink-500">{hint}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-2 first:mt-0">
      <h3 className="text-[15px] font-bold tracking-tight text-ink-900">{children}</h3>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function FormGrid({ cols = 4, children }: { cols?: 2 | 3 | 4; children: ReactNode }) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        cols === 4 && "lg:grid-cols-4",
        cols === 3 && "lg:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

export function LField({
  label,
  required,
  error,
  hint,
  span,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  span?: 2 | 3 | 4;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        span === 2 && "sm:col-span-2",
        span === 3 && "lg:col-span-3",
        span === 4 && "sm:col-span-2 lg:col-span-4",
      )}
    >
      <label className="flex items-center gap-1 text-[12px] font-semibold text-ink-600">
        {label}
        {required && <span className="text-brand-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11.5px] font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Callouts ─────────────────────────────────────────────────────────────── */

export function NoteBar({
  tone = "teal",
  children,
  className,
}: {
  tone?: "teal" | "navy" | "amber" | "red";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    teal: "bg-brand-50 text-brand-800 ring-brand-100",
    navy: "bg-navy-900 text-white ring-navy-800",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
    red: "bg-red-50 text-red-800 ring-red-200",
  } as const;
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 text-center text-[13px] font-semibold leading-relaxed ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ── Tables ───────────────────────────────────────────────────────────────── */

export interface GridColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
  mono?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  empty = "Nothing to show yet.",
  onRowClick,
  activeKey,
  dense,
}: {
  columns: GridColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: string;
  onRowClick?: (row: T) => void;
  activeKey?: string;
  dense?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-200">
      <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-navy-800 text-white">
            {columns.map((c) => (
              <th
                key={c.key}
                style={c.width ? { width: c.width } : undefined}
                className={cn(
                  "whitespace-nowrap px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.04em]",
                  c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-[12.5px] text-ink-400">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row, i) => {
            const key = rowKey(row, i);
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-t border-ink-100 transition-colors",
                  i % 2 === 1 && "bg-ink-50/60",
                  onRowClick && "cursor-pointer hover:bg-brand-50",
                  activeKey === key && "bg-brand-50 ring-1 ring-inset ring-brand-200",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      dense ? "px-3 py-1.5" : "px-3 py-2.5",
                      "align-middle text-ink-700",
                      c.mono && "font-mono text-[12px] font-medium text-ink-900",
                      c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : "text-left",
                    )}
                  >
                    {c.render ? c.render(row, i) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Access ───────────────────────────────────────────────────────────────── */

export function NoAccess({ what, role }: { what: string; role: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-ink-300 bg-ink-50 px-6 py-16 text-center">
      <span className="mb-3 grid size-11 place-items-center rounded-full bg-ink-100 text-ink-400 ring-1 ring-ink-200">
        <Lock className="size-5" />
      </span>
      <p className="text-[14px] font-semibold text-ink-800">{what} is not available to the {role} role</p>
      <p className="mt-1 max-w-md text-[12.5px] text-ink-500">
        Role-based access is enforced across the prototype. Switch the acting role from the command bar to
        continue, or ask an administrator to extend your access matrix.
      </p>
    </div>
  );
}

export function InfoStat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-surface p-4 shadow-card">
      <p className="text-[12px] font-medium text-ink-500">{label}</p>
      <p className="mt-1.5 font-mono text-[22px] font-semibold leading-none tracking-tight text-brand-700">{value}</p>
      {hint && <p className="mt-1.5 text-[11.5px] text-ink-400">{hint}</p>}
    </div>
  );
}
