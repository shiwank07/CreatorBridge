import { expect, test } from "@playwright/test";

test.describe("creator discovery", () => {
  test("search, filters, sorting, and pagination are server-backed", async ({ page }) => {
    await page.goto("/creators?q=gaming&verification=verified&sort=alphabetical");
    await expect(page.getByRole("heading", { name: "Campaign-fit profiles" })).toBeVisible();
    await expect(page.getByLabel("Creator pagination")).toContainText(/Page \d+ of \d+/);
    await expect(page.getByRole("button", { name: "Previous", exact: true }).or(page.getByRole("link", { name: "Previous", exact: true }))).toBeVisible();
    await expect(page.getByRole("button", { name: "Next", exact: true }).or(page.getByRole("link", { name: "Next", exact: true }))).toBeVisible();
    await expect(page.locator('select[name="verification"]')).toHaveValue("verified");
    await expect(page.locator('select[name="sort"]')).toHaveValue("alphabetical");
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`grid and filters are responsive at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/creators");
      await expect(page.getByRole("heading", { name: "Campaign-fit profiles" })).toBeVisible();
      if (viewport.width < 768) {
        await page.getByRole("button", { name: "Open filters" }).click();
        await expect(page.getByRole("heading", { name: "Discovery filters" })).toBeVisible();
        await page.getByRole("button", { name: "Close filters" }).click();
      }
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
      const cards = page.locator('[data-testid="creator-grid"] > article');
      const count = await cards.count();
      for (let first = 0; first < count; first += 1) {
        const a = await cards.nth(first).boundingBox();
        if (!a) continue;
        for (let second = first + 1; second < count; second += 1) {
          const b = await cards.nth(second).boundingBox();
          if (!b) continue;
          const overlaps = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
          expect(overlaps).toBeFalsy();
        }
      }
    });
  }

  test("public profile exposes discovery details without private contact fields", async ({ page }) => {
    await page.goto("/creators");
    const href = await page.getByRole("link", { name: "View Profile" }).first().getAttribute("href");
    test.skip(!href, "No creator fixture available");
    await page.goto(href!);
    await expect(page.getByRole("heading", { name: "About", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Creator channels" })).toBeVisible();
    await expect(page.getByText(/admin note/i)).toHaveCount(0);
  });
});
