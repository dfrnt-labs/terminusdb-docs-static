/**
 * Playwright config for co-located browser functional tests.
 * Runs Layer 5 tests from within the page's tests/ directory.
 *
 * Usage:
 *   npx playwright test --config src/app/docs/first-15-minutes/tests/playwright.config.mjs
 */

import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "browser.test.mjs",
  timeout: 60000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    viewport: { width: 1280, height: 720 },
    navigationTimeout: 15000,
    actionTimeout: 15000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        channel: undefined,
      },
    },
  ],
  webServer: undefined,
});
