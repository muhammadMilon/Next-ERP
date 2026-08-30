import { cn } from "@/lib/utils/cn";

export function Progress({ value, className, tone }: { value: number; className?: string; tone?: "brand" | "good" | "warn" }) {
  const v = Math.max(0, Math.min(100, value));
  const bar =
    tone === "good" ? "bg-emerald-500" : tone === "warn" ? "bg-amber-500" : "bg-gradient-to-r from-brand-400 to-brand-500";
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="h-1.5 w-full min-w-[52px] overflow-hidden rounded-full bg-ink-100">
        <span className={cn("block h-full rounded-full transition-all duration-500", bar)} style={{ width: `${v}%` }} />
      </span>
      <span className="w-9 shrink-0 text-right font-mono text-[11.5px] tabular-nums text-ink-600">{Math.round(v)}%</span>
    </span>
  );
}
