"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Send } from "lucide-react";

import { NICHES, PLATFORMS, BUDGET_RANGES } from "@/lib/constants";

type BrandInquiryFormProps = {
  creatorUsername?: string;
};

type InquiryState = {
  companyName: string;
  contactName: string;
  email: string;
  website: string;
  campaignGoal: string;
  targetNiches: string[];
  targetPlatforms: string[];
  budgetRange: string;
  timeline: string;
  message: string;
};

export function BrandInquiryForm({ creatorUsername = "" }: BrandInquiryFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<InquiryState>({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    campaignGoal: "",
    targetNiches: creatorUsername ? [] : ["Tech"],
    targetPlatforms: ["youtube"],
    budgetRange: BUDGET_RANGES[1],
    timeline: "",
    message: "",
  });

  function setField<K extends keyof InquiryState>(key: K, value: InquiryState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleArray(key: "targetNiches" | "targetPlatforms", value: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch("/api/brand-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, creatorUsername }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not submit the inquiry.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (success) {
    return (
      <div className="bridge-card p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950 text-emerald-200">
          <Check size={24} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold">Inquiry received</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
          Your campaign request has been received. The CreatorBridge team can now review the brief and follow up.
        </p>
        <Link
          href="/creators"
          className="focus-ring mt-6 inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
        >
          Browse More Creators
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bridge-card p-5">
      {error ? <div className="mb-5 rounded-[8px] border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      {creatorUsername ? (
        <div className="mb-5 rounded-[8px] border border-violet-800 bg-violet-950/40 px-4 py-3 text-sm text-violet-100">
          This inquiry is linked to @{creatorUsername}.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="bridge-label">Company name</span>
          <input value={form.companyName} onChange={(event) => setField("companyName", event.target.value)} className="bridge-input mt-2" required />
        </label>
        <label>
          <span className="bridge-label">Contact name</span>
          <input value={form.contactName} onChange={(event) => setField("contactName", event.target.value)} className="bridge-input mt-2" required />
        </label>
        <label>
          <span className="bridge-label">Work email</span>
          <input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} className="bridge-input mt-2" required />
        </label>
        <label>
          <span className="bridge-label">Website</span>
          <input value={form.website} onChange={(event) => setField("website", event.target.value)} className="bridge-input mt-2" placeholder="https://..." />
        </label>
        <label className="md:col-span-2">
          <span className="bridge-label">Campaign goal</span>
          <textarea
            value={form.campaignGoal}
            onChange={(event) => setField("campaignGoal", event.target.value)}
            className="bridge-input mt-2 min-h-32"
            placeholder="Describe the product, audience, deliverables, and what success looks like."
            required
          />
        </label>
      </div>

      <div className="mt-6">
        <span className="bridge-label">Target niches</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {NICHES.map((niche) => {
            const selected = form.targetNiches.includes(niche);
            return (
              <button
                key={niche}
                type="button"
                onClick={() => toggleArray("targetNiches", niche)}
                className={`focus-ring rounded-full border px-3 py-2 text-sm font-semibold ${
                  selected ? "border-violet-700 bg-violet-950 text-violet-100" : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {niche}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <span className="bridge-label">Target platforms</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.map((platform) => {
            const selected = form.targetPlatforms.includes(platform.value);
            return (
              <button
                key={platform.value}
                type="button"
                onClick={() => toggleArray("targetPlatforms", platform.value)}
                className={`focus-ring rounded-full border px-3 py-2 text-sm font-semibold ${
                  selected ? "border-emerald-800 bg-emerald-950 text-emerald-100" : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {platform.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label>
          <span className="bridge-label">Budget range</span>
          <select value={form.budgetRange} onChange={(event) => setField("budgetRange", event.target.value)} className="bridge-input mt-2">
            {BUDGET_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="bridge-label">Timeline</span>
          <input value={form.timeline} onChange={(event) => setField("timeline", event.target.value)} className="bridge-input mt-2" placeholder="Launch in 3 weeks" required />
        </label>
        <label className="md:col-span-2">
          <span className="bridge-label">Extra notes</span>
          <textarea value={form.message} onChange={(event) => setField("message", event.target.value)} className="bridge-input mt-2 min-h-24" placeholder="Creator preferences, location, examples, or constraints." />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-6 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        {isSaving ? "Submitting Inquiry" : "Submit Brand Inquiry"}
      </button>
    </form>
  );
}
