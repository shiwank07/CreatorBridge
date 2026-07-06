"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Ban, ExternalLink, EyeOff, Loader2, RotateCcw, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { type AdminCreatorData } from "@/lib/types";

type CreatorTableProps = {
  creators: AdminCreatorData[];
};

type CreatorAction = "approve_verification" | "reject_verification" | "hide_profile" | "suspend" | "restore";
type CreatorFilter = "all" | "verified" | "pending" | "suspended";

const filters: { value: CreatorFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

function dateLabel(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "Unknown";
}

function verificationTone(status: AdminCreatorData["verificationStatus"]) {
  if (status === "verified" || status === "ownership_verified" || status === "stats_verified") return "green";
  if (status === "pending" || status === "pending_ownership" || status === "needs_review") return "yellow";
  return "neutral";
}

function isVerifiedStatus(status: AdminCreatorData["verificationStatus"]) {
  return verificationTone(status) === "green";
}

function accountTone(status: AdminCreatorData["accountStatus"]) {
  if (status === "active") return "green";
  if (status === "suspended") return "yellow";
  return "neutral";
}

function matchesFilter(creator: AdminCreatorData, filter: CreatorFilter) {
  if (filter === "verified") return verificationTone(creator.verificationStatus) === "green";
  if (filter === "pending") return verificationTone(creator.verificationStatus) === "yellow";
  if (filter === "suspended") return creator.accountStatus === "suspended";
  return true;
}

export function CreatorTable({ creators }: CreatorTableProps) {
  const [rows, setRows] = useState(creators);
  const [filter, setFilter] = useState<CreatorFilter>("all");
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const filteredRows = useMemo(() => rows.filter((creator) => matchesFilter(creator, filter)), [rows, filter]);

  async function updateCreator(creator: AdminCreatorData, action: CreatorAction) {
    setError("");
    setSuccess("");
    const note =
      action === "reject_verification"
        ? window.prompt("Rejection reason")?.trim()
        : "";

    if (action === "reject_verification" && !note) return;

    setSavingKey(`${creator.username}:${action}`);
    try {
      const response = await fetch("/api/admin/creators", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: creator.username, action, note }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not update creator.");
        return;
      }

      setRows((current) =>
        current.map((row) => {
          if (row.username !== creator.username) return row;
          if (action === "approve_verification") return { ...row, verificationStatus: "verified" };
          if (action === "reject_verification") return { ...row, verificationStatus: "rejected" };
          if (action === "hide_profile") return { ...row, accountStatus: "hidden" };
          if (action === "suspend") return { ...row, accountStatus: "suspended" };
          return { ...row, accountStatus: "active" };
        }),
      );
      setSuccess(`${creator.name} was updated successfully.`);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSavingKey("");
    }
  }

  function Avatar({ creator }: { creator: AdminCreatorData }) {
    return (
      <InitialsAvatar
        imageUrl={creator.avatar}
        name={creator.name}
        username={creator.username}
        alt={`${creator.name} avatar`}
        className="h-11 w-11 rounded-[8px] border-[var(--border)]"
      />
    );
  }

  function ActionButtons({ creator }: { creator: AdminCreatorData }) {
    const isVerified = isVerifiedStatus(creator.verificationStatus);
    const isRejected = creator.verificationStatus === "rejected";
    const isHidden = creator.accountStatus === "hidden";
    const isSuspended = creator.accountStatus === "suspended";
    const actions: { action: CreatorAction; label: string; icon: typeof BadgeCheck; className: string }[] = [
      ...(!isVerified
        ? [{ action: "approve_verification" as const, label: "Approve Verification", icon: BadgeCheck, className: "border-emerald-800 text-emerald-200" }]
        : []),
      ...(!isRejected
        ? [{ action: "reject_verification" as const, label: "Reject Verification", icon: XCircle, className: "border-red-900 text-red-200" }]
        : []),
      ...(!isHidden && !isSuspended
        ? [{ action: "hide_profile" as const, label: "Hide Profile", icon: EyeOff, className: "border-[var(--border)] text-[var(--text-secondary)]" }]
        : []),
      ...(!isHidden && !isSuspended
        ? [{ action: "suspend" as const, label: "Suspend", icon: Ban, className: "border-yellow-800 text-yellow-200" }]
        : []),
      ...(isHidden || isSuspended
        ? [{ action: "restore" as const, label: "Restore", icon: RotateCcw, className: "border-[var(--border)] text-[var(--text-secondary)]" }]
        : []),
    ];

    return (
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/creators/${creator.username}`}
          className="bridge-action-button border-[var(--border)] text-[var(--text-secondary)]"
        >
          View
          <ExternalLink size={14} />
        </Link>
        {isVerified ? (
          <button type="button" disabled className="bridge-action-button border-emerald-800 text-emerald-200">
            <BadgeCheck size={14} />
            Verified
          </button>
        ) : null}
        {actions.map(({ action, label, icon: Icon, className }) => {
          const key = `${creator.username}:${action}`;
          return (
            <button
              key={action}
              type="button"
              onClick={() => updateCreator(creator, action)}
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`focus-ring rounded-[8px] border px-3 py-2 text-xs font-semibold ${
              filter === item.value
                ? "border-violet-500 bg-violet-950/50 text-violet-100"
                : "border-[var(--border)] text-[var(--text-secondary)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

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
        {filteredRows.length === 0 ? (
          <div className="border-b border-[var(--border)] px-4 py-6 text-sm text-[var(--text-secondary)]">
            No creators match this filter.
          </div>
        ) : null}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3">Avatar</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((creator) => (
                <tr key={creator.userId} className="border-b border-[var(--border)] align-top last:border-b-0">
                  <td className="px-4 py-4">
                    <Avatar creator={creator} />
                  </td>
                  <td className="px-4 py-4 font-semibold text-[var(--text-primary)]">{creator.name}</td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">@{creator.username}</td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{creator.email}</td>
                  <td className="px-4 py-4">
                    <Badge tone={verificationTone(creator.verificationStatus)}>{creator.verificationStatus.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={accountTone(creator.accountStatus)}>{creator.accountStatus}</Badge>
                  </td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{dateLabel(creator.joinedDate)}</td>
                  <td className="px-4 py-4">
                    <ActionButtons creator={creator} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[var(--border)] md:hidden">
          {filteredRows.map((creator) => (
            <article key={creator.userId} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar creator={creator} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-[var(--text-primary)]">{creator.name}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">@{creator.username}</p>
                  <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{creator.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={verificationTone(creator.verificationStatus)}>{creator.verificationStatus.replaceAll("_", " ")}</Badge>
                <Badge tone={accountTone(creator.accountStatus)}>{creator.accountStatus}</Badge>
                <Badge tone="neutral">{dateLabel(creator.joinedDate)}</Badge>
              </div>
              <div className="mt-4">
                <ActionButtons creator={creator} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
