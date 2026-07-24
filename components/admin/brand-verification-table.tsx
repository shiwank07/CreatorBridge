"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { AdminPagination, useAdminPagination } from "@/components/admin/admin-pagination";
import { formatDate } from "@/lib/format-date";
import { type BrandVerificationData } from "@/lib/types";

type BrandVerificationTableProps = {
  brands: BrandVerificationData[];
};

type BrandVerificationAction = "approve" | "reject";

function methodLabel(method: BrandVerificationData["verificationMethod"]) {
  const labels = {
    work_email_domain: "Work email domain",
    website_code: "Website code",
    manual: "Manual review",
  };

  return labels[method];
}

export function BrandVerificationTable({ brands }: BrandVerificationTableProps) {
  const [rows, setRows] = useState(brands);
  const pagination = useAdminPagination(rows);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(brands.map((brand) => [brand.username, brand.verificationNote ?? brand.rejectionReason ?? ""])),
  );

  async function updateVerification(brand: BrandVerificationData, action: BrandVerificationAction) {
    setError("");
    setSuccess("");
    setSavingKey(`${brand.username}:${action}`);

    try {
      const response = await fetch("/api/admin/brand-verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: brand.username,
          action,
          note: notes[brand.username] ?? "",
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not update brand verification.");
        return;
      }

      setRows((current) => current.filter((row) => row.username !== brand.username));
      setSuccess(`${brand.companyName} was ${action === "approve" ? "approved" : "rejected"} successfully.`);
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
          No brand verifications are waiting for review.
        </div>
      ) : null}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Proof</th>
              <th className="px-4 py-3">Domains</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((brand) => (
              <tr key={brand.username} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[var(--text-primary)]">{brand.companyName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">@{brand.username}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{brand.contactName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{brand.contactEmail}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge tone="neutral">{methodLabel(brand.verificationMethod)}</Badge>
                  {brand.website ? (
                    <Link href={brand.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300">
                      Website
                      <ExternalLink size={13} />
                    </Link>
                  ) : null}
                  {brand.companyRegistrationText ? (
                    <p className="mt-3 max-w-xs text-xs leading-5 text-[var(--text-secondary)]">
                      {brand.companyRegistrationText}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--text-muted)]">No GST/CIN/company registration text provided.</p>
                  )}
                </td>
                <td className="px-4 py-4 text-xs text-[var(--text-secondary)]">
                  <p>email: {brand.companyDomain || "unknown"}</p>
                  <p className="mt-2">website: {brand.normalizedWebsiteDomain || "unknown"}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge tone="yellow">Pending</Badge>
                  {brand.verificationSubmittedAt ? (
                    <p className="mt-3 text-xs text-[var(--text-secondary)]">
                      Submitted {formatDate(brand.verificationSubmittedAt)}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <textarea
                    aria-label={`Review note for ${brand.companyName}`}
                    value={notes[brand.username] ?? ""}
                    onChange={(event) => setNotes((current) => ({ ...current, [brand.username]: event.target.value }))}
                    className="bridge-input min-h-24 w-64"
                    placeholder="Optional admin note"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    {brand.verificationStatus !== "verified" ? (
                      <button
                        type="button"
                        onClick={() => updateVerification(brand, "approve")}
                        disabled={savingKey.startsWith(`${brand.username}:`)}
                        className="bridge-button-primary px-3 py-2 text-xs"
                      >
                        {savingKey === `${brand.username}:approve` ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                        Approve Verification
                      </button>
                    ) : (
                      <button type="button" disabled className="bridge-action-button justify-center border-emerald-800 text-emerald-200">
                        <BadgeCheck size={14} />
                        Verified
                      </button>
                    )}
                    {brand.verificationStatus !== "rejected" ? (
                      <button
                        type="button"
                        onClick={() => updateVerification(brand, "reject")}
                        disabled={savingKey.startsWith(`${brand.username}:`)}
                        className="bridge-action-button justify-center border-red-900 text-red-200"
                      >
                        {savingKey === `${brand.username}:reject` ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
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
        {pagination.pageItems.map((brand) => (
          <article key={brand.username} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-[var(--text-primary)]">{brand.companyName}</h2>
                <p className="text-xs text-[var(--text-secondary)]">@{brand.username}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{brand.contactName}</p>
                <p className="break-all text-xs text-[var(--text-secondary)]">{brand.contactEmail}</p>
              </div>
              <Badge tone="yellow">Pending</Badge>
            </div>
            <div className="mt-4 space-y-3 text-xs text-[var(--text-secondary)]">
              <Badge tone="neutral">{methodLabel(brand.verificationMethod)}</Badge>
              {brand.website ? (
                <Link href={brand.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-300">
                  Website
                  <ExternalLink size={13} />
                </Link>
              ) : null}
              <p>email domain: {brand.companyDomain || "unknown"}</p>
              <p>website domain: {brand.normalizedWebsiteDomain || "unknown"}</p>
              {brand.companyRegistrationText ? <p className="leading-5">{brand.companyRegistrationText}</p> : null}
            </div>
            <textarea
              aria-label={`Review note for ${brand.companyName}`}
              value={notes[brand.username] ?? ""}
              onChange={(event) => setNotes((current) => ({ ...current, [brand.username]: event.target.value }))}
              className="bridge-input mt-4 min-h-24 w-full"
              placeholder="Optional admin note"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {brand.verificationStatus !== "verified" ? (
                <button
                  type="button"
                  onClick={() => updateVerification(brand, "approve")}
                  disabled={savingKey.startsWith(`${brand.username}:`)}
                  className="bridge-button-primary px-3 py-2 text-xs"
                >
                  {savingKey === `${brand.username}:approve` ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                  Approve Verification
                </button>
              ) : (
                <button type="button" disabled className="bridge-action-button border-emerald-800 text-emerald-200">
                  <BadgeCheck size={14} />
                  Verified
                </button>
              )}
              {brand.verificationStatus !== "rejected" ? (
                <button
                  type="button"
                  onClick={() => updateVerification(brand, "reject")}
                  disabled={savingKey.startsWith(`${brand.username}:`)}
                  className="bridge-action-button border-red-900 text-red-200"
                >
                  {savingKey === `${brand.username}:reject` ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Reject
                </button>
              ) : null}
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
