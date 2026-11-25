import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createCustomerViaApi,
  createDeliveredInvoiceViaApi,
  createItemViaApi,
  createQuickInventoryAdjustmentViaApi,
  createTaxRateViaApi,
  findItemIdByName,
  readApiAuth,
  type ApiAuth,
} from "./_api";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  actionTimeout: 15_000,
});

test("keeps currency, attachment, print, and mail controls reachable on a phone", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(120_000);
  const tag = randomUUID().slice(0, 6);
  const apiBase = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const auth = readApiAuth();
  const foreign = `Stage Five USD ${tag}`;
  const customer = `Stage Five Preview ${tag}`;
  const item = `Stage Five Service ${tag}`;
  await createCustomerViaApi(apiBase, auth, {
    displayName: foreign,
    currencyCode: "USD",
  });
  const [customerRecord, itemRecord] = await Promise.all([
    createCustomerViaApi(apiBase, auth, { displayName: customer }),
    createItemViaApi(apiBase, auth, { name: item, type: "service" }),
  ]);
  const invoice = await createDeliveredInvoiceViaApi(apiBase, auth, {
    customerId: customerRecord.id,
    itemId: itemRecord.id,
    rate: 100,
  });

  await page.goto("/invoices/new");
  await useCustomer(page, page.getByTestId("invoice-customer-select"), foreign);
  const rate = page.locator('input[name="exchangeRate"]');
  await expect(rate).toBeVisible();
  expect((await rate.boundingBox())?.x).toBeGreaterThanOrEqual(0);
  await page.getByRole("button", { name: "Upload attachments" }).tap();
  const attachments = page
    .locator(".bp4-popover-content")
    .filter({ hasText: "Attach documents" });
  await expect(attachments).toBeVisible();
  expect((await attachments.boundingBox())?.width).toBeLessThanOrEqual(390);
  const file = attachments.locator('input[type="file"]');
  const [upload] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/attachments" &&
        response.request().method() === "POST",
    ),
    file.setInputFiles({
      name: "synthetic-invoice-note.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVQIHWP4DwABAQEAG7buVgAAAABJRU5ErkJggg==",
        "base64",
      ),
    }),
  ]);
  expect(
    upload.ok(),
    `Attachment upload returned ${upload.status()}`,
  ).toBeTruthy();
  await expect(
    attachments.getByText("synthetic-invoice-note.png"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await useItem(page, item);
  await postDocument(page, "/api/sale-invoices", "Save as Draft");

  await page.goto("/invoices");
  const row = page
    .getByTestId("invoice-row")
    .filter({ hasText: String(invoice.invoice_no) });
  await row.getByText(String(invoice.invoice_no), { exact: true }).tap();
  const details = page.locator(".sales-record-drawer");
  await details.getByRole("button", { name: "Print", exact: true }).tap();
  const pdf = page.getByRole("dialog", { name: "Invoice PDF Preview" });
  await expect(pdf).toBeVisible();
  await expect(pdf.locator("embed")).toBeVisible({ timeout: 20_000 });
  await expect(pdf.getByText("Preview", { exact: true })).toBeVisible();
  expect((await pdf.boundingBox())?.width).toBeLessThanOrEqual(390);
  await pdf.getByRole("button", { name: "Close", exact: true }).tap();
  await expect(pdf).toBeHidden();

  await details.getByRole("button", { name: "Send Mail", exact: true }).tap();
  const mail = page.locator(".sales-mail-layout");
  await expect(mail).toBeVisible();
  await expect(mail).toHaveCSS("flex-direction", "column");
  await expect(mail).toHaveCSS("flex-wrap", "nowrap");
  await expect(mail.getByRole("tab", { name: "PDF document" })).toBeVisible();
});

async function useCustomer(page: Page, trigger: Locator, customer: string) {
  await trigger.tap();
  await page.getByRole("menuitem", { name: new RegExp(customer) }).tap();
  await expect(trigger).toContainText(customer);
}

async function useItem(page: Page, name: string) {
  const item = page.getByPlaceholder("Enter an item...").first();
  await item.tap();
  await item.pressSequentially(name);
  await page
    .getByRole("menuitem")
    .filter({ has: page.getByText(name, { exact: true }) })
    .tap();
  await expect(page.getByPlaceholder("Enter an item...")).toHaveCount(2);
}

async function postDocument(page: Page, path: string, action: string) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === path &&
        response.request().method() === "POST",
    ),
    page.getByRole("button", { name: action, exact: true }).tap(),
  ]);
  expect(response.ok(), `${path} returned ${response.status()}`).toBeTruthy();
  return response.json();
}

async function readSalesData(apiBase: string, auth: ApiAuth, path: string) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      authorization: `Bearer ${auth.accessToken}`,
      "organization-id": auth.organizationId,
    },
  });
  expect(response.ok, `${path} returned ${response.status}`).toBeTruthy();
  return response.json();
}

