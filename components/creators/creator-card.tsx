import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Camera, Crown, Eye, Globe2, Languages, Radio, Send, Sparkles, TvMinimalPlay } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { authHref } from "@/lib/auth-redirect";
import { formatINR, formatNumber } from "@/lib/format";
import { type CreatorCardData } from "@/lib/types";
import { getPublicSubscriberCount, hasVerifiedStats, normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

type CreatorCardProps = {
  creator: CreatorCardData;
  viewerRole?: "creator" | "brand";
};

function engagementRate(creator: CreatorCardData) {
  const subscribers = getPublicSubscriberCount(creator);
  const views = creator.avgViews ?? 0;

  if (!subscribers || !views) return "N/A";

  return `${Math.min((views / subscribers) * 100, 99).toFixed(1)}%`;
}

function coverClass(username: string) {
  const variants = [
    "from-violet-500/30 via-cyan-300/12 to-fuchsia-400/25",
    "from-cyan-300/25 via-blue-500/15 to-violet-500/30",
    "from-emerald-300/20 via-cyan-300/14 to-violet-500/28",
    "from-rose-300/20 via-violet-500/22 to-cyan-300/16",
  ];
  const index = username.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % variants.length;
  return variants[index];
}

export function CreatorCard({ creator, viewerRole }: CreatorCardProps) {
  const statsVerified = hasVerifiedStats(creator);
  const normalizedVerification = normalizeCreatorVerificationStatus(creator.verificationStatus);
  const subscriberCount = getPublicSubscriberCount(creator);
  const platforms = [
    creator.youtubeUrl ? { label: "YouTube", icon: TvMinimalPlay } : null,
    creator.instagramUrl ? { label: "Instagram", icon: Camera } : null,
    creator.podcastUrl ? { label: "Podcast", icon: Radio } : null,
  ].filter(Boolean) as { label: string; icon: typeof TvMinimalPlay }[];

  return (
    <article className="creator-premium-card group flex h-full flex-col overflow-hidden">
      <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${coverClass(creator.username)}`}>
        <div className="absolute inset-0 creator-card-grid" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {creator.isFeatured ? (
            <Badge tone="yellow" className="border-yellow-300/25 bg-yellow-300/10 text-yellow-100">
              <Crown size={12} />
              Featured
            </Badge>
          ) : null}
          <Badge tone={statsVerified ? "green" : normalizedVerification === "pending" ? "yellow" : "neutral"} className="border-white/10 bg-black/25 text-white backdrop-blur-md">
            {statsVerified ? <BadgeCheck size={12} /> : <Sparkles size={12} />}
            {verificationBadgeLabel(creator.verificationStatus)}
          </Badge>
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          {platforms.slice(0, 3).map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/15 bg-black/25 text-cyan-100 backdrop-blur-md"
              title={label}
            >
              <Icon size={15} />
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col p-5 pt-0">
        <div className="-mt-9 flex items-end gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-cyan-200/35 bg-[#0b0f16] shadow-[0_0_30px_rgba(103,232,249,0.18)]">
            <Image
              src={creator.avatar || "https://i.pravatar.cc/160?img=12"}
              alt={`${creator.name} profile photo`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 pb-2">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate font-display text-xl font-bold text-white">{creator.name}</h3>
              {creator.isVerified ? <BadgeCheck size={17} className="shrink-0 text-emerald-300" aria-label="Verified" /> : null}
            </div>
            <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">@{creator.username}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {creator.niche.slice(0, 3).map((niche) => (
            <Badge key={niche} className="border-violet-300/20 bg-violet-400/10 text-violet-100">
              {niche}
            </Badge>
          ))}
          {creator.isOpenToDeals ? <Badge tone="green">Open to deals</Badge> : <Badge tone="neutral">Limited availability</Badge>}
        </div>

        <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--text-secondary)]">
          {creator.bio || "This creator is still polishing their profile details."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            { label: "Subscribers", value: formatNumber(subscriberCount) },
            { label: "Avg Views", value: formatNumber(creator.avgViews) },
            { label: "Engagement", value: engagementRate(creator) },
            { label: "Starting Price", value: formatINR(creator.sponsorshipRate) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3">
              <p className="truncate font-mono text-base font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-[11px] uppercase text-[var(--text-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 text-sm text-[var(--text-secondary)]">
          <div className="flex min-w-0 items-center gap-2">
            <Languages size={15} className="shrink-0 text-cyan-200" />
            <span className="truncate">{creator.languages.length > 0 ? creator.languages.slice(0, 3).join(", ") : "Languages not listed"}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Globe2 size={15} className="shrink-0 text-violet-200" />
            <span className="truncate">{creator.country || "Country not listed"}</span>
          </div>
        </div>

        <div className={`mt-5 grid gap-2 ${viewerRole === "creator" ? "" : "sm:grid-cols-2"}`}>
          <Link
            href={`/creators/${creator.username}`}
            className="bridge-button-primary px-4"
          >
            <Eye size={16} />
            View Profile
          </Link>
          {viewerRole === "creator" ? null : (
            <Link
              href={viewerRole === "brand" ? `/campaign-inquiry?creator=${creator.username}` : authHref("/sign-in", `/campaign-inquiry?creator=${creator.username}`)}
              className="bridge-button-secondary px-4"
              aria-label={viewerRole === "brand" ? `Start collaboration with ${creator.name}` : `Sign in to start collaboration with ${creator.name}`}
            >
              <Send size={16} />
              {viewerRole === "brand" ? "Start Collaboration" : "Sign In"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
