import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, ExternalLink, Languages, MapPin, Radio, Send, ShieldCheck, Tags, TvMinimalPlay } from "lucide-react";

import { CreatorProfileHeader } from "@/components/creators/creator-profile-header";
import { StatBox } from "@/components/creators/stat-box";
import { WorkingHistoryCard } from "@/components/collaborations/working-history-card";
import { Badge } from "@/components/shared/badge";
import { Navbar } from "@/components/shared/navbar";
import { TrustPassportCard } from "@/components/verification/trust-passport-card";
import { authHref } from "@/lib/auth-redirect";
import { formatINR, formatNumber } from "@/lib/format";
import { getCurrentAppUser } from "@/lib/current-user";
import { getCreatorCollaborationHistorySummary } from "@/lib/queries/collaborations";
import { creatorMetaDescription, getCreatorByUsername } from "@/lib/queries/creators";
import { getPublicSubscriberCount, hasVerifiedStats, normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

export const dynamic = "force-dynamic";

type CreatorProfileParams = Promise<{ username: string }>;

function displayUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

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
  const [viewer, historySummary] = await Promise.all([
    getCurrentAppUser(),
    getCreatorCollaborationHistorySummary(creator.username),
  ]);
  const viewerRole = viewer?.onboardingComplete && (viewer.role === "creator" || viewer.role === "brand") ? viewer.role : undefined;
  const isOwner = viewerRole === "creator" && viewer?.username === creator.username;
  const statsVerified = hasVerifiedStats(creator);
  const normalizedVerification = normalizeCreatorVerificationStatus(creator.verificationStatus);
  const platformLinks = [
    creator.youtubeUrl ? { label: "YouTube", href: creator.youtubeUrl, icon: TvMinimalPlay } : null,
    creator.instagramUrl ? { label: "Instagram", href: creator.instagramUrl, icon: Camera } : null,
    creator.podcastUrl ? { label: "Podcast", href: creator.podcastUrl, icon: Radio } : null,
  ].filter(Boolean) as { label: string; href: string; icon: typeof TvMinimalPlay }[];
  const rateType = (creator.rateType ?? "per_video").replace("_", " ");

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.name,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/creators/${creator.username}`,
    jobTitle: `${creator.niche[0] ?? "Content"} Creator`,
    sameAs: [creator.youtubeUrl, creator.instagramUrl, creator.podcastUrl].filter(Boolean),
  };

  return (
    <>
      <Navbar />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <CreatorProfileHeader creator={creator} viewerRole={viewerRole} viewerUsername={viewer?.username} />

        <div className="bridge-section grid gap-6 py-8 sm:py-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
          <section className="bridge-card p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="bridge-eyebrow">Audience Snapshot</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Platform Stats</h2>
              </div>
              <Badge tone={statsVerified ? "green" : normalizedVerification === "pending" ? "yellow" : "neutral"}>
                <ShieldCheck size={13} />
                {verificationBadgeLabel(creator.verificationStatus)}
              </Badge>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatBox
                label="YouTube Subs"
                value={formatNumber(getPublicSubscriberCount(creator))}
              />
              <StatBox label="Avg Views" value={formatNumber(creator.avgViews)} />
              <StatBox label="Instagram" value={formatNumber(creator.instagramFollowers)} />
            </div>
          </section>

          <section className="bridge-card p-5">
            <h2 className="font-display text-2xl font-bold">About</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              {creator.bio || "This creator is still polishing their profile details."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="bridge-panel p-3">
                <MapPin size={16} className="text-[var(--cyan)]" />
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Country</p>
                <p className="mt-1 font-semibold">{creator.country || "Not listed"}</p>
              </div>
              <div className="bridge-panel p-3 sm:col-span-2">
                <Languages size={16} className="text-[var(--cyan)]" />
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Languages</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {creator.languages.length > 0 ? (
                    creator.languages.map((language) => (
                      <Badge key={language} tone="neutral">
                        {language}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-[var(--text-secondary)]">Not listed</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bridge-card p-5">
            <h2 className="font-display text-2xl font-bold">Sponsorship Info</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatBox label="Base Rate" value={formatINR(creator.sponsorshipRate)} />
              <StatBox label="Rate Type" value={rateType} />
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

          <WorkingHistoryCard
            accountType="creator"
            summary={historySummary}
            showDetails={false}
            className="bridge-card p-5"
          />

          <section className="bridge-card p-5">
            <div className="flex items-center gap-2">
              <Tags size={20} className="text-[var(--cyan)]" />
              <h2 className="font-display text-2xl font-bold">Sample Work</h2>
            </div>
            {creator.sampleWorkUrls.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {creator.sampleWorkUrls.map((url) => (
                  <Link
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-[#0b0f16] px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                  >
                    <span className="truncate">{displayUrl(url)}</span>
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
            <h2 className="font-display text-xl font-bold">{isOwner ? "Your creator profile" : "Plan an outreach"}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {isOwner
                ? "Keep your profile current so brands see accurate audience, pricing, and availability signals."
                : viewerRole === "brand"
                  ? "Start a collaboration request with your goals, budget range, and preferred timeline."
                  : viewerRole === "creator"
                    ? "Browse this public profile without brand-only collaboration actions."
                    : "Sign in with a brand account to start a structured collaboration request."}
            </p>
            {viewerRole === "brand" ? (
              <Link href={`/campaign-inquiry?creator=${creator.username}`} className="bridge-button-primary mt-5 w-full">
                <Send size={17} />
                Start Collaboration
              </Link>
            ) : isOwner ? (
              <>
                <Link href="/onboarding?role=creator" className="bridge-button-secondary mt-5 w-full">
                  Edit Profile
                </Link>
                <Link href="/dashboard/creator" className="bridge-button-primary mt-3 w-full">
                  View Dashboard
                </Link>
              </>
            ) : !viewerRole ? (
              <Link href={authHref("/sign-in", `/campaign-inquiry?creator=${creator.username}`)} className="bridge-button-primary mt-5 w-full">
                <Send size={17} />
                Sign in to start collaboration
              </Link>
            ) : null}
            <Link href="/creators" className="bridge-button-secondary mt-3 w-full">
              Browse Directory
            </Link>
          </div>

          <TrustPassportCard
            accountType="creator"
            emailVerified
            verificationStatus={creator.verificationStatus}
            completedCollaborations={historySummary.completed}
            className="bridge-card p-5"
          />

          <div className="bridge-card p-5">
            <h2 className="font-display text-xl font-bold">Creator channels</h2>
            {platformLinks.length > 0 ? (
              <div className="mt-4 space-y-2">
                {platformLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-[#0b0f16] px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon size={16} className="shrink-0" />
                      <span className="truncate">{label}</span>
                    </span>
                    <ExternalLink size={15} className="shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Platform links will appear after the creator adds them.</p>
            )}
          </div>
          </aside>
        </div>
      </main>
    </>
  );
}
