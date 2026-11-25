import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import {
  createCustomerViaApi,
  createDeliveredInvoiceViaApi,
  createItemViaApi,
  createManualJournalViaApi,
  createOpenedBillViaApi,
  createVendorViaApi,
  fetchAccounts,
  readApiAuth,
  waitForCostCompute,
} from "./_api";
import { authCookies, signInUser } from "./_auth";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

interface JournalLine {
  account_name: string;
  debit: { amount: number | string };
  credit: { amount: number | string };
}

function posting(
  lines: JournalLine[],
  account: RegExp,
  side: "debit" | "credit",
) {
  return lines
    .filter((line) => account.test(line.account_name))
    .reduce((sum, line) => sum + Number(line[side].amount), 0);
}

async function savePayment(page: Page, endpoint: string, amount: number) {
  const input = page.locator('input[name="amount"]');
  await input.fill(String(amount));
  await input.press("Tab");
  const allocation = page.locator(".td-paymentAmount input");
  await expect(allocation).toBeVisible();
  await expect
    .poll(async () =>
      Number((await allocation.inputValue()).replaceAll(",", "")),
    )
    .toBe(amount);
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        new URL(res.url()).pathname === endpoint &&
        res.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Save", exact: true }).tap(),
  ]);
  expect(
    response.ok(),
    endpoint + " returned " + response.status(),
  ).toBeTruthy();
  return response.json();
}

