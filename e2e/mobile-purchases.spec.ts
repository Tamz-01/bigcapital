import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createItemViaApi,
  createTaxRateViaApi,
  createVendorViaApi,
  readApiAuth,
} from "./_api";

const forms = [
  "/bills/new",
  "/payments-made/new",
  "/vendor-credits/new",
  "/expenses/new",
];

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  actionTimeout: 15_000,
});

async function expectFits(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect
    .poll(() => locator.evaluate((node) => node.scrollWidth - node.clientWidth))
    .toBeLessThanOrEqual(1);
}

async function chooseMenuOption(page: Page, trigger: Locator, label: RegExp) {
  await trigger.tap();
  await page.getByRole("menuitem", { name: label }).tap();
}

async function fillItemEntry(
  page: Page,
  item: string,
  quantity: string,
  tax?: string,
) {
  const itemField = page.getByPlaceholder("Enter an item...").first();
  await itemField.tap();
  await itemField.pressSequentially(item);
  await page
    .getByRole("menuitem")
    .filter({ has: page.getByText(item, { exact: true }) })
    .tap();
  const row = page.locator(".items-entries-table .tbody .tr").first();
  await enter(row.locator(".td-quantity input"), quantity);
  await enter(row.locator(".td-rate input"), "100");
  if (!tax) return;
  const taxField = row.locator(".td-taxRateId input");
  await taxField.tap();
  await taxField.pressSequentially(tax);
  await page.getByRole("menuitem", { name: new RegExp(tax) }).tap();
}

async function enter(input: Locator, value: string) {
  await input.fill(value);
  await input.press("Tab");
}

async function post(page: Page, path: string, action: string) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === path &&
        response.request().method() === "POST",
    ),
    page.getByRole("button", { name: action, exact: true }).tap(),
  ]);
  expect(
    response.ok(),
    path +
      " returned " +
      response.status() +
      " " +
      (response.ok() ? "" : await response.text()),
  ).toBeTruthy();
  const body = await response.text();
  return body ? JSON.parse(body) : undefined;
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

test("fits purchase forms at phone widths and restores desktop rows without losing a draft", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const path of forms) {
    await page.goto(path);
    const body = page.locator(".purchase-form-body");
    const actions = page.locator(".purchase-form-actions");
    const row = body.locator(".tbody .tr").first();
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await expectFits(body);
      await expectFits(actions);
      await expect(row).toHaveCSS("display", "grid");
    }
    await page.setViewportSize({ width: 1280, height: 844 });
    await expect(row).toHaveCSS("display", "flex");
  }

  await page.goto("/bills/new");
  await page.setViewportSize({ width: 390, height: 844 });
  const reference = page.locator('input[name="referenceNo"]');
  await reference.fill("Stage 6 draft resize check");
  await page.setViewportSize({ width: 1280, height: 844 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(reference).toHaveValue("Stage 6 draft resize check");
  await page.getByRole("button", { name: "Save & Open", exact: true }).tap();
  await expect(
    page.locator(".purchase-form-header .bp4-intent-danger").first(),
  ).toBeVisible();
});

