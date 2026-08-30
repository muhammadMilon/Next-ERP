import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-ink-200/80 bg-white shadow-card transition-shadow duration-200 hover:border-ink-200",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  hint,
  actions,
  icon,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-4 border-b border-ink-100 px-4 py-3", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>}
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold tracking-tight text-ink-900">{title}</h3>
          {hint && <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-ink-500">{hint}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-500">{children}</h2>
      {hint && <span className="text-[12px] text-ink-400">{hint}</span>}
    </div>
  );
}
