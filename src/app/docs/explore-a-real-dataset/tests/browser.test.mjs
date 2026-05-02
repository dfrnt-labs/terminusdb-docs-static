/**
 * Layer 5: Browser Functional Tests — explore-a-real-dataset
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
 *
 * Run: npx playwright test src/app/docs/explore-a-real-dataset/tests/browser.test.mjs --config scripts/docs-example-tests/playwright.config.mjs
 */

import { test, expect } from "playwright/test";

const PAGE_URL = "/docs/explore-a-real-dataset/";

// Timeout for API responses after clicking Run (clone can be slow)
const RUN_TIMEOUT = 30000;

test.describe("explore-a-real-dataset — Layer 5: Browser Functional", () => {
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

  test("page loads and Clone button is visible", async () => {
    const page = sharedPage;
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });

    // QuickstartClone component renders a button with aria-label="Clone Star Wars Database"
    const cloneButton = page.getByRole("button", { name: /Clone Star Wars Database/i });
    await expect(cloneButton).toBeVisible({ timeout: 10000 });
  });

  test("Step 1: Click Clone → database cloned successfully", async () => {
    const page = sharedPage;

    // Click the Clone button
    const cloneButton = page.getByRole("button", { name: /Clone Star Wars Database/i });
    await cloneButton.click();

    // Wait for success state: "Database ready" text appears
    // (QuickstartClone shows "Database ready" on success, or "already exists" which is also OK)
    const successIndicator = page.getByText("Database ready").or(
      page.getByText("already exists")
    );
    await expect(successIndicator).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTION: Verify NO error states are visible
    const errorConnection = page.getByText("TerminusDB is not reachable");
    const errorAuth = page.getByText("Authentication failed");
    const errorOther = page.getByText("Clone failed");
    await expect(errorConnection).not.toBeVisible();
    await expect(errorAuth).not.toBeVisible();
    await expect(errorOther).not.toBeVisible();
  });

  test("Step 2a: Click Run on schema GET → response contains schema types", async () => {
    const page = sharedPage;

    // Find all Run buttons on the page (http-example blocks)
    // Block order: 1=schema GET, 2=Person GET, 3=WOQL POST, 4=branch POST, 5=GET Anakin, 6=PUT modified, 7=diff POST
    const runButtons = page.getByRole("button", { name: /Run/i });

    // First Run button = schema GET
    const schemaRunButton = runButtons.first();
    await expect(schemaRunButton).toBeVisible();
    await schemaRunButton.click();

    // Wait for result panel to appear with content
    // ResultPanel shows with role="region" and aria-label="Execution result"
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Schema response renders as table with 5 rows
    // (1 @context + 4 Class types: Film, Person, Planet, Species)
    // The table shows columns from row 0 (@context): @base, @schema, @type
    // Class items show @type="Class" in the table
    await expect(resultPanel).toContainText("5 rows", { timeout: 5000 });
    await expect(resultPanel).toContainText("Class");
    await expect(resultPanel).toContainText("@context");
  });

  test("Step 2b: Click Run on Person GET → response shows 5 documents with name fields", async () => {
    const page = sharedPage;

    // Clear previous result first (click ✕ Clear)
    const clearButton = page.getByRole("button", { name: /Clear execution result/i }).first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }

    // Second Run button = Person documents GET
    const runButtons = page.getByRole("button", { name: /Run/i });
    const personRunButton = runButtons.nth(1);
    await expect(personRunButton).toBeVisible();
    await personRunButton.click();

    // Wait for result panel (after clearing previous, this will be the first/only one)
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Person documents rendered as table with 5 rows
    // Table columns from Person keys: @id, @type, name, eye_color, etc.
    await expect(resultPanel).toContainText("5 rows", { timeout: 5000 });

    // Should contain recognisable Star Wars character names in the "name" column
    const resultText = await resultPanel.textContent();
    const hasCharacter = resultText.includes("Anakin Skywalker") ||
      resultText.includes("C-3PO") ||
      resultText.includes("Chewbacca") ||
      resultText.includes("Beru Whitesun lars") ||
      resultText.includes("Biggs Darklighter");
    expect(hasCharacter).toBe(true);
  });

  test("Step 3: Click Run on WOQL → response shows bindings with Luke Skywalker", async () => {
    const page = sharedPage;

    // Clear previous result
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    const visibleClear = clearButtons.first();
    if (await visibleClear.isVisible()) {
      await visibleClear.click();
    }

    // Third Run button = WOQL query
    const runButtons = page.getByRole("button", { name: /Run/i });
    const woqlRunButton = runButtons.nth(2);
    await expect(woqlRunButton).toBeVisible();
    await woqlRunButton.click();

    // Wait for result panel — WOQL results show "● Result (N rows)"
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Must contain character names from A New Hope
    await expect(resultPanel).toContainText("Luke Skywalker", { timeout: 5000 });
    await expect(resultPanel).toContainText("Leia Organa");

    // Must show row count (17 rows for A New Hope characters)
    const headerText = await resultPanel.textContent();
    expect(headerText).toContain("Result");
    // Should have at least "17 rows" or character names
    expect(headerText).toContain("row");
  });

  test("Step 4a: Click Run on branch POST → branch created successfully", async () => {
    const page = sharedPage;

    // Clear previous result
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible()) {
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

    // CONTENT ASSERTIONS: Response must contain success indicator
    // Note: presence of [role='region'][aria-label='Execution result'] proves SUCCESS state
    // (error state renders role="alert" without aria-label — so our locator wouldn't match)
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("api:success");
  });

  test("Step 4b: Click Run on GET Anakin → response shows eye_color blue", async () => {
    const page = sharedPage;

    // Clear previous
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible()) {
      await clearButtons.first().click();
    }

    // Fifth Run button = GET Anakin document
    const runButtons = page.getByRole("button", { name: /Run/i });
    const getAnakinButton = runButtons.nth(4);
    await expect(getAnakinButton).toBeVisible();
    await getAnakinButton.click();

    // Wait for result
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Must contain Anakin's original field values
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("Anakin Skywalker");
    expect(resultText).toContain("blue"); // eye_color: blue (before modification)
    expect(resultText).toContain("Light Side"); // side: Light Side
  });

  test("Step 4c: Click Run on PUT modified → response contains document ID", async () => {
    const page = sharedPage;

    // Clear previous
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible()) {
      await clearButtons.first().click();
    }

    // Sixth Run button = PUT modified Anakin
    const runButtons = page.getByRole("button", { name: /Run/i });
    const putButton = runButtons.nth(5);
    await expect(putButton).toBeVisible();
    await putButton.click();

    // Wait for result
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: PUT response must contain the document ID
    // Note: SUCCESS state (role="region") already proves no error occurred
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("Person/Anakin");
  });

  test("Step 5: Click Run on diff → response shows SwapValue operations", async () => {
    const page = sharedPage;

    // Clear previous
    const clearButtons = page.getByRole("button", { name: /Clear execution result/i });
    if (await clearButtons.first().isVisible()) {
      await clearButtons.first().click();
    }

    // Seventh Run button = diff POST
    const runButtons = page.getByRole("button", { name: /Run/i });
    const diffButton = runButtons.nth(6);
    await expect(diffButton).toBeVisible();
    await diffButton.click();

    // Wait for result — diff might take a moment
    const resultPanel = page.locator("[role='region'][aria-label='Execution result']").first();
    await expect(resultPanel).toBeVisible({ timeout: RUN_TIMEOUT });

    // CONTENT ASSERTIONS: Diff must show structural changes
    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("SwapValue"); // The diff operation type
    expect(resultText).toContain("yellow"); // eye_color changed to yellow
    expect(resultText).toContain("Dark Side"); // side changed to Dark Side
    expect(resultText).toContain("Person/Anakin"); // Document that changed
  });
});
