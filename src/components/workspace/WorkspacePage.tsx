"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Check,
  CircleSlash,
  Download,
  FileText,
  Pause,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PageHeader, KpiRow } from "./PageHeader";
import { FilterNotice } from "./FilterNotice";
import { InlineFormCard } from "./InlineFormCard";
import { DocumentVault } from "./DocumentVault";
import { RecordDetail, RecordFormModal } from "./RecordForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { getSpec } from "@/lib/data/datasets";
import { evaluateKpi } from "@/lib/data/aggregate";
import type { Row } from "@/lib/data/types";
import type { LeafLocation } from "@/lib/nav/types";
import { useStore } from "@/store/app-store";
import { num } from "@/lib/utils/format";

/** How many charts each screen type shows above its register. */
const CHART_COUNT: Record<string, number> = {
  dashboard: 4,
  analytics: 4,
  report: 3,
  status: 2,
  list: 2,
  approval: 2,
  master: 2,
  form: 2,
  document: 1,
};

export function WorkspacePage({ loc }: { loc: LeafLocation }) {
  const { leaf } = loc;
  const spec = getSpec(leaf.dataset);
  const { rowsFor, createRow, updateRow, deleteRow, resetDataset, logActivity, notify } = useStore();

  const allRows = rowsFor(leaf.dataset);
  const rows = useMemo(
    () => (leaf.filter ? allRows.filter((r) => String(r[leaf.filter!.field]) === leaf.filter!.value) : allRows),
    [allRows, leaf.filter],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Row | undefined>();
  const [confirming, setConfirming] = useState<Row | undefined>();

  const kpis = useMemo(() => spec.kpis.map((k) => evaluateKpi(k, rows)), [spec.kpis, rows]);
  const charts = spec.charts.slice(0, CHART_COUNT[leaf.kind] ?? 2);

  /* ── Mutations ─────────────────────────────────────────────────────────── */

  const handleCreate = (values: Row) => {
    const seeded: Row = leaf.filter ? { ...values, [leaf.filter.field]: leaf.filter.value } : values;
    const created = createRow(leaf.dataset, seeded);
    logActivity({ action: "created", entity: spec.entity, ref: String(created[spec.idField]), href: loc.href });
    toast.success(`${spec.entity} ${created[spec.idField]} created`, {
      icon: "✅",
      duration: 3200,
    });
  };

  const handleUpdate = (values: Row) => {
    updateRow(leaf.dataset, values);
    logActivity({ action: "updated", entity: spec.entity, ref: String(values[spec.idField]), href: loc.href });
    toast.success(`${spec.entity} ${values[spec.idField]} updated`, { icon: "💾" });
  };

  const handleDelete = (row: Row) => {
    deleteRow(leaf.dataset, String(row.id));
    logActivity({ action: "deleted", entity: spec.entity, ref: String(row[spec.idField]), href: loc.href });
    toast.success(`${spec.entity} ${row[spec.idField]} removed`, { icon: "🗑️" });
  };

  const decide = (row: Row, decision: "Approved" | "Rejected" | "On Hold") => {
    const field = spec.statusField ?? "status";
    const next: Row = { ...row, [field]: decision };
    updateRow(leaf.dataset, next);
    logActivity({
      action: decision === "Approved" ? "approved" : decision === "Rejected" ? "rejected" : "held",
      entity: spec.entity,
      ref: String(row[spec.idField]),
      href: loc.href,
    });
    if (decision === "Approved") toast.success(`${row[spec.idField]} approved and moved to the next stage`, { icon: "👍" });
    else if (decision === "Rejected") {
      toast.error(`${row[spec.idField]} rejected and returned to the originator`);
      notify({
        title: `${spec.entity} rejected`,
        body: `${row[spec.idField]} was rejected at ${loc.group.label}.`,
        tone: "critical",
        href: loc.href,
      });
    } else toast(`${row[spec.idField]} placed on hold`, { icon: "⏸️" });
  };

  const handleReset = () => {
    resetDataset(leaf.dataset);
    toast.success(`${spec.entityPlural} restored to the seeded register`, { icon: "↩️" });
  };

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setFormOpen(true);
  };

  /* ── Layout ────────────────────────────────────────────────────────────── */

  const isApproval = leaf.kind === "approval";
  const isForm = leaf.kind === "form";
  const isDocument = leaf.kind === "document";

  return (
    <>
      <PageHeader
        loc={loc}
        actions={
          <>
            <Button size="sm" icon={<RotateCcw className="size-3.5" />} onClick={handleReset}>
              Reset data
            </Button>
            <Button
              size="sm"
              icon={<Sparkles className="size-3.5" />}
              onClick={() =>
                toast.success(`Insight: ${kpis[0]?.label} is ${num(kpis[0]?.value ?? 0)} across ${rows.length} records`, {
                  duration: 4200,
                })
              }
            >
              Quick insight
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="size-4" />} onClick={openCreate}>
              New {spec.entity}
            </Button>
          </>
        }
      />

      {leaf.filter && <FilterNotice field={leaf.filter.field} value={leaf.filter.value} count={rows.length} />}

      <KpiRow>
        {kpis.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            unit={k.unit}
            hint={k.hint}
            delta={k.delta}
            goodWhenUp={k.goodWhenUp}
          />
        ))}
      </KpiRow>

      {isForm && (
        <div className="mb-4">
          <InlineFormCard
            spec={spec}
            onSubmit={handleCreate}
            title={`${loc.leaf.label} form`}
            hint={loc.leaf.hint}
          />
        </div>
      )}

      {isDocument && (
        <div className="mb-4">
          <DocumentVault rows={rows} spec={spec} />
        </div>
      )}

      {charts.length > 0 && (
        <div className="mb-4 grid gap-3 xl:grid-cols-2">
          {charts.map((c) => (
            <ChartRenderer key={c.title} plan={c} rows={rows} height={leaf.kind === "dashboard" || leaf.kind === "analytics" ? 250 : 230} />
          ))}
        </div>
      )}

      <DataTable
        title={isApproval ? `${spec.entity} queue` : `${spec.entityPlural} register`}
        columns={spec.columns}
        rows={rows}
        searchFields={spec.searchFields}
        statusField={spec.statusField}
        statusOptions={spec.statusOptions}
        exportName={`${loc.module.slug}-${loc.leaf.slug}`}
        pageSize={isForm || isDocument ? 8 : 12}
        onView={(row) => {
          setEditing(row);
          setDetailOpen(true);
        }}
        onEdit={openEdit}
        onDelete={(row) => setConfirming(row)}
        onExported={(count) => {
          logActivity({ action: "exported", entity: spec.entity, ref: `${count} rows`, href: loc.href });
          toast.success(`${count} rows exported to CSV`, { icon: "📄" });
        }}
        emptyAction={
          <Button variant="primary" size="sm" icon={<Plus className="size-4" />} onClick={openCreate}>
            Create the first {spec.entity.toLowerCase()}
          </Button>
        }
        toolbar={
          isApproval ? (
            <Button
              size="sm"
              icon={<Check className="size-3.5" />}
              onClick={() => {
                const pending = rows.filter((r) => String(r[spec.statusField ?? "status"]) === "Pending");
                if (pending.length === 0) {
                  toast("Nothing is pending in this queue", { icon: "🎉" });
                  return;
                }
                toast.promise(
                  new Promise<number>((resolve) =>
                    window.setTimeout(() => {
                      pending.forEach((r) => updateRow(leaf.dataset, { ...r, [spec.statusField ?? "status"]: "Approved" }));
                      resolve(pending.length);
                    }, 700),
                  ),
                  {
                    loading: `Approving ${pending.length} items…`,
                    success: (n) => `${n} items approved in bulk`,
                    error: "Bulk approval failed",
                  },
                );
              }}
            >
              <span className="hidden sm:inline">Approve all pending</span>
            </Button>
          ) : leaf.kind === "report" || leaf.kind === "analytics" ? (
            <Button
              size="sm"
              icon={<Download className="size-3.5" />}
              onClick={() =>
                toast.promise(new Promise((r) => window.setTimeout(r, 900)), {
                  loading: "Building the report pack…",
                  success: `${loc.leaf.label} pack ready for distribution`,
                  error: "Report generation failed",
                })
              }
            >
              <span className="hidden sm:inline">Generate pack</span>
            </Button>
          ) : null
        }
        inlineActions={
          isApproval
            ? (row) => (
                <span className="flex items-center gap-1">
                  <button
                    onClick={() => decide(row, "Approved")}
                    title="Approve"
                    aria-label={`Approve ${row[spec.idField]}`}
                    className="focus-brand grid size-7 place-items-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => decide(row, "On Hold")}
                    title="Put on hold"
                    aria-label={`Hold ${row[spec.idField]}`}
                    className="focus-brand grid size-7 place-items-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50"
                  >
                    <Pause className="size-3.5" />
                  </button>
                  <button
                    onClick={() => decide(row, "Rejected")}
                    title="Reject"
                    aria-label={`Reject ${row[spec.idField]}`}
                    className="focus-brand grid size-7 place-items-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                  >
                    <CircleSlash className="size-3.5" />
                  </button>
                </span>
              )
            : isDocument
              ? (row) => (
                  <button
                    onClick={() =>
                      toast.promise(new Promise((r) => window.setTimeout(r, 800)), {
                        loading: "Preparing the document…",
                        success: `${row[spec.idField]} opened in the document viewer`,
                        error: "Document unavailable",
                      })
                    }
                    title="Open document"
                    aria-label={`Open document ${row[spec.idField]}`}
                    className="focus-brand grid size-7 place-items-center rounded-lg text-brand-600 transition-colors hover:bg-brand-50"
                  >
                    <FileText className="size-3.5" />
                  </button>
                )
              : undefined
        }
      />

      <RecordFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => (editing ? handleUpdate({ ...editing, ...values }) : handleCreate(values))}
        fields={spec.fields}
        row={editing}
        entity={spec.entity}
        mode={editing ? "edit" : "create"}
      />

      <RecordDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        row={editing}
        fields={spec.fields}
        entity={spec.entity}
        onEdit={() => setFormOpen(true)}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(undefined)}
        onConfirm={() => confirming && handleDelete(confirming)}
        title={`Delete this ${spec.entity.toLowerCase()}?`}
        body={`${confirming?.[spec.idField] ?? ""} will be removed from the register. You can restore the seeded data at any time with “Reset data”.`}
      />
    </>
  );
}
