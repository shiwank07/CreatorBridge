import { auth } from "@clerk/nextjs/server";

import { authHref } from "@/lib/auth-redirect";
import { hasClerkKeys } from "@/lib/clerk-config";
import { NavbarClient } from "@/components/shared/navbar-client";

export async function Navbar() {
  const { userId } = hasClerkKeys() ? await auth() : { userId: null };
  const onboardingHref = "/onboarding?role=creator";
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Creators", href: "/creators" },
    { label: "For Brands", href: "/#for-brands" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: userId ? "/admin" : authHref("/sign-in", "/admin") },
  ];

  return (
    <NavbarClient
      navItems={navItems}
      isSignedIn={Boolean(userId)}
      signInHref={authHref("/sign-in", onboardingHref)}
      joinHref={authHref("/sign-up", onboardingHref)}
    />
  );
}
