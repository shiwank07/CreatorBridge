import { CollaborationTable } from "@/components/admin/collaboration-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAdminCollaborations } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminCollaborationsPage() {
  const collaborations = await getAdminCollaborations();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Collaborations</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Track brand, creator, status, budget, creation date, and latest update for every collaboration.
        </p>
      </div>

      {collaborations.length > 0 ? (
        <CollaborationTable collaborations={collaborations} />
      ) : (
        <EmptyState
          title="No collaborations yet"
          description="Collaboration requests appear here after brands submit them."
          actionHref="/admin"
          actionLabel="Back to Overview"
        />
      )}
    </div>
  );
}
