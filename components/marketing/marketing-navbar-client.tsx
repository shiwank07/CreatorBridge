"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BranzzoLogo } from "@/components/branding/branzzo-logo";
import { AccountMenu } from "@/components/shared/account-menu";
import { NotificationButton } from "@/components/shared/notification-button";
import { useNavigationContext } from "@/components/shared/use-navigation-context";
import { authHref } from "@/lib/auth-redirect";
import type { NavigationContext } from "@/lib/navigation-context";


const marketingLinks = [
  { label: "Browse Creators", href: "/creators" },
  { label: "For Brands", href: "/#for-brands" },
  { label: "About", href: "/about" },
];

function signedInDesktopLinks(context: NavigationContext) {
  if (context?.role === "creator") return [
    { label: "Browse Creators", href: "/creators" },
    { label: "Collaborations", href: "/dashboard/history" },
    { label: "Analytics", href: "/dashboard/creator/analytics" },
    { label: "My Profile", href: context.username ? `/creators/${context.username}` : "/dashboard/creator/edit" },
  ];
  if (context?.role === "brand") return [
    { label: "Browse Creators", href: "/creators" },
    { label: "Collaborations", href: "/dashboard/history" },
    { label: "Saved Creators", href: "/dashboard/brand/saved-creators" },
    { label: "Analytics", href: "/dashboard/brand/analytics" },
    { label: "Brand Profile", href: context.username ? `/brands/${context.username}` : "/dashboard/brand/edit" },
  ];
  if (context?.role === "admin") return [
    { label: "Admin Dashboard", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Reports", href: "/admin/reports" },
  ];
  return [{ label: "Browse Creators", href: "/creators" }];
}

export function MarketingNavbarClient() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { openUserProfile, signOut } = useClerk();
  const navbarContext = useNavigationContext();
  const authenticatedDesktopLinks = signedInDesktopLinks(navbarContext);
  const dashboardHref = navbarContext?.role === "creator" ? "/dashboard/creator" : navbarContext?.role === "brand" ? "/dashboard/brand" : "/dashboard";

  useEffect(() => setIsOpen(false), [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  async function handleSignOut() {
    setIsOpen(false);
    await signOut({ redirectUrl: "/" });
  }

  return (
    <header className="marketing-navbar">
      <div className="marketing-navbar__edge" />
      <div className="marketing-navbar__inner">
        <Link href="/" aria-label="Branzzo home" className="focus-ring marketing-navbar__brand">
          <BranzzoLogo showWordmark size={40} priority wordmarkClassName="marketing-navbar__wordmark" />
        </Link>

        {!isLoaded || !isSignedIn ? (
          <nav className="marketing-navbar__links" aria-label="Primary navigation">
            {marketingLinks.map((item) => (
              <Link key={item.label} href={item.href} className="focus-ring marketing-navbar__link">{item.label}</Link>
            ))}
          </nav>
        ) : null}

        <div className="marketing-navbar__actions">
          {!isLoaded ? <span aria-label="Loading account" className="marketing-navbar__account-placeholder" /> : null}
          {isLoaded && !isSignedIn ? (
            <>
              <Link href={authHref("/sign-in", "/onboarding")} className="focus-ring marketing-navbar__login">Login</Link>
              <Link href={authHref("/sign-up", "/onboarding")} className="focus-ring marketing-navbar__primary"><span>Join Free</span></Link>
            </>
          ) : null}
          {isLoaded && isSignedIn ? (
            <>
              <nav aria-label="Account navigation" className="marketing-navbar__signed-in-links">
                {authenticatedDesktopLinks.map((item) => <Link key={item.label} href={item.href} className="focus-ring marketing-navbar__action-link">{item.label}</Link>)}
              </nav>
              {navbarContext?.role !== "admin" ? <Link href={dashboardHref} className="focus-ring marketing-navbar__action-link marketing-navbar__signed-in-dashboard">Dashboard</Link> : null}
              <span className="marketing-navbar__desktop-account-controls">
                <NotificationButton className="marketing-navbar__notification" />
                <span className="marketing-navbar__avatar"><AccountMenu role={navbarContext.role ?? undefined} username={navbarContext.username ?? undefined} /></span>
              </span>
            </>
          ) : null}
          <button type="button" onClick={() => setIsOpen(true)} className="focus-ring marketing-navbar__menu-button" aria-label="Open navigation" aria-expanded={isOpen} aria-controls="marketing-mobile-navigation">
            <Menu aria-hidden="true" size={18} />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="marketing-mobile-nav">
          <button type="button" aria-label="Close navigation" className="marketing-mobile-nav__scrim" onClick={() => setIsOpen(false)} />
          <aside id="marketing-mobile-navigation" aria-label="Marketing menu" className="marketing-mobile-nav__panel">
            <div className="marketing-mobile-nav__header">
              <Link href="/" aria-label="Branzzo home" onClick={() => setIsOpen(false)} className="marketing-mobile-nav__brand"><BranzzoLogo showWordmark size={36} /></Link>
              <button type="button" onClick={() => setIsOpen(false)} className="focus-ring marketing-navbar__menu-button" aria-label="Close navigation"><X aria-hidden="true" size={18} /></button>
            </div>
            <nav className="marketing-mobile-nav__links" aria-label="Mobile navigation">
              {marketingLinks.map((item) => <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)} className="focus-ring marketing-mobile-nav__link">{item.label}</Link>)}
              <Link href="/contact" onClick={() => setIsOpen(false)} className="focus-ring marketing-mobile-nav__link">Contact</Link>
              <Link href="/terms" onClick={() => setIsOpen(false)} className="focus-ring marketing-mobile-nav__link">Terms</Link>
              <Link href="/privacy" onClick={() => setIsOpen(false)} className="focus-ring marketing-mobile-nav__link">Privacy</Link>
              {isLoaded && !isSignedIn ? <Link href={authHref("/sign-in", "/onboarding")} className="focus-ring marketing-mobile-nav__link">Login</Link> : null}
              {isLoaded && !isSignedIn ? <Link href={authHref("/sign-up", "/onboarding")} className="focus-ring marketing-mobile-nav__link">Join Free</Link> : null}
              {isLoaded && isSignedIn ? <Link href="/dashboard" className="focus-ring marketing-mobile-nav__link">Dashboard</Link> : null}
              {isLoaded && isSignedIn ? <Link href="/notifications" className="focus-ring marketing-mobile-nav__link">Notifications</Link> : null}
              {isLoaded && isSignedIn ? <Link href="/dashboard/settings/account" className="focus-ring marketing-mobile-nav__link">Account Settings</Link> : null}
              {isLoaded && isSignedIn ? <button type="button" onClick={() => { setIsOpen(false); openUserProfile(); }} className="focus-ring marketing-mobile-nav__link marketing-mobile-nav__button">Manage Account</button> : null}
              {isLoaded && isSignedIn ? <button type="button" onClick={handleSignOut} className="focus-ring marketing-mobile-nav__link marketing-mobile-nav__button">Sign Out</button> : null}
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
