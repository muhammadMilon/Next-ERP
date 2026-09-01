/** Deterministic Phase-1 seed. The register must read like a system of record,
 *  so every number below comes from a seeded PRNG rather than Math.random(). */

import { addDays, todayISO } from "@/lib/utils/format";
import { chance, hashString, intBetween, makeRng, pick, type Rng } from "@/lib/utils/random";
import {
  ROLE_ACCESS,
  type CpsConsolidation,
  type CpsConsolidationLine,
  type CpsItem,
  type CpsPo,
  type CpsPoLine,
  type CpsPr,
  type CpsPrLine,
  type CpsState,
  type CpsSupplier,
  type CpsUnit,
  type CpsUser,
  type ItemCategory,
  type Priority,
  type Uom,
} from "./types";

export const pad = (n: number, w: number) => String(n).padStart(w, "0");

/* ── Units ────────────────────────────────────────────────────────────────── */

const UNIT_SEED: Array<[string, string, string, string]> = [
  ["BAY-001", "Bay Emporium Ltd.", "BEL", "Bay Emporium Limited"],
  ["BAY-002", "Bay Group Trading", "BGT", "Bay Group Trading Limited"],
  ["BAY-003", "Bay Manufacturing", "BML", "Bay Manufacturing Limited"],
  ["BAY-004", "Bay Logistics", "BLG", "Bay Logistics Limited"],
  ["BAY-005", "Bay Properties", "BPR", "Bay Properties Limited"],
  ["BAY-006", "Bay Corporate Office", "BCO", "Bay Group Corporate Office"],
];

const APPROVER_NAMES = [
  "Unit Head — Bay Emporium",
  "Unit Head — Bay Trading",
  "Unit Head — Bay Manufacturing",
  "Unit Head — Bay Logistics",
  "Unit Head — Bay Properties",
  "Group Head of Procurement",
];

const seedUnits = (): CpsUnit[] =>
  UNIT_SEED.map(([code, name, shortName, legalName], i) => ({
    id: `unit-${i + 1}`,
    code,
    name,
    shortName,
    legalName,
    procurementAuthority: "Central Procurement",
    defaultApprover: APPROVER_NAMES[i],
    status: "Active" as const,
    remarks: "",
  }));

/* ── Users ────────────────────────────────────────────────────────────────── */

const USER_SEED: Array<[string, string, string, keyof typeof ROLE_ACCESS, string]> = [
  ["Md. Rahim", "BAY-001", "Purchase Executive", "PR Creator", "N/A"],
  ["Sabina Yasmin", "BAY-001", "Unit Head", "PR Approver", "BDT 10,00,000"],
  ["Arif Chowdhury", "BAY-002", "Store Officer", "PR Creator", "N/A"],
  ["Nazmul Hasan", "BAY-002", "Unit Head", "PR Approver", "BDT 10,00,000"],
  ["Farzana Islam", "BAY-003", "Admin Officer", "PR Creator", "N/A"],
  ["Kamrul Ahsan", "BAY-003", "Unit Head", "PR Approver", "BDT 15,00,000"],
  ["Shahriar Kabir", "BAY-004", "Maintenance Lead", "PR Creator", "N/A"],
  ["Rehana Parvin", "BAY-005", "Facilities Officer", "PR Creator", "N/A"],
  ["Tanjil Mahmud", "BAY-006", "Procurement Officer", "Central Procurement", "BDT 25,00,000"],
  ["Ayesha Siddiqua", "BAY-006", "Category Manager", "Central Procurement", "BDT 25,00,000"],
  ["Rashed Karim", "BAY-006", "Head of Procurement", "PR Approver", "BDT 50,00,000"],
  ["System Administrator", "BAY-006", "System Administrator", "Admin", "Unlimited"],
];

const roleTag = (role: keyof typeof ROLE_ACCESS) =>
  role === "PR Creator" ? "PR" : role === "PR Approver" ? "AP" : role === "Admin" ? "AD" : "CP";

