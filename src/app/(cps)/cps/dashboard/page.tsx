import type { Metadata } from "next";
import { CpsDashboard } from "@/features/cps/CpsDashboard";

export const metadata: Metadata = {
  title: "Central Procurement Dashboard",
  description: "Live procurement position across every company unit.",
};

export default function Page() {
  return <CpsDashboard />;
}
