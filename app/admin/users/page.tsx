import { UserTable } from "@/components/admin/user-table";
import { AdminListControls } from "@/components/admin/admin-list-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { ServerPagination } from "@/components/shared/server-pagination";
import { parsePageSearchParams } from "@/lib/pagination";
import { getAdminUsersPage } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = await getAdminUsersPage({
    ...parsePageSearchParams(params),
    role: typeof params.role === "string" ? params.role : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    onboarding: typeof params.onboarding === "string" ? params.onboarding : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Users</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Search and filter creator or brand accounts by verification, role, and suspension state.
        </p>
      </div>

      <AdminListControls searchPlaceholder="Search name or email; exact Clerk ID supported" selects={[
        { name: "role", label: "Role", options: [{ value: "creator", label: "Creator" }, { value: "brand", label: "Brand" }] },
        { name: "status", label: "Account", options: ["active", "hidden", "suspended", "deleted"].map((value) => ({ value, label: value })) },
        { name: "sort", label: "Sort", options: [{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "name_asc", label: "Name A–Z" }, { value: "name_desc", label: "Name Z–A" }] },
      ]} />
      {page.items.length > 0 ? (
        <>
          <UserTable users={page.items} />
          <ServerPagination pagination={page} pathname="/admin/users" searchParams={params} />
        </>
      ) : (
        <EmptyState
          title="No matching users"
          description="No user matches the current search and filters."
          actionHref="/admin/users"
          actionLabel="Clear filters"
        />
      )}
    </div>
  );
}
