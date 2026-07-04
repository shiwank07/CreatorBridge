import { UserTable } from "@/components/admin/user-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAdminUsers } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Users</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Search and filter creator or brand accounts by verification, role, and suspension state.
        </p>
      </div>

      {users.length > 0 ? (
        <UserTable users={users} />
      ) : (
        <EmptyState
          title="No users yet"
          description="Creator and brand accounts will appear here after onboarding."
          actionHref="/admin"
          actionLabel="Back to Overview"
        />
      )}
    </div>
  );
}
