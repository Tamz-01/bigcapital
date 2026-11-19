import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { newUnauthenticatedPage } from "./_utils";
import { signupUser } from "./_auth";

const phone = { width: 390, height: 844 };

async function choose(page: Page, trigger: string, option: RegExp) {
  await page
    .locator("form")
    .getByRole("button", { name: trigger, exact: true })
    .click();
  await page
    .locator(".bp4-popover .bp4-menu-item, .bp4-popover2 .bp4-menu-item")
    .filter({ hasText: option })
    .first()
    .click();
}

test("organization settings fit the phone and save in the test tenant", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  await page.goto("/preferences/general");
  const name = page.locator('input[name="name"]');
  const currentName = await name.inputValue();
  const draft = "Mobile settings " + randomUUID().slice(0, 8);
  const save = page.getByRole("button", { name: "Save", exact: true });
  const panel = page.locator(".preferences-page__content");
  await expect
    .poll(() => panel.evaluate((el) => el.scrollWidth))
    .toBeLessThanOrEqual(phone.width);
  const group = name.locator(
    'xpath=ancestor::*[contains(@class, "bp4-form-group")][1]',
  );
  await expect(group).toHaveCSS("flex-direction", "column");

  const saveName = async (value: string) => {
    await name.fill(value);
    const response = page.waitForResponse(
      (res) =>
        res.ok() &&
        /\/api\/organization(?:\?|$)/.test(res.url()) &&
        ["PUT", "PATCH"].includes(res.request().method()),
    );
    await save.click();
    await response;
  };
  try {
    await saveName(draft);
    await page.reload();
    await expect(name).toHaveValue(draft);
  } finally {
    await saveName(currentName);
  }
});

test("role permissions reflow while keeping the same editable checkboxes", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  await page.goto("/preferences/roles");
  const name = page.locator('input[name="roleName"]');
  await name.fill("Unsaved mobile role");
  const matrix = page.locator(".role-permission-matrix").first();
  await expect(matrix.locator("tbody tr").first()).toHaveCSS("display", "grid");
  const label = matrix.locator("tbody label.bp4-checkbox").first();
  const permission = label.getByRole("checkbox");
  const checked = await permission.isChecked();
  await label.click();
  expect(await permission.isChecked()).toBe(!checked);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(matrix.locator("tbody tr").first()).toHaveCSS(
    "display",
    "table-row",
  );
  await expect(name).toHaveValue("Unsaved mobile role");
  expect(await permission.isChecked()).toBe(!checked);
});

test("a new organization can complete onboarding from the phone browser", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(90_000);
  const id = randomUUID().slice(0, 12);
  const credentials = {
    firstName: "Mobile",
    lastName: "Reviewer",
    email: `mobile-stage3-${id}@example.test`,
    password: `Demo-${randomUUID()}`,
  };
  await signupUser(
    process.env.PLAYWRIGHT_TEST_API_URL || baseURL!,
    credentials,
  );
  const page = await newUnauthenticatedPage(browser);
  try {
    await page.setViewportSize(phone);
    await page.goto("/auth/login");
    await page.locator('input[name="crediential"]').fill(credentials.email);
    await page.locator('input[name="password"]').fill(credentials.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL("**/setup");

    const submit = page.getByRole("button", {
      name: "Save & Continue",
      exact: true,
    });
    const setup = page.locator(".setup-page");
    await expect
      .poll(() => setup.evaluate((el) => el.scrollWidth))
      .toBeLessThanOrEqual(phone.width);
    await expect(
      page.locator('.setup-page__steps [aria-current="step"]'),
    ).toBeVisible();
    await submit.click();
    await expect(page.locator("form")).toContainText(
      /organization name.*required/i,
    );
    await page.locator('input[name="name"]').fill(`Mobile onboard ${id}`);
    await choose(page, "Select Business Location...", /Laos/i);
    await choose(page, "Select Base Currency...", /\bLAK\b|Lao kip/i);
    await choose(page, "English", /ລາວ/);
    await choose(page, "Select Fiscal Year...", /January.*December/i);
    await choose(page, "Select Time Zone...", /Bangkok/i);
    await submit.click();

    const dashboard = page.getByRole("button", {
      name: /Go to dashboard|ໄປທີ່ໜ້າຫຼັກ/i,
    });
    await expect(dashboard).toBeVisible({ timeout: 55_000 });
    await expect
      .poll(() => setup.evaluate((el) => el.scrollWidth))
      .toBeLessThanOrEqual(phone.width);
    await dashboard.click();
    await expect(
      page.getByRole("combobox", { name: "Display language" }),
    ).toBeVisible();
  } finally {
    await page.context().close();
  }
});