type JournalLine = {
  account_name: string;
  debit: { amount: number };
  credit: { amount: number };
};

function accountTotal(
  lines: JournalLine[],
  name: RegExp,
  side: "debit" | "credit",
) {
  return lines
    .filter((line) => name.test(line.account_name))
    .reduce((sum, line) => sum + Number(line[side].amount), 0);
}

test("fits the five sales forms and preserves an invoice draft when resized", async ({
  page,
}) => {
  for (const path of [
    "/estimates/new",
    "/invoices/new",
    "/receipts/new",
    "/payment-received/new",
    "/credit-notes/new",
  ]) {
    await page.goto(path);
    const body = page.locator(".sales-form-body");
    await expect(body).toBeVisible();
    expect(
      await body.evaluate(
        (element) => element.scrollWidth - element.clientWidth,
      ),
      path,
    ).toBeLessThanOrEqual(1);
    const entries = body.locator(".items-entries-table .tbody .tr").first();
    await expect(entries).toHaveCSS("display", "grid");
    const bounds = await entries.boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 999)).toBeLessThanOrEqual(390);
  }

  await page.goto("/invoices/new");
  const reference = page.locator('input[name="referenceNo"]');
  await reference.fill("Stage 5 draft reference");
  const row = page.locator(".items-entries-table .tbody .tr").first();
  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(row).toHaveCSS("display", "flex");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(row).toHaveCSS("display", "grid");
  await expect(reference).toHaveValue("Stage 5 draft reference");

  await page.getByRole("button", { name: "Save as Draft", exact: true }).tap();
  await expect(
    page.locator(".sales-form-header .bp4-intent-danger").first(),
  ).toBeVisible();
});

