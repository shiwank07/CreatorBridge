import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import type mongoose from "mongoose";

function same(a: unknown, b: unknown) { return Boolean(a && b && String(a) === String(b)); }

export async function participantRole(collaboration: { brandUserId?: unknown; brandProfileId?: unknown; createdByClerkId?: string; creatorUserId?: unknown; creatorProfileId?: unknown; creatorUsername?: string }, user: { _id: mongoose.Types.ObjectId; clerkId: string; username: string; role: string }) {
  if (user.role === "brand") {
    const profile = await BrandProfile.findOne({ userId: user._id }).select("_id").lean();
    if (same(collaboration.brandUserId, user._id) || same(collaboration.brandProfileId, profile?._id) || collaboration.createdByClerkId === user.clerkId) return "brand" as const;
  }
  if (user.role === "creator") {
    const profile = await CreatorProfile.findOne({ userId: user._id }).select("_id").lean();
    if (same(collaboration.creatorUserId, user._id) || same(collaboration.creatorProfileId, profile?._id) || collaboration.creatorUsername === user.username) return "creator" as const;
  }
  return null;
}
