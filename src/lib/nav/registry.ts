import type { DatasetKey, LeafKind, LeafLocation, NavGroup, NavLeaf, NavModule } from "./types";

export const slugify = (label: string) =>
  label
    .toLowerCase()
    .replace(/[()./]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Leaf factory — keeps the tree below readable. */
const L = (
  label: string,
  kind: LeafKind,
  dataset: DatasetKey,
  extra?: Partial<Omit<NavLeaf, "label" | "kind" | "dataset">>,
): NavLeaf => ({ slug: slugify(label), label, kind, dataset, ...extra });

const G = (code: string, label: string, icon: string, leaves: NavLeaf[]): NavGroup => ({
  code,
  label,
  icon,
  slug: slugify(label.replace(/&/g, "and")),
  leaves,
});

/* ══════════════════════════════════════════════════════════════════════════
   01 · PURCHASE MANAGEMENT
   ══════════════════════════════════════════════════════════════════════════ */

const purchase: NavModule = {
  slug: "purchase",
  code: "01",
  label: "Purchase Management",
  short: "Purchase",
  icon: "ShoppingCart",
  accent: "brand",
  groups: [
    G("01", "Purchase Control Tower", "Radar", [
      L("Purchase Dashboard", "dashboard", "spend", { hint: "Live procurement pulse across every unit" }),
      L("Procurement Overview", "analytics", "spend", { hint: "Spend, cycle time and coverage at a glance" }),
      L("Pending PR", "list", "pr", { filter: { field: "status", value: "Pending" }, hint: "Requisitions awaiting action" }),
      L("Pending Approval", "approval", "approval", { filter: { field: "status", value: "Pending" }, hint: "Documents parked in the approval chain" }),
      L("RFQ Status", "status", "rfq", { hint: "Where every RFQ stands right now" }),
      L("Quotation Status", "status", "quotation", { hint: "Received, evaluated and expired quotations" }),
      L("TCO Status", "status", "tco", { hint: "Total-cost evaluations in flight" }),
      L("Supplier Selection Status", "status", "supplier", { hint: "Selection decisions by stage" }),
      L("PO Status", "status", "po", { hint: "Purchase orders by lifecycle stage" }),
      L("Procurement KPI", "analytics", "spend", { hint: "Savings, cycle time, on-time delivery, compliance" }),
    ]),
    G("02", "Purchase Requisition (PR)", "FileText", [
      L("Create PR", "form", "pr", { hint: "Raise a multi-line requisition for approval" }),
      L("Unit-wise PR", "report", "pr", { hint: "Requisition volume and value by business unit" }),
      L("Item-wise Requirement", "report", "pr", { hint: "Aggregated item demand from open requisitions" }),
      L("PR Approval", "approval", "pr", { hint: "Approve, hold or return requisitions" }),
      L("PR Status", "status", "pr", { hint: "Full requisition register with live status" }),
      L("PR Attachment", "document", "pr", { hint: "Specifications, drawings and supporting files" }),
      L("PR History", "list", "pr", { hint: "Closed and archived requisitions" }),
    ]),
    G("03", "Approval & DOA", "ShieldCheck", [
      L("Unit Finance Approval", "approval", "approval", { hint: "Budget check at unit finance" }),
      L("Unit Head Approval", "approval", "approval", { hint: "Operational sign-off by unit head" }),
      L("Central Procurement Approval", "approval", "approval", { hint: "Central category team review" }),
      L("CSCO Approval", "approval", "approval", { hint: "Final authority above threshold" }),
      L("Approval Matrix", "master", "approval", { hint: "Who approves what, at which value band" }),
      L("Delegation of Authority (DOA)", "master", "approval", { hint: "Temporary and standing delegations" }),
      L("Approval Audit Trail", "list", "approval", { hint: "Immutable log of every approval action" }),
    ]),
    G("04", "Demand Consolidation", "Layers", [
      L("Unit Demand", "list", "demand", { hint: "Raw demand submitted per unit" }),
      L("Item-wise Demand", "report", "demand", { hint: "Demand rolled up by item code" }),
      L("Demand Aggregation", "analytics", "demand", { hint: "Merge duplicate demand into buy-ready volume" }),
      L("Group-wide Demand", "report", "demand", { hint: "Consolidated group position" }),
      L("Consolidated Requirement", "list", "demand", { hint: "Approved consolidated buy plan" }),
      L("Demand History", "list", "demand", { hint: "Historical demand for trend and forecast" }),
    ]),
    G("05", "RFQ Management", "Send", [
      L("RFQ Creation", "form", "rfq", { hint: "Build an RFQ from consolidated demand" }),
      L("RFQ Preparation", "list", "rfq", { filter: { field: "status", value: "Draft" }, hint: "Drafts being prepared for issue" }),
      L("Supplier Selection", "list", "supplier", { hint: "Shortlist suppliers to invite" }),
      L("RFQ Invitation", "list", "rfq", { filter: { field: "status", value: "Invited" }, hint: "Issued invitations and acknowledgements" }),
      L("System-generated RFQ Link", "document", "rfq", { hint: "Secure supplier portal links and expiry" }),
      L("Supplier RFQ Response", "list", "quotation", { hint: "Responses received against each RFQ" }),
      L("Structured Quote Capture", "form", "quotation", { hint: "Capture quotes into a comparable structure" }),
      L("RFQ Closing", "list", "rfq", { filter: { field: "status", value: "Closed" }, hint: "Closed events ready for evaluation" }),
      L("RFQ Tracking", "status", "rfq", { hint: "Timeline and response rate per RFQ" }),
    ]),
    G("06", "Supplier Quotation", "Quote", [
      L("Supplier Quotation", "list", "quotation", { hint: "Every quotation received" }),
      L("Quotation Capture", "form", "quotation", { hint: "Enter a quotation line by line" }),
      L("Price", "report", "quotation", { section: "Quotation Attributes", hint: "Unit price spread across suppliers" }),
      L("Quantity", "report", "quotation", { section: "Quotation Attributes", hint: "Offered quantity versus requirement" }),
      L("Specification", "document", "quotation", { section: "Quotation Attributes", hint: "Technical compliance against spec" }),
      L("Delivery", "report", "quotation", { section: "Quotation Attributes", hint: "Lead time and delivery commitment" }),
      L("Terms", "document", "quotation", { section: "Quotation Attributes", hint: "Payment, warranty and incoterms" }),
      L("Quotation Comparison", "analytics", "quotation", { hint: "Side-by-side comparative statement" }),
      L("Quotation Evaluation", "approval", "quotation", { hint: "Score and qualify each offer" }),
      L("Quotation History", "list", "quotation", { hint: "Archived quotations and price history" }),
    ]),
    G("07", "TCO Evaluation", "Calculator", [
      L("TCO Calculation", "form", "tco", { hint: "Landed cost model per supplier offer" }),
      L("Price Evaluation", "report", "tco", { section: "Cost Components", hint: "Base price normalised per unit" }),
      L("Freight Evaluation", "report", "tco", { section: "Cost Components", hint: "Inbound freight and handling" }),
      L("Duty Evaluation", "report", "tco", { section: "Cost Components", hint: "Duty, tax and clearance charges" }),
      L("Payment Terms", "report", "tco", { section: "Cost Components", hint: "Cost of credit across offers" }),
      L("Quality Risk", "analytics", "tco", { section: "Cost Components", hint: "Expected rejection and rework cost" }),
      L("Supplier Score", "analytics", "supplier", { hint: "Weighted commercial and technical score" }),
      L("Supplier Comparison", "analytics", "tco", { hint: "Full TCO comparison matrix" }),
      L("TCO Recommendation", "approval", "tco", { hint: "Recommended award with justification" }),
    ]),
    G("08", "Supplier Selection", "Award", [
      L("Supplier Evaluation", "analytics", "supplier", { hint: "Technical and commercial evaluation" }),
      L("Supplier Ranking", "report", "supplier", { hint: "Ranked shortlist by weighted score" }),
      L("Supplier Selection", "approval", "supplier", { hint: "Record the selection decision" }),
      L("TCO-based Selection", "analytics", "tco", { hint: "Award driven by lowest total cost" }),
      L("CPT Recommendation", "approval", "supplier", { hint: "Central procurement team recommendation" }),
      L("CSCO Final Approval", "approval", "supplier", { hint: "Chief supply chain officer sign-off" }),
    ]),
    G("09", "Supplier Management", "Users", [
      L("Supplier Enlistment", "form", "supplier", { section: "Onboarding", hint: "Enlist a new supplier into the vendor master" }),
      L("Supplier Application", "list", "supplier", { section: "Onboarding", hint: "Applications awaiting screening" }),
      L("Prequalification", "approval", "supplier", { section: "Onboarding", hint: "Financial and capacity prequalification" }),
      L("Technical Audit", "approval", "supplier", { section: "Audit", hint: "On-site technical capability audit" }),
      L("Compliance Audit", "approval", "supplier", { section: "Audit", hint: "Social, environmental and legal compliance" }),
      L("Document Verification", "document", "supplier", { section: "Audit", hint: "Trade licence, tax and certification checks" }),
      L("Supplier Classification", "master", "supplier", { section: "Classification", hint: "Category, risk band and criticality" }),
      L("RMS Supplier", "list", "supplier", { section: "Classification", filter: { field: "category", value: "RMS" }, hint: "Raw material suppliers" }),
      L("FGS Supplier", "list", "supplier", { section: "Classification", filter: { field: "category", value: "FGS" }, hint: "Finished goods suppliers" }),
      L("CAPEX Supplier", "list", "supplier", { section: "Classification", filter: { field: "category", value: "CAPEX" }, hint: "Capital equipment suppliers" }),
      L("Supplier Approval", "approval", "supplier", { section: "Governance", hint: "Approve suppliers into the active panel" }),
      L("Supplier Documents", "document", "supplier", { section: "Governance", hint: "Document vault with expiry tracking" }),
      L("Supplier Bank Details", "master", "supplier", { section: "Governance", hint: "Verified remittance details" }),
      L("Supplier Performance", "analytics", "supplier", { section: "Governance", hint: "Quality, delivery and responsiveness" }),
    ]),
    G("10", "Purchase Order (PO)", "ClipboardList", [
      L("PO Creation", "form", "po", { hint: "Convert an awarded offer into a purchase order" }),
      L("PO Generation", "list", "po", { filter: { field: "status", value: "Draft" }, hint: "Generated drafts pending release" }),
      L("PO Approval", "approval", "po", { hint: "Release orders to suppliers" }),
      L("Auto-generated PO", "list", "po", { hint: "Orders raised automatically from reorder rules" }),
      L("PO Email", "document", "po", { hint: "Dispatch log of order emails" }),
      L("Supplier Acknowledgement", "list", "po", { hint: "Supplier confirmation against each order" }),
      L("PO Tracking", "status", "po", { hint: "Order progress from release to receipt" }),
    ]),
    G("11", "MTR & Shipment Management", "Truck", [
      L("MTR Submission", "form", "mtr", { section: "Material Test Report", hint: "Supplier submits mill test certificates" }),
      L("MTR Document", "document", "mtr", { section: "Material Test Report", hint: "MTR document vault by heat and lot" }),
      L("MTR Review", "approval", "mtr", { section: "Material Test Report", hint: "Technical review of submitted MTR" }),
      L("MTR Verification", "approval", "mtr", { section: "Material Test Report", hint: "Verify chemistry and mechanical results" }),
      L("MTR Pass", "list", "mtr", { section: "Material Test Report", filter: { field: "result", value: "Pass" }, hint: "Cleared MTRs" }),
      L("MTR Fail", "list", "mtr", { section: "Material Test Report", filter: { field: "result", value: "Fail" }, hint: "Failed MTRs held from shipment" }),
      L("Shipment Gate", "approval", "mtr", { section: "Shipment", hint: "Gate that blocks shipment without a passed MTR" }),
      L("Shipment Approval", "approval", "mtr", { section: "Shipment", hint: "Authorise the supplier to ship" }),
      L("Shipment Tracking", "status", "mtr", { section: "Shipment", hint: "In-transit visibility to the gate" }),
    ]),
    G("12", "Purchase Reconciliation", "GitCompareArrows", [
      L("PO / GRN Reconciliation", "report", "purchaseRecon", { hint: "Ordered versus received quantity" }),
      L("PO / IQC Reconciliation", "report", "purchaseRecon", { hint: "Ordered versus accepted quantity" }),
      L("GRN / QC Reconciliation", "report", "purchaseRecon", { hint: "Received versus inspected quantity" }),
      L("PO / GRN / QC Reconciliation", "report", "purchaseRecon", { hint: "Three-way match across the chain" }),
      L("Payment Release Control", "approval", "purchaseRecon", { hint: "Release payment only on a clean match" }),
    ]),
    G("13", "Purchase Reports & Analytics", "ChartColumnBig", [
      L("Purchase Analysis", "analytics", "spend", { hint: "Volume, value and mix analysis" }),
      L("Spend Analysis", "analytics", "spend", { hint: "Spend by category, unit and supplier" }),
      L("Supplier Performance", "analytics", "supplier", { hint: "Scorecards across the active panel" }),
      L("TCO Analysis", "analytics", "tco", { hint: "Where total cost actually accumulates" }),
      L("Purchase Price Analysis", "analytics", "spend", { hint: "Price variance against baseline" }),
      L("Delivery Performance", "analytics", "po", { hint: "On-time in-full against commitments" }),
      L("Procurement KPI", "report", "spend", { hint: "KPI pack for the monthly review" }),
      L("Reporting & Analytics", "report", "spend", { hint: "Build and schedule custom reports" }),
    ]),
  ],
};

/* ══════════════════════════════════════════════════════════════════════════
   02 · INVENTORY MANAGEMENT
   ══════════════════════════════════════════════════════════════════════════ */

const inventory: NavModule = {
  slug: "inventory",
  code: "02",
  label: "Inventory Management",
  short: "Inventory",
  icon: "Boxes",
  accent: "brand",
  groups: [
    G("02.1", "Inventory Control Tower", "Radar", [
      L("Dashboard", "dashboard", "stock", { hint: "Receiving, quality and stock health in one view" }),
      L("Inventory Overview", "analytics", "stock", { hint: "Value, coverage and ageing across warehouses" }),
      L("Pending Receiving", "list", "receiving", { filter: { field: "status", value: "Pending" }, hint: "Shipments at the gate awaiting receipt" }),
      L("Pending GRN", "list", "grn", { filter: { field: "status", value: "Pending" }, hint: "Received material without a posted GRN" }),
      L("Pending IQC", "list", "iqc", { filter: { field: "status", value: "Pending" }, hint: "GRN lots waiting on inspection" }),
      L("Received Quantity", "report", "grn", { hint: "Quantity received by item and period" }),
      L("Accepted Quantity", "report", "iqc", { hint: "Quantity cleared by incoming quality" }),
      L("Rejected Quantity", "report", "iqc", { hint: "Quantity rejected and its cost impact" }),
      L("Reconciliation Status", "status", "inventoryRecon", { hint: "Three-way match position" }),
      L("Inventory KPI", "analytics", "stock", { hint: "Turns, accuracy, fill rate and ageing" }),
    ]),
    G("02.2", "Receiving Management", "PackageOpen", [
      L("Receiving Processing", "form", "receiving", { section: "Receiving Processing", hint: "Book a shipment in against its order" }),
      L("Shipment Receiving", "list", "receiving", { section: "Receiving Processing", hint: "Shipments booked at the gate" }),
      L("Receiving Verification", "approval", "receiving", { section: "Receiving Processing", hint: "Verify counts, packing and documents" }),
      L("PO Reference", "report", "receiving", { section: "Receiving Processing", hint: "Receipts traced to their purchase order" }),
      L("Supplier Reference", "report", "receiving", { section: "Receiving Processing", hint: "Receipts by supplier and challan" }),
      L("Received Quantity", "report", "receiving", { section: "Receiving Processing", hint: "Received versus dispatched quantity" }),
      L("Receiving Status", "status", "receiving", { section: "Receiving Processing", hint: "Gate to put-away progress" }),
      L("Receiving Documents", "document", "receiving", { section: "Receiving Documents", hint: "Challans, packing lists and gate passes" }),
      L("Receiving History", "list", "receiving", { section: "Receiving Documents", hint: "Closed receipts archive" }),
    ]),
    G("02.3", "GRN Management", "ScrollText", [
      L("GRN Processing", "form", "grn", { section: "GRN Processing", hint: "Post a goods receipt note" }),
      L("GRN Creation", "form", "grn", { section: "GRN Processing", hint: "Create a GRN from a verified receipt" }),
      L("PO-based GRN", "list", "grn", { section: "GRN Processing", hint: "GRNs matched to their purchase order" }),
      L("Received Quantity", "report", "grn", { section: "GRN Processing", hint: "GRN quantity against ordered quantity" }),
      L("GRN Verification", "approval", "grn", { section: "GRN Processing", hint: "Verify and post the GRN to stock" }),
      L("GRN Status", "status", "grn", { section: "GRN Processing", hint: "Draft, posted and reversed GRNs" }),
      L("GRN Document", "document", "grn", { section: "GRN Documents", hint: "Printable GRN documents" }),
      L("GRN History", "list", "grn", { section: "GRN Documents", hint: "Posted GRN archive" }),
    ]),
    G("02.4", "IQC / Incoming Quality Control", "Microscope", [
      L("IQC Inspection", "form", "iqc", { section: "IQC Inspection", hint: "Record an incoming inspection result" }),
      L("Received Quantity", "report", "iqc", { section: "IQC Inspection", hint: "Lot size presented for inspection" }),
      L("Accepted Quantity", "report", "iqc", { section: "IQC Inspection", hint: "Quantity accepted into free stock" }),
      L("Rejected Quantity", "report", "iqc", { section: "IQC Inspection", hint: "Quantity rejected at inspection" }),
      L("Defects", "analytics", "iqc", { section: "IQC Inspection", hint: "Defect pareto and root cause" }),
      L("Inspection Result", "status", "iqc", { section: "IQC Inspection", hint: "Result register by lot" }),
      L("Quality Parameters", "master", "iqc", { section: "Quality Parameters", hint: "Sampling plan and acceptance limits" }),
      L("Inspector", "master", "iqc", { section: "Quality Parameters", hint: "Inspector roster and workload" }),
      L("Inspection Date", "report", "iqc", { section: "Quality Parameters", hint: "Inspection turnaround by date" }),
      L("Quality Documents", "document", "iqc", { section: "Quality Parameters", hint: "Test reports and certificates" }),
      L("Inspection Photographs", "document", "iqc", { section: "Quality Parameters", hint: "Photographic evidence per lot" }),
      L("Accepted", "list", "iqc", { section: "IQC Decision", filter: { field: "decision", value: "Accepted" }, hint: "Lots fully accepted" }),
      L("Partially Accepted", "list", "iqc", { section: "IQC Decision", filter: { field: "decision", value: "Partially Accepted" }, hint: "Lots accepted in part" }),
      L("Rejected", "list", "iqc", { section: "IQC Decision", filter: { field: "decision", value: "Rejected" }, hint: "Lots rejected outright" }),
      L("Hold", "list", "iqc", { section: "IQC Decision", filter: { field: "decision", value: "Hold" }, hint: "Lots held pending a decision" }),
    ]),
    G("02.5", "Warehouse Management", "Warehouse", [
      L("Warehouse Master", "master", "warehouse", { section: "Warehouse Setup", hint: "Define warehouses and their attributes" }),
      L("Warehouse Type", "master", "warehouse", { section: "Warehouse Setup", hint: "Raw, finished, bonded and quarantine" }),
      L("Warehouse Location", "master", "warehouse", { section: "Warehouse Setup", hint: "Sites, buildings and zones" }),
      L("Storage Area", "master", "warehouse", { section: "Warehouse Setup", hint: "Storage areas and capacity" }),
      L("Bin / Rack / Shelf", "master", "warehouse", { section: "Warehouse Setup", hint: "Bin-level location master" }),
      L("Material Receiving", "form", "movement", { section: "Warehouse Operations", hint: "Receive material into a bin" }),
      L("Material Put-away", "form", "movement", { section: "Warehouse Operations", hint: "Direct stock to its storage location" }),
      L("Material Transfer", "form", "movement", { section: "Warehouse Operations", hint: "Move stock between locations" }),
      L("Material Picking", "form", "movement", { section: "Warehouse Operations", hint: "Pick against an issue request" }),
      L("Material Issue", "form", "movement", { section: "Warehouse Operations", hint: "Issue material to production" }),
      L("Material Return", "form", "movement", { section: "Warehouse Operations", hint: "Return unused material to store" }),
      L("Warehouse Stock", "report", "stock", { section: "Warehouse Monitoring", hint: "Stock held per warehouse" }),
      L("Location-wise Stock", "report", "stock", { section: "Warehouse Monitoring", hint: "Stock down to bin level" }),
      L("Item-wise Stock", "report", "stock", { section: "Warehouse Monitoring", hint: "Stock position per item" }),
      L("Stock Availability", "analytics", "stock", { section: "Warehouse Monitoring", hint: "Available to promise against demand" }),
      L("Stock Status", "status", "stock", { section: "Warehouse Monitoring", hint: "Free, held, quarantine and rejected" }),
    ]),
    G("02.6", "Stock Management", "Boxes", [
      L("Stock Balance", "report", "stock", { section: "Stock Control", hint: "Opening, movement and closing balance" }),
      L("Available Stock", "report", "stock", { section: "Stock Control", hint: "Unreserved stock available to issue" }),
      L("Received Stock", "report", "stock", { section: "Stock Control", hint: "Stock received in the period" }),
      L("Accepted Stock", "report", "stock", { section: "Stock Control", hint: "Quality-cleared stock" }),
      L("Rejected Stock", "report", "stock", { section: "Stock Control", hint: "Rejected stock awaiting disposal" }),
      L("Hold Stock", "report", "stock", { section: "Stock Control", hint: "Stock blocked from issue" }),
      L("Stock In", "form", "movement", { section: "Stock Movement", hint: "Post an inward movement" }),
      L("Stock Out", "form", "movement", { section: "Stock Movement", hint: "Post an outward movement" }),
      L("Stock Transfer", "form", "movement", { section: "Stock Movement", hint: "Transfer between warehouses" }),
      L("Stock Adjustment", "form", "movement", { section: "Stock Movement", hint: "Correct stock after a count" }),
      L("Stock Return", "form", "movement", { section: "Stock Movement", hint: "Return stock to the supplier" }),
      L("Stock Ledger", "list", "movement", { section: "Stock Tracking", hint: "Every movement, in posting order" }),
      L("Item-wise Stock History", "report", "movement", { section: "Stock Tracking", hint: "Movement history for one item" }),
      L("Warehouse-wise Stock History", "report", "movement", { section: "Stock Tracking", hint: "Movement history per warehouse" }),
      L("Stock Movement History", "list", "movement", { section: "Stock Tracking", hint: "Complete movement archive" }),
    ]),
    G("02.7", "PO / GRN / IQC Reconciliation", "GitCompareArrows", [
      L("PO vs GRN", "report", "inventoryRecon", { section: "Reconciliation", hint: "Ordered against received" }),
      L("PO vs IQC", "report", "inventoryRecon", { section: "Reconciliation", hint: "Ordered against accepted" }),
      L("GRN vs IQC", "report", "inventoryRecon", { section: "Reconciliation", hint: "Received against accepted" }),
      L("PO / GRN / IQC Reconciliation", "report", "inventoryRecon", { section: "Reconciliation", hint: "Full three-way match" }),
      L("Ordered Quantity", "report", "inventoryRecon", { section: "Reconciliation", hint: "Ordered quantity by line" }),
      L("Received Quantity", "report", "inventoryRecon", { section: "Reconciliation", hint: "Received quantity by line" }),
      L("Accepted Quantity", "report", "inventoryRecon", { section: "Reconciliation", hint: "Accepted quantity by line" }),
      L("Rejected Quantity", "report", "inventoryRecon", { section: "Reconciliation", hint: "Rejected quantity by line" }),
      L("Quantity Variance", "analytics", "inventoryRecon", { section: "Reconciliation", hint: "Where quantity leaks across the chain" }),
      L("Matched", "list", "inventoryRecon", { section: "Reconciliation Status", filter: { field: "status", value: "Matched" }, hint: "Clean three-way matches" }),
      L("Partially Matched", "list", "inventoryRecon", { section: "Reconciliation Status", filter: { field: "status", value: "Partially Matched" }, hint: "Matches within tolerance" }),
      L("Variance", "list", "inventoryRecon", { section: "Reconciliation Status", filter: { field: "status", value: "Variance" }, hint: "Lines outside tolerance" }),
      L("Pending Reconciliation", "list", "inventoryRecon", { section: "Reconciliation Status", filter: { field: "status", value: "Pending" }, hint: "Not yet reconciled" }),
    ]),
    G("02.8", "Inventory Reports & Analytics", "ChartColumnBig", [
      L("Inventory Overview", "report", "stock", { section: "Inventory Reports", hint: "Consolidated inventory position" }),
      L("Receiving Report", "report", "receiving", { section: "Inventory Reports", hint: "Receipts for the period" }),
      L("GRN Report", "report", "grn", { section: "Inventory Reports", hint: "GRN register with values" }),
      L("IQC Report", "report", "iqc", { section: "Inventory Reports", hint: "Inspection outcomes for the period" }),
      L("Accepted Quantity Report", "report", "iqc", { section: "Inventory Reports", hint: "Accepted volume by item" }),
      L("Rejected Quantity Report", "report", "iqc", { section: "Inventory Reports", hint: "Rejected volume by item" }),
      L("Defect Report", "analytics", "iqc", { section: "Inventory Reports", hint: "Defect categories and trend" }),
      L("Stock Report", "report", "stock", { section: "Inventory Reports", hint: "Stock on hand with valuation" }),
      L("Stock Movement Report", "report", "movement", { section: "Inventory Reports", hint: "Inward and outward movement" }),
      L("Warehouse Stock Report", "report", "stock", { section: "Inventory Reports", hint: "Stock by warehouse and zone" }),
      L("Reconciliation Report", "report", "inventoryRecon", { section: "Inventory Reports", hint: "Match position for the period" }),
      L("Inventory Performance", "analytics", "stock", { section: "Analytics", hint: "Turns, ageing and dead stock" }),
      L("Stock Availability", "analytics", "stock", { section: "Analytics", hint: "Availability against production plan" }),
      L("Receiving Performance", "analytics", "receiving", { section: "Analytics", hint: "Gate-to-GRN cycle time" }),
      L("Quality Performance", "analytics", "iqc", { section: "Analytics", hint: "Acceptance rate and first-pass yield" }),
      L("Rejection Analysis", "analytics", "iqc", { section: "Analytics", hint: "Rejection drivers by supplier" }),
      L("Inventory / Stock Analytics", "analytics", "stock", { section: "Analytics", hint: "Cross-cutting inventory analytics" }),
    ]),
  ],
};

export const MODULES: NavModule[] = [purchase, inventory];

export const DASHBOARD_HREF = "/dashboard";

/* ── Lookups ──────────────────────────────────────────────────────────────── */

export const leafHref = (m: string, g: string, l: string) => `/${m}/${g}/${l}`;

const index = new Map<string, LeafLocation>();
const flat: LeafLocation[] = [];

for (const mod of MODULES) {
  for (const group of mod.groups) {
    for (const leaf of group.leaves) {
      const href = leafHref(mod.slug, group.slug, leaf.slug);
      const loc: LeafLocation = { module: mod, group, leaf, href };
      index.set(href, loc);
      flat.push(loc);
    }
  }
}

export const ALL_LEAVES: readonly LeafLocation[] = flat;

export const findLeaf = (segments: string[]): LeafLocation | undefined =>
  index.get(`/${segments.join("/")}`);

export const findModule = (slug: string) => MODULES.find((m) => m.slug === slug);

export const LEAF_COUNT = flat.length;
