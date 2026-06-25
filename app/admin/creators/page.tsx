import { CreatorTable } from "@/components/admin/creator-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAdminCreators } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage() {
  const creators = await getAdminCreators();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Creator Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Creators</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Toggle featured and verified status for creator profiles shown in public discovery.
        </p>
      </div>

      {creators.length > 0 ? (
        <CreatorTable creators={creators} />
      ) : (
        <EmptyState
          title="No creators yet"
          description="Creators will appear here after completing onboarding."
          actionHref="/onboarding"
          actionLabel="Create First Creator"
        />
      )}
    </div>
  );
}