test("reconciles a phone sale from estimate through payment, credit and receipt", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(240_000);
  const tag = randomUUID().slice(0, 6);
  const customer = `Stage Five Buyer ${tag}`;
  const customerSelect = page.getByRole("button", {
    name: new RegExp(`select customer account|${customer}`, "i"),
  });
  const item = `Stage Five Stock ${tag}`;
  const tax = `Stage Five VAT ${tag}`;
  const apiBase = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const auth = readApiAuth();

  await createCustomerViaApi(apiBase, auth, { displayName: customer });
  await createItemViaApi(apiBase, auth, {
    name: item,
    type: "inventory",
    sellPrice: 110,
    costPrice: 25,
  });
  const itemId = await findItemIdByName(apiBase, auth, item);
  await createQuickInventoryAdjustmentViaApi(apiBase, auth, {
    itemId,
    quantity: 10,
    cost: 25,
  });
  await createTaxRateViaApi(apiBase, auth, {
    name: tax,
    code: `S5-${tag}`,
    rate: 10,
    active: true,
  });

  await page.goto("/estimates/new");
  await useCustomer(
    page,
    page.getByTestId("estimate-customer-select"),
    customer,
  );
  await useItem(page, item);
  const estimate = await postDocument(
    page,
    "/api/sale-estimates",
    "Save as Draft",
  );
  await expect(page).toHaveURL(/\/estimates$/);
  const estimateRow = page
    .getByTestId("estimate-row")
    .filter({ hasText: String(estimate.estimate_number) });
  await estimateRow
    .getByText(String(estimate.estimate_number), { exact: true })
    .tap();
  const details = page.locator(".bp4-drawer.sales-record-drawer");
  await expect(details).toBeVisible();
  await details.getByRole("button", { name: "Convert to Invoice" }).tap();
  await expect(page).toHaveURL(/\/invoices\/new\?from_estimate_id=/);
  await expect(page.getByTestId("invoice-customer-select")).toContainText(
    customer,
  );
  await expect(page.getByPlaceholder("Enter an item...").first()).toHaveValue(
    item,
  );

  const row = page.locator(".items-entries-table .tbody .tr").first();
  const quantity = row.locator(".td-quantity input");
  await quantity.fill("2");
  await quantity.press("Tab");
  const rate = row.locator(".td-rate input");
  await rate.fill("100");
  await rate.press("Tab");
  const discount = row.locator(".td-discount input");
  await discount.fill("10");
  await discount.press("Tab");
  const taxField = row.locator(".td-taxRateId input");
  await taxField.tap();
  await taxField.pressSequentially(tax);
  await page.getByRole("menuitem", { name: new RegExp(tax) }).tap();
  const invoice = await postDocument(
    page,
    "/api/sale-invoices",
    "Save & Deliver",
  );
  expect(Number(invoice.total)).toBeCloseTo(198);
  await expect(page).toHaveURL(/\/invoices$/);

  const invoiceApi = `/api/sale-invoices/${invoice.id}`;
  expect(
    Number((await readSalesData(apiBase, auth, invoiceApi)).due_amount),
  ).toBeCloseTo(198);
  const journal = async (referenceType: string, referenceId: number) => {
    const body = await readSalesData(
      apiBase,
      auth,
      `/api/reports/transactions-by-reference?reference_type=${referenceType}&reference_id=${referenceId}&basis=accrual`,
    );
    return body.transactions as JournalLine[];
  };
  await expect
    .poll(
      async () => {
        const entries = await journal("SaleInvoice", invoice.id);
        return accountTotal(entries, /cost of goods sold/i, "debit");
      },
      { timeout: 45_000 },
    )
    .toBe(50);
  const invoiceBooks = await journal("SaleInvoice", invoice.id);
  expect(accountTotal(invoiceBooks, /receivable/i, "debit")).toBeCloseTo(198);
  expect(
    accountTotal(invoiceBooks, /sales of product income/i, "credit"),
  ).toBeCloseTo(180);
  expect(accountTotal(invoiceBooks, /tax payable/i, "credit")).toBeCloseTo(18);
  expect(accountTotal(invoiceBooks, /inventory asset/i, "credit")).toBeCloseTo(
    50,
  );

  await page.goto("/payment-received/new");
  await useCustomer(page, customerSelect, customer);
  await page.getByRole("button", { name: /select deposit account/i }).tap();
  await page.getByRole("menuitem", { name: /petty cash/i }).tap();
  const allocation = page.locator(".td-paymentAmount input");
  await expect(allocation).toBeVisible();
  const amount = page.locator('input[name="amount"]');
  await amount.fill("120");
  await amount.press("Tab");
  await expect(allocation).toHaveValue(/120/);
  const payment = await postDocument(page, "/api/payments-received", "Save");
  expect(
    Number((await readSalesData(apiBase, auth, invoiceApi)).due_amount),
  ).toBeCloseTo(78);
  const paymentBooks = await journal("PaymentReceive", payment.id);
  expect(accountTotal(paymentBooks, /petty cash/i, "debit")).toBeCloseTo(120);
  expect(accountTotal(paymentBooks, /receivable/i, "credit")).toBeCloseTo(120);

  await page.goto("/credit-notes/new");
  await useCustomer(page, customerSelect, customer);
  await useItem(page, item);
  const creditRate = page
    .locator(".items-entries-table .td-rate input")
    .first();
  await creditRate.fill("78");
  await creditRate.press("Tab");
  const credit = await postDocument(page, "/api/credit-notes", "Save & Open");
  await expect(page).toHaveURL(/\/credit-notes$/);
  await page
    .getByText(String(credit.credit_note_number), { exact: true })
    .first()
    .tap();
  const creditDetails = page.locator(".bp4-drawer.sales-record-drawer");
  await expect(creditDetails).toBeVisible();
  await creditDetails
    .getByRole("button", { name: "Reconcile with Invoices" })
    .tap();
  await page.getByRole("menuitem", { name: "Reconcile with Invoices" }).tap();
  const reconcile = page.locator(".dialog--reconcile-credit-form");
  await expect(reconcile).toBeVisible();
  const creditAmount = reconcile.locator(".td-amount input").first();
  await creditAmount.fill("78");
  await creditAmount.press("Tab");
  const [applied] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname ===
          `/api/credit-notes/${credit.id}/apply-invoices` &&
        response.request().method() === "POST",
    ),
    reconcile.getByRole("button", { name: "Save", exact: true }).tap(),
  ]);
  expect(applied.ok()).toBeTruthy();
  expect(
    Number((await readSalesData(apiBase, auth, invoiceApi)).due_amount),
  ).toBe(0);

  await page.goto("/receipts/new");
  await useCustomer(page, customerSelect, customer);
  await page.getByRole("button", { name: /select deposit account/i }).tap();
  await page.getByRole("menuitem", { name: /petty cash/i }).tap();
  await useItem(page, item);
  const receipt = await postDocument(
    page,
    "/api/sale-receipts",
    "Save & Close",
  );
  const receiptBooks = await journal("SaleReceipt", receipt.id);
  expect(accountTotal(receiptBooks, /petty cash/i, "debit")).toBeCloseTo(110);
  expect(
    accountTotal(receiptBooks, /sales of product income/i, "credit"),
  ).toBeCloseTo(110);
  await expect
    .poll(async () => {
      const stock = await readSalesData(apiBase, auth, `/api/items/${itemId}`);
      return Number(stock.quantity_on_hand);
    })
    .toBe(8);

  await page.goto(`/invoices/${invoice.id}/edit`);
  await expect(page.locator(".sales-form-header h1")).toHaveText(/AED\s*0\.00/);
  await expect(
    page.getByText("Total (AED)", { exact: true }).locator(".."),
  ).toContainText(/AED\s*198\.00/);
});
