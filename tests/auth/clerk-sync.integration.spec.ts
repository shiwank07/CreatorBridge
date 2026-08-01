import { expect, test } from "@playwright/test";
import mongoose from "mongoose";

import { anonymizeDeletedAccount } from "../../lib/account-deletion";
import {
  applyClerkUserEvent, claimClerkWebhookEvent, failClerkWebhookEvent, finishClerkWebhookEvent,
} from "../../lib/clerk-user-sync";
import { onboardingRoleFilter } from "../../lib/onboarding-role";
import { BrandInquiry } from "../../lib/models/BrandInquiry";
import { ClerkWebhookEvent } from "../../lib/models/ClerkWebhookEvent";
import { CreatorProfile } from "../../lib/models/CreatorProfile";
import { User } from "../../lib/models/User";
import { getIsolatedMongoUri } from "../helpers/isolated-mongo";

const databaseUri = getIsolatedMongoUri("ANALYTICS_TEST_MONGODB_URI");
const marker = `clerk-sync-${Date.now()}`;
const clerkId = (suffix: string) => `user_${marker}_${suffix}`;
const userEvent = (type: "user.created" | "user.updated", id: string, updatedAt: number, name: string) => ({
  type, object: "event", event_attributes: { http_request: { client_ip: "", user_agent: "" } },
  data: {
    id, updated_at: updatedAt, first_name: name, last_name: "", username: null, image_url: "",
    primary_email_address_id: "email_1",
    email_addresses: [{ id: "email_1", email_address: `${id}@example.test`, verification: { status: "verified" } }],
  },
}) as never;

test.describe("Clerk synchronization invariants", () => {
  test.skip(!databaseUri, "ANALYTICS_TEST_MONGODB_URI must point to an isolated test database.");
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async () => {
    await mongoose.connect(databaseUri!);
    await Promise.all([User.syncIndexes(), ClerkWebhookEvent.syncIndexes()]);
  });
  test.afterAll(async () => {
    const users = await User.find({ clerkId: { $regex: `^user_${marker}` } }).select("_id");
    const ids = users.map((user) => user._id);
    await Promise.all([
      CreatorProfile.deleteMany({ userId: { $in: ids } }),
      BrandInquiry.deleteMany({ $or: [{ brandUserId: { $in: ids } }, { creatorUserId: { $in: ids } }] }),
      User.deleteMany({ _id: { $in: ids } }),
      ClerkWebhookEvent.deleteMany({ eventId: { $regex: `^${marker}` } }),
    ]);
    await mongoose.disconnect();
  });

  test("duplicate and failed ledger deliveries are claimed safely", async () => {
    const input = { eventId: `${marker}:ledger`, eventType: "user.updated", clerkUserId: clerkId("ledger"), eventTimestamp: new Date() };
    const [first, duplicate] = await Promise.all([claimClerkWebhookEvent(input), claimClerkWebhookEvent(input)]);
    expect([first.claimed, duplicate.claimed].filter(Boolean)).toHaveLength(1);
    const claimed = first.claimed ? first : duplicate;
    await failClerkWebhookEvent(claimed.record!._id);
    const retry = await claimClerkWebhookEvent(input);
    expect(retry.claimed).toBeTruthy();
    expect(retry.record?.attempts).toBe(2);
    await finishClerkWebhookEvent(retry.record!._id, "processed");
    expect((await claimClerkWebhookEvent(input)).claimed).toBeFalsy();
  });

  test("newer updates win and a deletion tombstone rejects stale updates", async () => {
    const id = clerkId("ordering");
    const older = Date.now() - 20_000;
    const newer = Date.now() - 10_000;
    await applyClerkUserEvent(userEvent("user.created", id, older, "Older"), `${marker}:created`, new Date(older));
    await applyClerkUserEvent(userEvent("user.updated", id, newer, "Newer"), `${marker}:newer`, new Date(newer));
    await applyClerkUserEvent(userEvent("user.updated", id, older, "Stale"), `${marker}:older`, new Date(older));
    expect((await User.findOne({ clerkId: id }))?.name).toBe("Newer");
    await anonymizeDeletedAccount({
      clerkUserId: id, deletedAt: new Date(), eventId: `${marker}:delete`,
      eventTimestamp: new Date(newer + 5_000), source: "clerk_webhook",
    });
    await applyClerkUserEvent(userEvent("user.updated", id, newer, "Restored"), `${marker}:stale-after-delete`, new Date(newer));
    const deleted = await User.findOne({ clerkId: id });
    expect(deleted?.accountStatus).toBe("deleted");
    expect(deleted?.name).toBe("Deleted account");
  });

  test("concurrent conflicting onboarding permits only one completed role", async () => {
    const id = clerkId("roles");
    await User.create({ clerkId: id, email: `${id}@example.test`, username: `${marker}roles`, name: "Role Test", role: "creator", onboardingComplete: false });
    const claim = (role: "creator" | "brand") => User.findOneAndUpdate(
      onboardingRoleFilter(id, role), { $set: { role, onboardingComplete: true } }, { new: true },
    ).then((value) => value?.role ?? "blocked");
    const outcomes = await Promise.all([claim("creator"), claim("brand")]);
    expect(outcomes.filter((value) => value !== "blocked")).toHaveLength(1);
  });

  test("deletion removes public profile data and preserves anonymized collaboration history", async () => {
    const id = clerkId("delete");
    const user = await User.create({ clerkId: id, email: `${id}@example.test`, username: `${marker}delete`, name: "Delete Test", role: "creator", onboardingComplete: true });
    await CreatorProfile.create({ userId: user._id, bio: "Public profile" });
    const inquiry = await BrandInquiry.create({
      creatorUserId: user._id, companyName: "Preserved Brand", contactName: "Contact",
      email: "brand@example.test", campaignGoal: "Preserve marketplace history", budgetRange: "100",
      timeline: "One month", status: "NEW",
    });
    await anonymizeDeletedAccount({
      clerkUserId: id, deletedAt: new Date(), eventId: `${marker}:self-delete`,
      eventTimestamp: new Date(), source: "self_service",
    });
    expect(await CreatorProfile.exists({ userId: user._id })).toBeNull();
    expect(await User.exists({ _id: user._id, accountStatus: "active" })).toBeNull();
    expect(await BrandInquiry.exists({ _id: inquiry._id, creatorUserId: user._id })).toBeTruthy();
  });
});
