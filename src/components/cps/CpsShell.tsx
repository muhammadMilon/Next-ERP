"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Check, ChevronDown, LogOut, Menu, RotateCcw, X } from "lucide-react";
import { BrandMark } from "@/components/brand/Logo";
import { NavIcon } from "@/components/layout/icons";
import { Dropdown } from "@/components/ui/Dropdown";
import { CPS_HOME, CPS_NAV, findCpsItem } from "@/lib/cps/nav";
import { useCps } from "@/lib/cps/store";
import { CPS_ROLES } from "@/lib/cps/types";
import { COMPANY } from "@/lib/data/reference";
import { useStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";

/** The BAY CPS command shell — a dark procurement bar, a flat function rail and
 *  the working surface, matching the Phase 1 screen design. */
export function CpsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated: appHydrated, user, dispatch } = useStore();
  const { hydrated, state, setRole, reset } = useCps();
  const [navOpen, setNavOpen] = useState(false);
  const screen = findCpsItem(pathname);

  useEffect(() => {
    if (appHydrated && !user) router.replace("/login");
  }, [appHydrated, user, router]);

  if (!appHydrated || !user || !hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-navy-900">
        <div className="flex flex-col items-center gap-4">
          <BrandMark size={48} />
          <div className="h-1 w-40 overflow-hidden rounded-full bg-navy-700">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
          </div>
          <p className="text-[12.5px] text-navy-200">Preparing the Central Procurement System…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink-100">
      {/* ── Command bar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-navy-900 text-white">
        <div className="mx-auto flex w-full max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="focus-brand grid size-9 shrink-0 place-items-center rounded-lg text-navy-100 hover:bg-navy-800 lg:hidden"
          >
            {navOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <Link href={CPS_HOME} className="focus-brand flex shrink-0 items-center gap-2.5 rounded-lg">
            <BrandMark size={28} />
            <span className="hidden text-[13.5px] font-bold uppercase tracking-[0.06em] sm:block">
              {COMPANY.product} <span className="text-navy-300">|</span> {COMPANY.suite}
            </span>
          </Link>

          <div className="mx-auto min-w-0 flex-1 px-2 text-center sm:px-6">
            <h1 className="truncate text-[16px] font-bold leading-tight sm:text-[19px]">{screen.title}</h1>
            <p className="truncate text-[11px] text-navy-200 sm:text-[11.5px]">{screen.breadcrumb}</p>
          </div>

          <Dropdown
            align="right"
            panelClassName="w-[260px]"
            trigger={() => (
              <span className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-navy-800">
                {state.role}
                <ChevronDown className="size-3.5 text-navy-200" aria-hidden />
              </span>
            )}
          >
            {(close) => (
              <>
                <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  Acting role
                </p>
                {CPS_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setRole(role);
                      close();
                      toast.success(`Now acting as ${role}`);
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    {role}
                    {state.role === role && <Check className="size-3.5 text-brand-600" />}
                  </button>
                ))}
                <div className="my-1 h-px bg-ink-100" />
                <button
                  type="button"
                  onClick={() => {
                    close();
                    reset();
                    toast.success("Prototype data restored to the seeded position");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-700 transition-colors hover:bg-ink-50"
                >
                  <RotateCcw className="size-3.5 text-ink-400" /> Reset prototype data
                </button>
                <Link
                  href="/dashboard"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-700 transition-colors hover:bg-ink-50"
                >
                  <ArrowLeft className="size-3.5 text-ink-400" /> Back to ERP workspace
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    dispatch({ type: "signOut" });
                    toast.success("Signed out securely");
                    router.push("/login");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="size-3.5" /> Sign out
                </button>
              </>
            )}
          </Dropdown>
        </div>
      </header>

      {/* ── Rail + surface ──────────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 gap-0 px-0 sm:px-6 sm:py-5">
        <FunctionRail pathname={pathname} open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="min-w-0 flex-1 bg-white p-4 shadow-card sm:rounded-r-xl sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function FunctionRail({
  pathname,
  open,
  onClose,
}: {
  pathname: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div className="animate-fade-in fixed inset-0 z-30 bg-ink-900/40 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <nav
        className={cn(
          "z-40 w-[236px] shrink-0 border-r border-ink-200 bg-ink-50/70 p-3 sm:rounded-l-xl",
          "fixed inset-y-0 left-0 overflow-y-auto pt-4 transition-transform duration-200 lg:static lg:translate-x-0 lg:pt-3",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Central procurement functions"
      >
        <Link
          href={CPS_HOME}
          onClick={onClose}
          className={cn(
            "mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
            pathname === CPS_HOME
              ? "bg-brand-50 text-brand-700"
              : "text-ink-600 hover:bg-white hover:text-ink-900",
          )}
        >
          <NavIcon name="Radar" className="size-4" />
          Prototype Navigation
        </Link>

        {CPS_NAV.map((group) => {
          const groupActive = group.items.some(
            (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
          );
          const single = group.items.length === 1;
          return (
            <div key={group.label} className="mb-0.5">
              <Link
                href={group.items[0].href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors",
                  groupActive
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "text-ink-600 hover:bg-white hover:text-ink-900",
                )}
              >
                <NavIcon name={group.icon} className={cn("size-4", groupActive ? "text-brand-600" : "text-ink-400")} />
                {group.label}
              </Link>
              {!single && groupActive && (
                <div className="ml-[26px] mt-0.5 space-y-px border-l border-ink-200 pl-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "block rounded-md px-2 py-1.5 text-[12.5px] transition-colors",
                        pathname === item.href
                          ? "bg-white font-medium text-brand-700 shadow-card"
                          : "text-ink-500 hover:bg-white hover:text-ink-800",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
