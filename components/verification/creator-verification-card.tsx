"use client";

import { type FormEvent, useState } from "react";
import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type CreatorCardData, type CreatorVerificationPlatform } from "@/lib/types";
import { normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

type CreatorVerificationCardProps = {
  creator: CreatorCardData | null;
};

const platformOptions: { label: string; value: CreatorVerificationPlatform }[] = [
  { label: "YouTube", value: "youtube" },
  { label: "Instagram", value: "instagram" },
  { label: "Twitch", value: "twitch" },
  { label: "Other", value: "other" },
];

function defaultProfileUrl(creator: CreatorCardData | null) {
  return creator?.verificationProfileUrl || creator?.youtubeUrl || creator?.instagramUrl || "";
}

export function CreatorVerificationCard({ creator }: CreatorVerificationCardProps) {
  const [platform, setPlatform] = useState<CreatorVerificationPlatform>(creator?.verificationPlatform ?? "youtube");
  const [profileUrl, setProfileUrl] = useState(defaultProfileUrl(creator));
  const [note, setNote] = useState("");
  const [verificationCode, setVerificationCode] = useState(creator?.verificationCode ?? "");
  const [status, setStatus] = useState<string>(creator?.verificationStatus ?? "unverified");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const normalizedStatus = normalizeCreatorVerificationStatus(status);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/creator-verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, profileUrl, note }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; status?: string; verificationCode?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not submit creator verification.");
        return;
      }

      setStatus(result.status ?? "pending");
      setVerificationCode(result.verificationCode ?? verificationCode);
      setSuccess("Creator verification was submitted. Add the HALO code to your public bio before admin review.");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="bridge-eyebrow">Project Halo</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Creator verification</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Submit the platform bio where admins should check your HALO code.
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <ShieldCheck size={20} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={normalizedStatus === "verified" ? "green" : normalizedStatus === "pending" ? "yellow" : "neutral"}>
          {verificationBadgeLabel(status)}
        </Badge>
        {verificationCode ? <Badge tone="neutral">{verificationCode}</Badge> : null}
      </div>

      {verificationCode ? (
        <p className="mt-4 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
          Place <span className="font-mono font-bold text-[var(--text-primary)]">{verificationCode}</span> in your selected platform bio or About section before admin review.
        </p>
      ) : null}

      {error ? (
        <div role="alert" className="mt-4 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="mt-4 rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      {normalizedStatus === "verified" ? (
        <div role="status" className="mt-5 rounded-[8px] border border-emerald-800 bg-emerald-950/30 px-3 py-3 text-sm leading-6 text-emerald-100">
          Creator verification is complete. No submission action is needed right now.
        </div>
      ) : (
      <form onSubmit={onSubmit} aria-busy={isSaving} className="mt-5 grid gap-3">
        <label>
          <span className="bridge-label">Platform</span>
          <select value={platform} onChange={(event) => setPlatform(event.target.value as CreatorVerificationPlatform)} className="bridge-input mt-2">
            {platformOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="bridge-label">Public profile URL</span>
          <input value={profileUrl} onChange={(event) => setProfileUrl(event.target.value)} className="bridge-input mt-2" placeholder="https://..." required />
        </label>
        <label>
          <span className="bridge-label">Verification note</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="bridge-input mt-2 min-h-20" placeholder="Where should the admin look in your bio/About section?" />
        </label>
        <button type="submit" disabled={isSaving} className="bridge-button-primary w-full px-3 py-2 text-sm">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
          Submit Verification
        </button>
      </form>
      )}
    </section>
  );
}
