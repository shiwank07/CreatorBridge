import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, UserPlus } from "lucide-react";

import { BrandOnboardingForm } from "@/components/forms/brand-onboarding-form";
import { CreatorOnboardingForm } from "@/components/forms/creator-onboarding-form";
import { BranzzoLogo } from "@/components/branding/branzzo-logo";
import { AuthSetupNotice } from "@/components/shared/auth-setup-notice";
import { Navbar } from "@/components/shared/navbar";
import { AccountUnavailable } from "@/components/shared/account-unavailable";
import { accountDestination, getApplicationAccountState } from "@/lib/application-account-state";
import { hasClerkKeys } from "@/lib/clerk-config";
import { generateUsername } from "@/lib/slug";
import { logServerTiming } from "@/lib/server-timing";

export const dynamic = "force-dynamic";

type OnboardingSearchParams = Promise<Record<string, string | string[] | undefined>>;
type OnboardingRole = "creator" | "brand";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isOnboardingRole(value: string | undefined): value is OnboardingRole {
  return value === "creator" || value === "brand";
}

export default async function OnboardingPage({ searchParams }: { searchParams: OnboardingSearchParams }) {
  const renderStartedAt = performance.now();
  if (!hasClerkKeys()) return <AuthSetupNotice />;

  const params = await searchParams;
  const accountState = await getApplicationAccountState();
  const accountDestinationHref = accountDestination(accountState);
  if (accountDestinationHref && accountDestinationHref !== "/onboarding") redirect(accountDestinationHref);
  if (accountState.status === "temporarily_unavailable") return <AccountUnavailable retryHref="/onboarding" />;
  const requestedRole = readParam(params.role);
  const explicitRole = isOnboardingRole(requestedRole) ? requestedRole : null;
  const selectedRole: OnboardingRole | null = explicitRole ?? (accountState.status === "needs_onboarding" ? accountState.preferredRole ?? null : null);
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const email = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "";
  const fallbackName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || email.split("@")[0] || "Creator";

  const initialUsername = accountState.status === "needs_onboarding" && accountState.username
    ? accountState.username
    : generateUsername(clerkUser.username ?? fallbackName);

  logServerTiming("server-render.total", performance.now() - renderStartedAt, { route: "/onboarding" });

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-6xl py-8 sm:py-10">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <BranzzoLogo showWordmark size={48} className="mb-5" wordmarkClassName="text-xl" />
          <p className="bridge-eyebrow">Onboarding</p>
          <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">
            {selectedRole === "creator" ? "Build your public creator profile" : selectedRole === "brand" ? "Create your brand profile" : "Choose how you use Branzzo"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {selectedRole === "creator"
              ? "Give brands the essentials they need to understand your audience, content style, pricing, and availability."
              : selectedRole === "brand" ? "Add your company and contact details so your brand account is ready." : "Select Creator or Brand once to begin your profile."}
          </p>
        </div>
        <div className="bridge-card p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/onboarding?role=creator&switchRole=1"
              className={`focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-cyan-300/40 ${
                selectedRole === "creator"
                  ? "border-violet-700 bg-violet-950 text-violet-100"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              <UserPlus size={16} />
              I&apos;m a Creator
            </Link>
            <Link
              href="/onboarding?role=brand&switchRole=1"
              className={`focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-cyan-300/40 ${
                selectedRole === "brand"
                  ? "border-emerald-800 bg-emerald-950 text-emerald-100"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              <Building2 size={16} />
              I&apos;m a Brand
            </Link>
          </div>
        </div>
      </div>
      {selectedRole === "creator" ? (
        <CreatorOnboardingForm initialName={fallbackName} initialUsername={initialUsername} initialAvatar={clerkUser.imageUrl} />
      ) : selectedRole === "brand" ? (
        <BrandOnboardingForm initialContactName={fallbackName} initialEmail={email} />
      ) : null}
      </main>
    </>
  );
}
