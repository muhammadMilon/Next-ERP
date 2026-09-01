import { CpsShell } from "@/components/cps/CpsShell";

export default function CpsLayout({ children }: { children: React.ReactNode }) {
  return <CpsShell>{children}</CpsShell>;
}
