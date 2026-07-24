import { DEMO_AVATARS } from "@/lib/constants";
import { normalizeCreatorAvailability, type CreatorAvailabilityStatus } from "@/lib/availability";
import { connectDB, hasMongoUri } from "@/lib/db";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { type IUser, User } from "@/lib/models/User";
import { formatNumber } from "@/lib/format";
import { type CreatorCardData, type CreatorPaymentDetailsData, type StatsVerificationStatus, type VerificationStatus } from "@/lib/types";
import { getPublicAverageViews, getPublicSubscriberCount, isCreatorVerifiedStatus } from "@/lib/verification";
import { generateUsername } from "@/lib/slug";
import { SavedCreator } from "@/lib/models/SavedCreator";
import type { PipelineStage } from "mongoose";

export type CreatorFilters = {
  search?: string;
  niche?: string;
  platform?: string;
  country?: string;
  openToDeals?: boolean;
  sort?: string;
  limit?: number;
};

export type CreatorDiscoveryFilters = CreatorFilters & {
  verification?: "verified" | "unverified";
  availability?: "open" | "closed";
  language?: string;
  subscriberRange?: string;
  viewsRange?: string;
  priceRange?: string;
  engagementRange?: string;
  page?: number;
  pageSize?: number;
};

export type CreatorDiscoveryPage = {
  creators: CreatorCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  verificationPlatform?: "youtube" | "instagram" | "twitch" | "x" | "other";
  customPlatformName?: string;
  verificationProfileUrl?: string;
  verificationSubmittedNote?: string;
  verificationRejectedReason?: string;
  avgViews?: number;
  instagramFollowers?: number;
  sponsorshipRate?: number;
  rateType?: "per_video" | "per_post" | "per_campaign";
  pastBrands?: string[];
  sampleWorkUrls?: string[];
  isOpenToDeals?: boolean;
  availabilityStatus?: CreatorAvailabilityStatus;
  upiId?: string;
  paypalEmail?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  ifsc?: string;
  preferredPaymentNote?: string;
  verifiedAt?: Date | null;
  lastVerifiedAt?: Date | null;
  createdAt?: Date;
};

