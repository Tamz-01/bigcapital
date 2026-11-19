import { expect, test } from "@playwright/test";
import english from "../packages/webapp/src/lang/en/index.json";
import { newUnauthenticatedPage } from "./_utils";

test.use({ hasTouch: true });

test("signed-out authentication fits narrow and short viewports", async ({
  browser,
}) => {
  const page = await newUnauthenticatedPage(browser);
  try {
    await page.goto("/auth/login");
    const email = page.getByLabel(english.email_address);
    const password = page.getByLabel(english.password, { exact: true });
    const submit = page.getByRole("button", {
      name: english.log_in,
      exact: true,
    });
    await expect(email).toBeVisible();

    for (const [width, height] of [
      [360, 800],
      [390, 844],
      [430, 932],
      [768, 1024],
      [844, 390],
      [1280, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport();
    }

    await page.setViewportSize({ width: 390, height: 360 });
    await submit.tap();
    await expect(page.locator("form")).toContainText(
      "Password is a required field",
    );
    await password.fill("demo-password");
    await page.getByRole("button", { name: "Show password" }).tap();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).tap();
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveValue("demo-password");
  } finally {
    await page.context().close();
  }
});

test("tap navigation keeps a draft across opening, closing and resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vendors/new?mobile_review=1#basic");
  const draft = page.locator('input[name="firstName"]');
  const value = "UNSAVED ລາວ عربي 123";
  const menu = page.getByRole("button", { name: english.menu, exact: true });
  const drawer = page.locator(".compact-navigation--main");

  await draft.fill(value);
  await menu.tap();
  await expect(drawer).toBeVisible();
  await drawer
    .getByRole("button", { name: english["sidebar.sales"], exact: true })
    .tap();
  await expect(
    drawer.getByRole("button", {
      name: english["sidebar.invoices"],
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menu).toBeFocused();
  await expect(draft).toHaveValue(value);

  await menu.tap();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(drawer).toBeHidden();
  await expect(draft).toHaveValue(value);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(draft).toHaveValue(value);
  await expect(page).toHaveURL(/\/vendors\/new\?mobile_review=1#basic$/);
  await menu.tap();
  await drawer
    .getByRole("button", { name: english["sidebar.sales"], exact: true })
    .tap();
  await drawer
    .getByRole("button", { name: english["sidebar.invoices"], exact: true })
    .tap();
  await expect(page).toHaveURL(/\/invoices$/);
  await expect(drawer).toBeHidden();
});
