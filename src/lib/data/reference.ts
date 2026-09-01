/** Reference master data. Every generated dataset draws from these lists so
 *  records stay internally consistent across modules. */

export const COMPANY = {
  name: "Noor IT Solutions",
  product: "Noor ERP",
  suite: "BAY CPS",
  tagline: "Simple, controlled, traceable",
  email: "admin@nooritsolutions.com",
} as const;

export const UNITS = [
  "Unit 01 — Knit Composite",
  "Unit 02 — Woven Garments",
  "Unit 03 — Sweater Division",
  "Unit 04 — Denim Washing",
  "Unit 05 — Printing & Embroidery",
  "Corporate — Head Office",
] as const;

export const SHORT_UNITS = ["Knit", "Woven", "Sweater", "Denim", "Print", "Corporate"] as const;

export const SUPPLIERS = [
  "Nitex Fabrics Ltd.",
  "Zaman Textile Mills",
  "Pacific Trims & Accessories",
  "Hangzhou Yarn Group",
  "Delta Dyestuff Co.",
  "Sun Machinery Import",
  "BD Poly Packaging",
  "Orient Threads Ltd.",
  "Meghna Chemical Works",
  "Global Spares Source",
  "Ananta Label House",
  "Shanghai Weft Trading",
  "Karnaphuli Carton Mills",
  "Unique Zipper Industries",
  "Everest Elastic Ltd.",
  "Bengal Interlining Co.",
] as const;

export const CATEGORIES = ["RMS", "FGS", "CAPEX"] as const;

export const ITEM_CATEGORIES = [
  "Fabric",
  "Trims & Accessories",
  "Dyes & Chemicals",
  "Packaging",
  "Machinery",
  "Spare Parts",
] as const;

export const ITEMS = [
  { code: "FAB-1001", name: "Single Jersey 160 GSM", category: "Fabric", uom: "KG", rate: 4.85 },
  { code: "FAB-1002", name: "Interlock 220 GSM", category: "Fabric", uom: "KG", rate: 5.40 },
  { code: "FAB-1003", name: "Twill 3/1 Cotton", category: "Fabric", uom: "YDS", rate: 2.10 },
  { code: "FAB-1004", name: "Denim 12 Oz Rigid", category: "Fabric", uom: "YDS", rate: 3.35 },
  { code: "TRM-2001", name: "Nylon Zipper #5", category: "Trims & Accessories", uom: "PCS", rate: 0.28 },
  { code: "TRM-2002", name: "Woven Main Label", category: "Trims & Accessories", uom: "PCS", rate: 0.04 },
  { code: "TRM-2003", name: "Polyester Sewing Thread", category: "Trims & Accessories", uom: "CONE", rate: 1.15 },
  { code: "TRM-2004", name: "Metal Snap Button", category: "Trims & Accessories", uom: "GRS", rate: 2.60 },
  { code: "TRM-2005", name: "Knitted Elastic 25mm", category: "Trims & Accessories", uom: "MTR", rate: 0.09 },
  { code: "DYE-3001", name: "Reactive Blue R", category: "Dyes & Chemicals", uom: "KG", rate: 12.75 },
  { code: "DYE-3002", name: "Caustic Soda Flakes", category: "Dyes & Chemicals", uom: "KG", rate: 0.72 },
  { code: "DYE-3003", name: "Softener Silicone", category: "Dyes & Chemicals", uom: "LTR", rate: 3.90 },
  { code: "PKG-4001", name: "Export Carton 5-Ply", category: "Packaging", uom: "PCS", rate: 0.86 },
  { code: "PKG-4002", name: "Poly Bag LDPE", category: "Packaging", uom: "PCS", rate: 0.03 },
  { code: "MCH-5001", name: "Single Needle Lockstitch", category: "Machinery", uom: "SET", rate: 640.0 },
  { code: "MCH-5002", name: "Overlock 5-Thread", category: "Machinery", uom: "SET", rate: 890.0 },
  { code: "SPR-6001", name: "Rotary Hook Assembly", category: "Spare Parts", uom: "PCS", rate: 18.5 },
  { code: "SPR-6002", name: "Feed Dog Set", category: "Spare Parts", uom: "SET", rate: 7.25 },
] as const;

export const WAREHOUSES = [
  { code: "WH-RM-01", name: "Raw Material Store", type: "Raw Material", location: "Kulshi, Chittagong" },
  { code: "WH-TR-02", name: "Trims & Accessories Store", type: "Raw Material", location: "Kulshi, Chittagong" },
  { code: "WH-CH-03", name: "Chemical Store", type: "Bonded", location: "Kalurghat, Chittagong" },
  { code: "WH-FG-04", name: "Finished Goods Store", type: "Finished Goods", location: "Kulshi, Chittagong" },
  { code: "WH-QR-05", name: "Quarantine Store", type: "Quarantine", location: "Kulshi, Chittagong" },
  { code: "WH-SP-06", name: "Spares & Engineering", type: "Raw Material", location: "Kalurghat, Chittagong" },
] as const;

export const ZONES = ["A", "B", "C", "D"] as const;

export const PEOPLE = [
  { name: "System Administrator", role: "Super-Admin" },
  { name: "Farhana Akter", role: "Unit Finance" },
  { name: "Rafiqul Islam", role: "Unit Head" },
  { name: "Tanvir Hossain", role: "Central Procurement" },
  { name: "Nusrat Jahan", role: "CSCO" },
  { name: "Imran Kabir", role: "Store In-charge" },
  { name: "Shirin Sultana", role: "QC Inspector" },
  { name: "Abdul Malek", role: "QC Inspector" },
  { name: "Jubayer Rahman", role: "Buyer" },
  { name: "Mahmuda Haque", role: "Category Manager" },
] as const;

export const INSPECTORS = PEOPLE.filter((p) => p.role === "QC Inspector").map((p) => p.name);

export const APPROVERS = PEOPLE.filter((p) =>
  ["Unit Finance", "Unit Head", "Central Procurement", "CSCO"].includes(p.role),
);

export const DEFECTS = [
  "Shade Variation",
  "GSM Deviation",
  "Width Shortage",
  "Fabric Hole",
  "Colour Bleeding",
  "Wrong Count",
  "Damaged Packing",
  "Short Quantity",
] as const;

export const INCOTERMS = ["FOB", "CIF", "CFR", "EXW", "DDP"] as const;
export const PAYMENT_TERMS = ["LC at Sight", "LC 60 Days", "LC 90 Days", "TT Advance", "TT 30 Days"] as const;
export const CURRENCIES = ["USD", "BDT", "CNY", "EUR"] as const;
export const PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;
export const APPROVAL_STAGES = [
  "Unit Finance",
  "Unit Head",
  "Central Procurement",
  "CSCO",
] as const;

export const DOC_TYPES = [
  "Trade Licence",
  "TIN Certificate",
  "BIN Certificate",
  "ISO 9001",
  "OEKO-TEX",
  "Bank Solvency",
  "Technical Datasheet",
  "Packing List",
  "Commercial Invoice",
  "Mill Test Report",
] as const;

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;
