"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle" | "outline";
type Size = "xs" | "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/* Filled variants carry white type, so they hold a saturated mid-tone rather
   than the light end of the ink-authored ramps. */
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-sm hover:bg-[#7377f5] active:bg-[#5457dd] disabled:bg-brand-300 disabled:text-ink-500",
  secondary:
    "bg-ink-50 text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200",
  outline:
    "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-100 active:bg-brand-200",
  ghost: "text-ink-500 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200",
  subtle: "bg-ink-100 text-ink-700 hover:bg-ink-200 active:bg-ink-200",
  danger: "bg-[#cf2f3a] text-white shadow-sm hover:bg-[#e0404b] active:bg-[#b32731]",
};

const SIZES: Record<Size, string> = {
  xs: "h-7 gap-1.5 px-2.5 text-[12px]",
  sm: "h-9 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-[14px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "sm", loading, icon, iconRight, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "focus-brand inline-flex select-none items-center justify-center rounded-lg font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});