test("posts a mobile purchase, applies its payment and credit, and records an expense", async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(240_000);
  const tag = randomUUID().slice(0, 6);
  const vendor = "Stage Six Supplier " + tag;
  const item = "Stage Six Stock " + tag;
  const tax = "Stage Six VAT " + tag;
  const apiBase = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const auth = readApiAuth();
  const read = async (path: string) => {
    const response = await fetch(apiBase + path, {
      headers: {
        authorization: "Bearer " + auth.accessToken,
        "organization-id": auth.organizationId,
      },
    });
    expect(response.ok, path + " returned " + response.status).toBeTruthy();
    return response.json();
  };
  const journal = async (type: string, id: number): Promise<JournalLine[]> => {
    const search = new URLSearchParams({
      reference_type: type,
      reference_id: String(id),
      basis: "accrual",
    });
    return (await read("/api/reports/transactions-by-reference?" + search))
      .transactions;
  };
  const selectVendor = () =>
    chooseMenuOption(
      page,
      page.getByRole("button", { name: /select vend[eo]r account/i }),
      new RegExp(vendor),
    );

  await createVendorViaApi(apiBase, auth, { displayName: vendor });
  const stock = await createItemViaApi(apiBase, auth, {
    name: item,
    type: "inventory",
    costPrice: 100,
  });
  await createTaxRateViaApi(apiBase, auth, {
    name: tax,
    code: "S6-" + tag,
    rate: 10,
    active: true,
  });

  await page.goto("/bills/new");
  await selectVendor();
  await page.locator('input[name="billNumber"]').fill("S6-BILL-" + tag);
  await page
    .getByLabel("Amounts are")
    .selectOption({ label: "Exclusive of Tax" });
  await fillItemEntry(page, item, "2", tax);
  const entry = page.locator(".items-entries-table .tbody .tr").first();
  await entry.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("bill-mobile.png") });
  const bill = await post(page, "/api/bills", "Save & Open");
  const billPath = "/api/bills/" + bill.id;
  const due = async () => Number((await read(billPath)).due_amount);
  const quantity = async () =>
    Number((await read("/api/items/" + stock.id)).quantity_on_hand);
  expect(await due()).toBeCloseTo(220);
  await expect.poll(quantity).toBe(2);
  const billList = page.locator(".dashboard__insider--bills");
  await expectFits(billList);
  await page.getByText("S6-BILL-" + tag, { exact: true }).tap();
  const billDrawer = page.locator(".purchase-record-drawer");
  await expectFits(billDrawer);
  await billDrawer.getByRole("button", { name: /^add payment$/i }).tap();
  const quickPayment = page.getByRole("dialog", { name: "Quick Made Payment" });
  await expectFits(quickPayment);
  await quickPayment.getByRole("button", { name: "Cancel", exact: true }).tap();
  await expect(quickPayment).toBeHidden();
  const billBooks = await journal("Bill", bill.id);
  expect(accountTotal(billBooks, /accounts payable/i, "credit")).toBeCloseTo(
    220,
  );
  expect(accountTotal(billBooks, /inventory asset/i, "debit")).toBeCloseTo(200);
  expect(accountTotal(billBooks, /tax|vat/i, "debit")).toBeCloseTo(20);

  await page.goto("/payments-made/new");
  await selectVendor();
  await chooseMenuOption(
    page,
    page.getByRole("button", { name: /select payment account/i }),
    /petty cash/i,
  );
  const allocation = page
    .locator(".items-entries-table .tbody .tr")
    .filter({ hasText: "S6-BILL-" + tag });
  await expect(allocation).toBeVisible();
  await expect(allocation.locator(".td-amount")).toContainText("220");
  await enter(page.locator('input[name="amount"]'), "120");
  await expect(allocation.locator(".td-paymentAmount input")).toHaveValue(
    /120/,
  );
  const payment = await post(page, "/api/bill-payments", "Save");
  expect(await due()).toBeCloseTo(100);
  const paymentBooks = await journal("BillPayment", payment.id);
  expect(accountTotal(paymentBooks, /accounts payable/i, "debit")).toBeCloseTo(
    120,
  );
  expect(accountTotal(paymentBooks, /petty cash/i, "credit")).toBeCloseTo(120);
  await expect(page).toHaveURL(/\/payments-made$/);
  await expectFits(page.locator(".dashboard__insider--payment-mades-list"));

  await page.goto("/vendor-credits/new");
  await selectVendor();
  await fillItemEntry(page, item, "1");
  const credit = await post(page, "/api/vendor-credits", "Save & Open");
  const creditPath = "/api/vendor-credits/" + credit.id;
  expect(Number((await read(creditPath)).credits_remaining)).toBeCloseTo(100);
  await expect.poll(quantity).toBe(1);
  const creditBooks = await journal("VendorCredit", credit.id);
  expect(accountTotal(creditBooks, /accounts payable/i, "debit")).toBeCloseTo(
    100,
  );
  expect(accountTotal(creditBooks, /inventory asset/i, "credit")).toBeCloseTo(
    100,
  );
  await expect(page).toHaveURL(/\/vendor-credits$/);
  await expectFits(page.locator(".dashboard__insider--vendor-credits"));
  await page
    .getByText(String(credit.vendor_credit_number), { exact: true })
    .tap();
  const drawer = page.locator(".purchase-record-drawer");
  await expectFits(drawer);
  const applyCredit = async (amount: string) => {
    await drawer.getByRole("button", { name: "Reconcile with Bills" }).tap();
    await page.getByRole("menuitem", { name: /reconcile with bills/i }).tap();
    const reconcile = page.locator(".dialog--reconcile-vendor-credit-form");
    await expectFits(reconcile);
    const creditAllocation = reconcile
      .locator(".purchase-allocation-entries .tbody .tr")
      .filter({ hasText: "S6-BILL-" + tag });
    await enter(creditAllocation.locator(".td-amount input"), amount);
    await post(page, creditPath + "/apply-to-bills", "Save");
    await expect(reconcile).toBeHidden();
  };
  await applyCredit("80");
  await expect.poll(due).toBeCloseTo(20);
  // The outstanding tax is still payable after allocations reach the subtotal.
  await applyCredit("20");
  await expect.poll(due).toBeCloseTo(0);
  expect(Number((await read(creditPath)).credits_remaining)).toBeCloseTo(0);

  await page.goto("/bills/" + bill.id + "/edit");
  const headerDue = page.locator(
    ".purchase-form-header .page-form__big-numbers h1",
  );
  await expect(headerDue).toHaveText(/(?:^|\D)0\.00(?:\D|$)/);
  const billTotals = page.locator(".purchase-form-section .title");
  await expect(
    billTotals
      .filter({ hasText: /^Paid Amount$/ })
      .locator("..")
      .locator(".amount"),
  ).toContainText("120.00");
  await expect(
    billTotals
      .filter({ hasText: /^Applied Credit$/ })
      .locator("..")
      .locator(".amount"),
  ).toContainText("100.00");
  await page.screenshot({ path: testInfo.outputPath("bill-settled.png") });

  await page.goto("/expenses/new");
  await chooseMenuOption(
    page,
    page.getByTestId("expense-payment-account-select"),
    /petty cash/i,
  );
  await page.getByTestId("expense-reference-no-input").fill("S6-EXP-" + tag);
  const account = page.locator(".td-expenseAccountId input").first();
  await account.tap();
  await account.pressSequentially("Rent");
  await page
    .getByRole("menuitem")
    .filter({ has: page.getByText("Rent", { exact: true }) })
    .tap();
  await enter(page.getByTestId("expense-entry-amount-input").first(), "35");
  const expense = await post(page, "/api/expenses", "Save and Publish");
  const expenseBooks = await journal("Expense", expense.id);
  expect(accountTotal(expenseBooks, /rent/i, "debit")).toBeCloseTo(35);
  expect(accountTotal(expenseBooks, /petty cash/i, "credit")).toBeCloseTo(35);
  await expect(page).toHaveURL(/\/expenses$/);
  await expectFits(page.locator(".dashboard__insider--expenses"));
});

