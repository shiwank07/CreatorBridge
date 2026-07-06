"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ban, ExternalLink, EyeOff, Loader2, RotateCcw } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { type AdminUserData } from "@/lib/types";

type UserTableProps = {
  users: AdminUserData[];
};

type UserAction = "hide" | "suspend" | "restore";
type UserFilter = "all" | "verified" | "pending" | "suspended" | "creator" | "brand";

const filters: { value: UserFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "creator", label: "Creator" },
  { value: "brand", label: "Brand" },
];

function dateLabel(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "Unknown";
}

function verificationTone(status: AdminUserData["verificationStatus"]) {
  if (status === "verified" || status === "ownership_verified" || status === "stats_verified") return "green";
  if (status === "pending" || status === "pending_ownership" || status === "needs_review") return "yellow";
  return "neutral";
}

function accountTone(status: AdminUserData["accountStatus"]) {
  if (status === "active") return "green";
  if (status === "suspended") return "yellow";
  return "neutral";
}

function matchesFilter(user: AdminUserData, filter: UserFilter) {
  if (filter === "verified") return verificationTone(user.verificationStatus) === "green";
  if (filter === "pending") return verificationTone(user.verificationStatus) === "yellow";
  if (filter === "suspended") return user.accountStatus === "suspended";
  if (filter === "creator") return user.role === "creator";
  if (filter === "brand") return user.role === "brand";
  return true;
}

function profileHref(user: AdminUserData) {
  if (user.role === "brand") return `/brands/${user.username}`;
  if (user.role === "creator") return `/creators/${user.username}`;
  return "/admin/users";
}

export function UserTable({ users }: UserTableProps) {
  const [rows, setRows] = useState(users);
  const [filter, setFilter] = useState<UserFilter>("all");
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const filteredRows = useMemo(() => rows.filter((user) => matchesFilter(user, filter)), [rows, filter]);

  async function updateUser(user: AdminUserData, action: UserAction) {
    setError("");
    setSuccess("");
    setSavingKey(`${user.userId}:${action}`);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, action }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        accountStatus?: AdminUserData["accountStatus"];
        error?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Could not update user.");
        return;
      }

      setRows((current) =>
        current.map((row) =>
          row.userId === user.userId
            ? {
                ...row,
                accountStatus: result.accountStatus ?? (action === "restore" ? "active" : action === "hide" ? "hidden" : "suspended"),
              }
            : row,
        ),
      );
      setSuccess(`${user.name} was updated successfully.`);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSavingKey("");
    }
  }

  function Avatar({ user }: { user: AdminUserData }) {
    return (
      <InitialsAvatar
        imageUrl={user.avatar}
        name={user.name}
        username={user.username}
        alt={`${user.name} avatar`}
        className="h-11 w-11 rounded-[8px] border-[var(--border)]"
      />
    );
  }

  function Actions({ user }: { user: AdminUserData }) {
    const isHidden = user.accountStatus === "hidden";
    const isSuspended = user.accountStatus === "suspended";
    const actions: { action: UserAction; label: string; icon: typeof EyeOff; className: string }[] = [
      ...(!isHidden && !isSuspended
        ? [{ action: "hide" as const, label: "Hide", icon: EyeOff, className: "border-[var(--border)] text-[var(--text-secondary)]" }]
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
          href={profileHref(user)}
          className="bridge-action-button border-[var(--border)] text-[var(--text-secondary)]"
        >
          View
          <ExternalLink size={14} />
        </Link>
        {actions.map(({ action, label, icon: Icon, className }) => {
          const key = `${user.userId}:${action}`;
          return (
            <button
              key={action}
              type="button"
              onClick={() => updateUser(user, action)}
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
            No users match this filter.
          </div>
        ) : null}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((user) => (
                <tr key={user.userId} className="border-b border-[var(--border)] align-top last:border-b-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--text-primary)]">{user.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 break-all text-[var(--text-secondary)]">{user.email}</td>
                  <td className="px-4 py-4">
                    <Badge tone={user.role === "brand" ? "yellow" : "neutral"}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={verificationTone(user.verificationStatus)}>{user.verificationStatus.replaceAll("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={accountTone(user.accountStatus)}>{user.accountStatus}</Badge>
                  </td>
                  <td className="px-4 py-4 text-[var(--text-secondary)]">{dateLabel(user.joinedDate)}</td>
                  <td className="px-4 py-4">
                    <Actions user={user} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[var(--border)] md:hidden">
          {filteredRows.map((user) => (
            <article key={user.userId} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar user={user} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-[var(--text-primary)]">{user.name}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">@{user.username}</p>
                  <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={user.role === "brand" ? "yellow" : "neutral"}>{user.role}</Badge>
                <Badge tone={verificationTone(user.verificationStatus)}>{user.verificationStatus.replaceAll("_", " ")}</Badge>
                <Badge tone={accountTone(user.accountStatus)}>{user.accountStatus}</Badge>
              </div>
              <div className="mt-4">
                <Actions user={user} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
