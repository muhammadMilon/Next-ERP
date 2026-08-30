import { Filter } from "lucide-react";

/** Shown when the screen itself scopes the register (e.g. "Pending PR"). */
export function FilterNotice({ field, value, count }: { field: string; value: string; count: number }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/70 px-3 py-2 text-[12.5px] text-brand-800">
      <Filter className="size-3.5 shrink-0 text-brand-500" aria-hidden />
      <span>
        This screen is scoped to <strong className="font-semibold">{field}</strong> ={" "}
        <strong className="font-semibold">{value}</strong>.
      </span>
      <span className="ml-auto font-mono text-[11.5px] tabular-nums text-brand-600">{count} records in scope</span>
    </div>
  );
}
