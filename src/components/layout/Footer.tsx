import { MapPin } from "lucide-react";
import { COMPANY } from "@/lib/data/reference";

export function Footer() {
  return (
    <footer className="no-print border-t border-ink-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-[11.5px] text-ink-500 sm:px-6">
        <p className="flex flex-wrap items-center gap-x-1.5">
          <span>{COMPANY.product}</span>
          <span className="text-ink-300">·</span>
          <span className="font-semibold text-brand-600">{COMPANY.name}</span>
          <span className="text-ink-300">·</span>
          <span>Director: {COMPANY.director}</span>
          <span className="text-ink-300">·</span>
          <a href={`tel:${COMPANY.mobile}`} className="transition-colors hover:text-brand-600">
            {COMPANY.mobile}
          </a>
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-ink-400" aria-hidden />
          {COMPANY.address}
        </p>
      </div>
    </footer>
  );
}
