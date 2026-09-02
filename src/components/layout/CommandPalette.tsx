"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, LayoutDashboard, Search } from "lucide-react";
import { NavIcon } from "./icons";
import { ALL_LEAVES, DASHBOARD_HREF } from "@/lib/nav/registry";
import { CPS_HOME_ITEM, CPS_ITEMS } from "@/lib/cps/nav";
import type { LeafLocation } from "@/lib/nav/types";
import { cn } from "@/lib/utils/cn";

interface Hit {
  href: string;
  label: string;
  path: string;
  icon: string;
}

const DASHBOARD_HIT: Hit = {
  href: DASHBOARD_HREF,
  label: "Command Center",
  path: "Dashboard",
  icon: "LayoutDashboard",
};

/** The Central Procurement prototype lives outside the module registry. */
const CPS_HITS: Hit[] = [CPS_HOME_ITEM, ...CPS_ITEMS].map((i) => ({
  href: i.href,
  label: i.title,
  path: `BAY CPS › ${i.label}`,
  icon: "Radar",
}));

const cpsMatches = (q: string) =>
  CPS_HITS.filter((h) => `${h.label} ${h.path}`.toLowerCase().includes(q));

/** Ranks an exact prefix above a word-start above a loose substring. */
function score(leaf: LeafLocation, q: string): number {
  const label = leaf.leaf.label.toLowerCase();
  const group = leaf.group.label.toLowerCase();
  const mod = leaf.module.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(` ${q}`)) return 60;
  if (label.includes(q)) return 40;
  if (group.includes(q)) return 20;
  if (mod.includes(q)) return 10;
  return 0;
}

/** The dialog mounts only while open, so its state starts clean every time —
 *  no reset effects needed. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <PaletteDialog onClose={onClose} />;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [
        DASHBOARD_HIT,
        ...CPS_HITS.slice(0, 4),
        ...ALL_LEAVES.filter((l) => l.leaf.kind === "dashboard" || l.leaf.kind === "form")
          .slice(0, 9)
          .map((l) => ({
            href: l.href,
            label: l.leaf.label,
            path: `${l.module.short} › ${l.group.label}`,
            icon: l.group.icon,
          })),
      ];
    }
    const scored = ALL_LEAVES.map((l) => ({ l, s: score(l, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.l.leaf.label.length - b.l.leaf.label.length)
      .slice(0, 24);
    const dash = "command center dashboard".includes(q) ? [DASHBOARD_HIT] : [];
    return [
      ...dash,
      ...cpsMatches(q),
      ...scored.map(({ l }) => ({
        href: l.href,
        label: l.leaf.label,
        path: `${l.module.short} › ${l.group.label}`,
        icon: l.group.icon,
      })),
    ];
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(hits.length - 1, c + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      }
      if (e.key === "Enter" && hits[cursor]) {
        e.preventDefault();
        router.push(hits[cursor].href);
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hits, cursor, router, onClose]);

  useEffect(() => {
    listRef.current?.querySelectorAll("li")[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="animate-fade-in fixed inset-0 bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search modules"
        className="animate-pop-in relative z-10 w-full max-w-xl overflow-hidden rounded-2xl bg-surface shadow-pop ring-1 ring-ink-200"
      >
        <div className="flex items-center gap-2.5 border-b border-ink-100 px-4">
          <Search className="size-4 shrink-0 text-ink-400" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Search modules, screens and registers…"
            className="h-13 w-full bg-transparent py-4 text-[14px] text-ink-900 outline-none placeholder:text-ink-400"
          />
          <kbd className="hidden shrink-0 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-[10px] text-ink-500 sm:block">
            ESC
          </kbd>
        </div>

        <ul ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {hits.length === 0 && (
            <li className="px-3 py-10 text-center text-[13px] text-ink-400">No screen matches “{query}”.</li>
          )}
          {hits.map((hit, i) => (
            <li key={hit.href}>
              <button
                type="button"
                onMouseEnter={() => setCursor(i)}
                onClick={() => {
                  router.push(hit.href);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  i === cursor ? "bg-brand-50" : "hover:bg-ink-50",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg",
                    i === cursor ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500",
                  )}
                >
                  {hit.icon === "LayoutDashboard" ? (
                    <LayoutDashboard className="size-4" />
                  ) : (
                    <NavIcon name={hit.icon} className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink-900">{hit.label}</span>
                  <span className="block truncate text-[11.5px] text-ink-400">{hit.path}</span>
                </span>
                {i === cursor && <CornerDownLeft className="size-3.5 shrink-0 text-brand-500" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 border-t border-ink-100 bg-ink-50/60 px-4 py-2 text-[11px] text-ink-400">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-ink-200 bg-surface px-1 font-mono">↑</kbd>
            <kbd className="rounded border border-ink-200 bg-surface px-1 font-mono">↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-ink-200 bg-surface px-1 font-mono">↵</kbd> open
          </span>
          <span className="ml-auto font-medium text-ink-400">{hits.length} results</span>
        </div>
      </div>
    </div>
  );
}
