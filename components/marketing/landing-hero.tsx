import { ArrowRight, Search, UserPlus } from "lucide-react";
import Link from "next/link";

import { CyberHeroMedia } from "@/components/marketing/cyber-hero-media";
import { authHref } from "@/lib/auth-redirect";

type LandingHeroProps = {
  viewerRole?: "creator" | "brand";
};

export function LandingHero({ viewerRole }: LandingHeroProps) {
  const createProfileHref = viewerRole === "creator" ? "/dashboard/creator" : viewerRole === "brand" ? "/dashboard/brand" : authHref("/sign-up", "/onboarding?role=creator");
  const brandHref = viewerRole === "brand" ? "/dashboard/brand" : authHref("/sign-up", "/onboarding?role=brand");

  return (
    <section className="marketing-hero">
      <div className="marketing-hero__grid" />
      <div className="marketing-hero__noise" />
      <div className="marketing-hero__streak" />
      <div className="bridge-section marketing-hero__inner">
        <div className="hero-copy-load marketing-hero__copy">
          <p className="marketing-hero__eyebrow">THE CREATOR COLLABORATION NETWORK</p>
          <h1 className="marketing-hero__title">
            <span className="marketing-hero__title-line">Creator signals.</span>
            <span className="marketing-hero__title-line">Real brand partnerships.</span>
          </h1>
          <p className="marketing-hero__support">Discover trusted creators, send structured offers and manage every collaboration from first contact to final delivery.</p>

          <div className="marketing-hero__actions">
            <Link href="/creators" className="focus-ring marketing-hero__primary-action">
              <Search size={18} />
              <span>Explore Creators</span>
            </Link>
            <Link href={createProfileHref} className="focus-ring marketing-hero__secondary-action">
              <UserPlus size={18} />
              <span>Create Your Profile</span>
            </Link>
            <Link href={brandHref} className="focus-ring marketing-hero__tertiary-link">
              <span>I represent a brand</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <CyberHeroMedia />
      </div>
    </section>
  );
}
