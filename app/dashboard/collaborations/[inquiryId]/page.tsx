import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type ComponentType, type ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  FileText,
  Globe2,
  Layers3,
  Mail,
  MessageSquareText,
  Paperclip,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { CollaborationDetailActions } from "@/components/collaborations/collaboration-detail-actions";
import { CollaborationTimeline } from "@/components/collaborations/collaboration-timeline";
import { Badge } from "@/components/shared/badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { Navbar } from "@/components/shared/navbar";
import { TrustPassportCard } from "@/components/verification/trust-passport-card";
import { collaborationStatusLabel } from "@/lib/collaborations";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { formatINR } from "@/lib/format";
import { getCurrentUserCollaborationDetails } from "@/lib/queries/collaborations";
import { type BrandVerificationStatus } from "@/lib/types";
import { normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

export const dynamic = "force-dynamic";

type CollaborationDetailsPageProps = {
  params: Promise<{ inquiryId: string }>;
};

function formatDate(value?: string) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function campaignTitle(goal: string, companyName: string) {
  const firstLine = goal.split(/\r?\n/)[0]?.trim();
  if (firstLine) return firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine;
  return `${companyName} collaboration`;
}

function verificationTone(status: BrandVerificationStatus) {
  if (status === "verified") return "green";
  if (status === "pending") return "yellow";
  return "neutral";
}

function verificationLabel(status: BrandVerificationStatus) {
  if (status === "verified") return "Verified brand";
  if (status === "pending") return "Brand verification pending";
  if (status === "rejected") return "Brand verification needs review";
  return "Brand unverified";
}

function creatorVerificationTone(status: string) {
  const normalized = normalizeCreatorVerificationStatus(status);
  if (normalized === "verified") return "green";
  if (normalized === "pending") return "yellow";
  return "neutral";
}

function offerAmountLabel(value?: number) {
  return value ? formatINR(value) : "Exact offer not recorded";
}

function DetailBlock({
  label,
  value,
  Icon,
}: {
  label: string;
  value: ReactNode;
  Icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="min-w-0 max-w-full rounded-[8px] border border-white/10 bg-black/20 p-4 [overflow-wrap:anywhere]">
      <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
        <Icon size={15} className="shrink-0 text-cyan-200" />
        <span className="min-w-0 break-words">{label}</span>
      </div>
      <div className="mt-3 min-w-0 max-w-full text-sm leading-6 text-[var(--text-primary)] [overflow-wrap:anywhere]">{value}</div>
    </div>
  );
}

export default async function CollaborationDetailsPage({ params }: CollaborationDetailsPageProps) {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (!clerkUserId) redirect("/sign-in");
  if (!user || !user.onboardingComplete) {
    redirect(user?.role === "brand" ? "/onboarding?role=brand" : user?.role === "creator" ? "/onboarding?role=creator" : "/onboarding");
  }
  if (user.role !== "creator" && user.role !== "brand") redirect("/dashboard");

  const { inquiryId } = await params;
  const collaboration = await getCurrentUserCollaborationDetails(inquiryId);
  if (!collaboration) notFound();

  const dashboardHref = user.role === "brand" ? "/dashboard/brand#campaigns" : "/dashboard/creator#collaborations";
  const attachments = [
    collaboration.website ? { label: "Brand website", href: collaboration.website } : null,
    collaboration.deliveryProof?.videoUrl ? { label: "Delivery video", href: collaboration.deliveryProof.videoUrl } : null,
    collaboration.deliveryProof?.referenceLink ? { label: "Reference link", href: collaboration.deliveryProof.referenceLink } : null,
    collaboration.deliveryProof?.screenshotUrl ? { label: "Screenshot", href: collaboration.deliveryProof.screenshotUrl } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-6xl">
        <Link href={dashboardHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to command center
        </Link>

        <section className="relative max-w-full overflow-hidden rounded-[8px] border border-cyan-300/15 bg-white/[0.045] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex min-w-0 flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0 max-w-3xl flex-1">
              <p className="bridge-eyebrow">Collaboration Details</p>
              <h1 className="mt-3 break-words font-display text-3xl font-black leading-tight [overflow-wrap:anywhere] sm:text-4xl">
                {campaignTitle(collaboration.campaignGoal, collaboration.companyName)}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={collaboration.status === "DECLINED" || collaboration.status === "CANCELLED" ? "neutral" : "green"}>{collaborationStatusLabel(collaboration.status)}</Badge>
                <Badge tone={verificationTone(collaboration.brandVerificationStatus)}>{verificationLabel(collaboration.brandVerificationStatus)}</Badge>
                <Badge tone={creatorVerificationTone(collaboration.creatorVerificationStatus)}>{verificationBadgeLabel(collaboration.creatorVerificationStatus)}</Badge>
                {collaboration.creatorUsername ? <Badge tone="neutral">@{collaboration.creatorUsername}</Badge> : null}
              </div>
            </div>
            <div className="grid w-full max-w-full min-w-0 gap-3 lg:w-80">
              <div className="min-w-0 rounded-[8px] border border-white/10 bg-black/20 p-4 [overflow-wrap:anywhere]">
                <div className="flex items-start gap-3">
                  <InitialsAvatar
                    name={collaboration.companyName}
                    alt={`${collaboration.companyName} brand avatar`}
                    className="h-10 w-10 rounded-[8px] border-violet-300/25"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Brand details</p>
                    <p className="mt-1 break-words font-semibold text-[var(--text-primary)] [overflow-wrap:anywhere]">{collaboration.companyName}</p>
                    <p className="mt-1 break-words text-xs text-[var(--text-secondary)]">{verificationLabel(collaboration.brandVerificationStatus)}</p>
                  </div>
                </div>
              </div>
              <div className="min-w-0 rounded-[8px] border border-white/10 bg-black/20 p-4 [overflow-wrap:anywhere]">
                <div className="flex items-start gap-3">
                  <InitialsAvatar
                    name={collaboration.creatorUsername}
                    username={collaboration.creatorUsername}
                    alt={`${collaboration.creatorUsername || "Creator"} avatar`}
                    className="h-10 w-10 rounded-[8px] border-cyan-300/25"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Creator details</p>
                    <p className="mt-1 break-words font-semibold text-[var(--text-primary)] [overflow-wrap:anywhere]">
                      {collaboration.creatorUsername ? `@${collaboration.creatorUsername}` : "Creator not linked"}
                    </p>
                    <p className="mt-1 break-words text-xs text-[var(--text-secondary)]">{verificationBadgeLabel(collaboration.creatorVerificationStatus)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid min-w-0 max-w-full gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-w-0 gap-4">
            <section className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="bridge-eyebrow">Campaign Brief</p>
                  <h2 className="mt-2 font-display text-2xl font-bold">Request snapshot</h2>
                </div>
                <FileText size={22} className="text-cyan-200" />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <DetailBlock label="Campaign title" value={campaignTitle(collaboration.campaignGoal, collaboration.companyName)} Icon={BadgeCheck} />
                <DetailBlock
                  label="Brand details"
                  value={
                    <div className="grid gap-1">
                      <span>{collaboration.companyName}</span>
                      <span className="text-[var(--text-secondary)]">{collaboration.contactName}</span>
                      {collaboration.contactEmailRevealed ? (
                        <span className="inline-flex min-w-0 max-w-full items-center gap-2 text-[var(--text-secondary)]">
                          <Mail size={14} className="shrink-0" />
                          <span className="truncate">{collaboration.brandContactEmail ?? collaboration.email}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Contact email appears after the creator accepts.</span>
                      )}
                      {collaboration.website ? (
                        <Link href={collaboration.website} target="_blank" rel="noreferrer" className="inline-flex min-w-0 max-w-full items-center gap-2 text-cyan-200 hover:text-cyan-100">
                          <Globe2 size={14} className="shrink-0" />
                          <span className="truncate">Brand website</span>
                        </Link>
                      ) : null}
                    </div>
                  }
                  Icon={Building2}
                />
                <DetailBlock
                  label="Creator details"
                  value={
                    <div className="grid gap-1">
                      <span>{collaboration.creatorUsername ? `@${collaboration.creatorUsername}` : "Creator not linked"}</span>
                      <span className="text-[var(--text-secondary)]">{verificationBadgeLabel(collaboration.creatorVerificationStatus)}</span>
                      {collaboration.contactEmailRevealed ? (
                        <span className="inline-flex min-w-0 max-w-full items-center gap-2 text-[var(--text-secondary)]">
                          <Mail size={14} className="shrink-0" />
                          <span className="truncate">{collaboration.creatorContactEmail || "Creator email unavailable"}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Creator email appears after acceptance.</span>
                      )}
                    </div>
                  }
                  Icon={UserRound}
                />
                <DetailBlock label="Current status" value={collaborationStatusLabel(collaboration.status)} Icon={ShieldCheck} />
                <DetailBlock label="Offer amount" value={offerAmountLabel(collaboration.currentOfferAmount)} Icon={CircleDollarSign} />
                <DetailBlock label="Timeline" value={collaboration.timeline} Icon={CalendarDays} />
                <DetailBlock label="Date received" value={formatDate(collaboration.createdAt)} Icon={CalendarDays} />
                <DetailBlock
                  label="Deliverables"
                  value={
                    collaboration.deliverables.length ? (
                      <div className="flex flex-wrap gap-2">
                        {collaboration.deliverables.map((deliverable) => (
                          <span key={deliverable} className="max-w-full break-words rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere]">
                            {deliverable}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "Not specified"
                    )
                  }
                  Icon={Layers3}
                />
              </div>

              <div className="mt-4 grid gap-4">
                <DetailBlock label="Campaign goal" value={collaboration.campaignGoal} Icon={FileText} />
                <DetailBlock label="Message to creator" value={collaboration.message || "No additional message was included."} Icon={MessageSquareText} />
                <DetailBlock
                  label="Attachments"
                  value={
                    attachments.length ? (
                      <div className="grid gap-2">
                        {attachments.map((attachment) => (
                          <Link
                            key={`${attachment.label}-${attachment.href}`}
                            href={attachment.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-w-0 max-w-full items-center gap-2 text-cyan-200 hover:text-cyan-100"
                          >
                            <ExternalLink size={14} className="shrink-0" />
                            <span className="truncate">{attachment.label}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      "No attachments included."
                    )
                  }
                  Icon={Paperclip}
                />
              </div>
            </section>

            <section className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
              <p className="bridge-eyebrow">Progress</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Collaboration timeline</h2>
              <CollaborationTimeline status={collaboration.status} history={collaboration.statusHistory} className="mt-5" />
            </section>
          </div>

          <div className="grid h-fit min-w-0 gap-4">
            <CollaborationDetailActions collaboration={collaboration} viewerRole={user.role} />
            <section className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-5 [overflow-wrap:anywhere]">
              <p className="bridge-eyebrow">Brand Verification Status</p>
              <h2 className="mt-2 font-display text-xl font-bold">{verificationLabel(collaboration.brandVerificationStatus)}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {collaboration.brandVerificationNote || "Verification context is based on the existing brand profile linked to this inquiry."}
              </p>
            </section>
            <section className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-5 [overflow-wrap:anywhere]">
              <p className="bridge-eyebrow">Creator Verification Status</p>
              <h2 className="mt-2 font-display text-xl font-bold">{verificationBadgeLabel(collaboration.creatorVerificationStatus)}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Creator trust context is based on the linked creator profile for this collaboration.
              </p>
            </section>
            <TrustPassportCard
              accountType="brand"
              emailVerified={Boolean(collaboration.brandEmailVerified)}
              phoneAdded={Boolean(collaboration.brandPhoneAdded)}
              phoneVerified={Boolean(collaboration.brandPhoneVerified)}
              verificationStatus={collaboration.brandVerificationStatus}
              completedCollaborations={0}
              className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5"
            />
          </div>
        </section>
      </main>
    </>
  );
}
