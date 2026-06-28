import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2, ExternalLink, MapPin } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { getBrandByUsername } from "@/lib/queries/brands";

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
    title: `${brand.companyName} on CreatorBridge`,
    description: `${brand.companyName} is a ${brand.industry} brand on CreatorBridge.`,
  };
}

export default async function BrandProfilePage({ params }: { params: BrandProfileParams }) {
  const { username } = await params;
  const brand = await getBrandByUsername(username);

  if (!brand) notFound();

  const isVerified = brand.verificationStatus === "verified";

  return (
    <main>
      <header className="surface-grid border-b border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
        <div className="bridge-section py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[#0b0f16]">
              <Building2 size={34} className="text-[var(--cyan)]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-black leading-tight md:text-5xl">{brand.companyName}</h1>
                {isVerified ? (
                  <Badge tone="green">
                    <BadgeCheck size={13} />
                    Verified brand
                  </Badge>
                ) : (
                  <Badge tone="neutral">Unverified brand</Badge>
                )}
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

      <div className="bridge-section grid gap-6 py-10 lg:grid-cols-[1fr_320px]">
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

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="bridge-card p-5">
            <h2 className="font-display text-xl font-bold">Verification</h2>
            <div className="mt-4">
              {isVerified ? (
                <Badge tone="green">
                  <BadgeCheck size={13} />
                  Verified brand
                </Badge>
              ) : (
                <Badge tone="neutral">Verification pending or not submitted</Badge>
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
        </aside>
      </div>
    </main>
  );
}
