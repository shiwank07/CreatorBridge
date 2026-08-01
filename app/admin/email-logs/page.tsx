import { EmailLogTable } from "@/components/admin/email-log-table";
import { AdminListControls } from "@/components/admin/admin-list-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { ServerPagination } from "@/components/shared/server-pagination";
import { parsePageSearchParams } from "@/lib/pagination";
import { getAdminEmailLogsPage } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function AdminEmailLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = await getAdminEmailLogsPage({
    ...parsePageSearchParams(params),
    status: typeof params.status === "string" ? params.status : undefined,
    event: typeof params.event === "string" ? params.event : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    retryable: typeof params.retryable === "string" ? params.retryable : undefined,
  });

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase text-violet-300">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-black">Email Logs</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Inspect notification delivery events, statuses, creation time, and retry failed sends.
        </p>
      </div>

      <AdminListControls searchPlaceholder="Search recipient, event, or provider reference" selects={[
        { name: "status", label: "Status", options: ["processing", "sent", "delivered", "delayed", "failed", "permanent_failed", "bounced", "complained", "suppressed", "skipped"].map((value) => ({ value, label: value.replaceAll("_", " ") })) },
        { name: "event", label: "Template", options: ["contact:confirmation", "contact:admin-alert", "account:security-alert", "collaboration:invitation", "collaboration:accepted", "collaboration:declined", "verification:approved", "verification:rejected"].map((value) => ({ value, label: value.replaceAll(":", " ") })) },
        { name: "sort", label: "Sort", options: [{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }] },
      ]} />
      {page.items.length > 0 ? (
        <>
          <EmailLogTable logs={page.items} />
          <ServerPagination pagination={page} pathname="/admin/email-logs" searchParams={params} />
        </>
      ) : (
        <EmptyState
          title="No matching email logs"
          description="No email log matches the current search and filters."
          actionHref="/admin/email-logs"
          actionLabel="Clear filters"
        />
      )}
    </div>
  );
}
