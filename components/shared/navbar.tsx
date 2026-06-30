import { auth } from "@clerk/nextjs/server";

import { authHref } from "@/lib/auth-redirect";
import { hasClerkKeys } from "@/lib/clerk-config";
import { getCurrentAppUser } from "@/lib/current-user";
import { NavbarClient } from "@/components/shared/navbar-client";

export async function Navbar() {
  const { userId } = hasClerkKeys() ? await auth() : { userId: null };
  const user = userId ? await getCurrentAppUser() : null;
  const onboardingHref = "/onboarding?role=creator";
  const isSignedIn = Boolean(userId);

  const navItems =
    user?.role === "creator" && user.onboardingComplete
      ? [
          { label: "Dashboard", href: "/dashboard/creator" },
          { label: "My Profile", href: `/creators/${user.username}` },
          { label: "Collaboration Requests", href: "/dashboard/creator#new-requests" },
          { label: "Notifications", href: "/notifications" },
        ]
      : user?.role === "brand" && user.onboardingComplete
        ? [
            { label: "Dashboard", href: "/dashboard/brand" },
            { label: "Creator Directory", href: "/creators" },
            { label: "Sent Collaborations", href: "/dashboard/brand#sent-collaborations" },
            { label: "Notifications", href: "/notifications" },
          ]
        : isSignedIn
          ? [{ label: "Complete Onboarding", href: "/onboarding" }]
          : [
              { label: "I'm a Creator", href: authHref("/sign-up", "/onboarding?role=creator") },
              { label: "I'm a Brand", href: authHref("/sign-up", "/onboarding?role=brand") },
              { label: "Browse Creators", href: "/creators" },
            ];

  const primaryHref = user?.role === "brand" && user.onboardingComplete ? "/dashboard/brand" : user?.role === "creator" && user.onboardingComplete ? "/dashboard/creator" : isSignedIn ? "/onboarding" : authHref("/sign-up", onboardingHref);
  const primaryLabel = isSignedIn ? (user?.onboardingComplete ? "Dashboard" : "Onboarding") : "Join Free";

  return (
    <NavbarClient
      navItems={navItems}
      isSignedIn={isSignedIn}
      signInHref={authHref("/sign-in", onboardingHref)}
      primaryHref={primaryHref}
      primaryLabel={primaryLabel}
    />
  );
}
