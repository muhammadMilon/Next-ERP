"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="animate-fade-in fixed inset-0 bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "animate-pop-in relative z-10 my-auto w-full overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-ink-200",
          widths[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 bg-gradient-to-r from-brand-50/70 to-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="focus-brand -mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-5 py-3">{footer}</footer>
        )}
      </div>
    </div>
  );
}
