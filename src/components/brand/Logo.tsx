import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  compact?: boolean;
}

/** Smart Global IT identity lockup — mark plus two-line wordmark. */
export function Logo({ size = 34, className, showWordmark = true, compact = false }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-ink-200 bg-white"
        style={{ width: size, height: size }}
      >
        <Image
          src="/company-logo.jpeg"
          alt="Smart Global IT"
          fill
          sizes="48px"
          className="object-cover"
          priority
        />
      </span>
      {showWordmark && (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "truncate bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 bg-clip-text font-bold tracking-tight text-transparent",
              compact ? "text-[13px]" : "text-[15px]",
            )}
          >
            Smart Global IT
          </span>
          <span
            className={cn(
              "mt-1 truncate font-medium uppercase text-ink-400",
              compact ? "text-[8px] tracking-[0.16em]" : "text-[9px] tracking-[0.2em]",
            )}
          >
            Smart ERP
          </span>
        </span>
      )}
    </span>
  );
}
