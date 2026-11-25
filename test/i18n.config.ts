import { defineConfig } from "@playwright/test";

// Dictionary/validation tests run without a database, login, or browser.
export default defineConfig({
  testDir: "../packages/webapp/test/i18n",
  workers: 1,
});
