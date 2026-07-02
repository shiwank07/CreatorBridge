import { VerificationTable } from "@/components/admin/verification-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getPendingCreatorVerifications } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  const creators = await getPendingCreatorVerifications();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Creator Verification</p>
        <h1 className="mt-3 font-display text-4xl font-black">Review creator ownership</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Check the submitted platform bio or About section for the HALO verification code, then approve or reject the creator badge.
        </p>
      </div>

      {creators.length > 0 ? (
        <VerificationTable creators={creators} />
      ) : (
        <EmptyState
          title="No pending verifications"
          description="Creators appear here after submitting a platform profile and HALO code for manual review."
          actionHref="/admin/creators"
          actionLabel="Open Creators"
        />
      )}
    </div>
  );
}
