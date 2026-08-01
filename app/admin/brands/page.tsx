import { BrandTable } from "@/components/admin/brand-table";
import { AdminListControls } from "@/components/admin/admin-list-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { ServerPagination } from "@/components/shared/server-pagination";
import { parsePageSearchParams } from "@/lib/pagination";
import { getAdminBrandsPage } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function AdminBrandsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const value = (name: string) => typeof params[name] === "string" ? params[name] : undefined;
  const page = await getAdminBrandsPage({ ...parsePageSearchParams(params), search: value("search"), verification: value("verification"), status: value("status"), sort: value("sort") });

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Brands</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Review brand identity, verification status, profile visibility, and suspension state.
        </p>
      </div>

      <AdminListControls searchPlaceholder="Search company, email, website, or domain" selects={[
        { name: "verification", label: "Verification", options: ["unverified", "pending", "verified", "rejected"].map((value) => ({ value, label: value })) },
        { name: "status", label: "Account", options: ["active", "hidden", "suspended", "deleted"].map((value) => ({ value, label: value })) },
        { name: "sort", label: "Sort", options: [{ value: "updated", label: "Recently updated" }, { value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "name_asc", label: "Name A–Z" }, { value: "name_desc", label: "Name Z–A" }] },
      ]} />
      {page.items.length > 0 ? (
        <>
          <BrandTable brands={page.items} />
          <ServerPagination pagination={page} pathname="/admin/brands" searchParams={params} />
        </>
      ) : (
        <EmptyState
          title="No matching brands"
          description="No brand matches the current search and filters."
          actionHref="/admin/brands"
          actionLabel="Clear filters"
        />
      )}
    </div>
  );
}
