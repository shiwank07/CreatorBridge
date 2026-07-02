import { type CreatorCardData, type VerificationStatus } from "@/lib/types";

export type NormalizedVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export function normalizeCreatorVerificationStatus(status?: string): NormalizedVerificationStatus {
  if (status === "verified" || status === "stats_verified" || status === "ownership_verified") return "verified";
  if (status === "pending" || status === "pending_ownership") return "pending";
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
  if (isCreatorVerifiedStatus(creator.verificationStatus)) {
    return creator.verifiedSubscribers ?? creator.subscribers ?? creator.claimedSubscribers ?? 0;
  }

  return creator.claimedSubscribers ?? creator.subscribers ?? 0;
}

export function hasVerifiedStats(creator: CreatorCardData) {
  return isCreatorVerifiedStatus(creator.verificationStatus);
}
