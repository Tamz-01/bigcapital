# Conditional modules and unavailable candidates

Source registration does not establish runtime enablement or commercial entitlement. Inspect the signed-in tenant's feature metadata and review permissions when browser access is restored. Keep source availability and licensing review separate from whether a route is visible.

| Module | Source evidence | Mobile assignment and verification limit |
|---|---|---|
| Sales tax | `Features.SalesTax` gates tax-rate routes and sales-tax report; server `FeaturesConfigure.ts` defaults sales tax to true. | Masters 4, transaction controls 5/6, report 8. Tenant value unverified; defaults are not evidence of actual enablement. |
| Tracking categories | Preferences route explicitly gated by `Features.TrackingCategories`; server default false. | Settings 3, transaction selectors 5–7, report dimensions 8. Runtime unverified. |
| Branches and warehouses | Settings routes exist; activation dialogs and selectors; server defaults false. Warehouse transfer routes exist separately. | Configuration 3, transfers 7, relevant transaction/report dimensions 5–8. Do not infer every route is feature-gated just because a menu/selector is. |
| Landed costs | Global allocation dialog is wrapped in `FeatureCan`; bill detail contains a landed-cost tab; server default false; implementation under server `modules/EE/BillLandedCosts`. | Purchases 6 and inventory reconciliation in 7/9. Entitlement and tenant enablement unverified. |
| Bank feeds/sync | BankSyncing default comes from `bankfeed.enabled`; matching/categorization/rules and import UI are present. `TESTING.md` says bank connections are unconfigured. | Existing manual banking flows 7, import 8. External provider connection and callback states unverified; do not connect real banks. |
| SMS | Preferences menu gate uses `Features.SmsNotifications`; settings route and notify dialogs exist. Server default false. | Configuration 3, document dialogs 5, later support review 8. Provider delivery unconfigured/unverified; no message sent. |
| Payment methods / Stripe | Preferences setup/edit/callback, payment-method selection/share-link dialogs and `/payment/:linkId` are in source. `TESTING.md` says payment integrations unconfigured. | Configuration 3, customer-facing payment page 5, invoice preview support 8. Valid test links/provider sandbox required; no real payment is authorized by mobile work. |
| Workspace/organization management | Global drawers register create/list organizations; dialogs and alert registry reference `src/ee/workspaces`. Create/build/invite steps and switching overlay exist. `WorkspacesSidebar` is present but its use as a visible sidebar was not established. | Settings 3; shared menu/overlay integration 2. Trigger availability, organization permissions and separate licensing remain unverified. No workspace created/deleted/switched. |
| Subscription/billing | `Subscriptions/BillingPage.tsx` and plan drawer source exist. Billing menu is commented out and no billing route appears in active preferences route array. | Retain as Stage 3 source-only candidate; not confirmed enabled. Do not restore billing or change subscriptions during responsiveness work. |
| Custom views | `DashboardViewsTabs` renders dynamic saved-view tabs and links to `/custom_views/${resourceName}/new`. No matching registered page route found. | Existing tab/filter family 4, supporting-tool gap 8. Link behavior needs reproduction; no new route was implemented. |

## Constants and alternate mounts

The inventory retains every `DialogsName` (93) and `DRAWERS` (42) constant. Twelve have no matching JSX mount using that enum form: `ExchangeRateForm`, `PaymentViaVoucherForm`, `ReceiptPdfForm`, `InvoiceMail`, `EstimateMail`, `ReceiptMail`, `PaymentMail`, `ConnectBankCreditCard`, `InvoiceFormMailDeliver`, `EstimateFormMailDeliver`, `ReceiptFormMailDeliver`, and `PAYMENT_RECEIPT_CUSTOMIZE`. Literal names, another wrapper or dormant source can explain these entries; they are not declared enabled or passed. In particular, receipt PDF preview implementation is retained among inline candidates.

Inline overlay candidates can implement named registrations already in the inventory. Their separate rows prevent an inner overlay from being overlooked; they must not be added to a count of unique user screens. Page/form-level number settings, excess-payment notices, invitation result dialogs and report-filter dialogs are included.

The route arrays contain unusual item duplicate and sales/purchase conversion paths with query strings, and contact-duplicate paths with `contact_duplicate=` in the pathname. These are recorded verbatim and remain unverified. No accounting, route-matching or authentication behavior was changed.

## License inspection

The adopted checkout contains GNU AGPL version 3 in root `LICENSE` and an as-is `DISCLAIMER`. Server `modules/EE` and frontend `ee/workspaces` code are present. No additional license file was found by filename in the tracked checkout; that absence does not establish entitlement for every component or dependency. Preserve existing notices and complete the separate licensing/source-availability review before commercial launch. Stage 1 does not certify licensing or Lao regulatory compliance.
