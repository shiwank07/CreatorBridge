"use client";

import { useEffect, useState } from "react";
import { useClerk, UserButton } from "@clerk/nextjs";
import { Bell, History, LayoutDashboard, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { NotificationIndicator } from "@/components/notifications/notification-indicator";
import { type InAppNotificationData } from "@/lib/types";

type NavItem = {
  label: string;
  href: string;
};

export type MarketingUserMenuLinks = {
  profileHref: string;
  verificationHref: string;
  historyHref: string;
  notificationsHref: string;
  accountHref: string;
};

type MarketingNavbarClientProps = {
  navItems: NavItem[];
  isSignedIn: boolean;
  signInHref: string;
  primaryHref: string;
  primaryLabel: string;
  userMenuLinks?: MarketingUserMenuLinks | null;
  showNotificationBell?: boolean;
  initialNotifications?: InAppNotificationData[];
  initialUnreadCount?: number;
};

export function MarketingNavbarClient({
  navItems,
  isSignedIn,
  signInHref,
  primaryHref,
  primaryLabel,
  userMenuLinks,
  showNotificationBell = false,
  initialNotifications = [],
  initialUnreadCount = 0,
}: MarketingNavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  async function handleSignOut() {
    closeMenu();
    await signOut().catch(() => undefined);
    router.replace("/");
    router.refresh();
  }

  const mobileLinks: NavItem[] = [
    { label: "Browse Creators", href: "/creators" },
    { label: "For Brands", href: "/#for-brands" },
    { label: isSignedIn ? primaryLabel : "Login", href: isSignedIn ? primaryHref : signInHref },
    ...(isSignedIn && showNotificationBell ? [{ label: "Notifications", href: "/notifications" }] : []),
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ];

  return (
    <header className="marketing-navbar">
      <div className="marketing-navbar__edge" />
      <div className="marketing-navbar__inner">
        <Link href="/" aria-label="Branzzo home" className="marketing-navbar__brand">
          <span className="marketing-navbar__mark">
            <span>BZ</span>
          </span>
          <span className="marketing-navbar__wordmark">Branzzo</span>
        </Link>

        <nav className="marketing-navbar__links" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="focus-ring marketing-navbar__link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="marketing-navbar__actions">
          {!isSignedIn ? (
            <Link href={signInHref} className="focus-ring marketing-navbar__login">
              Login
            </Link>
          ) : null}
          <Link href={primaryHref} aria-label={primaryLabel} className="focus-ring marketing-navbar__primary">
            {isSignedIn ? <LayoutDashboard size={16} /> : null}
            <span>{primaryLabel}</span>
          </Link>
          {showNotificationBell ? <NotificationIndicator initialNotifications={initialNotifications} initialUnreadCount={initialUnreadCount} /> : null}
          {isSignedIn ? (
            userMenuLinks ? (
              <UserButton
                customMenuItems={[
                  { label: "Account Settings", href: userMenuLinks.accountHref },
                  { label: "Sign out", onClick: handleSignOut },
                ]}
              >
                <UserButton.MenuItems>
                  <UserButton.Link href={userMenuLinks.profileHref} label="My Profile" labelIcon={<UserRound size={16} />} />
                  <UserButton.Link href={userMenuLinks.verificationHref} label="Verification Center" labelIcon={<ShieldCheck size={16} />} />
                  <UserButton.Link href={userMenuLinks.historyHref} label="Collaboration History" labelIcon={<History size={16} />} />
                  <UserButton.Link href={userMenuLinks.notificationsHref} label="Notifications" labelIcon={<Bell size={16} />} />
                  <UserButton.Action label="manageAccount" />
                </UserButton.MenuItems>
              </UserButton>
            ) : (
              <UserButton customMenuItems={[{ label: "Sign out", onClick: handleSignOut }]} />
            )
          ) : null}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="focus-ring marketing-navbar__menu-button"
            aria-label="Open navigation"
            aria-expanded={isOpen}
            aria-controls="marketing-mobile-navigation"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="marketing-mobile-nav">
          <button type="button" aria-label="Close navigation" className="marketing-mobile-nav__scrim" onClick={closeMenu} />
          <aside id="marketing-mobile-navigation" className="marketing-mobile-nav__panel">
            <div className="marketing-mobile-nav__header">
              <Link href="/" onClick={closeMenu} className="marketing-mobile-nav__brand">
                <span className="marketing-mobile-nav__mark">BZ</span>
                <span>Branzzo</span>
              </Link>
              <button type="button" onClick={closeMenu} className="focus-ring marketing-navbar__menu-button" aria-label="Close navigation">
                <X size={18} />
              </button>
            </div>

            <nav className="marketing-mobile-nav__links" aria-label="Mobile navigation">
              {mobileLinks.map((item) => (
                <Link key={item.label} href={item.href} onClick={closeMenu} className="focus-ring marketing-mobile-nav__link">
                  {item.label}
                </Link>
              ))}
              {isSignedIn ? (
                <button type="button" onClick={handleSignOut} className="focus-ring marketing-mobile-nav__link marketing-mobile-nav__button">
                  Sign out
                </button>
              ) : null}
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
