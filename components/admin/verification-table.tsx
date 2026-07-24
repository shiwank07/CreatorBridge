"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, Loader2, Search, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";

type ReviewStatus = "pending" | "approved" | "rejected";
type ReviewRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  platform: string;
  customPlatformName?: string;
  profileUrl: string;
  verificationCode: string;
  creatorNote?: string;
  status: ReviewStatus;
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
};

export function VerificationTable() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ status, q: search, page: String(page), pageSize: "20" });
      const response = await fetch(`/api/admin/verifications?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load verification requests.");
      setRows(result.rows);
      setTotal(result.total);
      setNotes(Object.fromEntries(result.rows.map((row: ReviewRow) => [row.id, row.adminNote ?? ""])));
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not load verification requests." });
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { void load(); }, [load]);

  async function review(row: ReviewRow, action: "approve" | "reject") {
    setSaving(`${row.id}:${action}`);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: row.id, action, note: notes[row.id] ?? "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not review verification.");
      setMessage({ tone: "success", text: `${row.name} was ${action === "approve" ? "approved" : "rejected"}.` });
      await load();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not review verification." });
    } finally {
      setSaving("");
    }
  }

  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <section className="space-y-4" aria-label="Creator verification requests">
      <div className="bridge-card flex flex-col gap-3 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {(["pending", "approved", "rejected"] as const).map((value) => (
            <button key={value} type="button" onClick={() => { setStatus(value); setPage(1); }} className={status === value ? "bridge-button-primary px-4 py-2 text-sm" : "bridge-button-secondary px-4 py-2 text-sm"}>
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); setPage(1); }} className="flex w-full gap-2 lg:max-w-md">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search creator verifications</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="bridge-input" placeholder="Name, username, email, platform" />
          </label>
          <button type="submit" className="bridge-button-secondary px-4" aria-label="Search"><Search size={17} /></button>
        </form>
      </div>

      {message ? <div role={message.tone === "error" ? "alert" : "status"} className={`rounded-[8px] border px-4 py-3 text-sm ${message.tone === "error" ? "border-red-900 bg-red-950/40 text-red-200" : "border-emerald-800 bg-emerald-950/40 text-emerald-100"}`}>{message.text}</div> : null}

      {loading ? (
        <div className="bridge-card flex min-h-40 items-center justify-center gap-2 text-sm text-[var(--text-secondary)]"><Loader2 className="animate-spin" size={18} /> Loading requests…</div>
      ) : rows.length === 0 ? (
        <div className="bridge-card p-8 text-center text-sm text-[var(--text-secondary)]">No {status} creator verification requests found.</div>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => (
            <article key={row.id} className="bridge-card overflow-hidden p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold">{row.name}</h2>
                    <Badge tone={row.status === "approved" ? "green" : row.status === "pending" ? "yellow" : "neutral"}>{row.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">@{row.username} · {row.email}</p>
                  <p className="mt-3 text-xs uppercase text-[var(--text-muted)]">{row.platform === "other" ? row.customPlatformName : row.platform} · Submitted {new Date(row.submittedAt).toLocaleString()}</p>
                </div>
                <a href={row.profileUrl} target="_blank" rel="noopener noreferrer" className="bridge-button-secondary max-w-full px-4 py-2 text-sm">
                  <span className="truncate">Open submitted profile</span><ExternalLink size={15} />
                </a>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)]">
                <dl className="grid gap-3 rounded-[8px] border border-white/10 bg-black/20 p-4 text-sm sm:grid-cols-2">
                  <div><dt className="bridge-label">Verification code</dt><dd className="mt-1 break-all font-mono font-bold">{row.verificationCode}</dd></div>
                  <div><dt className="bridge-label">Profile URL</dt><dd className="mt-1 break-all text-cyan-100">{row.profileUrl}</dd></div>
                  <div className="sm:col-span-2"><dt className="bridge-label">Creator note</dt><dd className="mt-1 text-[var(--text-secondary)]">{row.creatorNote || "No note provided."}</dd></div>
                  {row.reviewedAt ? <div className="sm:col-span-2"><dt className="bridge-label">Reviewed</dt><dd className="mt-1">{new Date(row.reviewedAt).toLocaleString()}</dd></div> : null}
                </dl>
                <div>
                  <label><span className="bridge-label">Admin review note{row.status === "pending" ? " (required for rejection)" : ""}</span>
                    <textarea value={notes[row.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))} disabled={row.status !== "pending"} maxLength={500} className="bridge-input mt-2 min-h-24" />
                  </label>
                  {row.status === "pending" ? <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button onClick={() => review(row, "approve")} disabled={Boolean(saving)} className="bridge-button-primary flex-1 px-3 py-2 text-sm">{saving === `${row.id}:approve` ? <Loader2 className="animate-spin" size={15} /> : <BadgeCheck size={15} />}Approve</button>
                    <button onClick={() => review(row, "reject")} disabled={Boolean(saving)} className="bridge-action-button flex-1 justify-center border-red-900 text-red-200">{saving === `${row.id}:reject` ? <Loader2 className="animate-spin" size={15} /> : <XCircle size={15} />}Reject</button>
                  </div> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-[var(--text-secondary)]">{total} request{total === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="bridge-button-secondary px-3 py-2 text-xs">Previous</button>
          <span>Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="bridge-button-secondary px-3 py-2 text-xs">Next</button>
        </div>
      </div>
    </section>
  );
}
