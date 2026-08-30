import {
  Award,
  Boxes,
  Calculator,
  ChartColumnBig,
  ClipboardList,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  Layers,
  Microscope,
  PackageOpen,
  Quote,
  Radar,
  ScrollText,
  Send,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Award,
  Boxes,
  Calculator,
  ChartColumnBig,
  ClipboardList,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  Layers,
  Microscope,
  PackageOpen,
  Quote,
  Radar,
  ScrollText,
  Send,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? LayoutDashboard;
  return <Icon className={className} aria-hidden />;
}
