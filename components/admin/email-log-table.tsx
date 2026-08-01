"use client";

import { useState } from "react";
import { ChevronDown, Loader2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { formatDateTime } from "@/lib/format-date";
import { type AdminEmailLogData } from "@/lib/types";

type EmailLogTableProps = {
  logs: AdminEmailLogData[];
};

function dateLabel(value?: string) {
  return formatDateTime(value);
}

function statusTone(status: AdminEmailLogData["status"]) {
  if (status === "sent" || status === "delivered") return "green";
  if (status === "failed" || status === "delayed") return "yellow";
  return "neutral";
}

function errorSummary(error?: string | null) {
  if (!error) return "";
  const normalized = error.toLowerCase();
  if (normalized.includes("domain") && (normalized.includes("verify") || normalized.includes("verification"))) {
    return "Sender domain is not verified.";
  }
  if (normalized.includes("rate") && normalized.includes("limit")) return "Provider rate limit reached.";
  if (normalized.includes("recipient") || normalized.includes("address")) return "Recipient address was rejected.";
  if (normalized.includes("timeout")) return "The email provider timed out.";
  return "Delivery failed. Open details for the provider response.";
}

function safeRecipient(value: string) {
  const [local, domain] = value.split("@");
  if (!local || !domain) return "Invalid recipient";
  return `${local.slice(0, 2)}${local.length > 2 ? "•••" : ""}@${domain}`;
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
        disabled={!log.retryEligible || isSaving}
        className="focus-ring inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
        Retry eligible
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
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Retry</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="max-w-[240px] px-4 py-4 text-[var(--text-secondary)]">
                  <span className="block truncate" aria-label={`Recipient ${safeRecipient(log.recipient)}`}>{safeRecipient(log.recipient)}</span>
                </td>
                <td className="px-4 py-4 text-[var(--text-primary)]">{log.event.replaceAll("_", " ")}</td>
                <td className="px-4 py-4">
                  <Badge tone={statusTone(log.status)}>{log.status}</Badge>
                  {log.error ? <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--text-secondary)]">{errorSummary(log.error)}</p> : null}
                </td>
                <td className="max-w-[260px] px-4 py-4 text-xs text-[var(--text-secondary)]">
                  <p>Key: {log.deliveryKey ?? "—"}</p>
                  <p className="mt-1">Attempts: {log.attempts}</p>
                  <p className="mt-1 break-all">Provider: {log.providerId ?? "—"}</p>
                  <p className="mt-1">Updated: {dateLabel(log.updatedAt)}</p>
                  <p className="mt-1">Delivered: {dateLabel(log.deliveredAt)}</p>
                </td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">{dateLabel(log.createdAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <RetryButton log={log} />
                    {log.error ? (
                      <details className="group">
                        <summary className="focus-ring flex cursor-pointer list-none items-center gap-1 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                          View error <ChevronDown size={14} className="group-open:rotate-180" />
                        </summary>
                        <div className="absolute right-6 z-20 mt-2 max-h-64 w-[min(32rem,calc(100vw-3rem))] overflow-auto rounded-[8px] border border-[var(--border)] bg-[#11111a] p-4 shadow-2xl">
                          <p className="whitespace-pre-wrap break-words text-xs leading-5 text-[var(--text-secondary)]">{log.error}</p>
                        </div>
                      </details>
                    ) : null}
                  </div>
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
                <h2 className="font-semibold text-[var(--text-primary)] [overflow-wrap:anywhere]">{safeRecipient(log.recipient)}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{log.event.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{dateLabel(log.createdAt)}</p>
              </div>
              <Badge tone={statusTone(log.status)}>{log.status}</Badge>
            </div>
            {log.error ? <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{errorSummary(log.error)}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <RetryButton log={log} />
              {log.error ? (
                <details className="w-full">
                  <summary className="focus-ring mt-2 cursor-pointer text-sm font-semibold text-violet-200">View error details</summary>
                  <p className="mt-3 whitespace-pre-wrap break-words rounded-[8px] bg-black/20 p-3 text-xs leading-5 text-[var(--text-secondary)]">{log.error}</p>
                </details>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
