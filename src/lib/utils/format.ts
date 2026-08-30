/** Display formatters shared by every table, chart and stat tile. */

export const currency = (n: number, opts?: { compact?: boolean; symbol?: string }) => {
  const symbol = opts?.symbol ?? "$";
  if (opts?.compact) return `${symbol}${compact(n)}`;
  return `${symbol}${n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
};

export const compact = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

export const num = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export const dateShort = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const dateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${dateShort(iso)} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

/** "3 days ago" / "in 2 days" — used by activity feeds and due-date columns. */
export const relative = (iso: string) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = then - Date.now();
  const days = Math.round(diff / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(days) >= 1) return rtf.format(days, "day");
  const hours = Math.round(diff / 3_600_000);
  if (Math.abs(hours) >= 1) return rtf.format(hours, "hour");
  return rtf.format(Math.round(diff / 60_000), "minute");
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export const titleCase = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
