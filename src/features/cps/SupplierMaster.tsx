"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/Badge";
import { DataGrid, FormGrid, LField, NoAccess, NoteBar, ScreenTitle, SectionHeading } from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import { ACTIVE_STATUS, PAYMENT_TERMS, type ActiveStatus, type CpsSupplier } from "@/lib/cps/types";

const BLANK: CpsSupplier = {
  id: "",
  code: "",
  name: "",
  type: "Local",
  status: "Active",
  contactPerson: "",
  email: "",
  paymentTerm: "30 Days",
  taxReg: "As applicable",
  remarks: "",
};

const nextCode = (suppliers: CpsSupplier[]) => {
  const nums = suppliers
    .map((s) => Number(s.code.replace("SUP-", "")))
    .filter((n) => Number.isFinite(n));
  return `SUP-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(5, "0")}`;
};

export function SupplierMaster() {
  const { state, can, saveSupplier, removeSupplier } = useCps();
  const [form, setForm] = useState<CpsSupplier>({ ...BLANK });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<CpsSupplier | null>(null);
  const [query, setQuery] = useState("");

  const editing = Boolean(form.id);

  /** Allocation volume per supplier — the master screen doubles as a panel view. */
  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const dc of state.consolidations) {
      for (const line of dc.lines) {
        for (const a of line.allocations) map.set(a.supplierCode, (map.get(a.supplierCode) ?? 0) + 1);
      }
    }
    return map;
  }, [state.consolidations]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.suppliers;
    return state.suppliers.filter((s) => `${s.code} ${s.name} ${s.contactPerson}`.toLowerCase().includes(q));
  }, [state.suppliers, query]);

  if (!can("manageMasters")) return <NoAccess what="Supplier Master Registration" role={state.role} />;

  const set = <K extends keyof CpsSupplier>(key: K, value: CpsSupplier[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const submit = () => {
    const next: Record<string, string> = {};
    const code = form.code.trim() || nextCode(state.suppliers);
    if (state.suppliers.some((s) => s.code.toLowerCase() === code.toLowerCase() && s.id !== form.id))
      next.code = "This supplier code already exists";
    if (!form.name.trim()) next.name = "Supplier name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please correct the highlighted fields");
      return;
    }
    const supplier: CpsSupplier = { ...form, code, id: form.id || `sup-${Date.now().toString(36)}` };
    saveSupplier(supplier);
    toast.success(`${supplier.name} ${editing ? "updated" : "registered"}`);
    setForm({ ...BLANK });
  };

  return (
    <>
      <ScreenTitle
        title="Supplier Master Registration"
        hint="The approved panel that central procurement allocates consolidated demand to."
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
                setForm({ ...BLANK, code: nextCode(state.suppliers) });
                setErrors({});
              }}
            >
              New Supplier
            </Button>
          </>
        }
      />

      <FormGrid>
        <LField label="Supplier Code" error={errors.code} hint={editing ? undefined : "Leave blank to auto-generate"}>
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder={nextCode(state.suppliers)}
            invalid={Boolean(errors.code)}
          />
        </LField>
        <LField label="Supplier Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="ABC Trading Ltd."
            invalid={Boolean(errors.name)}
          />
        </LField>
        <LField label="Supplier Type">
          <Select
            options={["Local", "Foreign"]}
            value={form.type}
            placeholder="Select type"
            onChange={(e) => set("type", e.target.value as CpsSupplier["type"])}
          />
        </LField>
        <LField label="Status">
          <Select
            options={ACTIVE_STATUS}
            value={form.status}
            placeholder="Select status"
            onChange={(e) => set("status", e.target.value as ActiveStatus)}
          />
        </LField>

        <LField label="Contact Person">
          <Input
            value={form.contactPerson}
            onChange={(e) => set("contactPerson", e.target.value)}
            placeholder="Mr. Karim"
          />
        </LField>
        <LField label="Email" error={errors.email}>
          <Input
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="sales@abc.com"
            invalid={Boolean(errors.email)}
          />
        </LField>
        <LField label="Payment Term">
          <Select
            options={PAYMENT_TERMS}
            value={form.paymentTerm}
            placeholder="Select term"
            onChange={(e) => set("paymentTerm", e.target.value)}
          />
        </LField>
        <LField label="Tax / BIN / Registration">
          <Input value={form.taxReg} onChange={(e) => set("taxReg", e.target.value)} placeholder="As applicable" />
        </LField>

        <LField label="Remarks" span={4}>
          <Textarea rows={1} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
        </LField>
      </FormGrid>

      <SectionHeading>Purpose</SectionHeading>
      <NoteBar>
        Supplier master supports central procurement supplier selection, allocation and PO preparation.
      </NoteBar>

      <div className="mt-4 flex justify-end">
        <Button variant="primary" size="md" icon={<Save className="size-4" />} onClick={submit}>
          {editing ? "Update Supplier" : "Save Supplier"}
        </Button>
      </div>

      <SectionHeading
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search supplier…"
              aria-label="Search suppliers"
              className="focus-brand h-9 w-[220px] rounded-lg border border-ink-200 bg-surface pl-8 pr-3 text-[12.5px] text-ink-800 placeholder:text-ink-400"
            />
          </div>
        }
      >
        Registered Suppliers ({rows.length})
      </SectionHeading>

      <DataGrid
        columns={[
          { key: "code", label: "Code", mono: true, width: "120px" },
          { key: "name", label: "Supplier Name" },
          { key: "type", label: "Type", width: "90px" },
          { key: "contactPerson", label: "Contact Person" },
          { key: "email", label: "Email" },
          { key: "paymentTerm", label: "Payment Term", width: "120px" },
          {
            key: "allocations",
            label: "Allocations",
            align: "right",
            width: "110px",
            render: (s: CpsSupplier) => usage.get(s.code) ?? 0,
          },
          { key: "status", label: "Status", width: "110px", render: (s: CpsSupplier) => <StatusPill value={s.status} /> },
          {
            key: "action",
            label: "Action",
            align: "right",
            width: "120px",
            render: (s: CpsSupplier) => (
              <span className="flex justify-end gap-1">
                <Button
                  size="xs"
                  variant="ghost"
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => {
                    setForm(s);
                    setErrors({});
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit
                </Button>
                <Button size="xs" variant="ghost" icon={<Trash2 className="size-3.5" />} onClick={() => setToDelete(s)}>
                  <span className="sr-only">Delete</span>
                </Button>
              </span>
            ),
          },
        ]}
        rows={rows}
        rowKey={(s) => s.id}
        empty="No supplier matches this search."
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          removeSupplier(toDelete);
          toast.success(`${toDelete.name} removed`);
          if (form.id === toDelete.id) setForm({ ...BLANK });
        }}
        title={`Delete ${toDelete?.name ?? ""}?`}
        body="Existing allocations and orders keep this supplier, but it cannot be allocated new demand."
      />
    </>
  );
}
