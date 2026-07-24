import { expect, test } from "@playwright/test";

test("brand notification feed exposes collaboration and message destinations safely", async ({ page }) => {
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Your updates" })).toBeVisible();
  const notificationLinks = page.locator('section.bridge-card a[href^="/"]');
  await expect(notificationLinks.first()).toBeVisible();
  const hrefs = await notificationLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  expect(hrefs.every((href) => href.startsWith("/") && !href.startsWith("//"))).toBe(true);
});
