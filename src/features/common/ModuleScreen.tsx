"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { findLeaf } from "@/lib/nav/registry";
import type { LeafLocation } from "@/lib/nav/types";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { PageSkeleton } from "@/components/ui/Skeleton";

export interface ScreenProps {
  loc: LeafLocation;
}

const lazy = (load: () => Promise<{ default: ComponentType<ScreenProps> }>) =>
  dynamic(load, { loading: () => <PageSkeleton /> });

/** Screens that get a bespoke layout instead of the generic workspace. */
const BESPOKE: Record<string, ComponentType<ScreenProps>> = {
  "/purchase/purchase-control-tower/purchase-dashboard": lazy(() =>
    import("@/features/purchase/PurchaseControlTower").then((m) => ({ default: m.PurchaseControlTower })),
  ),
  "/inventory/inventory-control-tower/dashboard": lazy(() =>
    import("@/features/inventory/InventoryControlTower").then((m) => ({ default: m.InventoryControlTower })),
  ),
  "/purchase/supplier-quotation/quotation-comparison": lazy(() =>
    import("@/features/purchase/QuotationComparison").then((m) => ({ default: m.QuotationComparison })),
  ),
  "/purchase/tco-evaluation/supplier-comparison": lazy(() =>
    import("@/features/purchase/TcoComparison").then((m) => ({ default: m.TcoComparison })),
  ),
  "/inventory/po-grn-iqc-reconciliation/po-grn-iqc-reconciliation": lazy(() =>
    import("@/features/inventory/ThreeWayMatch").then((m) => ({ default: m.ThreeWayMatch })),
  ),
};

export function ModuleScreen({ href }: { href: string }) {
  const loc = findLeaf(href.split("/").filter(Boolean));
  if (!loc) return null;

  const Bespoke = BESPOKE[href];
  if (Bespoke) return <Bespoke loc={loc} />;

  return <WorkspacePage loc={loc} />;
}
