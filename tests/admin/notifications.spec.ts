import { expect, test } from "@playwright/test";

test("admin can open new verification request notifications", async ({ page }) => {
  await page.goto("/admin");
  const bell = page.getByRole("button", { name: /Open notifications/ });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark all as read" })).toBeVisible();
});
