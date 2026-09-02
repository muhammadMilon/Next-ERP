import {
  Activity,
  Award,
  Boxes,
  Calculator,
  ChartColumnBig,
  ClipboardList,
  CircleCheckBig,
  Database,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  Layers,
  List,
  Microscope,
  PackageOpen,
  Paperclip,
  Quote,
  Radar,
  ScrollText,
  Send,
  ShieldCheck,
  ShoppingCart,
  SquarePen,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { LeafKind } from "@/lib/nav/types";

const MAP: Record<string, LucideIcon> = {
  Award,
  Boxes,
  Calculator,
  ChartColumnBig,
  ClipboardList,
  CircleCheckBig,
  Database,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  Layers,
  List,
  Microscope,
  PackageOpen,
  Paperclip,
  Quote,
  Radar,
  ScrollText,
  Send,
  ShieldCheck,
  ShoppingCart,
  SquarePen,
  Truck,
  Users,
  Warehouse,
};

/** Every screen kind carries its own glyph, so a long group reads as a list of
 *  things rather than a wall of text. */
const KIND_MAP: Record<LeafKind, LucideIcon> = {
  dashboard: LayoutDashboard,
  analytics: ChartColumnBig,
  report: ScrollText,
  list: List,
  status: Activity,
  form: SquarePen,
  approval: CircleCheckBig,
  document: Paperclip,
  master: Database,
};

export function LeafIcon({ kind, className }: { kind: LeafKind; className?: string }) {
  const Icon = KIND_MAP[kind] ?? List;
  return <Icon className={className} aria-hidden />;
}

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? LayoutDashboard;
  return <Icon className={className} aria-hidden />;
}
