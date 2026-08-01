import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { User } from "@/lib/models/User";
import { getFeaturedCreators } from "@/lib/queries/creators";
import { getPublicBrands } from "@/lib/queries/brands";
import type { BrandProfileData, CreatorCardData } from "@/lib/types";
import { MONGO_QUERY_TIMEOUT_MS } from "@/lib/db";
import { withServerTiming } from "@/lib/server-timing";

export type PublicMarketplaceStats = {
  creators: number;
  brands: number;
  collaborations: number;
};

const EMPTY_STATS: PublicMarketplaceStats = { creators: 0, brands: 0, collaborations: 0 };

export async function getPublicMarketplaceStats(): Promise<PublicMarketplaceStats> {
  if (!hasMongoUri()) return EMPTY_STATS;
  try {
    await connectDB();
    const publicUserFilter = { onboardingComplete: true, accountStatus: "active" as const };
    const [creators, brands, collaborations] = await withServerTiming("homepage.statistics.query", () => Promise.all([
      User.countDocuments({ ...publicUserFilter, role: "creator" }).maxTimeMS(MONGO_QUERY_TIMEOUT_MS),
      User.countDocuments({ ...publicUserFilter, role: "brand" }).maxTimeMS(MONGO_QUERY_TIMEOUT_MS),
      BrandInquiry.countDocuments({}).maxTimeMS(MONGO_QUERY_TIMEOUT_MS),
    ]));
    return { creators, brands, collaborations };
  } catch {
    return EMPTY_STATS;
  }
}

export type HomepageMarketplaceData = { featuredCreators: CreatorCardData[]; featuredBrands: BrandProfileData[]; stats: PublicMarketplaceStats };

export async function settleHomepageData(loaders: {
  creators: () => Promise<CreatorCardData[]>;
  brands: () => Promise<BrandProfileData[]>;
  stats: () => Promise<PublicMarketplaceStats>;
}): Promise<HomepageMarketplaceData> {
  const [creators, brands, stats] = await Promise.allSettled([loaders.creators(), loaders.brands(), loaders.stats()]);
  return {
    featuredCreators: creators.status === "fulfilled" ? creators.value : [],
    featuredBrands: brands.status === "fulfilled" ? brands.value : [],
    stats: stats.status === "fulfilled" ? stats.value : EMPTY_STATS,
  };
}

export async function getHomepageMarketplaceData(): Promise<HomepageMarketplaceData> {
  const fallback: HomepageMarketplaceData = { featuredCreators: [], featuredBrands: [], stats: EMPTY_STATS };
  if (!hasMongoUri()) return fallback;
  try {
    // Establish the connection once before starting homepage queries. Every
    // nested helper now sees only a fully connected Mongoose instance.
    await connectDB();
    return settleHomepageData({ creators: () => getFeaturedCreators(6), brands: () => getPublicBrands(6), stats: getPublicMarketplaceStats });
  } catch {
    return fallback;
  }
}
