import { auth } from "@clerk/nextjs/server";

import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { User } from "@/lib/models/User";
import { type Role } from "@/lib/types";

export type CurrentAppUser = {
  id: string;
  clerkId: string;
  email: string;
  username: string;
  name: string;
  role: Role;
  onboardingComplete: boolean;
};

type UserDocument = {
  _id: { toString(): string };
  clerkId: string;
  email: string;
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
    username: user.username,
    name: user.name,
    role: user.role,
    onboardingComplete: Boolean(user.onboardingComplete),
  };
}

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  if (!hasClerkKeys() || !hasMongoUri()) return null;

  const userId = await getCurrentClerkUserId();
  if (!userId) return null;

  await connectDB();
  const user = await User.findOne({ clerkId: userId }).exec();
  return user ? mapUser(user as unknown as UserDocument) : null;
}

export async function getCurrentClerkUserId() {
  if (!hasClerkKeys()) return null;

  const { userId } = await auth();
  return userId;
}
