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
        <h1 className="mt-3 font-display text-4xl font-black">Review YouTube ownership and stats</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Check the creator channel About section for the CreatorBridge code, compare claimed subscribers, then approve or reject.
        </p>
      </div>

      {creators.length > 0 ? (
        <VerificationTable creators={creators} />
      ) : (
        <EmptyState
          title="No pending verifications"
          description="Creators with a YouTube URL and an unverified or ownership-verified status will appear here."
          actionHref="/admin/creators"
          actionLabel="Open Creators"
        />
      )}
    </div>
  );
}