test("reconciles one purchase-to-sale cycle and both settlements", async ({
  page,
  baseURL,
}, info) => {
  test.setTimeout(180_000);
  const base = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const auth = readApiAuth();
  const ref = "S9-" + randomUUID().slice(0, 8);
  const customerName = "Cycle customer " + ref;
  const vendorName = "Cycle supplier " + ref;
  const itemName = "Cycle inventory " + ref;
  const read = async (path: string) => {
    const response = await fetch(base + path, {
      headers: {
        authorization: "Bearer " + auth.accessToken,
        "organization-id": auth.organizationId,
      },
    });
    expect(response.ok, path + " returned " + response.status).toBeTruthy();
    return response.json();
  };
  const journal = async (
    reference: string,
    id: number,
  ): Promise<JournalLine[]> => {
    const query = new URLSearchParams({
      reference_type: reference,
      reference_id: String(id),
      basis: "accrual",
    });
    return (await read("/api/reports/transactions-by-reference?" + query))
      .transactions;
  };
  const [accounts, customer, vendor, item] = await Promise.all([
    fetchAccounts(base, auth),
    createCustomerViaApi(base, auth, { displayName: customerName }),
    createVendorViaApi(base, auth, { displayName: vendorName }),
    createItemViaApi(base, auth, { name: itemName, type: "inventory" }),
  ]);
  const cash = accounts.find((account) => account.name === "Petty Cash")!;
  const equity = accounts.find(
    (account) => account.name === "Opening Balance Equity",
  )!;
  await createManualJournalViaApi(base, auth, {
    referenceNo: ref,
    entries: [
      { accountId: cash.id, debit: 1500 },
      { accountId: equity.id, credit: 1500 },
    ],
  });
  const bill = await createOpenedBillViaApi(base, auth, {
    vendorId: vendor.id,
    itemId: item.id,
    billNumber: ref,
    quantity: 10,
    rate: 100,
  });
  const invoice = await createDeliveredInvoiceViaApi(base, auth, {
    customerId: customer.id,
    itemId: item.id,
    quantity: 4,
    rate: 150,
  });

  const billPath = "/api/bills/" + bill.id;
  const invoicePath = "/api/sale-invoices/" + invoice.id;
  expect(Number((await read(billPath)).due_amount)).toBe(1000);
  expect(Number((await read(invoicePath)).due_amount)).toBe(600);

  await page.goto("/payment-received/new");
  await page.getByRole("button", { name: /select customer account/i }).tap();
  await page.getByRole("menuitem", { name: new RegExp(customerName) }).tap();
  await page.getByRole("button", { name: /select deposit account/i }).tap();
  await page.getByRole("menuitem", { name: /petty cash/i }).tap();
  const collection = await savePayment(page, "/api/payments-received", 600);
  await expect(page).toHaveURL(/\/payments-received$/);

  await page.goto("/payments-made/new");
  await page.getByRole("button", { name: /select vend[eo]r account/i }).tap();
  await page.getByRole("menuitem", { name: new RegExp(vendorName) }).tap();
  await page.getByRole("button", { name: /select payment account/i }).tap();
  await page.getByRole("menuitem", { name: /petty cash/i }).tap();
  const settlement = await savePayment(page, "/api/bill-payments", 1000);
  await expect(page).toHaveURL(/\/payments-made$/);

  expect(Number((await read(invoicePath)).due_amount)).toBe(0);
  expect(Number((await read(billPath)).due_amount)).toBe(0);
  await waitForCostCompute(base, auth, 60_000);
  const valuation = await read(
    "/api/reports/inventory-valuation?as_date=" +
      new Date().toISOString().slice(0, 10),
  );
  const stock = valuation.data.items.find(
    (entry: { id: number }) => Number(entry.id) === Number(item.id),
  );
  expect([Number(stock.quantity), Number(stock.valuation)]).toEqual([6, 600]);

  const [purchaseBooks, saleBooks, collectionBooks, settlementBooks] =
    await Promise.all([
      journal("Bill", bill.id),
      journal("SaleInvoice", invoice.id),
      journal("PaymentReceive", collection.id),
      journal("BillPayment", settlement.id),
    ]);
  for (const lines of [
    purchaseBooks,
    saleBooks,
    collectionBooks,
    settlementBooks,
  ]) {
    expect(lines.length).toBeGreaterThan(1);
    const debits = posting(lines, /./, "debit");
    expect(debits).toBeGreaterThan(0);
    expect(debits).toBe(posting(lines, /./, "credit"));
  }
  expect(posting(purchaseBooks, /inventory asset/i, "debit")).toBe(1000);
  expect(posting(purchaseBooks, /accounts payable/i, "credit")).toBe(1000);
  expect(posting(saleBooks, /accounts receivable/i, "debit")).toBe(600);
  expect(posting(saleBooks, /inventory asset/i, "credit")).toBe(400);
  const revenue = posting(saleBooks, /sales of product income/i, "credit");
  const cost = posting(saleBooks, /cost of goods sold/i, "debit");
  expect([revenue, cost, revenue - cost]).toEqual([600, 400, 200]);
  expect(posting(collectionBooks, /accounts receivable/i, "credit")).toBe(600);
  expect(posting(settlementBooks, /accounts payable/i, "debit")).toBe(1000);
  expect(posting(collectionBooks, /petty cash/i, "debit")).toBe(600);
  expect(posting(settlementBooks, /petty cash/i, "credit")).toBe(1000);

  await page.goto("/financial-reports/inventory-valuation");
  const valuationRow = page
    .getByTestId(/^inventory-valuation-row--/)
    .filter({ hasText: itemName });
  await expect(valuationRow).toContainText("600.00");
  await page.screenshot({
    path: info.outputPath("stage9-inventory-cycle.png"),
  });
});

test("preserves deep links through refresh and browser history", async ({
  page,
}) => {
  const top = page.getByTestId("dashboard-topbar");
  await page.goto("/vendors/new?mobile_review=stage9#basic");
  await expect(top).toContainText("New Vendor");
  const language = page.getByRole("combobox", { name: "Display language" });
  const firstName = page.locator('input[name="firstName"]');
  const draft = "Stage 9 ລາວ العربية 123";
  await firstName.fill(draft);
  try {
    for (const [locale, direction] of [
      ["lo", "ltr"],
      ["ar", "rtl"],
    ]) {
      await language.selectOption(locale);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", direction);
      await expect(firstName).toHaveValue(draft);
      await expect(page).toHaveURL(/mobile_review=stage9#basic$/);
    }
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(firstName).toHaveValue(draft);
    await page.setViewportSize({ width: 390, height: 844 });
  } finally {
    await language.selectOption("en");
  }
  await page.reload();
  await expect(page).toHaveURL(/\/vendors\/new\?mobile_review=stage9#basic$/);
  await expect(page.locator('input[name="firstName"]')).toBeVisible();
  await page.goto("/financial-reports/general-ledger");
  await expect(top).toContainText("General Ledger");
  await page.goBack();
  await expect(page).toHaveURL(/\/vendors\/new\?mobile_review=stage9#basic$/);
  await expect(top).toContainText("New Vendor");
  await page.goForward();
  await expect(top).toContainText("General Ledger");
  await expect(page.getByTestId("financial-sheet-table")).toBeVisible();
});

test("keeps the authorization failure visible without signing the user out", async ({
  page,
}) => {
  const endpoint = /\/api\/customers(?:\?|$)/;
  await page.route(endpoint, async (route) =>
    route.fulfill({
      status: 403,
      json: { message: "Stage 9 validation: access denied" },
    }),
  );
  await page.goto("/customers");
  await expect(
    page.getByText("Stage 9 validation: access denied"),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/customers$/);
  await page.unroute(endpoint);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "New Customer" }),
  ).toBeVisible();
});

