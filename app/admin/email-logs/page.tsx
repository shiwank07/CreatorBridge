import { EmailLogTable } from "@/components/admin/email-log-table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAdminEmailLogs } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminEmailLogsPage() {
  const logs = await getAdminEmailLogs();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Email Logs</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Inspect notification delivery events, statuses, creation time, and retry failed sends.
        </p>
      </div>

      {logs.length > 0 ? (
        <EmailLogTable logs={logs} />
      ) : (
        <EmptyState
          title="No email logs"
          description="Email notification delivery history will appear here."
          actionHref="/admin"
          actionLabel="Back to Overview"
        />
      )}
    </div>
  );
}
