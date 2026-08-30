"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eraser, Save, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormFields, buildInitialValues, normalise, validate, type FormValues } from "./RecordForm";
import type { DatasetSpec, Row } from "@/lib/data/types";
import { currency, num } from "@/lib/utils/format";

/** The full-page capture form used by every "form" screen. */
export function InlineFormCard({
  spec,
  onSubmit,
  title,
  hint,
}: {
  spec: DatasetSpec;
  onSubmit: (row: Row) => void;
  title: string;
  hint?: string;
}) {
  const initial = useMemo(() => buildInitialValues(spec.fields), [spec.fields]);
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const derived = spec.fields.filter((f) => f.derived);
  const requiredCount = spec.fields.filter((f) => f.required).length;
  const completed = spec.fields.filter((f) => f.required && String(values[f.key] ?? "") !== "").length;
  const progress = requiredCount ? Math.round((completed / requiredCount) * 100) : 100;

  const change = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  };

  const submit = () => {
    const errs = validate(spec.fields, values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error(`${Object.keys(errs).length} required field${Object.keys(errs).length > 1 ? "s are" : " is"} missing`);
      return;
    }
    setSaving(true);
    toast.promise(
      new Promise<void>((resolve) =>
        window.setTimeout(() => {
          onSubmit(normalise(spec.fields, values));
          setValues(initial);
          setSaving(false);
          resolve();
        }, 620),
      ),
      {
        loading: `Submitting the ${spec.entity.toLowerCase()}…`,
        success: `${spec.entity} submitted for processing`,
        error: "Submission failed — please retry",
      },
    );
  };

  return (
    <Card>
      <CardHeader
        title={title}
        hint={hint}
        icon={<Save className="size-4" />}
        actions={
          <span className="flex items-center gap-2">
            <span className="hidden items-center gap-2 sm:flex">
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </span>
              <span className="font-mono text-[11.5px] tabular-nums text-ink-500">
                {completed}/{requiredCount}
              </span>
            </span>
          </span>
        }
      />
      <CardBody className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <FormFields fields={spec.fields} values={values} errors={errors} onChange={change} columns={3} />

        <aside className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-ink-50/60 p-3.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
            <ShieldCheck className="size-3.5 text-brand-500" aria-hidden />
            Live summary
          </p>

          {derived.length > 0 ? (
            <dl className="space-y-2">
              {derived.map((f) => {
                const v = f.derived!(values as Row);
                return (
                  <div key={f.key} className="rounded-lg bg-white px-3 py-2 ring-1 ring-ink-100">
                    <dt className="text-[11px] text-ink-500">{f.label}</dt>
                    <dd className="mt-0.5 font-mono text-[16px] font-semibold tabular-nums text-ink-900">
                      {f.type === "currency" ? currency(Number(v)) : num(Number(v), 2)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className="text-[12px] leading-relaxed text-ink-500">
              This document has no computed totals. Every field is captured exactly as entered and posted to the{" "}
              {spec.entityPlural.toLowerCase()} register below.
            </p>
          )}

          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-ink-100">
            <p className="text-[11px] text-ink-500">Routing</p>
            <p className="mt-0.5 text-[12.5px] font-medium text-ink-800">
              {progress === 100 ? "Ready to submit" : `${requiredCount - completed} required field(s) left`}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-1">
            <Button variant="primary" onClick={submit} loading={saving} icon={<Save className="size-4" />}>
              Submit {spec.entity}
            </Button>
            <Button
              icon={<Eraser className="size-3.5" />}
              onClick={() => {
                setValues(initial);
                setErrors({});
                toast("Form cleared", { icon: "🧹" });
              }}
            >
              Clear form
            </Button>
          </div>
        </aside>
      </CardBody>
    </Card>
  );
}
