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
        <h1 className="mt-3 font-display text-4xl font-black">Campaign Inquiries</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Review brand-submitted campaign requests and move each inquiry through a simple status flow.
        </p>
      </div>

      {inquiries.length > 0 ? (
        <InquiryTable inquiries={inquiries} />
      ) : (
        <EmptyState
          title="No inquiries yet"
          description="Brand campaign inquiries submitted from the public form will appear here."
          actionHref="/campaign-inquiry"
          actionLabel="Open Inquiry Form"
        />
      )}
    </div>
  );
}
