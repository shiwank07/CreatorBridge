import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, UserPlus } from "lucide-react";

import { BrandOnboardingForm } from "@/components/forms/brand-onboarding-form";
import { CreatorOnboardingForm } from "@/components/forms/creator-onboarding-form";
import { AuthSetupNotice } from "@/components/shared/auth-setup-notice";
import { Navbar } from "@/components/shared/navbar";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { User } from "@/lib/models/User";
import { generateUsername } from "@/lib/slug";

export const dynamic = "force-dynamic";

type OnboardingSearchParams = Promise<Record<string, string | string[] | undefined>>;
type OnboardingRole = "creator" | "brand";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingPage({ searchParams }: { searchParams: OnboardingSearchParams }) {
  if (!hasClerkKeys()) return <AuthSetupNotice />;

  const params = await searchParams;
  const requestedRole = readParam(params.role);
  let selectedRole: OnboardingRole = requestedRole === "brand" ? "brand" : "creator";
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const email = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "";
  const fallbackName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || email.split("@")[0] || "Creator";

  let initialUsername = generateUsername(clerkUser.username ?? fallbackName);
  let databaseWarning = hasMongoUri() ? "" : "MongoDB is not configured yet. Add your Atlas connection string before saving onboarding data.";
  let completedCreatorUsername = "";

  if (hasMongoUri()) {
    try {
      await connectDB();
      const dbUser = await User.findOne({ clerkId: clerkUser.id });
      if (!requestedRole && dbUser?.role === "brand") selectedRole = "brand";
      if (selectedRole === "creator" && dbUser?.role === "creator" && dbUser?.onboardingComplete) {
        completedCreatorUsername = dbUser.username;
      }
      if (dbUser?.username) initialUsername = dbUser.username;
    } catch (error) {
      console.error("Onboarding database preload failed", error);
      databaseWarning = "MongoDB Atlas is not reachable right now. Check the connection string, network access, and Atlas IP allowlist.";
    }
  }

  if (completedCreatorUsername) redirect(`/creators/${completedCreatorUsername}`);

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-6xl py-8 sm:py-10">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <p className="bridge-eyebrow">Onboarding</p>
          <h1 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">
            {selectedRole === "creator" ? "Build your public creator profile" : "Create your brand profile"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {selectedRole === "creator"
              ? "Give brands the essentials they need to understand your audience, content style, pricing, and availability."
              : "Add your company and contact details so your brand account is ready."}
          </p>
        </div>
        <div className="bridge-card p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/onboarding?role=creator"
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
              href="/onboarding?role=brand"
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
      {databaseWarning ? (
        <div className="mb-6 rounded-[8px] border border-yellow-900 bg-yellow-950/30 px-4 py-3 text-sm text-yellow-100">
          {databaseWarning}
        </div>
      ) : null}
      {selectedRole === "creator" ? (
        <CreatorOnboardingForm initialName={fallbackName} initialUsername={initialUsername} initialAvatar={clerkUser.imageUrl} />
      ) : (
        <BrandOnboardingForm initialContactName={fallbackName} initialEmail={email} />
      )}
      </main>
    </>
  );
}
