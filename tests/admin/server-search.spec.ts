import { expect, test } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

loadEnv({ path: ".env.local", quiet: true });

const runId = `rc-admin-search-${Date.now()}`;
const userIds = Array.from({ length: 35 }, () => new ObjectId());
let client: MongoClient;
const databaseName = process.env.MONGODB_DB_NAME || "test";

test.describe("canonical dataset-wide admin search", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db(databaseName);
    const now = Date.now();
    await db.collection("users").insertMany(userIds.map((id, index) => ({
      _id: id,
      clerkId: `${runId}-${index}`,
      email: `${runId}-${index}@example.test`,
      username: `${runId}-${index}`,
      name: index === 34 ? `Beyond Page Creator ${runId}` : `RC Search Fixture ${String(index).padStart(2, "0")} ${runId}`,
      avatar: "",
      role: "creator",
      onboardingComplete: true,
      accountStatus: index % 2 ? "active" : "suspended",
      emailVerified: true,
      phoneVerified: false,
      subscriptionTier: "free",
      subscriptionExpiry: null,
      isFeatured: false,
      isVerified: false,
      trustReviewStatus: "clear",
      createdAt: new Date(now - (index + 1) * 60_000),
      updatedAt: new Date(now - (index + 1) * 60_000),
    })));
    await db.collection("creatorprofiles").insertMany(userIds.map((userId, index) => ({
      userId,
      verificationStatus: index % 2 ? "pending" : "verified",
      verificationPlatform: "youtube",
      youtubeHandle: `${runId}-${index}`,
      createdAt: new Date(now - (index + 1) * 60_000),
      updatedAt: new Date(now - (index + 1) * 60_000),
    })));
  });

  test.afterAll(async () => {
    const db = client.db(databaseName);
    await Promise.all([
      db.collection("creatorprofiles").deleteMany({ userId: { $in: userIds } }),
      db.collection("users").deleteMany({ _id: { $in: userIds } }),
    ]);
    await client.close();
  });

  test("search, refresh, pagination, filters, clear, and back navigation use the URL", async ({ page }) => {
    await page.goto("/admin/creators");
    const search = page.getByPlaceholder("Search name, email, handle, or profile URL");
    await search.fill(runId);
    await expect(page).toHaveURL(new RegExp(`search=${runId}`));
    await expect(page.getByText(`Showing 1–30 of 35`)).toBeVisible();

    await page.getByRole("link", { name: "Next" }).click();
    await expect(page).toHaveURL(new RegExp(`page=2.*search=${runId}|search=${runId}.*page=2`));
    await page.reload();
    await expect(search).toHaveValue(runId);

    await search.fill(`Beyond Page Creator ${runId}`);
    await expect(page).toHaveURL(new RegExp("search=Beyond"));
    await expect(page.getByText(`Beyond Page Creator ${runId}`).first()).toBeVisible();

    await page.getByLabel("Verification").selectOption("pending");
    await expect(page).toHaveURL(/verification=pending/);
    await expect(page).not.toHaveURL(/page=2/);
    await page.goBack();
    await expect(page).not.toHaveURL(/verification=pending/);

    await page.getByRole("link", { name: "Clear", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/creators$/);
  });
});
