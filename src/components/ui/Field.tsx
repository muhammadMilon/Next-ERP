"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const base =
  "focus-brand w-full rounded-lg border border-ink-200 bg-white px-3 text-[13.5px] text-ink-900 placeholder:text-ink-400 transition-colors hover:border-ink-300 focus:border-brand-400 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500";

export function Field({
  label,
  htmlFor,
  required,
  error,
  help,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  help?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-[12.5px] font-medium text-ink-700">
        {label}
        {required && <span className="text-brand-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11.5px] font-medium text-red-600">{error}</p>
      ) : help ? (
        <p className="text-[11.5px] text-ink-400">{help}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...rest }, ref) {
    return <input ref={ref} className={cn(base, "h-10", invalid && "border-red-400 focus:border-red-500", className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={3}
        className={cn(base, "resize-y py-2 leading-relaxed", invalid && "border-red-400 focus:border-red-500", className)}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; placeholder?: string; options: readonly string[] }
>(function Select({ className, invalid, placeholder, options, ...rest }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(base, "h-10 appearance-none pr-9", invalid && "border-red-400 focus:border-red-500", className)}
        {...rest}
      >
        <option value="">{placeholder ?? "Select…"}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
    </div>
  );
});

export function Checkbox({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("flex cursor-pointer select-none items-center gap-2 text-[13px] text-ink-700", className)}>
      <input
        type="checkbox"
        className="focus-brand size-4 rounded border-ink-300 text-brand-500 accent-brand-500"
        {...rest}
      />
      {label}
    </label>
  );
}
