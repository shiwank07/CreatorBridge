import { expect, test } from "@playwright/test";

test("creator all-time KPI values match seeded collaborations", async ({ page }) => {
  await page.goto("/dashboard/creator/analytics?range=all");
  await expect(page.getByRole("heading", { name: "Creator analytics" })).toBeVisible();
  await expect(page.locator('[data-testid="analytics-kpi"][data-label="Offers received"]')).toContainText("4");
  await expect(page.locator('[data-testid="analytics-kpi"][data-label="Accepted"]')).toContainText("3");
  await expect(page.locator('[data-testid="analytics-kpi"][data-label="Terminal success rate"]')).toContainText("100%");
});

test("creator date range is URL-backed and private to creator role", async ({ page }) => {
  await page.goto("/dashboard/creator/analytics");
  await page.getByRole("link", { name: "All time" }).click();
  await expect(page).toHaveURL(/range=all/);
  await page.goto("/dashboard/brand/analytics?range=all");
  await expect(page).toHaveURL(/\/dashboard\/creator\/analytics/);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`creator analytics is contained at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/dashboard/creator/analytics?range=all");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const cards = await page.getByTestId("analytics-kpi").evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    }));
    for (let first = 0; first < cards.length; first += 1) for (let second = first + 1; second < cards.length; second += 1) {
      const overlap = cards[first].left < cards[second].right && cards[first].right > cards[second].left && cards[first].top < cards[second].bottom && cards[first].bottom > cards[second].top;
      expect(overlap).toBe(false);
    }
  });
}
