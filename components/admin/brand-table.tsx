"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Ban, ChevronDown, ExternalLink, EyeOff, Loader2, MoreHorizontal, RotateCcw, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { type AdminBrandData } from "@/lib/types";

type BrandTableProps = {
  brands: AdminBrandData[];
};

type BrandAction = "approve" | "reject" | "hide" | "suspend" | "restore";
function verificationTone(status: AdminBrandData["verificationStatus"]) {
  if (status === "verified") return "green";
  if (status === "pending") return "yellow";
  return "neutral";
}

function accountTone(status: AdminBrandData["accountStatus"]) {
  if (status === "active") return "green";
  if (status === "suspended") return "yellow";
  return "neutral";
}

export function BrandTable({ brands }: BrandTableProps) {
  const [rows, setRows] = useState(brands);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function updateBrand(brand: AdminBrandData, action: BrandAction) {
    setError("");
    setSuccess("");
    const destructiveLabel =
      action === "reject" ? "reject verification for" : action === "hide" ? "hide the profile for" : action === "suspend" ? "suspend the account for" : "";
    if (destructiveLabel && !window.confirm(`Are you sure you want to ${destructiveLabel} ${brand.companyName}?`)) return;
    const note = action === "reject" ? window.prompt("Rejection reason")?.trim() : "";
    if (action === "reject" && !note) return;

    setSavingKey(`${brand.username}:${action}`);
    try {
      const response = await fetch("/api/admin/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: brand.username, action, note }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not update brand.");
        return;
      }

      setRows((current) =>
        current.map((row) => {
          if (row.username !== brand.username) return row;
          if (action === "approve") return { ...row, verificationStatus: "verified" };
          if (action === "reject") return { ...row, verificationStatus: "rejected" };
          if (action === "hide") return { ...row, accountStatus: "hidden" };
          if (action === "suspend") return { ...row, accountStatus: "suspended" };
          return { ...row, accountStatus: "active" };
        }),
      );
      setSuccess(`${brand.companyName} was updated successfully.`);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSavingKey("");
    }
  }

  function Logo({ brand }: { brand: AdminBrandData }) {
    return (
      <InitialsAvatar
        imageUrl={brand.logo}
        name={brand.companyName}
        username={brand.username}
        alt={`${brand.companyName} logo`}
        className="h-11 w-11 rounded-[8px] border-[var(--border)]"
      />
    );
  }

  function ActionButtons({ brand }: { brand: AdminBrandData }) {
    const isRejected = brand.verificationStatus === "rejected";
    const isHidden = brand.accountStatus === "hidden";
    const isSuspended = brand.accountStatus === "suspended";
    const actions: { action: BrandAction; label: string; icon: typeof BadgeCheck; className: string }[] = [
      ...(!isRejected
        ? [{ action: "reject" as const, label: "Reject", icon: XCircle, className: "border-red-900 text-red-200" }]
        : []),
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
      <div className="flex flex-nowrap items-start gap-2">
        {brand.profileId ? (
          <Link
            href={`/brands/${brand.username}`}
            className="bridge-action-button border-[var(--border)] text-[var(--text-secondary)]"
          >
            View
            <ExternalLink size={14} />
          </Link>
        ) : null}
        {brand.verificationStatus === "pending" ? (
          <button
            type="button"
            onClick={() => updateBrand(brand, "approve")}
            disabled={savingKey === `${brand.username}:approve`}
            className="bridge-action-button whitespace-nowrap border-emerald-800 text-emerald-200"
          >
            {savingKey === `${brand.username}:approve` ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
            Approve
          </button>
        ) : null}
        <details
          className="group relative"
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.currentTarget.open = false;
            event.currentTarget.querySelector<HTMLElement>("summary")?.focus();
          }}
        >
          <summary
            aria-label={`More actions for ${brand.companyName}`}
            className="bridge-action-button cursor-pointer list-none whitespace-nowrap border-[var(--border)] text-[var(--text-secondary)]"
          >
            <MoreHorizontal size={14} /> More <ChevronDown size={12} className="group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 z-30 mt-2 w-56 rounded-[8px] border border-[var(--border)] bg-[#15151f] p-2 shadow-2xl">
            {actions.map(({ action, label, icon: Icon, className }) => {
              const key = `${brand.username}:${action}`;
              return (
                <button
                  key={action}
                  type="button"
                  onClick={(event) => {
                    event.currentTarget.closest("details")?.removeAttribute("open");
                    void updateBrand(brand, action);
                  }}
                  disabled={savingKey === key}
                  className={`focus-ring flex w-full items-center gap-2 rounded-[6px] px-3 py-2 text-left text-xs font-semibold hover:bg-white/5 ${className}`}
                >
                  {savingKey === key ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                  {label}
                </button>
              );
            })}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Collaborations</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((brand) => (
                <tr key={brand.userId} className="h-auto border-b border-[var(--border)] align-middle last:border-b-0">
                  <td className="px-4 py-4">
                    <Logo brand={brand} />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[var(--text-primary)]">{brand.companyName}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">@{brand.username}</p>
                  </td>
                  <td className="px-4 py-4 break-all text-[var(--text-secondary)]">{brand.email}</td>
                  <td className="px-4 py-4">
                    {brand.joinedDate ? new Date(brand.joinedDate).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <Badge tone={brand.profileStatus === "complete" ? "green" : "yellow"}>{brand.profileStatus}</Badge>
                      <Badge tone={verificationTone(brand.verificationStatus)}>{brand.verificationStatus}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={accountTone(brand.accountStatus)}>{brand.accountStatus}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    {brand.collaborationCount}
                  </td>
                  <td className="px-4 py-4">
                    <ActionButtons brand={brand} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[var(--border)] md:hidden">
          {rows.map((brand) => (
            <article key={brand.userId} className="p-4">
              <div className="flex items-start gap-3">
                <Logo brand={brand} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-[var(--text-primary)]">{brand.companyName}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">@{brand.username}</p>
                  <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{brand.email}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Registered {brand.joinedDate ? new Date(brand.joinedDate).toLocaleDateString("en-IN") : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={verificationTone(brand.verificationStatus)}>{brand.verificationStatus}</Badge>
                <Badge tone={brand.profileStatus === "complete" ? "green" : "yellow"}>{brand.profileStatus} profile</Badge>
                <Badge tone={accountTone(brand.accountStatus)}>{brand.accountStatus}</Badge>
                <Badge tone="neutral">{brand.collaborationCount} collaborations</Badge>
              </div>
              <div className="mt-4">
                <ActionButtons brand={brand} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
