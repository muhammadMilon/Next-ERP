"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { ReactNode } from "react";
import { NavIcon } from "@/components/layout/icons";
import type { LeafLocation } from "@/lib/nav/types";
import { leafHref } from "@/lib/nav/registry";

export function PageHeader({ loc, actions }: { loc: LeafLocation; actions?: ReactNode }) {
  const { module, group, leaf } = loc;
  return (
    <div className="mb-4">
      <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-[11.5px] text-ink-400">
        <Link href="/dashboard" className="flex items-center gap-1 transition-colors hover:text-brand-600">
          <Home className="size-3" aria-hidden />
          Dashboard
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-mono text-[10.5px] text-brand-400">{module.code}</span>
        <span>{module.label}</span>
        <ChevronRight className="size-3" aria-hidden />
        <Link href={leafHref(module.slug, group.slug, group.leaves[0].slug)} className="transition-colors hover:text-brand-600">
          {group.label}
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-ink-600">{leaf.label}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500/25 to-brand-500/5 text-brand-600 ring-1 ring-brand-200">
            <NavIcon name={group.icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-bold leading-tight tracking-tight text-ink-900">{leaf.label}</h1>
            {leaf.hint && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{leaf.hint}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
