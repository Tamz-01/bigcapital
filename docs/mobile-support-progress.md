# Mobile support progress

## 15 November 2026 — Stage 1

**Completed:** source inventory, mobile risk map, shared versus screen-specific fix assignments, synthetic scenarios and practical Stage 2 batch. **Blocked:** actual application browser rendering and current desktop visual baselines. **Not started:** mobile implementation and accounting/device tests.

| Stage | Status |
|---|---|
| 1 — Inspect and map | Mapping complete with verification limits documented; every declared route has an assignment; runtime-only/dynamic tenant surfaces still need confirmation |
| 2 — Foundation, login and navigation | Pending; next implementation stage |
| 3 — Organization and settings | Pending |
| 4 — Master records | Pending |
| 5 — Sales | Pending |
| 6 — Purchases and expenses | Pending |
| 7 — Inventory, banking and journals | Pending |
| 8 — Reports and supporting tools | Pending |
| 9 — Full validation | Pending |

### Source and changes

- Branch: `fix/lak-purchases-offline-invites`; existing draft PR #1 remains open and unmerged.
- Inspected source SHA: `aee2e09d5f9a59573df69759d182e2c090cb101a`.
- Codespace checkout was clean at that same SHA before this documentation work. Separate fresh inspection checkout was clean too.
- Changes are confined to `docs/mobile/` and this file. No application screen/component, calculation, authentication, permission, locale, database, configuration or launcher was edited.
- This Stage 1 documentation commit can be identified with `git log -1 --format=%H -- docs/mobile-support-progress.md`. A commit cannot embed its own SHA without changing it; the source SHA above is the audited application version, not the later documentation commit.

### Deliverables and checks

- [Stage 1 map and file index](mobile/README.md): 126 page routes, 365 inventory rows (including constants/candidates and overlapping implementations), 129 tab/step declarations, 374 layout scan locations.
- Inspected route composition, source feature gates, named and inline overlay mounts, alert registries, shared layout/interaction constraints, existing development/package instructions and test launcher.
- Inventory validation passed: route-array coverage and outer leaves, all dialog/drawer enum constants, tab/step declarations, source locations, valid stage assignments and summary counts reconcile. `git diff --cached --check` passed after normalizing CSV line endings.
- No application build or dependency install was needed for an inspection/documentation stage. No frontend, unit, accounting, integration or physical-device tests were executed, and none are reported as passed.

### Test environment

- Existing Codespace resumed through its editor after GitHub authentication.
- Port 8080 forwarding restored; **Private** visibility verified. Keep it private.
- Internal `/auth/login` HTTP 200 and `/api/system_db` HTTP 200; server container healthy.
- Approximately 2.5 GB available on 32 GB workspace (92% used). Do not auto-delete files, images or volumes.
- Browser app navigation initially failed with an HTTP response-code error; subsequent app-tab action was rejected by browser URL/security policy. No bypass attempted. Actual login form, authenticated workflows and current desktop screenshots are unverified. The Ports-panel screenshot is excluded from the public repository to avoid exposing private environment metadata.
- Running bundle commit not independently verified. No new application build/deployment; existing runtime resumed. Original Windows installation and data were untouched. No records created.

### User review and exact next action

User review pending. Read `mobile/README.md`, `mobile/shared-fixes.md` and `mobile/test-scenarios.md`; recheck current source, uncommitted work, feature/permission metadata and disk usage. Restore permitted app browser access and capture current desktop baselines before Stage 2 presentation changes. Then implement **Stage 2 only** when requested: shared responsive shell, tap navigation, top bars/overlay shells, authentication screens and readable unobstructive test notice. Check simulated sizes/languages/draft preservation, build customized source, deploy only the private test app and verify the rendered result and build version. Do not merge or release production.

## 19 November 2026 — Stage 1 closeout

Stage 1 is complete with the runtime limits below. The 126 page declarations matched the existing inventory and all 365 inventory rows retained a stage assignment. The inspected clean Codespace checkout was `0360d37778bfb9208a27a8e46b58678b0efb5c73` on `fix/lak-purchases-offline-invites`. The original audited app source `aee2e09d5f9a59573df69759d182e2c090cb101a` differs only by the Stage 1 documentation. The shallow Windows checkout and its existing changes were preserved.

- The Codespace reconnected after a reload. The editor confirmed private port 8080, the test API was healthy, and the private app rendered with an existing demo session. Workspace free space was 5.6 GB. The served main JavaScript and CSS matched the existing local build files. A build-to-commit manifest was unavailable.
- Representative desktop evidence includes expanded and collapsed dashboard navigation, the empty invoice list, blank invoice/bill and customer/vendor/item forms, trial balance filters and the item import entry. The dashboard remained 1100 CSS pixels wide at simulated widths of 360, 390, 430, 768 and 844 pixels. At 1280 pixels the app fit the viewport. The project Google Drive stage folder holds the screenshots and detailed closeout.
- The signed-in session redirected the login route to the dashboard. The fresh login form and visible test notice remain pending. Role and tenant variants, populated and record-dependent states, accounting reconciliation and physical phone tests also remain unverified. No records were saved and no app build or deployment ran.
- Next action for Stage 2 begins with a signed-out baseline in a separate test session. Then implement the shared responsive shell, tap navigation, overlays, authentication layouts and test notice. Stage 2 is pending and user review of Stage 1 is pending.

## 19 November 2026 — Stage 2

Stage 2 is implemented and deployed to the private test frontend for review. The live application source is ef33b50fc88ccf78ad8ed1bdfa4d67212b85d3d3 on fix/lak-purchases-offline-invites. The app was built using Node 18.16.1. Port 8080 served the verified Vite entry bundle and updated test-notice script.

