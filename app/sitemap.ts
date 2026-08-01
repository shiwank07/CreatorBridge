import type { MetadataRoute } from "next";
import type { Types } from "mongoose";

import { connectDB, hasMongoUri, MONGO_QUERY_TIMEOUT_MS } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { User } from "@/lib/models/User";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const staticRoutes = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/creators", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/trust-safety", changeFrequency: "monthly", priority: 0.6 },
  { path: "/community-guidelines", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
] as const;

type ProfileEntry = { username: string; updatedAt: Date };
type BrandEntry = { userId: Types.ObjectId; updatedAt: Date };

async function publicProfileEntries(): Promise<MetadataRoute.Sitemap> {
  if (!hasMongoUri()) return [];

  try {
    await connectDB();
    const creators = await User.find({ role: "creator", onboardingComplete: true, accountStatus: "active" })
      .select("username updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50_000)
      .maxTimeMS(MONGO_QUERY_TIMEOUT_MS)
      .lean<ProfileEntry[]>()
      .exec();
    const publicBrands = await BrandProfile.find({ displayPublicly: true })
      .select("userId updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50_000)
      .maxTimeMS(MONGO_QUERY_TIMEOUT_MS)
      .lean<BrandEntry[]>()
      .exec();
    const brandUsers = publicBrands.length
      ? await User.find({ _id: { $in: publicBrands.map((profile) => profile.userId) }, role: "brand", onboardingComplete: true, accountStatus: "active" })
          .select("username updatedAt")
          .maxTimeMS(MONGO_QUERY_TIMEOUT_MS)
          .lean<ProfileEntry[]>()
          .exec()
      : [];

    return [
      ...creators.map((creator) => ({ url: `${SITE_URL}/creators/${encodeURIComponent(creator.username)}`, lastModified: creator.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
      ...brandUsers.map((brand) => ({ url: `${SITE_URL}/brands/${encodeURIComponent(brand.username)}`, lastModified: brand.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const profiles = await publicProfileEntries();
  return [
    ...staticRoutes.map((route) => ({ url: `${SITE_URL}${route.path}`, changeFrequency: route.changeFrequency, priority: route.priority })),
    ...profiles,
  ];
}
