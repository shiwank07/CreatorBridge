import { ReportTable } from "@/components/admin/report-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAdminReports } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const reports = await getAdminReports();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Reports</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Review delivery issue reports, resolve valid reports, dismiss invalid reports, or suspend reported users.
        </p>
      </div>

      {reports.length > 0 ? (
        <ReportTable reports={reports} />
      ) : (
        <EmptyState
          title="No reports"
          description="Reported collaboration issues will appear here."
          actionHref="/admin"
          actionLabel="Back to Overview"
        />
      )}
    </div>
  );
}
