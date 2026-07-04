"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { formatNumber } from "@/lib/format";
import { type CreatorVerificationData } from "@/lib/types";
import { normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

type VerificationTableProps = {
  creators: CreatorVerificationData[];
};

type VerificationAction = "approve" | "reject";

function statusLabel(status: CreatorVerificationData["verificationStatus"]) {
  return verificationBadgeLabel(status);
}

export function VerificationTable({ creators }: VerificationTableProps) {
  const [rows, setRows] = useState(creators);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    setSuccess("");
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

    if (action === "approve") body.verifiedSubscribers = Number(verifiedCounts[creator.username] || creator.claimedSubscribers || 0);

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

      setRows((current) => current.filter((row) => row.username !== creator.username));
      setSuccess(`${creator.name} was ${action === "approve" ? "approved" : "rejected"} successfully.`);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSavingKey("");
    }
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
      {rows.length === 0 ? (
        <div className="border-b border-[var(--border)] px-4 py-6 text-sm text-[var(--text-secondary)]">
          No creator verifications are waiting for review.
        </div>
      ) : null}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Submitted Profile</th>
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
                  {creator.verificationProfileUrl || creator.youtubeUrl ? (
                    <Link
                      href={creator.verificationProfileUrl || creator.youtubeUrl || ""}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring inline-flex max-w-[220px] items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <span className="truncate">{creator.verificationPlatform || creator.youtubeHandle || creator.verificationProfileUrl || creator.youtubeUrl}</span>
                      <ExternalLink size={14} />
                    </Link>
                  ) : null}
                  {creator.verificationSubmittedNote ? (
                    <p className="mt-3 max-w-xs text-xs leading-5 text-[var(--text-secondary)]">{creator.verificationSubmittedNote}</p>
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
                    <Badge tone={normalizeCreatorVerificationStatus(creator.verificationStatus) === "pending" ? "yellow" : "neutral"}>
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
                    {normalizeCreatorVerificationStatus(creator.verificationStatus) !== "verified" ? (
                      <button
                        type="button"
                        onClick={() => updateVerification(creator, "approve")}
                        disabled={savingKey.startsWith(`${creator.username}:`)}
                        className="bridge-button-primary px-3 py-2 text-xs"
                      >
                        {savingKey === `${creator.username}:approve` ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                        Approve Verification
                      </button>
                    ) : null}
                    {creator.verificationStatus !== "rejected" ? (
                      <button
                        type="button"
                        onClick={() => updateVerification(creator, "reject")}
                        disabled={savingKey.startsWith(`${creator.username}:`)}
                        className="bridge-action-button justify-center border-red-900 text-red-200"
                      >
                        {savingKey === `${creator.username}:reject` ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[var(--border)] md:hidden">
        {rows.map((creator) => (
          <article key={creator.username} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-[var(--text-primary)]">{creator.name}</h2>
                <p className="text-xs text-[var(--text-secondary)]">@{creator.username}</p>
              </div>
              <Badge tone={normalizeCreatorVerificationStatus(creator.verificationStatus) === "pending" ? "yellow" : "neutral"}>
                {statusLabel(creator.verificationStatus)}
              </Badge>
            </div>
            {creator.verificationProfileUrl || creator.youtubeUrl ? (
              <Link
                href={creator.verificationProfileUrl || creator.youtubeUrl || ""}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex max-w-full items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
              >
                <span className="truncate">{creator.verificationPlatform || creator.youtubeHandle || creator.verificationProfileUrl || creator.youtubeUrl}</span>
                <ExternalLink size={14} />
              </Link>
            ) : null}
            {creator.verificationSubmittedNote ? (
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{creator.verificationSubmittedNote}</p>
            ) : null}
            <div className="mt-4 grid gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Claimed subscribers</p>
                <p className="mt-1 font-mono text-base font-bold text-[var(--text-primary)]">
                  {formatNumber(creator.claimedSubscribers)}
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
                  className="bridge-input mt-2 w-full"
                />
              </label>
              <textarea
                value={notes[creator.username] ?? ""}
                onChange={(event) => setNotes((current) => ({ ...current, [creator.username]: event.target.value }))}
                className="bridge-input min-h-24 w-full"
                placeholder="Optional admin note"
              />
              <div className="flex flex-wrap gap-2">
                {normalizeCreatorVerificationStatus(creator.verificationStatus) !== "verified" ? (
                  <button
                    type="button"
                    onClick={() => updateVerification(creator, "approve")}
                    disabled={savingKey.startsWith(`${creator.username}:`)}
                    className="bridge-button-primary px-3 py-2 text-xs"
                  >
                    {savingKey === `${creator.username}:approve` ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                    Approve Verification
                  </button>
                ) : null}
                {creator.verificationStatus !== "rejected" ? (
                  <button
                    type="button"
                    onClick={() => updateVerification(creator, "reject")}
                    disabled={savingKey.startsWith(`${creator.username}:`)}
                    className="bridge-action-button border-red-900 text-red-200"
                  >
                    {savingKey === `${creator.username}:reject` ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Reject
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
