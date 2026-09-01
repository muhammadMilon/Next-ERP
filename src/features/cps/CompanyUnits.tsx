"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/Badge";
import { DataGrid, FormGrid, LField, NoAccess, NoteBar, ScreenTitle, SectionHeading } from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import { ACTIVE_STATUS, type ActiveStatus, type CpsUnit } from "@/lib/cps/types";

const BLANK = {
  id: "",
  code: "",
  name: "",
  shortName: "",
  legalName: "",
  procurementAuthority: "Central Procurement",
  defaultApprover: "",
  status: "Active" as ActiveStatus,
  remarks: "",
};

export function CompanyUnits() {
  const { state, can, saveUnit, removeUnit } = useCps();
  const [form, setForm] = useState<CpsUnit>({ ...BLANK });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<CpsUnit | null>(null);

  const editing = Boolean(form.id);
  const approvers = useMemo(
    () => [...new Set(state.users.filter((u) => u.role === "PR Approver").map((u) => u.name))],
    [state.users],
  );

  if (!can("manageMasters")) return <NoAccess what="Company Unit Registration" role={state.role} />;

  const set = <K extends keyof CpsUnit>(key: K, value: CpsUnit[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.code.trim()) next.code = "Unit code is required";
    else if (state.units.some((u) => u.code.toLowerCase() === form.code.trim().toLowerCase() && u.id !== form.id))
      next.code = "This unit code already exists";
    if (!form.name.trim()) next.name = "Unit name is required";
    if (!form.shortName.trim()) next.shortName = "Short name is required";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please correct the highlighted fields");
      return;
    }
    const unit: CpsUnit = {
      ...form,
      id: form.id || `unit-${Date.now().toString(36)}`,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
    };
    saveUnit(unit);
    toast.success(`${unit.code} — ${unit.name} ${editing ? "updated" : "registered"}`);
    setForm({ ...BLANK });
  };

  return (
    <>
      <ScreenTitle
        title="Company Unit Registration"
        hint="Every requisition, consolidation and order is traceable back to a registered company unit."
        actions={
          <>
            {editing && (
              <Button icon={<X className="size-3.5" />} onClick={() => setForm({ ...BLANK })}>
                Cancel edit
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Plus className="size-3.5" />}
              onClick={() => {
                setForm({ ...BLANK });
                setErrors({});
              }}
            >
              New Unit
            </Button>
          </>
        }
      />

      <FormGrid>
        <LField label="Unit Code" required error={errors.code}>
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value)}
            placeholder="BAY-001"
            invalid={Boolean(errors.code)}
          />
        </LField>
        <LField label="Unit Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Bay Emporium Ltd."
            invalid={Boolean(errors.name)}
          />
        </LField>
        <LField label="Short Name" required error={errors.shortName}>
          <Input
            value={form.shortName}
            onChange={(e) => set("shortName", e.target.value.toUpperCase())}
            placeholder="BEL"
            invalid={Boolean(errors.shortName)}
          />
        </LField>
        <LField label="Status" required>
          <Select
            options={ACTIVE_STATUS}
            value={form.status}
            placeholder="Select status"
            onChange={(e) => set("status", e.target.value as ActiveStatus)}
          />
        </LField>

        <LField label="Legal / Registered Name" span={2}>
          <Input
            value={form.legalName}
            onChange={(e) => set("legalName", e.target.value)}
            placeholder="Bay Emporium Limited"
          />
        </LField>
        <LField label="Procurement Authority" span={2}>
          <Input
            value={form.procurementAuthority}
            onChange={(e) => set("procurementAuthority", e.target.value)}
            placeholder="Central Procurement"
          />
        </LField>

        <LField label="Default Approver" span={2}>
          <Select
            options={approvers}
            value={form.defaultApprover}
            placeholder="Select User"
            onChange={(e) => set("defaultApprover", e.target.value)}
          />
        </LField>
        <LField label="Remarks" span={2}>
          <Textarea rows={1} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
        </LField>
      </FormGrid>

      <div className="mt-4 flex justify-end">
        <Button variant="primary" size="md" icon={<Save className="size-4" />} onClick={submit}>
          {editing ? "Update Unit" : "Save Unit"}
        </Button>
      </div>

      <SectionHeading>Registered Units</SectionHeading>
      <DataGrid
        columns={[
          { key: "code", label: "Code", mono: true, width: "120px" },
          { key: "name", label: "Unit Name" },
          { key: "shortName", label: "Short", width: "90px" },
          { key: "procurementAuthority", label: "Procurement Authority" },
          { key: "defaultApprover", label: "Default Approver" },
          {
            key: "status",
            label: "Status",
            width: "110px",
            render: (u: CpsUnit) => <StatusPill value={u.status} />,
          },
          {
            key: "action",
            label: "Action",
            align: "right",
            width: "120px",
            render: (u: CpsUnit) => (
              <span className="flex justify-end gap-1">
                <Button
                  size="xs"
                  variant="ghost"
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => {
                    setForm(u);
                    setErrors({});
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit
                </Button>
                <Button size="xs" variant="ghost" icon={<Trash2 className="size-3.5" />} onClick={() => setToDelete(u)}>
                  <span className="sr-only">Delete</span>
                </Button>
              </span>
            ),
          },
        ]}
        rows={state.units}
        rowKey={(u) => u.id}
        empty="No company unit registered yet."
      />

      <NoteBar className="mt-5">
        Controlled unit master → each PR carries its requesting unit → consolidated demand stays traceable to the
        unit that raised it.
      </NoteBar>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          removeUnit(toDelete);
          toast.success(`${toDelete.code} removed`);
          if (form.id === toDelete.id) setForm({ ...BLANK });
        }}
        title={`Delete ${toDelete?.code ?? ""}?`}
        body="Existing requisitions keep their unit code, but the unit will no longer be selectable on new documents."
      />
    </>
  );
}
