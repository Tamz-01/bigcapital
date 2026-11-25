import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createItemViaApi,
  createManualJournalViaApi,
  createQuickInventoryAdjustmentViaApi,
  fetchAccounts,
  readApiAuth,
  waitForCostCompute,
} from "./_api";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  actionTimeout: 12_000,
});

const today = () => new Date().toISOString().slice(0, 10);

function fixture(baseURL: string | undefined) {
  const apiBase = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const auth = readApiAuth();
  const send = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(apiBase + path, {
      ...init,
      headers: {
        authorization: "Bearer " + auth.accessToken,
        "organization-id": auth.organizationId,
        ...init.headers,
      },
    });
    const body = await response.text();
    expect(
      response.ok,
      path + " returned " + response.status + " " + (response.ok ? "" : body),
    ).toBeTruthy();
    return body ? JSON.parse(body) : undefined;
  };
  const journal = async (type: string, id: number): Promise<JournalLine[]> => {
    const query = new URLSearchParams({
      reference_type: type,
      reference_id: String(id),
      basis: "accrual",
    });
    return (await send("/api/reports/transactions-by-reference?" + query))
      .transactions;
  };
  return { apiBase, auth, send, journal };
}

type JournalLine = {
  account_name: string;
  debit: { amount: number };
  credit: { amount: number };
};

function postedAmount(
  lines: JournalLine[],
  account: string,
  side: "debit" | "credit",
) {
  return lines
    .filter((line) => line.account_name === account)
    .reduce((sum, line) => sum + Number(line[side].amount), 0);
}

async function expectFits(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect
    .poll(() => locator.evaluate((node) => node.scrollWidth - node.clientWidth))
    .toBeLessThanOrEqual(1);
}

async function enter(input: Locator, value: string) {
  await input.fill(value);
  await input.press("Tab");
}

async function chooseSuggestion(page: Page, input: Locator, text: string) {
  await input.tap();
  await input.pressSequentially(text);
  await page
    .getByRole("menuitem")
    .filter({ has: page.getByText(text, { exact: true }) })
    .tap();
}

async function postViaButton(page: Page, path: string, button: Locator) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === path &&
        response.request().method() === "POST",
    ),
    button.tap(),
  ]);
  const body = await response.text();
  expect(
    response.ok(),
    path + " returned " + response.status() + " " + (response.ok() ? "" : body),
  ).toBeTruthy();
  return body ? JSON.parse(body) : undefined;
}

test("fits inventory, journal and banking entry points on phones and restores journal columns on desktop", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const screens = [
    ["/make-journal-entry", ".accounting-form-body"],
    ["/manual-journals", ".dashboard__insider--manual-journals"],
    ["/inventory-adjustments", ".dashboard__insider--inventory_adjustments"],
    ["/cashflow-accounts", ".dashboard__insider--cashflow-accounts"],
    ["/warehouses-transfers/new", ".page-form--warehouse-transfer"],
    ["/warehouses-transfers", ".dashboard__insider--warehouse-transfers-list"],
  ];
  for (const [path, scope] of screens) {
    await page.goto(path);
    for (const width of [320, 390, 430, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await expectFits(page.locator(scope));
      if (
        path === "/make-journal-entry" ||
        path === "/warehouses-transfers/new"
      ) {
        await expect(
          page.locator(".accounting-entry-table .tbody .tr").first(),
        ).toHaveCSS("display", width < 768 ? "grid" : "flex");
      }
    }
  }

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/bank-rules");
  await page.getByRole("button", { name: "New Bank Rule" }).first().tap();
  const rule = page.locator(".dialog--bank-rule");
  await expectFits(rule);
  await rule.getByRole("button", { name: "Add Condition" }).tap();
  await expectFits(rule.locator(".bank-rule-condition").last());
});

