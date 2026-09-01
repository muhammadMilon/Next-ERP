/** Pure derived reads over the procurement state — no React, no side effects,
 *  so the dashboard, the reports and the tests all agree on the same numbers. */

import { allocationValue, lineValue, type CpsState, type ItemCategory } from "./types";

export interface CpsKpis {
  pendingPrs: number;
  approvedPrs: number;
  itemsConsolidated: number;
  posReleased: number;
  cycleDays: number;
  unprocessedApproved: number;
  consolidatedValue: number;
  supplierAllocations: number;
  demandConsolidated: number;
  poValueReleased: number;
}

export function computeKpis(state: CpsState): CpsKpis {
  const pendingPrs = state.prs.filter((p) => p.status === "Pending Approval").length;
  const approved = state.prs.filter((p) => p.status === "Approved");
  const confirmed = state.consolidations.filter((c) => c.status === "Confirmed");
  const items = new Set<string>();
  let allocations = 0;
  let value = 0;
  for (const dc of confirmed) {
    for (const line of dc.lines) {
      items.add(line.uic);
      allocations += line.allocations.length;
      value += allocationValue(line);
    }
  }
  const released = state.pos.filter((p) => p.status === "Released");
  const cycles = released
    .map((po) => {
      const dc = state.consolidations.find((c) => c.dcNo === po.dcNo);
      if (!dc) return null;
      const dates = state.prs
        .filter((p) => dc.sourcePrNos.includes(p.prNo))
        .map((p) => new Date(p.prDate).getTime());
      if (!dates.length) return null;
      const days = (new Date(po.poDate).getTime() - Math.max(...dates)) / 86_400_000;
      return days >= 0 ? days : 0;
    })
    .filter((d): d is number => d !== null);

  return {
    pendingPrs,
    approvedPrs: approved.length,
    itemsConsolidated: items.size,
    posReleased: released.length,
    cycleDays: cycles.length ? Math.round((cycles.reduce((s, d) => s + d, 0) / cycles.length) * 10) / 10 : 0,
    unprocessedApproved: approved.filter((p) => !p.consolidatedIn).length,
    consolidatedValue: value,
    supplierAllocations: allocations,
    demandConsolidated: confirmed.reduce((s, c) => s + c.lines.length, 0),
    poValueReleased: released.reduce(
      (s, po) => s + po.lines.reduce((t, l) => t + lineValue(l.qty, l.unitPrice), 0),
      0,
    ),
  };
}

/** Approved requisitions that have not yet been pulled into a consolidation. */
export const openApprovedPrs = (state: CpsState, category: ItemCategory | "All", period?: string) => {
  const itemsByUic = new Map(state.items.map((i) => [i.uic, i]));
  return state.prs.filter((pr) => {
    if (pr.status !== "Approved" || pr.consolidatedIn) return false;
    if (period && pr.prDate.slice(0, 7) !== period) return false;
    if (category === "All") return true;
    return pr.lines.some((l) => itemsByUic.get(l.uic)?.category === category);
  });
};
