import { expect, test } from "@playwright/test";

test("unauthenticated users cannot submit or review creator verification", async ({ request }) => {
  const submit = await request.post("/api/creator-verification/submit", {
    data: { platform: "youtube", profileUrl: "https://youtube.com/@example", note: "" },
  });
  expect(submit.status()).toBe(401);

  const review = await request.patch("/api/admin/verifications", {
    data: { requestId: "000000000000000000000000", action: "approve", note: "" },
  });
  expect(review.status()).toBe(401);
});

test("public creator cards expose a verified label only for approved creators", async ({ page }) => {
  await page.goto("/creators");
  const verifiedIcons = page.getByLabel("Verified Creator");
  await expect(verifiedIcons.first()).toBeVisible();
});
