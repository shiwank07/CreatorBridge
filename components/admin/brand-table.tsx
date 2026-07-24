"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Ban, ExternalLink, EyeOff, Loader2, RotateCcw, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { AdminPagination, useAdminPagination } from "@/components/admin/admin-pagination";
import { type AdminBrandData } from "@/lib/types";

type BrandTableProps = {
  brands: AdminBrandData[];
};

type BrandAction = "approve" | "reject" | "hide" | "suspend" | "restore";
type BrandFilter = "all" | "verified" | "pending" | "suspended";

const filters: { value: BrandFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

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

function matchesFilter(brand: AdminBrandData, filter: BrandFilter) {
  if (filter === "verified") return brand.verificationStatus === "verified";
  if (filter === "pending") return brand.verificationStatus === "pending";
  if (filter === "suspended") return brand.accountStatus === "suspended";
  return true;
}

export function BrandTable({ brands }: BrandTableProps) {
  const [rows, setRows] = useState(brands);
  const [filter, setFilter] = useState<BrandFilter>("all");
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const filteredRows = useMemo(() => rows.filter((brand) => matchesFilter(brand, filter)), [rows, filter]);
  const pagination = useAdminPagination(filteredRows);

  async function updateBrand(brand: AdminBrandData, action: BrandAction) {
    setError("");
    setSuccess("");
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
    const isVerified = brand.verificationStatus === "verified";
    const isRejected = brand.verificationStatus === "rejected";
    const isHidden = brand.accountStatus === "hidden";
    const isSuspended = brand.accountStatus === "suspended";
    const actions: { action: BrandAction; label: string; icon: typeof BadgeCheck; className: string }[] = [
      ...(!isVerified
        ? [{ action: "approve" as const, label: "Approve Verification", icon: BadgeCheck, className: "border-emerald-800 text-emerald-200" }]
        : []),
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
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/brands/${brand.username}`}
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
          const key = `${brand.username}:${action}`;
          return (
            <button
              key={action}
              type="button"
              onClick={() => updateBrand(brand, action)}
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
            No brands match this filter.
          </div>
        ) : null}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
              <tr>
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((brand) => (
                <tr key={brand.userId} className="border-b border-[var(--border)] align-top last:border-b-0">
                  <td className="px-4 py-4">
                    <Logo brand={brand} />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[var(--text-primary)]">{brand.companyName}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">@{brand.username}</p>
                  </td>
                  <td className="px-4 py-4 break-all text-[var(--text-secondary)]">{brand.email}</td>
                  <td className="px-4 py-4">
                    <Badge tone={verificationTone(brand.verificationStatus)}>{brand.verificationStatus}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge tone={accountTone(brand.accountStatus)}>{brand.accountStatus}</Badge>
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
          {pagination.pageItems.map((brand) => (
            <article key={brand.userId} className="p-4">
              <div className="flex items-start gap-3">
                <Logo brand={brand} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-[var(--text-primary)]">{brand.companyName}</h2>
                  <p className="text-xs text-[var(--text-secondary)]">@{brand.username}</p>
                  <p className="mt-1 break-all text-xs text-[var(--text-secondary)]">{brand.email}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={verificationTone(brand.verificationStatus)}>{brand.verificationStatus}</Badge>
                <Badge tone={accountTone(brand.accountStatus)}>{brand.accountStatus}</Badge>
              </div>
              <div className="mt-4">
                <ActionButtons brand={brand} />
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
    </div>
  );
}
