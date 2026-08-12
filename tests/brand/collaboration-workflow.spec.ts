import { expect, test } from "@playwright/test";

test.describe("brand collaboration workflow", () => {
  test("brand can open its own collaboration detail", async ({ page }) => {
    await page.goto("/dashboard/brand#campaigns");
    const collaboration = page.locator('a[href^="/dashboard/collaborations/"]').first();
    await expect(collaboration).toBeVisible();
    await collaboration.click();
    await expect(page).toHaveURL(/\/dashboard\/collaborations\/[a-f\d]{24}$/i);
    await expect(page.getByText("Collaboration Details", { exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Application error|Internal Server Error/i);
  });

  test("offer composer captures production campaign fields", async ({ page }) => {
    await page.goto("/creators");
    const start = page.getByRole("link", { name: "Start Collaboration" }).first();
    await expect(start).toBeVisible();
    await start.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel("Campaign title")).toBeVisible();
    await expect(page.getByLabel("Campaign type")).toBeVisible();
    await expect(page.getByLabel("Deadline")).toBeVisible();
    await expect(page.getByLabel("Offer amount (INR)")).toBeVisible();
  });

  test("collaboration screens remain contained on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard/brand");
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  });
});
