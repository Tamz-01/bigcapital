import { test, expect } from "@playwright/test";
import arabic from "../packages/webapp/src/lang/ar/index.json";
import english from "../packages/webapp/src/lang/en/index.json";

test("switching language keeps the current URL, translated placeholders and draft fields", async ({
  page,
}) => {
  await page.goto("/vendors/new?translation_review=1#basic");
  const language = page.getByRole("combobox", { name: "Display language" });
  await expect(language).toBeEnabled({ timeout: 30_000 });
  await language.selectOption("en");
  await expect(language).toBeEnabled();
  const firstName = page.locator('input[name="firstName"]');
  await firstName.fill("UNSAVED translation review");
  const currentUrl = page.url();
  let navigations = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) navigations++;
  });
  try {
    await language.selectOption("ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(firstName).toHaveAttribute("placeholder", arabic.first_name);
    await expect(firstName).toHaveValue("UNSAVED translation review");
    expect(page.url()).toBe(currentUrl);
    expect(navigations).toBe(0);
    await language.selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(firstName).toHaveAttribute("placeholder", english.first_name);
    await expect(firstName).toHaveValue("UNSAVED translation review");
    expect(page.url()).toBe(currentUrl);
    expect(navigations).toBe(0);
  } finally {
    await language.selectOption("en");
  }
});

test("the saved account language survives reload on a detail page", async ({
  page,
}) => {
  await page.goto("/preferences/general?translation_review=1");
  const language = page.getByRole("combobox", { name: "Display language" });
  await expect(language).toBeEnabled({ timeout: 30_000 });
  const currentUrl = page.url();
  try {
    await language.selectOption("ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await page.reload();
    await expect(language).toHaveValue("ar", { timeout: 30_000 });
    expect(page.url()).toBe(currentUrl);
  } finally {
    await language.selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  }
});
