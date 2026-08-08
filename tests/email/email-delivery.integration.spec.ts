import { expect, test } from "@playwright/test";
import mongoose from "mongoose";

import { EmailNotification } from "../../lib/models/EmailNotification";
import { processResendWebhook } from "../../lib/email/resend-webhook";
import { recoverStaleEmailProcessing } from "../../lib/email/email-recovery";
import { getIsolatedMongoUri } from "../helpers/isolated-mongo";

const databaseUri = getIsolatedMongoUri("ANALYTICS_TEST_MONGODB_URI");
const runId = `email-delivery-integration-${Date.now()}`;

test.describe("durable email delivery claims", () => {
  test.skip(!databaseUri, "ANALYTICS_TEST_MONGODB_URI must point to an isolated test database.");
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async () => {
    await mongoose.connect(databaseUri!);
    await EmailNotification.syncIndexes();
  });

  test.afterAll(async () => {
    await EmailNotification.deleteMany({ deliveryKey: { $regex: `^${runId}` } });
    await mongoose.disconnect();
  });

  test("unique index allows only one concurrent logical delivery claim", async () => {
    const deliveryKey = `${runId}:concurrent`;
    const claim = () => EmailNotification.findOneAndUpdate(
      { deliveryKey, status: { $exists: false } },
      {
        $setOnInsert: { deliveryKey, recipient: "test@example.com", event: "test", createdAt: new Date() },
        $set: { status: "processing", updatedAt: new Date() },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true },
    ).then(() => "claimed").catch((error: unknown) =>
      typeof error === "object" && error && "code" in error && error.code === 11000 ? "duplicate" : Promise.reject(error),
    );
    const outcomes = await Promise.all([claim(), claim()]);
    expect(outcomes.sort()).toEqual(["claimed", "duplicate"]);
    expect(await EmailNotification.countDocuments({ deliveryKey })).toBe(1);
  });

  test("distinct claims omit webhook event IDs and do not collide with an existing empty array", async () => {
    const legacyKey = `${runId}:legacy-empty-events`;
    const firstKey = `${runId}:first-without-events`;
    const secondKey = `${runId}:second-without-events`;
    await EmailNotification.collection.insertOne({
      deliveryKey: legacyKey, recipient: "test@example.com", event: "test", status: "sent",
      attempts: 1, retryable: false, webhookEventIds: [], createdAt: new Date(), updatedAt: new Date(),
    });

    const claim = (deliveryKey: string) => EmailNotification.findOneAndUpdate(
      { deliveryKey, status: { $exists: false } },
      {
        $setOnInsert: { deliveryKey, recipient: "test@example.com", event: "test", createdAt: new Date() },
        $set: { status: "processing", updatedAt: new Date() },
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true },
    );
    const [first, second] = await Promise.all([claim(firstKey), claim(secondKey)]);

    expect(first?.webhookEventIds).toBeUndefined();
    expect(second?.webhookEventIds).toBeUndefined();
    expect(await EmailNotification.collection.countDocuments({
      deliveryKey: { $in: [firstKey, secondKey] }, webhookEventIds: { $exists: false },
    })).toBe(2);
  });

  test("failed delivery can be claimed once for controlled retry while permanent failure cannot", async () => {
    const retryKey = `${runId}:retry`;
    await EmailNotification.create({ deliveryKey: retryKey, recipient: "test@example.com", event: "test", status: "failed", attempts: 1 });
    const retried = await EmailNotification.findOneAndUpdate(
      { deliveryKey: retryKey, status: "failed" },
      { $set: { status: "processing", lastAttemptAt: new Date() }, $inc: { attempts: 1 } },
      { new: true },
    );
    expect(retried?.attempts).toBe(2);
    await EmailNotification.updateOne({ deliveryKey: retryKey }, { $set: { status: "permanent_failed" } });
    expect(await EmailNotification.findOneAndUpdate(
      { deliveryKey: retryKey, status: "failed" },
      { $set: { status: "processing" }, $inc: { attempts: 1 } },
      { new: true },
    )).toBeNull();
  });

  test("duplicate webhook events are idempotent and terminal states do not move backwards", async () => {
    const deliveryKey = `${runId}:webhook`;
    await EmailNotification.create({
      deliveryKey, recipient: "test@example.com", event: "test", status: "sent",
      providerId: `${runId}-provider`, attempts: 1,
    });
    const event = { eventId: `${runId}-event`, type: "email.delivered", emailId: `${runId}-provider`, createdAt: new Date().toISOString() };
    expect(await processResendWebhook(event)).toEqual({ processed: true });
    expect(await processResendWebhook(event)).toEqual({ duplicate: true });
    await processResendWebhook({ ...event, eventId: `${runId}-late`, type: "email.sent" });
    expect((await EmailNotification.findOne({ deliveryKey }))?.status).toBe("delivered");
  });

  test("missing webhook event IDs accept the first real ID and real IDs stay unique", async () => {
    const firstKey = `${runId}:first-real-event`;
    const secondKey = `${runId}:duplicate-real-event`;
    const eventId = `${runId}-unique-webhook-event`;
    const first = await EmailNotification.create({
      deliveryKey: firstKey, recipient: "test@example.com", event: "test", status: "sent",
      providerId: `${runId}-first-provider`, attempts: 1,
    });
    expect(first.webhookEventIds).toBeUndefined();

    await EmailNotification.updateOne({ _id: first._id }, { $addToSet: { webhookEventIds: eventId } });
    expect((await EmailNotification.findById(first._id))?.webhookEventIds).toEqual([eventId]);

    const second = await EmailNotification.create({
      deliveryKey: secondKey, recipient: "test@example.com", event: "test", status: "sent",
      providerId: `${runId}-second-provider`, attempts: 1,
    });
    await expect(EmailNotification.updateOne(
      { _id: second._id },
      { $addToSet: { webhookEventIds: eventId } },
    )).rejects.toMatchObject({ code: 11000, keyPattern: { webhookEventIds: 1 } });
  });

  test("stale processing is recovered without retrying exhausted records", async () => {
    const stale = new Date(Date.now() - 60 * 60_000);
    await EmailNotification.create([
      { deliveryKey: `${runId}:stale`, recipient: "test@example.com", event: "test", status: "processing", attempts: 1, lastAttemptAt: stale },
      { deliveryKey: `${runId}:exhausted`, recipient: "test@example.com", event: "test", status: "processing", attempts: 4, lastAttemptAt: stale },
    ]);
    await recoverStaleEmailProcessing({ timeoutMs: 15 * 60_000 });
    expect((await EmailNotification.findOne({ deliveryKey: `${runId}:stale` }))?.retryable).toBeTruthy();
    expect((await EmailNotification.findOne({ deliveryKey: `${runId}:exhausted` }))?.status).toBe("permanent_failed");
  });
});
