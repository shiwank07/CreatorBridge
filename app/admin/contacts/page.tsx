import { ContactTable } from "@/components/admin/contact-table";
import { AdminListControls } from "@/components/admin/admin-list-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { ServerPagination } from "@/components/shared/server-pagination";
import { parsePageSearchParams } from "@/lib/pagination";
import { getAdminContactsPage } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function AdminContactsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const value = (name: string) => typeof params[name] === "string" ? params[name] : undefined;
  const page = await getAdminContactsPage({ ...parsePageSearchParams(params), search: value("search"), role: value("role"), status: value("status"), sort: value("sort"), from: value("from"), to: value("to") });

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Contact Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Creator and brand contacts</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Admin-only contact details for trust, support, and urgent follow-up. Phone numbers must not be shared with users.
        </p>
      </div>

      <AdminListControls searchPlaceholder="Search account name, email, or username" selects={[
        { name: "role", label: "Role", options: [{ value: "creator", label: "Creator" }, { value: "brand", label: "Brand" }] },
        { name: "status", label: "Account", options: ["active", "hidden", "suspended", "deleted"].map((value) => ({ value, label: value })) },
        { name: "sort", label: "Sort", options: [{ value: "newest", label: "Recently updated" }, { value: "oldest", label: "Oldest updated" }, { value: "name_asc", label: "Name A–Z" }, { value: "name_desc", label: "Name Z–A" }] },
      ]} />
      {page.items.length > 0 ? (
        <>
          <ContactTable contacts={page.items} />
          <ServerPagination pagination={page} pathname="/admin/contacts" searchParams={params} />
        </>
      ) : (
        <EmptyState
          title="No matching contacts"
          description="No account contact matches the current search and filters."
          actionHref="/admin/contacts"
          actionLabel="Clear filters"
        />
      )}
    </div>
  );
}
