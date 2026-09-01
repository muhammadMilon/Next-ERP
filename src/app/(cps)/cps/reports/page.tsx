import type { Metadata } from "next";
import { CpsReports } from "@/features/cps/CpsReports";

export const metadata: Metadata = {
  title: "Reports",
  description: "Registers, item-wise demand and PO traceability.",
};

export default function Page() {
  return <CpsReports />;
}
