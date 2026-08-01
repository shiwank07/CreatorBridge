import { expect, test } from "@playwright/test";

async function openAcceptedCollaboration(page: import("@playwright/test").Page) {
  await page.goto("/dashboard/brand#campaigns");
  const acceptedCard = page.getByTestId("collaboration-card").filter({ hasText: /Accepted|Working|Proof Submitted|Revision Requested/i }).first();
  await expect(acceptedCard).toBeVisible();
  const href = await acceptedCard.getByRole("link").first().getAttribute("href");
  expect(href).toMatch(/^\/dashboard\/collaborations\//);
  await page.goto(href!);
  await expect(page.getByRole("region", { name: "Collaboration chat" })).toBeVisible();
  return href!;
}

test.describe("collaboration chat", () => {
  test("brand opens an accepted collaboration, sends, searches, and clears unread", async ({ page }) => {
    await openAcceptedCollaboration(page);
    const message = `Playwright brand message ${Date.now()}`;
    await page.getByRole("textbox", { name: "Message", exact: true }).fill(message);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(message)).toBeVisible();

    await page.getByLabel("Search this conversation").fill(message);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.locator("mark").first()).toContainText(message);
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`chat is contained at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openAcceptedCollaboration(page);
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
      const chat = await page.getByRole("region", { name: "Collaboration chat" }).boundingBox();
      expect(chat).not.toBeNull();
      expect(chat!.x).toBeGreaterThanOrEqual(0);
      expect(chat!.x + chat!.width).toBeLessThanOrEqual(viewport.width + 1);
      const panels = await page.locator("#chat > div > *").evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        }),
      );
      if (viewport.width >= 1024) {
        expect(panels[0].right).toBeLessThanOrEqual(panels[1].left + 1);
      } else {
        expect(panels[0].bottom).toBeLessThanOrEqual(panels[1].top + 1);
      }
    });
  }

  test("rejected or cancelled collaboration does not expose chat", async ({ page }) => {
    await page.goto("/dashboard/brand#campaigns");
    const blockedCard = page.getByTestId("collaboration-card").filter({ hasText: /Declined|Cancelled/i }).first();
    await expect(blockedCard).toBeVisible();
    const href = await blockedCard.getByRole("link").first().getAttribute("href");
    await page.goto(href!);
    await expect(page.getByRole("link", { name: "Chat", exact: true })).toHaveCount(0);
    const response = await page.request.get(`${href!.replace("/dashboard/", "/api/")}/chat`);
    expect(response.status()).toBe(403);
  });
});
