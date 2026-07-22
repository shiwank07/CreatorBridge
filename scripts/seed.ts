import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { createClerkClient } from "@clerk/nextjs/server";
import mongoose from "mongoose";

import { connectDB } from "../lib/db";
import { BrandInquiry } from "../lib/models/BrandInquiry";
import { BrandProfile } from "../lib/models/BrandProfile";
import { CreatorProfile } from "../lib/models/CreatorProfile";
import { InAppNotification } from "../lib/models/InAppNotification";
import { Review } from "../lib/models/Review";
import { User } from "../lib/models/User";

const SEED_PREFIX = "branzzo-demo-v1";
const DAY = 24 * 60 * 60 * 1000;
const BASE_DATE = new Date("2026-01-15T10:00:00.000Z");

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    process.env[match[1]] ??= value;
  }
}

const accounts = [
  { email: "admin+clerk_test@branzzo.com", legacyEmail: "admin@branzzo.test", username: "branzzoadmin", name: "Branzzo Admin", role: "admin" as const, verified: true },
  { email: "nike+clerk_test@branzzo.com", legacyEmail: "nike@branzzo.test", username: "nike", name: "Nike India", role: "brand" as const, verified: true },
  { email: "samsung+clerk_test@branzzo.com", legacyEmail: "samsung@branzzo.test", username: "samsung", name: "Samsung India", role: "brand" as const, verified: true },
  { email: "gamingcreator+clerk_test@branzzo.com", legacyEmail: "gamingcreator@branzzo.test", username: "gamingcreator", name: "Arjun Plays", role: "creator" as const, verified: false },
  { email: "techcreator+clerk_test@branzzo.com", legacyEmail: "techcreator@branzzo.test", username: "techcreator", name: "Meera Tech", role: "creator" as const, verified: false },
  { email: "lifestylecreator+clerk_test@branzzo.com", legacyEmail: "lifestylecreator@branzzo.test", username: "lifestylecreator", name: "Riya Living", role: "creator" as const, verified: false },
  { email: "fitnesscreator+clerk_test@branzzo.com", legacyEmail: "fitnesscreator@branzzo.test", username: "fitnesscreator", name: "Kabir Fit", role: "creator" as const, verified: false },
  { email: "financecreator+clerk_test@branzzo.com", legacyEmail: "financecreator@branzzo.test", username: "financecreator", name: "Naina Finance", role: "creator" as const, verified: false },
];

const creatorData = [
  { username: "gamingcreator", bio: "Competitive gamer sharing tactical guides, honest hardware tests, and esports stories for India's gaming community.", niche: ["Gaming", "Esports"], country: "India", followers: 428000, avgViews: 96000, engagement: 7.8, rate: 65000, platform: "youtube" as const },
  { username: "techcreator", bio: "Consumer-tech reviewer translating launches, comparisons, and buying advice into practical decisions.", niche: ["Technology", "Gadgets"], country: "India", followers: 315000, avgViews: 71000, engagement: 6.4, rate: 55000, platform: "youtube" as const },
  { username: "lifestylecreator", bio: "Modern lifestyle storyteller covering mindful routines, accessible fashion, travel, and home inspiration.", niche: ["Lifestyle", "Fashion"], country: "India", followers: 186000, avgViews: 48000, engagement: 8.2, rate: 42000, platform: "instagram" as const },
  { username: "fitnesscreator", bio: "Certified coach creating sustainable workouts, recovery education, and evidence-led nutrition content.", niche: ["Fitness", "Wellness"], country: "India", followers: 252000, avgViews: 63000, engagement: 7.1, rate: 48000, platform: "instagram" as const },
  { username: "financecreator", bio: "Personal-finance educator making budgeting, investing, taxes, and money habits easier for young professionals.", niche: ["Finance", "Education"], country: "India", followers: 149000, avgViews: 39000, engagement: 5.9, rate: 50000, platform: "youtube" as const },
];

async function getOrCreateClerkUser(
  clerk: ReturnType<typeof createClerkClient>,
  account: (typeof accounts)[number],
  password: string,
) {
  const response = await clerk.users.getUserList({ emailAddress: [account.email], limit: 2 });
  const matches = response.data.filter((user) =>
    user.emailAddresses.some((address) => address.emailAddress.toLowerCase() === account.email),
  );

  if (matches.length > 1) {
    throw new Error(`Multiple Clerk users already use ${account.email}; refusing to choose one.`);
  }
  if (matches[0]) {
    const user = await clerk.users.updateUser(matches[0].id, { password });
    return { user, created: false };
  }

  const [firstName, ...lastNameParts] = account.name.split(" ");
  const user = await clerk.users.createUser({
    emailAddress: [account.email],
    password,
    firstName,
    lastName: lastNameParts.join(" "),
  });
  return { user, created: true };
}

