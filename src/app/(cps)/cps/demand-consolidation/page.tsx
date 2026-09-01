import type { Metadata } from "next";
import { DemandConsolidation } from "@/features/cps/DemandConsolidation";

export const metadata: Metadata = {
  title: "Demand Consolidation",
  description: "Item-wise approved demand and supplier allocation.",
};

export default function Page() {
  return <DemandConsolidation />;
}
