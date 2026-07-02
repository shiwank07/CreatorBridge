"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
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
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(brands.map((brand) => [brand.username, brand.verificationNote ?? brand.rejectionReason ?? ""])),
  );

  async function updateVerification(brand: BrandVerificationData, action: BrandVerificationAction) {
    setError("");
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
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Proof</th>
              <th className="px-4 py-3">Domains</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((brand) => (
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
                      Submitted {new Date(brand.verificationSubmittedAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <textarea
                    value={notes[brand.username] ?? ""}
                    onChange={(event) => setNotes((current) => ({ ...current, [brand.username]: event.target.value }))}
                    className="bridge-input min-h-24 w-64"
                    placeholder="Optional admin note"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => updateVerification(brand, "approve")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      {savingKey === `${brand.username}:approve` ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                      Approve Brand
                    </button>
                    <button
                      type="button"
                      onClick={() => updateVerification(brand, "reject")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-[8px] border border-red-900 px-3 py-2 text-xs font-semibold text-red-200"
                    >
                      {savingKey === `${brand.username}:reject` ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
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
