import { auth, currentUser } from "@clerk/nextjs/server";

import { hasClerkKeys } from "@/lib/clerk-config";
import { getClerkEmailVerificationState } from "@/lib/clerk-verification";
import { connectDB, hasMongoUri } from "@/lib/db";
import { User } from "@/lib/models/User";
import { type Role } from "@/lib/types";

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
};

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
  };
}

async function syncEmailVerification(user: UserDocument) {
  try {
    const clerkUser = await currentUser();
    const emailState = getClerkEmailVerificationState(clerkUser, user.email);
    if (!emailState) return user;

    const emailVerified = Boolean(emailState.verified);
    if (Boolean(user.emailVerified) === emailVerified) return user;

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $set: { emailVerified } },
      { new: true },
    ).exec();

    return updated ? (updated as unknown as UserDocument) : { ...user, emailVerified };
  } catch (error) {
    console.warn("Could not sync Clerk email verification status.", error);
    return user;
  }
}

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  if (!hasClerkKeys() || !hasMongoUri()) return null;

  const userId = await getCurrentClerkUserId();
  if (!userId) return null;

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).exec();
  if (!user) return null;

  const syncedUser = await syncEmailVerification(user as unknown as UserDocument);
  return mapUser(syncedUser);
}

export async function getCurrentClerkUserId() {
  if (!hasClerkKeys()) return null;

  const { userId } = await auth();
  return userId;
}