test("keeps foreign currency and a supporting document usable on a phone", async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(100_000);
  const tag = randomUUID().slice(0, 6);
  const vendor = "Stage Six USD " + tag;
  const item = "Stage Six Supplies " + tag;
  const apiBase = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const auth = readApiAuth();
  await createVendorViaApi(apiBase, auth, {
    displayName: vendor,
    currencyCode: "USD",
  });
  await createItemViaApi(apiBase, auth, {
    name: item,
    type: "service",
    costPrice: 100,
  });

  await page.goto("/bills/new");
  await chooseMenuOption(
    page,
    page.getByRole("button", { name: /select vend[eo]r account/i }),
    new RegExp(vendor),
  );
  const exchangeRate = page.locator('input[name="exchangeRate"]');
  await expect(exchangeRate).toBeVisible();
  await enter(exchangeRate, "3.67");
  await fillItemEntry(page, item, "1");

  await page.getByRole("button", { name: "Upload attachments" }).tap();
  const attachments = page
    .locator(".bp4-popover-content")
    .filter({ hasText: "Attach documents" });
  await expectFits(attachments);
  const [upload] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/attachments" &&
        response.request().method() === "POST",
    ),
    attachments.locator('input[type="file"]').setInputFiles({
      name: "synthetic-supplier-document.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVQIHWP4DwABAQEAG7buVgAAAABJRU5ErkJggg==",
        "base64",
      ),
    }),
  ]);
  expect(upload.ok()).toBeTruthy();
  await expect(
    attachments.getByText("synthetic-supplier-document.png"),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  const bill = await post(page, "/api/bills", "Save as Draft");
  expect(bill.currency_code).toBe("USD");
  expect(Number(bill.exchange_rate)).toBeCloseTo(3.67);
  await page.goto("/bills/" + bill.id + "/edit");
  await expect(exchangeRate).toHaveValue(/3\.67/);
  await page.getByRole("button", { name: "Upload attachments" }).tap();
  await expect(
    attachments.getByText("synthetic-supplier-document.png"),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("bill-attachment.png") });
});
