import type { DatasetKey } from "@/lib/nav/types";

export type Row = Record<string, string | number>;

export type ColumnType =
  | "text"
  | "mono"
  | "num"
  | "currency"
  | "date"
  | "status"
  | "chip"
  | "percent"
  | "progress"
  | "delta"
  | "score";

export interface ColumnSpec {
  key: string;
  label: string;
  type?: ColumnType;
  align?: "left" | "right" | "center";
  /** Hidden on narrow viewports to keep the table readable. */
  secondary?: boolean;
  width?: string;
}

export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "textarea"
  | "checkbox";

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Column span inside the 2-col modal grid. */
  span?: 1 | 2;
  /** Computed from other fields — rendered read-only. */
  derived?: (row: Row) => number | string;
}

export type ChartPlan =
  | { form: "donut"; title: string; hint?: string; by: string }
  | { form: "hbar"; title: string; hint?: string; by: string; value?: string; top?: number; unit?: "currency" | "num" }
  | { form: "bar"; title: string; hint?: string; by: string; value?: string; unit?: "currency" | "num" }
  | { form: "area"; title: string; hint?: string; by: string; value?: string; unit?: "currency" | "num" }
  | { form: "line"; title: string; hint?: string; by: string; series: string[]; unit?: "currency" | "num" | "percent" }
  | { form: "stacked"; title: string; hint?: string; by: string; stack: string; value?: string; unit?: "currency" | "num" }
  | { form: "pareto"; title: string; hint?: string; by: string; value?: string }
  | { form: "grouped"; title: string; hint?: string; by: string; series: { key: string; label: string }[]; unit?: "currency" | "num" };

export interface KpiPlan {
  label: string;
  /** count | sum:<field> | avg:<field> | countWhere:<field>=<value> | pctWhere:<field>=<value> | sumWhere:<f>=<v>:<sumField> */
  expr: string;
  unit?: "currency" | "num" | "percent";
  hint?: string;
  /** A higher value is good (drives the delta chip colour). */
  goodWhenUp?: boolean;
}

export interface DatasetSpec {
  key: DatasetKey;
  entity: string;
  entityPlural: string;
  idField: string;
  idPrefix: string;
  statusField?: string;
  statusOptions?: readonly string[];
  /** Field the search box scans first. */
  searchFields: string[];
  columns: ColumnSpec[];
  fields: FieldSpec[];
  kpis: KpiPlan[];
  charts: ChartPlan[];
  seedCount: number;
  make: (rng: () => number, i: number) => Row;
}

export type { DatasetKey };
