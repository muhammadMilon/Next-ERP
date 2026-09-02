"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, FileText, Printer, Save, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
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
import { PAYMENT_TERMS, lineValue, poValue, type CpsPo, type CpsPoLine } from "@/lib/cps/types";
import { COMPANY } from "@/lib/data/reference";
import { dateShort, todayISO } from "@/lib/utils/format";

/** Read once at module load so render stays pure. */
const TODAY = todayISO();

export function PurchaseOrder() {
  const { state, can, draftPoFrom, savePo, setPoStatus, removePo, supplierByCode } = useCps();
  const confirmed = useMemo(
    () => state.consolidations.filter((c) => c.status === "Confirmed"),
    [state.consolidations],
  );

  const suppliersIn = (dcNo: string) => {
    const dc = state.consolidations.find((c) => c.dcNo === dcNo);
    const codes = new Set<string>();
    if (dc) for (const line of dc.lines) for (const a of line.allocations) codes.add(a.supplierCode);
    return [...codes];
  };

  const [dcNo, setDcNo] = useState(confirmed[0]?.dcNo ?? "");
  const [supplierCode, setSupplierCode] = useState(() => suppliersIn(confirmed[0]?.dcNo ?? "")[0] ?? "");
  /** Only user edits live in state; the base order is derived from the selection. */
  const [edits, setEdits] = useState<CpsPo | null>(null);
  const [preview, setPreview] = useState(false);
  const [toDelete, setToDelete] = useState<CpsPo | null>(null);

  const dc = confirmed.find((c) => c.dcNo === dcNo) ?? null;
  const supplierOptions = useMemo(
    () => (dc ? suppliersIn(dc.dcNo).map((code) => supplierByCode(code)?.name ?? code) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dc, state.suppliers],
  );

  const existing = state.pos.find((p) => p.dcNo === dcNo && p.supplierCode === supplierCode) ?? null;
  const derived = dcNo && supplierCode ? existing ?? draftPoFrom(dcNo, supplierCode, TODAY) : null;
  const po = edits && edits.dcNo === dcNo && edits.supplierCode === supplierCode ? edits : derived;

  const selectDc = (nextDc: string) => {
    setDcNo(nextDc);
    setSupplierCode(suppliersIn(nextDc)[0] ?? "");
    setEdits(null);
  };

  const selectSupplier = (code: string) => {
    setSupplierCode(code);
    setEdits(null);
  };

  if (!can("createPO") && !can("approvePO")) return <NoAccess what="Purchase Order" role={state.role} />;

  const saved = Boolean(existing);
  const editable = Boolean(po && po.status === "Draft" && can("createPO"));
  const total = po ? poValue(po) : 0;

  const patch = <K extends keyof CpsPo>(key: K, value: CpsPo[K]) => {
    if (!po) return;
    setEdits({ ...po, [key]: value });
  };

  const onSave = () => {
    if (!po) return;
    if (!po.lines.length) {
      toast.error("This supplier has no allocation in the selected consolidation.");
      return;
    }
    savePo(po, saved ? "Updated purchase order" : "Created purchase order");
    toast.success(`${po.poNo} saved as draft`);
  };

  const onSubmit = () => {
    if (!po) return;
    savePo({ ...po, status: "Pending Approval" }, "Submitted purchase order");
    setEdits({ ...po, status: "Pending Approval" });
    toast.success(`${po.poNo} submitted for approval — BDT ${money(total)}`);
  };

  const onRelease = (target: CpsPo) => {
    if (!can("approvePO")) {
      toast.error("Only a PR Approver or Admin may release a purchase order.");
      return;
    }
    setPoStatus(target, "Released");
    if (po?.poNo === target.poNo) setEdits({ ...target, status: "Released" });
    toast.success(`${target.poNo} released to ${supplierByCode(target.supplierCode)?.name ?? "the supplier"}`);
  };

  return (
    <>
      <ScreenTitle
        title="Consolidated Purchase Order"
        hint="Every order originates from a confirmed supplier allocation and stays linked to its source demand."
        actions={
          po && saved && po.status !== "Released" && can("approvePO") ? (
            <Button variant="primary" icon={<Check className="size-3.5" />} onClick={() => onRelease(po)}>
              Release PO
            </Button>
          ) : undefined
        }
      />

      {confirmed.length === 0 ? (
        <NoteBar tone="amber">
          No confirmed consolidation yet — confirm a demand consolidation first, then raise the purchase order from
          its supplier allocation.
        </NoteBar>
      ) : (
        <>
          <FormGrid>
            <LField label="PO No.">
              <Input value={po ? (saved ? po.poNo : "Auto") : "—"} readOnly disabled />
            </LField>
            <LField label="Consolidation No." required>
              <Select
                options={confirmed.map((c) => `${c.dcNo} · ${c.period}`)}
                value={dc ? `${dc.dcNo} · ${dc.period}` : ""}
                placeholder="Select consolidation"
                onChange={(e) => selectDc(e.target.value.split(" · ")[0])}
              />
            </LField>
            <LField label="Supplier" required>
              <Select
                options={supplierOptions}
                value={supplierCode ? supplierByCode(supplierCode)?.name ?? "" : ""}
                placeholder="Select supplier"
                onChange={(e) => {
                  const supplier = state.suppliers.find((s) => s.name === e.target.value);
                  selectSupplier(supplier?.code ?? "");
                }}
              />
            </LField>
            <LField label="PO Date">
              <Input
                type="date"
                value={po?.poDate ?? ""}
                disabled={!editable}
                onChange={(e) => patch("poDate", e.target.value)}
              />
            </LField>

            <LField label="Required Date">
              <Input
                type="date"
                value={po?.requiredDate ?? ""}
                disabled={!editable}
                onChange={(e) => patch("requiredDate", e.target.value)}
              />
            </LField>
            <LField label="Payment Term">
              <Select
                options={PAYMENT_TERMS}
                value={po?.paymentTerm ?? ""}
                placeholder="Select term"
                disabled={!editable}
                onChange={(e) => patch("paymentTerm", e.target.value)}
              />
            </LField>
            <LField label="Currency">
              <Select
                options={["BDT", "USD"]}
                value={po?.currency ?? "BDT"}
                placeholder="Select currency"
                disabled={!editable}
                onChange={(e) => patch("currency", e.target.value as CpsPo["currency"])}
              />
            </LField>
            <LField label="PO Status">
              <div className="flex h-10 items-center">
                <StatusPill value={po?.status ?? "Draft"} />
              </div>
            </LField>
          </FormGrid>

          <SectionHeading>PO Details</SectionHeading>
          <DataGrid
            columns={[
              { key: "sl", label: "SL", width: "60px", render: (_l: CpsPoLine, i: number) => i + 1 },
              { key: "uic", label: "Item / UIC", mono: true, width: "150px" },
              { key: "description", label: "Description" },
              { key: "qty", label: "Qty", align: "right", width: "110px", render: (l: CpsPoLine) => l.qty.toLocaleString() },
              { key: "uom", label: "UOM", width: "80px" },
              {
                key: "unitPrice",
                label: "Unit Price",
                align: "right",
                width: "120px",
                render: (l: CpsPoLine) => money(l.unitPrice, 2),
              },
              {
                key: "value",
                label: "Value",
                align: "right",
                width: "140px",
                render: (l: CpsPoLine) => money(lineValue(l.qty, l.unitPrice)),
              },
            ]}
            rows={po?.lines ?? []}
            rowKey={(l) => l.id}
            empty="This supplier carries no allocation in the selected consolidation."
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <LField label="Remarks">
              <Input
                value={po?.remarks ?? ""}
                disabled={!editable}
                onChange={(e) => patch("remarks", e.target.value)}
                placeholder="As per negotiated terms"
              />
            </LField>
            <div className="flex items-end justify-end gap-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-500">PO Value</span>
              <span className="font-mono text-[24px] font-bold leading-none text-ink-900">
                {po?.currency ?? "BDT"} {money(total)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button size="md" variant="subtle" icon={<Save className="size-4" />} disabled={!editable} onClick={onSave}>
              Save Draft
            </Button>
            <Button size="md" variant="primary" icon={<Send className="size-4" />} disabled={!editable} onClick={onSubmit}>
              Submit Approval
            </Button>
            <Button size="md" icon={<Printer className="size-4" />} disabled={!po} onClick={() => setPreview(true)}>
              Preview PO
            </Button>
          </div>

          <NoteBar className="mt-5">
            Traceability: PO → Supplier Allocation → Consolidated Demand → Source PRs
            {dc ? ` (${dc.sourcePrNos.length} requisitions behind ${dc.dcNo})` : ""}
          </NoteBar>
        </>
      )}

      <SectionHeading>Purchase Order Register ({state.pos.length})</SectionHeading>
      <DataGrid
        columns={[
          { key: "poNo", label: "PO No.", mono: true, width: "150px" },
          { key: "dcNo", label: "Consolidation", mono: true, width: "150px" },
          {
            key: "supplier",
            label: "Supplier",
            render: (p: CpsPo) => supplierByCode(p.supplierCode)?.name ?? p.supplierCode,
          },
          { key: "poDate", label: "PO Date", width: "120px", render: (p: CpsPo) => dateShort(p.poDate) },
          { key: "lines", label: "Lines", align: "right", width: "80px", render: (p: CpsPo) => p.lines.length },
          {
            key: "value",
            label: "PO Value",
            align: "right",
            width: "150px",
            render: (p: CpsPo) => money(poValue(p)),
          },
          { key: "status", label: "Status", width: "150px", render: (p: CpsPo) => <StatusPill value={p.status} /> },
          {
            key: "action",
            label: "Action",
            align: "right",
            width: "140px",
            render: (p: CpsPo) => (
              <span className="flex justify-end gap-1">
                {p.status !== "Released" && p.status !== "Cancelled" && can("approvePO") && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRelease(p);
                    }}
                  >
                    Release
                  </Button>
                )}
                {p.status === "Draft" && (
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={`Delete ${p.poNo}`}
                    icon={<Trash2 className="size-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setToDelete(p);
                    }}
                  />
                )}
              </span>
            ),
          },
        ]}
        rows={state.pos}
        rowKey={(p) => p.id}
        pageSize={10}
        activeKey={po?.id}
        onRowClick={(p) => {
          setDcNo(p.dcNo);
          setSupplierCode(p.supplierCode);
          setEdits(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        empty="No purchase order raised yet."
      />

      {/* Printable preview */}
      <Modal
        open={preview && Boolean(po)}
        onClose={() => setPreview(false)}
        size="lg"
        title={`Purchase Order ${po && saved ? po.poNo : "(draft)"}`}
        footer={
          <>
            <Button onClick={() => setPreview(false)}>Close</Button>
            <Button variant="primary" icon={<Printer className="size-4" />} onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      >
        {po && (
          <div className="space-y-4 text-[12.5px] text-ink-700">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 pb-3">
              <div>
                <p className="text-[15px] font-bold text-ink-900">{supplierByCode(po.supplierCode)?.name}</p>
                <p className="text-ink-500">
                  Contact: {supplierByCode(po.supplierCode)?.contactPerson} · {supplierByCode(po.supplierCode)?.email}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink-900">
                  {COMPANY.product} · {COMPANY.suite}
                </p>
                <p className="text-ink-500">
                  {po.poDate} · {po.paymentTerm} · {po.currency}
                </p>
              </div>
            </div>
            <DataGrid
              columns={[
                { key: "uic", label: "Item", mono: true, width: "140px" },
                { key: "description", label: "Description" },
                { key: "qty", label: "Qty", align: "right", width: "100px", render: (l: CpsPoLine) => l.qty.toLocaleString() },
                { key: "uom", label: "UOM", width: "80px" },
                {
                  key: "unitPrice",
                  label: "Unit Price",
                  align: "right",
                  width: "110px",
                  render: (l: CpsPoLine) => money(l.unitPrice, 2),
                },
                {
                  key: "value",
                  label: "Value",
                  align: "right",
                  width: "130px",
                  render: (l: CpsPoLine) => money(lineValue(l.qty, l.unitPrice)),
                },
              ]}
              rows={po.lines}
              rowKey={(l) => l.id}
              dense
            />
            <div className="flex justify-between border-t border-ink-200 pt-3">
              <span className="text-ink-500">
                Raised against {po.dcNo} · required by {dateShort(po.requiredDate)}
              </span>
              <span className="font-mono text-[16px] font-bold text-ink-900">
                {po.currency} {money(total)}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-ink-400">
              <FileText className="size-3.5" aria-hidden /> {po.remarks}
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          removePo(toDelete);
          toast.success(`${toDelete.poNo} deleted`);
          if (po?.id === toDelete.id) setEdits(null);
        }}
        title={`Delete ${toDelete?.poNo ?? ""}?`}
        body="Only draft orders can be deleted. The underlying supplier allocation is left untouched."
      />
    </>
  );
}
