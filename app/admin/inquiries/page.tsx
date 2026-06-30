import { InquiryTable } from "@/components/admin/inquiry-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAdminInquiries } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await getAdminInquiries();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Brand Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Collaboration Requests</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Review brand-submitted collaboration requests and move each request through a simple status flow.
        </p>
      </div>

      {inquiries.length > 0 ? (
        <InquiryTable inquiries={inquiries} />
      ) : (
        <EmptyState
          title="No collaboration requests yet"
          description="Collaboration requests submitted from the public flow will appear here."
          actionHref="/campaign-inquiry"
          actionLabel="Start Collaboration"
        />
      )}
    </div>
  );
}
