import type { Metadata } from "next";
import { PurchaseRequisition } from "@/features/cps/PurchaseRequisition";

export const metadata: Metadata = {
  title: "Purchase Requisition",
  description: "Raise, save and submit a unit requisition.",
};

export default function Page() {
  return <PurchaseRequisition />;
}
