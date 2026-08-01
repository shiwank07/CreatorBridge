import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { hasClerkKeys } from "@/lib/clerk-config";

function adminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function adminClerkUserIdSet() {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export async function getAdminState() {
  if (!hasClerkKeys()) return { isAdmin: false, userId: null, email: null };

  const { userId } = await auth();
  if (!userId) return { isAdmin: false, userId: null, email: null };

  const user = await currentUser();
  const primaryEmail =
    user?.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress;
  const adminIds = adminClerkUserIdSet();
  const isAdmin = adminIds.has(userId) ||
    (process.env.NODE_ENV !== "production" && primaryEmail ? adminEmailSet().has(primaryEmail.toLowerCase()) : false);

  return {
    isAdmin,
    userId,
    email: primaryEmail ?? null,
  };
}

export async function requireAdmin() {
  const state = await getAdminState();
  if (!state.userId) redirect("/sign-in");
  if (!state.isAdmin) redirect("/403");
  return state;
}
