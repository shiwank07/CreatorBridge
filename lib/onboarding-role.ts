export type OnboardingRole = "creator" | "brand";

export function onboardingRoleFilter(clerkId: string, role: OnboardingRole) {
  return {
    clerkId,
    deletedAt: null,
    $or: [{ onboardingComplete: { $ne: true } }, { role }],
  };
}

export function mayCompleteOnboarding(
  user: { role?: string; onboardingComplete?: boolean; deletedAt?: Date | null } | null,
  requestedRole: OnboardingRole,
) {
  if (user?.deletedAt) return false;
  if (!user?.onboardingComplete) return true;
  return user.role === requestedRole;
}