- The compact layout reflows the dashboard, keeps shared actions within reach, preserves the desktop split pane and exposes the existing route and permission filters in tap-operated navigation drawers. Shared authentication now scrolls in short viewports. The test notice reserves space above the app.
- The frontend type check and Vite build passed. Eight focused Playwright authentication checks passed. A fresh synthetic account signed in, and the test notice dismissal and reset behavior worked. English, Lao and Arabic signed-out layouts were checked, with right-to-left direction for Arabic.
- The private browser rendered the 390px dashboard with a 40px action row and no document overflow. Manual checks covered sales, settings and quick search, Escape focus return, and a supplier draft retaining its contents and URL through menu and viewport changes. Desktop navigation remained available at 1280px.
- Standard authenticated Playwright setup was blocked while initializing a new test organization because the migration expected SALES__INVOICES. Signed-in cross-language draft preservation and account-language persistence therefore remain unverified in this run. Physical phone testing and user review are pending.
- The next stage is organization and settings. Address the test-tenant provisioning blocker before relying on the full authenticated suite. Keep the private test and production environments separate.

## 19 November 2026 — Stage 3

Organization onboarding, preferences, role permissions, and workspace controls now fit phone widths in the private test app. Setup, company defaults, and workspace creation share the English, Lao, and Arabic choices. The API accepts Lao for organization setup and settings. The exchange-rate migration now uses canonical identifiers during fresh tenant provisioning and keeps the existing decimal precision.

Seven focused Playwright checks passed. They included 390px onboarding with Lao, organization settings save and reload, the role-permission draft across phone and desktop widths, and four Stage 2 regressions. A separate 390px check switched between two synthetic workspaces in both directions and verified the active organization’s settings. The tax-rate dialog displayed required-field errors, and representative settings views fit the viewport.

The served test frontend matched the modern-browser build from `051e774b9b9bc7988a6f0bc0838a17c302f3e9f4`. The private API ran the compiled migration and locale fixes through `4935b669353659ae974d6f9257d1e4dacfc21e3e`. The full Vite build was terminated during legacy chunk rendering. The draft PR remains open. Physical phones, live invitation delivery, provider integrations, and additional restricted-role cases remain for review. Stage 4 covers master records.

## 20 November 2026 — Stage 4 master records

The private test app now has phone layouts for customer, vendor, item, item category, chart-of-accounts, and tax-rate workflows. Customer, vendor, and item forms stack fields and preserve drafts across viewport changes. Lists keep wide columns inside their own scroll area, wrap long contact names, and return to page one when a filter, saved view, or inactive toggle changes. Detail drawers and pickers fit phone widths. Item pickers support quick creation with the entered name and selection of existing items.

All 45 layout checks passed across nine routes at 360, 390, 430, 768, and 1280 CSS pixels. All eight master-record browser tests passed at 390px with touch enabled. They cover long-name search and pagination, form drafts and validation, picker and drawer actions, vendor editing, item quick creation and selection, and item and tax-rate create/edit. Customer and vendor quick-create drawers also opened and closed in separate phone checks.

The isolated test frontend serves the minified modern-browser asset `index-CrZy5vja.js`. Node 18 type checking and the scoped formatting checks passed. The test API and retained synthetic database served the checks. Physical-device and legacy-browser checks remain pending. Stage 5 covers sales workflows.

- [Stage 4 Drive evidence and report](https://drive.google.com/drive/folders/1uYn7e-cr3CicMnubCLSFYGF57LSaOj8g)
- [Draft PR #1](https://github.com/Tamz-01/bigcapital/pull/1) · [Private test app](https://studious-space-disco-gxp75xwv9rrvhw94x-8080.app.github.dev/)

## 20 November 2026 — Stage 5 mobile sales

The private test app has phone layouts for estimates, invoices, receipts, payment allocations, and credit notes. Sales forms stack their fields and show editable line cards on phones. Lists keep wide columns inside their table scrollers. Detail drawers, credit allocation, attachments, the PDF preview, and the mail composer fit narrow screens. The sales lists reuse the app-level mail drawers.

All 50 layout checks passed across ten routes at 360, 390, 430, 768, and 1280 CSS pixels. A 390px touch test converted an estimate, posted a discounted inventory invoice, recorded a partial payment, applied a credit note, and posted a sales receipt. The invoice totaled AED 198 after AED 180 net sales and AED 18 VAT. AED 120 paid plus AED 78 credited cleared it. The invoice posted AED 50 cost of goods sold against inventory. The stock movement was 10 starting units, two sold, one returned, and one sold on the receipt, leaving eight.

New and edited invoices store the discounted line subtotal and use the same taxable basis for the document and its journal. The migration preserves the tax basis of previously posted lines. Seven item-entry unit tests passed, and the migration applied to 24 synthetic test tenants. Frontend type-checking passed and the private preview serves a minified modern-browser bundle.

Five focused browser checks passed on the final preview, including both desktop edit regressions and three mobile sales workflows. The reopened invoice displayed AED 198 total and zero due. An earlier suite passed 21 of 22 checks before the first PDF render timed out. The final pass rendered the PDF and opened a single one-column mail composer.

Physical-device, legacy-browser, and live email delivery checks remain pending. The automatic exchange-rate provider is unconfigured in the test environment. Stage 6 covers purchases.

- [Stage 5 report and evidence](https://drive.google.com/drive/folders/1c42RYh1cVAsdH7_MliKlpzTpuJdKuVoh)
- [Draft PR #1](https://github.com/Tamz-01/bigcapital/pull/1) · [Private test app](https://studious-space-disco-gxp75xwv9rrvhw94x-8080.app.github.dev/)
