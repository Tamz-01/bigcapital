import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createCustomerViaApi,
  createDeliveredInvoiceViaApi,
  createItemViaApi,
  createOpenedBillViaApi,
  createVendorViaApi,
  readApiAuth,
  waitForCostCompute,
} from "./_api";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

const tag = randomUUID().slice(0, 8);
const customer = "Report Customer " + tag;
const vendor = "Report Vendor " + tag;
const item = "Report Inventory Item " + tag;
const billNumber = "RPT-" + tag;

async function assertPageFits(page: Page) {
  await expect
    .poll(() =>
      page
        .locator(".dashboard__page")
        .evaluate((element) => element.scrollWidth - element.clientWidth),
    )
    .toBeLessThanOrEqual(1);
}

async function assertTableFits(page: Page, mustScroll = false) {
  const table = page.getByTestId("financial-sheet-table");
  await expect(table).toBeVisible();
  await assertPageFits(page);
  const geometry = await table.evaluate((region) => {
    const head = region.querySelector(".thead")!;
    const body = region.querySelector(".tbody")!;
    const clippedCellWidth = (container: Element, selector: string) => {
      const rightEdge = container.getBoundingClientRect().right;
      return Math.max(
        0,
        ...Array.from(
          container.querySelectorAll(selector),
          (cell) => cell.getBoundingClientRect().right - rightEdge,
        ),
      );
    };
    return {
      scrollRange: region.scrollWidth - region.clientWidth,
      clippedHeader: clippedCellWidth(head, ".th"),
      clippedBody: clippedCellWidth(body, ".td"),
    };
  });
  expect(geometry.clippedHeader).toBeLessThanOrEqual(1);
  expect(geometry.clippedBody).toBeLessThanOrEqual(1);
  if (mustScroll) expect(geometry.scrollRange).toBeGreaterThan(0);
  return table;
}

async function swipeTable(page: Page, table: Locator) {
  const box = (await table.boundingBox())!;
  const y = Math.round(box.y + 30);
  const start = Math.round(box.x + box.width - 25);
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: start, y }],
  });
  for (let distance = 40; distance <= 240; distance += 40) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: start - distance, y }],
    });
  }
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => table.evaluate((region) => region.scrollLeft))
    .toBeGreaterThan(100);
  await assertPageFits(page);
  await client.detach();
}

test.beforeAll(async ({ baseURL }) => {
  test.setTimeout(180_000);
  const api = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const auth = readApiAuth();
  const [customerRecord, vendorRecord, itemRecord] = await Promise.all([
    createCustomerViaApi(api, auth, { displayName: customer }),
    createVendorViaApi(api, auth, { displayName: vendor }),
    createItemViaApi(api, auth, { name: item, type: "inventory" }),
  ]);
  await createOpenedBillViaApi(api, auth, {
    vendorId: vendorRecord.id,
    itemId: itemRecord.id,
    billNumber,
    rate: 40,
    quantity: 5,
  });
  await createDeliveredInvoiceViaApi(api, auth, {
    customerId: customerRecord.id,
    itemId: itemRecord.id,
    rate: 110,
    quantity: 2,
  });
  await waitForCostCompute(api, auth);
});

