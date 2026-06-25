import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, UserPlus } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { DEMO_AVATARS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

const mockProfiles = [
  {
    name: "Riya Tech",
    niche: "Tech",
    avatar: DEMO_AVATARS[0],
    subs: 680000,
    views: 145000,
  },
  {
    name: "Aarav Plays",
    niche: "Gaming",
    avatar: DEMO_AVATARS[1],
    subs: 1200000,
    views: 260000,
  },
  {
    name: "Meera Money",
    niche: "Finance",
    avatar: DEMO_AVATARS[2],
    subs: 420000,
    views: 87000,
  },
];

export function LandingHero() {
  return (
    <section className="overflow-hidden border-b border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <Badge tone="neutral" className="mx-auto">
          India-first creator economy marketplace
        </Badge>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-black leading-[1.05] text-[var(--text-primary)] md:text-6xl">
          Where Brands Meet Creators.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
          Find the right creator for your campaign, or build a public profile that brings better brand deals without the DM chaos.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/onboarding?role=creator"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
          >
            <UserPlus size={17} />
            I&apos;m a Creator
          </Link>
          <Link
            href="/onboarding?role=brand"
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)]"
          >
            <ArrowRight size={17} />
            I&apos;m a Brand
          </Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
          {mockProfiles.map((profile) => (
            <div key={profile.name} className="bridge-card bridge-card-hover p-4 text-left">
              <div className="flex items-center gap-3">
                <Image src={profile.avatar} alt={`${profile.name} profile`} width={56} height={56} className="h-14 w-14 rounded-[8px] object-cover" />
                <div>
                  <p className="font-display font-bold">{profile.name}</p>
                  <Badge className="mt-1">{profile.niche}</Badge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[8px] border border-[var(--border)] bg-[#0d0d14] p-3">
                  <p className="font-mono text-xl font-bold">{formatNumber(profile.subs)}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Subscribers</p>
                </div>
                <div className="rounded-[8px] border border-[var(--border)] bg-[#0d0d14] p-3">
                  <p className="font-mono text-xl font-bold">{formatNumber(profile.views)}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Avg views</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Sparkles size={16} className="text-[var(--yellow)]" />
          Clear creator context before the first outreach message.
        </div>
      </div>
    </section>
  );
}