export type CreatorPrivateProfileData = CreatorCardData & CreatorPaymentDetailsData;

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
    verificationPlatform: "youtube",
    avgViews: 145000,
    instagramFollowers: 94000,
    sponsorshipRate: 85000,
    rateType: "per_video",
    pastBrands: ["OnePlus", "Boat", "CRED"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo1"],
    isOpenToDeals: true,
    availabilityStatus: "open_to_deals",
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
    verificationPlatform: "youtube",
    avgViews: 260000,
    sponsorshipRate: 140000,
    rateType: "per_campaign",
    pastBrands: ["Red Bull", "Logitech"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo2"],
    isOpenToDeals: true,
    availabilityStatus: "open_to_deals",
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
    verificationPlatform: "youtube",
    avgViews: 87000,
    instagramFollowers: 185000,
    sponsorshipRate: 65000,
    rateType: "per_video",
    pastBrands: ["Groww", "Fi", "Jupiter"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo3"],
    isOpenToDeals: true,
    availabilityStatus: "limited_availability",
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
    verificationPlatform: "youtube",
    avgViews: 51000,
    instagramFollowers: 320000,
    sponsorshipRate: 52000,
    rateType: "per_campaign",
    pastBrands: ["Cult.fit", "HealthKart"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo4"],
    isOpenToDeals: true,
    availabilityStatus: "open_to_deals",
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
    verificationPlatform: "instagram",
    avgViews: 23000,
    instagramFollowers: 410000,
    sponsorshipRate: 38000,
    rateType: "per_post",
    pastBrands: ["Swiggy", "Chaayos"],
    sampleWorkUrls: ["https://instagram.com/p/demo5"],
    isOpenToDeals: false,
    availabilityStatus: "unavailable",
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
    verificationPlatform: "youtube",
    avgViews: 64000,
    instagramFollowers: 530000,
    sponsorshipRate: 72000,
    rateType: "per_campaign",
    pastBrands: ["Nykaa", "Myntra"],
    sampleWorkUrls: ["https://youtube.com/watch?v=demo6"],
    isOpenToDeals: true,
    availabilityStatus: "open_to_deals",
    isFeatured: false,
    isVerified: true,
  },
];

function mapCreator(doc: CreatorDocumentWithUser, options?: { includePrivatePayment?: boolean }): CreatorCardData | CreatorPrivateProfileData {
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
  const availabilityStatus = normalizeCreatorAvailability(doc.availabilityStatus, Boolean(doc.isOpenToDeals));
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

  const creator: CreatorCardData = {
    id: user.username,
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
    customPlatformName: doc.customPlatformName,
    verificationProfileUrl: doc.verificationProfileUrl,
    verificationSubmittedNote: doc.verificationSubmittedNote,
    verificationRejectedReason: doc.verificationRejectedReason,
    avgViews: getPublicAverageViews(subscriberSnapshot),
    instagramFollowers: doc.instagramFollowers,
    sponsorshipRate: doc.sponsorshipRate,
    rateType: doc.rateType,
    pastBrands: doc.pastBrands ?? [],
    sampleWorkUrls: doc.sampleWorkUrls ?? [],
    isOpenToDeals: availabilityStatus === "open_to_deals" || availabilityStatus === "limited_availability",
    availabilityStatus,
    isFeatured: Boolean(user.isFeatured),
    isVerified: isCreatorVerifiedStatus(verificationStatus),
    emailVerified: Boolean(user.emailVerified),
    phoneAdded: Boolean(user.phoneNumber || doc.phoneNumber),
    phoneVerified: Boolean(user.phoneVerified || doc.phoneVerified),
    verifiedAt: doc.verifiedAt?.toISOString(),
    lastVerifiedAt: doc.lastVerifiedAt?.toISOString(),
    createdAt: doc.createdAt?.toISOString(),
  };

  if (!options?.includePrivatePayment) return creator;

  return {
    ...creator,
    upiId: doc.upiId ?? "",
    paypalEmail: doc.paypalEmail ?? "",
    bankAccountName: doc.bankAccountName ?? "",
    bankAccountNumber: doc.bankAccountNumber ?? "",
    ifsc: doc.ifsc ?? "",
    preferredPaymentNote: doc.preferredPaymentNote ?? "",
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
  if (filters.platform === "twitch" || filters.platform === "x") {
    result = result.filter((creator) => creator.verificationPlatform === filters.platform && Boolean(creator.verificationProfileUrl));
  }

  if (filters.platform === "podcast") {
    result = result.filter((creator) => Boolean(creator.podcastUrl));
  }

  if (filters.platform === "other") {
    result = result.filter((creator) => creator.verificationPlatform === "other" && Boolean(creator.verificationProfileUrl));
  }

  if (filters.country) {
    result = result.filter((creator) => creator.country?.toLowerCase() === filters.country?.toLowerCase());
  }

    if (filters.openToDeals) {
      result = result.filter((creator) => creator.availabilityStatus === "open_to_deals" || creator.availabilityStatus === "limited_availability");
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
  if (sort === "oldest") return result.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
  if (sort === "subscribers-low") return result.sort((a, b) => (a.subscribers ?? 0) - (b.subscribers ?? 0));
  if (sort === "engagement-high") return result.sort((a, b) => (b.claimedEngagementRate ?? 0) - (a.claimedEngagementRate ?? 0));
  if (sort === "alphabetical") return result.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "alphabetical-desc") return result.sort((a, b) => b.name.localeCompare(a.name));

  return result.sort(
    (a, b) =>
      Number(b.isFeatured) - Number(a.isFeatured) ||
      Number(b.isVerified) - Number(a.isVerified) ||
      (b.subscribers ?? 0) - (a.subscribers ?? 0),
  );
}

function numericRange(field: string, value?: string): Record<string, unknown> | null {
  const ranges: Record<string, [number?, number?]> = {
    "under-10k": [undefined, 10_000],
    "under-50k": [undefined, 50_000],
    "under-100k": [undefined, 100_000],
    "10k-50k": [10_000, 50_000],
    "50k-100k": [50_000, 100_000],
    "100k-500k": [100_000, 500_000],
    "500k-1m": [500_000, 1_000_000],
    "1m-plus": [1_000_000, undefined],
    "100k-plus": [100_000, undefined],
    "under-5": [undefined, 5],
    "5-10": [5, 10],
    "10-plus": [10, undefined],
  };
  const range = value ? ranges[value] : undefined;
  if (!range) return null;
  const condition: Record<string, number> = {};
  if (range[0] !== undefined) condition.$gte = range[0];
  if (range[1] !== undefined) condition.$lt = range[1];
  return { [field]: condition };
}

function filterDemoDiscovery(filters: CreatorDiscoveryFilters): CreatorDiscoveryPage {
  let creators = filterDemoCreators({ ...filters, limit: demoCreators.length });
  if (filters.verification) creators = creators.filter((creator) => creator.isVerified === (filters.verification === "verified"));
  if (filters.availability) creators = creators.filter((creator) => filters.availability === "open" ? creator.isOpenToDeals : !creator.isOpenToDeals);
  if (filters.language) creators = creators.filter((creator) => creator.languages.some((language) => language.toLowerCase() === filters.language?.toLowerCase()));
  const tests: [keyof CreatorDiscoveryFilters, (creator: CreatorCardData) => number][] = [
    ["subscriberRange", (creator) => getPublicSubscriberCount(creator)],
    ["viewsRange", (creator) => getPublicAverageViews(creator)],
    ["priceRange", (creator) => creator.sponsorshipRate ?? 0],
    ["engagementRange", (creator) => creator.verifiedEngagementRate || creator.claimedEngagementRate || 0],
  ];
  for (const [key, read] of tests) {
    const query = numericRange("value", filters[key] as string | undefined)?.value as Record<string, number> | undefined;
    if (query) creators = creators.filter((creator) => (query.$gte === undefined || read(creator) >= query.$gte) && (query.$lt === undefined || read(creator) < query.$lt));
  }
  creators = sortCreators(creators, filters.sort);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 50);
  const total = creators.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(filters.page ?? 1, 1), totalPages);
  return { creators: creators.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages };
}

export async function getCreatorDiscoveryPage(filters: CreatorDiscoveryFilters = {}): Promise<CreatorDiscoveryPage> {
  if (!hasMongoUri()) return filterDemoDiscovery(filters);
  try {
    await connectDB();
    const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 50);
    const requestedPage = Math.max(filters.page ?? 1, 1);
    const match: Record<string, unknown>[] = [];
    const search = filters.search?.trim();
    if (search) {
      const [matchingUsers, matchingProfiles] = await Promise.all([
        User.find({ $text: { $search: search }, role: "creator", onboardingComplete: true, accountStatus: "active" }).select("_id").limit(500).lean(),
        CreatorProfile.find({ $text: { $search: search } }).select("_id").limit(500).lean(),
      ]);
      match.push({ $or: [{ userId: { $in: matchingUsers.map((user) => user._id) } }, { _id: { $in: matchingProfiles.map((profile) => profile._id) } }] });
    }
    if (filters.niche) match.push({ niche: filters.niche });
    if (filters.country) match.push({ country: new RegExp(`^${escapeRegex(filters.country)}$`, "i") });
    if (filters.language) match.push({ languages: new RegExp(`^${escapeRegex(filters.language)}$`, "i") });
    if (filters.verification === "verified") match.push({ verificationStatus: { $in: ["verified", "ownership_verified"] } });
    if (filters.verification === "unverified") match.push({ verificationStatus: { $nin: ["verified", "ownership_verified"] } });
    if (filters.availability === "open" || filters.openToDeals) match.push({ availabilityStatus: { $in: ["open_to_deals", "limited_availability"] } });
    if (filters.availability === "closed") match.push({ availabilityStatus: { $in: ["unavailable", "closed"] } });
    if (filters.platform === "youtube") match.push({ youtubeUrl: { $ne: "" } });
    if (filters.platform === "instagram") match.push({ instagramUrl: { $ne: "" } });
    if (filters.platform === "twitch" || filters.platform === "x" || filters.platform === "other") match.push({ verificationPlatform: filters.platform, verificationProfileUrl: { $ne: "" } });
    for (const condition of [
      numericRange("publicSubscribers", filters.subscriberRange),
      numericRange("publicAverageViews", filters.viewsRange),
      numericRange("sponsorshipRate", filters.priceRange),
      numericRange("publicEngagement", filters.engagementRange),
    ]) if (condition) match.push(condition);

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      subscribers: { publicSubscribers: -1 },
      "subscribers-low": { publicSubscribers: 1 },
      "engagement-high": { publicEngagement: -1 },
      "rate-low": { sponsorshipRate: 1 },
      "rate-high": { sponsorshipRate: -1 },
      alphabetical: { "user.name": 1 },
      "alphabetical-desc": { "user.name": -1 },
      featured: { "user.isFeatured": -1, publicSubscribers: -1 },
    };
    const pipeline: PipelineStage[] = [
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.role": "creator", "user.onboardingComplete": true, "user.accountStatus": "active" } },
      { $addFields: {
        publicSubscribers: { $cond: [{ $eq: ["$statsVerificationStatus", "verified"] }, { $ifNull: ["$verifiedSubscribers", 0] }, { $ifNull: ["$claimedSubscribers", { $ifNull: ["$subscribers", 0] }] }] },
        publicAverageViews: { $cond: [{ $eq: ["$statsVerificationStatus", "verified"] }, { $ifNull: ["$verifiedAverageViews", 0] }, { $ifNull: ["$claimedAverageViews", { $ifNull: ["$avgViews", 0] }] }] },
        publicEngagement: { $cond: [{ $eq: ["$statsVerificationStatus", "verified"] }, { $ifNull: ["$verifiedEngagementRate", 0] }, { $ifNull: ["$claimedEngagementRate", 0] }] },
      } },
      ...(match.length ? [{ $match: { $and: match } } as PipelineStage.Match] : []),
      { $sort: sortMap[filters.sort ?? "featured"] ?? sortMap.featured },
      { $project: {
        userId: 1, bio: 1, niche: 1, country: 1, languages: 1, youtubeUrl: 1, youtubeHandle: 1,
        instagramUrl: 1, podcastUrl: 1, subscribers: 1, claimedSubscribers: 1, verifiedSubscribers: 1,
        claimedAverageViews: 1, verifiedAverageViews: 1, claimedEngagementRate: 1, verifiedEngagementRate: 1,
        statsVerificationStatus: 1, verificationStatus: 1, verificationPlatform: 1, customPlatformName: 1,
        verificationProfileUrl: 1, avgViews: 1, instagramFollowers: 1, sponsorshipRate: 1, rateType: 1,
        pastBrands: 1, sampleWorkUrls: 1, isOpenToDeals: 1, availabilityStatus: 1, verifiedAt: 1,
        lastVerifiedAt: 1, createdAt: 1, publicSubscribers: 1, publicAverageViews: 1, publicEngagement: 1,
        "user._id": 1, "user.username": 1, "user.name": 1, "user.avatar": 1, "user.isFeatured": 1,
        "user.isVerified": 1, "user.emailVerified": 1,
      } },
      { $facet: {
        creators: [{ $skip: (requestedPage - 1) * pageSize }, { $limit: pageSize }],
        count: [{ $count: "value" }],
      } },
    ];
    const [result] = await CreatorProfile.aggregate(pipeline);
    const total = result?.count?.[0]?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    if (page !== requestedPage && total > 0) return getCreatorDiscoveryPage({ ...filters, page });
    const creators = (result?.creators ?? []).map((doc: CreatorDocumentWithUser & { user: CreatorDocumentWithUser["userId"] }) =>
      mapCreator({ ...doc, userId: doc.user }) as CreatorCardData,
    );
    return { creators, total, page, pageSize, totalPages };
  } catch {
    return filterDemoDiscovery(filters);
  }
}

