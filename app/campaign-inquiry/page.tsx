import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandInquiryForm } from "@/components/forms/brand-inquiry-form";
import { Navbar } from "@/components/shared/navbar";
import { authHref } from "@/lib/auth-redirect";
import { hasClerkKeys } from "@/lib/clerk-config";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Start Collaboration",
  description: "Start a structured creator collaboration request on CreatorBridge.",
};

type InquirySearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CampaignInquiryPage({ searchParams }: { searchParams: InquirySearchParams }) {
  const params = await searchParams;
  const creatorUsername = readParam(params.creator) ?? "";
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();

  if (hasClerkKeys() && !clerkUserId) {
    redirect(authHref("/sign-in", creatorUsername ? `/campaign-inquiry?creator=${creatorUsername}` : "/creators"));
  }

  if (clerkUserId && (!user || !user.onboardingComplete)) {
    redirect(user?.role === "brand" ? "/onboarding?role=brand" : user?.role === "creator" ? "/onboarding?role=creator" : "/onboarding");
  }

  if (user?.role === "creator") {
    redirect("/dashboard/creator");
  }

  if (user?.role && user.role !== "brand") {
    redirect("/dashboard");
  }

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-5xl py-8 sm:py-10">
        <div className="mb-8">
          <p className="bridge-eyebrow">Collaboration Request</p>
          <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">Start a creator collaboration</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Share the campaign goal, deliverables, budget range, and timeline so the right creator fit is easier to review.
          </p>
          {creatorUsername ? (
            <p className="mt-4 inline-flex max-w-full rounded-[8px] border border-violet-800 bg-violet-950/40 px-4 py-2 text-sm text-violet-100">
              Collaboration linked to @{creatorUsername}
            </p>
          ) : null}
        </div>
        {creatorUsername ? (
          <BrandInquiryForm creatorUsername={creatorUsername} />
        ) : (
          <div className="bridge-card p-6">
            <h2 className="font-display text-2xl font-bold">Choose a creator first</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Collaboration requests must be linked to a creator profile so they appear in the creator dashboard and notification inbox.
            </p>
            <Link href="/creators" className="bridge-button-primary mt-6 w-full sm:w-auto">
              Browse Creator Directory
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
