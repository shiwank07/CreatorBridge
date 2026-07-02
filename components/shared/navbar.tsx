import { auth } from "@clerk/nextjs/server";

import { authHref } from "@/lib/auth-redirect";
import { hasClerkKeys } from "@/lib/clerk-config";
import { getCurrentAppUser } from "@/lib/current-user";
import { getCurrentUserNotificationSummary } from "@/lib/queries/notifications";
import { NavbarClient, type UserMenuLinks } from "@/components/shared/navbar-client";

export async function Navbar() {
  const { userId } = hasClerkKeys() ? await auth() : { userId: null };
  const user = userId ? await getCurrentAppUser() : null;
  const onboardingHref = "/onboarding";
  const isSignedIn = Boolean(userId);
  const canShowNotifications = Boolean(user?.onboardingComplete && (user.role === "creator" || user.role === "brand"));
  const notificationSummary = canShowNotifications
    ? await getCurrentUserNotificationSummary(12)
    : {
        notifications: [],
        unreadCount: 0,
      };

  const navItems =
    user?.role === "creator" && user.onboardingComplete
      ? [
          { label: "Dashboard", href: "/dashboard/creator" },
          { label: "Collaborations", href: "/dashboard/creator#collaborations" },
          { label: "Notifications", href: "/notifications" },
          { label: "My Profile", href: `/creators/${user.username}` },
        ]
      : user?.role === "brand" && user.onboardingComplete
        ? [
            { label: "Dashboard", href: "/dashboard/brand" },
            { label: "Discover Creators", href: "/creators" },
            { label: "Campaigns", href: "/dashboard/brand#campaigns" },
            { label: "Notifications", href: "/notifications" },
          ]
        : isSignedIn
          ? [{ label: "Complete Onboarding", href: "/onboarding" }]
          : [
              { label: "Browse Creators", href: "/creators" },
              { label: "For Brands", href: "/#for-brands" },
              { label: "About", href: "/#how-it-works" },
            ];

  const primaryHref = user?.role === "brand" && user.onboardingComplete ? "/dashboard/brand" : user?.role === "creator" && user.onboardingComplete ? "/dashboard/creator" : isSignedIn ? "/onboarding" : authHref("/sign-up", onboardingHref);
  const primaryLabel = isSignedIn ? (user?.onboardingComplete ? "Dashboard" : "Onboarding") : "Join Free";
  const userMenuLinks: UserMenuLinks | null =
    user?.role === "creator" && user.onboardingComplete
      ? {
          profileHref: `/creators/${user.username}`,
          verificationHref: "/dashboard/verification",
          historyHref: "/dashboard/history",
          notificationsHref: "/notifications",
        }
      : user?.role === "brand" && user.onboardingComplete
        ? {
            profileHref: `/brands/${user.username}`,
            verificationHref: "/dashboard/verification",
            historyHref: "/dashboard/history",
            notificationsHref: "/notifications",
          }
        : null;

  return (
    <NavbarClient
      navItems={navItems}
      isSignedIn={isSignedIn}
      signInHref={authHref("/sign-in", onboardingHref)}
      primaryHref={primaryHref}
      primaryLabel={primaryLabel}
      userMenuLinks={userMenuLinks}
      showNotificationBell={canShowNotifications}
      initialNotifications={notificationSummary.notifications}
      initialUnreadCount={notificationSummary.unreadCount}
    />
  );
}
