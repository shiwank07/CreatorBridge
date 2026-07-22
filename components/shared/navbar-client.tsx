"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk, UserButton } from "@clerk/nextjs";
import { Bell, History, LayoutDashboard, Menu, Repeat2, ShieldCheck, UserRound, X } from "lucide-react";

import { NotificationIndicator } from "@/components/notifications/notification-indicator";
import { clearBranzzoClientState } from "@/lib/auth-client";
import { type InAppNotificationData } from "@/lib/types";

type NavItem = {
  label: string;
  href: string;
};

export type UserMenuLinks = {
  profileHref: string;
  verificationHref: string;
  historyHref: string;
  notificationsHref: string;
  accountHref: string;
};

type NavbarClientProps = {
  navItems: NavItem[];
  isSignedIn: boolean;
  signInHref: string;
  primaryHref: string;
  primaryLabel: string;
  creatorsLabel: string;
  showCreatorsAction: boolean;
  userMenuLinks?: UserMenuLinks | null;
  showNotificationBell?: boolean;
  initialNotifications?: InAppNotificationData[];
  initialUnreadCount?: number;
};

export function NavbarClient({
  navItems,
  isSignedIn,
  signInHref,
  primaryHref,
  primaryLabel,
  creatorsLabel,
  showCreatorsAction,
  userMenuLinks,
  showNotificationBell = false,
  initialNotifications = [],
  initialUnreadCount = 0,
}: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { sessionId } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    clearBranzzoClientState();
    await signOut({ sessionId: sessionId ?? undefined });
    router.replace("/");
    router.refresh();
  }

  async function handleSwitchAccount() {
    closeMenu();
    clearBranzzoClientState();
    await signOut({ sessionId: sessionId ?? undefined });
    window.location.assign("/sign-in?switch=google");
  }

  const mobileLinks: NavItem[] = [
    ...(isSignedIn ? navItems : []),
    ...(showCreatorsAction ? [{ label: creatorsLabel, href: "/creators" }] : !isSignedIn ? [{ label: "Browse Creators", href: "/creators" }] : []),
    ...(!isSignedIn ? [{ label: "For Brands", href: "/#for-brands" }] : []),
    { label: isSignedIn ? primaryLabel : "Login", href: isSignedIn ? primaryHref : signInHref },
    ...(isSignedIn && showNotificationBell ? [{ label: "Notifications", href: "/notifications" }] : []),
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ];

  return (
    <header className="sticky top-0 z-[70] border-b border-cyan-300/15 bg-[#070712]/88 shadow-[0_14px_46px_rgba(0,0,0,0.28),0_0_34px_rgba(103,232,249,0.08)] backdrop-blur-2xl transition-all duration-300">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Branzzo home"
          className="group flex min-w-0 shrink-0 items-center gap-2 font-display text-base font-bold sm:gap-3 sm:text-lg"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-cyan-300/35 bg-white/[0.06] text-sm text-cyan-100 shadow-[0_0_32px_rgba(103,232,249,0.22)]">
            <span className="absolute inset-0 bg-gradient-to-br from-violet-500/35 via-transparent to-cyan-300/25" />
            <span className="relative">BZ</span>
          </span>
          <span className="hidden truncate sm:inline">Branzzo</span>
        </Link>

        <nav className={`ml-auto min-w-0 items-center text-sm text-[var(--text-secondary)] ${isSignedIn ? "hidden" : "hidden lg:flex"}`}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="focus-ring inline-flex h-10 items-center whitespace-nowrap rounded-[8px] px-3 transition hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex h-10 shrink-0 items-center gap-2">
          {isSignedIn
            ? navItems.map((item) => (
                <Link key={item.label} href={item.href} className="focus-ring hidden h-10 items-center whitespace-nowrap rounded-[8px] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-white/[0.06] hover:text-white xl:inline-flex">
                  {item.label}
                </Link>
              ))
            : null}
          {!isSignedIn ? (
            <Link href={signInHref} className="bridge-button-secondary hidden px-4 py-2 xl:inline-flex">
              Login
            </Link>
          ) : null}
          {showCreatorsAction ? (
            <Link href="/creators" className="focus-ring hidden rounded-[8px] px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/10 sm:inline-flex">
              {creatorsLabel}
            </Link>
          ) : null}
          <Link
            href={primaryHref}
            aria-label={primaryLabel}
            className="bridge-button-primary min-h-10 shrink-0 px-3 py-2 text-xs sm:px-4 sm:text-sm"
          >
            {isSignedIn ? <LayoutDashboard size={16} /> : null}
            <span className={isSignedIn ? "hidden whitespace-nowrap sm:inline" : "whitespace-nowrap"}>{primaryLabel}</span>
          </Link>
          {showNotificationBell ? (
            <NotificationIndicator initialNotifications={initialNotifications} initialUnreadCount={initialUnreadCount} />
          ) : null}
          {isSignedIn ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {isMounted ? (
                userMenuLinks ? (
                  <UserButton
                    customMenuItems={[
                      { label: "Account Settings", href: userMenuLinks.accountHref },
                      { label: "Switch account", onClick: handleSwitchAccount },
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
                  <UserButton customMenuItems={[{ label: "Switch account", onClick: handleSwitchAccount }, { label: "Sign out", onClick: handleSignOut }]} />
                )
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-[var(--text-secondary)] xl:hidden"
            aria-label="Open navigation"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMenu}
          />
          <aside
            id="mobile-navigation"
            className="absolute right-0 top-0 flex h-dvh w-[min(88vw,360px)] animate-menu-slide-in flex-col border-l border-white/10 bg-[#080914] p-4 shadow-[0_0_80px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <Link href="/" onClick={closeMenu} className="flex min-w-0 items-center gap-3 font-display text-lg font-bold">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/35 bg-white/[0.06] text-sm text-cyan-100">
                  BZ
                </span>
                <span className="truncate">Branzzo</span>
              </Link>
              <button
                type="button"
                onClick={closeMenu}
                className="focus-ring inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-[var(--text-secondary)]"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-5 grid gap-2">
              {mobileLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="focus-ring rounded-[8px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  {item.label}
                </Link>
              ))}
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="focus-ring flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  <Repeat2 size={16} />
                  Switch account
                </button>
              ) : null}
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="focus-ring rounded-[8px] border border-white/10 bg-white/[0.035] px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
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
