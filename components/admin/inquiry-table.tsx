"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { type BrandInquiryData } from "@/lib/types";

type InquiryTableProps = {
  inquiries: BrandInquiryData[];
};

const statuses: BrandInquiryData["status"][] = ["new", "reviewed", "contacted", "closed"];

export function InquiryTable({ inquiries }: InquiryTableProps) {
  const [rows, setRows] = useState(inquiries);
  const [error, setError] = useState("");

  async function updateStatus(id: string, status: BrandInquiryData["status"]) {
    setError("");
    const response = await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Could not update inquiry.");
      return;
    }

    setRows((current) => current.map((inquiry) => (inquiry.id === id ? { ...inquiry, status } : inquiry)));
  }

  return (
    <div className="bridge-card overflow-hidden">
      {error ? <div className="border-b border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Status</th>
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
                <td className="px-4 py-4 text-[var(--text-secondary)]">{inquiry.budgetRange}</td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">
                  {inquiry.creatorUsername ? `@${inquiry.creatorUsername}` : "Open brief"}
                </td>
                <td className="px-4 py-4">
                  <select
                    value={inquiry.status}
                    onChange={(event) => updateStatus(inquiry.id, event.target.value as BrandInquiryData["status"])}
                    className="bridge-input min-w-36 py-2"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
