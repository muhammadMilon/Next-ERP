"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Click-outside popover used by the navbar menus and table row actions. */
export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
  panelClassName,
}: {
  trigger: (open: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-brand rounded-lg"
      >
        {trigger(open)}
      </button>
      {open && (
        <div
          className={cn(
            "animate-slide-down absolute z-40 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-ink-200 bg-surface py-1 shadow-pop",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  icon,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        danger ? "text-red-600 hover:bg-red-50" : "text-ink-700 hover:bg-ink-50",
      )}
    >
      {icon && <span className="text-ink-400">{icon}</span>}
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-ink-100" />;
}
