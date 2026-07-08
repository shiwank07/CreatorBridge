"use client";

import { type FormEvent, useEffect, useState } from "react";
import { BadgeCheck, Check, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type CreatorCardData, type CreatorVerificationPlatform } from "@/lib/types";
import { normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

type CreatorVerificationCardProps = {
  creator: CreatorCardData | null;
};

type CreatorVerificationUiPlatform = CreatorVerificationPlatform | "linkedin";

const platformOptions: { label: string; value: CreatorVerificationUiPlatform }[] = [
  { label: "YouTube", value: "youtube" },
  { label: "Instagram", value: "instagram" },
  { label: "Twitch", value: "twitch" },
  { label: "LinkedIn", value: "linkedin" },
  { label: "Other", value: "other" },
];

function defaultProfileUrl(creator: CreatorCardData | null) {
  return creator?.verificationProfileUrl || creator?.youtubeUrl || creator?.instagramUrl || "";
}

function defaultPlatform(creator: CreatorCardData | null): CreatorVerificationUiPlatform {
  const profileUrl = defaultProfileUrl(creator).toLowerCase();
  if (profileUrl.includes("linkedin.com")) return "linkedin";

  return creator?.verificationPlatform ?? "youtube";
}

function platformSubmitValue(platform: CreatorVerificationUiPlatform): CreatorVerificationPlatform {
  return platform === "linkedin" ? "other" : platform;
}

function platformLabel(platform: CreatorVerificationUiPlatform) {
  return platformOptions.find((option) => option.value === platform)?.label ?? "Other";
}

function createClientVerificationCode() {
  const suffix = Math.floor(100000 + Math.random() * 900000);
  return `BZ-${suffix}`;
}

function ownershipStatusLabel(status: string, hasSubmittedProfileUrl: boolean) {
  if (status === "verified" || status === "ownership_verified") return "Verified Creator";
  if (status === "rejected") return "Verification Rejected";
  if (status === "needs_review") return "Needs Review";
  if (status === "pending" || status === "pending_ownership") return "Verification Pending";
  if (status === "stats_verified" && !hasSubmittedProfileUrl) return "Ownership Not Submitted";

  return verificationBadgeLabel(status);
}

export function CreatorVerificationCard({ creator }: CreatorVerificationCardProps) {
  const [platform, setPlatform] = useState<CreatorVerificationUiPlatform>(defaultPlatform(creator));
  const [profileUrl, setProfileUrl] = useState(defaultProfileUrl(creator));
  const [submittedProfileUrl, setSubmittedProfileUrl] = useState(creator?.verificationProfileUrl ?? "");
  const [submittedPlatform, setSubmittedPlatform] = useState<CreatorVerificationUiPlatform>(defaultPlatform(creator));
  const [note, setNote] = useState("");
  const [verificationCode, setVerificationCode] = useState(creator?.verificationCode ?? "");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string>(creator?.verificationStatus ?? "unverified");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const normalizedStatus = normalizeCreatorVerificationStatus(status);
  const hasSubmittedProfileUrl = Boolean(submittedProfileUrl.trim());
  const isOwnershipVerified = status === "verified" || status === "ownership_verified";
  const canResubmit = status === "rejected" || status === "needs_review";
  const shouldShowForm = !isOwnershipVerified && (!hasSubmittedProfileUrl || canResubmit);
  const statusLabel = ownershipStatusLabel(status, hasSubmittedProfileUrl);
  const statusBadgeTone = isOwnershipVerified ? "green" : normalizedStatus === "pending" || status === "needs_review" ? "yellow" : "neutral";
  const canSubmit = Boolean(verificationCode.trim()) && Boolean(profileUrl.trim()) && !isSaving;

  useEffect(() => {
    if (!verificationCode && !isOwnershipVerified) {
      setVerificationCode(createClientVerificationCode());
    }
  }, [isOwnershipVerified, verificationCode]);

  async function copyVerificationCode() {
    if (!verificationCode) return;
    setError("");

    try {
      await navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the code. Select and copy it manually.");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const platformNote = platform === "linkedin" ? "Platform: LinkedIn." : "";
      const submittedNote = [platformNote, note.trim()].filter(Boolean).join(" ");
      const response = await fetch("/api/creator-verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformSubmitValue(platform),
          profileUrl,
          note: submittedNote,
          verificationCode,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; status?: string; verificationCode?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not submit creator verification.");
        return;
      }

      setStatus(result.status ?? "pending");
      setVerificationCode(result.verificationCode ?? verificationCode);
      setSubmittedProfileUrl(profileUrl);
      setSubmittedPlatform(platform);
      setSuccess("Creator verification was submitted for admin review.");
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
          <p className="bridge-eyebrow">Branzzo</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Creator verification</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Submit the platform bio where admins should check your BZ code.
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <ShieldCheck size={20} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={statusBadgeTone}>{statusLabel}</Badge>
        {hasSubmittedProfileUrl ? <Badge tone="neutral">{platformLabel(submittedPlatform)}</Badge> : null}
      </div>

      {!isOwnershipVerified ? (
        <div className="mt-4 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 p-3">
          <p className="text-xs font-semibold uppercase text-cyan-100">Verification code</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-all font-mono text-2xl font-black text-[var(--text-primary)]">
              {verificationCode || "Generating..."}
            </p>
            <button type="button" onClick={copyVerificationCode} disabled={!verificationCode} className="bridge-button-secondary w-full px-3 py-2 text-xs sm:w-auto">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
            Add this code to your platform bio/About section, then submit your platform link for admin review.
          </p>
        </div>
      ) : null}

      {hasSubmittedProfileUrl ? (
        <div className="mt-4 rounded-[8px] border border-white/10 bg-black/20 p-3 text-sm leading-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Submitted profile</p>
              <a href={submittedProfileUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-2 break-all font-semibold text-cyan-100 hover:text-cyan-50">
                <span className="min-w-0 break-all">{submittedProfileUrl}</span>
                <ExternalLink size={14} className="shrink-0" />
              </a>
            </div>
            <Badge tone={statusBadgeTone} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>
          {!shouldShowForm ? (
            <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
              {isOwnershipVerified
                ? "Platform ownership is verified. No submission action is needed right now."
                : "This link is in review. You can resubmit only if admin rejects it or marks it as needing review."}
            </p>
          ) : null}
        </div>
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

      {isOwnershipVerified ? (
        <div role="status" className="mt-5 rounded-[8px] border border-emerald-800 bg-emerald-950/30 px-3 py-3 text-sm leading-6 text-emerald-100">
          Creator verification is complete. No submission action is needed right now.
        </div>
      ) : shouldShowForm ? (
      <form onSubmit={onSubmit} aria-busy={isSaving} className="mt-5 grid gap-3">
        <label>
          <span className="bridge-label">Platform type</span>
          <select value={platform} onChange={(event) => setPlatform(event.target.value as CreatorVerificationUiPlatform)} className="bridge-input mt-2">
            {platformOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="bridge-label">Platform profile URL</span>
          <input value={profileUrl} onChange={(event) => setProfileUrl(event.target.value)} className="bridge-input mt-2" placeholder="https://..." required />
        </label>
        <label>
          <span className="bridge-label">Verification note optional</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="bridge-input mt-2 min-h-20" placeholder="Where should the admin look in your bio/About section?" />
        </label>
        <button type="submit" disabled={!canSubmit} className="bridge-button-primary w-full px-3 py-2 text-sm">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
          {hasSubmittedProfileUrl ? "Resubmit for review" : "Submit for review"}
        </button>
      </form>
      ) : (
        <div role="status" className="mt-5 rounded-[8px] border border-yellow-700 bg-yellow-950/30 px-3 py-3 text-sm leading-6 text-yellow-100">
          Your platform link is submitted and waiting for admin review.
        </div>
      )}
    </section>
  );
}
