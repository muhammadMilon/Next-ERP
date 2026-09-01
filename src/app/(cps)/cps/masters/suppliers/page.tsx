import type { Metadata } from "next";
import { SupplierMaster } from "@/features/cps/SupplierMaster";

export const metadata: Metadata = {
  title: "Supplier Master Registration",
  description: "The approved supplier panel for allocation and PO.",
};

export default function Page() {
  return <SupplierMaster />;
}
