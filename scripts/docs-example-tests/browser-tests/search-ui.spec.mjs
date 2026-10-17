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

  test("keyboard navigation scrolls inside the list without moving the page", async ({
    page,
  }) => {
    await page.goto("/docs/branch/");
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+k" : "Control+k",
    );
    const input = page.locator("input").first();
    await input.fill("database");

    const list = page.locator('[role="dialog"] ul');
    const items = list.locator("li");
    await expect(items.first()).toBeVisible({ timeout: 20000 });

    const pageScroll = await page.evaluate(() => window.scrollY);
    for (let i = 0; i < 12; i++) await page.keyboard.press("ArrowDown");

    // The page behind the dialog must not move
    expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);

    // The highlighted item sits fully inside the list's visible box
    const selected = list.locator('li[aria-selected="true"]').first();
    const itemBox = await selected.boundingBox();
    const listBox = await list.boundingBox();
    expect(itemBox.y).toBeGreaterThanOrEqual(listBox.y - 1);
    expect(itemBox.y + itemBox.height).toBeLessThanOrEqual(
      listBox.y + listBox.height + 1,
    );
  });

  test("Tab moves focus from input to active item to see-all-results", async ({
    page,
  }) => {
    await page.goto("/docs/branch/");
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+k" : "Control+k",
    );
    const input = page.locator("input").first();
    await input.fill("database");

    const list = page.locator('[role="dialog"] ul');
    const active = list.locator('li[aria-selected="true"]').first();
    await expect(active).toBeVisible({ timeout: 20000 });

    // Tab lands on the highlighted item, list stays visible while blurred
    await page.keyboard.press("Tab");
    await expect(active).toBeFocused();
    await expect(list.locator("li").first()).toBeVisible();

    // Arrow keys still move the highlight while the item is focused
    const firstUrl = await active.getAttribute("aria-labelledby");
    await page.keyboard.press("ArrowDown");
    const moved = list.locator('li[aria-selected="true"]').first();
    await expect(moved).toBeFocused();
    expect(await moved.getAttribute("aria-labelledby")).not.toBe(firstUrl);

    // Next Tab lands on the "See all results" link
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: /See all results/i }),
    ).toBeFocused();
  });

  test("results page renders hits for a query", async ({ page }) => {
    await page.goto("/search?q=branch");
    const card = page.locator('a[href^="/docs/"]').filter({ hasText: /branch/i });
    await expect(card.first()).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByText(/Results for/),
    ).toBeVisible();
  });

  test("result links deep-link into the matched section", async ({ page }) => {
    await page.goto("/search?q=branch");
    // Anchors arrive with the Page-doc enrichment request, just after
    // the results themselves render.
    await expect(
      page.locator('ul a[href^="/docs/"][href*="#"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("nested pages link to their real path, not the flat slug", async ({
    page,
  }) => {
    await page.goto("/search?q=graphql%20endpoint");
    // Release notes live under /docs/releases/; the hit id is flat, so
    // the real path arrives with the Page-doc enrichment request.
    await expect(
      page.locator('ul a[href^="/docs/releases/"]').first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("results page search bar drives the query", async ({ page }) => {
    await page.goto("/search");
    const box = page.getByRole("searchbox", {
      name: /Search the documentation/i,
    });
    await box.fill("clone");
    // Debounced: the URL picks up the typed query, results follow
    await expect(page).toHaveURL(/[?&]q=clone/, { timeout: 5000 });
    const card = page.locator('a[href^="/docs/"]').filter({ hasText: /clone/i });
    await expect(card.first()).toBeVisible({ timeout: 20000 });
  });

  test("search bar keeps every keystroke while the debounce commits", async ({
    page,
  }) => {
    await page.goto("/search");
    const box = page.getByRole("searchbox", {
      name: /Search the documentation/i,
    });
    // Slower than the 300 ms debounce — the URL updates mid-word, which
    // must not reset the input to the committed (shorter) query.
    await box.pressSequentially("database", { delay: 120 });
    await expect(box).toHaveValue("database");
    await expect(page).toHaveURL(/[?&]q=database/, { timeout: 5000 });
    await expect(box).toHaveValue("database");
  });

  test("preview panel stays below the header when scrolled", async ({
    page,
  }) => {
    await page.goto("/search?q=database");
    const preview = page.locator("aside .sticky");
    await expect(preview).toBeVisible({ timeout: 20000 });

    // Mid-scroll: the panel sticks just below the header
    await page.evaluate(() => window.scrollTo(0, 600));
    const header = await page.locator("header").first().boundingBox();
    const panel = await preview.boundingBox();
    const viewport = page.viewportSize();
    expect(panel.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(panel.y + panel.height).toBeLessThanOrEqual(viewport.height + 1);
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
      await new Promise((r) => setTimeout(r, 2500));
      await route.continue();
    });
    await page.goto("/search?q=branch");
    await expect(page.getByText(/Searching…/)).toBeVisible({
      timeout: 10000,
    });
    // The wake hint appears while still waiting (500ms into a 2.5s request)
    await expect(
      page.getByText(/scaling up from zero/i),
    ).toBeVisible({ timeout: 2000 });
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
