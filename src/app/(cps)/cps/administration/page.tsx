import type { Metadata } from "next";
import { CpsAdministration } from "@/features/cps/CpsAdministration";

export const metadata: Metadata = {
  title: "Administration",
  description: "Roles, access matrix, audit trail and prototype data.",
};

export default function Page() {
  return <CpsAdministration />;
}
