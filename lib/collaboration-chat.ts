import mongoose from "mongoose";

import { normalizeCollaborationStatus, type CollaborationStatus } from "@/lib/collaborations";
import { Conversation } from "@/lib/models/Conversation";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { Message } from "@/lib/models/Message";
import { User } from "@/lib/models/User";

export const CHAT_ELIGIBLE_STATUSES: CollaborationStatus[] = [
  "ACCEPTED",
  "IN_PROGRESS",
  "REVISION_REQUESTED",
  "PROOF_SUBMITTED",
];

export const CHAT_MESSAGE_LIMIT = 2000;

export function isChatEligible(status?: string) {
  return CHAT_ELIGIBLE_STATUSES.includes(normalizeCollaborationStatus(status));
}

type CollaborationLike = {
  _id: mongoose.Types.ObjectId;
  status?: string;
  brandUserId?: mongoose.Types.ObjectId | null;
  brandProfileId?: mongoose.Types.ObjectId | null;
  creatorUserId?: mongoose.Types.ObjectId | null;
  creatorProfileId?: mongoose.Types.ObjectId | null;
  createdByClerkId?: string;
  creatorUsername?: string;
  email?: string;
  statusHistory?: Array<{
    _id?: mongoose.Types.ObjectId;
    event?: string;
    note?: string;
    createdAt?: Date | null;
  }>;
};

const SYSTEM_EVENT_COPY: Record<string, string> = {
  ACCEPTED: "Collaboration Accepted",
  IN_PROGRESS: "Work Started",
  REVISION_REQUESTED: "Revision Requested",
  PROOF_SUBMITTED: "Proof Submitted",
  COMPLETED: "Campaign Completed",
};

export async function resolveChatParticipants(collaboration: CollaborationLike) {
  let brandId = collaboration.brandUserId;
  let creatorId = collaboration.creatorUserId;

  if (!brandId && collaboration.brandProfileId) {
    brandId = (await BrandProfile.findById(collaboration.brandProfileId).select("userId").lean())?.userId;
  }
  if (!brandId && collaboration.createdByClerkId) {
    brandId = (await User.findOne({ clerkId: collaboration.createdByClerkId }).select("_id").lean())?._id;
  }
  if (!brandId && collaboration.email) {
    brandId = (await User.findOne({ email: collaboration.email, role: "brand" }).select("_id").lean())?._id;
  }
  if (!creatorId && collaboration.creatorProfileId) {
    creatorId = (await CreatorProfile.findById(collaboration.creatorProfileId).select("userId").lean())?.userId;
  }
  if (!creatorId && collaboration.creatorUsername) {
    creatorId = (await User.findOne({ username: collaboration.creatorUsername, role: "creator" }).select("_id").lean())?._id;
  }

  return { brandId, creatorId };
}

export async function ensureConversation(collaboration: CollaborationLike) {
  if (!isChatEligible(collaboration.status)) return null;
  const { brandId, creatorId } = await resolveChatParticipants(collaboration);
  if (!brandId || !creatorId) return null;

  const conversation = await Conversation.findOneAndUpdate(
    { collaborationId: collaboration._id },
    {
      $setOnInsert: {
        collaborationId: collaboration._id,
        brandId,
        creatorId,
        unreadForBrand: 0,
        unreadForCreator: 0,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  const relevantEvents = (collaboration.statusHistory ?? []).filter((entry) => entry.event && SYSTEM_EVENT_COPY[entry.event]);
  if (relevantEvents.length) {
    await Message.bulkWrite(
      relevantEvents.map((entry, index) => ({
        updateOne: {
          filter: { conversationId: conversation._id, systemEventKey: entry._id?.toString() ?? `${entry.event}-${index}` },
          update: {
            $setOnInsert: {
              conversationId: conversation._id,
              senderRole: "system",
              message: SYSTEM_EVENT_COPY[entry.event!] ?? entry.note ?? "Collaboration updated",
              messageType: "text",
              systemEventKey: entry._id?.toString() ?? `${entry.event}-${index}`,
              createdAt: entry.createdAt ?? new Date(),
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  return conversation;
}

export function viewerChatRole(
  conversation: { brandId: unknown; creatorId: unknown },
  user: { _id: unknown; role: string },
) {
  if (String(conversation.brandId) === String(user._id) && user.role === "brand") return "brand" as const;
  if (String(conversation.creatorId) === String(user._id) && user.role === "creator") return "creator" as const;
  return null;
}
