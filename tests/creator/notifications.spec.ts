import { expect, test } from "@playwright/test";

test.describe("creator notifications", () => {
  test("bell, filters, read controls, and mark-all remain usable", async ({ page }) => {
    await page.goto("/dashboard/creator");
    const bell = page.getByRole("button", { name: /Open notifications/ });
    await expect(bell).toBeVisible();
    await bell.click();
    await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
    const markAll = page.getByRole("button", { name: "Mark all as read" });
    await expect(markAll).toBeVisible();
    if (await markAll.isEnabled()) {
      await page.route("**/api/notifications/read-all", (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ unreadCount: 0, readAt: new Date().toISOString() }) }),
      );
      await markAll.click();
      await expect(markAll).toBeDisabled();
    }
    await page.getByRole("button", { name: "Close notifications" }).last().click();

    await page.goto("/notifications?status=all&page=1");
    await expect(page.getByRole("heading", { name: "Your updates" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Unread", exact: true })).toBeVisible();
    const toggle = page.getByRole("button", { name: /Mark (read|unread)/ }).first();
    if (await toggle.isVisible().catch(() => false)) {
      const original = await toggle.textContent();
      await toggle.click();
      await expect(toggle).not.toHaveText(original ?? "");
      await toggle.click();
    }
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`notification drawer and page are contained at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/dashboard/creator");
      await page.getByRole("button", { name: /Open notifications/ }).click();
      const dialog = await page.getByRole("dialog", { name: "Notifications" }).boundingBox();
      expect(dialog).not.toBeNull();
      expect(dialog!.x).toBeGreaterThanOrEqual(0);
      expect(dialog!.x + dialog!.width).toBeLessThanOrEqual(viewport.width + 1);
      await page.getByRole("button", { name: "Close notifications" }).last().click();
      await page.goto("/notifications");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      const rows = await page.locator("section.bridge-card > div > div").evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom };
        }),
      );
      for (let index = 1; index < rows.length; index += 1) expect(rows[index - 1].bottom).toBeLessThanOrEqual(rows[index].top + 1);
    });
  }
});