async function seed() {
  loadLocalEnv();
  if (!process.env.MONGODB_URI) throw new Error("Add MONGODB_URI to .env.local before running npm run seed.");
  if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error("Production seeding is disabled. Set SEED_ALLOW_PRODUCTION=true only after confirming the target database.");
  }
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("Add CLERK_SECRET_KEY to .env.local before running npm run seed.");
  }
  if (!process.env.SEED_TEST_PASSWORD) {
    throw new Error("Add SEED_TEST_PASSWORD to the environment before running npm run seed.");
  }

  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const clerkUsers = new Map<string, string>();
  let clerkUsersCreated = 0;
  for (const account of accounts) {
    const result = await getOrCreateClerkUser(clerk, account, process.env.SEED_TEST_PASSWORD);
    clerkUsers.set(account.username, result.user.id);
    if (result.created) clerkUsersCreated += 1;
  }

  await connectDB();
  const users = new Map<string, InstanceType<typeof User>>();

  for (const account of accounts) {
    const user = await User.findOneAndUpdate(
      {
        $or: [
          { clerkId: clerkUsers.get(account.username)! },
          { clerkId: `seed_${account.username}`, email: account.legacyEmail, username: account.username },
          { email: account.email, username: account.username },
        ],
      },
      {
        $setOnInsert: {
          username: account.username,
          name: account.name,
          avatar: `https://placehold.co/256x256/png?text=${encodeURIComponent(account.name.slice(0, 2))}`,
          onboardingComplete: true,
          emailVerified: true,
          subscriptionTier: account.role === "brand" ? "business" : "free",
          subscriptionExpiry: null,
          isFeatured: account.role === "creator",
          isVerified: account.verified,
          role: account.role,
          accountStatus: "active",
        },
        $set: { clerkId: clerkUsers.get(account.username)!, email: account.email },
      },
      { upsert: true, new: true, runValidators: true },
    );
    users.set(account.username, user);
  }

  for (const brand of [
    { username: "nike", companyName: "Nike India", contactName: "Aarav Sharma", industry: "Sportswear", website: "https://www.nike.com/in", size: "10,000+" },
    { username: "samsung", companyName: "Samsung India", contactName: "Isha Menon", industry: "Consumer Electronics", website: "https://www.samsung.com/in", size: "10,000+" },
  ]) {
    const user = users.get(brand.username)!;
    await BrandProfile.updateOne(
      { userId: user._id },
      {
        $setOnInsert: { userId: user._id, companyName: brand.companyName, contactName: brand.contactName, contactRole: "Creator Partnerships Manager", website: brand.website, industry: brand.industry, companySize: brand.size, country: "India", notes: "Seeded brand profile for campaign workflow demonstrations.", verificationStatus: "verified", verificationMethod: "manual", verificationNote: "Demo profile verified by Branzzo." },
        $set: { contactEmail: user.email },
      },
      { upsert: true, runValidators: true },
    );
  }

  for (const creator of creatorData) {
    const user = users.get(creator.username)!;
    await CreatorProfile.updateOne(
      { userId: user._id },
      { $setOnInsert: { userId: user._id, bio: creator.bio, niche: creator.niche, country: creator.country, languages: ["English", "Hindi"], youtubeUrl: `https://youtube.com/@${creator.username}`, instagramUrl: `https://instagram.com/${creator.username}`, subscribers: creator.followers, instagramFollowers: Math.round(creator.followers * 0.72), avgViews: creator.avgViews, claimedSubscribers: creator.followers, claimedAverageViews: creator.avgViews, claimedEngagementRate: creator.engagement, verificationStatus: "pending", statsVerificationStatus: "pending", verificationPlatform: creator.platform, verificationProfileUrl: creator.platform === "youtube" ? `https://youtube.com/@${creator.username}` : `https://instagram.com/${creator.username}`, verificationSubmittedNote: "Please review my public profile and audience metrics.", verificationSubmittedAt: new Date(BASE_DATE.getTime() - 2 * DAY), sponsorshipRate: creator.rate, rateNegotiable: true, rateType: "per_campaign", isOpenToDeals: true, availabilityStatus: "open_to_deals", pastBrands: ["Urban Company", "Myntra"], sampleWorkUrls: [`https://example.com/portfolio/${creator.username}`], profileViews: Math.round(creator.followers / 18), completedCampaigns: 3, totalDeals: 7 } },
      { upsert: true, runValidators: true },
    );
  }

  const creatorProfiles = new Map<string, InstanceType<typeof CreatorProfile>>();
  for (const creator of creatorData) {
    creatorProfiles.set(creator.username, (await CreatorProfile.findOne({ userId: users.get(creator.username)!._id }))!);
  }
  const brandProfiles = new Map<string, InstanceType<typeof BrandProfile>>();
  for (const username of ["nike", "samsung"]) {
    brandProfiles.set(username, (await BrandProfile.findOne({ userId: users.get(username)!._id }))!);
  }

  const collaborations = [];
  for (let index = 0; index < 20; index += 1) {
    const number = index + 1;
    const brandName = index % 2 === 0 ? "nike" : "samsung";
    const creator = creatorData[index % creatorData.length];
    const brandUser = users.get(brandName)!;
    const creatorUser = users.get(creator.username)!;
    const status = index < 10 ? "ACCEPTED" : index < 15 ? "PENDING_CREATOR_RESPONSE" : "COMPLETED";
    const amount = 45000 + index * 2500;
    const seedKey = `${SEED_PREFIX}:collaboration:${number}`;
    const statusHistory = [{ event: "CREATED", status: "NEW", actor: "brand", note: "Campaign request created.", createdAt: new Date(BASE_DATE.getTime() + index * DAY) }];
    if (status === "ACCEPTED" || status === "COMPLETED") statusHistory.push({ event: "ACCEPTED", status: "ACCEPTED", actor: "creator", note: "Creator accepted the collaboration.", createdAt: new Date(BASE_DATE.getTime() + index * DAY + DAY / 2) });
    if (status === "COMPLETED") statusHistory.push({ event: "COMPLETED", status: "COMPLETED", actor: "brand", note: "Deliverables approved and campaign completed.", createdAt: new Date(BASE_DATE.getTime() + index * DAY + DAY) });
    const collaboration = await BrandInquiry.findOneAndUpdate(
      { seedKey },
      {
        $setOnInsert: { seedKey, brandUserId: brandUser._id, brandProfileId: brandProfiles.get(brandName)!._id, creatorUserId: creatorUser._id, creatorProfileId: creatorProfiles.get(creator.username)!._id, companyName: brandName === "nike" ? "Nike India" : "Samsung India", contactName: brandName === "nike" ? "Aarav Sharma" : "Isha Menon", website: brandName === "nike" ? "https://www.nike.com/in" : "https://www.samsung.com/in", campaignGoal: `${["New product launch", "Seasonal awareness", "Community education", "Performance campaign"][index % 4]} for an engaged ${creator.niche[0].toLowerCase()} audience.`, deliverables: ["One dedicated video", "Two short-form posts", "Usage analytics report"], targetNiches: creator.niche, targetPlatforms: [creator.platform], budgetRange: `Rs. ${amount.toLocaleString("en-IN")} - Rs. ${(amount + 20000).toLocaleString("en-IN")}`, initialOfferAmount: amount, currentOfferAmount: amount, currency: "INR", isNegotiable: true, offerHistory: [{ actor: "brand", action: "offer_sent", amount, currency: "INR", note: "Initial campaign offer", createdAt: new Date(BASE_DATE.getTime() + index * DAY) }], timeline: "Delivery within 30 days of acceptance", message: "We value authentic creative direction and clear disclosure.", creatorUsername: creator.username, source: "creator_profile", status, statusHistory, creatorResponseAt: status === "PENDING_CREATOR_RESPONSE" ? null : new Date(BASE_DATE.getTime() + index * DAY + DAY / 2), closedAt: status === "COMPLETED" ? new Date(BASE_DATE.getTime() + index * DAY + DAY) : null, paymentStatus: status === "COMPLETED" ? "payment_received" : "payment_pending" },
        $set: { email: brandUser.email, createdByClerkId: brandUser.clerkId },
      },
      { upsert: true, new: true, runValidators: true },
    );
    collaborations.push(collaboration);
  }

  for (let index = 0; index < collaborations.length; index += 1) {
    const collaboration = collaborations[index];
    const brand = users.get(index % 2 === 0 ? "nike" : "samsung")!;
    const creator = users.get(creatorData[index % creatorData.length].username)!;
    for (const notification of [
      { suffix: "creator", recipient: creator, actor: brand, event: "collaboration_request", title: "New collaboration request", message: `${brand.name} sent you a campaign brief.` },
      { suffix: "brand", recipient: brand, actor: creator, event: collaboration.status === "PENDING_CREATOR_RESPONSE" ? "collaboration_request" : "offer_accepted", title: collaboration.status === "PENDING_CREATOR_RESPONSE" ? "Request sent" : "Creator response received", message: collaboration.status === "PENDING_CREATOR_RESPONSE" ? `Your request to ${creator.name} is awaiting a response.` : `${creator.name} accepted your campaign.` },
    ]) {
      const seedKey = `${SEED_PREFIX}:notification:${index + 1}:${notification.suffix}`;
      await InAppNotification.updateOne(
        { seedKey },
        { $setOnInsert: { seedKey, recipientUserId: notification.recipient._id, actorUserId: notification.actor._id, event: notification.event, title: notification.title, message: notification.message, href: `/dashboard/collaborations/${collaboration._id}`, isRead: index % 3 === 0, readAt: index % 3 === 0 ? new Date(BASE_DATE.getTime() + index * DAY) : null } },
        { upsert: true, runValidators: true },
      );
    }
  }

  for (let index = 0; index < creatorData.length; index += 1) {
    const creator = users.get(creatorData[index].username)!;
    const seedKey = `${SEED_PREFIX}:notification:verification:${index + 1}`;
    await InAppNotification.updateOne(
      { seedKey },
      { $setOnInsert: { seedKey, recipientUserId: creator._id, actorUserId: users.get("branzzoadmin")!._id, event: "verification_submitted", title: "Verification request submitted", message: "Your profile and audience metrics are queued for review.", href: "/dashboard/verification", isRead: false } },
      { upsert: true, runValidators: true },
    );
  }

  for (let index = 15; index < 20; index += 1) {
    const creator = users.get(creatorData[index % creatorData.length].username)!;
    const brand = users.get(index % 2 === 0 ? "nike" : "samsung")!;
    await Review.updateOne(
      { seedKey: `${SEED_PREFIX}:review:${index + 1}` },
      { $setOnInsert: { seedKey: `${SEED_PREFIX}:review:${index + 1}`, collaborationId: collaborations[index]._id, reviewerUserId: brand._id, revieweeUserId: creator._id, rating: index % 3 === 0 ? 4 : 5, comment: ["Strong creative execution and dependable communication.", "Delivered thoughtful content that resonated with the target audience.", "Professional process, clear reporting, and excellent final assets."][index % 3] } },
      { upsert: true, runValidators: true },
    );
  }

  const [collaborationCount, acceptedCount, pendingCount, verificationCount, notificationCount, reviewCount] = await Promise.all([
    BrandInquiry.countDocuments({ seedKey: { $regex: `^${SEED_PREFIX}:collaboration:` } }),
    BrandInquiry.countDocuments({ seedKey: { $regex: `^${SEED_PREFIX}:collaboration:` }, status: "ACCEPTED" }),
    BrandInquiry.countDocuments({ seedKey: { $regex: `^${SEED_PREFIX}:collaboration:` }, status: "PENDING_CREATOR_RESPONSE" }),
    CreatorProfile.countDocuments({ userId: { $in: creatorData.map((creator) => users.get(creator.username)!._id) }, verificationStatus: "pending" }),
    InAppNotification.countDocuments({ seedKey: { $regex: `^${SEED_PREFIX}:notification:` } }),
    Review.countDocuments({ seedKey: { $regex: `^${SEED_PREFIX}:review:` } }),
  ]);
  if (collaborationCount !== 20 || acceptedCount !== 10 || pendingCount !== 5 || verificationCount !== 5) {
    throw new Error(`Seed verification failed: collaborations=${collaborationCount}, accepted=${acceptedCount}, pending=${pendingCount}, verifications=${verificationCount}`);
  }
  console.log(`Seed complete: ${accounts.length} MongoDB users synced to Clerk (${clerkUsersCreated} Clerk users created, ${accounts.length - clerkUsersCreated} reused), 20 collaborations (10 accepted, 5 pending, 5 completed), 5 verification requests, ${notificationCount} notifications, and ${reviewCount} reviews.`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
