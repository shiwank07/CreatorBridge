import { expect, test } from "@playwright/test";

test("brand can save, view, and remove a creator without duplicates", async ({ page }) => {
  await page.goto("/creators");
  const card = page.locator('[data-testid="creator-grid"] > article').first();
  await expect(card).toBeVisible();
  const username = (await card.getByText(/^@/).first().textContent())?.replace(/^@/, "") ?? "";
  const button = card.getByRole("button", { name: /Save Creator|Saved/ });
  const initiallySaved = await button.getAttribute("aria-pressed") === "true";

  if (!initiallySaved) await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await page.goto("/dashboard/brand/saved-creators");
  await expect(page.getByRole("heading", { name: "Saved Creators" })).toBeVisible();
  await expect(page.getByText(`@${username}`, { exact: true })).toBeVisible();

  if (!initiallySaved) {
    const savedCard = page.locator('[data-testid="saved-creator-grid"] > article').filter({ hasText: `@${username}` });
    await savedCard.getByRole("button", { name: "Saved" }).click();
    await expect(savedCard.getByRole("button", { name: "Save Creator" })).toBeVisible();
  }
});
