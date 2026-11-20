# Mobile support — Stage 1 map

Inspected on 15 November 2026. Source: `aee2e09d5f9a59573df69759d182e2c090cb101a`, branch `fix/lak-purchases-offline-invites`, webapp package `0.10.2`.

**Stage 1 mapping is complete, with live visual verification blocked. Mobile implementation has not started.** All declared page routes and the additional surfaces below have a stage assignment. An inventory entry is not a passing mobile test. Tenant feature enablement, reviewer permissions and screen rendering remain unverified.

## Deliverables

| File | Contents |
|---|---|
| [screen-inventory.csv](screen-inventory.csv) | 126 page-route declarations, 93 dialog constants, 42 drawer constants, 56 alert registrations, 33 inline overlay candidates and 15 supporting surfaces; 365 rows in total |
| [tab-step-inventory.csv](tab-step-inventory.csv) | 129 tab/step declarations, including customer/vendor/item forms, detail drawers, report filters, bank matching, document customization and setup/import steps |
| [layout-findings.csv](layout-findings.csv) | 374 source locations with widths, scrolling, positioning or hover behavior requiring contextual review |
| [shared-fixes.md](shared-fixes.md) | Confirmed shared source constraints, screen-specific work, and a bounded Stage 2 implementation batch |
| [test-scenarios.md](test-scenarios.md) | Synthetic fixtures, screen states, reconciliations and baseline capture plan |
| [conditional-modules.md](conditional-modules.md) | Feature gates, external integrations, workspace code and source-only candidates |
| [inventory-summary.json](inventory-summary.json) | Machine-readable counts and inspected source SHA |
| [../mobile-support-progress.md](../mobile-support-progress.md) | Continuation record, completed checks, limits and next action |

The 365 rows are a conservative source inventory, **not 365 unique enabled screens**. Constants without mounts, inline implementations of already-listed dialogs, aliases and source-only candidates are retained and identified. Dynamic saved views have tenant-dependent IDs; their shared tab family is listed rather than inventing record-specific tabs.

## Assignment

| Stage | Page/workflow ownership |
|---|---|
| 2 | Shared layout, navigation, home, login/registration/password reset/invitation/email states, notifications, global errors and search |
| 3 | Organization setup, personal preferences, company settings, users/roles, currencies, branches/warehouses configuration, transaction locks, workspace management and integration settings |
| 4 | Chart of accounts, customers, vendors, items/categories, tax-rate masters, quick-create and opening balances |
| 5 | Estimates, invoices, receipts, customer payments, customer credits/refunds/allocations, sales document customization/email and customer payment portal |
| 6 | Bills, expenses, supplier payments/credits/refunds/allocations and landed-cost allocation |
| 7 | Inventory adjustments, warehouse transfers, cash/bank transactions, matching/categorization, bank rules and journals |
| 8 | Every report, comparison/filter/drilldown/preview state, imports/exports, attachment tooling, remaining support tools and source-only link candidates |
| 9 | Revisit all entries and complete cross-screen, accounting, permission, language and device validation |

Stage 2 owns overlay **shells**. The stage of a particular dialog/drawer row owns its inner form/table and business workflow. Import routes belong to Stage 8 even when their parent module is scheduled earlier; transaction-specific previews also need review in their sales/purchase stage before the complete Stage 8 print/export review.

## Inspection method and limits

Read `AGENTS.md`, the project resources, all route arrays, outer route composition, preferences tabs, global and page/form/report overlay mounts, alert registries, feature configuration, relevant shared components and styles, and the existing test launcher. Reconciled CSV route declarations to the three route arrays plus four outer route leaves. Enumerated JSX `Tab`, `ContentTabs.Tab`, `ElementCustomize.FieldsTab` and `Stepper.Step` declarations. Scanned source for width/scroll/hover/position risks.

Static import reachability is a conservative hint: barrel exports, unused imports, feature gates and conditional rendering mean an imported component need not be visible. It is not proof a screen is enabled. Layout scan entries are review candidates; widths inside print output, media queries or unused styles must not be blindly removed. The curated findings in `shared-fixes.md` are the implementation starting point.

Routes containing query strings and duplicate/conversion paths are preserved exactly as declared. Their router matching is unverified; no route repair was performed. The default `/` route is a catch-all, so an unknown URL can display home rather than prove its intended screen exists.

## Test app status

The existing Codespace resumed after GitHub authentication. Restored port 8080 forwarding and verified **Private** visibility in the Ports panel. Inside the Codespace, `/auth/login` returned HTTP 200 and `/api/system_db` returned HTTP 200; the server container reported healthy. The Codespace checkout was clean at the inspected SHA. Free workspace space was about 2.5 GB of 32 GB (92% used).

The browser first received an HTTP response-code failure opening the app. A later app-tab action was rejected by the browser URL/security policy. No workaround was attempted. Therefore HTTP readiness and private forwarding are verified, but actual login-form rendering, authenticated desktop baselines and mobile behavior are **unverified**. No new BigCapital account, company or accounting records were created.

Forwarding was checked in the Codespace Ports panel; its screenshot is excluded from this public repository because it contains private environment metadata. Existing root `screenshots/` images are upstream illustrations and are not current baselines. Capture the current application baselines listed in `test-scenarios.md` when browser access permits, before altering presentation in Stage 2, and exclude sensitive information from any published evidence.

No application build, database migration, runtime restart or mobile source change was necessary. The running build's embedded commit was not verified; the checkout SHA alone does not prove deployed bundle provenance. Stage 1 delivers documentation and does not claim a newly deployed application version or production release.
