import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Crown, MapPin, Send } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type CreatorCardData } from "@/lib/types";

type CreatorProfileHeaderProps = {
  creator: CreatorCardData;
};

export function CreatorProfileHeader({ creator }: CreatorProfileHeaderProps) {
  return (
    <header className="border-b border-[var(--border)] bg-[#0d0d14]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Image
              src={creator.avatar || "https://i.pravatar.cc/200?img=20"}
              alt={`${creator.name} profile photo`}
              width={112}
              height={112}
              className="h-28 w-28 rounded-[8px] object-cover"
            />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-black">{creator.name}</h1>
                {creator.isVerified ? <BadgeCheck size={22} className="text-[var(--green)]" aria-label="Verified" /> : null}
                {creator.isFeatured ? <Crown size={22} className="text-[var(--yellow)]" aria-label="Featured" /> : null}
              </div>
              <p className="mt-2 text-[var(--text-secondary)]">@{creator.username}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {creator.niche.map((niche) => (
                  <Badge key={niche}>{niche}</Badge>
                ))}
                {creator.country ? (
                  <Badge tone="neutral">
                    <MapPin size={13} />
                    {creator.country}
                  </Badge>
                ) : null}
                {creator.isOpenToDeals ? <Badge tone="green">Open to deals</Badge> : <Badge tone="neutral">Limited availability</Badge>}
              </div>
            </div>
          </div>

          <Link
            href={`/campaign-inquiry?creator=${creator.username}`}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
          >
            <Send size={17} />
            Send Deal Inquiry
          </Link>
        </div>
      </div>
    </header>
  );
}
