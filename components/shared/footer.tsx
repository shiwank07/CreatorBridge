import Link from "next/link";

import { getCurrentAppUser } from "@/lib/current-user";
import { CONTACT_EMAILS } from "@/lib/constants";

export async function Footer() {
  const user = await getCurrentAppUser();
  const viewerRole = user?.onboardingComplete && (user.role === "creator" || user.role === "brand") ? user.role : undefined;

  return (
    <footer className="border-t border-[var(--border)] bg-[#09090d]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.35fr_0.9fr_0.9fr_0.9fr] lg:px-8">
        <div>
          <p className="font-display text-lg font-bold">Branzzo</p>
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
          <Link href="/about" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            About Us
          </Link>
          <Link href="/contact" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Contact Us
          </Link>
          <Link href="/trust-safety" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Trust & Safety
          </Link>
          <a href={`mailto:${CONTACT_EMAILS.support}`} className="block break-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            {CONTACT_EMAILS.support}
          </a>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-[var(--text-primary)]">Legal</p>
          <Link href="/privacy" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Privacy Policy
          </Link>
          <Link href="/terms" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Terms of Service
          </Link>
          <Link href="/community-guidelines" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Community Guidelines
          </Link>
        </div>
      </div>
    </footer>
  );
}
