import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createCustomerViaApi,
  createItemViaApi,
  createVendorViaApi,
  readApiAuth,
} from "./_api";

const phone = { width: 390, height: 844 };

test.use({ viewport: phone, hasTouch: true });

async function expectWithinPhone(locator: Locator) {
  await expect(locator).toBeVisible();
  await expect
    .poll(() =>
      locator.evaluate((element) => {
        const { left, right } = element.getBoundingClientRect();
        return left >= -1 && right <= innerWidth + 1;
      }),
    )
    .toBe(true);
}

async function expectPageFits(page: Page) {
  const content = page.locator(".dashboard__page");
  await expect
    .poll(() => content.evaluate((element) => element.scrollWidth))
    .toBeLessThanOrEqual(phone.width);
}

function menuOption(page: Page, text: string) {
  return page
    .locator(".bp4-popover .bp4-menu-item")
    .filter({ has: page.getByText(text, { exact: true }) })
    .first();
}

test("finds a long customer name using the phone filter and opens its details", async ({
  page,
  baseURL,
}) => {
  const apiBase = process.env.PLAYWRIGHT_TEST_API_URL || baseURL!;
  const auth = readApiAuth();
  const prefix = `Mobile ${randomUUID().slice(0, 8)}`;
  const longName = `${prefix} ລູກຄ້າທົດສອບ مؤسسة الاختبار Long Customer Display Name`;
  for (let index = 1; index <= 20; index += 1) {
    await createCustomerViaApi(apiBase, auth, {
      displayName: `${prefix} ${index}`,
    });
  }
  await createCustomerViaApi(apiBase, auth, { displayName: longName });

  await page.goto("/customers");
  const table = page.locator(".bigcapital-datatable");
  const pager = page.locator(".record-pagination");
  await expectWithinPhone(pager);
  await expect(pager.getByRole("combobox", { name: "Page size" })).toHaveValue(
    "20",
  );
  const nextPage = page.waitForResponse(
    (response) => {
      const url = new URL(response.url());
      return (
        response.ok() &&
        url.pathname === "/api/customers" &&
        url.searchParams.get("page") === "2"
      );
    },
    { timeout: 10_000 },
  );
  await pager.getByRole("button", { name: "Next", exact: true }).tap();
  await nextPage;
  await expect(
    pager.getByRole("button", { name: "2", exact: true }),
  ).toBeDisabled();

  const sort = table.getByRole("button", { name: /display name/i });
  await sort.press("Enter");
  await expect(sort.locator("..")).toHaveAttribute(
    "aria-sort",
    /ascending|descending/,
  );
  await page.getByRole("button", { name: /filter|filters applied/i }).tap();
  await expectWithinPhone(page.locator(".filter-dropdown"));
  await page
    .locator(".filter-dropdown")
    .getByPlaceholder("Value")
    .first()
    .fill(longName);
  const row = page.getByTestId("customer-row").filter({ hasText: longName });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");

  await row.locator(".display_name").tap();
  const drawer = page.locator(".bp4-drawer.master-record-drawer");
  await expectWithinPhone(drawer);
  await expect(drawer.locator(".bp4-drawer-header")).toContainText(longName);
  await expect(drawer.getByRole("button", { name: "Close" })).toBeInViewport();
  await drawer.locator(".bp4-navbar button").last().tap();
  await page.getByText("Edit Opening Balance", { exact: true }).tap();
  await expectWithinPhone(
    page.locator(".bp4-dialog.dialog--customer-opening-balance"),
  );
  await expect(drawer).toBeHidden();
});

