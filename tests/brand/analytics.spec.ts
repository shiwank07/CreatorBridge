import { expect, test } from "@playwright/test";

test("brand analytics matches seeded requests and currency-separated final values", async ({ page }) => {
  await page.goto("/dashboard/brand/analytics?range=all");
  await expect(page.getByRole("heading", { name: "Brand analytics" })).toBeVisible();
  await expect(page.locator('[data-testid="analytics-kpi"][data-label="Requests sent"]')).toContainText("10");
  await expect(page.locator('[data-testid="analytics-kpi"][data-label="Accepted"]')).toContainText("7");
  await expect(page.locator('[data-testid="analytics-kpi"][data-label="Completed spend"]')).toContainText("₹");
  await expect(page.locator('[data-testid="analytics-kpi"][data-label="Saved creators · All-time"]')).toBeVisible();
});

test("brand cannot access creator analytics", async ({ page }) => {
  await page.goto("/dashboard/creator/analytics?range=all");
  await expect(page).toHaveURL(/\/dashboard\/brand\/analytics/);
});
