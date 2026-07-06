import Link from "next/link";
import { ArrowRight, Building2, Sparkles, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser, getCurrentClerkUserId } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
  description: "Open your Branzzo collaboration dashboard.",
};

export default async function DashboardPage() {
  const clerkUserId = await getCurrentClerkUserId();
  const user = await getCurrentAppUser();

  if (user?.role === "brand" && user.onboardingComplete) redirect("/dashboard/brand");
  if (user?.role === "creator" && user.onboardingComplete) redirect("/dashboard/creator");
  if (clerkUserId && (!user || !user.onboardingComplete)) redirect("/onboarding");

  return (
    <>
      <Navbar />
      <main className="bridge-section">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-cyan-100">
            <Sparkles size={15} />
            Collaboration Dashboard
          </div>
          <h1 className="mt-6 font-display text-4xl font-black sm:text-5xl">Choose your workspace</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
            Open the dashboard that matches how you use Branzzo.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
          <Link href="/dashboard/creator" className="bridge-card bridge-card-hover p-6">
            <UserRound size={24} className="text-cyan-200" />
            <h2 className="mt-5 font-display text-2xl font-bold">Creator Dashboard</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Track new collaborations, active requests, and completed work.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
              Open creator dashboard
              <ArrowRight size={16} />
            </span>
          </Link>

          <Link href="/dashboard/brand" className="bridge-card bridge-card-hover p-6">
            <Building2 size={24} className="text-violet-200" />
            <h2 className="mt-5 font-display text-2xl font-bold">Brand Dashboard</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Manage collaboration drafts, creator responses, and active requests.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
              Open brand dashboard
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </main>
    </>
  );
}
