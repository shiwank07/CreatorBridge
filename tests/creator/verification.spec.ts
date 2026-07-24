import { expect, test } from "@playwright/test";

test.describe("creator verification", () => {
  test("shows the creator verification workflow without horizontal overflow", async ({ page }) => {
    await page.goto("/dashboard/verification");
    await expect(page.getByRole("heading", { name: "Creator verification" })).toBeVisible();
    await expect(page.getByText("Verification code")).toBeVisible();
    await expect(page.getByRole("button", { name: /copy code/i })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`is responsive at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/dashboard/verification");
      await expect(page.getByRole("heading", { name: "Creator verification" })).toBeVisible();
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
    });
  }
});
