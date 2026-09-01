import type { Metadata } from "next";
import { ItemMaster } from "@/features/cps/ItemMaster";

export const metadata: Metadata = {
  title: "Item Master — Indirect & CAPEX",
  description: "One controlled item identity for the whole group.",
};

export default function Page() {
  return <ItemMaster />;
}
