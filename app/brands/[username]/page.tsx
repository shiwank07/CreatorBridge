import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink, MapPin } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { Navbar } from "@/components/shared/navbar";
import { ProfileCompletionCard } from "@/components/shared/profile-completion-card";
import { TrustPassportCard } from "@/components/verification/trust-passport-card";
import { getCurrentAppUser } from "@/lib/current-user";
import { calculateBrandProfileCompletion } from "@/lib/profile-completion";
import { getBrandByUsername } from "@/lib/queries/brands";
import { verificationBadgeLabel } from "@/lib/verification";

export const dynamic = "force-dynamic";

type BrandProfileParams = Promise<{ username: string }>;

function displayUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: { params: BrandProfileParams }): Promise<Metadata> {
  const { username } = await params;
  const brand = await getBrandByUsername(username);

  if (!brand) {
    return {
      title: "Brand Not Found",
    };
  }

  return {
    title: `${brand.companyName} on Branzzo`,
    description: `${brand.companyName} is a ${brand.industry} brand on Branzzo.`,
  };
}

export default async function BrandProfilePage({ params }: { params: BrandProfileParams }) {
  const { username } = await params;
  const brand = await getBrandByUsername(username);
  const viewer = await getCurrentAppUser();

  if (!brand) notFound();

  const isVerified = brand.verificationStatus === "verified";
  const isOwner = viewer?.role === "brand" && viewer.username === brand.username;
  const ownerProfileCompletion = calculateBrandProfileCompletion({
    brand,
    emailVerified: Boolean(viewer?.email || brand.contactEmail),
    phoneVerified: Boolean(viewer?.phoneVerified || brand.phoneVerified),
  });

  return (
    <>
      <Navbar />
      <main>
        <header className="surface-grid border-b border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
          <div className="bridge-section py-8 sm:py-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <InitialsAvatar
                imageUrl={brand.avatar}
                name={brand.companyName}
                username={brand.username}
                alt={`${brand.companyName} brand avatar`}
                sizes="80px"
                className="h-20 w-20 rounded-[8px] border-[var(--border)]"
                textClassName="text-2xl"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl md:text-5xl">{brand.companyName}</h1>
                  <Badge tone={isVerified ? "green" : brand.verificationStatus === "pending" ? "yellow" : "neutral"}>
                    {isVerified ? <BadgeCheck size={13} /> : null}
                    {verificationBadgeLabel(brand.verificationStatus, "brand")}
                  </Badge>
                </div>
                <p className="mt-2 text-[var(--text-secondary)]">@{brand.username}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge>{brand.industry}</Badge>
                  {brand.country ? (
                    <Badge tone="neutral">
                      <MapPin size={13} />
                      {brand.country}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bridge-section grid gap-6 py-8 sm:py-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
          <section className="bridge-card p-5">
            <h2 className="font-display text-2xl font-bold">Brand Details</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="bridge-panel p-3">
                <p className="text-xs text-[var(--text-secondary)]">Contact</p>
                <p className="mt-1 font-semibold">{brand.contactName}</p>
                {brand.contactRole ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{brand.contactRole}</p> : null}
              </div>
              <div className="bridge-panel p-3">
                <p className="text-xs text-[var(--text-secondary)]">Company size</p>
                <p className="mt-1 font-semibold">{brand.companySize || "Not listed"}</p>
              </div>
            </div>
          </section>

          <section className="bridge-card p-5">
            <h2 className="font-display text-2xl font-bold">Collaboration Profile</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="bridge-panel p-3">
                <p className="text-xs text-[var(--text-secondary)]">Industry</p>
                <p className="mt-1 font-semibold">{brand.industry}</p>
              </div>
              <div className="bridge-panel p-3">
                <p className="text-xs text-[var(--text-secondary)]">Location</p>
                <p className="mt-1 font-semibold">{brand.country || "Not listed"}</p>
              </div>
              <div className="bridge-panel p-3">
                <p className="text-xs text-[var(--text-secondary)]">Trust status</p>
                <p className="mt-1 font-semibold">{verificationBadgeLabel(brand.verificationStatus, "brand")}</p>
              </div>
            </div>
            {brand.verificationNote ? (
              <p className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                {brand.verificationNote}
              </p>
            ) : null}
          </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {isOwner ? (
              <div className="bridge-card p-5">
                <h2 className="font-display text-xl font-bold">Brand workspace</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  Manage your brand profile, sent collaborations, and proof review from the brand dashboard.
                </p>
                <Link href="/dashboard/brand/edit" className="bridge-button-secondary mt-5 w-full">
                  Edit Brand Profile
                </Link>
                <Link href="/dashboard/brand" className="bridge-button-primary mt-3 w-full">
                  View Dashboard
                </Link>
              </div>
            ) : null}
            {isOwner ? (
              <ProfileCompletionCard completion={ownerProfileCompletion} updateHref="/dashboard/brand/edit" className="bridge-card p-5" />
            ) : null}
            <div className="bridge-card p-5">
              <h2 className="font-display text-xl font-bold">Verification</h2>
              <div className="mt-4">
                {isVerified ? (
                  <Badge tone="green">
                    <BadgeCheck size={13} />
                    {verificationBadgeLabel(brand.verificationStatus, "brand")}
                  </Badge>
                ) : (
                  <Badge tone={brand.verificationStatus === "pending" ? "yellow" : "neutral"}>{verificationBadgeLabel(brand.verificationStatus, "brand")}</Badge>
                )}
              </div>
              {brand.website ? (
                <Link
                  href={brand.website}
                  target="_blank"
                  rel="noreferrer"
                  className="bridge-button-secondary mt-5 w-full"
                >
                  <span className="truncate">{displayUrl(brand.website)}</span>
                  <ExternalLink size={16} />
                </Link>
              ) : null}
            </div>
            <TrustPassportCard
              accountType="brand"
              emailVerified={Boolean(brand.contactEmail)}
              phoneAdded={Boolean(brand.phoneAdded)}
              phoneVerified={Boolean(brand.phoneVerified)}
              verificationStatus={brand.verificationStatus}
              successfulCollaborations={0}
              joinedDate={brand.createdAt}
              className="bridge-card p-5"
            />
          </aside>
        </div>
      </main>
    </>
  );
}
