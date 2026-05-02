/**
 * Layer 5: Browser Functional Tests — explore-ecommerce-dataset
 *
 * Verifies that CLICKING RUN on each code block produces CORRECT RESPONSES
 * in the browser. This is NOT a rendering test — it verifies functionality.
 *
 * Each test clicks a Run button and asserts on RESPONSE CONTENT (not HTTP status).
 *
 * Prerequisites:
 *   - Dev server running on localhost:3000 (npm run dev)
 *   - TerminusDB running on localhost:6363
 *   - ecommerce database DELETED before test run (clean slate)
 *   - data.terminusdb.org reachable (for clone)
 *
 * Run: npx playwright test src/app/docs/explore-ecommerce-dataset/tests/browser.test.mjs --config src/app/docs/explore-ecommerce-dataset/tests/playwright.config.mjs
 */

import { test, expect } from "playwright/test";

const PAGE_URL = "/docs/explore-ecommerce-dataset/";

// Timeout for API responses after clicking Run
const RUN_TIMEOUT = 30000;
// Clone from remote server can take much longer
const CLONE_TIMEOUT = 60000;

test.describe("explore-ecommerce-dataset — Layer 5: Browser Functional", () => {
  test.describe.configure({ mode: "serial" });

  /** @type {import('playwright/test').Page} */
  let sharedPage;

  test.beforeAll(async ({ browser }) => {
    // Pre-clean: delete ecommerce DB so clone button works from scratch
    try {
      await fetch("http://localhost:6363/api/db/admin/ecommerce", {
        method: "DELETE",
        headers: { Authorization: "Basic " + btoa("admin:root") },
      });
    } catch {
      // Server might not be reachable — test will detect this
    }

    // Also delete the fulfillment branch if it exists from a previous run
    try {
      await fetch("http://localhost:6363/api/branch/admin/ecommerce/local/branch/fulfillment", {
        method: "DELETE",
        headers: { Authorization: "Basic " + btoa("admin:root") },
      });
    } catch {
      // ignore
    }

    // Create a persistent page for the serial test sequence
    const context = await browser.newContext();
    sharedPage = await context.newPage();
  });

  test.afterAll(async () => {
    if (sharedPage) {
      await sharedPage.close();
    }
    // Clean up: delete ecommerce DB after tests
    try {
      await fetch("http://localhost:6363/api/db/admin/ecommerce", {
        method: "DELETE",
        headers: { Authorization: "Basic " + btoa("admin:root") },
      });
    } catch {
      // ignore
    }
  });

  test("page loads and Clone button is visible", async () => {
    const page = sharedPage;
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });

    // QuickstartClone component renders a button with aria-label="Clone Ecommerce Database"
    const cloneButton = page.getByRole("button", { name: /Clone Ecommerce Database/i });
    await expect(cloneButton).toBeVisible({ timeout: 10000 });
  });

  test("Step 1: Click Clone → ecommerce database cloned successfully", async () => {
    const page = sharedPage;

    // Click the Clone button
    const cloneButton = page.getByRole("button", { name: /Clone Ecommerce Database/i });
    await cloneButton.click();

    // Wait for success state — clone from remote server can take 30-60s
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

  test("Step 2a: Click Run on schema GET → response contains document types", async () => {
    const page = sharedPage;

    // First Run button = schema GET
    const runButtons = page.getByRole("button", { name: /Run/i });
    const schemaRunButton = runButtons.first();
    await expect(schemaRunButton).toBeVisible();
    await schemaRunButton.click();

    // Wait for result panel
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Schema has 6 items (1 @context + 5 types)
    await expect(resultPanel).toContainText("6 rows", { timeout: 5000 });
    await expect(resultPanel).toContainText("@context");
  });

  test("Step 2b: Click Run on Orders GET → response shows 30 orders", async () => {
    const page = sharedPage;

    // Clear previous result
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible().catch(() => false)) {
      await clearButtons.first().click();
    }

    // Second Run button = Orders GET
    const runButtons = page.getByRole("button", { name: /Run/i });
    const ordersRunButton = runButtons.nth(1);
    await expect(ordersRunButton).toBeVisible();
    await ordersRunButton.click();

    // Wait for result panel
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: 30 Order documents
    await expect(resultPanel).toContainText("30 rows", { timeout: 5000 });

    // Should contain recognisable order IDs
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("Order");
  });

  test("Step 3: Click Run on WOQL → response shows processing orders with customer details", async () => {
    const page = sharedPage;

    // Clear previous result
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible().catch(() => false)) {
      await clearButtons.first().click();
    }

    // Third Run button = WOQL query
    const runButtons = page.getByRole("button", { name: /Run/i });
    const woqlRunButton = runButtons.nth(2);
    await expect(woqlRunButton).toBeVisible();
    await woqlRunButton.click();

    // Wait for result panel — WOQL results show bindings
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Must contain processing order data
    const resultText = await resultPanel.textContent();
    // Expected: ORD-0002 (Hana Tanaka, Japan), ORD-0019 (Leila Okafor, Nigeria), ORD-0030 (Erik Lindstrom, Sweden)
    expect(resultText).toContain("ORD-0002");
    expect(resultText).toContain("Hana Tanaka");
    expect(resultText).toContain("Result");
    expect(resultText).toContain("row");
  });

  test("Step 4a: Click Run on branch POST → fulfillment branch created", async () => {
    const page = sharedPage;

    // Clear previous result
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible().catch(() => false)) {
      await clearButtons.first().click();
    }

    // Fourth Run button = branch creation POST
    const runButtons = page.getByRole("button", { name: /Run/i });
    const branchRunButton = runButtons.nth(3);
    await expect(branchRunButton).toBeVisible();
    await branchRunButton.click();

    // Wait for result panel
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Branch creation response
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("api:success");
  });

  test("Step 4b: Click Run on PUT order → order updated to shipped", async () => {
    const page = sharedPage;

    // Clear previous result
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible().catch(() => false)) {
      await clearButtons.first().click();
    }

    // Fifth Run button = PUT order on fulfillment branch
    const runButtons = page.getByRole("button", { name: /Run/i });
    const putButton = runButtons.nth(4);
    await expect(putButton).toBeVisible();
    await putButton.click();

    // Wait for result panel
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: PUT response must contain the document ID
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("Order/ORD-0002");
  });

  test("Step 5: Click Run on diff → response shows SwapValue for status field", async () => {
    const page = sharedPage;

    // Clear previous result
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible().catch(() => false)) {
      await clearButtons.first().click();
    }

    // Sixth Run button = diff POST
    const runButtons = page.getByRole("button", { name: /Run/i });
    const diffButton = runButtons.nth(5);
    await expect(diffButton).toBeVisible();
    await diffButton.click();

    // Wait for result panel
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Diff must show the status field change
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("SwapValue");
    expect(resultText).toContain("processing");
    expect(resultText).toContain("shipped");
    expect(resultText).toContain("Order/ORD-0002");
  });

  test("Step 6: Click Run on apply/merge → merge successful", async () => {
    const page = sharedPage;

    // Clear previous result
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible().catch(() => false)) {
      await clearButtons.first().click();
    }

    // Seventh Run button = apply/merge POST
    const runButtons = page.getByRole("button", { name: /Run/i });
    const applyButton = runButtons.nth(6);
    await expect(applyButton).toBeVisible();
    await applyButton.click();

    // Wait for result panel
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Apply response must show success
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("api:success");
  });
});
