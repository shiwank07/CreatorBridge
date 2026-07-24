import { expect, test } from "@playwright/test";

test("unauthenticated notification APIs are rejected", async ({ request }) => {
  const list = await request.get("/api/notifications");
  expect(list.status()).toBe(401);
  const update = await request.patch("/api/notifications/000000000000000000000001/read", {
    data: { isRead: true },
  });
  expect(update.status()).toBe(401);
  const all = await request.patch("/api/notifications/read-all");
  expect(all.status()).toBe(401);
});
