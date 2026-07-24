import { expect, test } from "@playwright/test";

test.describe("admin creator verification queue", () => {
  test("supports status filters, search, and pagination", async ({ page }) => {
    await page.goto("/admin/verification");
    await expect(page.getByRole("heading", { name: "Verification Queue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pending" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approved" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Rejected" })).toBeVisible();
    await expect(page.getByPlaceholder("Name, username, email, platform")).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
  });

  test("contains the queue on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/verification");
    await expect(page.getByRole("heading", { name: "Verification Queue" })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  });
});
