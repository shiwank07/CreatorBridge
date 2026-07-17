import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2, UserRound } from "lucide-react";
import { type ReactNode } from "react";

import { BrandVerificationCard } from "@/components/verification/brand-verification-card";
import { CreatorVerificationCard } from "@/components/verification/creator-verification-card";
import { VerificationStep as VerificationStepRow } from "@/components/verification/verification-step";
import { Badge } from "@/components/shared/badge";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { getBrandByUsername } from "@/lib/queries/brands";
import { getCreatorByUsername } from "@/lib/queries/creators";
import { type BrandProfileData, type CreatorCardData } from "@/lib/types";
import { normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Verification Center",
  description: "Manage Branzzo creator and brand verification.",
};

type VerificationStep = {
  label: string;
  detail: string;
  done: boolean;
  current?: boolean;
  href?: string;
  targetId?: string;
  focusId?: string;
};

function progressPercent(steps: VerificationStep[]) {
  if (!steps.length) return 0;
  return Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
}

function statusTone(status?: string) {
  if (status === "verified" || status === "stats_verified" || status === "ownership_verified") return "green";
  if (status === "pending" || status === "pending_ownership" || status === "needs_review") return "yellow";
  return "neutral";
}

function ProgressPanel({
  title,
  description,
  status,
  statusLabel,
  steps,
  code,
  codeLabel,
  codeHelp,
  children,
}: {
  title: string;
  description: string;
  status?: string;
  statusLabel: string;
  steps: VerificationStep[];
  code?: string;
  codeLabel?: string;
  codeHelp?: string;
  children?: ReactNode;
}) {
  const progress = progressPercent(steps);

  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="bridge-eyebrow">Branzzo</p>
          <h2 className="mt-2 font-display text-2xl font-bold">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
        </div>
        <Badge tone={statusTone(status)} className="shrink-0">
          {statusLabel}
        </Badge>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-[var(--text-muted)]">
          <span>Verification progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {steps.map((step, index) => {
          return (
            <VerificationStepRow key={step.label} index={index} {...step} />
          );
        })}
      </div>

      {code ? (
        <div className="mt-5 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-xs font-semibold uppercase text-cyan-100">{codeLabel}</p>
          <p className="mt-2 break-all font-mono text-2xl font-black text-[var(--text-primary)]">{code}</p>
          {codeHelp ? <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{codeHelp}</p> : null}
        </div>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

function creatorSteps(emailVerified: boolean, creator: CreatorCardData | null): VerificationStep[] {
  const status = normalizeCreatorVerificationStatus(creator?.verificationStatus);
  const profileCompleted = Boolean(creator?.bio && creator.niche.length > 0 && creator.languages.length > 0);
  const platformSubmitted = Boolean(creator?.verificationProfileUrl);

  return [
    {
      label: "Email verified",
      detail: emailVerified ? "Your Clerk email is verified on your Branzzo account." : "Verify your account email before review.",
      done: emailVerified,
      href: emailVerified ? undefined : "/dashboard/settings/account",
    },
    {
      label: "Profile completed",
      detail: profileCompleted ? "Your creator profile has the basic public details reviewers need." : "Add bio, niche, and languages in onboarding.",
      done: profileCompleted,
      href: "/dashboard/creator/edit",
    },
    {
      label: "Platform ownership submitted",
      detail: platformSubmitted ? "A public platform link has been submitted for manual review." : "Submit a YouTube, Instagram, Twitch, or other public bio link.",
      done: platformSubmitted,
      targetId: "platform-verification",
      focusId: platformSubmitted ? "creator-verification-url" : "creator-verification-platform",
    },
    {
      label: "Admin review",
      detail: status === "pending" ? "Under admin review." : status === "rejected" ? `Rejected: ${creator?.verificationRejectedReason || "Update the submission and resubmit."}` : "Manual review starts after your platform link is submitted.",
      done: status === "verified",
      current: status === "pending",
      targetId: status === "pending" ? undefined : "platform-verification",
      focusId: "creator-verification-url",
    },
    {
      label: "Verified creator",
      detail: status === "verified" ? "Your public creator verification badge is active." : "Your badge appears after admin approval.",
      done: status === "verified",
      href: status === "verified" && creator?.username ? `/creators/${creator.username}` : undefined,
    },
  ];
}

function brandSteps(emailVerified: boolean, brand: BrandProfileData | null): VerificationStep[] {
  const status = brand?.verificationStatus ?? "unverified";
  const profileCompleted = Boolean(brand?.companyName && brand.contactName && brand.industry);

  return [
    {
      label: "Email verified",
      detail: emailVerified ? "Your Clerk email is verified on your Branzzo account." : "Verify your account email before review.",
      done: emailVerified,
      href: emailVerified ? undefined : "/dashboard/settings/account",
    },
    {
      label: "Brand profile completed",
      detail: profileCompleted ? "Your brand profile includes company and industry details." : "Complete the brand profile basics in onboarding.",
      done: profileCompleted,
      href: "/dashboard/brand/edit",
    },
    {
      label: "Company website submitted",
      detail: brand?.website ? "A company website is saved for admin review." : "Submit the official company website.",
      done: Boolean(brand?.website),
    },
    {
      label: "Work email/domain submitted",
      detail: brand?.contactEmail ? "A work email is saved for admin review." : "Submit a work email or domain-linked address.",
      done: Boolean(brand?.contactEmail),
    },
    {
      label: "Admin review",
      detail: status === "pending" ? "An admin needs to manually check your company details." : "Manual review starts after company details are submitted.",
      done: status === "verified",
      current: status === "pending",
      href: status === "pending" ? undefined : "/dashboard/brand/edit",
    },
    {
      label: "Verified brand",
      detail: status === "verified" ? "Your public brand verification badge is active." : "Your badge appears after admin approval.",
      done: status === "verified",
      href: status === "verified" && brand?.username ? `/brands/${brand.username}` : undefined,
    },
  ];
}

export default async function VerificationCenterPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();
  if (!clerkUserId) redirect("/sign-in");
  if (!user || !user.onboardingComplete) {
    redirect(user?.role === "brand" ? "/onboarding?role=brand" : user?.role === "creator" ? "/onboarding?role=creator" : "/onboarding");
  }
  if (user.role !== "creator" && user.role !== "brand") redirect("/dashboard");

  const dashboardHref = user.role === "brand" ? "/dashboard/brand" : "/dashboard/creator";

  if (user.role === "creator") {
    const creator = await getCreatorByUsername(user.username);
    const normalizedStatus = normalizeCreatorVerificationStatus(creator?.verificationStatus);
    const code = creator?.verificationCode;

    return (
      <>
        <Navbar />
        <main className="bridge-section max-w-5xl py-8 sm:py-10">
          <Link href={dashboardHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <header className="mb-6 rounded-[8px] border border-cyan-300/15 bg-white/[0.045] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="bridge-eyebrow">Verification Center</p>
                <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">Creator trust setup</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                  Prove platform ownership before collaborations move forward. No platform APIs or document uploads are used in this MVP.
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                <UserRound size={22} />
              </span>
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <ProgressPanel
              title="Creator verification"
              description="Place your BZ code in your YouTube About section, Instagram bio, Twitch profile, or other platform bio, then submit the public link for admin review."
              status={normalizedStatus}
              statusLabel={verificationBadgeLabel(normalizedStatus)}
              steps={creatorSteps(user.emailVerified, creator)}
              code={code}
              codeLabel={creator?.verificationCode ? "Your verification code" : "Code format"}
              codeHelp={
                creator?.verificationCode
                  ? "This exact code must be visible in the submitted platform bio or About section before admin review."
                  : "Submit your platform link below to generate and store your unique BZ code, then place it in your bio/About section before admin review."
              }
            >
              <div className="rounded-[8px] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[var(--text-secondary)]">
                Current status: <span className="font-semibold text-[var(--text-primary)]">{verificationBadgeLabel(normalizedStatus)}</span>
              </div>
            </ProgressPanel>

            <CreatorVerificationCard creator={creator} />
          </div>
        </main>
      </>
    );
  }

  const brand = await getBrandByUsername(user.username);
  const status = brand?.verificationStatus ?? "unverified";

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-5xl py-8 sm:py-10">
        <Link href={dashboardHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="mb-6 rounded-[8px] border border-cyan-300/15 bg-white/[0.045] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="bridge-eyebrow">Verification Center</p>
              <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">Brand trust setup</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                Submit company website and work contact details for manual admin review. Text fields only in the MVP.
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-violet-300/20 bg-violet-400/10 text-violet-100">
              <Building2 size={22} />
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <ProgressPanel
            title="Brand verification"
            description="Add your official website, work email or domain, and optional GST/CIN/VAT or company registration text so an admin can review trust signals."
            status={status}
            statusLabel={verificationBadgeLabel(status, "brand")}
            steps={brandSteps(user.emailVerified, brand)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[8px] border border-white/10 bg-black/20 p-4 text-sm leading-6">
                <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Company website</p>
                <p className="mt-2 break-all text-[var(--text-primary)]">{brand?.website || "Not submitted"}</p>
              </div>
              <div className="rounded-[8px] border border-white/10 bg-black/20 p-4 text-sm leading-6">
                <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Work email/domain</p>
                <p className="mt-2 break-all text-[var(--text-primary)]">{brand?.contactEmail || "Not submitted"}</p>
              </div>
            </div>
          </ProgressPanel>

          <BrandVerificationCard brand={brand} />
        </div>
      </main>
    </>
  );
}
