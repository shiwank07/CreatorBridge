"use client";

import { type FormEvent, useState } from "react";
import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { type BrandProfileData } from "@/lib/types";
import { verificationBadgeLabel } from "@/lib/verification";

type BrandVerificationCardProps = {
  brand: BrandProfileData | null;
};

export function BrandVerificationCard({ brand }: BrandVerificationCardProps) {
  const [website, setWebsite] = useState(brand?.website ?? "");
  const [contactEmail, setContactEmail] = useState(brand?.contactEmail ?? "");
  const [companyRegistrationText, setCompanyRegistrationText] = useState(brand?.companyRegistrationText ?? "");
  const [status, setStatus] = useState(brand?.verificationStatus ?? "unverified");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isVerified = status === "verified";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/brand-verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website, contactEmail, companyRegistrationText }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; status?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not submit brand verification.");
        return;
      }

      setStatus((result.status as BrandProfileData["verificationStatus"]) ?? "pending");
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
          <h2 className="mt-2 font-display text-2xl font-bold">Brand verification</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Submit company identity details for manual admin review.
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <ShieldCheck size={20} />
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={status === "verified" ? "green" : status === "pending" ? "yellow" : "neutral"}>
          {verificationBadgeLabel(status, "brand")}
        </Badge>
      </div>

      {error ? <div className="mt-4 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div> : null}

      <form onSubmit={onSubmit} className="mt-5 grid gap-3">
        <label>
          <span className="bridge-label">Company website</span>
          <input value={website} onChange={(event) => setWebsite(event.target.value)} className="bridge-input mt-2" placeholder="https://company.com" required />
        </label>
        <label>
          <span className="bridge-label">Work email</span>
          <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className="bridge-input mt-2" placeholder="name@company.com" required />
        </label>
        <label>
          <span className="bridge-label">GST, CIN, or company registration text</span>
          <textarea
            value={companyRegistrationText}
            onChange={(event) => setCompanyRegistrationText(event.target.value)}
            className="bridge-input mt-2 min-h-20"
            placeholder="Optional text only. No file uploads in MVP."
          />
        </label>
        <button type="submit" disabled={isSaving || isVerified} className="bridge-button-primary w-full px-3 py-2 text-sm">
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
          {isVerified ? "Brand Verified" : "Submit Verification"}
        </button>
      </form>
    </section>
  );
}
