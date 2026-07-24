"use client";

import { useState } from "react";
import { BadgeCheck, Ban, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { AdminPagination, useAdminPagination } from "@/components/admin/admin-pagination";
import { formatDate } from "@/lib/format-date";
import { type AdminReportData } from "@/lib/types";

type ReportTableProps = {
  reports: AdminReportData[];
};

type ReportAction = "resolve" | "dismiss" | "suspend_user";

function dateLabel(value?: string) {
  return formatDate(value);
}

function statusTone(status: AdminReportData["status"]) {
  if (status === "resolved") return "green";
  if (status === "dismissed") return "neutral";
  return "yellow";
}

export function ReportTable({ reports }: ReportTableProps) {
  const [rows, setRows] = useState(reports);
  const pagination = useAdminPagination(rows);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function updateReport(report: AdminReportData, action: ReportAction) {
    setError("");
    setSuccess("");
    setSavingKey(`${report.id}:${action}`);

    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, action }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        status?: AdminReportData["status"];
        error?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Could not update report.");
        return;
      }

      setRows((current) =>
        current.map((row) => (row.id === report.id ? { ...row, status: result.status ?? "resolved" } : row)),
      );
      setSuccess("Report updated successfully.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSavingKey("");
    }
  }

  function Actions({ report }: { report: AdminReportData }) {
    if (report.status !== "open") {
      return (
        <p className="rounded-[8px] border border-white/10 bg-white/[0.035] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
          No further action is available for a {report.status} report.
        </p>
      );
    }

    const actions: { action: ReportAction; label: string; icon: typeof BadgeCheck; className: string }[] = [
      { action: "resolve", label: "Resolve", icon: BadgeCheck, className: "border-emerald-800 text-emerald-200" },
      { action: "dismiss", label: "Dismiss", icon: XCircle, className: "border-[var(--border)] text-[var(--text-secondary)]" },
      { action: "suspend_user", label: "Suspend User", icon: Ban, className: "border-yellow-800 text-yellow-200" },
    ];

    return (
      <div className="flex flex-wrap gap-2">
        {actions.map(({ action, label, icon: Icon, className }) => {
          const key = `${report.id}:${action}`;
          return (
            <button
              key={action}
              type="button"
              onClick={() => updateReport(report, action)}
              disabled={savingKey === key}
              className={`bridge-action-button ${className}`}
            >
              {savingKey === key ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bridge-card overflow-hidden">
      {error ? (
        <div role="alert" className="border-b border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="border-b border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Reporter</th>
              <th className="px-4 py-3">Reported User</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((report) => (
              <tr key={report.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="px-4 py-4 text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">{report.reporter}</p>
                  <p className="mt-1 text-xs">{dateLabel(report.createdAt)}</p>
                </td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">{report.reportedUser}</td>
                <td className="max-w-lg px-4 py-4 text-[var(--text-secondary)]">{report.reason}</td>
                <td className="px-4 py-4">
                  <Badge tone={statusTone(report.status)}>{report.status}</Badge>
                </td>
                <td className="px-4 py-4">
                  <Actions report={report} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--border)] md:hidden">
        {pagination.pageItems.map((report) => (
          <article key={report.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words font-semibold text-[var(--text-primary)]">{report.reporter}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Reported: {report.reportedUser}</p>
              </div>
              <Badge tone={statusTone(report.status)}>{report.status}</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{report.reason}</p>
            <div className="mt-4">
              <Actions report={report} />
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
