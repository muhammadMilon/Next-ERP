"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { CommandPalette } from "./CommandPalette";
import { Logo } from "@/components/brand/Logo";
import { useStore } from "@/store/app-store";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Sidebar collapse lives in the persisted store, alongside every other
  // preference, so it survives a reload without a hydration effect here.
  const { hydrated, user, sidebarCollapsed: collapsed, dispatch } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Route guard: the shell is only reachable with a signed-in session.
  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!hydrated || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-50">
        <div className="flex flex-col items-center gap-4">
          <Logo size={44} />
          <div className="h-1 w-40 overflow-hidden rounded-full bg-ink-200">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
          </div>
          <p className="text-[12.5px] text-ink-400">Preparing your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-ink-50">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          collapsed={collapsed}
          onToggleCollapse={() => dispatch({ type: "toggleSidebar" })}
          onOpenMobile={() => setMobileOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-5 sm:py-5">{children}</div>
        </main>
        <Footer />
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
