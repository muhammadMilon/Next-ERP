import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing to show",
  body,
  action,
  icon,
}: {
  title?: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-500">
        {icon ?? <Inbox className="size-5" />}
      </span>
      <p className="text-[14px] font-semibold text-ink-800">{title}</p>
      {body && <p className="max-w-sm text-[13px] leading-relaxed text-ink-500">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
