/**
 * Layer 3 Browser Verification — vector search UI
 *
 * Verifies the TerminusDB-backed search against a live local instance
 * (NEXT_PUBLIC_TERMINUSDB_URL → http://localhost:6599, public/docs loaded
 * and indexed):
 *
 *   1. ⌘K opens the dialog and returns hits from /api/search
 *   2. "See all results" links to /search?q=… which renders result cards
 *   3. "Load more" appends results when more than one page exists
 *   4. A docs page shows the Similar documents panel populated from /api/similar
 *   5. Slow responses surface the scale-to-zero wake hint
 *   6. "Powered by TerminusDB hybrid search" badge is visible on the search surfaces
 */

import { test, expect } from "playwright/test";

test.describe("vector search", () => {
  test("⌘K dialog returns results and links to the results page", async ({
    page,
  }) => {
    await page.goto("/docs/branch/");
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    const input = page.locator("input").first();
    await expect(input).toBeFocused();
    await input.fill("branch");

    // Results arrive asynchronously — wait for a hit linking into /docs/
    const firstHit = page.locator('[role="dialog"] li a, [role="dialog"] li');
    await expect(firstHit.first()).toBeVisible({ timeout: 20000 });

    const seeAll = page.getByRole("link", { name: /See all results/ });
    await expect(seeAll).toBeVisible();
    await expect(seeAll).toHaveAttribute("href", /\/search\/?\?q=branch/);

    // Powered-by attribution in the dialog footer
    await expect(
      page.getByRole("link", { name: /Powered by.*hybrid search/i }).first(),
    ).toBeVisible();
  });

  test("results page renders hits for a query", async ({ page }) => {
    await page.goto("/search?q=branch");
    const card = page.locator('a[href^="/docs/"]').filter({ hasText: /branch/i });
    await expect(card.first()).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByText(/Results for/),
    ).toBeVisible();
  });

  test("load more appends results", async ({ page }) => {
    await page.goto("/search?q=database");
    const cards = page.locator('ul a[href^="/docs/"]');
    await expect(cards.first()).toBeVisible({ timeout: 20000 });
    const initial = await cards.count();

    const loadMore = page.getByRole("button", { name: /Load more/i });
    // Broad queries exceed one page; if the index ever returns fewer than
    // 20 hits this test should be revisited rather than weakened.
    await expect(loadMore).toBeVisible();
    await loadMore.click();
    await expect(cards).toHaveCount(initial + 20, { timeout: 20000 });
  });

  test("docs page shows similar documents", async ({ page }) => {
    await page.goto("/docs/branch/");
    const panel = page.getByRole("region", { name: "Similar documents" });
    await expect(panel).toBeVisible({ timeout: 20000 });
    // 5 similar cards, each linking to a docs page
    const cards = panel.locator('ul a[href^="/docs/"]');
    await expect(cards).toHaveCount(5, { timeout: 20000 });
    await expect(
      panel.getByRole("link", { name: /Powered by.*hybrid search/i }),
    ).toBeVisible();
  });

  test("slow search shows the scale-to-zero hint", async ({ page }) => {
    await page.route("**/api/search/**", async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.continue();
    });
    await page.goto("/search?q=branch");
    await expect(
      page.getByText(/scales to zero/i),
    ).toBeVisible({ timeout: 10000 });
    // Results still arrive once the delayed response lands
    await expect(
      page.locator('a[href^="/docs/"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("similar documents fails gracefully when the API is down", async ({
    page,
  }) => {
    await page.route("**/api/similar/**", (route) => route.abort());
    await page.goto("/docs/branch/");
    // Page content unaffected; panel collapses
    await expect(page.locator("article")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Similar documents" }),
    ).toHaveCount(0, { timeout: 15000 });
  });
});
