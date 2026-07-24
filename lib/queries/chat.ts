import { auth } from "@clerk/nextjs/server";

import { connectDB, hasMongoUri } from "@/lib/db";
import { Conversation } from "@/lib/models/Conversation";
import { User } from "@/lib/models/User";
import { hasClerkKeys } from "@/lib/clerk-config";

export async function getCurrentUserChatUnreadCount() {
  if (!hasMongoUri() || !hasClerkKeys()) return 0;
  const { userId } = await auth();
  if (!userId) return 0;
  await connectDB();
  const user = await User.findOne({ clerkId: userId }).select("_id role").lean();
  if (!user || (user.role !== "brand" && user.role !== "creator")) return 0;
  const field = user.role === "brand" ? "unreadForBrand" : "unreadForCreator";
  const totals = await Conversation.aggregate<{ total: number }>([
    { $match: { [user.role === "brand" ? "brandId" : "creatorId"]: user._id } },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return totals[0]?.total ?? 0;
}