test("posts a touch stock adjustment and reconciles the quantity, valuation, and ledger", async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(150_000);
  const { apiBase, auth, send, journal } = fixture(baseURL);
  const tag = randomUUID().slice(0, 6);
  const name = "Stage Seven Stock " + tag;
  const item = await createItemViaApi(apiBase, auth, {
    name,
    type: "inventory",
    costPrice: 25,
  });
  await createQuickInventoryAdjustmentViaApi(apiBase, auth, {
    itemId: item.id,
    quantity: 6,
    cost: 25,
  });
  const valuation = async () => {
    const report = await send(
      "/api/reports/inventory-valuation?as_date=" + today(),
    );
    const row = report.data.items.find(
      (entry: { id: number }) => Number(entry.id) === Number(item.id),
    );
    return row ? [Number(row.quantity), Number(row.valuation)] : [];
  };
  await expect.poll(valuation, { timeout: 45_000 }).toEqual([6, 150]);

  await page.goto("/items");
  await page.getByText(name, { exact: true }).tap();
  const drawer = page.locator(".master-record-drawer:visible");
  await drawer.getByRole("button", { name: "Make an adjustment" }).tap();
  await page.getByRole("menuitem", { name: "Make an adjustment" }).tap();
  const dialog = page.locator(".dialog--adjustment-item");
  await expectFits(dialog);
  await dialog.getByLabel(/adjustment type/i).selectOption("decrement");
  await enter(dialog.locator('input[name="quantity"]'), "1");
  await chooseSuggestion(
    page,
    dialog.getByPlaceholder("Select adjustment account"),
    "Cost of Goods Sold",
  );
  await dialog.locator('input[name="referenceNo"]').fill("S7-WASTE-" + tag);
  await dialog
    .locator('textarea[name="reason"]')
    .fill("Synthetic waste adjustment");
  const projected = dialog.locator('input[name="newQuantity"]');
  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(projected).toHaveValue(/^5(?:\.0+)?$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(projected).toHaveValue(/^5(?:\.0+)?$/);
  await dialog.screenshot({
    path: testInfo.outputPath("stock-adjustment.png"),
  });
  const adjustment = await postViaButton(
    page,
    "/api/inventory-adjustments/quick",
    dialog.getByRole("button", { name: "Make an adjustment" }),
  );
  await expect.poll(valuation, { timeout: 45_000 }).toEqual([5, 125]);
  const stock = await send("/api/items/" + item.id);
  expect(Number(stock.quantity_on_hand)).toBe(5);
  const postedCost = async () => {
    const ledger = await journal("InventoryAdjustment", adjustment.id);
    return [
      postedAmount(ledger, "Inventory Asset", "credit"),
      postedAmount(ledger, "Cost of Goods Sold", "debit"),
    ];
  };
  await expect.poll(postedCost, { timeout: 45_000 }).toEqual([25, 25]);

  // Recompute the same day's costs and verify the adjustment is not posted twice.
  const anotherItem = await createItemViaApi(apiBase, auth, {
    name: "Stage Seven Recompute " + tag,
    type: "inventory",
  });
  await createQuickInventoryAdjustmentViaApi(apiBase, auth, {
    itemId: anotherItem.id,
    quantity: 1,
    cost: 10,
  });
  await waitForCostCompute(apiBase, auth, 45_000);
  expect(await postedCost()).toEqual([25, 25]);
});

test("rejects an unbalanced journal and posts matching bank and cash entries on a phone", async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(120_000);
  const { apiBase, auth, journal } = fixture(baseURL);
  const accounts = await fetchAccounts(apiBase, auth);
  const cash = accounts.find((account) => account.name === "Petty Cash")!;
  const equity = accounts.find(
    (account) => account.name === "Opening Balance Equity",
  )!;
  await createManualJournalViaApi(apiBase, auth, {
    entries: [
      { accountId: cash.id, debit: 100 },
      { accountId: equity.id, credit: 100 },
    ],
  });

  await page.goto("/make-journal-entry");
  const form = page.locator(".accounting-form");
  await expectFits(form);
  const rows = form.locator(".accounting-entry-table .tbody .tr");
  const debit = rows.nth(0);
  const credit = rows.nth(1);
  await chooseSuggestion(
    page,
    debit.locator(".td-accountId input"),
    "Bank Account",
  );
  await enter(debit.locator(".td-debit input"), "50");
  await chooseSuggestion(
    page,
    credit.locator(".td-accountId input"),
    "Petty Cash",
  );
  await enter(credit.locator(".td-credit input"), "49");
  const publish = form.getByRole("button", { name: "Save and Publish" });
  await publish.tap();
  await expect(
    page.getByText("Should total of credit and debit be equal."),
  ).toBeVisible();
  await enter(credit.locator(".td-credit input"), "50");
  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(debit.locator(".td-debit input")).toHaveValue(/50/);
  await expect(credit.locator(".td-credit input")).toHaveValue(/50/);
  await page.setViewportSize({ width: 390, height: 844 });
  await credit.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("balanced-journal.png") });
  const document = await postViaButton(page, "/api/manual-journals", publish);
  await expect(page).toHaveURL(/\/manual-journals$/);
  const ledger = await journal("Journal", document.id);
  expect(postedAmount(ledger, "Bank Account", "debit")).toBeCloseTo(50);
  expect(postedAmount(ledger, "Petty Cash", "credit")).toBeCloseTo(50);
});

