import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, Send } from "lucide-react";

import { CreatorProfileHeader } from "@/components/creators/creator-profile-header";
import { StatBox } from "@/components/creators/stat-box";
import { Badge } from "@/components/shared/badge";
import { formatINR, formatNumber } from "@/lib/format";
import { creatorMetaDescription, getCreatorByUsername } from "@/lib/queries/creators";
import { getPublicSubscriberCount, hasVerifiedStats } from "@/lib/verification";

export const dynamic = "force-dynamic";

type CreatorProfileParams = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: CreatorProfileParams }): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);

  if (!creator) {
    return {
      title: "Creator Not Found",
    };
  }

  return {
    title: `${creator.name} - ${formatNumber(getPublicSubscriberCount(creator))} Creator`,
    description: creatorMetaDescription(creator),
    openGraph: {
      title: `${creator.name} on CreatorBridge`,
      description: creatorMetaDescription(creator),
      images: creator.avatar ? [{ url: creator.avatar }] : [],
      type: "profile",
    },
  };
}

export default async function CreatorProfilePage({ params }: { params: CreatorProfileParams }) {
  const { username } = await params;
  const creator = await getCreatorByUsername(username);

  if (!creator) notFound();
  const statsVerified = hasVerifiedStats(creator);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.name,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/creators/${creator.username}`,
    jobTitle: `${creator.niche[0] ?? "Content"} Creator`,
    sameAs: [creator.youtubeUrl, creator.instagramUrl, creator.podcastUrl].filter(Boolean),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <CreatorProfileHeader creator={creator} />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="space-y-6">
          <section className="bridge-card p-5">
            <h2 className="font-display text-2xl font-bold">Platform Stats</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatBox
                label="YouTube Subs"
                value={formatNumber(getPublicSubscriberCount(creator))}
                badge={<Badge tone={statsVerified ? "green" : "neutral"}>{statsVerified ? "Verified" : "Unverified"}</Badge>}
              />
              <StatBox label="Avg Views" value={formatNumber(creator.avgViews)} />
              <StatBox label="Instagram" value={formatNumber(creator.instagramFollowers)} />
            </div>
          </section>

          <section className="bridge-card p-5">
            <h2 className="font-display text-2xl font-bold">About</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{creator.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {creator.languages.map((language) => (
                <Badge key={language} tone="neutral">
                  {language}
                </Badge>
              ))}
            </div>
          </section>

          <section className="bridge-card p-5">
            <h2 className="font-display text-2xl font-bold">Sponsorship Info</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatBox label="Base Rate" value={formatINR(creator.sponsorshipRate)} />
              <StatBox label="Rate Type" value={(creator.rateType ?? "per_video").replace("_", " ")} />
              <StatBox label="Past Brands" value={String(creator.pastBrands.length)} />
            </div>
            {creator.pastBrands.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {creator.pastBrands.map((brand) => (
                  <Badge key={brand} tone="yellow">
                    {brand}
                  </Badge>
                ))}
              </div>
            ) : null}
          </section>

          <section className="bridge-card p-5">
            <h2 className="font-display text-2xl font-bold">Sample Work</h2>
            {creator.sampleWorkUrls.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {creator.sampleWorkUrls.map((url) => (
                  <Link
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-[#0d0d14] px-4 py-3 text-sm text-[var(--text-secondary)]"
                  >
                    <span className="truncate">{url}</span>
                    <ExternalLink size={16} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">Sample work links will appear after the creator adds them.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="bridge-card p-5">
            <h2 className="font-display text-xl font-bold">Brand CTA</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Send this creator a campaign inquiry with your goals, budget range, and preferred timeline.
            </p>
            <Link
              href={`/campaign-inquiry?creator=${creator.username}`}
              className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              <Send size={17} />
              Send a Deal Inquiry
            </Link>
            <button
              type="button"
              disabled
              className="mt-3 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-muted)]"
            >
              <Download size={17} />
              Media Kit Later
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
