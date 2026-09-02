"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NoteBar, ScreenTitle } from "@/components/cps/ui";

const NOTES: Array<{ code: string; title: string; body: string; href?: string }> = [
  {
    code: "01",
    title: "Masters",
    body: "Unit, User, Item and Supplier are controlled master data.",
    href: "/cps/masters/company-units",
  },
  {
    code: "02",
    title: "PR",
    body: "Unit user creates a draft PR; the system routes it for approval.",
    href: "/cps/purchase-requisition",
  },
  {
    code: "03",
    title: "Consolidation",
    body: "Central Procurement sees approved demand item-wise with unit and PR drill-down.",
    href: "/cps/demand-consolidation",
  },
  {
    code: "04",
    title: "Allocation",
    body: "One item can be allocated across multiple suppliers; allocation cannot exceed approved demand.",
    href: "/cps/demand-consolidation",
  },
  {
    code: "05",
    title: "PO",
    body: "POs originate from supplier allocation and remain linked to source demand.",
    href: "/cps/purchase-order",
  },
  {
    code: "06",
    title: "Controls",
    body: "Role-based access, approval history, audit trail and status controls are embedded.",
    href: "/cps/administration",
  },
  {
    code: "07",
    title: "Future",
    body: "Store, IQC, Finance, Supplier Portal and Direct/BOM can be added later.",
  },
];

export function PrototypeNotes() {
  return (
    <>
      <ScreenTitle
        title="Prototype Notes & Recommended Next Step"
        hint="Functional UI concepts to validate during the Functional Blueprint stage."
      />

      <ol className="space-y-2">
        {NOTES.map((note) => {
          const body = (
            <>
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 font-mono text-[13px] font-bold text-brand-700">
                {note.code}
              </span>
              <span className="w-[150px] shrink-0 text-[14px] font-semibold text-ink-900">{note.title}</span>
              <span className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-600">{note.body}</span>
              {note.href && (
                <ArrowRight className="size-4 shrink-0 text-ink-300 transition-colors group-hover:text-brand-600" aria-hidden />
              )}
            </>
          );
          return (
            <li key={note.code}>
              {note.href ? (
                <Link
                  href={note.href}
                  className="group flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 bg-surface px-4 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 bg-surface px-4 py-3 shadow-card">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <NoteBar tone="navy" className="mt-6">
        Phase 1: Unit PR → Approval → Central Consolidation → Supplier Allocation → Consolidated PO
      </NoteBar>
    </>
  );
}
