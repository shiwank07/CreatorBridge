import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bookmark } from "lucide-react";

import { CreatorCard } from "@/components/creators/creator-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Navbar } from "@/components/shared/navbar";
import { getCurrentAppUser } from "@/lib/current-user";
import { getSavedCreatorsForBrand } from "@/lib/queries/creators";

export const dynamic = "force-dynamic";

export default async function SavedCreatorsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "brand" || !user.onboardingComplete) redirect("/dashboard");
  const creators = await getSavedCreatorsForBrand(user.id);

  return <>
    <Navbar role="brand" username={user.username} />
    <main className="bridge-section max-w-7xl py-8">
      <Link href="/creators" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-white"><ArrowLeft size={16} />Back to discovery</Link>
      <header className="mt-6 bridge-card p-5 sm:p-6">
        <p className="bridge-eyebrow">Brand shortlist</p>
        <div className="mt-2 flex items-center justify-between gap-4"><div><h1 className="font-display text-3xl font-black">Saved Creators</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">{creators.length} creator{creators.length === 1 ? "" : "s"} in your shortlist.</p></div><Bookmark className="text-cyan-200" /></div>
      </header>
      {creators.length ? <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4" data-testid="saved-creator-grid">{creators.map((creator) => <CreatorCard key={creator.id} creator={creator} viewerRole="brand" initialSaved />)}</section> : <div className="mt-6"><EmptyState title="No saved creators yet" description="Save creators from discovery or their public profile to build your shortlist." actionHref="/creators" actionLabel="Discover creators" /></div>}
    </main>
  </>;
}
