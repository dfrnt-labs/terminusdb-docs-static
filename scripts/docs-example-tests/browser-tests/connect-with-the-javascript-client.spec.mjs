/**
 * Layer 3 Browser Verification — connect-with-the-javascript-client
 *
 * Verifies that the /docs/connect-with-the-javascript-client/ page renders
 * correctly in a real browser with full hydration. This is the TypeScript SDK
 * quickstart — it contains fenced TypeScript, bash, and JSON code blocks
 * (no http-examples).
 *
 * What this verifies:
 *   1. Page loads without HTTP errors
 *   2. Page title is correct
 *   3. All expected headings are present
 *   4. No console errors during page load
 *   5. Code blocks render with syntax highlighting
 *   6. Key TypeScript SDK content is visible
 *   7. No hydration mismatch errors
 */

import { test, expect } from "playwright/test";

const PAGE_URL = "/docs/connect-with-the-javascript-client/";
const PAGE_TITLE = "TypeScript Client — Quickstart";

// Expected headings from the page (main content sections)
const EXPECTED_HEADINGS = [
  "Prerequisites",
  "Install the client",
  "Connect to TerminusDB",
  "Create a database and insert a document",
  "Create a branch",
  "Edit the document on the branch",
  "See the diff",
  "Merge the branch",
  "Verify the merge",
  "What just happened?",
  "Troubleshooting",
  "Next steps",
];

test.describe("connect-with-the-javascript-client — Layer 3 Browser Verification", () => {
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

  test("page title is correct", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    const h1 = page.locator("h1").first();
    await expect(h1).toHaveText(PAGE_TITLE);
  });

  test("all expected headings are present in article", async ({ page }) => {
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

  test("fenced code blocks render with syntax highlighting", async ({
    page,
  }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // TypeScript SDK page has many fenced code blocks (typescript, bash, json)
    const highlightedTokens = page.locator("pre .token");
    const tokenCount = await highlightedTokens.count();
    expect(tokenCount).toBeGreaterThan(30);
  });

  test("key TypeScript SDK content is visible", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const pageContent = await page.textContent("article");

    // TypeScript SDK specifics
    expect(pageContent).toContain("terminusdb");
    expect(pageContent).toContain("npm install");
    expect(pageContent).toContain("WOQLClient");
    expect(pageContent).toContain("connect");

    // Version control concepts taught
    expect(pageContent).toContain("branch");
    expect(pageContent).toContain("diff");
    expect(pageContent).toContain("merge");
  });

  test("complete index.ts section is present", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });

    // The page has a "The complete index.ts" section with full code
    const article = page.locator("article").first();
    const completeSection = article.getByRole("heading", { name: /complete.*index/i }).first();
    await expect(completeSection).toBeVisible();
  });

  test("callout notes render correctly", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });

    // Page has callout/warning notes — verify via visible text content
    const pageContent = await page.textContent("article");
    expect(pageContent).toContain("TerminusDB must be running");
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
