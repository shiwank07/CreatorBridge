import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BrandOnboardingForm } from "@/components/forms/brand-onboarding-form";
import { Navbar } from "@/components/shared/navbar";
import { AccountUnavailable } from "@/components/shared/account-unavailable";
import { getCurrentAppUserResult, getCurrentClerkUserId } from "@/lib/current-user";
import { getBrandByUsername } from "@/lib/queries/brands";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Brand Profile",
  description: "Update your brand profile on Branzzo.",
};

export default async function BrandProfileEditPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const userResult = await getCurrentAppUserResult();

  if (!clerkUserId) redirect("/sign-in");
  if (userResult.status === "temporarily_unavailable") return <AccountUnavailable retryHref="/dashboard/brand/edit" />;
  if (userResult.status === "account_restricted") redirect("/403");
  if (userResult.status !== "found" || !userResult.user.onboardingComplete) redirect("/onboarding?role=brand");
  const user = userResult.user;
  if (user.role === "creator") redirect("/dashboard/creator/edit");
  if (user.role !== "brand") redirect("/dashboard");

  let brand: Awaited<ReturnType<typeof getBrandByUsername>>;
  try {
    brand = await getBrandByUsername(user.username);
  } catch {
    return <><Navbar role="brand" username={user.username} /><AccountUnavailable retryHref="/dashboard/brand/edit" /></>;
  }

  return (
    <>
      <Navbar role="brand" username={user.username} />
      <main className="bridge-section max-w-6xl py-8 sm:py-10">
        <Link href="/dashboard/brand" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="mb-8 max-w-3xl">
          <p className="bridge-eyebrow">Brand Profile</p>
          <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">Edit brand profile</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Update the brand details creators use to understand your company, category, location, website, and collaboration context.
          </p>
        </div>

        <BrandOnboardingForm
          initialContactName={brand?.contactName ?? user.name}
          initialEmail={brand?.contactEmail ?? user.email}
          initialLogo={brand?.avatar ?? ""}
          initialValues={{
            phoneNumber: user.phoneNumber,
            companyName: brand?.companyName ?? "",
            contactName: brand?.contactName ?? user.name,
            contactRole: brand?.contactRole ?? "",
            contactEmail: brand?.contactEmail ?? user.email,
            logo: brand?.avatar ?? "",
            website: brand?.website ?? "",
            industry: brand?.industry ?? "",
            companySize: brand?.companySize ?? "",
            country: brand?.country ?? "India",
            companyRegistrationText: brand?.companyRegistrationText ?? "",
            notes: brand?.notes ?? "",
            displayPublicly: brand?.displayPublicly ?? false,
          }}
          redirectHref={null}
          submitLabel="Save Brand Profile"
          successMessage="Brand profile updated."
        />
      </main>
    </>
  );
}
