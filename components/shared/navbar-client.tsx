"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Menu, X } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
};

type NavbarClientProps = {
  navItems: NavItem[];
  isSignedIn: boolean;
  signInHref: string;
  joinHref: string;
};

export function NavbarClient({ navItems, isSignedIn, signInHref, joinHref }: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const primaryHref = isSignedIn ? "/admin" : joinHref;
  const primaryLabel = isSignedIn ? "Dashboard" : "Join Free";

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

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-300/15 bg-[#070712]/88 shadow-[0_14px_46px_rgba(0,0,0,0.28),0_0_34px_rgba(103,232,249,0.08)] backdrop-blur-2xl transition-all duration-300">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2 font-display text-base font-bold sm:gap-3 sm:text-lg">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-cyan-300/35 bg-white/[0.06] text-sm text-cyan-100 shadow-[0_0_32px_rgba(103,232,249,0.22)]">
            <span className="absolute inset-0 bg-gradient-to-br from-violet-500/35 via-transparent to-cyan-300/25" />
            <span className="relative">CB</span>
          </span>
          <span className="truncate">
            Creator<span className="text-cyan-200">Bridge</span>
          </span>
        </Link>

        <nav className="ml-auto hidden min-w-0 items-center rounded-full border border-white/10 bg-white/[0.045] px-1.5 py-1 text-xs text-[var(--text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] lg:flex xl:text-sm">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="focus-ring whitespace-nowrap rounded-full px-2.5 py-2 transition hover:bg-white/[0.07] hover:text-[var(--text-primary)] xl:px-3.5"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-2">
          {!isSignedIn ? (
            <Link href={signInHref} className="bridge-button-secondary hidden px-4 py-2 xl:inline-flex">
              Sign In
            </Link>
          ) : null}
          <Link href={primaryHref} className="bridge-button-primary min-h-10 shrink-0 px-3 py-2 text-xs sm:px-4 sm:text-sm">
            {isSignedIn ? <LayoutDashboard size={16} /> : null}
            <span className="whitespace-nowrap">{primaryLabel}</span>
          </Link>
          {isSignedIn ? <UserButton /> : null}
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
                  CB
                </span>
                <span className="truncate">
                  Creator<span className="text-cyan-200">Bridge</span>
                </span>
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
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="focus-ring rounded-[8px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={signInHref}
                onClick={closeMenu}
                className="focus-ring rounded-[8px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
              >
                Sign In
              </Link>
            </nav>

            <Link href={primaryHref} onClick={closeMenu} className="bridge-button-primary mt-auto w-full">
              {primaryLabel}
            </Link>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
