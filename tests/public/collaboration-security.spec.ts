import { expect, test } from "@playwright/test";

const id = "000000000000000000000000";

test("collaboration mutations require authentication", async ({ request }) => {
  const creatorResponse = await request.post(`/api/collaborations/${id}/creator-response`, {
    data: { action: "counter_offer", amount: 50000, note: "Updated scope and usage rights." },
  });
  expect(creatorResponse.status()).toBe(401);

  const brandResponse = await request.post(`/api/collaborations/${id}/brand-response`, {
    data: { action: "accept_counter", note: "Accepted." },
  });
  expect([401, 404]).toContain(brandResponse.status());

  const create = await request.post("/api/brand-inquiries", {
    data: {
      companyName: "Security Test",
      contactName: "Test User",
      email: "security@example.com",
      website: "",
      campaignTitle: "Authentication boundary",
      campaignType: "Sponsored content",
      campaignGoal: "Validate that anonymous users cannot create collaboration offers.",
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      attachments: [],
      deliverables: ["Dedicated video"],
      targetNiches: ["Tech"],
      targetPlatforms: ["youtube"],
      initialOfferAmount: 50000,
      isNegotiable: true,
      timeline: "1 week",
      creatorUsername: "does-not-matter",
    },
  });
  expect(create.status()).toBe(401);
});
