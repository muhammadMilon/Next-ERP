"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Bell,
  Check,
  CheckCheck,
  Globe,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  UserRound,
} from "lucide-react";
import { NavIcon } from "./icons";
import { CountBadge } from "@/components/ui/Badge";
import { Dropdown, MenuDivider, MenuItem } from "@/components/ui/Dropdown";
import { findLeaf } from "@/lib/nav/registry";
import { COMPANY } from "@/lib/data/reference";
import { initials, relative } from "@/lib/utils/format";
import { useStore } from "@/store/app-store";
import { cn } from "@/lib/utils/cn";

/** The platform never changes for the life of the page. */
const subscribeNothing = () => () => {};
const isMacClient = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const TONE_RING: Record<string, string> = {
  info: "bg-sky-500",
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  critical: "bg-red-500",
};

export function Navbar({
  collapsed,
  onToggleCollapse,
  onOpenMobile,
  onOpenPalette,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
  onOpenPalette: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, notifications, unreadCount, messagesUnread, dispatch, bookmarks } = useStore();
  // Read from the platform after hydration without a state-setting effect.
  const mac = useSyncExternalStore(subscribeNothing, isMacClient, () => false);

  const segs = pathname.split("/").filter(Boolean);
  const loc = findLeaf(segs);
  const isDashboard = pathname === "/dashboard";

  const title = isDashboard ? "Command Center" : (loc?.leaf.label ?? "Workspace");
  const subtitle = isDashboard ? "Dashboard" : loc ? `${loc.module.label} › ${loc.group.label}` : "Smart ERP";
  const icon = isDashboard ? null : loc?.group.icon;
  const pinned = bookmarks.includes(pathname);

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-ink-200 bg-white/95 px-3 backdrop-blur-sm sm:px-4">
      {/* Mobile menu */}
      <button
        onClick={onOpenMobile}
        aria-label="Open navigation"
        className="focus-brand grid size-9 shrink-0 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 lg:hidden"
      >
        <Menu className="size-4.5" />
      </button>

      {/* Collapse */}
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="focus-brand hidden size-9 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 lg:grid"
      >
        {collapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
      </button>

      <div className="hidden h-8 w-px bg-ink-200 sm:block" />

      {/* Page identity */}
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-amber-500 text-white shadow-sm">
          {icon ? <NavIcon name={icon} className="size-4.5" /> : <LayoutDashboard className="size-4.5" aria-hidden />}
        </span>
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-[15px] font-bold tracking-tight text-ink-900">{title}</h1>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">{subtitle}</p>
        </div>
      </div>

      {/* Search trigger */}
      <button
        onClick={onOpenPalette}
        className="focus-brand group mx-auto hidden h-9 w-full max-w-[380px] items-center gap-2 rounded-lg border border-ink-200 bg-ink-50/70 px-3 text-left transition-colors hover:border-brand-300 hover:bg-white md:flex"
      >
        <Search className="size-4 shrink-0 text-ink-400 transition-colors group-hover:text-brand-500" aria-hidden />
        <span className="flex-1 truncate text-[13px] text-ink-400">Search modules…</span>
        <kbd className="shrink-0 rounded border border-ink-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
          {mac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
        <button
          onClick={onOpenPalette}
          aria-label="Search"
          className="focus-brand grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 md:hidden"
        >
          <Search className="size-4.5" />
        </button>

        {/* Company chip */}
        <span className="mr-1 hidden items-center gap-2 rounded-full border border-ink-200 bg-ink-50/70 py-1 pl-1 pr-3 xl:flex">
          <Image src="/company-logo.jpeg" alt="" width={22} height={22} className="rounded-full" />
          <span className="text-[12.5px] font-semibold text-ink-700">{COMPANY.name}</span>
        </span>

        {/* Pin */}
        <button
          onClick={() => {
            dispatch({ type: "toggleBookmark", href: pathname });
            toast.success(pinned ? "Removed from pinned screens" : "Pinned to the sidebar");
          }}
          aria-label={pinned ? "Unpin this screen" : "Pin this screen"}
          title={pinned ? "Unpin this screen" : "Pin this screen"}
          className="focus-brand hidden size-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 sm:grid"
        >
          <Star className={cn("size-4.5", pinned && "fill-amber-400 text-amber-400")} />
        </button>

        {/* Language */}
        <Dropdown
          trigger={() => (
            <span className="grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100">
              <Globe className="size-4.5" />
            </span>
          )}
        >
          {(close) => (
            <>
              <p className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">Language</p>
              {["English (UK)", "বাংলা", "中文"].map((lang, i) => (
                <MenuItem
                  key={lang}
                  icon={i === 0 ? <Check className="size-3.5 text-brand-500" /> : <span className="block size-3.5" />}
                  onClick={() => {
                    close();
                    toast.success(i === 0 ? "Already using English (UK)" : `Interface language set to ${lang}`);
                  }}
                >
                  {lang}
                </MenuItem>
              ))}
            </>
          )}
        </Dropdown>

        {/* Messages */}
        <Dropdown
          trigger={() => (
            <span className="relative grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100">
              <Mail className="size-4.5" />
              {messagesUnread > 0 && (
                <CountBadge value={messagesUnread} className="absolute -right-0.5 -top-0.5 ring-2 ring-white" />
              )}
            </span>
          )}
          panelClassName="w-80"
        >
          {(close) => (
            <>
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[12.5px] font-semibold text-ink-900">Messages</p>
                <button
                  className="text-[11.5px] font-medium text-brand-600 hover:underline"
                  onClick={() => {
                    dispatch({ type: "readMessages" });
                    toast.success("All messages marked as read");
                    close();
                  }}
                >
                  Mark all read
                </button>
              </div>
              <MenuDivider />
              {[
                { from: "Tanvir Hossain", text: "Comparative statement for RFQ-25-4009 is ready for your review.", at: 25 },
                { from: "Farhana Akter", text: "Budget confirmed for the Q3 trims buy — please release the PO.", at: 140 },
                { from: "Imran Kabir", text: "Container CTG-42-8891 arrived at the gate. Awaiting inspection.", at: 300 },
              ].map((m) => (
                <button
                  key={m.from}
                  onClick={() => {
                    close();
                    toast(`Opening the thread with ${m.from}`, { icon: "✉️" });
                  }}
                  className="flex w-full gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-ink-50"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                    {initials(m.from)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[12.5px] font-medium text-ink-900">{m.from}</span>
                      <span className="shrink-0 text-[10.5px] text-ink-400">{m.at}m</span>
                    </span>
                    <span className="line-clamp-2 text-[11.5px] leading-relaxed text-ink-500">{m.text}</span>
                  </span>
                </button>
              ))}
            </>
          )}
        </Dropdown>

        {/* Notifications */}
        <Dropdown
          trigger={() => (
            <span className="relative grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100">
              <Bell className="size-4.5" />
              {unreadCount > 0 && (
                <CountBadge value={unreadCount} className="absolute -right-0.5 -top-0.5 bg-red-500 ring-2 ring-white" />
              )}
            </span>
          )}
          panelClassName="w-[340px]"
        >
          {(close) => (
            <>
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[12.5px] font-semibold text-ink-900">
                  Notifications {unreadCount > 0 && <span className="text-ink-400">· {unreadCount} new</span>}
                </p>
                <button
                  className="flex items-center gap-1 text-[11.5px] font-medium text-brand-600 hover:underline"
                  onClick={() => {
                    dispatch({ type: "readAllNotifications" });
                    toast.success("All notifications marked as read");
                  }}
                >
                  <CheckCheck className="size-3" /> Mark all
                </button>
              </div>
              <MenuDivider />
              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="px-3 py-8 text-center text-[12.5px] text-ink-400">You are all caught up.</p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      dispatch({ type: "readNotification", id: n.id });
                      close();
                      if (n.href) router.push(n.href);
                    }}
                    className={cn(
                      "flex w-full gap-2.5 border-l-2 px-3 py-2.5 text-left transition-colors hover:bg-ink-50",
                      n.read ? "border-transparent opacity-60" : "border-brand-400 bg-brand-50/30",
                    )}
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE_RING[n.tone])} aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium text-ink-900">{n.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-relaxed text-ink-500">{n.body}</span>
                      <span className="mt-1 block text-[10.5px] text-ink-400">{relative(n.at)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Dropdown>

        <div className="mx-1 hidden h-8 w-px bg-ink-200 sm:block" />

        {/* Account */}
        <Dropdown
          trigger={() => (
            <span className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-ink-100">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-amber-500 text-[12px] font-bold text-white">
                {initials(user?.name ?? "Mohammad Sayem")}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[12.5px] font-semibold text-ink-900">{user?.name ?? "Mohammad Sayem"}</span>
                <span className="block text-[10.5px] text-ink-400">{user?.role ?? "Super-Admin"}</span>
              </span>
            </span>
          )}
          panelClassName="w-[280px]"
        >
          {(close) => (
            <>
              <div className="px-3 py-3">
                <p className="text-[13.5px] font-semibold text-ink-900">{user?.name ?? COMPANY.director}</p>
                <p className="text-[12px] text-ink-500">{user?.email ?? COMPANY.email}</p>
              </div>
              <MenuDivider />
              <dl className="px-3 py-2 text-[12px]">
                <div className="flex justify-between py-1">
                  <dt className="text-ink-500">Role</dt>
                  <dd className="font-semibold text-brand-600">{user?.role ?? "Super-Admin"}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-ink-500">Director</dt>
                  <dd className="font-medium text-ink-800">{COMPANY.director}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-ink-500">Mobile</dt>
                  <dd className="font-medium text-ink-800">{COMPANY.mobile}</dd>
                </div>
              </dl>
              <MenuDivider />
              <MenuItem icon={<UserRound className="size-3.5" />} onClick={() => { close(); toast("Profile settings are read-only in this demo", { icon: "👤" }); }}>
                Profile settings
              </MenuItem>
              <MenuItem
                icon={<LogOut className="size-3.5" />}
                danger
                onClick={() => {
                  close();
                  dispatch({ type: "signOut" });
                  toast.success("Signed out securely");
                  router.push("/login");
                }}
              >
                Sign Out
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}

export function NavbarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[13px] text-ink-600 hover:text-brand-600">
      {children}
    </Link>
  );
}
