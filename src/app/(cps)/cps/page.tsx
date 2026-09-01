import type { Metadata } from "next";
import { PrototypeNavigation } from "@/features/cps/PrototypeNavigation";

export const metadata: Metadata = {
  title: "Prototype Navigation",
  description: "Every Phase 1 screen of the Bay Group Central Procurement System.",
};

export default function Page() {
  return <PrototypeNavigation />;
}
