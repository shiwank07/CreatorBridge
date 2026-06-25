import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[#09090d]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-lg font-bold">CreatorBridge</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            India-first creator marketplace for discovery, public profiles, and cleaner brand campaign inquiries.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-[var(--text-primary)]">Explore</p>
          <Link href="/creators" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Creator Directory
          </Link>
          <Link href="/campaign-inquiry" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Brand Inquiry
          </Link>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-[var(--text-primary)]">Support</p>
          <p className="text-[var(--text-secondary)]">For partnerships and profile questions, reach the CreatorBridge team directly.</p>
        </div>
      </div>
    </footer>
  );
}
