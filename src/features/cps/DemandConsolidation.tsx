"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, LayersIcon, Plus, Save, Trash2, X } from "lucide-react";
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
import { buildConsolidationLines } from "@/lib/cps/seed";
import { openApprovedPrs, useCps } from "@/lib/cps/store";
import {
  ITEM_CATEGORY,
  allocatedQty,
  allocationValue,
  type CpsAllocation,
  type CpsConsolidation,
  type CpsConsolidationLine,
  type ItemCategory,
} from "@/lib/cps/types";
import { dateShort, todayISO } from "@/lib/utils/format";

const monthOf = (iso: string) => iso.slice(0, 7);
/** Read once at module load — never during render. */
const THIS_MONTH = monthOf(todayISO());
const monthName = (ym: string) =>
  new Date(`${ym}-01`).toLocaleDateString("en-GB", { month: "short", year: "numeric" }).replace(" ", "-");

export function DemandConsolidation() {
  const { state, can, itemByUic, supplierByCode, createConsolidation, saveConsolidation, confirmConsolidation, removeConsolidation } =
    useCps();

  const [dcNo, setDcNo] = useState<string>(() => state.consolidations.find((c) => c.status === "Draft")?.dcNo ?? "");
  const [period, setPeriod] = useState(THIS_MONTH);
  const [category, setCategory] = useState<ItemCategory | "All">("All");
  const [activeUic, setActiveUic] = useState<string | null>(null);
  const [drillUic, setDrillUic] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CpsConsolidation | null>(null);

  const consolidation = state.consolidations.find((c) => c.dcNo === dcNo) ?? null;
  const editable = Boolean(consolidation && consolidation.status === "Draft" && can("consolidateDemand"));

  /** What is available to pull in right now, for the chosen period and category. */
  const openPrs = useMemo(() => openApprovedPrs(state, category, period), [state, category, period]);
  const preview = useMemo(() => buildConsolidationLines(openPrs, state.items), [openPrs, state.items]);

  if (!can("consolidateDemand")) return <NoAccess what="Demand Consolidation" role={state.role} />;

  const lines = consolidation?.lines ?? [];
  const activeLine = lines.find((l) => l.uic === activeUic) ?? null;

  const patchLine = (uic: string, allocations: CpsAllocation[]) => {
    if (!consolidation) return;
    saveConsolidation(
      {
        ...consolidation,
        lines: consolidation.lines.map((l) => (l.uic === uic ? { ...l, allocations } : l)),
      },
      "Updated supplier allocation",
    );
  };

  const addAllocation = (line: CpsConsolidationLine) => {
    const used = new Set(line.allocations.map((a) => a.supplierCode));
    const supplier = state.suppliers.find((s) => s.status === "Active" && !used.has(s.code));
    if (!supplier) {
      toast.error("Every active supplier is already allocated on this item.");
      return;
    }
    const remaining = Math.max(0, line.demandQty - allocatedQty(line));
    patchLine(line.uic, [
      ...line.allocations,
      {
        id: `${line.uic}-${supplier.code}-${Date.now().toString(36)}`,
        supplierCode: supplier.code,
        qty: remaining,
        unitPrice: itemByUic(line.uic)?.indicativeRate ?? 0,
      },
    ]);
  };

  const build = () => {
    if (!preview.length) {
      toast.error("No unprocessed approved demand for this period and category.");
      return;
    }
    const created = createConsolidation({
      period: monthName(period),
      category,
      prNos: openPrs.map((p) => p.prNo),
    });
    if (!created) {
      toast.error("Nothing could be consolidated for this selection.");
      return;
    }
    setDcNo(created.dcNo);
    setActiveUic(created.lines[0]?.uic ?? null);
    toast.success(`${created.dcNo} created from ${openPrs.length} approved requisitions`);
  };

  const confirm = () => {
    if (!consolidation) return;
    const result = confirmConsolidation(consolidation);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const totalDemand = lines.reduce((s, l) => s + l.demandQty, 0);
  const totalAllocated = lines.reduce((s, l) => s + allocatedQty(l), 0);
  const totalValue = lines.reduce((s, l) => s + allocationValue(l), 0);
  const unbalanced = lines.filter((l) => allocatedQty(l) !== l.demandQty);

  return (
    <>
      <ScreenTitle
        title="Central Demand Consolidation"
        hint="Approved unit demand rolled up item-wise, then allocated across the supplier panel."
        actions={
          consolidation && consolidation.status === "Draft" ? (
            <>
              <Button icon={<Trash2 className="size-3.5" />} onClick={() => setToDelete(consolidation)}>
                Discard
              </Button>
              <Button variant="primary" icon={<Check className="size-3.5" />} onClick={confirm}>
                Confirm Consolidation
              </Button>
            </>
          ) : (
            <Button variant="primary" icon={<Plus className="size-3.5" />} onClick={() => setDcNo("")}>
              New Consolidation
            </Button>
          )
        }
      />

      <FormGrid>
        <LField label="Consolidation No.">
          <Select
            options={state.consolidations.map((c) => `${c.dcNo} · ${c.period} · ${c.status}`)}
            value={consolidation ? `${consolidation.dcNo} · ${consolidation.period} · ${consolidation.status}` : ""}
            placeholder="New consolidation"
            onChange={(e) => {
              const next = e.target.value.split(" · ")[0];
              setDcNo(next);
              setActiveUic(null);
            }}
          />
        </LField>
        <LField label="Period" hint={consolidation ? undefined : "Month of the approved requisitions"}>
          {consolidation ? (
            <Input value={consolidation.period} readOnly disabled />
          ) : (
            <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
          )}
        </LField>
        <LField label="Category">
          {consolidation ? (
            <Input value={consolidation.category} readOnly disabled />
          ) : (
            <Select
              options={["All", ...ITEM_CATEGORY]}
              value={category}
              placeholder="All categories"
              onChange={(e) => setCategory((e.target.value || "All") as ItemCategory | "All")}
            />
          )}
        </LField>
        <LField label="Status">
          <div className="flex h-10 items-center">
            <StatusPill value={consolidation?.status ?? "Draft"} />
          </div>
        </LField>
      </FormGrid>

      {!consolidation ? (
        <>
          <SectionHeading
            actions={
              <Button variant="primary" icon={<LayersIcon className="size-3.5" />} onClick={build}>
                Create Consolidation ({openPrs.length} PRs)
              </Button>
            }
          >
            Unprocessed Approved Demand — {monthName(period)}
          </SectionHeading>
          <DataGrid
            columns={[
              { key: "uic", label: "Item / UIC", mono: true, width: "150px" },
              { key: "description", label: "Description" },
              {
                key: "demandQty",
                label: "Total Demand",
                align: "right",
                width: "130px",
                render: (l: CpsConsolidationLine) => l.demandQty.toLocaleString(),
              },
              { key: "uom", label: "UOM", width: "90px" },
              { key: "unitCount", label: "Units", align: "right", width: "90px" },
              { key: "prCount", label: "PR Count", align: "right", width: "110px" },
            ]}
            rows={preview}
            rowKey={(l) => l.uic}
            empty="No approved requisition is waiting for consolidation in this period."
          />
          <NoteBar className="mt-5">
            Only approved requisitions that have not yet been consolidated are picked up — one PR can never be
            consolidated twice.
          </NoteBar>
        </>
      ) : (
        <>
          <SectionHeading>Item-wise Approved Demand</SectionHeading>
          <DataGrid
            columns={[
              { key: "uic", label: "Item / UIC", mono: true, width: "150px" },
              { key: "description", label: "Description" },
              {
                key: "demandQty",
                label: "Total Demand",
                align: "right",
                width: "130px",
                render: (l: CpsConsolidationLine) => l.demandQty.toLocaleString(),
              },
              { key: "uom", label: "UOM", width: "80px" },
              { key: "unitCount", label: "Units", align: "right", width: "80px" },
              {
                key: "prCount",
                label: "PR Count",
                align: "right",
                width: "110px",
                render: (l: CpsConsolidationLine) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrillUic(l.uic);
                    }}
                    className="focus-brand rounded font-medium text-brand-700 underline decoration-dotted underline-offset-2"
                  >
                    {l.prCount}
                  </button>
                ),
              },
              {
                key: "allocated",
                label: "Allocated",
                align: "right",
                width: "120px",
                render: (l: CpsConsolidationLine) => {
                  const done = allocatedQty(l);
                  return (
                    <span className={done === l.demandQty ? "font-semibold text-brand-700" : "font-semibold text-amber-700"}>
                      {done.toLocaleString()}
                    </span>
                  );
                },
              },
              {
                key: "action",
                label: "Action",
                align: "right",
                width: "110px",
                render: (l: CpsConsolidationLine) => (
                  <Button size="xs" variant={activeUic === l.uic ? "primary" : "outline"} onClick={() => setActiveUic(l.uic)}>
                    Allocate
                  </Button>
                ),
              },
            ]}
            rows={lines}
            rowKey={(l) => l.uic}
            activeKey={activeUic ?? undefined}
            onRowClick={(l) => setActiveUic(l.uic)}
            empty="This consolidation has no line."
          />

          {activeLine && (
            <>
              <SectionHeading
                actions={
                  editable ? (
                    <Button size="xs" variant="primary" icon={<Plus className="size-3.5" />} onClick={() => addAllocation(activeLine)}>
                      Add Supplier
                    </Button>
                  ) : undefined
                }
              >
                Selected Item: {activeLine.uic} — Supplier Allocation
              </SectionHeading>

              <div className="overflow-x-auto rounded-lg border border-ink-200">
                <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-navy-800 text-white">
                      {["Supplier", "Negotiated Qty", "UOM", "Unit Price", "Allocation Value", ""].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.04em]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeLine.allocations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-[12.5px] text-ink-400">
                          No supplier allocated yet — one item may be split across multiple suppliers.
                        </td>
                      </tr>
                    )}
                    {activeLine.allocations.map((a, i) => (
                      <tr key={a.id} className={i % 2 === 1 ? "border-t border-ink-100 bg-ink-50/60" : "border-t border-ink-100"}>
                        <td className="px-2 py-1.5">
                          {editable ? (
                            <Select
                              className="h-9 min-w-[220px] text-[12.5px]"
                              options={state.suppliers.filter((s) => s.status === "Active").map((s) => s.name)}
                              value={supplierByCode(a.supplierCode)?.name ?? ""}
                              placeholder="Select supplier"
                              onChange={(e) => {
                                const supplier = state.suppliers.find((s) => s.name === e.target.value);
                                if (!supplier) return;
                                patchLine(
                                  activeLine.uic,
                                  activeLine.allocations.map((x) =>
                                    x.id === a.id ? { ...x, supplierCode: supplier.code } : x,
                                  ),
                                );
                              }}
                            />
                          ) : (
                            supplierByCode(a.supplierCode)?.name ?? a.supplierCode
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          {editable ? (
                            <Input
                              type="number"
                              min={0}
                              className="h-9 w-[120px] text-right text-[12.5px]"
                              value={a.qty}
                              onChange={(e) =>
                                patchLine(
                                  activeLine.uic,
                                  activeLine.allocations.map((x) =>
                                    x.id === a.id ? { ...x, qty: Number(e.target.value) } : x,
                                  ),
                                )
                              }
                            />
                          ) : (
                            a.qty.toLocaleString()
                          )}
                        </td>
                        <td className="px-3 py-2 text-ink-600">{activeLine.uom}</td>
                        <td className="px-2 py-1.5">
                          {editable ? (
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              className="h-9 w-[130px] text-right text-[12.5px]"
                              value={a.unitPrice}
                              onChange={(e) =>
                                patchLine(
                                  activeLine.uic,
                                  activeLine.allocations.map((x) =>
                                    x.id === a.id ? { ...x, unitPrice: Number(e.target.value) } : x,
                                  ),
                                )
                              }
                            />
                          ) : (
                            money(a.unitPrice, 2)
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums text-ink-900">
                          {money(a.qty * a.unitPrice)}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {editable && (
                            <Button
                              size="xs"
                              variant="ghost"
                              aria-label="Remove allocation"
                              icon={<X className="size-3.5" />}
                              onClick={() =>
                                patchLine(
                                  activeLine.uic,
                                  activeLine.allocations.filter((x) => x.id !== a.id),
                                )
                              }
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <NoteBar
                className="mt-4"
                tone={allocatedQty(activeLine) === activeLine.demandQty ? "teal" : "amber"}
              >
                {allocatedQty(activeLine) === activeLine.demandQty
                  ? `Validation: Allocated Qty ${allocatedQty(activeLine).toLocaleString()} = Consolidated Demand ${activeLine.demandQty.toLocaleString()} ✓`
                  : `Validation: Allocated Qty ${allocatedQty(activeLine).toLocaleString()} ≠ Consolidated Demand ${activeLine.demandQty.toLocaleString()} — allocation must match before the consolidation can be confirmed.`}
              </NoteBar>
            </>
          )}

          <SectionHeading>Consolidation Summary</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Items", value: lines.length.toLocaleString() },
              { label: "Consolidated Demand", value: totalDemand.toLocaleString() },
              { label: "Allocated Qty", value: totalAllocated.toLocaleString() },
              { label: "Allocation Value", value: `BDT ${money(totalValue)}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
                <p className="text-[12px] font-medium text-ink-500">{s.label}</p>
                <p className="mt-1.5 font-mono text-[20px] font-semibold text-ink-900">{s.value}</p>
              </div>
            ))}
          </div>

          <NoteBar className="mt-5" tone={unbalanced.length ? "amber" : "navy"}>
            {unbalanced.length
              ? `${unbalanced.length} item(s) are not fully allocated — allocation cannot exceed or fall short of approved demand.`
              : `Consolidated demand remains traceable to ${consolidation.sourcePrNos.length} unit PRs; one item may be allocated across multiple suppliers.`}
          </NoteBar>

          {consolidation.status === "Draft" && (
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                size="md"
                variant="subtle"
                icon={<Save className="size-4" />}
                onClick={() => {
                  saveConsolidation(consolidation, "Saved consolidation");
                  toast.success(`${consolidation.dcNo} saved`);
                }}
              >
                Save Draft
              </Button>
              <Button size="md" variant="primary" icon={<Check className="size-4" />} onClick={confirm}>
                Confirm Consolidation
              </Button>
            </div>
          )}
        </>
      )}

      <SectionHeading>Consolidation Register</SectionHeading>
      <DataGrid
        columns={[
          { key: "dcNo", label: "Consolidation No.", mono: true, width: "160px" },
          { key: "period", label: "Period", width: "120px" },
          { key: "category", label: "Category", width: "110px" },
          { key: "lines", label: "Items", align: "right", width: "90px", render: (c: CpsConsolidation) => c.lines.length },
          {
            key: "prs",
            label: "Source PRs",
            align: "right",
            width: "110px",
            render: (c: CpsConsolidation) => c.sourcePrNos.length,
          },
          {
            key: "value",
            label: "Allocation Value",
            align: "right",
            width: "160px",
            render: (c: CpsConsolidation) => money(c.lines.reduce((s, l) => s + allocationValue(l), 0)),
          },
          {
            key: "createdAt",
            label: "Created",
            width: "130px",
            render: (c: CpsConsolidation) => dateShort(c.createdAt),
          },
          { key: "status", label: "Status", width: "120px", render: (c: CpsConsolidation) => <StatusPill value={c.status} /> },
        ]}
        rows={state.consolidations}
        rowKey={(c) => c.id}
        activeKey={consolidation?.id}
        onRowClick={(c) => {
          setDcNo(c.dcNo);
          setActiveUic(c.lines[0]?.uic ?? null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        empty="No consolidation created yet."
      />

      {/* Source-PR drill-down — the traceability control. */}
      <Modal
        open={Boolean(drillUic)}
        onClose={() => setDrillUic(null)}
        size="lg"
        title={`Source requisitions — ${drillUic ?? ""}`}
        description="Consolidated demand always resolves back to the unit requisitions behind it."
      >
        <DataGrid
          columns={[
            { key: "prNo", label: "PR No.", mono: true, width: "150px" },
            { key: "unit", label: "Unit", width: "180px" },
            { key: "requester", label: "Requester" },
            { key: "prDate", label: "PR Date", width: "120px" },
            { key: "qty", label: "Qty", align: "right", width: "100px" },
          ]}
          rows={
            drillUic && consolidation
              ? state.prs
                  .filter((pr) => consolidation.sourcePrNos.includes(pr.prNo) && pr.lines.some((l) => l.uic === drillUic))
                  .map((pr) => ({
                    prNo: pr.prNo,
                    unit: pr.unitCode,
                    requester: pr.requester,
                    prDate: dateShort(pr.prDate),
                    qty: pr.lines
                      .filter((l) => l.uic === drillUic)
                      .reduce((s, l) => s + l.qty, 0)
                      .toLocaleString(),
                  }))
              : []
          }
          rowKey={(r) => r.prNo}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          removeConsolidation(toDelete);
          toast.success(`${toDelete.dcNo} discarded — its requisitions are open for consolidation again`);
          setDcNo("");
          setActiveUic(null);
        }}
        title={`Discard ${toDelete?.dcNo ?? ""}?`}
        body="The source requisitions return to the unprocessed pool and any purchase order raised from it is removed."
      />
    </>
  );
}