test("contains wide report tables and preserves accounting figures on phones", async ({
  page,
}, info) => {
  test.setTimeout(100_000);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/financial-reports");
  await page
    .getByRole("link", { name: "Trial Balance Sheet", exact: true })
    .tap();
  await expect(page.getByTestId(/^trial-balance-row--/).first()).toBeVisible();
  await assertTableFits(page, true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/financial-reports/receivable-aging-summary");
  const receivable = page
    .getByTestId(/^ar-aging-row--/)
    .filter({ hasText: customer });
  await expect(receivable).toContainText(/220\.00/);
  const aging = await assertTableFits(page, true);
  await swipeTable(page, aging);
  await page.screenshot({ path: info.outputPath("receivables-mobile.png") });

  await page.goto("/financial-reports/payable-aging-summary");
  await expect(
    page.getByTestId(/^ap-aging-row--/).filter({ hasText: vendor }),
  ).toContainText(/200\.00/);
  await assertTableFits(page, true);

  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto("/financial-reports/inventory-valuation");
  await expect(
    page.getByTestId(/^inventory-valuation-row--/).filter({ hasText: item }),
  ).toContainText(/120\.00/);
  await assertTableFits(page, true);

  await page.goto("/financial-reports/balance-sheet");
  await expect(page.getByTestId(/^balance-sheet-row--/).first()).toBeVisible();
  await assertTableFits(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/financial-reports/profit-loss-sheet");
  await expect(page.getByTestId(/^profit-loss-row--/).first()).toBeVisible();
  await assertTableFits(page);
});

test("applies date and accounting basis filters with a reachable footer", async ({
  page,
}, info) => {
  await page.goto("/financial-reports/trial-balance-sheet");
  await expect(
    page.getByTestId("financial-sheet-accounting-basis"),
  ).toContainText("Accrual");
  await page.getByRole("button", { name: "Customize Report" }).tap();
  const filter = page.getByTestId("financial-report-drawer");
  const panel = filter.getByRole("tabpanel");
  await expect(panel).toBeVisible();
  await expect
    .poll(() =>
      panel.evaluate((element) => element.scrollWidth - element.clientWidth),
    )
    .toBeLessThanOrEqual(1);
  const dates = panel.locator("select").first();
  await dates.selectOption("last_year");
  await filter.getByText("Cash", { exact: true }).tap();
  await expect(filter.getByRole("radio", { name: "Cash" })).toBeChecked();
  await page.screenshot({ path: info.outputPath("trial-balance-filters.png") });
  await filter.getByRole("button", { name: "Calculate report" }).tap();
  await expect(filter).toBeHidden();
  await expect(page).toHaveURL(/basis=cash/);
  await expect(
    page.getByTestId("financial-sheet-accounting-basis"),
  ).toContainText("Cash");
  await expect(page.getByTestId("financial-sheet-date")).toContainText(
    String(new Date().getFullYear() - 1),
  );
  await assertPageFits(page);
});

test("uses the General Ledger drilldown and downloads CSV, XLSX and PDF", async ({
  page,
}, info) => {
  test.setTimeout(100_000);
  await page.goto("/financial-reports/general-ledger");
  await expect(page.getByTestId(/^general-ledger-row--/).first()).toBeVisible();
  await assertTableFits(page, true);
  await page
    .locator('[data-testid^="general-ledger-row--"] a')
    .filter({ hasText: billNumber })
    .first()
    .tap();
  const detail = page.locator(".bp4-drawer").filter({ hasText: billNumber });
  await expect(detail).toBeVisible();
  await expect(
    detail.getByText(billNumber, { exact: true }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(detail).toBeHidden();

  for (const format of ["CSV", "XLSX"] as const) {
    await page.getByRole("button", { name: "Export", exact: true }).tap();
    const transfer = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: new RegExp("^" + format) }).tap();
    const file = await transfer;
    expect(file.suggestedFilename()).toMatch(
      new RegExp("\\." + format.toLowerCase() + "$"),
    );
    const bytes = await readFile((await file.path())!);
    if (format === "CSV") expect(bytes.toString()).toContain(billNumber);
    else expect(bytes.subarray(0, 2).toString()).toBe("PK");
  }

  await page.getByRole("button", { name: "Print", exact: true }).tap();
  const pdf = page.getByRole("dialog", { name: "General Ledger PDF Preview" });
  await expect(pdf.locator("embed")).toHaveAttribute("src", /^blob:/, {
    timeout: 30_000,
  });
  const box = (await pdf.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(391);
  await page.screenshot({ path: info.outputPath("ledger-pdf-mobile.png") });
  const transfer = page.waitForEvent("download");
  await pdf.getByRole("button", { name: "Download", exact: true }).tap();
  const file = await transfer;
  expect(file.suggestedFilename()).toBe("general-ledger.pdf");
  expect((await readFile((await file.path())!)).subarray(0, 5).toString()).toBe(
    "%PDF-",
  );
});

test("downloads the sample, imports a customer, and exports the resulting CSV", async ({
  page,
}, info) => {
  test.setTimeout(100_000);
  const name = "Imported Stage Eight " + tag;
  await page.goto("/customers/import");
  await expect(
    page.getByText("Customers Example", { exact: true }),
  ).toBeVisible();
  await assertPageFits(page);
  await page.getByRole("button", { name: "Download File" }).tap();
  const transfer = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "CSV" }).tap();
  const file = await transfer;
  expect((await readFile((await file.path())!)).toString()).toContain(
    "Display Name",
  );

  await page.locator('input[type="file"]').setInputFiles({
    name: "synthetic-customers.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Customer Type,Display Name,Currency,Active\nBusiness," +
        name +
        ",AED,T\n",
    ),
  });
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await expect(page.getByText("Sheet Column Headers").first()).toBeVisible();
  await assertPageFits(page);
  await page.screenshot({
    path: info.outputPath("customer-import-mapping.png"),
  });
  await page.getByRole("button", { name: "Next", exact: true }).tap();
  await expect(
    page.getByText(/1 of 1 Items in your file are ready/),
  ).toBeVisible();
  await assertPageFits(page);
  await page.getByRole("button", { name: "Import", exact: true }).tap();
  await expect(page).toHaveURL(/\/customers$/);
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Export", exact: true }).tap();
  const exportDialog = page.getByRole("dialog", { name: "Export Data" });
  await expect(exportDialog.getByRole("radio", { name: /^CSV/ })).toBeChecked();
  const exportFile = page.waitForEvent("download", { timeout: 20_000 });
  await exportDialog.getByRole("button", { name: "Export", exact: true }).tap();
  const exported = await exportFile;
  expect((await readFile((await exported.path())!)).toString()).toContain(name);
});

test("keeps a long attachment name and its actions inside the popover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/make-journal-entry");
  await page.getByRole("button", { name: "Upload attachments" }).tap();
  const attachments = page
    .locator(".bp4-popover-content")
    .filter({ hasText: "Attach documents" });
  const name =
    "synthetic-inventory-reconciliation-supporting-document-from-the-stage-eight-mobile-test.png";
  const upload = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/attachments" &&
      response.request().method() === "POST",
  );
  await attachments.locator('input[type="file"]').setInputFiles({
    name,
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVQIHWP4DwABAQEAG7buVgAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  expect((await upload).ok()).toBeTruthy();
  await expect(attachments.getByText(name, { exact: true })).toBeVisible();
  await expect(
    attachments.getByRole("button", { name: "View", exact: true }),
  ).toBeInViewport();
  await expect
    .poll(() =>
      attachments.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1);
});
