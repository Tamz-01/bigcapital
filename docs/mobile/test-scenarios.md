# Mobile baseline and synthetic scenarios

**Prepared, not executed.** No organization, reviewer account, invoice, bill, payment or fixture was created during Stage 1. Reuse the isolated test environment and establish demo ownership before adding fixtures. Avoid real email/SMS, bank connections or payment-provider transactions.

## Current baseline evidence

| Check | Result |
|---|---|
| Codespace resumed and current source | Verified, clean working tree at `aee2e09d5f9a59573df69759d182e2c090cb101a` before documentation |
| Port 8080 forwarding | Restored; **Private** visibility verified in Ports UI |
| Internal login endpoint | HTTP 200 from `http://127.0.0.1:8080/auth/login` |
| Internal API readiness | HTTP 200 from `http://127.0.0.1:8080/api/system_db`; server container healthy |
| Disk | Approximately 2.5 GB available, 32 GB volume, 92% used |
| Actual app browser rendering | Unverified: initial response-code failure, then browser URL/security rejection on the app-tab action |
| Authenticated desktop / tablet / phone screenshots | Not captured; blocked. The Ports screenshot is environment evidence only. |
| Physical Android / iPhone | Not tested |
| Deployed bundle SHA | Not independently verified; checkout SHA is recorded separately |

## Representative desktop captures before Stage 2

At 1280px, capture only demo data: login with the notice, dashboard with expanded/collapsed navigation, preferences/users, customer/vendor/item form, populated transaction list, invoice and bill form with line table/totals, a detail drawer plus nested dialog, bank matching aside, trial balance with filter/drilldown, PDF preview, and import mapping/results. Include empty and validation/error examples where a different layout appears. Store the route, viewport, language, source/build version and scenario beside each image. Exclude passwords, tokens, invitation links, client records and configuration values.

Do not use root `screenshots/` illustrations as evidence of the current fork. Capture a matching desktop comparison after each presentation change. Use 360, 390, 430 and 768px plus short landscape checks for simulated mobile/tablet layouts. Browser viewport simulation is not a physical-device test.

## State coverage applicable to each inventory row

| Surface | States/actions to verify in its assigned stage |
|---|---|
| Authentication | Empty and populated fields; email/password validation; password visibility; remember-me; loading; incorrect credentials; reset/invite expired or invalid; resend/email pending; focused field and submit with keyboard open; session expiry and return navigation |
| Lists | No records; populated and long names; no search/filter results; loading/API error; one/multiple selections; bulk menu; sort/filter/date/currency pickers; pagination; saved views; permissions; detail open/close; back/forward/deep-link refresh |
| Forms | New/edit/duplicate/conversion where supported; required-field errors; long/multiline mixed-language text; tab changes; select/date popovers; line add/edit/delete; discounts/taxes/currency/totals; draft preservation on language, rotate/resize and menu open/close; disabled/loading/save failure |
| Dialogs / drawers / alerts | Open/close/backdrop/Escape; title/close/footer reachability; scroll boundaries; nested overlay stacking; focus trap/return; long text; invalid/loading/error/success states; destructive actions visible but never executed on real data |
| Reports | Empty/populated; date/currency/branch/warehouse/dimensions; comparison amounts and percentages; all required columns; contained horizontal scroll; sticky heading/column overlap; drilldown; export/print/PDF and permission errors |
| Imports / attachments | Sample download; file picker; valid/invalid file; mapping; errors/results; missing required mappings; upload progress/retry; attachment preview/removal controls reachable by tap; no hidden essential actions |
| Shared chrome | Navigation/top bars/quick-new/search/user/language menu; 200% zoom; focus order/labels; English/Lao/Arabic RTL; safe areas; test notice; theme contrast; session/error toast and reconnect/loading overlays |

The CSV state column is a checklist template. Apply only relevant states and record an explicit N/A reason for non-applicable ones; it is not evidence that every state exists on every screen. `tab-step-inventory.csv` supplies actual declared tab/step IDs, including dynamic ID families. Additional data-driven views must be enumerated from the selected demo tenant when live access is available.

## Proposed reproducible demo fixtures

| Scenario | Fixture and expected accounting result |
|---|---|
| Master records | `MOBILE-TEST` prefix; LAK base; one inventory item in kg, one service, LAK customer/vendor plus USD vendor; long Lao/English names and Arabic display tests. Never translate entered values. Record initial balances first. |
| Purchase → sale → collection/payment | No opening stock. Buy 10 kg at LAK 100,000/kg on credit, no tax/discount: inventory Dr 1,000,000, AP Cr 1,000,000. Sell 4 kg at LAK 150,000/kg on invoice: AR Dr 600,000, sales Cr 600,000; COGS Dr 400,000, inventory Cr 400,000. Receive 600,000 and pay supplier 1,000,000 through a funded demo bank account. Incremental AR/AP zero, remaining stock 6 kg / LAK 600,000, gross profit LAK 200,000. Reconcile payment effects against the recorded bank baseline. |
| Existing multicurrency regression | Service bill USD 10 at synthetic 22,000.125 LAK/USD: equal LAK debit/credit 220,001.25. Add EUR and CNY variants after checking supported currencies, precision and vendor selection. Record actual posted amounts; do not use these synthetic rates as market quotations. |
| Tax/discount/rounding | Separate fixture with explicitly selected demo tax behavior, two lines including fractional quantity, discount and adjustment. Calculate expected totals independently using the configured inclusive/exclusive policy and rounding precision before posting; do not assume a statutory rate or policy. |
| Credits/refunds/allocations | Against separate small invoices/bills: partial customer/supplier payment; credit applied to remaining balance; refund where supported; excess-payment notice. Verify allocation totals never exceed available amounts and ledger/AR/AP agree. |
| Inventory/journal/bank | After a reconciled stock baseline, reduce 1 kg as a documented synthetic waste adjustment; verify quantity, valuation and offset expense. Enter a balanced LAK 50,000 transfer between two funded demo accounts. Match/import only demo bank rows; verify no duplicate posting. Warehouse transfer only if already enabled; verify total stock unchanged. |
| Reports and exports | For each fixture, compare journal/GL, trial balance, P&L, balance sheet, AR/AP and inventory valuation. Debits equal credits; assets equal liabilities plus equity; exports/drilldowns show the same values. Record opening balances and incremental effects so existing demo data cannot distort the check. |
| Language/permissions | Two reviewer accounts with distinct personal languages. Switch EN → LO → AR → EN on a form containing unsaved mixed-language names, description and reference; preserve exact URL/query/hash and values. Reload to check saved preference. Use a restricted reviewer to check denied actions without changing permission logic. |

The restaurant recipe example (10 kg raw fish → 6 kg prepared fish → portions) is a future capability investigation. This responsiveness stage does not establish assembly/recipe functionality. Use existing quantity adjustments only for their intended supported behavior, not to claim a production/recipe module.

## Recording results

For each attempted case record inventory ID, commit/build, route, account role, feature state, viewport/device, language, actions, expected and observed results, screenshot reference and pass/fail/blocked/N/A. Stage 9 revisits every inventory entry, all enabled data-driven views, complete cycles and reconciliation. Backups/restoration/upgrades remain separate required validation before commercial release; this map did not perform them.
