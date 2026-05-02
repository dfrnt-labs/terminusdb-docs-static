/**
 * Layer 4 Browser Verification — json-diff-and-patch
 *
 * Verifies that the /docs/json-diff-and-patch/ page renders correctly in a
 * real browser, that code blocks display the right content, and that the
 * interactive Run buttons execute successfully against both the public
 * endpoint (data.terminusdb.org) and localhost.
 *
 * What this verifies:
 *   1. Page loads without HTTP errors
 *   2. All expected headings are present
 *   3. No console errors during page load
 *   4. Public Demo code blocks show data.terminusdb.org URLs
 *   5. Localhost code blocks show localhost:6363 URLs
 *   6. Run button on public demo diff returns expected JSON
 *   7. Run button on public demo patch returns expected JSON
 *   8. Run button on localhost diff example executes (requires local server)
 *   9. No hydration mismatch errors
 */

import { test, expect } from "playwright/test";

const PAGE_URL = "/docs/json-diff-and-patch/";

const EXPECTED_HEADINGS = [
  "Diff",
  "Patch",
  "Public Endpoint",
  "Diff & Patch with Client",
  "JSON Diff and Patch Operations",
  "Public Demo Endpoint",
  "Diff and Patch Endpoints",
  "Further Reading",
];

test.describe("json-diff-and-patch — Layer 4 Browser Verification", () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(`PageError: ${err.message}`);
    });
  });

  test("page loads with 200 status", async ({ page }) => {
    const response = await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    expect(response.status()).toBe(200);
  });

  test("all expected headings are present", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    const article = page.locator("article").first();

    for (const heading of EXPECTED_HEADINGS) {
      const headingEl = article.getByRole("heading", { name: heading }).first();
      await expect(headingEl).toBeVisible();
    }
  });

  test("no application console errors during page load", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const realErrors = consoleErrors.filter(
      (msg) =>
        !msg.includes("Download the React DevTools") &&
        !msg.includes("Failed to load resource") &&
        !msg.includes("net::ERR_") &&
        !msg.includes("favicon") &&
        !msg.includes("GitHubIssueButton") &&
        !msg.includes("Prop `%s` did not match")
    );

    expect(realErrors).toEqual([]);
  });

  test("public demo diff block shows data.terminusdb.org URL", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verify the section heading exists (use article scope to avoid sidebar duplicate)
    const article = page.locator("article").first();
    const publicDemoHeading = article.getByRole("heading", { name: "Public Demo Endpoint" });
    await expect(publicDemoHeading).toBeVisible();

    // The first code block should contain data.terminusdb.org/api/diff
    const firstCodeBlock = page.locator("pre").filter({ hasText: "data.terminusdb.org/api/diff" }).first();
    await expect(firstCodeBlock).toBeVisible();

    const codeText = await firstCodeBlock.textContent();
    expect(codeText).toContain("https://data.terminusdb.org/api/diff");
    expect(codeText).toContain('"before"');
    expect(codeText).toContain('"after"');
  });

  test("public demo patch block shows data.terminusdb.org URL", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const patchCodeBlock = page.locator("pre").filter({ hasText: "data.terminusdb.org/api/patch" }).first();
    await expect(patchCodeBlock).toBeVisible();

    const codeText = await patchCodeBlock.textContent();
    expect(codeText).toContain("https://data.terminusdb.org/api/patch");
    expect(codeText).toContain("SwapValue");
  });

  test("localhost diff examples show localhost:6363 URL", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // The "Diff examples using curl" section should have localhost URLs
    const localhostBlocks = page.locator("pre").filter({ hasText: "localhost:6363/api/diff" });
    const count = await localhostBlocks.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("Run button exists on public demo diff block", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Find the runnable fence container that has the data.terminusdb.org/api/diff curl
    const diffContainer = page.locator("[class*='group']").filter({
      hasText: "data.terminusdb.org/api/diff",
    }).first();

    const runButton = diffContainer.getByRole("button", { name: /run/i });
    await expect(runButton).toBeVisible();
  });

  test("clicking Run on public demo diff returns SwapValue result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // The first Run button on the page is the public demo diff
    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.first().click();

    // Wait for result panel (role="region" with aria-label="Execution result")
    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("SwapValue");
    expect(resultText).toContain("Alice");
    expect(resultText).toContain("Bob");
  });

  test("clicking Run on public demo patch returns patched result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // The second Run button is the public demo patch
    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.nth(1).click();

    // Wait for result panel
    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const resultText = await resultPanel.textContent();
    expect(resultText).toContain("Bob");
  });

  test("clicking Run on localhost diff-swap-with-keep returns valid result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Third Run button is the first localhost example (diff-swap-with-keep)
    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.nth(2).click();

    // Should get a successful result or an error alert
    // Wait for result panel to appear
    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const text = await resultPanel.textContent();
    expect(text).toContain("SwapValue");
  });

  test("clicking Run on localhost diff-array-object-swap returns valid result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.nth(3).click();

    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const text = await resultPanel.textContent();
    expect(text).toContain("SwapValue");
  });

  test("clicking Run on localhost diff-list-append returns valid result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.nth(4).click();

    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const text = await resultPanel.textContent();
    expect(text).toContain("CopyList");
  });

  test("clicking Run on localhost diff-list-append-copy-value returns valid result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.nth(5).click();

    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const text = await resultPanel.textContent();
    expect(text).toContain("CopyList");
  });

  test("clicking Run on localhost diff-nested-object-swap returns valid result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.nth(6).click();

    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const text = await resultPanel.textContent();
    expect(text).toContain("SwapValue");
  });

  test("clicking Run on localhost patch-nested-object returns valid result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.nth(7).click();

    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const text = await resultPanel.textContent();
    expect(text).toContain("quuz");
  });

  test("clicking Run on localhost patch-list-append returns valid result", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const runButtons = page.locator('button[aria-label*="Run this code"]');
    await runButtons.nth(8).click();

    const resultPanel = page.locator('[role="region"][aria-label="Execution result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 10000 });

    const text = await resultPanel.textContent();
    expect(text).toContain("0");
  });

  test("code blocks render with syntax highlighting", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const highlightedTokens = page.locator("pre .token");
    const tokenCount = await highlightedTokens.count();
    expect(tokenCount).toBeGreaterThan(50);
  });

  test("no hydration mismatch errors", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const hydrationErrors = consoleErrors.filter(
      (msg) =>
        (msg.includes("Hydration") ||
        msg.includes("hydrat") ||
        msg.includes("server-rendered") ||
        msg.includes("did not match")) &&
        !msg.includes("GitHubIssueButton") &&
        !msg.includes("Prop `%s` did not match")
    );

    expect(hydrationErrors).toEqual([]);
  });
});
