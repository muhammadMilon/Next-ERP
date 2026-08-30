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

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm hover:from-brand-400 hover:to-brand-500 active:from-brand-600 active:to-brand-700 disabled:from-brand-300 disabled:to-brand-300",
  secondary:
    "bg-white text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:text-ink-900 active:bg-ink-100",
  outline:
    "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-100 active:bg-brand-200",
  ghost: "text-ink-500 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200",
  subtle: "bg-ink-100 text-ink-700 hover:bg-ink-200 active:bg-ink-200",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-500 active:bg-red-700",
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
