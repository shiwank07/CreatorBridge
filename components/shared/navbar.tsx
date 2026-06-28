import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ChevronRight, LayoutDashboard, Menu, Sparkles, UserPlus } from "lucide-react";

import { authHref } from "@/lib/auth-redirect";
import { hasClerkKeys } from "@/lib/clerk-config";

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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070712]/78 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 font-display text-lg font-bold">
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[8px] border border-cyan-300/35 bg-white/[0.06] text-sm text-cyan-100 shadow-[0_0_32px_rgba(103,232,249,0.22)]">
            <span className="absolute inset-0 bg-gradient-to-br from-violet-500/35 via-transparent to-cyan-300/25" />
            <span className="relative">CB</span>
          </span>
          <span>
            Creator<span className="text-cyan-200">Bridge</span>
          </span>
        </Link>

        <nav className="hidden items-center rounded-full border border-white/10 bg-white/[0.045] px-2 py-1 text-sm text-[var(--text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="focus-ring rounded-full px-3.5 py-2 transition hover:bg-white/[0.07] hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!userId ? (
            <>
              <Link href={authHref("/sign-in", onboardingHref)} className="bridge-button-secondary hidden px-4 py-2 sm:inline-flex">
                Sign In
              </Link>
              <Link href={authHref("/sign-up", onboardingHref)} className="bridge-button-primary px-4 py-2">
                <UserPlus size={16} />
                Join Free
              </Link>
            </>
          ) : (
            <>
              <Link href="/campaign-inquiry" className="bridge-button-secondary hidden px-4 py-2 sm:inline-flex">
                <Sparkles size={16} />
                New Inquiry
              </Link>
              <Link href="/admin" className="bridge-button-primary hidden px-4 py-2 md:inline-flex">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <UserButton />
            </>
          )}
          <Link
            href="/creators"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-[var(--text-secondary)] lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={17} />
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 pb-3 text-xs font-semibold text-[var(--text-secondary)] sm:px-6 lg:hidden">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className="focus-ring inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
            {item.label}
            <ChevronRight size={12} />
          </Link>
        ))}
      </nav>
    </header>
  );
}
