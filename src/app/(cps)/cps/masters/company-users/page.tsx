import type { Metadata } from "next";
import { CompanyUsers } from "@/features/cps/CompanyUsers";

export const metadata: Metadata = {
  title: "Company User Registration",
  description: "Users, roles and the access matrix.",
};

export default function Page() {
  return <CompanyUsers />;
}
