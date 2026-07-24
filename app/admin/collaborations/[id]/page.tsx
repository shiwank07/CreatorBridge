import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { CollaborationTimeline } from "@/components/collaborations/collaboration-timeline";
import { Badge } from "@/components/shared/badge";
import { collaborationStatusLabel } from "@/lib/collaborations";
import { formatINR } from "@/lib/format";
import { formatDateTime } from "@/lib/format-date";
import { platformDisplayName } from "@/lib/platforms";
import { getAdminInquiryById } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

type AdminCollaborationParams = Promise<{ id: string }>;

function dateLabel(value?: string) {
  return formatDateTime(value);
}

export default async function AdminCollaborationDetailsPage({ params }: { params: AdminCollaborationParams }) {
  const { id } = await params;
  const collaboration = await getAdminInquiryById(id);
  if (!collaboration) notFound();
  const targetPlatforms = collaboration.targetPlatforms.map((platform) => platformDisplayName(platform, collaboration.customPlatformName));

  return (
    <div>
      <Link href="/admin/collaborations" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
        <ArrowLeft size={16} />
        Back to collaborations
      </Link>

      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Collaboration Details</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl font-black">{collaboration.companyName}</h1>
          <Badge tone="neutral">{collaborationStatusLabel(collaboration.status)}</Badge>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          {collaboration.creatorUsername ? `Creator: @${collaboration.creatorUsername}` : "Open creator brief"}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section className="bridge-card p-5">
          <h2 className="font-display text-2xl font-bold">Brief</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="bridge-panel p-3">
              <p className="text-xs text-[var(--text-secondary)]">Contact</p>
              <p className="mt-1 font-semibold">{collaboration.contactName}</p>
              <p className="mt-1 break-all text-sm text-[var(--text-secondary)]">{collaboration.email}</p>
            </div>
            <div className="bridge-panel p-3">
              <p className="text-xs text-[var(--text-secondary)]">Offer</p>
              <p className="mt-1 font-semibold">
                {collaboration.currentOfferAmount ? formatINR(collaboration.currentOfferAmount) : collaboration.budgetRange}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Goal</p>
            <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{collaboration.campaignGoal}</p>
          </div>
          {targetPlatforms.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Target platforms</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {targetPlatforms.map((platform) => (
                  <Badge key={platform} tone="neutral">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {collaboration.message ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Message</p>
              <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{collaboration.message}</p>
            </div>
          ) : null}
          {collaboration.website ? (
            <Link
              href={collaboration.website}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300"
            >
              Website
              <ExternalLink size={15} />
            </Link>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="bridge-card p-5">
            <h2 className="font-display text-xl font-bold">Timeline</h2>
            <CollaborationTimeline status={collaboration.status} compact className="mt-4" />
          </section>
          <section className="bridge-card p-5">
            <h2 className="font-display text-xl font-bold">Dates</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
              <p>Created: {dateLabel(collaboration.createdAt)}</p>
              <p>Creator responded: {dateLabel(collaboration.creatorResponseAt)}</p>
              <p>Proof submitted: {dateLabel(collaboration.deliveryProof?.submittedAt)}</p>
              <p>Proof reviewed: {dateLabel(collaboration.deliveryProof?.reviewedAt)}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
