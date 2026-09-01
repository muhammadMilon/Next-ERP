import type { Metadata } from "next";
import { PrototypeNotes } from "@/features/cps/PrototypeNotes";

export const metadata: Metadata = {
  title: "Prototype Notes",
  description: "Phase 1 scope and the recommended next step.",
};

export default function Page() {
  return <PrototypeNotes />;
}
