"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { AdminPagination, useAdminPagination } from "@/components/admin/admin-pagination";
import { collaborationStatusLabel } from "@/lib/collaborations";
import { formatDate } from "@/lib/format-date";
import { type AdminCollaborationData } from "@/lib/types";

type CollaborationTableProps = {
  collaborations: AdminCollaborationData[];
};

function dateLabel(value?: string) {
  return formatDate(value);
}

function statusTone(status: AdminCollaborationData["status"]) {
  if (status === "COMPLETED" || status === "APPROVED") return "green";
  if (status === "DECLINED" || status === "CANCELLED" || status === "REVISION_REQUESTED") return "yellow";
  return "neutral";
}

function DetailLink({ id }: { id: string }) {
  return (
    <Link
      href={`/admin/collaborations/${id}`}
      className="focus-ring inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
    >
      Open Details
      <ExternalLink size={14} />
    </Link>
  );
}

export function CollaborationTable({ collaborations }: CollaborationTableProps) {
  const pagination = useAdminPagination(collaborations);

  return (
    <div className="bridge-card overflow-hidden">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((collaboration) => (
              <tr key={collaboration.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[var(--text-primary)]">{collaboration.brand}</p>
                  <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{collaboration.brandEmail}</p>
                </td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">{collaboration.creator}</td>
                <td className="px-4 py-4">
                  <Badge tone={statusTone(collaboration.status)}>{collaborationStatusLabel(collaboration.status)}</Badge>
                </td>
                <td className="px-4 py-4 font-semibold text-[var(--text-primary)]">{collaboration.budget}</td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">{dateLabel(collaboration.createdAt)}</td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">{dateLabel(collaboration.updatedAt)}</td>
                <td className="px-4 py-4">
                  <DetailLink id={collaboration.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--border)] md:hidden">
        {pagination.pageItems.map((collaboration) => (
          <article key={collaboration.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-[var(--text-primary)]">{collaboration.brand}</h2>
                <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{collaboration.brandEmail}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{collaboration.creator}</p>
              </div>
              <Badge tone={statusTone(collaboration.status)}>{collaborationStatusLabel(collaboration.status)}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
              <div>
                <p className="font-semibold uppercase">Offer</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{collaboration.budget}</p>
              </div>
              <div>
                <p className="font-semibold uppercase">Updated</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{dateLabel(collaboration.updatedAt)}</p>
              </div>
            </div>
            <div className="mt-4">
              <DetailLink id={collaboration.id} />
            </div>
          </article>
        ))}
      </div>
      <AdminPagination
        page={pagination.page}
        pageCount={pagination.pageCount}
        pageSize={pagination.pageSize}
        total={pagination.total}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}
