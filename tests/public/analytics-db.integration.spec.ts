import { expect, test } from "@playwright/test";
import mongoose from "mongoose";

import { parseAnalyticsRange } from "../../lib/analytics/core";
import { aggregateCollaborationsForOwnership } from "../../lib/analytics/service";
import { BrandInquiry } from "../../lib/models/BrandInquiry";
import { InAppNotification } from "../../lib/models/InAppNotification";
import { getIsolatedMongoUri } from "../helpers/isolated-mongo";

const databaseUri = getIsolatedMongoUri("ANALYTICS_TEST_MONGODB_URI");
const runId = `analytics-integration-${Date.now()}`;
const brandA = new mongoose.Types.ObjectId();
const brandB = new mongoose.Types.ObjectId();
const creatorA = new mongoose.Types.ObjectId();
const creatorB = new mongoose.Types.ObjectId();
const now = new Date("2026-07-25T12:00:00Z");
const period = parseAnalyticsRange("30d", now);

test.describe("MongoDB analytics integration", () => {
  test.skip(!databaseUri, "ANALYTICS_TEST_MONGODB_URI must point to an isolated test database.");
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async () => {
    await mongoose.connect(databaseUri!);
  });

  test.afterAll(async () => {
    await Promise.all([
      BrandInquiry.collection.deleteMany({ seedKey: { $regex: `^${runId}` } }),
      InAppNotification.collection.deleteMany({ seedKey: { $regex: `^${runId}` } }),
    ]);
    await mongoose.disconnect();
  });

  test("real pipelines preserve event time, currency, view attribution, and account privacy", async () => {
    const createdAt = new Date("2026-07-01T00:00:00Z");
    await BrandInquiry.collection.insertMany([
      { seedKey: `${runId}-a1`, brandUserId: brandA, creatorUserId: creatorA, status: "COMPLETED", createdAt, firstCreatorViewedAt: new Date("2026-07-02T00:00:00Z"), firstCreatorResponseAt: new Date("2026-07-03T00:00:00Z"), acceptedAt: new Date("2026-07-04T00:00:00Z"), completedAt: new Date("2026-07-10T00:00:00Z"), currentOfferAmount: 100, currency: "INR" },
      { seedKey: `${runId}-a2`, brandUserId: brandA, creatorUserId: creatorB, status: "COMPLETED", createdAt, acceptedAt: new Date("2026-07-04T00:00:00Z"), completedAt: new Date("2026-07-11T00:00:00Z"), currentOfferAmount: 20, currency: "USD" },
      { seedKey: `${runId}-b1`, brandUserId: brandB, creatorUserId: creatorB, status: "DECLINED", createdAt, rejectedAt: new Date("2026-07-05T00:00:00Z"), currentOfferAmount: 999, currency: "INR" },
    ]);
    const summaryA = await aggregateCollaborationsForOwnership({ brandUserId: brandA }, period);
    const summaryB = await aggregateCollaborationsForOwnership({ brandUserId: brandB }, period);
    expect(summaryA.total).toBe(2);
    expect(summaryA.completed).toBe(2);
    expect(summaryA.funnel.find((stage) => stage.label === "Viewed")?.count).toBe(2);
    expect(summaryA.completedValueByCurrency).toEqual(expect.arrayContaining([
      expect.objectContaining({ currency: "INR", amount: 100 }),
      expect.objectContaining({ currency: "USD", amount: 20 }),
    ]));
    expect(summaryB.total).toBe(1);
    expect(summaryB.completed).toBe(0);
    expect(summaryB.rejected).toBe(1);
  });

  test("notification period query excludes older notifications", async () => {
    await InAppNotification.collection.insertMany([
      { seedKey: `${runId}-notification-current`, recipientUserId: brandA, event: "test", title: "Current", message: "Current", href: "/", isRead: false, createdAt: new Date("2026-07-10T00:00:00Z"), updatedAt: new Date("2026-07-10T00:00:00Z") },
      { seedKey: `${runId}-notification-old`, recipientUserId: brandA, event: "test", title: "Old", message: "Old", href: "/", isRead: false, createdAt: new Date("2025-01-10T00:00:00Z"), updatedAt: new Date("2025-01-10T00:00:00Z") },
    ]);
    expect(await InAppNotification.countDocuments({ createdAt: { $gte: period.start, $lt: period.end } })).toBe(1);
  });

  test("conditional migration-style writes do not overwrite concurrent timestamps", async () => {
    const id = new mongoose.Types.ObjectId();
    const runtimeTimestamp = new Date("2026-07-20T00:00:00Z");
    await BrandInquiry.collection.insertOne({ _id: id, seedKey: `${runId}-race`, status: "ACCEPTED", acceptedAt: runtimeTimestamp, createdAt: new Date("2026-07-01T00:00:00Z") });
    const result = await BrandInquiry.updateOne(
      { _id: id, $or: [{ acceptedAt: null }, { acceptedAt: { $exists: false } }] },
      { $set: { acceptedAt: new Date("2026-07-05T00:00:00Z") } },
    );
    expect(result.modifiedCount).toBe(0);
    expect((await BrandInquiry.findById(id).lean())?.acceptedAt).toEqual(runtimeTimestamp);
  });

  test("real aggregation totals remain exact above ten thousand records", async () => {
    const bulk = Array.from({ length: 10_001 }, (_, index) => ({
      seedKey: `${runId}-scale-${index}`,
      brandUserId: brandA,
      creatorUserId: creatorA,
      status: "PENDING_CREATOR_RESPONSE",
      createdAt: new Date("2026-07-15T00:00:00Z"),
    }));
    for (let offset = 0; offset < bulk.length; offset += 1000) await BrandInquiry.collection.insertMany(bulk.slice(offset, offset + 1000), { ordered: false });
    const startedAt = performance.now();
    const summary = await aggregateCollaborationsForOwnership({ brandUserId: brandA }, period);
    expect(summary.total).toBe(10_003);
    expect(performance.now() - startedAt).toBeLessThan(30_000);
  });
});
