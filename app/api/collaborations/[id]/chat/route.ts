import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import {
  CHAT_MESSAGE_LIMIT,
  ensureConversation,
  isChatEligible,
  resolveChatParticipants,
  viewerChatRole,
} from "@/lib/collaboration-chat";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { User } from "@/lib/models/User";
import { notificationService } from "@/lib/notifications/notification-service";

type RouteContext = { params: Promise<{ id: string }> };

async function contextFor(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return { error: "Collaboration not found.", status: 404 } as const;
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to access collaboration chat.", status: 401 } as const;

  await connectDB();
  const [user, collaboration] = await Promise.all([
    User.findOne({ clerkId: userId }).select("_id role name username avatar").lean(),
    BrandInquiry.findById(id)
      .select("_id status brandUserId brandProfileId creatorUserId creatorProfileId createdByClerkId creatorUsername email statusHistory")
      .lean(),
  ]);
  if (!user || !collaboration) return { error: "Collaboration not found.", status: 404 } as const;
  const participants = await resolveChatParticipants(collaboration);
  const isParticipant =
    (user.role === "brand" && String(participants.brandId) === String(user._id)) ||
    (user.role === "creator" && String(participants.creatorId) === String(user._id));
  // A non-participant receives the same response as a missing record so neither
  // collaboration existence nor chat state is disclosed.
  if (!isParticipant) return { error: "Collaboration not found.", status: 404 } as const;
  if (!isChatEligible(collaboration.status)) {
    return { error: "Chat is unavailable for this collaboration status.", status: 403 } as const;
  }

  const conversation = await ensureConversation(collaboration);
  if (!conversation) return { error: "Chat participants are not available.", status: 409 } as const;
  const role = viewerChatRole(conversation, user);
  if (!role) return { error: "You do not have access to this collaboration chat.", status: 403 } as const;
  return { user, collaboration, conversation, role } as const;
}

function publicMessage(message: {
  _id: unknown;
  senderId?: unknown;
  senderRole: string;
  message: string;
  messageType: string;
  createdAt: Date;
  editedAt?: Date | null;
  readAt?: Date | null;
}) {
  return {
    id: String(message._id),
    senderRole: message.senderRole,
    message: message.message,
    messageType: message.messageType,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    readAt: message.readAt?.toISOString() ?? null,
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  if (!hasMongoUri() || !hasClerkKeys()) return NextResponse.json({ error: "Chat is not configured." }, { status: 503 });
  const { id } = await params;
  const context = await contextFor(id);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 120) ?? "";
  const before = request.nextUrl.searchParams.get("before");
  const filter: Record<string, unknown> = { conversationId: context.conversation._id };
  if (before && mongoose.Types.ObjectId.isValid(before)) filter._id = { $lt: new mongoose.Types.ObjectId(before) };
  if (search) filter.message = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

  const docs = await Message.find(filter)
    .select("senderRole message messageType createdAt editedAt readAt")
    .sort({ _id: -1 })
    .limit(51)
    .lean();
  const hasMore = docs.length > 50;
  const visible = docs.slice(0, 50);
  const now = new Date();
  await Promise.all([
    Message.updateMany(
      { conversationId: context.conversation._id, senderRole: { $ne: context.role }, readAt: null },
      { $set: { readAt: now } },
    ),
    Conversation.updateOne(
      { _id: context.conversation._id },
      { $set: { [context.role === "brand" ? "unreadForBrand" : "unreadForCreator"]: 0 } },
    ),
  ]);

  const participantIds = [context.conversation.brandId, context.conversation.creatorId];
  const participants = await User.find({ _id: { $in: participantIds } }).select("_id name username avatar role").lean();

  return NextResponse.json({
    conversation: {
      id: context.conversation._id.toString(),
      unread: 0,
      viewerRole: context.role,
      participants: participants.map((participant) => ({
        role: participant.role,
        name: participant.name,
        username: participant.username,
        avatar: participant.avatar,
      })),
    },
    messages: visible.reverse().map(publicMessage),
    hasMore,
    nextCursor: hasMore ? visible.at(-1)?._id.toString() : null,
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  if (!hasMongoUri() || !hasClerkKeys()) return NextResponse.json({ error: "Chat is not configured." }, { status: 503 });
  const { id } = await params;
  const context = await contextFor(id);
  if ("error" in context) return NextResponse.json({ error: context.error }, { status: context.status });

  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const text = typeof body?.message === "string" ? body.message.trim() : "";
  if (!text) return NextResponse.json({ error: "Enter a message before sending." }, { status: 400 });
  if (text.length > CHAT_MESSAGE_LIMIT) {
    return NextResponse.json({ error: `Messages must be ${CHAT_MESSAGE_LIMIT} characters or fewer.` }, { status: 400 });
  }

  const message = await Message.create({
    conversationId: context.conversation._id,
    senderId: context.user._id,
    senderRole: context.role,
    message: text,
    messageType: "text",
    readAt: null,
  });
  const recipientCounter = context.role === "brand" ? "unreadForCreator" : "unreadForBrand";
  await Conversation.updateOne(
    { _id: context.conversation._id },
    {
      $set: { lastMessageAt: message.createdAt, lastMessagePreview: text.slice(0, 180) },
      $inc: { [recipientCounter]: 1 },
    },
  );
  const recipientId = context.role === "brand" ? context.conversation.creatorId : context.conversation.brandId;
  await notificationService.notifyChatMessage({
    collaboration: context.collaboration,
    messageId: message._id,
    senderUserId: context.user._id,
    recipientUserId: recipientId,
    preview: text,
  });

  return NextResponse.json({ message: publicMessage(message) }, { status: 201 });
}
