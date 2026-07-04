"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type AdminEmailLogData } from "@/lib/types";

type EmailLogTableProps = {
  logs: AdminEmailLogData[];
};

function dateLabel(value?: string) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function statusTone(status: AdminEmailLogData["status"]) {
  if (status === "sent") return "green";
  if (status === "failed") return "yellow";
  return "neutral";
}

export function EmailLogTable({ logs }: EmailLogTableProps) {
  const [rows, setRows] = useState(logs);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function retry(log: AdminEmailLogData) {
    setError("");
    setSuccess("");
    setSavingId(log.id);

    try {
      const response = await fetch("/api/admin/email-logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: log.id }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        status?: AdminEmailLogData["status"];
        error?: string | null;
      };

      if (!response.ok) {
        setError(result.error ?? "Could not retry email.");
        return;
      }

      setRows((current) =>
        current.map((row) =>
          row.id === log.id
            ? {
                ...row,
                status: result.status ?? row.status,
                error: result.error,
              }
            : row,
        ),
      );
      setSuccess("Email retry completed.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSavingId("");
    }
  }

  function RetryButton({ log }: { log: AdminEmailLogData }) {
    const isSaving = savingId === log.id;
    return (
      <button
        type="button"
        onClick={() => retry(log)}
        disabled={log.status !== "failed" || isSaving}
        className="focus-ring inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
        Retry
      </button>
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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Retry</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="px-4 py-4 break-all text-[var(--text-secondary)]">{log.recipient}</td>
                <td className="px-4 py-4 text-[var(--text-primary)]">{log.event.replaceAll("_", " ")}</td>
                <td className="px-4 py-4">
                  <Badge tone={statusTone(log.status)}>{log.status}</Badge>
                  {log.error ? <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">{log.error}</p> : null}
                </td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">{dateLabel(log.createdAt)}</td>
                <td className="px-4 py-4">
                  <RetryButton log={log} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--border)] md:hidden">
        {rows.map((log) => (
          <article key={log.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-all font-semibold text-[var(--text-primary)]">{log.recipient}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{log.event.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{dateLabel(log.createdAt)}</p>
              </div>
              <Badge tone={statusTone(log.status)}>{log.status}</Badge>
            </div>
            {log.error ? <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{log.error}</p> : null}
            <div className="mt-4">
              <RetryButton log={log} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
