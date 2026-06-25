import { type CreatorCardData } from "@/lib/types";

export function getPublicSubscriberCount(creator: CreatorCardData) {
  if (creator.verificationStatus === "stats_verified") {
    return creator.verifiedSubscribers ?? creator.subscribers ?? creator.claimedSubscribers ?? 0;
  }

  return creator.claimedSubscribers ?? creator.subscribers ?? 0;
}

export function hasVerifiedStats(creator: CreatorCardData) {
  return creator.verificationStatus === "stats_verified";
}
