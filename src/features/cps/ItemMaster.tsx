"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/Badge";
import {
  DataGrid,
  FormGrid,
  LField,
  NoAccess,
  NoteBar,
  ScreenTitle,
  SectionHeading,
  money,
} from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import {
  ACTIVE_STATUS,
  ITEM_CATEGORY,
  SUB_CATEGORIES,
  UOMS,
  type ActiveStatus,
  type CpsItem,
  type ItemCategory,
  type Uom,
} from "@/lib/cps/types";

const BLANK: CpsItem = {
  id: "",
  uic: "",
  category: "Indirect",
  description: "",
  uom: "Pcs",
  specification: "",
  subCategory: "PPE",
  capexFlag: "No",
  status: "Active",
  remarks: "",
  indicativeRate: 0,
};

const nextUic = (items: CpsItem[], category: ItemCategory) => {
  const prefix = category === "CAPEX" ? "CAP" : "IND";
  const nums = items
    .filter((i) => i.uic.startsWith(`${prefix}-`))
    .map((i) => Number(i.uic.slice(prefix.length + 1)))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
};

export function ItemMaster() {
  const { state, can, saveItem, removeItem } = useCps();
  const [form, setForm] = useState<CpsItem>({ ...BLANK });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<CpsItem | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ItemCategory | "All">("All");

  const editing = Boolean(form.id);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.items.filter((i) => {
      if (filter !== "All" && i.category !== filter) return false;
      if (!q) return true;
      return `${i.uic} ${i.description} ${i.subCategory}`.toLowerCase().includes(q);
    });
  }, [state.items, query, filter]);

  if (!can("manageMasters")) return <NoAccess what="Item Master Registration" role={state.role} />;

  const set = <K extends keyof CpsItem>(key: K, value: CpsItem[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const setCategory = (category: ItemCategory) =>
    setForm((f) => ({
      ...f,
      category,
      capexFlag: category === "CAPEX" ? "Yes" : "No",
      uic: f.id ? f.uic : nextUic(state.items, category),
    }));

  const submit = () => {
    const next: Record<string, string> = {};
    const uic = form.uic.trim() || nextUic(state.items, form.category);
    if (state.items.some((i) => i.uic.toLowerCase() === uic.toLowerCase() && i.id !== form.id))
      next.uic = "This item code already exists";
    if (!form.description.trim()) next.description = "Description is required";
    if (form.indicativeRate < 0) next.indicativeRate = "Rate cannot be negative";
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please correct the highlighted fields");
      return;
    }
    const item: CpsItem = { ...form, uic, id: form.id || `item-${Date.now().toString(36)}` };
    saveItem(item);
    toast.success(`${item.uic} — ${item.description} ${editing ? "updated" : "registered"}`);
    setForm({ ...BLANK });
  };

  return (
    <>
      <ScreenTitle
        title="Item Master — Indirect & CAPEX"
        hint="One controlled item identity for the whole group, so demand can be consolidated item-wise."
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
                setForm({ ...BLANK, uic: nextUic(state.items, "Indirect") });
                setErrors({});
              }}
            >
              New Item
            </Button>
          </>
        }
      />

      <FormGrid>
        <LField label="Item Code / UIC" error={errors.uic} hint={editing ? undefined : "Leave blank to auto-generate"}>
          <Input
            value={form.uic}
            onChange={(e) => set("uic", e.target.value.toUpperCase())}
            placeholder={nextUic(state.items, form.category)}
            invalid={Boolean(errors.uic)}
          />
        </LField>
        <LField label="Category" required>
          <Select
            options={ITEM_CATEGORY}
            value={form.category}
            placeholder="Select category"
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
          />
        </LField>
        <LField label="Description" required error={errors.description}>
          <Input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Safety Shoe"
            invalid={Boolean(errors.description)}
          />
        </LField>
        <LField label="UOM" required>
          <Select
            options={UOMS}
            value={form.uom}
            placeholder="Select UOM"
            onChange={(e) => set("uom", e.target.value as Uom)}
          />
        </LField>

        <LField label="Specification" span={2}>
          <Input
            value={form.specification}
            onChange={(e) => set("specification", e.target.value)}
            placeholder="Safety standard / size / material"
          />
        </LField>
        <LField label="Sub-category">
          <Select
            options={SUB_CATEGORIES}
            value={form.subCategory}
            placeholder="Select sub-category"
            onChange={(e) => set("subCategory", e.target.value)}
          />
        </LField>
        <LField label="CAPEX Flag">
          <Select
            options={["Yes", "No"]}
            value={form.capexFlag}
            placeholder="Select"
            onChange={(e) => set("capexFlag", e.target.value as CpsItem["capexFlag"])}
          />
        </LField>

        <LField label="Indicative Rate (BDT)" error={errors.indicativeRate} hint="Default unit price on allocation">
          <Input
            type="number"
            min={0}
            value={form.indicativeRate}
            onChange={(e) => set("indicativeRate", Number(e.target.value))}
            invalid={Boolean(errors.indicativeRate)}
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
        <LField label="Remarks" span={2}>
          <Textarea rows={1} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
        </LField>
      </FormGrid>

      <div className="mt-4 flex justify-end">
        <Button variant="primary" size="md" icon={<Save className="size-4" />} onClick={submit}>
          {editing ? "Update Item" : "Save Item"}
        </Button>
      </div>

      <SectionHeading>Design rule</SectionHeading>
      <NoteBar>
        Controlled Group Item Master → unique item identity → accurate item-wise demand consolidation.
      </NoteBar>

      <SectionHeading
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search item…"
                aria-label="Search items"
                className="focus-brand h-9 w-[200px] rounded-lg border border-ink-200 bg-white pl-8 pr-3 text-[12.5px] text-ink-800 placeholder:text-ink-400"
              />
            </div>
            {(["All", ...ITEM_CATEGORY] as const).map((c) => (
              <Button
                key={c}
                size="xs"
                variant={filter === c ? "primary" : "secondary"}
                onClick={() => setFilter(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        }
      >
        Registered Items ({rows.length})
      </SectionHeading>

      <DataGrid
        columns={[
          { key: "uic", label: "UIC", mono: true, width: "130px" },
          { key: "category", label: "Category", width: "110px" },
          { key: "description", label: "Description" },
          { key: "subCategory", label: "Sub-category" },
          { key: "uom", label: "UOM", width: "80px" },
          {
            key: "indicativeRate",
            label: "Rate (BDT)",
            align: "right",
            width: "120px",
            render: (i: CpsItem) => money(i.indicativeRate),
          },
          { key: "status", label: "Status", width: "110px", render: (i: CpsItem) => <StatusPill value={i.status} /> },
          {
            key: "action",
            label: "Action",
            align: "right",
            width: "120px",
            render: (i: CpsItem) => (
              <span className="flex justify-end gap-1">
                <Button
                  size="xs"
                  variant="ghost"
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => {
                    setForm(i);
                    setErrors({});
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit
                </Button>
                <Button size="xs" variant="ghost" icon={<Trash2 className="size-3.5" />} onClick={() => setToDelete(i)}>
                  <span className="sr-only">Delete</span>
                </Button>
              </span>
            ),
          },
        ]}
        rows={rows}
        rowKey={(i) => i.id}
        empty="No item matches this filter."
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          removeItem(toDelete);
          toast.success(`${toDelete.uic} removed`);
          if (form.id === toDelete.id) setForm({ ...BLANK });
        }}
        title={`Delete ${toDelete?.uic ?? ""}?`}
        body="Historic requisitions keep the item code, but it can no longer be selected on new requisitions."
      />
    </>
  );
}
