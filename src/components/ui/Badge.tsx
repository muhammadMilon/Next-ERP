import { statusTone, TONE_CLASS, TONE_DOT, type Tone } from "@/lib/data/datasets";
import { cn } from "@/lib/utils/cn";

/** Status is never colour-alone: every pill carries its label, and a dot for shape. */
export function StatusPill({ value, className }: { value: string; className?: string }) {
  const tone = statusTone(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} aria-hidden />
      {value}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md bg-ink-100 px-1.5 py-0.5 text-[11.5px] font-medium text-ink-600",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ToneBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset", TONE_CLASS[tone])}>
      <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} aria-hidden />
      {children}
    </span>
  );
}

export function CountBadge({ value, className }: { value: number; className?: string }) {
  if (value <= 0) return null;
  return (
    <span
      className={cn(
        "grid min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold leading-[18px] text-white",
        className,
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}
