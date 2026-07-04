import { BrandVerificationTable } from "@/components/admin/brand-verification-table";
import { VerificationTable } from "@/components/admin/verification-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getPendingBrandVerifications, getPendingCreatorVerifications } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  const [creators, brands] = await Promise.all([getPendingCreatorVerifications(), getPendingBrandVerifications()]);
  const hasQueue = creators.length > 0 || brands.length > 0;

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Verification Queue</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Review pending creator ownership checks and brand identity submissions.
        </p>
      </div>

      {hasQueue ? (
        <div className="space-y-8">
          {creators.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-2xl font-bold">Creators</h2>
              <VerificationTable creators={creators} />
            </section>
          ) : null}
          {brands.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-2xl font-bold">Brands</h2>
              <BrandVerificationTable brands={brands} />
            </section>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No pending verifications"
          description="Creator and brand verification requests appear here after submission."
          actionHref="/admin"
          actionLabel="Back to Overview"
        />
      )}
    </div>
  );
}
