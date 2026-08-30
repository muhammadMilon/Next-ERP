"use client";

import { cn } from "@/lib/utils/cn";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1 rounded-xl bg-ink-100/70 p-1", className)}>
      {items.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "focus-brand inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150",
              active ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-px font-mono text-[10.5px] tabular-nums",
                  active ? "bg-brand-50 text-brand-600" : "bg-ink-200/70 text-ink-500",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