test("keeps drafts and section navigation on the phone contact forms", async ({
  page,
}) => {
  for (const [path, name] of [
    ["/customers/new", "customer"],
    ["/vendors/new", "vendor"],
  ]) {
    await page.goto(path);
    const input = page.getByTestId(`${name}-first-name-input`);
    await input.fill("Draft ທົດສອບ العربية");
    await expectWithinPhone(input);
    const form = page.locator(".master-record-form");
    const note = form.locator('[data-section-id="notes"]');
    await form.getByRole("tab", { name: "Notes", exact: true }).tap();
    await expect(
      form.getByRole("tab", { name: "Notes", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(note).toBeInViewport();
    await expectPageFits(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(input).toHaveValue("Draft ທົດສອບ العربية");
    await expect(form.locator(".master-record-form__navigation")).toHaveClass(
      /bp4-vertical/,
    );
    await page.setViewportSize(phone);
    await expect(input).toHaveValue("Draft ທົດສອບ العربية");
  }
});

test("keeps the item unit picker and the chart-of-accounts drawer on screen", async ({
  page,
}) => {
  await page.goto("/items/new");
  const fields = page.locator(".master-record-form");
  await fields.locator('input[name="name"]').fill("Synthetic phone item");
  await fields.getByRole("button", { name: "Piece", exact: true }).tap();
  const hour = menuOption(page, "Hour");
  await expectWithinPhone(hour);
  await hour.tap();
  await expect(
    fields.getByRole("button", { name: "Hour", exact: true }),
  ).toBeVisible();
  await expectPageFits(page);

  await page.goto("/accounts");
  const account = page
    .getByTestId("account-row")
    .first()
    .locator(".account_name");
  await account.press("Enter");
  const drawer = page.locator(".bp4-drawer.master-record-drawer");
  await expectWithinPhone(drawer);
  await expect(drawer.getByRole("button", { name: "Close" })).toBeInViewport();
  await drawer.getByRole("button", { name: "Edit Account", exact: true }).tap();
  await expectWithinPhone(page.locator(".bp4-dialog.dialog--account-form"));
  await expect(drawer).toBeHidden();
});

test("shows account, category and tax-rate form validation within the phone", async ({
  page,
}) => {
  for (const [path, title, selector] of [
    ["/accounts", "New Account", ".dialog--account-form"],
    ["/items/categories", "New Category", ".dialog--category-form"],
    ["/tax-rates", "New Tax Rate", ".master-record-dialog"],
  ]) {
    await page.goto(path);
    await page.getByRole("button", { name: title, exact: true }).first().tap();
    const dialog = page.locator(`.bp4-dialog${selector}`);
    await expectWithinPhone(dialog);
    await dialog.getByRole("button", { name: /^(save|submit)$/i }).tap();
    await expect(dialog).toContainText(/is a required field/i);
  }
});

test("creates, views and edits a synthetic item from the phone", async ({
  page,
}) => {
  page.setDefaultTimeout(10_000);
  const name = `Mobile service ${randomUUID().slice(0, 8)}`;
  await page.goto("/items/new");
  const form = page.locator(".master-record-form");
  await form.locator('input[name="name"]').fill(name);
  const sections = [
    ["Sales", "selling", "sellPrice", "Sales of Product Income", "25"],
    ["Purchases", "purchasing", "costPrice", "Cost of Goods Sold", "12"],
  ];
  for (const [tab, sectionId, price, account, value] of sections) {
    await form.getByRole("tab", { name: tab, exact: true }).tap();
    const section = form.locator(`[data-section-id="${sectionId}"]`);
    await section.locator(`input[name="${price}"]`).fill(value);
    const trigger = section.getByTestId(`item-${sectionId}-account`);
    if ((await trigger.innerText()).trim() !== account) {
      await trigger.tap();
      const option = menuOption(page, account);
      await expectWithinPhone(option);
      await option.tap();
    }
  }
  await form.getByRole("button", { name: "Save", exact: true }).tap();
  await expect(page).toHaveURL(/\/items\/?$/, { timeout: 15_000 });
  await page
    .locator(".bigcapital-datatable")
    .getByText(name, { exact: true })
    .tap();
  const drawer = page.locator(".bp4-drawer.master-record-drawer");
  await expectWithinPhone(drawer);
  await drawer.getByRole("button", { name: "Edit Item", exact: true }).tap();
  await expect(page).toHaveURL(/\/items\/\d+\/edit/);
  await form.locator('input[name="name"]').fill(`${name} revised`);
  await form.getByRole("button", { name: "Edit", exact: true }).tap();
  await expect(page).toHaveURL(/\/items\/?$/);
  await expect(
    page
      .locator(".bigcapital-datatable")
      .getByText(`${name} revised`, { exact: true }),
  ).toBeVisible();
});

test("creates and edits a synthetic tax-rate master from the phone", async ({
  page,
}) => {
  page.setDefaultTimeout(10_000);
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  const name = `Mobile tax ${suffix}`;
  await page.goto("/tax-rates");
  await page
    .getByRole("button", { name: "New Tax Rate", exact: true })
    .first()
    .tap();
  const dialog = page.locator(".bp4-dialog.master-record-dialog");
  await dialog.locator('input[name="name"]').fill(name);
  await dialog.locator('input[name="code"]').fill(`M${suffix}`);
  await dialog.locator('input[name="rate"]').fill("5");
  await dialog.getByRole("button", { name: "Submit", exact: true }).tap();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  const record = page
    .locator(".bigcapital-datatable")
    .getByText(name, { exact: true });
  await record.tap();
  const drawer = page.locator(".bp4-drawer.master-record-drawer");
  await expectWithinPhone(drawer);
  await drawer
    .getByRole("button", { name: "Edit Tax Rate", exact: true })
    .tap();
  const description = "Updated on a simulated phone";
  await dialog.locator('input[name="description"]').fill(description);
  await dialog.getByRole("button", { name: "Submit", exact: true }).tap();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  await record.tap();
  await expect(drawer).toContainText(description);
});

test("opens quick item creation and also picks an existing item on the phone", async ({
  page,
  baseURL,
}) => {
  const draft = "Stage Four Quick Item";
  const existing = `Existing service ${randomUUID().slice(0, 8)}`;
  await createItemViaApi(
    process.env.PLAYWRIGHT_TEST_API_URL || baseURL!,
    readApiAuth(),
    {
      name: existing,
      type: "service",
    },
  );
  await page.goto("/invoices/new");
  const item = page.getByPlaceholder("Enter an item...").first();
  await item.tap();
  await item.pressSequentially(draft);
  await page
    .getByRole("menuitem", { name: /Create.*Stage Four Quick Item/i })
    .tap();
  const drawer = page.locator(".bp4-drawer.master-record-drawer--item-create");
  await expectWithinPhone(drawer);
  await expect(drawer.locator('input[name="name"]')).toHaveValue(draft);
  await drawer.getByRole("button", { name: "Close", exact: true }).tap();
  await expect(drawer).toBeHidden();
  await expect(page).toHaveURL(/\/invoices\/new$/);

  await item.fill("");
  await item.pressSequentially(existing);
  await page.getByRole("menuitem", { name: existing, exact: true }).tap();
  await expect(page.getByPlaceholder("Enter an item...")).toHaveCount(2);
});

test("edits a vendor through the phone details drawer", async ({
  page,
  baseURL,
}) => {
  const name = `Mobile vendor ${randomUUID().slice(0, 8)}`;
  await createVendorViaApi(
    process.env.PLAYWRIGHT_TEST_API_URL || baseURL!,
    readApiAuth(),
    {
      displayName: name,
    },
  );
  await page.goto("/vendors");
  const row = page.getByTestId("vendor-row").filter({ hasText: name });
  await row.locator(".display_name").tap();
  const drawer = page.locator(".bp4-drawer.master-record-drawer");
  await expectWithinPhone(drawer);
  await drawer.getByRole("button", { name: /edit/i }).first().tap();
  const company = `Revised ${name}`;
  await page.getByTestId("vendor-company-name-input").fill(company);
  await page.getByRole("button", { name: "Edit", exact: true }).tap();
  await expect(page).toHaveURL(/\/vendors\/?$/);
  await expect(row).toContainText(company);
});
