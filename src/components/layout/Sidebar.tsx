"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard, Radar, Search, Star, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NavIcon } from "./icons";
import { DASHBOARD_HREF, LEAF_COUNT, MODULES, leafHref } from "@/lib/nav/registry";
import { CPS_HOME } from "@/lib/cps/nav";
import type { NavGroup, NavLeaf, NavModule } from "@/lib/nav/types";
import { useStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [filter, setFilter] = useState("");
  /** Only explicit user toggles are stored; the group holding the current route
   *  is open by derivation, so no effect has to chase the pathname. */
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const { bookmarks } = useStore();

  const q = filter.trim().toLowerCase();

  const tree = useMemo(() => {
    if (!q) return MODULES;
    return MODULES.map((m) => ({
      ...m,
      groups: m.groups
        .map((g) => ({
          ...g,
          leaves: g.label.toLowerCase().includes(q) ? g.leaves : g.leaves.filter((l) => l.label.toLowerCase().includes(q)),
        }))
        .filter((g) => g.leaves.length > 0),
    })).filter((m) => m.groups.length > 0);
  }, [q]);

  const matchCount = tree.reduce((s, m) => s + m.groups.reduce((t, g) => t + g.leaves.length, 0), 0);

  const activeGroupKey = pathname.split("/").filter(Boolean).slice(0, 2).join("/");

  const isOpen = (key: string) => overrides[key] ?? key === activeGroupKey;

  const toggle = (key: string) => setOverrides((o) => ({ ...o, [key]: !isOpen(key) }));

  const dashboardActive = pathname === DASHBOARD_HREF;
  const cpsActive = pathname.startsWith(CPS_HOME);

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div className="animate-fade-in fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px] lg:hidden" onClick={onCloseMobile} aria-hidden />
      )}

      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-ink-200 bg-white transition-[width,transform] duration-200 lg:static lg:translate-x-0",
          collapsed ? "w-[68px]" : "w-[272px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand block — aligns with the navbar height */}
        <div className={cn("flex h-16 shrink-0 items-center border-b border-ink-200", collapsed ? "justify-center px-2" : "justify-between px-4")}>
          <Link href={DASHBOARD_HREF} className="focus-brand min-w-0 rounded-lg" onClick={onCloseMobile}>
            <Logo showWordmark={!collapsed} size={collapsed ? 32 : 34} />
          </Link>
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="focus-brand grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Module filter */}
        {!collapsed && (
          <div className="border-b border-ink-100 px-3 py-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-400" aria-hidden />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={`Filter ${LEAF_COUNT} screens…`}
                aria-label="Filter navigation"
                className="focus-brand h-8 w-full rounded-lg border border-ink-200 bg-ink-50/60 pl-8 pr-7 text-[12.5px] text-ink-800 placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-400 focus:bg-white"
              />
              {filter && (
                <button
                  onClick={() => setFilter("")}
                  aria-label="Clear filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {q && <p className="mt-1.5 text-[11px] text-ink-400">{matchCount} matching screens</p>}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          {/* Dashboard */}
          <Link
            href={DASHBOARD_HREF}
            onClick={onCloseMobile}
            title="Dashboard"
            className={cn(
              "focus-brand mb-2 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
              collapsed && "justify-center px-0",
              dashboardActive
                ? "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-sm"
                : "text-ink-600 hover:bg-brand-50 hover:text-brand-700",
            )}
          >
            <LayoutDashboard className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span>Dashboard</span>}
          </Link>

          {/* Central Procurement System — its own shell, linked from the rail */}
          <Link
            href={CPS_HOME}
            onClick={onCloseMobile}
            title="Central Procurement System (BAY CPS)"
            className={cn(
              "mb-3 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
              collapsed && "justify-center px-0",
              cpsActive
                ? "bg-navy-900 text-white"
                : "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
            )}
          >
            <Radar className="size-4 shrink-0" aria-hidden />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate">Central Procurement</span>
                <span className="shrink-0 rounded bg-white/80 px-1 font-mono text-[9.5px] font-bold text-brand-700">
                  CPS
                </span>
              </>
            )}
          </Link>

          {/* Bookmarks */}
          {!collapsed && !q && bookmarks.length > 0 && (
            <div className="mb-3">
              <p className="px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">Pinned</p>
              {bookmarks.slice(0, 5).map((href) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onCloseMobile}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                  <span className="truncate">{href.split("/").pop()?.replace(/-/g, " ")}</span>
                </Link>
              ))}
            </div>
          )}

          {tree.map((module) => (
            <ModuleBlock
              key={module.slug}
              module={module}
              collapsed={collapsed}
              pathname={pathname}
              isOpen={isOpen}
              forceOpen={Boolean(q)}
              onToggle={toggle}
              onNavigate={onCloseMobile}
            />
          ))}

          {tree.length === 0 && (
            <p className="px-3 py-6 text-center text-[12.5px] text-ink-400">No screen matches “{filter}”.</p>
          )}
        </nav>

        {!collapsed && (
          <div className="border-t border-ink-100 px-4 py-2.5">
            <p className="text-[10.5px] leading-relaxed text-ink-400">
              <span className="font-semibold text-ink-500">3 modules</span> · Central Procurement · {LEAF_COUNT} ERP screens
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

function ModuleBlock({
  module,
  collapsed,
  pathname,
  isOpen,
  forceOpen,
  onToggle,
  onNavigate,
}: {
  module: NavModule;
  collapsed: boolean;
  pathname: string;
  isOpen: (key: string) => boolean;
  forceOpen: boolean;
  onToggle: (key: string) => void;
  onNavigate: () => void;
}) {
  return (
    <div className="mb-1">
      {collapsed ? (
        <div className="my-2 flex justify-center" title={module.label}>
          <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <NavIcon name={module.icon} className="size-4" />
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-2.5 pb-1 pt-3">
          <span className="font-mono text-[10px] font-bold text-brand-400">{module.code}</span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">{module.label}</span>
        </div>
      )}

      {module.groups.map((group) => (
        <GroupBlock
          key={group.slug}
          module={module}
          group={group}
          collapsed={collapsed}
          pathname={pathname}
          open={forceOpen || isOpen(`${module.slug}/${group.slug}`)}
          onToggle={() => onToggle(`${module.slug}/${group.slug}`)}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function GroupBlock({
  module,
  group,
  collapsed,
  pathname,
  open,
  onToggle,
  onNavigate,
}: {
  module: NavModule;
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const groupActive = pathname.startsWith(`/${module.slug}/${group.slug}/`);

  if (collapsed) {
    return (
      <Link
        href={leafHref(module.slug, group.slug, group.leaves[0].slug)}
        title={group.label}
        onClick={onNavigate}
        className={cn(
          "focus-brand mx-auto mb-1 flex size-10 items-center justify-center rounded-lg transition-colors",
          groupActive ? "bg-brand-100 text-brand-700" : "text-ink-500 hover:bg-ink-100 hover:text-ink-800",
        )}
      >
        <NavIcon name={group.icon} className="size-4" />
      </Link>
    );
  }

  // Render the optional third level as captions inside the group.
  const sections: { caption?: string; leaves: NavLeaf[] }[] = [];
  for (const leaf of group.leaves) {
    const last = sections[sections.length - 1];
    if (last && last.caption === leaf.section) last.leaves.push(leaf);
    else sections.push({ caption: leaf.section, leaves: [leaf] });
  }

  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "focus-brand group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors",
          groupActive ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50",
        )}
      >
        <NavIcon name={group.icon} className={cn("size-4 shrink-0", groupActive ? "text-brand-500" : "text-ink-400")} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{group.label}</span>
        <span className="shrink-0 rounded bg-ink-100 px-1 font-mono text-[9.5px] tabular-nums text-ink-400 group-hover:bg-ink-200">
          {group.leaves.length}
        </span>
        <ChevronRight className={cn("size-3.5 shrink-0 text-ink-400 transition-transform duration-200", open && "rotate-90")} />
      </button>

      {open && (
        <div className="animate-slide-down ml-[18px] mt-0.5 space-y-px border-l border-ink-200 pl-2">
          {sections.map((section, si) => (
            <div key={si}>
              {section.caption && (
                <p className="px-2 pb-0.5 pt-2 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  {section.caption}
                </p>
              )}
              {section.leaves.map((leaf) => {
                const href = leafHref(module.slug, group.slug, leaf.slug);
                const active = pathname === href;
                return (
                  <Link
                    key={leaf.slug}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "relative flex items-center gap-2 rounded-md py-1.5 pl-2.5 pr-2 text-[12.5px] transition-colors",
                      active
                        ? "bg-brand-50 font-medium text-brand-700"
                        : "text-ink-500 hover:bg-ink-50 hover:text-ink-800",
                    )}
                  >
                    {active && <span className="absolute -left-[9px] top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand-500" aria-hidden />}
                    <span className="truncate">{leaf.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
