"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Loader2, Phone, XCircle } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type AdminContactData } from "@/lib/types";

type ContactTableProps = {
  contacts: AdminContactData[];
};

function profileHref(contact: AdminContactData) {
  return contact.role === "brand" ? `/brands/${contact.username}` : `/creators/${contact.username}`;
}

function statusLabel(contact: AdminContactData) {
  if (!contact.profileStatus) return "Unverified";
  return contact.profileStatus.replaceAll("_", " ");
}

export function ContactTable({ contacts }: ContactTableProps) {
  const [rows, setRows] = useState(contacts);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function updatePhoneVerified(contact: AdminContactData, phoneVerified: boolean) {
    setError("");
    setSuccess("");
    setSavingId(contact.userId);

    try {
      const response = await fetch("/api/admin/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: contact.userId, phoneVerified }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not update contact.");
        return;
      }

      setRows((current) => current.map((row) => (row.userId === contact.userId ? { ...row, phoneVerified } : row)));
      setSuccess(`${contact.companyName || contact.displayName} was marked ${phoneVerified ? "verified" : "unverified"}.`);
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
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Emails</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Phone Verification</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((contact) => (
              <tr key={contact.userId} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {contact.companyName || contact.displayName}
                    </p>
                    <Badge tone={contact.role === "brand" ? "yellow" : "neutral"}>{contact.role}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">@{contact.username}</p>
                  {contact.contactName ? (
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      {contact.contactName}
                      {contact.contactRole ? ` - ${contact.contactRole}` : ""}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-xs leading-5 text-[var(--text-secondary)]">
                  <p className="break-all">
                    <span className="font-semibold text-[var(--text-primary)]">Account:</span> {contact.accountEmail}
                  </p>
                  {contact.contactEmail ? (
                    <p className="mt-2 break-all">
                      <span className="font-semibold text-[var(--text-primary)]">Brand contact:</span> {contact.contactEmail}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-primary)]">
                    <Phone size={15} className="shrink-0 text-cyan-200" />
                    <span className="break-all">{contact.phoneNumber || "No phone added"}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                    Admin-only. Do not share with users; use for trust, support, and urgent contact only.
                  </p>
                </td>
                <td className="px-4 py-4">
                  <Badge tone={contact.profileStatus === "verified" ? "green" : contact.profileStatus === "pending" ? "yellow" : "neutral"}>
                    {statusLabel(contact)}
                  </Badge>
                  {contact.country ? <p className="mt-3 text-xs text-[var(--text-secondary)]">{contact.country}</p> : null}
                  <Link href={profileHref(contact)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-300">
                    Open public profile
                    <ExternalLink size={13} />
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <Badge tone={contact.phoneVerified ? "green" : "neutral"}>
                    {contact.phoneVerified ? "Verified" : "Not verified"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => updatePhoneVerified(contact, !contact.phoneVerified)}
                    disabled={!contact.phoneNumber || savingId === contact.userId}
                    className="focus-ring mt-3 inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === contact.userId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : contact.phoneVerified ? (
                      <XCircle size={14} />
                    ) : (
                      <BadgeCheck size={14} />
                    )}
                    {contact.phoneVerified ? "Mark unverified" : "Mark verified"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
