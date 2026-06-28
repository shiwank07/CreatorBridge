import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Search, Sparkles, UserPlus } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { authHref } from "@/lib/auth-redirect";
import { DEMO_AVATARS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

const mockProfiles = [
  {
    name: "Riya Tech",
    handle: "@riyatech",
    niche: "Tech",
    avatar: DEMO_AVATARS[0],
    subs: 680000,
    views: 145000,
  },
  {
    name: "Aarav Plays",
    handle: "@gamewithaarav",
    niche: "Gaming",
    avatar: DEMO_AVATARS[1],
    subs: 1200000,
    views: 260000,
  },
  {
    name: "Meera Money",
    handle: "@financewithmeera",
    niche: "Finance",
    avatar: DEMO_AVATARS[2],
    subs: 420000,
    views: 87000,
  },
];

export function LandingHero() {
  return (
    <section className="surface-grid relative isolate overflow-hidden border-b border-[var(--border)]">
      <Image
        src={DEMO_AVATARS[1]}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-20 object-cover opacity-25"
      />
      <div className="absolute inset-0 -z-10 bg-[rgba(8,9,13,0.76)]" />
      <div className="bridge-section min-h-[calc(100vh-4rem)] pb-10 pt-16 sm:pt-20 lg:pt-24">
        <div className="grid min-h-[560px] items-center gap-10 lg:grid-cols-[1.03fr_0.97fr]">
          <div className="animate-rise max-w-3xl">
            <Badge tone="neutral" className="border-cyan-400/30 bg-[#0b0f16]/80 text-cyan-100">
              India-first creator economy marketplace
            </Badge>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-black leading-[1.04] text-[var(--text-primary)] md:text-6xl lg:text-7xl">
              CreatorBridge
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold text-[var(--text-primary)] md:text-xl">
              Where brands meet campaign-ready creators.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
              Discover public creator profiles, compare audience stats, and send cleaner campaign inquiries without the DM chaos.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={authHref("/sign-up", "/onboarding?role=creator")} className="bridge-button-primary">
                <UserPlus size={17} />
                I&apos;m a Creator
              </Link>
              <Link href={authHref("/sign-up", "/onboarding?role=brand")} className="bridge-button-secondary">
                <ArrowRight size={17} />
                I&apos;m a Brand
              </Link>
              <Link href="/creators" className="bridge-button-secondary">
                <Search size={17} />
                Browse Creators
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ["Verified stats", "Profiles show claimed and reviewed audience context"],
                ["Fast discovery", "Filter by niche, platform, rate, and availability"],
                ["Cleaner briefs", "Inquiry forms capture campaign basics upfront"],
              ].map(([title, copy]) => (
                <div key={title} className="bridge-panel p-3">
                  <BadgeCheck size={16} className="text-[var(--cyan)]" />
                  <p className="mt-3 text-sm font-bold">{title}</p>
                  <p className="mt-1 hidden text-xs leading-5 text-[var(--text-secondary)] sm:block">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-rise grid gap-4" style={{ animationDelay: "120ms" }}>
            {mockProfiles.map((profile, index) => (
              <div
                key={profile.name}
                className={`bridge-card bridge-card-hover p-4 ${index === 1 ? "animate-float-slow lg:ml-10" : index === 2 ? "lg:ml-20" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={profile.avatar}
                    alt={`${profile.name} profile`}
                    width={72}
                    height={72}
                    className="h-16 w-16 rounded-[8px] object-cover sm:h-[72px] sm:w-[72px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-lg font-bold">{profile.name}</p>
                      <BadgeCheck size={16} className="shrink-0 text-[var(--green)]" />
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{profile.handle}</p>
                    <Badge className="mt-2">{profile.niche}</Badge>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bridge-panel p-3">
                    <p className="font-mono text-xl font-bold">{formatNumber(profile.subs)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Subscribers</p>
                  </div>
                  <div className="bridge-panel p-3">
                    <p className="font-mono text-xl font-bold">{formatNumber(profile.views)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">Avg views</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Sparkles size={16} className="text-[var(--yellow)]" />
              Clear creator context before the first outreach message.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
