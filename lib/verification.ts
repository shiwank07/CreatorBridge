import { type CreatorCardData, type StatsVerificationStatus, type VerificationStatus } from "@/lib/types";

export type NormalizedVerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type NormalizedStatsVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export function normalizeCreatorVerificationStatus(status?: string): NormalizedVerificationStatus {
  if (status === "verified" || status === "stats_verified" || status === "ownership_verified") return "verified";
  if (status === "pending" || status === "pending_ownership" || status === "needs_review") return "pending";
  if (status === "rejected") return "rejected";
  return "unverified";
}

export function normalizeStatsVerificationStatus(status?: StatsVerificationStatus | string): NormalizedStatsVerificationStatus {
  if (status === "verified") return "verified";
  if (status === "pending" || status === "needs_review") return "pending";
  if (status === "rejected") return "rejected";
  return "unverified";
}

export function verificationBadgeLabel(status?: string, accountType: "creator" | "brand" = "creator") {
  const normalized = accountType === "creator" ? normalizeCreatorVerificationStatus(status) : (status as NormalizedVerificationStatus | undefined) ?? "unverified";

  if (normalized === "verified") return accountType === "brand" ? "Verified Brand" : "Verified Creator";
  if (normalized === "pending") return "Verification Pending";
  if (normalized === "rejected") return "Verification Rejected";
  return "Unverified";
}

export function isCreatorVerifiedStatus(status?: VerificationStatus | string) {
  return normalizeCreatorVerificationStatus(status) === "verified";
}

export function getPublicSubscriberCount(creator: CreatorCardData) {
  if (usesVerifiedStats(creator) && creator.verifiedSubscribers && creator.verifiedSubscribers > 0) {
    return creator.verifiedSubscribers;
  }

  return creator.claimedSubscribers ?? creator.subscribers ?? 0;
}

export function getPublicAverageViews(creator: CreatorCardData) {
  if (usesVerifiedStats(creator) && creator.verifiedAverageViews && creator.verifiedAverageViews > 0) {
    return creator.verifiedAverageViews;
  }

  return creator.claimedAverageViews ?? creator.avgViews ?? 0;
}

export function getPublicEngagementRate(creator: CreatorCardData) {
  if (usesVerifiedStats(creator) && creator.verifiedEngagementRate && creator.verifiedEngagementRate > 0) {
    return creator.verifiedEngagementRate;
  }

  if (creator.claimedEngagementRate && creator.claimedEngagementRate > 0) {
    return creator.claimedEngagementRate;
  }

  const subscribers = getPublicSubscriberCount(creator);
  const views = getPublicAverageViews(creator);
  if (!subscribers || !views) return 0;

  return Math.min((views / subscribers) * 100, 99);
}

export function hasStoredVerifiedStats(creator: CreatorCardData) {
  return Boolean(
    (creator.verifiedSubscribers && creator.verifiedSubscribers > 0) ||
      (creator.verifiedAverageViews && creator.verifiedAverageViews > 0) ||
      (creator.verifiedEngagementRate && creator.verifiedEngagementRate > 0),
  );
}

export function usesVerifiedStats(creator: CreatorCardData) {
  return hasStoredVerifiedStats(creator) && creator.statsVerificationStatus !== "rejected";
}

export function hasVerifiedStats(creator: CreatorCardData) {
  return usesVerifiedStats(creator) && normalizeStatsVerificationStatus(creator.statsVerificationStatus) === "verified";
}

export function getStatsLastVerifiedAt(creator: CreatorCardData) {
  if (!usesVerifiedStats(creator)) return undefined;
  return creator.verifiedAt ?? creator.lastVerifiedAt;
}
