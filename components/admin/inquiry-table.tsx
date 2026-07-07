"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";

import { CollaborationTimeline } from "@/components/collaborations/collaboration-timeline";
import { COLLABORATION_STATUSES, collaborationStatusLabel } from "@/lib/collaborations";
import { formatINR } from "@/lib/format";
import { type BrandInquiryData } from "@/lib/types";

type InquiryTableProps = {
  inquiries: BrandInquiryData[];
};

export function InquiryTable({ inquiries }: InquiryTableProps) {
  const [rows, setRows] = useState(inquiries);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function updateStatus(id: string, status: BrandInquiryData["status"]) {
    setError("");
    setSuccess("");
    setSavingId(id);
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not update the collaboration.");
        return;
      }

      setRows((current) => current.map((inquiry) => (inquiry.id === id ? { ...inquiry, status } : inquiry)));
      setSuccess("Collaboration status updated successfully.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSavingId("");
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Deliverables</th>
              <th className="px-4 py-3">Offer</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Collaboration Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inquiry) => (
              <tr key={inquiry.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[var(--text-primary)]">{inquiry.companyName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{inquiry.contactName}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{inquiry.email}</p>
                </td>
                <td className="max-w-md px-4 py-4 text-[var(--text-secondary)]">
                  <p className="line-clamp-3">{inquiry.campaignGoal}</p>
                  {inquiry.website ? (
                    <Link href={inquiry.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-violet-300">
                      Website
                      <ExternalLink size={13} />
                    </Link>
                  ) : null}
                </td>
                <td className="max-w-48 px-4 py-4 text-[var(--text-secondary)]">
                  <p className="line-clamp-3">{inquiry.deliverables.length > 0 ? inquiry.deliverables.join(", ") : "Not listed"}</p>
                </td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {inquiry.currentOfferAmount ? formatINR(inquiry.currentOfferAmount) : "Exact offer not recorded"}
                  </p>
                </td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">
                  {inquiry.creatorUsername ? `@${inquiry.creatorUsername}` : "Open brief"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={inquiry.status}
                      onChange={(event) => updateStatus(inquiry.id, event.target.value as BrandInquiryData["status"])}
                      disabled={savingId === inquiry.id}
                      className="bridge-input min-w-36 py-2"
                    >
                      {COLLABORATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {collaborationStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                    {savingId === inquiry.id ? <Loader2 size={16} className="shrink-0 animate-spin text-violet-300" aria-label="Updating status" /> : null}
                  </div>
                  <CollaborationTimeline status={inquiry.status} compact className="mt-3 min-w-80" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
