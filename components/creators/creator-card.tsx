import Link from "next/link";
import { BadgeCheck, Camera, Crown, Eye, Globe2, Languages, Radio, Send, Sparkles, TvMinimalPlay } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { canStartCreatorCollaboration, creatorAvailabilityLabel, creatorAvailabilityNotice, creatorAvailabilityTone } from "@/lib/availability";
import { authHref } from "@/lib/auth-redirect";
import { formatINR, formatNumber } from "@/lib/format";
import { platformDisplayName } from "@/lib/platforms";
import { type CreatorCardData } from "@/lib/types";
import {
  getPublicAverageViews,
  getPublicEngagementRate,
  getPublicSubscriberCount,
  normalizeCreatorVerificationStatus,
  verificationBadgeLabel,
} from "@/lib/verification";

type CreatorCardProps = {
  creator: CreatorCardData;
  viewerRole?: "creator" | "brand";
};

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
  const normalizedVerification = normalizeCreatorVerificationStatus(creator.verificationStatus);
  const subscriberCount = getPublicSubscriberCount(creator);
  const averageViews = getPublicAverageViews(creator);
  const engagement = getPublicEngagementRate(creator);
  const canStart = canStartCreatorCollaboration(creator.availabilityStatus, creator.isOpenToDeals);
  const availabilityNotice = creatorAvailabilityNotice(creator.availabilityStatus, creator.isOpenToDeals);
  const knownPlatformUrls = [creator.youtubeUrl, creator.instagramUrl, creator.podcastUrl].filter(Boolean);
  const customPlatformLabel = creator.verificationPlatform === "other" ? platformDisplayName("other", creator.customPlatformName) : "";
  const hasCustomPlatform =
    Boolean(customPlatformLabel) &&
    Boolean(creator.verificationProfileUrl) &&
    !knownPlatformUrls.includes(creator.verificationProfileUrl ?? "");
  const platforms = [
    creator.youtubeUrl ? { label: "YouTube", icon: TvMinimalPlay } : null,
    creator.instagramUrl ? { label: "Instagram", icon: Camera } : null,
    creator.podcastUrl ? { label: "Podcast", icon: Radio } : null,
    hasCustomPlatform ? { label: customPlatformLabel, icon: Globe2 } : null,
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
          <Badge tone={normalizedVerification === "verified" ? "green" : normalizedVerification === "pending" ? "yellow" : "neutral"} className="border-white/10 bg-black/25 text-white backdrop-blur-md">
            {normalizedVerification === "verified" ? <BadgeCheck size={12} /> : <Sparkles size={12} />}
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
          <InitialsAvatar
            imageUrl={creator.avatar}
            name={creator.name}
            username={creator.username}
            alt={`${creator.name} profile photo`}
            sizes="80px"
            className="h-20 w-20 rounded-full border-cyan-200/35"
            textClassName="text-xl"
          />
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
          <Badge tone={creatorAvailabilityTone(creator.availabilityStatus, creator.isOpenToDeals)}>
            {creatorAvailabilityLabel(creator.availabilityStatus, creator.isOpenToDeals)}
          </Badge>
        </div>

        <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--text-secondary)]">
          {creator.bio || "This creator is still polishing their profile details."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            { label: "Subscribers", value: subscriberCount > 0 ? formatNumber(subscriberCount) : "Not added yet", muted: subscriberCount <= 0 },
            { label: "Avg Views", value: averageViews > 0 ? formatNumber(averageViews) : "Stats pending", muted: averageViews <= 0 },
            { label: "Engagement", value: engagement > 0 ? `${engagement.toFixed(1)}%` : "Complete profile", muted: engagement <= 0 },
            { label: "Starting Price", value: creator.sponsorshipRate && creator.sponsorshipRate > 0 ? formatINR(creator.sponsorshipRate) : "Pricing not set", muted: !creator.sponsorshipRate },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.045] p-3">
              <p className={`${stat.muted ? "text-sm font-semibold leading-5 text-cyan-100" : "font-mono text-base font-bold text-white"} break-words`}>
                {stat.value}
              </p>
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
          {viewerRole === "creator" ? null : canStart ? (
            <Link
              href={viewerRole === "brand" ? `/campaign-inquiry?creator=${creator.username}` : authHref("/sign-in", `/campaign-inquiry?creator=${creator.username}`)}
              className="bridge-button-secondary px-4"
              aria-label={viewerRole === "brand" ? `Start collaboration with ${creator.name}` : `Sign in to start collaboration with ${creator.name}`}
            >
              <Send size={16} />
              {viewerRole === "brand" ? "Start Collaboration" : "Sign In"}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              title={availabilityNotice}
              className="inline-flex max-w-full items-center justify-center gap-2 whitespace-normal rounded-[8px] border border-[var(--border)] bg-[rgba(17,19,26,0.46)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-muted)]"
            >
              <Send size={16} />
              Unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