export async function getSavedCreatorUsernames(brandUserId?: string): Promise<Set<string>> {
  if (!brandUserId || !hasMongoUri()) return new Set();
  await connectDB();
  const saved = await SavedCreator.find({ brandUserId }).populate({ path: "creatorUserId", select: "username" }).lean();
  return new Set(saved.map((entry) => (entry.creatorUserId as unknown as { username?: string })?.username).filter((value): value is string => Boolean(value)));
}

export async function getSavedCreatorsForBrand(brandUserId: string): Promise<CreatorCardData[]> {
  if (!hasMongoUri()) return [];
  await connectDB();
  const saved = await SavedCreator.find({ brandUserId }).sort({ createdAt: -1 }).select("creatorUserId").lean();
  const order = new Map(saved.map((entry, index) => [entry.creatorUserId.toString(), index]));
  const profiles = await CreatorProfile.find({ userId: { $in: saved.map((entry) => entry.creatorUserId) } })
    .populate({ path: "userId", match: { role: "creator", onboardingComplete: true, accountStatus: "active" } })
    .exec();
  return profiles
    .filter((profile) => Boolean(profile.userId))
    .sort((a, b) => (order.get(a.userId._id.toString()) ?? 0) - (order.get(b.userId._id.toString()) ?? 0))
    .map((profile) => mapCreator(profile as unknown as CreatorDocumentWithUser) as CreatorCardData);
}

