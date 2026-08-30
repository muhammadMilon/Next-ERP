import { notFound } from "next/navigation";
import { ALL_LEAVES, findLeaf } from "@/lib/nav/registry";
import { ModuleScreen } from "@/features/common/ModuleScreen";

/** The module tree is a closed set, so anything outside it is a hard 404
 *  rather than a soft one rendered with a 200. */
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_LEAVES.map((l) => ({ slug: l.href.split("/").filter(Boolean) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const loc = findLeaf(slug);
  return { title: loc ? `${loc.leaf.label} — ${loc.group.label}` : "Not found" };
}

export default async function ModuleLeafPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const loc = findLeaf(slug);
  if (!loc) notFound();
  return <ModuleScreen href={loc.href} />;
}
