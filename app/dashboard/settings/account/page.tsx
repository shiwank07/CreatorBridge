import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";

import { AccountDeleteForm } from "@/components/forms/account-delete-form";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account Settings",
  description: "Manage your Branzzo account settings.",
};

export default async function AccountSettingsPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();

  if (!clerkUserId) redirect("/sign-in");
  if (!user || !user.onboardingComplete) redirect("/onboarding");

  const dashboardHref = user.role === "brand" ? "/dashboard/brand" : user.role === "creator" ? "/dashboard/creator" : "/dashboard";

  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-4xl py-8 sm:py-10">
        <Link href={dashboardHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="mb-6 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
              <Settings size={20} />
            </span>
            <div>
              <p className="bridge-eyebrow">Settings / Account</p>
              <h1 className="mt-2 font-display text-3xl font-black">Account settings</h1>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Manage account-level actions for {user.name}. Profile edits remain in your dashboard edit page.
              </p>
            </div>
          </div>
        </header>

        <AccountDeleteForm accountLabel={user.role === "brand" ? "brand account" : "creator account"} />
      </main>
    </>
  );
}
