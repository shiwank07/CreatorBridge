"use client";

import { BadgeCheck, CheckCircle2, Search, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";

import { CyberHeroMedia } from "@/components/marketing/cyber-hero-media";
import { authHref } from "@/lib/auth-redirect";
import { useNavigationContext } from "@/components/shared/use-navigation-context";

type LandingHeroProps = {
  viewerRole?: "creator" | "brand";
};

export function LandingHero({ viewerRole }: LandingHeroProps) {
  const context = useNavigationContext();
  const effectiveRole = viewerRole ?? (context.onboardingComplete && (context.role === "creator" || context.role === "brand") ? context.role : undefined);
  const createProfileHref = effectiveRole === "creator" ? "/dashboard/creator" : effectiveRole === "brand" ? "/dashboard/brand" : authHref("/sign-up", "/onboarding?role=creator");

  return (
    <section className="marketing-hero">
      <div className="marketing-hero__grid" />
      <div className="marketing-hero__noise" />
      <div className="marketing-hero__streak" />
      <div className="bridge-section marketing-hero__inner">
        <div className="hero-copy-load marketing-hero__copy">
          <p className="marketing-hero__eyebrow">THE CREATOR COLLABORATION MARKETPLACE</p>
          <h1 className="marketing-hero__title">
            <span className="marketing-hero__title-line marketing-hero__title-accent">Branzzo connects brands</span>
            <span className="marketing-hero__title-line">with verified creators.</span>
          </h1>
          <p className="marketing-hero__support">
            Discover creators across YouTube, Instagram, TikTok, Twitch, and more. Compare professional profiles, send collaboration requests, and manage paid partnerships in one secure platform.
          </p>

          <div className="marketing-hero__actions">
            <Link href="/creators" className="focus-ring marketing-hero__primary-action">
              <Search size={18} />
              <span>Find Creators</span>
            </Link>
            <Link href={createProfileHref} className="focus-ring marketing-hero__secondary-action">
              <UserPlus size={18} />
              <span>{effectiveRole === "creator" ? "Open Creator Dashboard" : effectiveRole === "brand" ? "Open Brand Dashboard" : "Join as Creator"}</span>
            </Link>
            {!effectiveRole ? <Link href={authHref("/sign-up", "/onboarding?role=brand")} className="focus-ring marketing-hero__secondary-action"><UserPlus size={18} /><span>Join as Brand</span></Link> : null}
          </div>
          <div className="marketing-hero__trust" aria-label="Platform trust signals">
            <span><BadgeCheck aria-hidden="true" size={15} /> Verified creator profiles</span>
            <span><ShieldCheck aria-hidden="true" size={15} /> Secure collaboration workflows</span>
            <span><CheckCircle2 aria-hidden="true" size={15} /> Transparent pricing signals</span>
          </div>
        </div>
        <CyberHeroMedia />
      </div>
    </section>
  );
}
