import { cn } from "@/lib/utils/cn";
import { COMPANY } from "@/lib/data/reference";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  compact?: boolean;
  /** Inverted lockup for the dark procurement header. */
  onDark?: boolean;
}

/** Noor IT Solutions identity lockup — monogram mark plus two-line wordmark. */
export function Logo({ size = 34, className, showWordmark = true, compact = false, onDark = false }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      {showWordmark && (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "truncate font-bold tracking-tight",
              onDark
                ? "text-white"
                : "bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 bg-clip-text text-transparent",
              compact ? "text-[13px]" : "text-[15px]",
            )}
          >
            {COMPANY.name}
          </span>
          <span
            className={cn(
              "mt-1 truncate font-medium uppercase",
              onDark ? "text-brand-200" : "text-ink-400",
              compact ? "text-[8px] tracking-[0.16em]" : "text-[9px] tracking-[0.2em]",
            )}
          >
            {COMPANY.product}
          </span>
        </span>
      )}
    </span>
  );
}

/** The mark on its own — a teal roundel carrying the Noor "N". */
export function BrandMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={COMPANY.name}
    >
      <defs>
        <linearGradient id="noor-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="55%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f2c45" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" rx="14" fill="url(#noor-mark)" />
      <path
        d="M15 34V14h4.6l9 12.6V14H33v20h-4.6l-9-12.6V34H15Z"
        fill="#ffffff"
        fillOpacity="0.96"
      />
      <circle cx="35.5" cy="13.5" r="3" fill="#f6c23e" />
    </svg>
  );
}
