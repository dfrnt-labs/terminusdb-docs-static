/**
 * Playwright configuration for Layer 3 browser verification tests.
 *
 * Tests verify that documentation pages render correctly in a real browser:
 * - Code blocks hydrate without errors (no "Loading…" stuck state)
 * - Expected content sections are visible
 * - No console errors during page load
 * - Interactive elements (tabs, Run buttons) are functional
 *
 * Prerequisites:
 *   - Dev server running on localhost:3000 (npm run dev)
 *   - Playwright browsers installed (npx playwright install chromium)
 *
 * Usage:
 *   npx playwright test --config scripts/docs-example-tests/playwright.config.mjs
 *   npm run test:browser
 */

import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./browser-tests",
  timeout: 30000,
  retries: 0,
  workers: 1, // Sequential — pages may share state
  reporter: [["list"], ["json", { outputFile: "./browser-tests/results.json" }]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    viewport: { width: 1280, height: 720 },
    // Wait for network idle before assertions
    navigationTimeout: 15000,
    actionTimeout: 10000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        channel: undefined, // Use Playwright-managed Chromium
      },
    },
  ],
  // Don't start server — expect it to be running already
  webServer: undefined,
});
