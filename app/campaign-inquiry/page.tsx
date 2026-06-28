import type { Metadata } from "next";

import { BrandInquiryForm } from "@/components/forms/brand-inquiry-form";
import { Navbar } from "@/components/shared/navbar";

export const metadata: Metadata = {
  title: "Brand Campaign Inquiry",
  description: "Submit a brand campaign inquiry for CreatorBridge admin review.",
};

type InquirySearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CampaignInquiryPage({ searchParams }: { searchParams: InquirySearchParams }) {
  const params = await searchParams;
  const creatorUsername = readParam(params.creator) ?? "";

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-5xl py-8 sm:py-10">
        <div className="mb-8">
          <p className="bridge-eyebrow">Brand Campaign Inquiry</p>
          <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">Tell us what creator you need</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Share the campaign goal, target audience, budget range, and timeline so the right creator fit is easier to review.
          </p>
          {creatorUsername ? (
            <p className="mt-4 inline-flex max-w-full rounded-[8px] border border-violet-800 bg-violet-950/40 px-4 py-2 text-sm text-violet-100">
              Inquiry linked to @{creatorUsername}
            </p>
          ) : null}
        </div>
        <BrandInquiryForm creatorUsername={creatorUsername} />
      </main>
    </>
  );
}
