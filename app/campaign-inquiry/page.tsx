import type { Metadata } from "next";

import { BrandInquiryForm } from "@/components/forms/brand-inquiry-form";

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
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Brand Campaign Inquiry</p>
        <h1 className="mt-3 font-display text-4xl font-black">Tell us what creator you need</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Share the campaign goal, target audience, budget range, and timeline so the right creator fit is easier to review.
        </p>
      </div>
      <BrandInquiryForm creatorUsername={creatorUsername} />
    </main>
  );
}
