"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Crown, ExternalLink, Loader2 } from "lucide-react";

import { type CreatorCardData } from "@/lib/types";

type CreatorTableProps = {
  creators: CreatorCardData[];
};

export function CreatorTable({ creators }: CreatorTableProps) {
  const [rows, setRows] = useState(creators);
  const [savingUsername, setSavingUsername] = useState("");
  const [error, setError] = useState("");

  async function updateCreator(username: string, patch: { isFeatured?: boolean; isVerified?: boolean }) {
    setError("");
    setSavingUsername(username);
    const response = await fetch("/api/admin/creators", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, ...patch }),
    });
    const result = (await response.json()) as { error?: string };
    setSavingUsername("");

    if (!response.ok) {
      setError(result.error ?? "Could not update creator.");
      return;
    }

    setRows((current) =>
      current.map((creator) =>
        creator.username === username
          ? {
              ...creator,
              ...patch,
            }
          : creator,
      ),
    );
  }

  return (
    <div className="bridge-card overflow-hidden">
      {error ? <div className="border-b border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Niche</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Profile</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((creator) => (
              <tr key={creator.username} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-4 py-4">
                  <p className="font-semibold text-[var(--text-primary)]">{creator.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">@{creator.username}</p>
                </td>
                <td className="px-4 py-4 text-[var(--text-secondary)]">{creator.niche.join(", ")}</td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => updateCreator(creator.username, { isFeatured: !creator.isFeatured })}
                    className="focus-ring inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {savingUsername === creator.username ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
                    {creator.isFeatured ? "Featured" : "Standard"}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => updateCreator(creator.username, { isVerified: !creator.isVerified })}
                    className="focus-ring inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {savingUsername === creator.username ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                    {creator.isVerified ? "Verified" : "Unverified"}
                  </button>
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/creators/${creator.username}`}
                    className="focus-ring inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Open
                    <ExternalLink size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
