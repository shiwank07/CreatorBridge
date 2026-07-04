import { BrandTable } from "@/components/admin/brand-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAdminBrands } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await getAdminBrands();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Brands</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Review brand identity, verification status, profile visibility, and suspension state.
        </p>
      </div>

      {brands.length > 0 ? (
        <BrandTable brands={brands} />
      ) : (
        <EmptyState
          title="No brands yet"
          description="Brands will appear here after completing onboarding."
          actionHref="/admin"
          actionLabel="Back to Overview"
        />
      )}
    </div>
  );
}
