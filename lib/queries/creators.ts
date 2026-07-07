import { DEMO_AVATARS } from "@/lib/constants";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { type IUser, User } from "@/lib/models/User";
import { formatNumber } from "@/lib/format";
import { type CreatorCardData, type StatsVerificationStatus, type VerificationStatus } from "@/lib/types";
import { getPublicAverageViews, getPublicSubscriberCount, isCreatorVerifiedStatus } from "@/lib/verification";
import { generateUsername } from "@/lib/slug";

export type CreatorFilters = {
  search?: string;
  niche?: string;
  platform?: string;
  country?: string;
  openToDeals?: boolean;
  sort?: string;
  limit?: number;
};

type CreatorDocumentWithUser = {
  _id: { toString(): string };
  userId: IUser & { _id: { toString(): string } };
  bio?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  niche?: string[];
  country?: string;
  languages?: string[];
  youtubeUrl?: string;
  youtubeHandle?: string;
  instagramUrl?: string;
  podcastUrl?: string;
  subscribers?: number;
  claimedSubscribers?: number;
  verifiedSubscribers?: number;
  claimedAverageViews?: number;
  verifiedAverageViews?: number;
  claimedEngagementRate?: number;
  verifiedEngagementRate?: number;
  statsVerificationStatus?: StatsVerificationStatus;
  verificationStatus?: VerificationStatus;
  verificationCode?: string;
  verificationPlatform?: "youtube" | "instagram" | "twitch" | "other";
  verificationProfileUrl?: string;
  avgViews?: number;
  instagramFollowers?: number;
  sponsorshipRate?: number;
  rateType?: "per_video" | "per_post" | "per_campaign";
  pastBrands?: string[];
  sampleWorkUrls?: string[];
  isOpenToDeals?: boolean;
  verifiedAt?: Date | null;
  lastVerifiedAt?: Date | null;
  createdAt?: Date;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const demoCreators: CreatorCardData[] = [
  {
    id: "demo-1",
    username: "riyatech",
    name: "Riya Tech",
    avatar: DEMO_AVATARS[0],
    bio: "Consumer tech creator making practical reviews, comparison videos, and launch explainers for Indian buyers.",
    niche: ["Tech", "Education"],
    country: "India",
    languages: ["English", "Hindi"],
    youtubeUrl: "https://youtube.com/@riyatech",
    instagramUrl: "https://instagram.com/riyatech",
    subscribers: 680000,
    claimedSubscribers: 680000,
    verifiedSubscribers: 680000,
    claimedAverageViews: 145000,
    verifiedAverageViews: 145000,
    claimedEngagementRate: 21.3,
    verifiedEngagementRate: 21.3,
    statsVerificationStatus: "verified",
    verificationStatus: "verified",
    avgViews: 145000,
    instagramFollowers: 94000,
    sponsorshipRate: 85000,
    rateType: "per_video",
    pastBrands: ["OnePlus", "Boat", "CRED"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo1"],
    isOpenToDeals: true,
    isFeatured: true,
    isVerified: true,
  },
  {
    id: "demo-2",
    username: "gamewithaarav",
    name: "Aarav Plays",
    avatar: DEMO_AVATARS[1],
    bio: "Gaming creator covering mobile esports, live streams, game launch campaigns, and audience-led challenge formats.",
    niche: ["Gaming", "Comedy"],
    country: "India",
    languages: ["Hindi"],
    youtubeUrl: "https://youtube.com/@gamewithaarav",
    subscribers: 1200000,
    claimedSubscribers: 1200000,
    verifiedSubscribers: 1200000,
    claimedAverageViews: 260000,
    verifiedAverageViews: 260000,
    claimedEngagementRate: 21.7,
    verifiedEngagementRate: 21.7,
    statsVerificationStatus: "verified",
    verificationStatus: "verified",
    avgViews: 260000,
    sponsorshipRate: 140000,
    rateType: "per_campaign",
    pastBrands: ["Red Bull", "Logitech"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo2"],
    isOpenToDeals: true,
    isFeatured: true,
    isVerified: true,
  },
  {
    id: "demo-3",
    username: "financewithmeera",
    name: "Meera Money",
    avatar: DEMO_AVATARS[2],
    bio: "Finance educator simplifying credit, investing, savings, and fintech products for first-time Indian earners.",
    niche: ["Finance", "Education"],
    country: "India",
    languages: ["English", "Hindi"],
    youtubeUrl: "https://youtube.com/@financewithmeera",
    instagramUrl: "https://instagram.com/financewithmeera",
    subscribers: 420000,
    claimedSubscribers: 420000,
    verifiedSubscribers: 0,
    claimedAverageViews: 87000,
    claimedEngagementRate: 20.7,
    statsVerificationStatus: "unverified",
    verificationStatus: "unverified",
    avgViews: 87000,
    instagramFollowers: 185000,
    sponsorshipRate: 65000,
    rateType: "per_video",
    pastBrands: ["Groww", "Fi", "Jupiter"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo3"],
    isOpenToDeals: true,
    isFeatured: true,
    isVerified: false,
  },
  {
    id: "demo-4",
    username: "fitwithkabir",
    name: "Kabir Fit",
    avatar: DEMO_AVATARS[3],
    bio: "Fitness and nutrition creator producing short-form training plans, supplement reviews, and challenge series.",
    niche: ["Fitness", "Lifestyle"],
    country: "India",
    languages: ["English"],
    youtubeUrl: "https://youtube.com/@fitwithkabir",
    instagramUrl: "https://instagram.com/fitwithkabir",
    subscribers: 190000,
    claimedSubscribers: 190000,
    verifiedSubscribers: 190000,
    claimedAverageViews: 51000,
    verifiedAverageViews: 51000,
    claimedEngagementRate: 26.8,
    verifiedEngagementRate: 26.8,
    statsVerificationStatus: "verified",
    verificationStatus: "verified",
    avgViews: 51000,
    instagramFollowers: 320000,
    sponsorshipRate: 52000,
    rateType: "per_campaign",
    pastBrands: ["Cult.fit", "HealthKart"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo4"],
    isOpenToDeals: true,
    isFeatured: false,
    isVerified: true,
  },
  {
    id: "demo-5",
    username: "foodtrailnaina",
    name: "Naina Food Trail",
    avatar: DEMO_AVATARS[0],
    bio: "Food creator building regional restaurant stories, cafe launches, recipe reels, and city discovery formats.",
    niche: ["Food", "Travel"],
    country: "India",
    languages: ["Hindi", "Bengali"],
    instagramUrl: "https://instagram.com/foodtrailnaina",
    subscribers: 78000,
    claimedSubscribers: 78000,
    verifiedSubscribers: 0,
    claimedAverageViews: 23000,
    claimedEngagementRate: 29.5,
    statsVerificationStatus: "unverified",
    verificationStatus: "unverified",
    avgViews: 23000,
    instagramFollowers: 410000,
    sponsorshipRate: 38000,
    rateType: "per_post",
    pastBrands: ["Swiggy", "Chaayos"],
    sampleWorkUrls: ["https://instagram.com/p/demo5"],
    isOpenToDeals: false,
    isFeatured: false,
    isVerified: false,
  },
  {
    id: "demo-6",
    username: "styledbyisha",
    name: "Isha Styles",
    avatar: DEMO_AVATARS[2],
    bio: "Fashion and beauty creator producing affordable styling, skincare routines, and festive campaign content.",
    niche: ["Fashion", "Beauty", "Lifestyle"],
    country: "India",
    languages: ["English", "Hindi"],
    youtubeUrl: "https://youtube.com/@styledbyisha",
    instagramUrl: "https://instagram.com/styledbyisha",
    subscribers: 260000,
    claimedSubscribers: 260000,
    verifiedSubscribers: 260000,
    claimedAverageViews: 64000,
    verifiedAverageViews: 64000,
    claimedEngagementRate: 24.6,
    verifiedEngagementRate: 24.6,
    statsVerificationStatus: "verified",
    verificationStatus: "verified",
    avgViews: 64000,
    instagramFollowers: 530000,
    sponsorshipRate: 72000,
    rateType: "per_campaign",
    pastBrands: ["Nykaa", "Myntra"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo6"],
    isOpenToDeals: true,
    isFeatured: false,
    isVerified: true,
  },
];

function mapCreator(doc: CreatorDocumentWithUser): CreatorCardData {
  const user = doc.userId;
  const verificationStatus = doc.verificationStatus ?? (user.isVerified ? "verified" : "unverified");
  const claimedSubscribers = doc.claimedSubscribers ?? doc.subscribers ?? 0;
  const verifiedSubscribers = doc.verifiedSubscribers ?? (isCreatorVerifiedStatus(verificationStatus) ? claimedSubscribers : 0);
  const claimedAverageViews = doc.claimedAverageViews ?? doc.avgViews ?? 0;
  const verifiedAverageViews = doc.verifiedAverageViews ?? 0;
  const claimedEngagementRate = doc.claimedEngagementRate ?? 0;
  const verifiedEngagementRate = doc.verifiedEngagementRate ?? 0;
  const hasVerifiedStatSnapshot = verifiedSubscribers > 0 || verifiedAverageViews > 0 || verifiedEngagementRate > 0;
  const statsVerificationStatus =
    doc.statsVerificationStatus && doc.statsVerificationStatus !== "unverified"
      ? doc.statsVerificationStatus
      : isCreatorVerifiedStatus(verificationStatus) && hasVerifiedStatSnapshot
        ? "verified"
        : doc.statsVerificationStatus ?? "unverified";
  const subscriberSnapshot = {
    verificationStatus,
    statsVerificationStatus,
    claimedSubscribers,
    verifiedSubscribers,
    subscribers: doc.subscribers,
    claimedAverageViews,
    verifiedAverageViews,
    claimedEngagementRate,
    verifiedEngagementRate,
    avgViews: doc.avgViews,
  } as CreatorCardData;

  return {
    id: doc._id.toString(),
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    bio: doc.bio,
    niche: doc.niche ?? [],
    country: doc.country,
    languages: doc.languages ?? [],
    youtubeUrl: doc.youtubeUrl,
    youtubeHandle: doc.youtubeHandle,
    instagramUrl: doc.instagramUrl,
    podcastUrl: doc.podcastUrl,
    subscribers: getPublicSubscriberCount(subscriberSnapshot),
    claimedSubscribers,
    verifiedSubscribers,
    claimedAverageViews,
    verifiedAverageViews,
    claimedEngagementRate,
    verifiedEngagementRate,
    statsVerificationStatus,
    verificationStatus,
    verificationCode: doc.verificationCode,
    verificationPlatform: doc.verificationPlatform,
    verificationProfileUrl: doc.verificationProfileUrl,
    avgViews: getPublicAverageViews(subscriberSnapshot),
    instagramFollowers: doc.instagramFollowers,
    sponsorshipRate: doc.sponsorshipRate,
    rateType: doc.rateType,
    pastBrands: doc.pastBrands ?? [],
    sampleWorkUrls: doc.sampleWorkUrls ?? [],
    isOpenToDeals: Boolean(doc.isOpenToDeals),
    isFeatured: Boolean(user.isFeatured),
    isVerified: isCreatorVerifiedStatus(verificationStatus),
    emailVerified: Boolean(user.emailVerified),
    phoneAdded: Boolean(user.phoneNumber || doc.phoneNumber),
    phoneVerified: Boolean(user.phoneVerified || doc.phoneVerified),
    verifiedAt: doc.verifiedAt?.toISOString(),
    lastVerifiedAt: doc.lastVerifiedAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString(),
  };
}

function filterDemoCreators(filters: CreatorFilters) {
  const search = filters.search?.toLowerCase().trim();

  let result = [...demoCreators];

  if (search) {
    result = result.filter((creator) =>
      [creator.name, creator.username, creator.bio, creator.niche.join(" "), creator.country, creator.languages.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }

  if (filters.niche) {
    result = result.filter((creator) => creator.niche.includes(filters.niche ?? ""));
  }

  if (filters.platform === "youtube") {
    result = result.filter((creator) => Boolean(creator.youtubeUrl));
  }

  if (filters.platform === "instagram") {
    result = result.filter((creator) => Boolean(creator.instagramUrl));
  }

  if (filters.platform === "podcast") {
    result = result.filter((creator) => Boolean(creator.podcastUrl));
  }

  if (filters.country) {
    result = result.filter((creator) => creator.country?.toLowerCase() === filters.country?.toLowerCase());
  }

  if (filters.openToDeals) {
    result = result.filter((creator) => creator.isOpenToDeals);
  }

  return sortCreators(result, filters.sort).slice(0, filters.limit ?? 24);
}

function sortCreators(creators: CreatorCardData[], sort?: string) {
  const result = [...creators];

  if (sort === "subscribers") {
    return result.sort((a, b) => (b.subscribers ?? 0) - (a.subscribers ?? 0));
  }

  if (sort === "views") {
    return result.sort((a, b) => (b.avgViews ?? 0) - (a.avgViews ?? 0));
  }

  if (sort === "rate-low") {
    return result.sort((a, b) => (a.sponsorshipRate ?? 0) - (b.sponsorshipRate ?? 0));
  }

  if (sort === "rate-high") {
    return result.sort((a, b) => (b.sponsorshipRate ?? 0) - (a.sponsorshipRate ?? 0));
  }

  if (sort === "newest") {
    return result.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }

  return result.sort(
    (a, b) =>
      Number(b.isFeatured) - Number(a.isFeatured) ||
      Number(b.isVerified) - Number(a.isVerified) ||
      (b.subscribers ?? 0) - (a.subscribers ?? 0),
  );
}

export async function getCreators(filters: CreatorFilters = {}): Promise<CreatorCardData[]> {
  if (!hasMongoUri()) return filterDemoCreators(filters);

  try {
    await connectDB();

    const profileQuery: Record<string, unknown> = {};
    const andClauses: Record<string, unknown>[] = [];

    if (filters.niche) andClauses.push({ niche: filters.niche });
    if (filters.country) andClauses.push({ country: new RegExp(`^${filters.country}$`, "i") });
    if (filters.openToDeals) andClauses.push({ isOpenToDeals: true });

    if (filters.platform === "youtube") andClauses.push({ youtubeUrl: { $ne: "" } });
    if (filters.platform === "instagram") andClauses.push({ instagramUrl: { $ne: "" } });
    if (filters.platform === "podcast") andClauses.push({ podcastUrl: { $ne: "" } });

    if (filters.search) {
      const regex = new RegExp(escapeRegex(filters.search.trim()), "i");
      const users = await User.find({
        accountStatus: { $nin: ["hidden", "suspended"] },
        $or: [{ name: regex }, { username: regex }],
      })
        .select("_id")
        .limit(50);

      andClauses.push({
        $or: [{ userId: { $in: users.map((user) => user._id) } }, { niche: regex }, { bio: regex }],
      });
    }

    if (andClauses.length > 0) profileQuery.$and = andClauses;

    const docs = await CreatorProfile.find(profileQuery)
      .populate({
        path: "userId",
        match: { role: "creator", onboardingComplete: true, accountStatus: { $nin: ["hidden", "suspended"] } },
      })
      .limit(Math.max(filters.limit ?? 24, 100))
      .exec();

    const creators = docs
      .filter((doc) => Boolean(doc.userId))
      .map((doc) => mapCreator(doc as unknown as CreatorDocumentWithUser));

    return sortCreators(creators, filters.sort).slice(0, filters.limit ?? 24);
  } catch {
    return filterDemoCreators(filters);
  }
}

export async function getFeaturedCreators(limit = 6) {
  const creators = await getCreators({ limit: 24 });
  return creators.filter((creator) => creator.isFeatured).slice(0, limit);
}

export async function getCreatorByUsername(username: string): Promise<CreatorCardData | null> {
  if (!hasMongoUri()) {
    return demoCreators.find((creator) => creator.username === username) ?? null;
  }

  try {
    await connectDB();
    const user = await User.findOne({
      username: username.toLowerCase(),
      role: "creator",
      onboardingComplete: true,
      accountStatus: { $nin: ["hidden", "suspended"] },
    });
    if (!user) return null;

    const profile = await CreatorProfile.findOne({ userId: user._id })
      .populate({
        path: "userId",
        match: { role: "creator", onboardingComplete: true, accountStatus: { $nin: ["hidden", "suspended"] } },
      })
      .exec();
    if (!profile) return null;

    return mapCreator(profile as unknown as CreatorDocumentWithUser);
  } catch {
    return demoCreators.find((creator) => creator.username === username) ?? null;
  }
}

export async function ensureUniqueUsername(seed: string, currentClerkId?: string) {
  const base = generateUsername(seed);
  if (!hasMongoUri()) return base;

  await connectDB();

  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? base : `${base}${index + 1}`;
    const existing = await User.exists({
      username: candidate,
      ...(currentClerkId ? { clerkId: { $ne: currentClerkId } } : {}),
    });

    if (!existing) return candidate;
  }

  return `${base}${Date.now().toString().slice(-4)}`;
}

export function creatorMetaDescription(creator: CreatorCardData) {
  const primaryNiche = creator.niche[0] ?? "creator";
  return `Hire ${creator.name}, a ${primaryNiche} creator with ${formatNumber(
    getPublicSubscriberCount(creator),
  )} subscribers and ${formatNumber(getPublicAverageViews(creator))} average views.`;
}
