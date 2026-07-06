import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { connectDB } from "../lib/db";
import { BrandInquiry } from "../lib/models/BrandInquiry";
import { CreatorProfile } from "../lib/models/CreatorProfile";
import { User } from "../lib/models/User";
import { demoCreators } from "../lib/queries/creators";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    process.env[key] ??= value;
  }
}

async function seed() {
  loadLocalEnv();

  if (!process.env.MONGODB_URI) {
    throw new Error("Add MONGODB_URI to .env.local before running npm run seed.");
  }

  await connectDB();

  for (const creator of demoCreators) {
    const user = await User.findOneAndUpdate(
      { username: creator.username },
      {
        $set: {
          clerkId: `seed_${creator.username}`,
          email: `${creator.username}@branzzo.local`,
          username: creator.username,
          name: creator.name,
          avatar: creator.avatar,
          role: "creator",
          onboardingComplete: true,
          isFeatured: creator.isFeatured,
          isVerified: creator.isVerified,
        },
        $setOnInsert: {
          subscriptionTier: "free",
          subscriptionExpiry: null,
        },
      },
      { upsert: true, new: true },
    );

    await CreatorProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          bio: creator.bio,
          niche: creator.niche,
          country: creator.country,
          languages: creator.languages,
          youtubeUrl: creator.youtubeUrl,
          subscribers: creator.subscribers,
          avgViews: creator.avgViews,
          instagramUrl: creator.instagramUrl,
          instagramFollowers: creator.instagramFollowers,
          podcastUrl: creator.podcastUrl,
          sponsorshipRate: creator.sponsorshipRate,
          rateType: creator.rateType,
          pastBrands: creator.pastBrands,
          sampleWorkUrls: creator.sampleWorkUrls,
          isOpenToDeals: creator.isOpenToDeals,
        },
      },
      { upsert: true, new: true },
    );
  }

  await BrandInquiry.findOneAndUpdate(
    { email: "growth@playpixel.example" },
    {
      $set: {
        companyName: "PlayPixel Labs",
        contactName: "Ananya Rao",
        email: "growth@playpixel.example",
        website: "https://example.com",
        campaignGoal: "Launch a mobile gaming accessory campaign with creators who can produce YouTube integrations and Instagram reels.",
        deliverables: ["Dedicated video", "Short-form reel", "Product review"],
        targetNiches: ["Gaming", "Tech"],
        targetPlatforms: ["youtube", "instagram"],
        budgetRange: "Rs. 50,000 - Rs. 1,00,000",
        initialOfferAmount: 75000,
        currentOfferAmount: 75000,
        currency: "INR",
        isNegotiable: true,
        offerHistory: [
          {
            actor: "brand",
            action: "offer_sent",
            amount: 75000,
            currency: "INR",
            note: "Initial offer",
            createdAt: new Date(),
          },
        ],
        timeline: "Next 30 days",
        message: "Prefer creators with strong Gen Z engagement in India.",
        creatorUsername: "gamewithaarav",
        status: "offer_sent",
      },
    },
    { upsert: true, new: true },
  );

  console.log(`Seeded ${demoCreators.length} creators and 1 collaboration request.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
