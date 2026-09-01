import type { Metadata } from "next";
import { PurchaseOrder } from "@/features/cps/PurchaseOrder";

export const metadata: Metadata = {
  title: "Purchase Order",
  description: "Consolidated purchase orders raised from supplier allocation.",
};

export default function Page() {
  return <PurchaseOrder />;
}
