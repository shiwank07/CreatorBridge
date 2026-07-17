import Link from "next/link";
import { ExternalLink, Phone } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type AdminContactData } from "@/lib/types";

type ContactTableProps = { contacts: AdminContactData[] };

function profileHref(contact: AdminContactData) {
  return contact.role === "brand" ? `/brands/${contact.username}` : `/creators/${contact.username}`;
}

function statusLabel(contact: AdminContactData) {
  return contact.profileStatus?.replaceAll("_", " ") || "Unverified";
}

export function ContactTable({ contacts }: ContactTableProps) {
  return (
    <div className="bridge-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Emails</th>
              <th className="px-4 py-3">Existing phone</th>
              <th className="px-4 py-3">Profile</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.userId} className="border-b border-[var(--border)] align-top last:border-b-0">
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--text-primary)]">{contact.companyName || contact.displayName}</p>
                    <Badge tone={contact.role === "brand" ? "yellow" : "neutral"}>{contact.role}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">@{contact.username}</p>
                  {contact.contactName ? <p className="mt-2 text-xs text-[var(--text-secondary)]">{contact.contactName}{contact.contactRole ? ` - ${contact.contactRole}` : ""}</p> : null}
                </td>
                <td className="px-4 py-4 text-xs leading-5 text-[var(--text-secondary)]">
                  <p className="break-all"><span className="font-semibold text-[var(--text-primary)]">Account:</span> {contact.accountEmail}</p>
                  {contact.contactEmail ? <p className="mt-2 break-all"><span className="font-semibold text-[var(--text-primary)]">Brand contact:</span> {contact.contactEmail}</p> : null}
                </td>
                <td className="px-4 py-4">
                  {contact.phoneNumber ? (
                    <>
                      <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text-primary)]">
                        <Phone size={15} className="shrink-0 text-cyan-200" />
                        <span className="break-all">{contact.phoneNumber}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">Admin-only historical contact data.</p>
                    </>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  <Badge tone={contact.profileStatus === "verified" ? "green" : contact.profileStatus === "pending" ? "yellow" : "neutral"}>{statusLabel(contact)}</Badge>
                  {contact.country ? <p className="mt-3 text-xs text-[var(--text-secondary)]">{contact.country}</p> : null}
                  <Link href={profileHref(contact)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-300">Open public profile <ExternalLink size={13} /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
