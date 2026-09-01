import type { Metadata } from "next";
import { CompanyUnits } from "@/features/cps/CompanyUnits";

export const metadata: Metadata = {
  title: "Company Unit Registration",
  description: "Controlled company unit master data.",
};

export default function Page() {
  return <CompanyUnits />;
}
