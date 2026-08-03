"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

import { BranzzoLogo } from "@/components/branding/branzzo-logo";
import { AccountMenu } from "@/components/shared/account-menu";
import { NotificationButton } from "@/components/shared/notification-button";
import { cn } from "@/lib/utils";

export type AuthenticatedRole = "creator" | "brand" | "admin";

type NavItem = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

function navigationFor(role?: AuthenticatedRole, username?: string): NavItem[] {
  if (role === "creator") {
    return [
      { label: "Dashboard", href: "/dashboard/creator", match: (path) => path === "/dashboard/creator" },
      { label: "Collaborations", href: "/dashboard/history", match: (path) => path.startsWith("/dashboard/history") || path.startsWith("/dashboard/collaborations") },
      { label: "Analytics", href: "/dashboard/creator/analytics", match: (path) => path.startsWith("/dashboard/creator/analytics") },
      { label: "My Profile", href: username ? `/creators/${username}` : "/dashboard/creator/edit", match: (path) => path.startsWith("/creators/") || path.startsWith("/dashboard/creator/edit") },
      { label: "Explore Creators", href: "/creators", match: (path) => path === "/creators" },
    ];
  }

  if (role === "brand") {
    return [
      { label: "Dashboard", href: "/dashboard/brand", match: (path) => path === "/dashboard/brand" },
      { label: "Collaborations", href: "/dashboard/history", match: (path) => path.startsWith("/dashboard/history") || path.startsWith("/dashboard/collaborations") },
      { label: "Saved Creators", href: "/dashboard/brand/saved-creators", match: (path) => path.startsWith("/dashboard/brand/saved-creators") },
      { label: "Analytics", href: "/dashboard/brand/analytics", match: (path) => path.startsWith("/dashboard/brand/analytics") },
      { label: "Brand Profile", href: username ? `/brands/${username}` : "/dashboard/brand/edit", match: (path) => path.startsWith("/brands/") || path.startsWith("/dashboard/brand/edit") },
    ];
  }

  if (role === "admin") {
    return [
      { label: "Admin Dashboard", href: "/admin", match: (path) => path === "/admin" },
      { label: "User Management", href: "/admin/users", match: (path) => path.startsWith("/admin/users") },
      { label: "Reports", href: "/admin/reports", match: (path) => path.startsWith("/admin/reports") },
    ];
  }

  return [{ label: "Complete Onboarding", href: "/onboarding", match: (path) => path.startsWith("/onboarding") }];
}

export function NavbarClient({ role, username }: { role?: AuthenticatedRole; username?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { openUserProfile, signOut } = useClerk();
  const navItems = navigationFor(role, username);
  const dashboardHref = role === "creator" ? "/dashboard/creator" : role === "brand" ? "/dashboard/brand" : role === "admin" ? "/admin" : "/onboarding";

  useEffect(() => setIsOpen(false), [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  async function handleSignOut() {
    setIsOpen(false);
    await signOut({ redirectUrl: "/" });
  }

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-[70] h-16 border-b border-white/10 bg-[#090b11]">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Branzzo home" className="focus-ring flex shrink-0 items-center">
          <BranzzoLogo showWordmark size={34} priority wordmarkClassName="text-base font-semibold tracking-tight" />
        </Link>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 lg:gap-1.5">
          <nav aria-label="Application navigation" className="hidden min-w-0 items-center gap-0.5 lg:flex">
            {navItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={cn("focus-ring inline-flex h-10 items-center whitespace-nowrap rounded-md px-2.5 text-sm font-medium transition-colors", active ? "text-white" : "text-slate-400 hover:text-slate-100")}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-1.5 lg:flex">
            <NotificationButton />
            <div className="flex h-11 w-11 items-center justify-center" aria-label={!isLoaded ? "Loading account" : undefined}>
              {isLoaded && isSignedIn ? <AccountMenu role={role} username={username} /> : null}
            </div>
          </div>

          <Link href={dashboardHref} className="focus-ring inline-flex min-h-11 items-center px-2 text-sm font-semibold text-slate-200 lg:hidden">Dashboard</Link>
          <button type="button" onClick={() => setIsOpen(true)} aria-label="Open navigation" aria-expanded={isOpen} aria-controls="authenticated-mobile-navigation" className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white lg:hidden">
            <Menu aria-hidden="true" size={20} />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/65" onClick={() => setIsOpen(false)} />
          <aside id="authenticated-mobile-navigation" aria-label="Application menu" className="absolute right-0 top-0 flex h-dvh w-[min(88vw,360px)] flex-col overflow-x-hidden border-l border-white/10 bg-[#090b11] p-4">
            <div className="flex h-12 items-center justify-between border-b border-white/10 pb-3">
              <Link href="/" aria-label="Branzzo home" onClick={() => setIsOpen(false)}>
                <BranzzoLogo showWordmark size={32} wordmarkClassName="text-base font-semibold" />
              </Link>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close navigation" className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-400 hover:bg-white/[0.05] hover:text-white">
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <nav aria-label="Mobile application navigation" className="mt-4 grid gap-1">
              {navItems.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)} aria-current={active ? "page" : undefined} className={cn("focus-ring flex min-h-11 items-center rounded-md px-3 text-sm font-medium", active ? "bg-white/[0.075] text-white" : "text-slate-300 hover:bg-white/[0.04] hover:text-white")}>
                    {item.label}
                  </Link>
                );
              })}
              <Link href="/notifications" onClick={() => setIsOpen(false)} aria-label="View notifications" className="focus-ring flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-slate-300 hover:bg-white/[0.04] hover:text-white">Notifications</Link>
              <Link href="/dashboard/settings/account" onClick={() => setIsOpen(false)} className="focus-ring flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-slate-300 hover:bg-white/[0.04] hover:text-white">Account Settings</Link>
              <button type="button" onClick={() => { setIsOpen(false); openUserProfile(); }} className="focus-ring flex min-h-11 items-center rounded-md px-3 text-left text-sm font-medium text-slate-300 hover:bg-white/[0.04] hover:text-white">Manage Account</button>
              <button type="button" onClick={handleSignOut} className="focus-ring flex min-h-11 items-center rounded-md px-3 text-left text-sm font-medium text-slate-300 hover:bg-white/[0.04] hover:text-white">Sign Out</button>
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
