import { auth } from "@clerk/nextjs/server";

import { MarketingNavbarClient, type MarketingUserMenuLinks } from "@/components/marketing/marketing-navbar-client";
import { authHref } from "@/lib/auth-redirect";
import { hasClerkKeys } from "@/lib/clerk-config";
import { getCurrentAppUser } from "@/lib/current-user";
import { getCurrentUserNotificationSummary } from "@/lib/queries/notifications";

export async function MarketingNavbar() {
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
          { label: "Collaborations", href: "/dashboard/creator#collaborations" },
          { label: "My Profile", href: `/creators/${user.username}` },
        ]
      : user?.role === "brand" && user.onboardingComplete
        ? [
            { label: "Campaigns", href: "/dashboard/brand#campaigns" },
          ]
        : isSignedIn
          ? [{ label: "Complete Onboarding", href: "/onboarding" }]
          : [
              { label: "Browse Creators", href: "/creators" },
              { label: "For Brands", href: "/#for-brands" },
              { label: "About", href: "/about" },
            ];

  const primaryHref = user?.role === "brand" && user.onboardingComplete ? "/dashboard/brand" : user?.role === "creator" && user.onboardingComplete ? "/dashboard/creator" : isSignedIn ? "/onboarding" : authHref("/sign-up", onboardingHref);
  const primaryLabel = isSignedIn ? (user?.onboardingComplete ? "Dashboard" : "Onboarding") : "Join Free";
  const userMenuLinks: MarketingUserMenuLinks | null =
    user?.role === "creator" && user.onboardingComplete
      ? {
          profileHref: `/creators/${user.username}`,
          verificationHref: "/dashboard/verification",
          historyHref: "/dashboard/history",
          notificationsHref: "/notifications",
          accountHref: "/dashboard/settings/account",
        }
      : user?.role === "brand" && user.onboardingComplete
        ? {
            profileHref: `/brands/${user.username}`,
            verificationHref: "/dashboard/verification",
            historyHref: "/dashboard/history",
            notificationsHref: "/notifications",
            accountHref: "/dashboard/settings/account",
          }
        : null;

  return (
    <MarketingNavbarClient
      navItems={navItems}
      isSignedIn={isSignedIn}
      signInHref={authHref("/sign-in", onboardingHref)}
      primaryHref={primaryHref}
      primaryLabel={primaryLabel}
      creatorsLabel={user?.role === "creator" ? "Explore Creators" : "Creators"}
      showCreatorsAction={Boolean(user?.onboardingComplete && (user.role === "creator" || user.role === "brand"))}
      userMenuLinks={userMenuLinks}
      showNotificationBell={canShowNotifications}
      initialNotifications={notificationSummary.notifications}
      initialUnreadCount={notificationSummary.unreadCount}
    />
  );
}
