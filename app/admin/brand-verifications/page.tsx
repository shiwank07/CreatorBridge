import { BrandVerificationTable } from "@/components/admin/brand-verification-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getPendingBrandVerifications } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminBrandVerificationsPage() {
  const brands = await getPendingBrandVerifications();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Brand Verification</p>
        <h1 className="mt-3 font-display text-4xl font-black">Review brand identity</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Check the submitted company website, work email domain, and optional GST/CIN/company registration text before approving the brand badge.
        </p>
      </div>

      {brands.length > 0 ? (
        <BrandVerificationTable brands={brands} />
      ) : (
        <EmptyState
          title="No pending brand verifications"
          description="Brands appear here after submitting their company profile for manual verification."
          actionHref="/admin"
          actionLabel="Back to Admin"
        />
      )}
    </div>
  );
}
