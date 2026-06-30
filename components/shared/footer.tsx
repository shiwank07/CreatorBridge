import Link from "next/link";

import { getCurrentAppUser } from "@/lib/current-user";

export async function Footer() {
  const user = await getCurrentAppUser();
  const viewerRole = user?.onboardingComplete && (user.role === "creator" || user.role === "brand") ? user.role : undefined;

  return (
    <footer className="border-t border-[var(--border)] bg-[#09090d]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-lg font-bold">CreatorBridge</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            India-first creator marketplace for discovery, public profiles, and cleaner collaboration requests.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-[var(--text-primary)]">Explore</p>
          <Link href="/creators" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Creator Directory
          </Link>
          {viewerRole !== "creator" ? (
            <Link href={viewerRole === "brand" ? "/creators" : "/onboarding?role=brand"} className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              {viewerRole === "brand" ? "Start Collaboration" : "I'm a Brand"}
            </Link>
          ) : null}
          {viewerRole !== "brand" ? (
            <Link href={viewerRole === "creator" ? "/dashboard/creator" : "/onboarding?role=creator"} className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              {viewerRole === "creator" ? "Creator Dashboard" : "I'm a Creator"}
            </Link>
          ) : null}
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-[var(--text-primary)]">Support</p>
          <p className="text-[var(--text-secondary)]">For partnerships and profile questions, reach the CreatorBridge team directly.</p>
        </div>
      </div>
    </footer>
  );
}
