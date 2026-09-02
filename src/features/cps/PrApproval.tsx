"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Check, CornerUpLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { StatusPill } from "@/components/ui/Badge";
import { DataGrid, FormGrid, LField, NoAccess, NoteBar, ScreenTitle, SectionHeading } from "@/components/cps/ui";
import { useCps } from "@/lib/cps/store";
import type { CpsPr, CpsPrLine } from "@/lib/cps/types";
import { dateShort, dateTime } from "@/lib/utils/format";

export function PrApproval() {
  const { state, can, decidePr, unitByCode } = useCps();
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("Reviewed and approved for central procurement.");

  const queue = useMemo(
    () => state.prs.filter((pr) => pr.status === "Pending Approval"),
    [state.prs],
  );
  const decided = useMemo(
    () => state.prs.filter((pr) => pr.decidedAt && pr.status !== "Pending Approval").slice(0, 12),
    [state.prs],
  );

  if (!can("approvePR")) return <NoAccess what="PR Approval" role={state.role} />;

  /** Falls back to the head of the queue whenever the selection is decided away. */
  const pr = queue.find((p) => p.prNo === selected) ?? queue[0] ?? null;

  const decide = (status: "Approved" | "Rejected" | "Returned") => {
    if (!pr) return;
    if (!comment.trim()) {
      toast.error("Record a comment before deciding — the audit trail keeps it against your name.");
      return;
    }
    decidePr(pr, status, comment.trim());
    toast.success(`${pr.prNo} ${status.toLowerCase()} by ${state.actor}`);
    setComment(
      status === "Approved"
        ? "Reviewed and approved for central procurement."
        : "Reviewed — please action the comment above.",
    );
  };

  return (
    <>
      <ScreenTitle
        title="PR Approval — Review & Decision"
        hint={`${queue.length} requisition${queue.length === 1 ? "" : "s"} waiting on a decision.`}
      />

      {queue.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {queue.slice(0, 12).map((p) => (
            <Button
              key={p.prNo}
              size="xs"
              variant={p.prNo === selected ? "primary" : "secondary"}
              onClick={() => setSelected(p.prNo)}
            >
              <span className="font-mono">{p.prNo}</span>
              <span className="ml-1.5 text-[11px] opacity-80">{p.unitCode}</span>
            </Button>
          ))}
          {queue.length > 12 && (
            <span className="self-center text-[12px] text-ink-400">+{queue.length - 12} more in the queue below</span>
          )}
        </div>
      )}

      {!pr ? (
        <NoteBar tone="teal">The approval queue is clear — every submitted requisition has been decided.</NoteBar>
      ) : (
        <>
          <FormGrid>
            <LField label="PR No.">
              <Input value={pr.prNo} readOnly disabled />
            </LField>
            <LField label="Unit">
              <Input value={`${pr.unitCode} — ${unitByCode(pr.unitCode)?.name ?? ""}`} readOnly disabled />
            </LField>
            <LField label="Requester">
              <Input value={pr.requester} readOnly disabled />
            </LField>
            <LField label="PR Date">
              <Input value={dateShort(pr.prDate)} readOnly disabled />
            </LField>
            <LField label="Required By">
              <Input value={dateShort(pr.requiredBy)} readOnly disabled />
            </LField>
            <LField label="Priority">
              <Input value={pr.priority} readOnly disabled />
            </LField>
            <LField label="Purpose / Remarks" span={2}>
              <Input value={pr.purpose} readOnly disabled />
            </LField>
          </FormGrid>

          <SectionHeading>Requested Items</SectionHeading>
          <DataGrid
            columns={[
              { key: "uic", label: "Item", mono: true, width: "140px" },
              { key: "description", label: "Description" },
              { key: "specification", label: "Specification" },
              { key: "qty", label: "Qty", align: "right", width: "100px", render: (l: CpsPrLine) => l.qty.toLocaleString() },
              { key: "uom", label: "UOM", width: "90px" },
              {
                key: "requiredDate",
                label: "Required By",
                width: "130px",
                render: (l: CpsPrLine) => dateShort(l.requiredDate),
              },
              { key: "remarks", label: "Remarks", render: (l: CpsPrLine) => l.remarks || "—" },
            ]}
            rows={pr.lines}
            rowKey={(l) => l.id}
          />

          <SectionHeading>Approver Comments</SectionHeading>
          <Textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Record the reason for your decision…"
          />

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              size="md"
              className="bg-amber-500 text-canvas hover:bg-amber-400"
              icon={<XCircle className="size-4" />}
              onClick={() => decide("Rejected")}
            >
              Reject
            </Button>
            <Button size="md" variant="subtle" icon={<CornerUpLeft className="size-4" />} onClick={() => decide("Returned")}>
              Return
            </Button>
            <Button size="md" variant="primary" icon={<Check className="size-4" />} onClick={() => decide("Approved")}>
              Approve
            </Button>
          </div>

          <NoteBar className="mt-5">Decision recorded with approver, date/time and comments.</NoteBar>
        </>
      )}

      <SectionHeading>Pending Queue ({queue.length})</SectionHeading>
      <DataGrid
        columns={[
          { key: "prNo", label: "PR No.", mono: true, width: "150px" },
          { key: "unitCode", label: "Unit", mono: true, width: "110px" },
          { key: "requester", label: "Requester" },
          { key: "purpose", label: "Purpose" },
          { key: "prDate", label: "PR Date", width: "120px", render: (p: CpsPr) => dateShort(p.prDate) },
          { key: "priority", label: "Priority", width: "100px" },
          { key: "lines", label: "Lines", align: "right", width: "80px", render: (p: CpsPr) => p.lines.length },
        ]}
        rows={queue}
        rowKey={(p) => p.id}
        pageSize={10}
        activeKey={pr?.id}
        onRowClick={(p) => {
          setSelected(p.prNo);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        empty="Nothing is waiting for approval."
      />

      <SectionHeading>Recent Decisions</SectionHeading>
      <DataGrid
        columns={[
          { key: "prNo", label: "PR No.", mono: true, width: "150px" },
          { key: "unitCode", label: "Unit", mono: true, width: "110px" },
          { key: "status", label: "Decision", width: "140px", render: (p: CpsPr) => <StatusPill value={p.status} /> },
          { key: "approver", label: "Approver", render: (p: CpsPr) => p.approver ?? "—" },
          {
            key: "decidedAt",
            label: "Decided",
            width: "190px",
            render: (p: CpsPr) => (p.decidedAt ? dateTime(p.decidedAt) : "—"),
          },
          { key: "approverComment", label: "Comment", render: (p: CpsPr) => p.approverComment ?? "—" },
        ]}
        rows={decided}
        rowKey={(p) => p.id}
        empty="No decision recorded yet."
      />
    </>
  );
}
