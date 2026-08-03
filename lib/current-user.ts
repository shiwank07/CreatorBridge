import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

import { hasClerkKeys } from "@/lib/clerk-config";
import { getMongoReadyState, hasMongoUri, modelForConnection, MONGO_QUERY_TIMEOUT_MS, withMongoRequest } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";
import { type Role } from "@/lib/types";
import { withServerTiming } from "@/lib/server-timing";

export type CurrentAppUser = {
  id: string;
  clerkId: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  phoneVerified: boolean;
  username: string;
  name: string;
  role: Role;
  onboardingComplete: boolean;
  accountStatus: "active" | "hidden" | "suspended" | "deleted";
};

export type CurrentAppUserResult =
  | { status: "anonymous" }
  | { status: "missing" }
  | { status: "found"; user: CurrentAppUser }
  | { status: "account_restricted"; accountStatus: CurrentAppUser["accountStatus"]; user: CurrentAppUser }
  | { status: "temporarily_unavailable"; retryable: true };

type UserDocument = {
  _id: { toString(): string };
  clerkId: string;
  email: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: Date | null;
  username: string;
  name: string;
  role: Role;
  onboardingComplete: boolean;
  accountStatus: CurrentAppUser["accountStatus"];
};

function mapUser(user: UserDocument): CurrentAppUser {
  return {
    id: user._id.toString(),
    clerkId: user.clerkId,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    phoneNumber: user.phoneNumber ?? "",
    phoneVerified: Boolean(user.phoneVerified),
    username: user.username,
    name: user.name,
    role: user.role,
    onboardingComplete: Boolean(user.onboardingComplete),
    accountStatus: user.accountStatus,
  };
}

async function getCurrentAppUserResultUncached(): Promise<CurrentAppUserResult> {
  const startedAt = performance.now();
  if (!hasClerkKeys()) return { status: "anonymous" };

  const userId = await getCurrentClerkUserId();
  if (!userId) return { status: "anonymous" };
  if (!hasMongoUri()) return { status: "temporarily_unavailable", retryable: true };

  try {
    const user = await withMongoRequest("current-user", async (connection) => {
      const ScopedUser = modelForConnection(connection, User);
      const row = await withServerTiming("current-user.query", () => ScopedUser.findOne({ clerkId: userId })
        .select("_id clerkId email emailVerified phoneNumber phoneVerified username name role onboardingComplete accountStatus")
        .maxTimeMS(MONGO_QUERY_TIMEOUT_MS)
        .lean()
        .exec());
      if (row && !row.onboardingComplete && (row.role === "creator" || row.role === "brand")) {
        const profileExists = row.role === "creator"
          ? await modelForConnection(connection, CreatorProfile).exists({ userId: row._id }).maxTimeMS(MONGO_QUERY_TIMEOUT_MS)
          : await modelForConnection(connection, BrandProfile).exists({ userId: row._id }).maxTimeMS(MONGO_QUERY_TIMEOUT_MS);
        if (profileExists) row.onboardingComplete = true;
      }
      return row;
    });
    const mapped = user ? mapUser(user as unknown as UserDocument) : null;
    const result: CurrentAppUserResult = mapped && mapped.accountStatus !== "active"
      ? { status: "account_restricted", accountStatus: mapped.accountStatus, user: mapped }
      : mapped
      ? { status: "found", user: mapped }
      : { status: "missing" };
    console.info("[account-resolution]", {
      operation: "getCurrentAppUser", result: result.status,
      durationMs: Math.round(performance.now() - startedAt), mongoReadyState: getMongoReadyState(),
      userExists: Boolean(user), expectedProfileExists: "not_checked",
    });
    return result;
  } catch (error) {
    console.error("[account-resolution]", {
      operation: "getCurrentAppUser", result: "temporarily_unavailable",
      durationMs: Math.round(performance.now() - startedAt), mongoReadyState: getMongoReadyState(),
      userExists: "unknown", expectedProfileExists: "not_checked", errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: "temporarily_unavailable", retryable: true };
  }
}

export const getCurrentAppUserResult = cache(getCurrentAppUserResultUncached);

export const getCurrentAppUser = cache(async () => {
  const result = await getCurrentAppUserResult();
  return result.status === "found" || result.status === "account_restricted" ? result.user : null;
});

async function getCurrentClerkUserIdUncached() {
  if (!hasClerkKeys()) return null;

  const { userId } = await auth();
  return userId;
}

export const getCurrentClerkUserId = cache(getCurrentClerkUserIdUncached);
