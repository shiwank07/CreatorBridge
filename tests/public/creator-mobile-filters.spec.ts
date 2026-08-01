import { expect, test } from "@playwright/test";

test("mobile creator filters preserve URL state and support keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/creators?platform=youtube");
  const trigger = page.getByRole("button", { name: /Filters \(1\)/ });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Creator filters" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByLabel("Platform")).toHaveValue("youtube");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await drawer.getByLabel("Verification").selectOption("verified");
  await drawer.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/platform=youtube/);
  await expect(page).toHaveURL(/verification=verified/);
  expect(new URL(page.url()).searchParams.get("page")).not.toBe("2");
});
