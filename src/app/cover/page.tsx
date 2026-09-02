import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { COMPANY } from "@/lib/data/reference";

export const metadata: Metadata = {
  title: "BAY Group Central Procurement System — Phase 1",
  description: "Phase 1 UI / screen prototype for indirect and CAPEX materials.",
};

/** The Phase 1 cover — the opening screen of the prototype walkthrough:
 *  PR → approval → consolidation → allocation → consolidated PO. */
const FLOW = [
  ["PR", "Approval"],
  ["Demand", "Consolidation"],
  ["Supplier", "Allocation"],
  ["Consolidated", "PO"],
] as const;

export default function CoverPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
      <div className="w-full max-w-[1100px] overflow-hidden rounded-2xl bg-navy-900 px-8 py-12 ring-1 ring-inset ring-navy-800 sm:px-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_minmax(0,380px)] lg:items-center">
          <div className="min-w-0">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand-600">{COMPANY.name}</p>

            <h1 className="mt-6 text-[32px] font-bold leading-[1.15] tracking-tight text-white sm:text-[42px]">
              BAY GROUP
              <br />
              CENTRAL PROCUREMENT SYSTEM
            </h1>

            <p className="mt-6 text-[16px] text-navy-100">Phase 1 — UI / Screen Prototype</p>
            <p className="mt-2 text-[13px] font-semibold text-navy-200">Indirect &amp; CAPEX Materials</p>

            <Link
              href="/cps"
              className="focus-brand mt-9 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-5 text-[14.5px] font-medium text-white transition-colors hover:bg-[#7377f5]"
            >
              Open the prototype
              <ArrowRight className="size-4" aria-hidden />
            </Link>

            <p className="mt-12 text-[11.5px] font-semibold text-navy-300">
              Prototype based on the Phase 1 proposal scope
            </p>
          </div>

          <div className="rounded-2xl bg-navy-800/70 px-6 py-8 ring-1 ring-inset ring-navy-700 sm:px-8">
            <ol className="space-y-1">
              {FLOW.map(([left, right], i) => (
                <li key={left}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[15px] font-bold tracking-tight text-white">{left}</span>
                    <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-navy-100">{right}</span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div className="py-2 text-center text-[13px] text-brand-600" aria-hidden>
                      ↓
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-navy-800 pt-6">
          <Logo size={34} />
          <p className="text-[11.5px] text-navy-300">
            {COMPANY.product} · {COMPANY.suite} · {COMPANY.tagline}
          </p>
        </div>
      </div>
    </main>
  );
}
