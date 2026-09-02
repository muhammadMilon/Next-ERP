"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NoteBar, ScreenTitle } from "@/components/cps/ui";
import { CPS_MASTER_CARDS, CPS_TRANSACTION_CARDS } from "@/lib/cps/nav";
import { useCps } from "@/lib/cps/store";
import type { CpsNavItem } from "@/lib/cps/nav";
import { cn } from "@/lib/utils/cn";

export function PrototypeNavigation() {
  const { kpis, state } = useCps();

  return (
    <>
      <ScreenTitle
        title="Prototype Navigation"
        hint="Phase 1 functions translated into practical web ERP screens — every screen below is fully working."
      />

      <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-brand-700">Master Data</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {CPS_MASTER_CARDS.map((card) => (
          <NavCard key={card.href} item={card} />
        ))}
      </div>

      <p className="mb-3 mt-7 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-brand-700">Transactions</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CPS_TRANSACTION_CARDS.map((card) => (
          <NavCard key={card.href} item={card} accent />
        ))}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Company units", value: state.units.length },
          { label: "Registered items", value: state.items.length },
          { label: "Approved PRs", value: kpis.approvedPrs },
          { label: "POs released", value: kpis.posReleased },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-ink-200 bg-surface px-4 py-3 shadow-card">
            <p className="text-[12px] text-ink-500">{s.label}</p>
            <p className="mt-1 font-mono text-[20px] font-bold leading-none text-ink-900">{s.value}</p>
          </div>
        ))}
      </div>

      <NoteBar tone="navy" className="mt-7">
        Core control: Consolidated demand remains traceable to Unit PRs; one item may be allocated across multiple
        suppliers.
      </NoteBar>
    </>
  );
}

function NavCard({ item, accent }: { item: CpsNavItem; accent?: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-4 rounded-xl border px-4 py-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop",
        accent ? "border-brand-100 bg-brand-50 hover:border-brand-300" : "border-ink-200 bg-surface hover:border-brand-300",
      )}
    >
      <span
        className={cn(
          "font-mono text-[15px] font-bold",
          accent ? "text-brand-700" : "text-ink-400",
        )}
      >
        {item.code}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-ink-900">{item.title.replace(" Registration", "")}</span>
        <span className="block text-[12px] text-ink-500">{item.hint}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-ink-300 transition-colors group-hover:text-brand-600" aria-hidden />
    </Link>
  );
}
