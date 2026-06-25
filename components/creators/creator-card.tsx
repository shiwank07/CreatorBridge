import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Crown, Eye, Send } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { StatBox } from "@/components/creators/stat-box";
import { formatINR, formatNumber } from "@/lib/format";
import { type CreatorCardData } from "@/lib/types";
import { getPublicSubscriberCount, hasVerifiedStats } from "@/lib/verification";

type CreatorCardProps = {
  creator: CreatorCardData;
};

export function CreatorCard({ creator }: CreatorCardProps) {
  const statsVerified = hasVerifiedStats(creator);
  const subscriberBadge = (
    <Badge tone={statsVerified ? "green" : "neutral"} className="gap-1 px-2 py-0.5">
      {statsVerified ? <BadgeCheck size={12} /> : null}
      {statsVerified ? "Verified" : "Unverified"}
    </Badge>
  );

  return (
    <article className="bridge-card bridge-card-hover flex h-full flex-col p-5">
      <div className="flex items-start gap-4">
        <Image
          src={creator.avatar || "https://i.pravatar.cc/160?img=12"}
          alt={`${creator.name} profile photo`}
          width={64}
          height={64}
          className="h-16 w-16 rounded-[8px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold">{creator.name}</h3>
            {creator.isVerified ? <BadgeCheck size={17} className="text-[var(--green)]" aria-label="Verified" /> : null}
            {creator.isFeatured ? <Crown size={17} className="text-[var(--yellow)]" aria-label="Featured" /> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">@{creator.username}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {creator.niche.slice(0, 3).map((niche) => (
          <Badge key={niche}>{niche}</Badge>
        ))}
        {creator.isOpenToDeals ? <Badge tone="green">Open to deals</Badge> : <Badge tone="neutral">Limited availability</Badge>}
      </div>

      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--text-secondary)]">{creator.bio}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatBox label="Subscribers" value={formatNumber(getPublicSubscriberCount(creator))} badge={subscriberBadge} />
        <StatBox label="Avg Views" value={formatNumber(creator.avgViews)} />
        <StatBox label="Base Rate" value={formatINR(creator.sponsorshipRate)} />
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          href={`/creators/${creator.username}`}
          className="focus-ring inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
        >
          <Eye size={16} />
          View Profile
        </Link>
        <Link
          href={`/campaign-inquiry?creator=${creator.username}`}
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label={`Send campaign inquiry to ${creator.name}`}
        >
          <Send size={16} />
        </Link>
      </div>
    </article>
  );
}
