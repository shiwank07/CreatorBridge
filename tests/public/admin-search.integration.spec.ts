import { expect, test } from "@playwright/test";
import mongoose from "mongoose";

import { BrandInquiry } from "../../lib/models/BrandInquiry";
import { BrandProfile } from "../../lib/models/BrandProfile";
import { CreatorProfile } from "../../lib/models/CreatorProfile";
import { EmailNotification } from "../../lib/models/EmailNotification";
import { User } from "../../lib/models/User";
import {
  getAdminBrandsPage,
  getAdminCollaborationsPage,
  getAdminContactsPage,
  getAdminCreatorsPage,
  getAdminEmailLogsPage,
  getAdminUsersPage,
} from "../../lib/queries/admin";
import { getIsolatedMongoUri } from "../helpers/isolated-mongo";

const databaseUri = getIsolatedMongoUri("ANALYTICS_TEST_MONGODB_URI");
const runId = `admin-search-${Date.now()}`;
const createdIds: mongoose.Types.ObjectId[] = [];

test.describe("dataset-wide admin search", () => {
  test.skip(!databaseUri, "ANALYTICS_TEST_MONGODB_URI must point to an isolated test database.");
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.beforeAll(async () => {
    await mongoose.connect(databaseUri!);
    const users = Array.from({ length: 75 }, (_, index) => {
      const id = new mongoose.Types.ObjectId();
      createdIds.push(id);
      return {
        _id: id,
        clerkId: `${runId}-clerk-${index}`,
        email: `${runId}-${index}@example.test`,
        username: `${runId}-${index}`,
        name: index === 64 ? `Beyond First Page ${runId}` : `Search Fixture ${String(index).padStart(2, "0")}`,
        avatar: "",
        role: index % 2 ? "brand" : "creator",
        onboardingComplete: true,
        accountStatus: index % 5 === 0 ? "suspended" : "active",
        emailVerified: true,
        phoneVerified: false,
        subscriptionTier: "free",
        subscriptionExpiry: null,
        isFeatured: false,
        isVerified: false,
        trustReviewStatus: "clear",
        createdAt: new Date(2026, 0, index + 1),
        updatedAt: new Date(2026, 0, index + 1),
      };
    });
    await User.collection.insertMany(users);
    await CreatorProfile.collection.insertMany(users.filter((user) => user.role === "creator").map((user, index) => ({
      userId: user._id,
      verificationStatus: index % 3 === 0 ? "pending" : "verified",
      verificationPlatform: "youtube",
      youtubeHandle: index === 32 ? `special.handle[${runId}]` : `fixture-${index}`,
      youtubeUrl: `https://youtube.test/${runId}/${index}`,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })));
    await BrandProfile.collection.insertMany(users.filter((user) => user.role === "brand").map((user, index) => ({
      userId: user._id,
      companyName: index === 32 ? `Beyond Brand ${runId}` : `Fixture Brand ${String(index).padStart(2, "0")}`,
      contactName: user.name,
      contactEmail: user.email,
      website: `https://${runId}-${index}.example.test`,
      industry: "Technology",
      verificationStatus: index % 3 === 0 ? "pending" : "verified",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })));
    await BrandInquiry.collection.insertMany(Array.from({ length: 75 }, (_, index) => ({
      seedKey: `${runId}-collaboration-${index}`,
      companyName: index === 64 ? `Beyond Collaboration ${runId}` : `Collaboration Brand ${index}`,
      contactName: "Test",
      email: `${runId}-collab-${index}@example.test`,
      campaignGoal: index === 64 ? `Rare campaign ${runId}` : `Campaign ${index}`,
      campaignTitle: `Title ${index}`,
      budgetRange: "INR 10,000",
      timeline: "One month",
      creatorUsername: `${runId}-${index}`,
      source: "general_form",
      status: index % 3 === 0 ? "ACCEPTED" : "NEW",
      createdAt: new Date(2026, 1, index + 1),
      updatedAt: new Date(2026, 1, index + 1),
    })));
    await EmailNotification.collection.insertMany(Array.from({ length: 75 }, (_, index) => ({
      recipient: index === 64 ? `beyond-${runId}@example.test` : `${runId}-mail-${index}@example.test`,
      event: index % 2 ? "verification_event" : "collaboration_event",
      status: index % 3 === 0 ? "failed" : "sent",
      providerId: `${runId}-provider-${index}`,
      createdAt: new Date(2026, 2, index + 1),
    })));
  });

  test.afterAll(async () => {
    await Promise.all([
      User.collection.deleteMany({ clerkId: { $regex: `^${runId}` } }),
      CreatorProfile.collection.deleteMany({ userId: { $in: createdIds } }),
      BrandProfile.collection.deleteMany({ userId: { $in: createdIds } }),
      BrandInquiry.collection.deleteMany({ seedKey: { $regex: `^${runId}` } }),
      EmailNotification.collection.deleteMany({ providerId: { $regex: `^${runId}` } }),
    ]);
    await mongoose.disconnect();
  });

  test("search finds records beyond page one and counts the complete filtered set", async () => {
    const creators = await getAdminCreatorsPage({ search: `Beyond First Page ${runId}`, page: 1 });
    expect(creators.items).toHaveLength(1);
    expect(creators.total).toBe(1);
    const brands = await getAdminBrandsPage({ search: `Beyond Brand ${runId}` });
    expect(brands.items).toHaveLength(1);
    const collaborations = await getAdminCollaborationsPage({ search: `Rare campaign ${runId}` });
    expect(collaborations.items).toHaveLength(1);
    const emails = await getAdminEmailLogsPage({ search: `beyond-${runId}` });
    expect(emails.items).toHaveLength(1);
  });

  test("filters apply before pagination and combine with search", async () => {
    const pending = await getAdminCreatorsPage({ verification: "pending", limit: 10 });
    expect(pending.total).toBeGreaterThan(10);
    expect(pending.items.every((item) => item.verificationStatus === "pending")).toBeTruthy();
    const users = await getAdminUsersPage({ role: "creator", status: "suspended", search: runId });
    expect(users.items.length).toBeGreaterThan(0);
    expect(users.items.every((item) => item.role === "creator" && item.accountStatus === "suspended")).toBeTruthy();
    const contacts = await getAdminContactsPage({ role: "brand", search: `Beyond Brand ${runId}` });
    expect(contacts.items).toHaveLength(1);
    const failed = await getAdminEmailLogsPage({ status: "failed", event: "verification_event", search: runId });
    expect(failed.items.every((item) => item.status === "failed" && item.event === "verification_event")).toBeTruthy();
  });

  test("sorting is global, pages do not overlap, and clearing search restores total", async () => {
    const first = await getAdminUsersPage({ search: runId, sort: "name_asc", page: 1, limit: 30 });
    const second = await getAdminUsersPage({ search: runId, sort: "name_asc", page: 2, limit: 30 });
    expect(first.total).toBe(75);
    const firstIds = new Set(first.items.map((item) => item.userId));
    expect(second.items.some((item) => firstIds.has(item.userId))).toBeFalsy();
    expect([...first.items, ...second.items].map((item) => item.name)).toEqual([...first.items, ...second.items].map((item) => item.name).sort());
    expect((await getAdminUsersPage({})).total).toBeGreaterThanOrEqual(75);
  });

  test("invalid, regex-special, and excessive inputs are safe and limits stay bounded", async () => {
    expect((await getAdminCreatorsPage({ search: `[${runId}]` })).total).toBeGreaterThanOrEqual(0);
    expect((await getAdminUsersPage({ search: "x".repeat(10_000), role: "invalid", status: "invalid", sort: "invalid", limit: 500 })).limit).toBe(50);
    expect((await getAdminUsersPage({ search: runId, limit: 7 })).items.length).toBeLessThanOrEqual(7);
  });
});
