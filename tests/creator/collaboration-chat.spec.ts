import { expect, test } from "@playwright/test";

test("creator can open collaboration chat and reply", async ({ page }) => {
  await page.goto("/dashboard/creator#collaborations");
  const activeCard = page.getByTestId("collaboration-card").filter({ hasText: /Accepted|Working|Proof Submitted|Revision Requested/i }).first();
  await expect(activeCard).toBeVisible();
  const href = await activeCard.getByRole("link").first().getAttribute("href");
  await page.goto(href!);
  await expect(page.getByRole("region", { name: "Collaboration chat" })).toBeVisible();

  const reply = `Playwright creator reply ${Date.now()}`;
  await page.getByRole("textbox", { name: "Message", exact: true }).fill(reply);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(reply)).toBeVisible();
});

test("collaboration chat blocks an unrelated creator", async ({ page }) => {
  const response = await page.request.get("/api/collaborations/000000000000000000000001/chat");
  expect([403, 404]).toContain(response.status());
});
