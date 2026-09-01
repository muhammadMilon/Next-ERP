# Noor ERP — Next-ERP

A **frontend-only** ERP prototype by **Noor IT Solutions**. Three modules — the Bay Group
**Central Procurement System (BAY CPS)**, Purchase Management and Inventory Management —
**223 working screens** in total. Every form, table, filter, approval and chart behaves like the
real thing, with no backend at all.

```bash
npm install
npm run dev      # http://localhost:3000
```

Sign in with the **pre-filled** admin credentials on the login page:

| | |
|---|---|
| Email | `admin@nooritsolutions.com` |
| Password | `Admin@12345` |

---

## What makes it feel real

There is no API. Instead there is a **deterministic seeded data layer** plus a **delta store**:

- Each of the 19 datasets is generated from a seeded PRNG, so the registers look like a system
  of record and never reshuffle between reloads.
- Only your *changes* (created / edited / deleted rows) are written to `localStorage`, so the
  browser store stays tiny and **“Reset data”** on any screen restores the seed instantly.
- **Charts and KPIs are computed from the live rows.** Create a supplier and the count moves;
  approve a requisition and the stacked chart repaints; delete a row and the pareto shifts.
- Every mutation raises a `react-hot-toast` (success / error / `toast.promise` for the
  simulated round-trips) and is written to the session activity feed on the dashboard.

## Modules

| Code | Module | Sub-modules | Screens |
|---|---|---|---|
| — | Central Procurement System (BAY CPS) | 7 | 13 |
| 01 | Purchase Management | 13 | 107 |
| 02 | Inventory Management | 8 | 103 |

### Central Procurement System (Phase 1) — `/cps`

The Phase 1 prototype for Bay Group, in its own dark command shell:

**Masters** — Company Unit · Company User (with an editable access matrix) · Item Master
(Indirect & CAPEX) · Supplier Master
**Transactions** — Purchase Requisition · PR Approval · Demand Consolidation with supplier
allocation · Consolidated Purchase Order
**Plus** — management dashboard, reports (unit-wise PR, item-wise demand, supplier allocation,
PO traceability, all CSV-exportable), administration (roles, access matrix, audit trail) and the
prototype notes.

The whole flow is live, not mocked:

1. A unit user drafts a PR against the item master and submits it.
2. An approver approves, returns or rejects it — the decision, approver and comment are written
   to the audit trail.
3. Central procurement consolidates approved, **not-yet-consolidated** demand item-wise for a
   period; each line shows total demand, contributing units and a PR-count drill-down.
4. Each item is allocated across one or more suppliers. A consolidation cannot be confirmed
   until **allocated quantity equals consolidated demand** on every line.
5. A consolidated PO is raised per supplier from that allocation, previewed, submitted and
   released — and stays traceable back to its source requisitions.

Role-based access is enforced throughout: switch the acting role in the command bar (Admin ·
PR Creator · PR Approver · Central Procurement · Viewer) and the actions available change with it.

**Purchase** — Control Tower · Purchase Requisition · Approval & DOA · Demand Consolidation ·
RFQ Management · Supplier Quotation · TCO Evaluation · Supplier Selection · Supplier Management ·
Purchase Order · MTR & Shipment · Reconciliation · Reports & Analytics

**Inventory** — Control Tower · Receiving · GRN · IQC · Warehouse · Stock · PO/GRN/IQC
Reconciliation · Reports & Analytics

### Screen types

Every leaf declares a `kind`, and the generic workspace renders the right layout for it:

| Kind | What you get |
|---|---|
| `dashboard` / `analytics` | KPI row, four charts, full register |
| `report` | KPI row, three charts, register with a “Generate pack” action |
| `list` / `status` | KPI row, two charts, searchable register with CRUD |
| `form` | Full capture form with live computed totals, plus the resulting register |
| `approval` | Approval queue with inline Approve / Hold / Reject and a bulk action |
| `document` | Document vault with upload drop-zone, preview and download |
| `master` | Master-data register with CRUD |

Six screens are hand-built rather than generated: the executive **Command Center**, both
**Control Towers**, the **Quotation Comparison** statement, the **TCO Comparison** matrix, and
the **three-way match** (PO → GRN → IQC).

## Design

White surface with a teal brand ramp (`--color-brand-*`, primary `#0d9488`) and a navy command
bar (`--color-navy-*`) for the procurement shell. No light/dark toggle — the product is
light-only by design.

