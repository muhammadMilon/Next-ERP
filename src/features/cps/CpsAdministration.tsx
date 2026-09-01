"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataGrid, NoteBar, ScreenTitle, SectionHeading } from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import { CPS_ROLES, PERMISSIONS, PERMISSION_LABEL, ROLE_ACCESS, type CpsAudit, type CpsRole } from "@/lib/cps/types";
import { dateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function CpsAdministration() {
  const { state, setRole, reset } = useCps();
  const [confirmReset, setConfirmReset] = useState(false);

  const counts = [
    { label: "Company units", value: state.units.length },
    { label: "Company users", value: state.users.length },
    { label: "Items", value: state.items.length },
    { label: "Suppliers", value: state.suppliers.length },
    { label: "Requisitions", value: state.prs.length },
    { label: "Consolidations", value: state.consolidations.length },
    { label: "Purchase orders", value: state.pos.length },
    { label: "Audit entries", value: state.audit.length },
  ];

  return (
    <>
      <ScreenTitle
        title="Administration"
        hint="Acting role, the role–permission matrix, the audit trail and prototype data controls."
        actions={
          <Button variant="secondary" icon={<RotateCcw className="size-3.5" />} onClick={() => setConfirmReset(true)}>
            Reset prototype data
          </Button>
        }
      />

      <SectionHeading>Acting Role</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {CPS_ROLES.map((role) => (
          <Button
            key={role}
            variant={state.role === role ? "primary" : "secondary"}
            onClick={() => {
              setRole(role);
              toast.success(`Now acting as ${role}`);
            }}
          >
            {role}
          </Button>
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-ink-500">
        Screens and buttons react immediately: switch to <span className="font-medium text-ink-800">Viewer</span> and
        every capture action disappears.
      </p>

      <SectionHeading>Role & Access Matrix</SectionHeading>
      <div className="overflow-x-auto rounded-lg border border-ink-200">
        <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-navy-800 text-white">
              <th className="px-3 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.04em]">Role</th>
              {PERMISSIONS.map((p) => (
                <th key={p} className="px-3 py-2.5 text-center text-[11.5px] font-semibold uppercase tracking-[0.04em]">
                  {PERMISSION_LABEL[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CPS_ROLES.map((role: CpsRole, i) => (
              <tr
                key={role}
                className={cn(
                  "border-t border-ink-100",
                  i % 2 === 1 && "bg-ink-50/60",
                  state.role === role && "bg-brand-50",
                )}
              >
                <td className="px-3 py-2.5 font-medium text-ink-900">{role}</td>
                {PERMISSIONS.map((p) => (
                  <td key={p} className="px-3 py-2.5 text-center">
                    {ROLE_ACCESS[role][p] ? (
                      <Check className="mx-auto size-4 text-brand-600" aria-label="Allowed" />
                    ) : (
                      <X className="mx-auto size-4 text-ink-300" aria-label="Not allowed" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeading>Prototype Data</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((c) => (
          <div key={c.label} className="rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card">
            <p className="text-[12px] text-ink-500">{c.label}</p>
            <p className="mt-1 font-mono text-[20px] font-bold leading-none text-ink-900">{c.value}</p>
          </div>
        ))}
      </div>

      <SectionHeading>Audit Trail ({state.audit.length})</SectionHeading>
      <DataGrid
        columns={[
          { key: "at", label: "When", width: "200px", render: (a: CpsAudit) => dateTime(a.at) },
          { key: "actor", label: "Actor", width: "180px" },
          { key: "role", label: "Role", width: "150px" },
          { key: "action", label: "Action" },
          { key: "entity", label: "Entity", width: "170px" },
          { key: "ref", label: "Reference", mono: true, width: "160px" },
          { key: "detail", label: "Detail", render: (a: CpsAudit) => a.detail ?? "—" },
        ]}
        rows={state.audit}
        rowKey={(a) => a.id}
        dense
        empty="No action recorded in this session yet — every save, decision and release lands here."
      />

      <NoteBar className="mt-5">
        Role-based access, approval history, audit trail and status controls are embedded in every transaction.
      </NoteBar>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          toast.success("Prototype data restored to the seeded position");
        }}
        title="Reset prototype data?"
        body="Every unit, user, item, supplier, requisition, consolidation and order returns to the seeded demo position. This cannot be undone."
        confirmLabel="Reset data"
      />
    </>
  );
}
