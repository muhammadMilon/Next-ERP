import type { Metadata } from "next";
import { PrApproval } from "@/features/cps/PrApproval";

export const metadata: Metadata = {
  title: "PR Approval",
  description: "Review, decide and record the audit trail.",
};

export default function Page() {
  return <PrApproval />;
}
