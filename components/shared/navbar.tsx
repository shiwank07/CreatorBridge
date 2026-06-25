import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LayoutDashboard, Search, Send, UserPlus } from "lucide-react";

import { hasClerkKeys } from "@/lib/clerk-config";

export async function Navbar() {
  const { userId } = hasClerkKeys() ? await auth() : { userId: null };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(10,10,15,0.88)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-display text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-violet-700 bg-violet-950 text-sm text-violet-100">
            CB
          </span>
          CreatorBridge
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-[var(--text-secondary)] md:flex">
          <Link href="/creators" className="hover:text-[var(--text-primary)]">
            Creators
          </Link>
          <Link href="/campaign-inquiry" className="hover:text-[var(--text-primary)]">
            Campaign Inquiry
          </Link>
          <Link href="/admin" className="hover:text-[var(--text-primary)]">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {!userId ? (
            <>
            <Link
              href="/sign-in"
              className="focus-ring hidden rounded-[8px] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="focus-ring inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              <UserPlus size={16} />
              Join Free
            </Link>
            </>
          ) : (
            <>
            <Link
              href="/onboarding"
              className="focus-ring hidden items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] sm:inline-flex"
            >
              <Send size={16} />
              Onboarding
            </Link>
            <Link
              href="/admin"
              className="focus-ring hidden items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white md:inline-flex"
            >
              <LayoutDashboard size={16} />
              Admin
            </Link>
            <UserButton />
            </>
          )}
          <Link
            href="/creators"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--border)] text-[var(--text-secondary)] md:hidden"
            aria-label="Search creators"
          >
            <Search size={17} />
          </Link>
        </div>
      </div>
    </header>
  );
}
