import Link from "next/link";
import { ArrowRight, BadgeCheck, CircuitBoard, RadioTower, Search, UserPlus, Zap } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { authHref } from "@/lib/auth-redirect";

type LandingHeroProps = {
  viewerRole?: "creator" | "brand";
};

export function LandingHero({ viewerRole }: LandingHeroProps) {
  return (
    <section className="hero-abstract relative isolate overflow-hidden border-b border-[var(--border)]">
      <div className="creator-grid-field" />
      <div className="creator-aurora-field" />
      <div className="creator-particle creator-particle-a" />
      <div className="creator-particle creator-particle-b" />
      <div className="creator-particle creator-particle-c" />
      <div className="bridge-section min-h-[calc(100svh-4rem)] pb-10 pt-12 sm:pt-16 lg:pt-20">
        <div className="grid min-h-[520px] items-center gap-8 lg:grid-cols-[1.03fr_0.97fr] lg:gap-10">
          <div className="hero-copy-load max-w-3xl">
            <Badge tone="neutral" className="border-cyan-400/30 bg-[#0b0f16]/80 text-cyan-100">
              India-first creator economy marketplace
            </Badge>
            <h1 className="mt-6 max-w-4xl font-display text-4xl font-black leading-[1.05] text-[var(--text-primary)] sm:text-5xl md:text-6xl xl:text-7xl">
              Branzzo
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold text-[var(--text-primary)] sm:text-lg md:text-xl">
              Where brands meet campaign-ready creators.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base md:text-lg">
              Discover public creator profiles, compare audience stats, and start cleaner collaboration requests without the DM chaos.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {viewerRole !== "brand" ? (
                <Link href={viewerRole === "creator" ? "/dashboard/creator" : authHref("/sign-up", "/onboarding?role=creator")} className="bridge-button-primary w-full sm:w-auto">
                  <UserPlus size={17} />
                  {viewerRole === "creator" ? "Creator Dashboard" : "I'm a Creator"}
                </Link>
              ) : null}
              {viewerRole !== "creator" ? (
                <Link href={viewerRole === "brand" ? "/dashboard/brand" : authHref("/sign-up", "/onboarding?role=brand")} className="bridge-button-secondary w-full sm:w-auto">
                  <ArrowRight size={17} />
                  {viewerRole === "brand" ? "Brand Dashboard" : "I'm a Brand"}
                </Link>
              ) : null}
              <Link href="/creators" className="bridge-button-secondary w-full sm:w-auto">
                <Search size={17} />
                Browse Creators
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ["Verified stats", "Profiles show claimed and reviewed audience context"],
                ["Fast discovery", "Filter by niche, platform, rate, and availability"],
                ["Cleaner briefs", "Collaboration requests capture campaign basics upfront"],
              ].map(([title, copy]) => (
                <div key={title} className="bridge-panel premium-card-load p-3">
                  <BadgeCheck size={16} className="text-[var(--cyan)]" />
                  <p className="mt-3 text-sm font-bold">{title}</p>
                  <p className="mt-1 hidden text-xs leading-5 text-[var(--text-secondary)] sm:block">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-panel-load hidden lg:grid">
            <div className="hero-signal-panel p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-cyan-200">Creator Signal Engine</p>
                  <p className="mt-1 font-display text-xl font-bold">Campaign fit map</p>
                </div>
                <CircuitBoard size={24} className="text-cyan-200" />
              </div>

              <div className="relative mt-6 h-72 overflow-hidden rounded-[8px] border border-white/10 bg-black/20">
                <div className="absolute inset-0 creator-card-grid opacity-30" />
                <div className="absolute left-8 top-8 h-16 w-44 rounded-[8px] border border-cyan-300/25 bg-cyan-300/10 p-3 shadow-[0_0_34px_rgba(103,232,249,0.14)]">
                  <p className="text-xs font-semibold text-cyan-100">Verified stats</p>
                  <p className="mt-2 font-mono text-lg font-bold">680K reach</p>
                </div>
                <div className="absolute right-8 top-24 h-16 w-44 rounded-[8px] border border-violet-300/25 bg-violet-400/10 p-3 shadow-[0_0_34px_rgba(124,58,237,0.16)]">
                  <p className="text-xs font-semibold text-violet-100">Brand fit</p>
                  <p className="mt-2 font-mono text-lg font-bold">92% match</p>
                </div>
                <div className="absolute bottom-8 left-16 h-16 w-48 rounded-[8px] border border-emerald-300/20 bg-emerald-300/10 p-3">
                  <p className="text-xs font-semibold text-emerald-100">Open to deals</p>
                  <p className="mt-2 font-mono text-lg font-bold">Live now</p>
                </div>
                <div className="absolute left-[46%] top-[42%] flex h-14 w-14 items-center justify-center rounded-[8px] border border-white/15 bg-white/[0.08] text-cyan-100 backdrop-blur-md">
                  <RadioTower size={24} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Niche", "Tech"],
                  ["Views", "145K"],
                  ["Rate", "Rs. 85K"],
                ].map(([label, value]) => (
                  <div key={label} className="bridge-panel premium-card-load p-3">
                    <p className="font-mono text-lg font-bold">{value}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Zap size={16} className="text-[var(--yellow)]" />
                Clear creator context before the first outreach message.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
