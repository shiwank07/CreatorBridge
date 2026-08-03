import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

import { isConfiguredAdminId } from "@/lib/clerk-navigation-metadata";
import { hasClerkKeys } from "@/lib/clerk-config";
import { getMongoReadyState, hasMongoUri, modelForConnection, MONGO_QUERY_TIMEOUT_MS, withMongoRequest } from "@/lib/db";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { User } from "@/lib/models/User";

export type ApplicationAccountState =
  | { status: "anonymous" }
  | { status: "needs_onboarding"; clerkUserId: string; preferredRole?: "creator" | "brand"; username?: string }
  | { status: "creator"; userId: string; clerkUserId: string; username: string; onboardingComplete: true; profileId: string; recoveredFromProfile: boolean }
  | { status: "brand"; userId: string; clerkUserId: string; username: string; onboardingComplete: true; profileId: string; recoveredFromProfile: boolean }
  | { status: "admin"; clerkUserId: string; userId?: string }
  | { status: "account_restricted"; clerkUserId: string; accountStatus: string }
  | { status: "temporarily_unavailable"; clerkUserId: string; retryable: true };

type AccountRow = {
  _id: { toString(): string }; clerkId: string; role: string; username: string;
  onboardingComplete: boolean; accountStatus?: string;
  creatorProfileId?: { toString(): string } | null; brandProfileId?: { toString(): string } | null;
};

export function resolveApplicationAccountState(
  clerkUserId: string | null,
  row: AccountRow | null,
  options: { admin?: boolean; unavailable?: boolean } = {},
): ApplicationAccountState {
  if (!clerkUserId) return { status: "anonymous" };
  if (options.admin) return { status: "admin", clerkUserId, ...(row ? { userId: row._id.toString() } : {}) };
  if (options.unavailable) return { status: "temporarily_unavailable", clerkUserId, retryable: true };
  if (!row) return { status: "needs_onboarding", clerkUserId };
  if (row.accountStatus && row.accountStatus !== "active") {
    return { status: "account_restricted", clerkUserId, accountStatus: row.accountStatus };
  }
  const profileId = row.role === "creator" ? row.creatorProfileId : row.role === "brand" ? row.brandProfileId : null;
  if ((row.role !== "creator" && row.role !== "brand") || !profileId) {
    const preferredRole = row.onboardingComplete && (row.role === "creator" || row.role === "brand") ? row.role : undefined;
    return { status: "needs_onboarding", clerkUserId, ...(preferredRole ? { preferredRole } : {}), ...(row.username ? { username: row.username } : {}) };
  }
  return {
    status: row.role,
    userId: row._id.toString(),
    clerkUserId,
    username: row.username,
    onboardingComplete: true,
    profileId: profileId.toString(),
    recoveredFromProfile: !row.onboardingComplete,
  };
}

function accountLog(input: { result: ApplicationAccountState["status"]; startedAt: number; userExists: boolean; expectedProfileExists: boolean }) {
  console.info("[account-resolution]", {
    operation: "getApplicationAccountState",
    result: input.result,
    durationMs: Math.round(performance.now() - input.startedAt),
    mongoReadyState: getMongoReadyState(),
    userExists: input.userExists,
    expectedProfileExists: input.expectedProfileExists,
  });
}

async function getApplicationAccountStateUncached(): Promise<ApplicationAccountState> {
  const startedAt = performance.now();
  if (!hasClerkKeys()) return { status: "anonymous" };
  const { userId } = await auth();
  if (!userId) return { status: "anonymous" };
  const admin = isConfiguredAdminId(userId);
  if (!hasMongoUri()) {
    const state = resolveApplicationAccountState(userId, null, { admin, unavailable: !admin });
    accountLog({ result: state.status, startedAt, userExists: false, expectedProfileExists: false });
    return state;
  }
  try {
    const row = await withMongoRequest("application-account-state", async (connection) => {
      const ScopedUser = modelForConnection(connection, User);
      const [accountRow] = await ScopedUser.aggregate<AccountRow>([
        { $match: { clerkId: userId } },
        { $limit: 1 },
        { $lookup: { from: CreatorProfile.collection.name, localField: "_id", foreignField: "userId", as: "creatorProfile" } },
        { $lookup: { from: BrandProfile.collection.name, localField: "_id", foreignField: "userId", as: "brandProfile" } },
        { $project: {
          _id: 1, clerkId: 1, role: 1, username: 1, onboardingComplete: 1, accountStatus: 1,
          creatorProfileId: { $arrayElemAt: ["$creatorProfile._id", 0] },
          brandProfileId: { $arrayElemAt: ["$brandProfile._id", 0] },
        } },
      ]).option({ maxTimeMS: MONGO_QUERY_TIMEOUT_MS }).exec();
      return accountRow ?? null;
    });
    const state = resolveApplicationAccountState(userId, row, { admin });
    const expectedProfileExists = Boolean(row && (row.role === "creator" ? row.creatorProfileId : row.role === "brand" ? row.brandProfileId : false));
    accountLog({ result: state.status, startedAt, userExists: Boolean(row), expectedProfileExists });
    return state;
  } catch (error) {
    const state = resolveApplicationAccountState(userId, null, { admin, unavailable: true });
    console.error("[account-resolution]", {
      operation: "getApplicationAccountState", result: state.status,
      durationMs: Math.round(performance.now() - startedAt), mongoReadyState: getMongoReadyState(),
      userExists: "unknown", expectedProfileExists: "unknown", errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return state;
  }
}

export const getApplicationAccountState = cache(getApplicationAccountStateUncached);

export function accountDestination(state: ApplicationAccountState) {
  if (state.status === "admin") return "/admin";
  if (state.status === "creator") return "/dashboard/creator";
  if (state.status === "brand") return "/dashboard/brand";
  if (state.status === "needs_onboarding") return "/onboarding";
  if (state.status === "account_restricted") return "/403";
  return null;
}
