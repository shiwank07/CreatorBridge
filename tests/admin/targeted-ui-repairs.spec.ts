import { expect, test } from "@playwright/test";

test.describe("targeted admin UI repairs", () => {
  test("mobile navigation is a complete keyboard-accessible drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");

    const trigger = page.getByRole("button", { name: "Open admin menu" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const drawer = page.getByRole("dialog", { name: "Admin navigation" });
    await expect(drawer).toBeVisible();
    for (const label of ["Overview", "Analytics", "Creators", "Brands", "Collaborations", "Verification Queue", "Reports", "Email Logs", "Users"]) {
      await expect(drawer.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("creator rows remain compact and email values do not expand columns", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/admin/creators");

    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();
    const heights = await rows.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    expect(Math.max(...heights)).toBeLessThanOrEqual(120);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });

  test("email logs summarize failures and expose full details on demand", async ({ page }) => {
    await page.goto("/admin/email-logs");
    const details = page.getByText("View error", { exact: true }).first();
    if (await details.isVisible()) {
      await details.click();
      await expect(page.locator("details[open]").first()).toBeVisible();
    }
    await expect(page.locator("body")).not.toContainText(/development message/i);
  });

  test("creator and brand records expose state-valid More menus", async ({ page }) => {
    for (const route of ["/admin/creators", "/admin/brands"]) {
      await page.goto(route);
      const trigger = page.locator("summary").filter({ hasText: "More" }).first();
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(page.getByText(/Reject|Restore|Hide|Suspend/, { exact: false }).first()).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });
});
