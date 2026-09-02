"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Copy, FilePlus2, Save, Search, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Select } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/Badge";
import { DataGrid, FormGrid, LField, NoAccess, NoteBar, ScreenTitle, SectionHeading } from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import { PRIORITIES, PR_STATUS, prQty, type CpsPr, type CpsPrLine, type Priority, type PrStatus } from "@/lib/cps/types";
import { addDays, dateShort, todayISO } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const blankPr = (prNo: string, unitCode: string, requester: string): CpsPr => ({
  id: "",
  prNo,
  unitCode,
  requester,
  prDate: todayISO(),
  requiredBy: addDays(todayISO(), 14),
  priority: "Normal",
  purpose: "",
  status: "Draft",
  lines: [],
  createdAt: new Date().toISOString(),
});

const lineId = () => `line-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

export function PurchaseRequisition() {
  const { state, can, nextPrNo, savePr, submitPr, removePr, unitByCode, itemByUic } = useCps();
  const firstUnit = state.units[0]?.code ?? "";
  const [draft, setDraft] = useState<CpsPr>(() => blankPr(nextPrNo(), firstUnit, state.actor));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PrStatus | "All">("All");
  const [toDelete, setToDelete] = useState<CpsPr | null>(null);

  const readOnly = draft.status !== "Draft" && draft.status !== "Returned";
  const itemOptions = useMemo(
    () => state.items.filter((i) => i.status === "Active").map((i) => `${i.uic} — ${i.description}`),
    [state.items],
  );

  const register = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.prs.filter((pr) => {
      if (statusFilter !== "All" && pr.status !== statusFilter) return false;
      if (!q) return true;
      return `${pr.prNo} ${pr.unitCode} ${pr.requester} ${pr.purpose}`.toLowerCase().includes(q);
    });
  }, [state.prs, query, statusFilter]);

  if (!can("createPR") && !can("approvePR") && !can("consolidateDemand")) {
    return <NoAccess what="Purchase Requisition" role={state.role} />;
  }

  const editable = can("createPR") && !readOnly;

  const setField = <K extends keyof CpsPr>(key: K, value: CpsPr[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const addLine = () => {
    const item = state.items.find((i) => i.status === "Active");
    setDraft((d) => ({
      ...d,
      lines: [
        ...d.lines,
        {
          id: lineId(),
          uic: item?.uic ?? "",
          description: item?.description ?? "",
          specification: item?.specification ?? "",
          qty: 1,
          uom: item?.uom ?? "Pcs",
          requiredDate: d.requiredBy,
          remarks: "",
        },
      ],
    }));
    setErrors((e) => ({ ...e, lines: "" }));
  };

  const patchLine = (id: string, patch: Partial<CpsPrLine>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  const pickItem = (id: string, label: string) => {
    const uic = label.split(" — ")[0];
    const item = itemByUic(uic);
    patchLine(id, {
      uic,
      description: item?.description ?? "",
      specification: item?.specification ?? "",
      uom: item?.uom ?? "Pcs",
    });
  };

  const dropLine = (id: string) =>
    setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.id !== id) }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!draft.unitCode) next.unitCode = "Requesting unit is required";
    if (!draft.prDate) next.prDate = "PR date is required";
    if (!draft.requiredBy) next.requiredBy = "Required-by date is required";
    else if (draft.requiredBy < draft.prDate) next.requiredBy = "Required-by cannot be before the PR date";
    if (!draft.purpose.trim()) next.purpose = "Purpose is required";
    if (!draft.lines.length) next.lines = "Add at least one item line";
    else if (draft.lines.some((l) => !l.uic)) next.lines = "Every line needs an item";
    else if (draft.lines.some((l) => l.qty <= 0)) next.lines = "Every line needs a quantity above zero";
    setErrors(next);
    if (Object.keys(next).length) toast.error(next.lines ?? "Please correct the highlighted fields");
    return Object.keys(next).length === 0;
  };

  const persist = (pr: CpsPr) => ({ ...pr, id: pr.id || `pr-${Date.now().toString(36)}` });

  const onSaveDraft = () => {
    if (!validate()) return;
    const pr = persist({ ...draft, status: "Draft" });
    savePr(pr, "Saved draft requisition");
    setDraft(pr);
    toast.success(`${pr.prNo} saved as draft`);
  };

  const onSubmit = () => {
    if (!validate()) return;
    const pr = persist(draft);
    savePr(pr, "Saved requisition");
    submitPr(pr);
    toast.success(`${pr.prNo} submitted — routed to ${unitByCode(pr.unitCode)?.defaultApprover ?? "the unit approver"}`);
    setDraft(blankPr(nextPrNo(), firstUnit, state.actor));
  };

  const startNew = () => {
    setDraft(blankPr(nextPrNo(), firstUnit, state.actor));
    setErrors({});
  };

  const duplicate = () => {
    setDraft({
      ...draft,
      id: "",
      prNo: nextPrNo(),
      status: "Draft",
      prDate: todayISO(),
      submittedAt: undefined,
      decidedAt: undefined,
      approver: undefined,
      approverComment: undefined,
      consolidatedIn: undefined,
      lines: draft.lines.map((l) => ({ ...l, id: lineId() })),
    });
    toast.success("Copied into a new draft requisition");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <ScreenTitle
        title="Purchase Requisition"
        hint={
          draft.id
            ? `${draft.prNo} · ${draft.status}${draft.consolidatedIn ? ` · consolidated in ${draft.consolidatedIn}` : ""}`
            : "Unit user raises a draft requisition; the system routes it for approval."
        }
        actions={
          <>
            {readOnly && (
              <Button icon={<Copy className="size-3.5" />} onClick={duplicate}>
                Copy to new PR
              </Button>
            )}
            <Button variant="primary" icon={<FilePlus2 className="size-3.5" />} onClick={startNew}>
              New PR
            </Button>
          </>
        }
      />

      <FormGrid>
        <LField label="PR No.">
          <Input value={draft.id ? draft.prNo : "Auto"} readOnly disabled />
        </LField>
        <LField label="Requesting Unit" required error={errors.unitCode}>
          <Select
            options={state.units.map((u) => `${u.code} — ${u.name}`)}
            value={draft.unitCode ? `${draft.unitCode} — ${unitByCode(draft.unitCode)?.name ?? ""}` : ""}
            placeholder="Select unit"
            disabled={!editable}
            onChange={(e) => setField("unitCode", e.target.value.split(" — ")[0])}
            invalid={Boolean(errors.unitCode)}
          />
        </LField>
        <LField label="PR Date" required error={errors.prDate}>
          <Input
            type="date"
            value={draft.prDate}
            disabled={!editable}
            onChange={(e) => setField("prDate", e.target.value)}
            invalid={Boolean(errors.prDate)}
          />
        </LField>
        <LField label="Required By" required error={errors.requiredBy}>
          <Input
            type="date"
            value={draft.requiredBy}
            disabled={!editable}
            onChange={(e) => setField("requiredBy", e.target.value)}
            invalid={Boolean(errors.requiredBy)}
          />
        </LField>

        <LField label="Priority">
          <Select
            options={PRIORITIES}
            value={draft.priority}
            placeholder="Select priority"
            disabled={!editable}
            onChange={(e) => setField("priority", e.target.value as Priority)}
          />
        </LField>
        <LField label="Purpose / Remarks" required span={3} error={errors.purpose}>
          <Input
            value={draft.purpose}
            disabled={!editable}
            onChange={(e) => setField("purpose", e.target.value)}
            placeholder="Store display accessories for upcoming season"
            invalid={Boolean(errors.purpose)}
          />
        </LField>
      </FormGrid>

      <SectionHeading
        actions={
          editable ? (
            <Button variant="primary" size="xs" icon={<FilePlus2 className="size-3.5" />} onClick={addLine}>
              Add Item
            </Button>
          ) : undefined
        }
      >
        PR Details
      </SectionHeading>

      <div className="overflow-x-auto rounded-lg border border-ink-200">
        <table className="w-full min-w-[900px] border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-brand-500 text-white">
              {["SL", "Item / UIC", "Description", "Specification", "Qty", "UOM", "Required Date", "Remarks", ""].map(
                (h, i) => (
                  <th
                    key={h + i}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.04em]",
                      h === "Qty" && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {draft.lines.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-[12.5px] text-ink-400">
                  No line yet — use “Add Item” to build the requisition.
                </td>
              </tr>
            )}
            {draft.lines.map((line, i) => (
              <tr key={line.id} className={cn("border-t border-ink-100", i % 2 === 1 && "bg-ink-50/60")}>
                <td className="px-3 py-2 text-ink-500">{i + 1}</td>
                <td className="px-2 py-1.5">
                  {editable ? (
                    <Select
                      className="h-9 min-w-[220px] text-[12.5px]"
                      options={itemOptions}
                      value={line.uic ? `${line.uic} — ${itemByUic(line.uic)?.description ?? line.description}` : ""}
                      placeholder="Select item"
                      onChange={(e) => pickItem(line.id, e.target.value)}
                    />
                  ) : (
                    <span className="font-mono text-[12px] font-medium text-ink-900">{line.uic}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-700">{line.description || "—"}</td>
                <td className="px-2 py-1.5">
                  {editable ? (
                    <Input
                      className="h-9 min-w-[150px] text-[12.5px]"
                      value={line.specification}
                      onChange={(e) => patchLine(line.id, { specification: e.target.value })}
                    />
                  ) : (
                    line.specification || "—"
                  )}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {editable ? (
                    <Input
                      type="number"
                      min={1}
                      className="h-9 w-[90px] text-right text-[12.5px]"
                      value={line.qty}
                      onChange={(e) => patchLine(line.id, { qty: Number(e.target.value) })}
                    />
                  ) : (
                    line.qty.toLocaleString()
                  )}
                </td>
                <td className="px-3 py-2 text-ink-600">{line.uom}</td>
                <td className="px-2 py-1.5">
                  {editable ? (
                    <Input
                      type="date"
                      className="h-9 w-[150px] text-[12.5px]"
                      value={line.requiredDate}
                      onChange={(e) => patchLine(line.id, { requiredDate: e.target.value })}
                    />
                  ) : (
                    dateShort(line.requiredDate)
                  )}
                </td>
                <td className="px-2 py-1.5">
                  {editable ? (
                    <Input
                      className="h-9 min-w-[130px] text-[12.5px]"
                      value={line.remarks}
                      onChange={(e) => patchLine(line.id, { remarks: e.target.value })}
                    />
                  ) : (
                    line.remarks || "—"
                  )}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {editable && (
                    <Button
                      size="xs"
                      variant="ghost"
                      aria-label={`Remove line ${i + 1}`}
                      icon={<X className="size-3.5" />}
                      onClick={() => dropLine(line.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {errors.lines && <p className="mt-2 text-[12px] font-medium text-red-600">{errors.lines}</p>}

      {editable && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button icon={<FilePlus2 className="size-3.5" />} onClick={addLine}>
            Add Item
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="md" variant="subtle" icon={<Save className="size-4" />} onClick={onSaveDraft}>
              Save Draft
            </Button>
            <Button size="md" variant="primary" icon={<Send className="size-4" />} onClick={onSubmit}>
              Submit for Approval
            </Button>
          </div>
        </div>
      )}

      <NoteBar className="mt-5">
        Status: {draft.status.toUpperCase()} | Approval route:{" "}
        {unitByCode(draft.unitCode)?.defaultApprover ?? "Unit Approver"} | Audit trail enabled
      </NoteBar>

      {draft.approverComment && (
        <div className="mt-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-[12.5px] text-ink-700">
          <span className="font-semibold text-ink-900">{draft.approver}</span> · {draft.status} ·{" "}
          {draft.decidedAt ? dateShort(draft.decidedAt) : ""} — “{draft.approverComment}”
        </div>
      )}

      <SectionHeading
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search PR…"
                aria-label="Search requisitions"
                className="focus-brand h-9 w-[200px] rounded-lg border border-ink-200 bg-surface pl-8 pr-3 text-[12.5px] text-ink-800 placeholder:text-ink-400"
              />
            </div>
            <Select
              className="h-9 w-[170px] text-[12.5px]"
              options={PR_STATUS}
              value={statusFilter === "All" ? "" : statusFilter}
              placeholder="All statuses"
              onChange={(e) => setStatusFilter((e.target.value || "All") as PrStatus | "All")}
            />
          </div>
        }
      >
        PR Register ({register.length})
      </SectionHeading>

      <DataGrid
        columns={[
          { key: "prNo", label: "PR No.", mono: true, width: "150px" },
          { key: "unitCode", label: "Unit", mono: true, width: "110px" },
          { key: "requester", label: "Requester" },
          { key: "prDate", label: "PR Date", width: "120px", render: (pr: CpsPr) => dateShort(pr.prDate) },
          { key: "requiredBy", label: "Required By", width: "120px", render: (pr: CpsPr) => dateShort(pr.requiredBy) },
          { key: "lines", label: "Lines", align: "right", width: "80px", render: (pr: CpsPr) => pr.lines.length },
          { key: "qty", label: "Total Qty", align: "right", width: "110px", render: (pr: CpsPr) => prQty(pr).toLocaleString() },
          { key: "priority", label: "Priority", width: "100px" },
          { key: "status", label: "Status", width: "150px", render: (pr: CpsPr) => <StatusPill value={pr.status} /> },
          {
            key: "dc",
            label: "Consolidation",
            width: "140px",
            render: (pr: CpsPr) => pr.consolidatedIn ?? "—",
          },
          {
            key: "action",
            label: "",
            align: "right",
            width: "60px",
            render: (pr: CpsPr) =>
              pr.status === "Draft" ? (
                <Button
                  size="xs"
                  variant="ghost"
                  aria-label={`Delete ${pr.prNo}`}
                  icon={<Trash2 className="size-3.5" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setToDelete(pr);
                  }}
                />
              ) : null,
          },
        ]}
        rows={register}
        rowKey={(pr) => pr.id}
        pageSize={10}
        activeKey={draft.id}
        onRowClick={(pr) => {
          setDraft({ ...pr, lines: pr.lines.map((l) => ({ ...l })) });
          setErrors({});
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        empty="No requisition matches this filter."
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          removePr(toDelete);
          toast.success(`${toDelete.prNo} deleted`);
          if (draft.id === toDelete.id) startNew();
        }}
        title={`Delete ${toDelete?.prNo ?? ""}?`}
        body="Only draft requisitions can be deleted. Submitted documents stay in the register for audit."
      />
    </>
  );
}
