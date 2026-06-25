import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandOnboardingForm } from "@/components/forms/brand-onboarding-form";
import { CreatorOnboardingForm } from "@/components/forms/creator-onboarding-form";
import { AuthSetupNotice } from "@/components/shared/auth-setup-notice";
import { hasClerkKeys } from "@/lib/clerk-config";
import { connectDB, hasMongoUri } from "@/lib/db";
import { User } from "@/lib/models/User";
import { generateUsername } from "@/lib/slug";

export const dynamic = "force-dynamic";

type OnboardingSearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingPage({ searchParams }: { searchParams: OnboardingSearchParams }) {
  if (!hasClerkKeys()) return <AuthSetupNotice />;

  const params = await searchParams;
  const selectedRole = readParam(params.role) === "brand" ? "brand" : "creator";
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
      if (selectedRole === "creator" && dbUser?.onboardingComplete) completedCreatorUsername = dbUser.username;
      if (dbUser?.username) initialUsername = dbUser.username;
    } catch (error) {
      console.error("Onboarding database preload failed", error);
      databaseWarning = "MongoDB Atlas is not reachable right now. Check the connection string, network access, and Atlas IP allowlist.";
    }
  }

  if (completedCreatorUsername) redirect(`/creators/${completedCreatorUsername}`);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Onboarding</p>
        <h1 className="mt-3 font-display text-4xl font-black">
          {selectedRole === "creator" ? "Build your public creator profile" : "Create your brand profile"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          {selectedRole === "creator"
            ? "Give brands the essentials they need to understand your audience, content style, pricing, and availability."
            : "Add your company and contact details so your brand account is ready."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/onboarding?role=creator"
            className={`focus-ring inline-flex items-center justify-center rounded-[8px] border px-4 py-3 text-sm font-semibold ${
              selectedRole === "creator"
                ? "border-violet-700 bg-violet-950 text-violet-100"
                : "border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            I&apos;m a Creator
          </Link>
          <Link
            href="/onboarding?role=brand"
            className={`focus-ring inline-flex items-center justify-center rounded-[8px] border px-4 py-3 text-sm font-semibold ${
              selectedRole === "brand"
                ? "border-emerald-800 bg-emerald-950 text-emerald-100"
                : "border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            I&apos;m a Brand
          </Link>
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
  );
}