test("records a cash transfer and matches a synthetic bank statement row without posting twice", async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(160_000);
  const { apiBase, auth, send, journal } = fixture(baseURL);
  const accounts = await fetchAccounts(apiBase, auth);
  const bank = accounts.find(
    (account) => account.name === "Saving Bank Account",
  )!;
  const cash = accounts.find((account) => account.name === "Petty Cash")!;
  const equity = accounts.find(
    (account) => account.name === "Opening Balance Equity",
  )!;
  const tag = randomUUID().slice(0, 6);
  const statement = "Synthetic Stage 7 bank statement " + tag;
  const path = "/cashflow-accounts/" + bank.id + "/transactions";
  const summary = () => send("/api/banking/accounts/" + bank.id + "/summary");
  const balance = async () =>
    Number((await send("/api/accounts/" + bank.id)).amount);
  await createManualJournalViaApi(apiBase, auth, {
    entries: [
      { accountId: cash.id, debit: 100 },
      { accountId: equity.id, credit: 100 },
    ],
  });
  const openingBalance = await balance();

  await page.goto(path);
  await expectFits(page.locator(".bank-transactions-summary"));
  await expectFits(page.locator(".bank-transactions-views"));
  await page.getByRole("button", { name: "Add Money In" }).tap();
  await page.getByRole("menuitem", { name: "Transfer from account" }).tap();
  const dialog = page.locator(".dialog--money-in");
  await expectFits(dialog);
  await enter(dialog.locator('input[name="amount"]'), "35");
  await chooseSuggestion(
    page,
    dialog.getByPlaceholder("Select Account", { exact: true }),
    "Petty Cash",
  );
  await dialog.locator('input[name="referenceNo"]').fill("S7-BANK-" + tag);
  const transfer = await postViaButton(
    page,
    "/api/banking/transactions",
    dialog.getByRole("button", { name: "Save & Publish", exact: true }),
  );
  await expect(dialog).toBeHidden();
  await expect.poll(balance).toBeCloseTo(openingBalance + 35);
  const before = await journal("CashflowTransaction", transfer.id);
  expect(postedAmount(before, "Saving Bank Account", "debit")).toBeCloseTo(35);
  expect(postedAmount(before, "Petty Cash", "credit")).toBeCloseTo(35);

  const upload = new FormData();
  upload.set("resource", "uncategorized_bank_transaction");
  upload.set("params", JSON.stringify({ accountId: bank.id }));
  upload.set(
    "file",
    new Blob(
      ["Date,Description,Amount\n" + today() + "," + statement + ",35\n"],
      { type: "text/csv" },
    ),
    "stage7-bank-statement.csv",
  );
  const file = await send("/api/import/file", { method: "POST", body: upload });
  const importPath = "/api/import/" + file.import.import_id;
  await send(importPath + "/mapping", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mapping: [
        { from: "Date", to: "date", group: "" },
        { from: "Description", to: "description", group: "" },
        { from: "Amount", to: "amount", group: "" },
      ],
    }),
  });
  await send(importPath + "/import", { method: "POST" });
  await expect
    .poll(async () => (await summary()).total_uncategorized_transactions, {
      timeout: 30_000,
    })
    .toBe(1);

  await page.goto(path + "?filter=uncategorized");
  await page.getByText(statement, { exact: true }).tap();
  const panel = page.locator(".bank-matching-panel");
  await expectFits(panel);
  await expect(
    page.getByRole("region", { name: "Bank transaction matching" }),
  ).toBeFocused();
  await panel.getByRole("tab", { name: "Matching Transaction" }).tap();
  const candidate = panel.getByRole("checkbox", {
    name: /transfer from account/i,
  });
  await expect(candidate).toBeVisible();
  if (await candidate.isChecked()) await candidate.uncheck();
  const match = panel.getByRole("button", { name: "Match", exact: true });
  await expect(match).toBeDisabled();
  await candidate.check();
  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(match).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(match).toBeEnabled();
  await expect(match).toBeInViewport({ ratio: 1 });
  await expect(panel.getByText(/Pending.*AED\s*0\.00/i)).toBeVisible();
  await panel.screenshot({ path: testInfo.outputPath("bank-match.png") });
  await postViaButton(page, "/api/banking/matching/match", match);
  await expect(panel).toBeHidden();
  await expect
    .poll(async () => (await summary()).total_uncategorized_transactions)
    .toBe(0);
  expect(await balance()).toBeCloseTo(openingBalance + 35);
  const after = await journal("CashflowTransaction", transfer.id);
  expect(postedAmount(after, "Saving Bank Account", "debit")).toBeCloseTo(35);
  expect(postedAmount(after, "Petty Cash", "credit")).toBeCloseTo(35);
});
