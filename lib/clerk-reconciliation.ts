import type { createClerkClient } from "@clerk/nextjs/server";

import { getClerkEmailVerificationState } from "@/lib/clerk-verification";
import { navigationPublicMetadata } from "@/lib/clerk-navigation-metadata";
import { User } from "@/lib/models/User";
import { ensureUniqueUsername } from "@/lib/queries/creators";

type ClerkClient = ReturnType<typeof createClerkClient>;

export async function reconcileClerkUser(input: {
  clerk: ClerkClient; clerkUserId: string; dryRun: boolean;
}) {
  const clerkUser = await input.clerk.users.getUser(input.clerkUserId);
  const primary = clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId) ?? clerkUser.emailAddresses[0];
  if (!primary) return { clerkUserId: input.clerkUserId, outcome: "no_email" as const };
  const existing = await User.findOne({ clerkId: input.clerkUserId }).lean();
  if (existing?.deletedAt) return { clerkUserId: input.clerkUserId, outcome: "deleted_tombstone" as const };
  const email = primary.emailAddress.toLowerCase();
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || clerkUser.username || email.split("@")[0];
  const values = {
    email,
    emailVerified: Boolean(getClerkEmailVerificationState(clerkUser, email)?.verified),
    name,
    avatar: clerkUser.imageUrl ?? "",
    latestClerkEventAt: new Date(clerkUser.updatedAt),
    latestClerkEventId: `reconcile:${clerkUser.id}:${clerkUser.updatedAt}`,
  };
  const mongoChanged = !existing || Object.entries(values).some(([key, value]) => {
    const current = existing[key as keyof typeof existing];
    return current instanceof Date && value instanceof Date ? current.getTime() !== value.getTime() : current !== value;
  });
  const desiredMetadata = existing ? navigationPublicMetadata(existing) : null;
  const metadataChanged = Boolean(desiredMetadata && (
    clerkUser.publicMetadata.role !== desiredMetadata.role ||
    clerkUser.publicMetadata.username !== desiredMetadata.username ||
    clerkUser.publicMetadata.onboardingComplete !== desiredMetadata.onboardingComplete ||
    clerkUser.publicMetadata.isAdmin !== desiredMetadata.isAdmin
  ));
  if (input.dryRun) {
    return { clerkUserId: input.clerkUserId, outcome: mongoChanged || metadataChanged ? "would_update" as const : "current" as const };
  }
  if (!mongoChanged && !metadataChanged) {
    return { clerkUserId: input.clerkUserId, outcome: "current" as const };
  }
  if (existing && mongoChanged) {
    await User.updateOne({ _id: existing._id, deletedAt: null }, { $set: values });
  } else if (!existing) {
    const username = await ensureUniqueUsername(clerkUser.username || name, clerkUser.id);
    await User.create({
      clerkId: clerkUser.id, username, role: "creator", onboardingComplete: false,
      subscriptionTier: "free", isFeatured: false, isVerified: false, ...values,
    });
  }
  if (desiredMetadata && metadataChanged) {
    await input.clerk.users.updateUserMetadata(input.clerkUserId, { publicMetadata: desiredMetadata });
  }
  return { clerkUserId: input.clerkUserId, outcome: "updated" as const };
}

export async function reconcileClerkUsers(input: {
  clerk: ClerkClient; clerkUserIds?: string[]; limit?: number; dryRun?: boolean;
}) {
  const dryRun = input.dryRun ?? true;
  const explicitIds = [...new Set(input.clerkUserIds ?? [])].slice(0, 100);
  let ids = explicitIds;
  if (!ids.length) {
    const limit = Math.max(1, Math.min(input.limit ?? 25, 100));
    const page = await input.clerk.users.getUserList({ limit });
    ids = page.data.map((user) => user.id);
  }
  const results = [];
  for (const clerkUserId of ids) results.push(await reconcileClerkUser({ clerk: input.clerk, clerkUserId, dryRun }));
  return results;
}
