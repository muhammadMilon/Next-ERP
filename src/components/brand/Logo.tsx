import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { COMPANY } from "@/lib/data/reference";

/** Intrinsic dimensions of the two artwork files in /public. */
const LOCKUP = { w: 635, h: 207 };
const MARK = { w: 175, h: 206 };

interface LogoProps {
  /** Height of the monogram tile; the lockup is scaled to sit against it. */
  size?: number;
  className?: string;
  /** false renders the monogram alone — the collapsed rail. */
  showWordmark?: boolean;
}

/** Noor IT Solutions identity — the supplied lockup over the product name. */
export function Logo({ size = 34, className, showWordmark = true }: LogoProps) {
  if (!showWordmark) return <BrandMark size={size} className={className} />;

  const h = Math.round(size * 0.72);
  const w = Math.round((h * LOCKUP.w) / LOCKUP.h);

  return (
    <span className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Image
        src="/company-logo.png"
        alt={COMPANY.name}
        width={w}
        height={h}
        priority
        className="h-auto w-auto shrink-0"
        style={{ height: h, width: w }}
      />
      <span
        className="truncate font-medium uppercase text-ink-400"
        style={{ fontSize: Math.max(8, Math.round(size * 0.26)), letterSpacing: "0.2em" }}
      >
        {COMPANY.product}
      </span>
    </span>
  );
}

/** The monogram on its own, on a tile that lifts it off the surrounding panel. */
export function BrandMark({ size = 34, className }: { size?: number; className?: string }) {
  const inner = Math.round(size * 0.62);

  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xl bg-ink-100 ring-1 ring-inset ring-ink-200", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={COMPANY.name}
    >
      <Image
        src="/company-mark.png"
        alt=""
        width={Math.round((inner * MARK.w) / MARK.h)}
        height={inner}
        style={{ height: inner, width: Math.round((inner * MARK.w) / MARK.h) }}
      />
    </span>
  );
}
