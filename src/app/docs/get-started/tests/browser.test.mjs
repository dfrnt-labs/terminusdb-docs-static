/**
 * Layer 5: Browser Functional Tests — get-started
 *
 * Verifies that CLICKING RUN on each code block produces CORRECT RESPONSES
 * in the browser. This is NOT a rendering test — it verifies functionality.
 *
 * Each test clicks a Run button and asserts on RESPONSE CONTENT (not HTTP status).
 *
 * Prerequisites:
 *   - Dev server running on localhost:3000 (npm run dev)
 *   - TerminusDB running on localhost:6363
 *   - star-wars database DELETED before test run (clean slate)
 *   - data.terminusdb.org reachable (for clone)
 *
 * Run: npx playwright test src/app/docs/get-started/tests/browser.test.mjs --config src/app/docs/get-started/tests/playwright.config.mjs
 */

import { test, expect } from "playwright/test";

const PAGE_URL = "/docs/get-started/";

// Timeout for API responses after clicking Run
const RUN_TIMEOUT = 30000;
// Clone from remote server can take much longer
const CLONE_TIMEOUT = 60000;

test.describe("get-started — Layer 5: Browser Functional", () => {
  test.describe.configure({ mode: "serial" });

  /** @type {import('playwright/test').Page} */
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    // Pre-clean: delete star-wars DB so clone button works from scratch
    try {
      await fetch("http://localhost:6363/api/db/admin/star-wars", {
        method: "DELETE",
        headers: { Authorization: "Basic " + btoa("admin:root") },
      });
    } catch {
      // Server might not be reachable — test will detect this
    }

    // Create a persistent page for the serial test sequence
    const context = await browser.newContext();
    sharedPage = await context.newPage();
  });

  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
    // Clean up: delete star-wars DB after tests
    try {
      await fetch("http://localhost:6363/api/db/admin/star-wars", {
        method: "DELETE",
        headers: { Authorization: "Basic " + btoa("admin:root") },
      });
    } catch {
      // ignore
    }
  });

  test("page loads and Run/Clone buttons are visible", async () => {
    const page = sharedPage;
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });

    // QuickstartClone component renders a clone button
    const cloneButton = page.getByRole("button", { name: /Clone Quickstart Database/i });
    await expect(cloneButton).toBeVisible({ timeout: 10000 });

    // Run buttons should be present (for runnable http-examples)
    const runButtons = page.getByRole("button", { name: /Run/i });
    const runCount = await runButtons.count();
    expect(runCount).toBeGreaterThanOrEqual(3); // info GET, branch POST, apply POST
  });

  test("Step 1: Click Run on GET /api/info → response contains authority admin", async () => {
    const page = sharedPage;

    // First Run button = GET /api/info
    const runButtons = page.getByRole("button", { name: /Run/i });
    const infoRunButton = runButtons.first();
    await expect(infoRunButton).toBeVisible();
    await infoRunButton.click();

    // Wait for result panel to appear
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: info response must contain admin authority
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("admin");
    expect(resultText).toContain("authority");
  });

  test("Step 2: Click Clone → database cloned successfully", async () => {
    const page = sharedPage;

    // Click the Clone button
    const cloneButton = page.getByRole("button", { name: /Clone Quickstart Database/i });
    await cloneButton.click();

    // Wait for success state: "Database ready" or "already exists"
    // Clone from remote server can take 30-60s
    const successIndicator = page.getByText("Database ready").or(
      page.getByText("already exists")
    );
    await expect(successIndicator).toBeVisible({ timeout: CLONE_TIMEOUT });

    // CONTENT ASSERTION: No error states visible
    const errorConnection = page.getByText("TerminusDB is not reachable");
    const errorAuth = page.getByText("Authentication failed");
    const errorClone = page.getByText("Clone failed");
    await expect(errorConnection).not.toBeVisible();
    await expect(errorAuth).not.toBeVisible();
    await expect(errorClone).not.toBeVisible();
  });

  test("Step 3: Click Run on branch POST → branch created successfully", async () => {
    const page = sharedPage;

    // Clear ALL previous results to get a clean state
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    const clearCount = await clearButtons.count();
    for (let i = 0; i < clearCount; i++) {
      if (await clearButtons.nth(i).isVisible().catch(() => false)) {
        await clearButtons.nth(i).click();
      }
    }
    // Small wait for DOM to settle after clearing
    await page.waitForTimeout(500);

    // Second Run button (index 1) = branch creation POST (Step 3)
    // Button order: 0=info GET, 1=branch POST, 2-3=bash curls, 4=apply POST, 5=troubleshooting
    const runButtons = page.getByRole("button", { name: /Run/i });
    const branchRunButton = runButtons.nth(1);
    await branchRunButton.scrollIntoViewIfNeeded();
    await expect(branchRunButton).toBeVisible({ timeout: 5000 });
    await branchRunButton.click();

    // Wait for result panel — success shows role=region, error shows role=alert
    const successResult = page.locator("[role='region'][aria-label='Execution result']").first();
    const errorResult = page.locator("[role='alert']").first();
    const resultAppeared = successResult.or(errorResult);
    await expect(resultAppeared).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Branch creation response must show success
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: 5000 });
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("api:success");
  });

  test("Step 6: Click Run on apply/merge POST → merge successful", async () => {
    const page = sharedPage;

    // We need to do the edit on the branch first (Step 4 uses curl, not http-example Run button)
    // Fetch a document from what-if branch, modify it, PUT it back
    const auth = "Basic " + btoa("admin:root");
    const baseUrl = "http://localhost:6363";

    // Get all documents on what-if branch
    const listRes = await fetch(
      `${baseUrl}/api/document/admin/star-wars/local/branch/what-if?as_list=true&count=1`,
      { headers: { Authorization: auth } }
    );

    if (listRes.ok) {
      const docs = await listRes.json();
      if (docs.length > 0) {
        const doc = docs[0];
        // Make a trivial change to create a commit difference
        doc._modified_by_test = true;

        await fetch(
          `${baseUrl}/api/document/admin/star-wars/local/branch/what-if?author=admin&message=Test+edit+for+merge`,
          {
            method: "PUT",
            headers: { Authorization: auth, "Content-Type": "application/json" },
            body: JSON.stringify(doc),
          }
        );
      }
    }

    // Clear ALL previous results
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    const clearCount = await clearButtons.count();
    for (let i = 0; i < clearCount; i++) {
      if (await clearButtons.nth(i).isVisible().catch(() => false)) {
        await clearButtons.nth(i).click();
      }
    }
    await page.waitForTimeout(500);

    // Apply/merge Run button is at index 4
    // Button order: 0=info GET, 1=branch POST, 2-3=bash curls, 4=apply POST, 5=troubleshooting
    const runButtons = page.getByRole("button", { name: /Run/i });
    const applyRunButton = runButtons.nth(4);
    await applyRunButton.scrollIntoViewIfNeeded();
    await expect(applyRunButton).toBeVisible({ timeout: 5000 });
    await applyRunButton.click();

    // Wait for result panel — success or error
    const successResult = page.locator("[role='region'][aria-label='Execution result']").first();
    const errorResult = page.locator("[role='alert']").first();
    const resultAppeared = successResult.or(errorResult);
    await expect(resultAppeared).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Apply response must show success
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: 5000 });
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("api:success");
  });
});