test("returns to sign-in when a protected request reports an expired session", async ({
  page,
}) => {
  await page.route(/\/api\/customers(?:\?|$)/, async (route) =>
    route.fulfill({
      status: 401,
      json: { message: "Expired session" },
    }),
  );
  await page.goto("/customers");
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 30_000 });
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test("a reviewer can see customer records but cannot create them", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const base = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const owner = readApiAuth();
  const tag = randomUUID().slice(0, 8);
  const name = "Reviewer-visible customer " + tag;
  await createCustomerViaApi(base, owner, { displayName: name });
  const ownerHeaders = {
    authorization: "Bearer " + owner.accessToken,
    "organization-id": owner.organizationId,
    "content-type": "application/json",
  };
  const role = await fetch(base + "/api/roles", {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({
      role_name: "Stage 9 reviewer " + tag,
      role_description: "Synthetic read-only customer reviewer",
      permissions: [{ subject: "Customer", ability: "View", value: true }],
    }),
  });
  expect(role.ok, "Create reviewer role status " + role.status).toBeTruthy();
  const roleId = (await role.json()).data.id;
  const credentials = {
    email: "stage9-reviewer-" + tag + "@example.test",
    firstName: "Test",
    lastName: "Reviewer",
    password: "Synthetic9!" + randomUUID(),
  };
  const invitation = await fetch(base + "/api/invite", {
    method: "PATCH",
    headers: ownerHeaders,
    body: JSON.stringify({ email: credentials.email, role_id: roleId }),
  });
  expect(
    invitation.ok,
    "Create synthetic invitation status " + invitation.status,
  ).toBeTruthy();
  const link = new URL((await invitation.json()).invitation.accept_url);
  const token = link.pathname.split("/").at(-2);
  const acceptance = await fetch(base + "/api/invite/accept/" + token, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      first_name: credentials.firstName,
      last_name: credentials.lastName,
      password: credentials.password,
    }),
  });
  expect(
    acceptance.ok,
    "Accept synthetic invitation status " + acceptance.status,
  ).toBeTruthy();
  const reviewer = await signInUser(base, credentials);
  expect(reviewer.organizationId).toBe(owner.organizationId);
  await page.context().clearCookies();
  await page
    .context()
    .addCookies(authCookies(reviewer, new URL(baseURL!).hostname));
  await page.goto("/customers");
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New Customer" })).toHaveCount(
    0,
  );
  const denied = await fetch(base + "/api/customers", {
    method: "POST",
    headers: {
      authorization: "Bearer " + reviewer.accessToken,
      "organization-id": reviewer.organizationId,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      customer_type: "business",
      display_name: "Denied synthetic customer " + tag,
      currency_code: "AED",
    }),
  });
  expect(denied.status).toBe(403);
});

test("can leave either exchange gain and loss report using mobile navigation", async ({
  page,
}) => {
  for (const slug of ["realized", "unrealized"]) {
    await page.goto("/financial-reports/" + slug + "-gain-loss");
    await expect(
      page.getByRole("button", { name: "Customize Report" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to list.", exact: true }).tap();
    await expect(page).toHaveURL(/\/financial-reports$/);
    await expect(
      page.getByRole("link", { name: "Trial Balance Sheet", exact: true }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(
      new RegExp("/financial-reports/" + slug + "-gain-loss$"),
    );
    await expect(
      page.getByRole("button", { name: "Customize Report" }),
    ).toBeVisible();
    await page.goForward();
    await expect(
      page.getByRole("link", { name: "Trial Balance Sheet", exact: true }),
    ).toBeVisible();
  }
});
