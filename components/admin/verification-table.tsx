"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Loader2, ShieldCheck, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { formatNumber } from "@/lib/format";
import { type CreatorVerificationData } from "@/lib/types";

type VerificationTableProps = {
  creators: CreatorVerificationData[];
};

type VerificationAction = "approve_ownership" | "approve_stats" | "reject";

function statusLabel(status: CreatorVerificationData["verificationStatus"]) {
  const labels = {
    unverified: "Unverified",
    pending_ownership: "Pending ownership",
    ownership_verified: "Ownership verified",
    stats_verified: "Stats verified",
    rejected: "Rejected",
  };

  return labels[status];
}

export function VerificationTable({ creators }: VerificationTableProps) {
  const [rows, setRows] = useState(creators);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(creators.map((creator) => [creator.username, creator.verificationNote ?? ""])),
  );
  const [verifiedCounts, setVerifiedCounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      creators.map((creator) => [
        creator.username,
        String(creator.verifiedSubscribers || creator.claimedSubscribers || 0),
      ]),
    ),
  );

  async function updateVerification(creator: CreatorVerificationData, action: VerificationAction) {
    setError("");
    setSavingKey(`${creator.username}:${action}`);

    const body: {
      username: string;
      action: VerificationAction;
      note: string;
      verifiedSubscribers?: number;
    } = {
      username: creator.username,
      action,
      note: notes[creator.username] ?? "",
    };

    if (action === "approve_stats") {
      body.verifiedSubscribers = Number(verifiedCounts[creator.username] || creator.claimedSubscribers || 0);
    }

    try {
      const response = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not update verification.");
        return;
      }

      if (action === "approve_ownership") {
        setRows((current) =>
          current.map((row) =>
            row.username === creator.username
              ? {
                  ...row,
                  verificationStatus: "ownership_verified",
                  verificationNote: notes[creator.username] ?? "",
                }
              : row,
          ),
        );
        return;
      }

      setRows((current) => current.filter((row) => row.username !== creator.username));
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <div className="bridge-card overflow-hidden">
      {error ? <div className="border-b border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Claimed</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((creator) => (
              <tr key={creator.username} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[var(--text-primary)]">{creator.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">@{creator.username}</p>
                </td>
                <td className="px-4 py-4">
                  {creator.youtubeUrl ? (
                    <Link
                      href={creator.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex max-w-[220px] items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <span className="truncate">{creator.youtubeHandle || creator.youtubeUrl}</span>
                      <ExternalLink size={14} />
                    </Link>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <p className="font-mono text-base font-bold text-[var(--text-primary)]">
                    {formatNumber(creator.claimedSubscribers)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">claimed subscribers</p>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-3">
                    <Badge tone={creator.verificationStatus === "ownership_verified" ? "green" : creator.verificationStatus === "pending_ownership" ? "yellow" : "neutral"}>
                      {statusLabel(creator.verificationStatus)}
                    </Badge>
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Code</p>
                      <p className="mt-1 font-mono text-sm font-bold text-[var(--text-primary)]">
                        {creator.verificationCode || "No code"}
                      </p>
                    </div>
                    <label className="block">
                      <span className="bridge-label">Verified subscribers</span>
                      <input
                        type="number"
                        min={0}
                        value={verifiedCounts[creator.username] ?? ""}
                        onChange={(event) =>
                          setVerifiedCounts((current) => ({ ...current, [creator.username]: event.target.value }))
                        }
                        className="bridge-input mt-2 w-40"
                      />
                    </label>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <textarea
                    value={notes[creator.username] ?? ""}
                    onChange={(event) => setNotes((current) => ({ ...current, [creator.username]: event.target.value }))}
                    className="bridge-input min-h-24 w-64"
                    placeholder="Optional admin note"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => updateVerification(creator, "approve_ownership")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] border border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-200"
                    >
                      {savingKey === `${creator.username}:approve_ownership` ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      Approve Ownership
                    </button>
                    <button
                      type="button"
                      onClick={() => updateVerification(creator, "approve_stats")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      {savingKey === `${creator.username}:approve_stats` ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                      Approve Stats
                    </button>
                    <button
                      type="button"
                      onClick={() => updateVerification(creator, "reject")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] border border-red-900 px-3 py-2 text-xs font-semibold text-red-200"
                    >
                      {savingKey === `${creator.username}:reject` ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
