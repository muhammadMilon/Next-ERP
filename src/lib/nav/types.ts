/** Every leaf page is rendered from this contract — routing, search and the
 *  generic workspace all read the same registry. */
export type LeafKind =
  | "dashboard"
  | "analytics"
  | "report"
  | "list"
  | "status"
  | "form"
  | "approval"
  | "document"
  | "master";

export type DatasetKey =
  | "pr"
  | "demand"
  | "approval"
  | "rfq"
  | "quotation"
  | "tco"
  | "supplier"
  | "po"
  | "mtr"
  | "purchaseRecon"
  | "spend"
  | "receiving"
  | "grn"
  | "iqc"
  | "warehouse"
  | "stock"
  | "movement"
  | "inventoryRecon"
  | "item";

export interface NavLeaf {
  /** URL segment, unique inside its group. */
  slug: string;
  label: string;
  kind: LeafKind;
  dataset: DatasetKey;
  /** Optional caption grouping inside the sidebar (the 3rd level of the spec). */
  section?: string;
  /** Pre-applied filter, e.g. Pending PR = status "Pending". */
  filter?: { field: string; value: string };
  /** One-line page description shown under the title. */
  hint?: string;
}

export interface NavGroup {
  slug: string;
  code: string;
  label: string;
  icon: string;
  leaves: NavLeaf[];
}

export interface NavModule {
  slug: string;
  code: string;
  label: string;
  short: string;
  icon: string;
  accent: string;
  groups: NavGroup[];
}

export interface LeafLocation {
  module: NavModule;
  group: NavGroup;
  leaf: NavLeaf;
  href: string;
}
