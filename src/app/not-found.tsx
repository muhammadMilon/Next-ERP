import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink-50 px-4">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-ink-200 bg-white p-10 text-center shadow-card">
        <Logo size={44} />
        <p className="font-mono text-[44px] font-bold leading-none text-brand-500">404</p>
        <h1 className="text-[18px] font-semibold text-ink-900">This screen is not in the module tree</h1>
        <p className="text-[13.5px] leading-relaxed text-ink-500">
          The address you followed does not match any Purchase or Inventory screen. Use the command palette
          (Ctrl / ⌘ + K) to jump to the right one.
        </p>
        <Link
          href="/dashboard"
          className="focus-brand mt-1 inline-flex h-10 items-center rounded-lg bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-[14px] font-medium text-white transition-colors hover:from-brand-400 hover:to-brand-500"
        >
          Back to the dashboard
        </Link>
      </div>
    </div>
  );
}
