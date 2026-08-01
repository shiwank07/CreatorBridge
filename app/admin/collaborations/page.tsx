import { CollaborationTable } from "@/components/admin/collaboration-table";
import { AdminListControls } from "@/components/admin/admin-list-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { ServerPagination } from "@/components/shared/server-pagination";
import { parsePageSearchParams } from "@/lib/pagination";
import { getAdminCollaborationsPage } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function AdminCollaborationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const value = (name: string) => typeof params[name] === "string" ? params[name] : undefined;
  const page = await getAdminCollaborationsPage({ ...parsePageSearchParams(params), search: value("search"), status: value("status"), sort: value("sort"), creator: value("creator"), brand: value("brand"), from: value("from"), to: value("to") });

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Collaborations</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Track brand, creator, status, budget, creation date, and latest update for every collaboration.
        </p>
      </div>

      <AdminListControls searchPlaceholder="Search campaign, creator, brand, or exact ID" selects={[
        { name: "status", label: "Status", options: ["NEW", "PENDING_CREATOR_RESPONSE", "NEGOTIATING", "ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED", "DECLINED", "CANCELLED"].map((value) => ({ value, label: value.replaceAll("_", " ") })) },
        { name: "sort", label: "Sort", options: [{ value: "updated", label: "Recently updated" }, { value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }] },
      ]} />
      {page.items.length > 0 ? (
        <>
          <CollaborationTable collaborations={page.items} />
          <ServerPagination pagination={page} pathname="/admin/collaborations" searchParams={params} />
        </>
      ) : (
        <EmptyState
          title="No matching collaborations"
          description="No collaboration matches the current search and filters."
          actionHref="/admin/collaborations"
          actionLabel="Clear filters"
        />
      )}
    </div>
  );
}