const seedUsers = (): CpsUser[] =>
  USER_SEED.map(([name, unitCode, designation, role, approvalLimit], i) => {
    const unit = UNIT_SEED.find((u) => u[0] === unitCode)!;
    return {
      id: `user-${i + 1}`,
      userId: `${unit[2]}-${roleTag(role)}-${pad(i + 1, 3)}`,
      name,
      unitCode,
      designation,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@baygroup.com`,
      role,
      approvalLimit,
      status: "Active" as const,
      authentication: "Password / SSO" as const,
      access: { ...ROLE_ACCESS[role] },
    };
  });

/* ── Items ────────────────────────────────────────────────────────────────── */

type ItemSeed = [string, string, Uom, number];

const INDIRECT: ItemSeed[] = [
  ["Safety Shoe", "PPE", "Pair", 950],
  ["Safety Helmet", "PPE", "Pcs", 480],
  ["Hand Gloves — Cotton", "PPE", "Pair", 65],
  ["Ear Plug", "PPE", "Pair", 40],
  ["Safety Goggles", "PPE", "Pcs", 220],
  ["Reflective Vest", "PPE", "Pcs", 310],
  ["Dust Mask", "PPE", "Box", 620],
  ["Fire Extinguisher Refill", "Utility", "Nos", 1450],
  ["Cleaning Chemical", "Housekeeping", "Ltr", 180],
  ["Floor Mop Set", "Housekeeping", "Set", 420],
  ["Hand Sanitiser 5L", "Housekeeping", "Ltr", 260],
  ["Garbage Bin 60L", "Housekeeping", "Pcs", 890],
  ["Toilet Tissue", "Housekeeping", "Box", 540],
  ["Detergent Powder", "Housekeeping", "Kg", 210],
  ["A4 Paper 80 GSM", "Stationery", "Box", 1250],
  ["Ball Pen", "Stationery", "Box", 180],
  ["File Folder", "Stationery", "Pcs", 45],
  ["Printer Toner", "Stationery", "Pcs", 4800],
  ["Whiteboard Marker", "Stationery", "Box", 320],
  ["Register Book", "Stationery", "Pcs", 150],
  ["LED Tube Light 20W", "Electrical", "Pcs", 340],
  ["LED Flood Light 100W", "Electrical", "Pcs", 1850],
  ["Electrical Cable 2.5 RM", "Electrical", "Roll", 5200],
  ["Circuit Breaker 32A", "Electrical", "Pcs", 980],
  ["Ceiling Fan 56 inch", "Electrical", "Pcs", 4200],
  ["Extension Board 6 Socket", "Electrical", "Pcs", 620],
  ["Emergency Exit Light", "Electrical", "Pcs", 1350],
  ["Bearing 6204 ZZ", "Mechanical Spares", "Pcs", 380],
  ["V-Belt B-52", "Mechanical Spares", "Pcs", 540],
  ["Hydraulic Oil 68", "Mechanical Spares", "Ltr", 320],
  ["Grease Cartridge", "Mechanical Spares", "Pcs", 260],
  ["Air Filter Element", "Mechanical Spares", "Pcs", 1150],
  ["Coupling Rubber Spider", "Mechanical Spares", "Set", 720],
  ["Welding Electrode 3.2", "Mechanical Spares", "Kg", 310],
  ["Laptop Battery", "IT Equipment", "Pcs", 5600],
  ["Network Cable Cat-6", "IT Equipment", "Roll", 8900],
  ["UPS Battery 12V 7Ah", "IT Equipment", "Pcs", 2100],
  ["Wireless Access Point", "IT Equipment", "Pcs", 9800],
  ["CCTV Camera Dome", "IT Equipment", "Pcs", 4600],
  ["Water Treatment Chemical", "Utility", "Kg", 240],
  ["Diesel Fuel Additive", "Utility", "Ltr", 410],
  ["Boiler Water Softener Salt", "Utility", "Kg", 95],
  ["Tyre 195/65 R15", "Vehicle", "Pcs", 8200],
  ["Engine Oil 15W40", "Vehicle", "Ltr", 480],
];

const CAPEX: ItemSeed[] = [
  ["Air Compressor", "Machinery", "Set", 385000],
  ["Diesel Generator 150 KVA", "Machinery", "Set", 1650000],
  ["Forklift 3 Ton", "Machinery", "Nos", 2450000],
  ["Industrial Chiller", "Machinery", "Set", 1250000],
  ["Boiler 2 Ton", "Machinery", "Set", 1850000],
  ["Water Pump 10 HP", "Machinery", "Set", 96000],
  ["Air Conditioner 2 Ton", "Machinery", "Set", 78000],
  ["Server Rack 42U", "IT Equipment", "Nos", 145000],
  ["Firewall Appliance", "IT Equipment", "Nos", 420000],
  ["Delivery Van", "Vehicle", "Nos", 3250000],
  ["Pickup Truck", "Vehicle", "Nos", 2850000],
  ["Warehouse Racking System", "Civil Works", "Set", 680000],
  ["Fire Hydrant System", "Civil Works", "Set", 940000],
  ["Solar Rooftop 50 KW", "Civil Works", "Set", 2750000],
];

const SPEC_BY_SUB: Record<string, string> = {
  PPE: "Safety standard / size / material",
  Housekeeping: "Grade / concentration / pack size",
  Stationery: "Size / weight / pack size",
  Electrical: "Rating / voltage / make",
  "Mechanical Spares": "Make / model / dimension",
  "IT Equipment": "Brand / model / warranty",
  Utility: "Grade / purity / pack size",
  Machinery: "Capacity / brand / commissioning scope",
  Vehicle: "Model / engine / registration scope",
  "Civil Works": "Drawing / capacity / installation scope",
};

function seedItems(): CpsItem[] {
  const items: CpsItem[] = [];
  INDIRECT.forEach(([description, subCategory, uom, rate], i) => {
    items.push({
      id: `item-i-${i + 1}`,
      uic: `IND-${pad(125 + i * 7, 6)}`,
      category: "Indirect",
      description,
      uom,
      specification: SPEC_BY_SUB[subCategory] ?? "As per requirement",
      subCategory,
      capexFlag: "No",
      status: "Active",
      remarks: "",
      indicativeRate: rate,
    });
  });
  CAPEX.forEach(([description, subCategory, uom, rate], i) => {
    items.push({
      id: `item-c-${i + 1}`,
      uic: `CAP-${pad(31 + i * 5, 6)}`,
      category: "CAPEX",
      description,
      uom,
      specification: SPEC_BY_SUB[subCategory] ?? "As per requirement",
      subCategory,
      capexFlag: "Yes",
      status: "Active",
      remarks: "",
      indicativeRate: rate,
    });
  });
  return items;
}

/* ── Suppliers ────────────────────────────────────────────────────────────── */

const SUPPLIER_SEED: Array<[string, string, "Local" | "Foreign", string]> = [
  ["ABC Trading Ltd.", "Mr. Karim", "Local", "30 Days"],
  ["XYZ Supply Co.", "Mr. Haque", "Local", "45 Days"],
  ["Delta Safety House", "Ms. Farida", "Local", "30 Days"],
  ["Unique Office Supplies", "Mr. Sohel", "Local", "15 Days"],
  ["Bright Electricals", "Mr. Anis", "Local", "30 Days"],
  ["Prime Engineering Works", "Mr. Jamil", "Local", "60 Days"],
  ["Metro IT Solutions", "Ms. Nadia", "Local", "30 Days"],
  ["Green Chem Industries", "Mr. Bashir", "Local", "45 Days"],
  ["National Machinery Import", "Mr. Rezaul", "Foreign", "90 Days"],
  ["Orient Equipment Co.", "Mr. Tarek", "Foreign", "90 Days"],
  ["Skyline Auto Traders", "Mr. Faruk", "Local", "30 Days"],
  ["Summit Facilities Ltd.", "Ms. Rumana", "Local", "45 Days"],
];

const seedSuppliers = (): CpsSupplier[] =>
  SUPPLIER_SEED.map(([name, contactPerson, type, paymentTerm], i) => ({
    id: `sup-${i + 1}`,
    code: `SUP-${pad(125 + i, 5)}`,
    name,
    type,
    status: "Active" as const,
    contactPerson,
    email: `sales@${name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12)}.com`,
    paymentTerm,
    taxReg: "As applicable",
    remarks: "",
  }));

/* ── Requisitions ─────────────────────────────────────────────────────────── */

const PURPOSES = [
  "Store display accessories for upcoming season",
  "Monthly housekeeping consumables",
  "Annual PPE replenishment for the factory floor",
  "Maintenance shutdown spare parts",
  "Office stationery for the quarter",
  "Electrical maintenance of the production floor",
  "IT hardware replacement plan",
  "Utility chemical top-up",
  "Vehicle servicing consumables",
  "CAPEX approved in the annual budget",
];

/** Distribution tuned so the dashboard reads like a live month-end position. */
const PR_PLAN: Array<{ status: CpsPr["status"]; count: number }> = [
  { status: "Approved", count: 64 },
  { status: "Pending Approval", count: 28 },
  { status: "Draft", count: 9 },
  { status: "Returned", count: 5 },
  { status: "Rejected", count: 4 },
];

function makeLines(rng: Rng, items: CpsItem[], prDate: string, requiredBy: string, capex: boolean): CpsPrLine[] {
  const pool = items.filter((i) => (capex ? i.category === "CAPEX" : i.category === "Indirect"));
  const n = capex ? intBetween(rng, 1, 2) : intBetween(rng, 1, 4);
  const chosen = new Set<string>();
  const lines: CpsPrLine[] = [];
  for (let i = 0; i < n; i++) {
    const item = pick(rng, pool);
    if (chosen.has(item.uic)) continue;
    chosen.add(item.uic);
    lines.push({
      id: `${prDate}-${item.uic}-${i}`,
      uic: item.uic,
      description: item.description,
      specification: item.specification,
      qty: capex ? intBetween(rng, 1, 4) : intBetween(rng, 10, 600),
      uom: item.uom,
      requiredDate: requiredBy,
      remarks: chance(rng, 0.3) ? "For unit consumption" : "",
    });
  }
  return lines;
}

function seedPrs(units: CpsUnit[], users: CpsUser[], items: CpsItem[]): CpsPr[] {
  const rng = makeRng(hashString("bay-cps-pr"));
  const today = todayISO();
  const creators = users.filter((u) => u.role === "PR Creator");
  const approvers = users.filter((u) => u.role === "PR Approver");
  const prs: CpsPr[] = [];
  let seq = 1180;

  const statuses = PR_PLAN.flatMap((p) => Array.from({ length: p.count }, () => p.status));
  statuses.forEach((status, i) => {
    const ageDays = status === "Approved" ? intBetween(rng, 6, 110) : intBetween(rng, 0, 20);
    const prDate = addDays(today, -ageDays);
    const requiredBy = addDays(prDate, intBetween(rng, 10, 40));
    const unit = pick(rng, units);
    const creator = creators.find((c) => c.unitCode === unit.code) ?? pick(rng, creators);
    const capex = chance(rng, 0.16);
    const decided =
      status === "Approved" || status === "Rejected" || status === "Returned"
        ? addDays(prDate, intBetween(rng, 1, 4))
        : undefined;
    seq += intBetween(rng, 1, 3);
    prs.push({
      id: `pr-${i + 1}`,
      prNo: `PR-${prDate.slice(0, 4)}-${pad(seq, 6)}`,
      unitCode: unit.code,
      requester: creator.name,
      prDate,
      requiredBy,
      priority: pick(rng, ["Low", "Normal", "Normal", "Normal", "High", "Urgent"] as Priority[]),
      purpose: pick(rng, PURPOSES),
      status,
      lines: makeLines(rng, items, prDate, requiredBy, capex),
      createdAt: `${prDate}T09:${pad(intBetween(rng, 0, 59), 2)}:00.000Z`,
      submittedAt: status === "Draft" ? undefined : `${prDate}T11:00:00.000Z`,
      decidedAt: decided ? `${decided}T14:30:00.000Z` : undefined,
      approver: decided ? (approvers.find((a) => a.unitCode === unit.code) ?? pick(rng, approvers)).name : undefined,
      approverComment: decided
        ? status === "Approved"
          ? "Reviewed and approved for central procurement."
          : status === "Rejected"
            ? "Budget not available for this period."
            : "Specification incomplete — please resubmit."
        : undefined,
    });
  });

  return prs.sort((a, b) => (a.prDate < b.prDate ? 1 : -1));
}

/* ── Consolidations & purchase orders ─────────────────────────────────────── */

export const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" }).replace(" ", "-");

/** Roll approved PR lines up per item — the core Phase-1 control. */
export function buildConsolidationLines(prs: CpsPr[], items: CpsItem[]): CpsConsolidationLine[] {
  const byItem = new Map<string, CpsConsolidationLine & { units: Set<string> }>();
  for (const pr of prs) {
    for (const line of pr.lines) {
      const item = items.find((i) => i.uic === line.uic);
      const entry =
        byItem.get(line.uic) ??
        {
          id: `cl-${line.uic}`,
          uic: line.uic,
          description: item?.description ?? line.description,
          uom: item?.uom ?? line.uom,
          demandQty: 0,
          unitCount: 0,
          prCount: 0,
          prNos: [] as string[],
          allocations: [],
          units: new Set<string>(),
        };
      entry.demandQty += line.qty;
      if (!entry.prNos.includes(pr.prNo)) entry.prNos.push(pr.prNo);
      entry.units.add(pr.unitCode);
      byItem.set(line.uic, entry);
    }
  }
  return [...byItem.values()]
    .map(({ units, ...line }) => ({ ...line, unitCount: units.size, prCount: line.prNos.length }))
    .sort((a, b) => b.demandQty - a.demandQty);
}

function seedConsolidations(prs: CpsPr[], items: CpsItem[], suppliers: CpsSupplier[]) {
  const rng = makeRng(hashString("bay-cps-dc"));
  const today = todayISO();
  const approved = prs.filter((p) => p.status === "Approved");
  /** The oldest 52 approved requisitions have already been through central
   *  consolidation; the remainder is the live unprocessed backlog. */
  const consumed = [...approved].sort((a, b) => (a.prDate < b.prDate ? -1 : 1)).slice(0, 52);

  const buckets = new Map<string, CpsPr[]>();
  for (const pr of consumed) {
    const key = monthLabel(pr.prDate);
    buckets.set(key, [...(buckets.get(key) ?? []), pr]);
  }

  const consolidations: CpsConsolidation[] = [];
  const consumedMap = new Map<string, string>();
  let seq = 30;

  for (const [period, bucket] of buckets) {
    seq += 1;
    const dcNo = `DC-${today.slice(0, 4)}-${pad(seq, 5)}`;
    const lines = buildConsolidationLines(bucket, items).map((line) => {
      const item = items.find((i) => i.uic === line.uic);
      const rate = item?.indicativeRate ?? 500;
      const panel = suppliers.filter((s) => s.status === "Active");
      const split = line.demandQty > 40 && chance(rng, 0.55) ? 2 : 1;
      const first = split === 2 ? Math.round(line.demandQty * 0.6) : line.demandQty;
      const picked: CpsSupplier[] = [];
      while (picked.length < split) {
        const s = pick(rng, panel);
        if (!picked.includes(s)) picked.push(s);
      }
      const allocations = picked.map((s, idx) => ({
        id: `${dcNo}-${line.uic}-${idx}`,
        supplierCode: s.code,
        qty: idx === 0 ? first : line.demandQty - first,
        unitPrice: Math.round(rate * (0.94 + rng() * 0.14)),
      }));
      return { ...line, allocations };
    });

    const confirmedAt = addDays(bucket[bucket.length - 1].prDate, 4);
    consolidations.push({
      id: `dc-${seq}`,
      dcNo,
      period,
      category: "All",
      status: "Confirmed",
      createdAt: `${confirmedAt}T10:00:00.000Z`,
      confirmedAt: `${confirmedAt}T16:00:00.000Z`,
      lines,
      sourcePrNos: bucket.map((p) => p.prNo),
    });
    for (const pr of bucket) consumedMap.set(pr.prNo, dcNo);
  }

  return { consolidations, consumedMap };
}

function seedPos(consolidations: CpsConsolidation[], items: CpsItem[], suppliers: CpsSupplier[]): CpsPo[] {
  const rng = makeRng(hashString("bay-cps-po"));
  const pos: CpsPo[] = [];
  let seq = 0;

  for (const dc of consolidations) {
    const bySupplier = new Map<string, CpsPoLine[]>();
    for (const line of dc.lines) {
      for (const alloc of line.allocations) {
        const item = items.find((i) => i.uic === line.uic);
        bySupplier.set(alloc.supplierCode, [
          ...(bySupplier.get(alloc.supplierCode) ?? []),
          {
            id: `${dc.dcNo}-${alloc.supplierCode}-${line.uic}`,
            uic: line.uic,
            description: line.description,
            qty: alloc.qty,
            uom: item?.uom ?? line.uom,
            unitPrice: alloc.unitPrice,
          },
        ]);
      }
    }
    for (const [supplierCode, lines] of bySupplier) {
      seq += 1;
      const supplier = suppliers.find((s) => s.code === supplierCode);
      const poDate = (dc.confirmedAt ?? dc.createdAt).slice(0, 10);
      const status: CpsPo["status"] = chance(rng, 0.86) ? "Released" : "Pending Approval";
      pos.push({
        id: `po-${seq}`,
        poNo: `PO-${poDate.slice(0, 4)}-${pad(seq, 5)}`,
        dcNo: dc.dcNo,
        supplierCode,
        poDate,
        requiredDate: addDays(poDate, intBetween(rng, 10, 30)),
        paymentTerm: supplier?.paymentTerm ?? "30 Days",
        currency: "BDT",
        status,
        remarks: "As per negotiated terms",
        lines,
        createdAt: `${poDate}T12:00:00.000Z`,
        releasedAt: status === "Released" ? `${addDays(poDate, 1)}T10:00:00.000Z` : undefined,
      });
    }
  }
  return pos.sort((a, b) => (a.poDate < b.poDate ? 1 : -1));
}

/* ── The complete seeded state ────────────────────────────────────────────── */

export function seedCpsState(): CpsState {
  const units = seedUnits();
  const users = seedUsers();
  const items = seedItems();
  const suppliers = seedSuppliers();
  const prs = seedPrs(units, users, items);
  const { consolidations, consumedMap } = seedConsolidations(prs, items, suppliers);
  const stamped = prs.map((pr) =>
    consumedMap.has(pr.prNo) ? { ...pr, consolidatedIn: consumedMap.get(pr.prNo) } : pr,
  );
  const pos = seedPos(consolidations, items, suppliers);

  return {
    units,
    users,
    items,
    suppliers,
    prs: stamped,
    consolidations,
    pos,
    audit: [],
    role: "Admin",
    actor: "System Administrator",
  };
}

/** Next document number in a `PREFIX-YYYY-000000` series. */
export const nextSequence = (existing: string[], prefix: string, year: string, width: number) => {
  const nums = existing
    .filter((v) => v.startsWith(`${prefix}-${year}-`))
    .map((v) => Number(v.slice(`${prefix}-${year}-`.length)))
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${year}-${pad(next, width)}`;
};

export type ItemCategoryFilter = ItemCategory | "All";
