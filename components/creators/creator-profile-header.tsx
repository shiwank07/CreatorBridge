import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Crown, MapPin, Send } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { authHref } from "@/lib/auth-redirect";
import { type CreatorCardData } from "@/lib/types";
import { normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

type CreatorProfileHeaderProps = {
  creator: CreatorCardData;
  viewerRole?: "creator" | "brand";
  viewerUsername?: string;
};

export function CreatorProfileHeader({ creator, viewerRole, viewerUsername }: CreatorProfileHeaderProps) {
  const isOwner = viewerRole === "creator" && viewerUsername === creator.username;
  const verificationStatus = normalizeCreatorVerificationStatus(creator.verificationStatus);

  return (
    <header className="surface-grid border-b border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
      <div className="bridge-section py-8 sm:py-10">
        <Link href="/creators" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to directory
        </Link>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[#0b0f16]">
              <Image
                src={creator.avatar || "https://i.pravatar.cc/200?img=20"}
                alt={`${creator.name} profile photo`}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl md:text-5xl">{creator.name}</h1>
                <Badge tone={verificationStatus === "verified" ? "green" : verificationStatus === "pending" ? "yellow" : "neutral"}>
                  {verificationStatus === "verified" ? <BadgeCheck size={13} /> : null}
                  {verificationBadgeLabel(creator.verificationStatus)}
                </Badge>
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

          {viewerRole === "brand" ? (
            <Link href={`/campaign-inquiry?creator=${creator.username}`} className="bridge-button-primary w-full sm:w-auto">
              <Send size={17} />
              Start Collaboration
            </Link>
          ) : isOwner ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link href="/onboarding?role=creator" className="bridge-button-secondary w-full sm:w-auto">
                Edit Profile
              </Link>
              <Link href="/dashboard/creator" className="bridge-button-primary w-full sm:w-auto">
                View Dashboard
              </Link>
            </div>
          ) : !viewerRole ? (
            <Link href={authHref("/sign-in", `/campaign-inquiry?creator=${creator.username}`)} className="bridge-button-primary w-full sm:w-auto">
              <Send size={17} />
              Sign in to start collaboration
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
