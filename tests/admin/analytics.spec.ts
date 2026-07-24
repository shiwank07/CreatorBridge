import { expect, test } from "@playwright/test";

test("admin analytics exposes growth, verification backlog, and operational health", async ({ page }) => {
  await page.goto("/admin/analytics?range=all");
  await expect(page.getByRole("heading", { name: "Platform analytics" })).toBeVisible();
  await expect(page.getByTestId("analytics-kpi").filter({ hasText: "Total users" })).toBeVisible();
  await expect(page.getByText("Operational health")).toBeVisible();
  await expect(page.getByText(/verification request/).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
