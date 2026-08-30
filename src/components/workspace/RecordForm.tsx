"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { FieldSpec, Row } from "@/lib/data/types";
import { currency } from "@/lib/utils/format";
import { todayISO } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type FormValues = Record<string, string | number>;

export function buildInitialValues(fields: FieldSpec[], row?: Row): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    const existing = row?.[f.key];
    if (existing !== undefined && existing !== null) out[f.key] = existing;
    else if (f.type === "date") out[f.key] = todayISO();
    else if (f.type === "number" || f.type === "currency") out[f.key] = "";
    else out[f.key] = "";
  }
  if (row?.id) out.id = row.id;
  return out;
}

export function validate(fields: FieldSpec[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.derived) continue;
    const v = values[f.key];
    if (f.required && (v === "" || v === undefined || v === null)) {
      errors[f.key] = `${f.label} is required`;
      continue;
    }
    if ((f.type === "number" || f.type === "currency") && v !== "") {
      const n = Number(v);
      if (Number.isNaN(n)) errors[f.key] = "Enter a valid number";
      else if (f.min !== undefined && n < f.min) errors[f.key] = `Minimum is ${f.min}`;
      else if (f.max !== undefined && n > f.max) errors[f.key] = `Maximum is ${f.max}`;
    }
  }
  return errors;
}

/** Coerces the string-typed inputs back to the numeric shape charts expect. */
export function normalise(fields: FieldSpec[], values: FormValues): Row {
  const out: Row = {};
  for (const f of fields) {
    if (f.derived) {
      out[f.key] = f.derived(values as Row);
      continue;
    }
    const v = values[f.key];
    out[f.key] = f.type === "number" || f.type === "currency" ? Number(v || 0) : String(v ?? "");
  }
  if (values.id) out.id = values.id;
  return out;
}

export function FormFields({
  fields,
  values,
  errors,
  onChange,
  columns = 2,
}: {
  fields: FieldSpec[];
  values: FormValues;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  columns?: 2 | 3;
}) {
  return (
    <div className={cn("grid gap-x-4 gap-y-3.5", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {fields.map((f) => {
        const id = `field-${f.key}`;
        const derivedValue = f.derived ? f.derived(values as Row) : undefined;

        return (
          <Field
            key={f.key}
            label={f.label}
            htmlFor={id}
            required={f.required}
            error={errors[f.key]}
            help={f.help}
            className={f.span === 2 ? (columns === 3 ? "sm:col-span-2" : "sm:col-span-2") : undefined}
          >
            {f.derived ? (
              <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-dashed border-brand-200 bg-brand-50/60 px-3">
                <span className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-wide text-brand-600">
                  <Calculator className="size-3.5" aria-hidden /> Auto
                </span>
                <span className="font-mono text-[13.5px] font-semibold tabular-nums text-ink-900">
                  {f.type === "currency" ? currency(Number(derivedValue ?? 0)) : String(derivedValue ?? 0)}
                </span>
              </div>
            ) : f.type === "select" ? (
              <Select
                id={id}
                options={f.options ?? []}
                value={String(values[f.key] ?? "")}
                invalid={Boolean(errors[f.key])}
                onChange={(e) => onChange(f.key, e.target.value)}
                placeholder={f.placeholder ?? `Select ${f.label.toLowerCase()}…`}
              />
            ) : f.type === "textarea" ? (
              <Textarea
                id={id}
                value={String(values[f.key] ?? "")}
                invalid={Boolean(errors[f.key])}
                placeholder={f.placeholder}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            ) : (
              <Input
                id={id}
                type={f.type === "date" ? "date" : f.type === "number" || f.type === "currency" ? "number" : "text"}
                step={f.step ?? (f.type === "currency" ? 0.01 : undefined)}
                min={f.min}
                max={f.max}
                value={String(values[f.key] ?? "")}
                invalid={Boolean(errors[f.key])}
                placeholder={f.placeholder}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}

interface RecordFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (row: Row) => void;
  fields: FieldSpec[];
  row?: Row;
  entity: string;
  mode: "create" | "edit";
}

/** The dialog body mounts fresh on every open (and per record), so its draft
 *  state starts clean without a reset effect. */
export function RecordFormModal(props: RecordFormModalProps) {
  if (!props.open) return null;
  return <RecordFormDialog key={String(props.row?.id ?? "new")} {...props} />;
}

function RecordFormDialog({ onClose, onSubmit, fields, row, entity, mode }: RecordFormModalProps) {
  const initial = useMemo(() => buildInitialValues(fields, row), [fields, row]);
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const change = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const submit = () => {
    const errs = validate(fields, values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    // A short delay so the saving state is visible, as it would be against an API.
    window.setTimeout(() => {
      onSubmit(normalise(fields, values));
      setSaving(false);
      onClose();
    }, 420);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={mode === "create" ? `New ${entity}` : `Edit ${entity}`}
      description={
        mode === "create"
          ? `Complete the required fields to add a ${entity.toLowerCase()} to the register.`
          : `Update this ${entity.toLowerCase()}. Changes flow straight into the KPIs and charts on this page.`
      }
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {mode === "create" ? `Create ${entity}` : "Save changes"}
          </Button>
        </>
      }
    >
      <FormFields fields={fields} values={values} errors={errors} onChange={change} />
      {Object.keys(errors).length > 0 && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-700">
          {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? "s need" : " needs"} attention before this can be saved.
        </p>
      )}
    </Modal>
  );
}

/** Read-only detail view used by the table's "View details" action. */
export function RecordDetail({
  open,
  onClose,
  row,
  fields,
  entity,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  row?: Row;
  fields: FieldSpec[];
  entity: string;
  onEdit?: () => void;
}) {
  if (!row) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={`${entity} details`}
      description="A read-only view of every captured field on this record."
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onEdit();
              }}
            >
              Edit record
            </Button>
          )}
        </>
      }
    >
      <dl className="grid gap-x-5 gap-y-0 sm:grid-cols-2">
        {fields.map((f) => {
          const v = row[f.key];
          return (
            <div key={f.key} className="flex items-baseline justify-between gap-3 border-b border-ink-100 py-2 last:border-0">
              <dt className="text-[12px] text-ink-500">{f.label}</dt>
              <dd className="text-right text-[13px] font-medium text-ink-900">
                {v === undefined || v === "" ? (
                  <span className="text-ink-300">—</span>
                ) : f.type === "currency" ? (
                  <span className="font-mono tabular-nums">{currency(Number(v))}</span>
                ) : (
                  String(v)
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </Modal>
  );
}
