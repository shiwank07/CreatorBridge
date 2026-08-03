import type { createClerkClient } from "@clerk/nextjs/server";

import type { CurrentAppUser } from "@/lib/current-user";

type ClerkClient = ReturnType<typeof createClerkClient>;

export function isConfiguredAdminId(clerkUserId: string, env: NodeJS.ProcessEnv = process.env) {
  return new Set((env.ADMIN_CLERK_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean)).has(clerkUserId);
}

export function navigationPublicMetadata(user: Pick<CurrentAppUser, "clerkId" | "role" | "username" | "onboardingComplete">, env: NodeJS.ProcessEnv = process.env) {
  const admin = isConfiguredAdminId(user.clerkId, env);
  const role = admin ? "admin" : user.role === "creator" || user.role === "brand" ? user.role : null;
  return { role, username: user.username, onboardingComplete: Boolean(user.onboardingComplete), isAdmin: admin };
}

export async function syncClerkNavigationMetadata(clerk: ClerkClient, user: Pick<CurrentAppUser, "clerkId" | "role" | "username" | "onboardingComplete">) {
  const publicMetadata = navigationPublicMetadata(user);
  await clerk.users.updateUserMetadata(user.clerkId, { publicMetadata });
  return publicMetadata;
}