The categorical chart palette is fixed-order and **validated**: worst adjacent CVD ΔE 9.1 and
normal-vision ΔE 19.6 against the white chart surface. Ranked bars use a single hue (colour
follows the entity, never its rank), there are no dual-axis charts — the pareto puts cumulative
share on direct labels instead — and every chart ships a table view for the low-contrast slots.

## Deploying to Vercel

The repo is configured to deploy **as-is** — no environment variables, no build
settings to fill in.

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repository.
3. Leave every field on its default and press **Deploy**.

Vercel detects Next.js from [`vercel.json`](vercel.json), installs with `npm ci`,
runs `next build`, and serves all 229 pre-rendered pages from its CDN. Every push
to `main` redeploys; every pull request gets its own preview URL.

| Setting | Value | Where |
|---|---|---|
| Framework | Next.js | [`vercel.json`](vercel.json) |
| Node | 22 (`>=20.9.0`) | [`.nvmrc`](.nvmrc), `package.json` `engines` |
| Region | `sin1` — Singapore, closest to Bangladesh | [`vercel.json`](vercel.json) |
| Build | `next build` (auto-detected) | — |
| Environment variables | **none required** | — |

Security headers, the immutable cache rule for the brand mark and the
deployment-aware `metadataBase` (which resolves to the Vercel URL on its own)
live in [`next.config.ts`](next.config.ts) and
[`src/app/layout.tsx`](src/app/layout.tsx).

> The demo ships with `robots: { index: false }` in `src/app/layout.tsx`, since the
> admin password is printed on the login page. Remove that line if you want the
> deployment to be search-indexable.

Optional: set `NEXT_PUBLIC_SITE_URL` to a custom domain once you attach one, so
link previews use it instead of the `*.vercel.app` address.

## Project structure

```
src/
├── app/
│   ├── (app)/                    route group behind the auth shell
│   │   ├── layout.tsx            AppShell (navbar + sidebar + footer)
│   │   ├── dashboard/            executive Command Center
│   │   └── [...slug]/            every module screen, resolved from the registry
│   ├── (cps)/                    Central Procurement System, in its own shell
│   │   ├── layout.tsx            CpsShell (navy command bar + function rail)
│   │   └── cps/                  navigation · dashboard · masters · transactions · reports
│   ├── login/                    login with pre-filled admin credentials
│   ├── layout.tsx                fonts, store provider, toast host
│   └── globals.css               design tokens (brand, ink, series, status)
├── components/
│   ├── brand/Logo.tsx            Noor IT Solutions lockup (SVG monogram)
│   ├── cps/                      CpsShell + the procurement UI kit
│   ├── charts/                   palette · frame · chart primitives · plan renderer
│   ├── layout/                   Navbar · Sidebar · Footer · CommandPalette · AppShell
│   ├── ui/                       Button · Field · Modal · DataTable · StatCard · …
│   └── workspace/                PageHeader · RecordForm · InlineFormCard · DocumentVault
├── features/
│   ├── cps/                      every Central Procurement screen
│   ├── common/ModuleScreen.tsx   dispatches bespoke screens vs. the generic workspace
│   ├── purchase/                 Control Tower · Quotation CS · TCO comparison
│   └── inventory/                Control Tower · three-way match
├── lib/
│   ├── cps/                      procurement domain: types · seed · store · nav
│   ├── nav/                      the module registry — the single source of navigation truth
│   ├── data/                     reference data, dataset specs, aggregation, seeding
│   └── utils/                    formatting, PRNG, CSV export, class merge
└── store/app-store.tsx           auth, deltas, activity, notifications, preferences
```

Adding a screen means adding one line to `src/lib/nav/registry.ts` — routing, the sidebar,
the command palette, the breadcrumb and the page itself all follow from it.

## Things worth clicking

- **Central Procurement** in the sidebar — the BAY CPS prototype in its own shell
- **Ctrl / ⌘ + K** — command palette across all 223 screens
- Sidebar **filter box** — narrows the whole tree as you type
- **★ pin** in the navbar — pins the current screen to the sidebar
- **Columns** and **Export** on any register — column visibility and real CSV download
- The chart / table toggle in every chart header
- **Reset data** on any screen — restores that dataset's seed
- The **acting role** menu in the BAY CPS command bar — watch actions appear and disappear

---

`Noor ERP` · **Noor IT Solutions** · Simple, controlled, traceable
