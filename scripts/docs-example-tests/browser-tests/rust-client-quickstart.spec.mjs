/**
 * Layer 3 Browser Verification — rust-client-quickstart
 *
 * Verifies that the /docs/rust-client-quickstart/ page renders correctly
 * in a real browser with full hydration. This is the Rust client getting-started
 * page — shorter than the Python/TypeScript pages. It has fenced Rust, TOML,
 * and bash code blocks (no http-examples).
 *
 * What this verifies:
 *   1. Page loads without HTTP errors
 *   2. Page title is correct
 *   3. All expected headings are present
 *   4. No console errors during page load
 *   5. Code blocks render with syntax highlighting
 *   6. Key Rust SDK content is visible
 *   7. Community contribution callout renders
 *   8. No hydration mismatch errors
 */

import { test, expect } from "playwright/test";

const PAGE_URL = "/docs/rust-client-quickstart/";
const PAGE_TITLE = "Rust Client — Getting Started";

// Expected headings from the page (main content sections)
const EXPECTED_HEADINGS = [
  "Prerequisites",
  "Add the dependency",
  "Connect",
  "Next steps",
];

test.describe("rust-client-quickstart — Layer 3 Browser Verification", () => {
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

    // Rust page has fenced code blocks (rust, toml, bash)
    const highlightedTokens = page.locator("pre .token");
    const tokenCount = await highlightedTokens.count();
    expect(tokenCount).toBeGreaterThan(10);
  });

  test("key Rust SDK content is visible", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const pageContent = await page.textContent("article");

    // Rust SDK specifics
    expect(pageContent).toContain("terminusdb-client");
    expect(pageContent).toContain("[dependencies]");
    expect(pageContent).toContain("tokio");
    expect(pageContent).toContain("nightly");

    // Connection setup
    expect(pageContent).toContain("TERMINUSDB_HOST");
    expect(pageContent).toContain("localhost:6363");
  });

  test("community contribution callout renders", async ({ page }) => {
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });

    // The page has a prominent warning callout about community maintenance
    const pageContent = await page.textContent("article");
    expect(pageContent).toContain("Community contribution");
    expect(pageContent).toContain("ParapluOU");
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