export async function getCreators(filters: CreatorFilters = {}): Promise<CreatorCardData[]> {
  if (!hasMongoUri()) return filterDemoCreators(filters);

  try {
    await connectDB();

    const profileQuery: Record<string, unknown> = {};
    const andClauses: Record<string, unknown>[] = [];

    if (filters.niche) andClauses.push({ niche: filters.niche });
    if (filters.country) andClauses.push({ country: new RegExp(`^${filters.country}$`, "i") });
    if (filters.openToDeals) {
      andClauses.push({
        $or: [
          { availabilityStatus: { $in: ["open_to_deals", "limited_availability"] } },
          { availabilityStatus: { $exists: false }, isOpenToDeals: true },
        ],
      });
    }

    if (filters.platform === "youtube") andClauses.push({ youtubeUrl: { $ne: "" } });
    if (filters.platform === "instagram") andClauses.push({ instagramUrl: { $ne: "" } });
    if (filters.platform === "podcast") andClauses.push({ podcastUrl: { $ne: "" } });
    if (filters.platform === "other") andClauses.push({ verificationPlatform: "other", verificationProfileUrl: { $ne: "" } });

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
      .map((doc) => mapCreator(doc as unknown as CreatorDocumentWithUser) as CreatorCardData);

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

    return mapCreator(profile as unknown as CreatorDocumentWithUser) as CreatorCardData;
  } catch {
    return demoCreators.find((creator) => creator.username === username) ?? null;
  }
}

export async function getCreatorPrivateProfileByUsername(username: string): Promise<CreatorPrivateProfileData | null> {
  if (!hasMongoUri()) {
    const creator = demoCreators.find((item) => item.username === username);
    return creator ? { ...creator } : null;
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

    return mapCreator(profile as unknown as CreatorDocumentWithUser, { includePrivatePayment: true }) as CreatorPrivateProfileData;
  } catch {
    const creator = demoCreators.find((item) => item.username === username);
    return creator ? { ...creator } : null;
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
