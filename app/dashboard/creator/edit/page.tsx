import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CreatorOnboardingForm } from "@/components/forms/creator-onboarding-form";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";
import { getCreatorByUsername } from "@/lib/queries/creators";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Creator Profile",
  description: "Update your creator profile on Branzzo.",
};

function numberInput(value?: number | null) {
  return value && value > 0 ? String(value) : "";
}

function decimalInput(value?: number | null) {
  return value && value > 0 ? String(Number(value.toFixed(2))) : "";
}

export default async function CreatorProfileEditPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();

  if (!clerkUserId) redirect("/sign-in");
  if (!user || !user.onboardingComplete) redirect("/onboarding?role=creator");
  if (user.role === "brand") redirect("/dashboard/brand/edit");
  if (user.role !== "creator") redirect("/dashboard");

  const creator = await getCreatorByUsername(user.username);

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-6xl py-8 sm:py-10">
        <Link href="/dashboard/creator" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="mb-8 max-w-3xl">
          <p className="bridge-eyebrow">Creator Profile</p>
          <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">Edit creator profile</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Update the public profile details brands use to evaluate audience fit, pricing, availability, and channels.
          </p>
        </div>

        <CreatorOnboardingForm
          initialName={user.name}
          initialUsername={user.username}
          initialAvatar={creator?.avatar ?? ""}
          initialValues={{
            phoneNumber: user.phoneNumber,
            avatar: creator?.avatar ?? "",
            bio: creator?.bio ?? "",
            niche: creator?.niche ?? [],
            country: creator?.country ?? "India",
            languagesText: creator?.languages.length ? creator.languages.join(", ") : "English, Hindi",
            youtubeUrl: creator?.youtubeUrl ?? "",
            youtubeHandle: creator?.youtubeHandle ?? "",
            subscribers: numberInput(creator?.claimedSubscribers ?? creator?.subscribers),
            avgViews: numberInput(creator?.claimedAverageViews ?? creator?.avgViews),
            engagementRate: decimalInput(creator?.claimedEngagementRate),
            instagramUrl: creator?.instagramUrl ?? "",
            instagramFollowers: numberInput(creator?.instagramFollowers),
            podcastUrl: creator?.podcastUrl ?? "",
            sponsorshipRate: numberInput(creator?.sponsorshipRate),
            rateType: creator?.rateType ?? "per_video",
            pastBrandsText: creator?.pastBrands.join(", ") ?? "",
            sampleWorkText: creator?.sampleWorkUrls.join("\n") ?? "",
            isOpenToDeals: creator?.isOpenToDeals ?? true,
          }}
          redirectHref={null}
          submitLabel="Save Creator Profile"
          successMessage="Creator profile updated."
        />
      </main>
    </>
  );
}
