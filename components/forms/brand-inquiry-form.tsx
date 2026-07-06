"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Check, ChevronLeft, ChevronRight, ClipboardList, Loader2, MessageSquare, Send, X } from "lucide-react";

import { BUDGET_RANGES, NICHES, PLATFORMS } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

type BrandInquiryFormProps = {
  creatorUsername?: string;
};

type InquiryState = {
  companyName: string;
  contactName: string;
  email: string;
  website: string;
  campaignGoal: string;
  deliverables: string[];
  targetNiches: string[];
  targetPlatforms: string[];
  budgetRange: string;
  initialOfferAmount: string;
  isNegotiable: boolean;
  timeline: string;
  message: string;
};

const deliverableOptions = [
  "Dedicated video",
  "Short-form reel",
  "Product review",
  "Story mention",
  "Livestream segment",
  "Giveaway",
  "Event coverage",
  "Usage rights",
];

const steps = [
  { title: "Campaign Basics", icon: Building2 },
  { title: "Deliverables", icon: ClipboardList },
  { title: "Message", icon: MessageSquare },
  { title: "Review & Send", icon: Send },
];

function joinList(items: string[]) {
  return items.length > 0 ? items.join(", ") : "Not selected";
}

export function BrandInquiryForm({ creatorUsername = "" }: BrandInquiryFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<InquiryState>({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    campaignGoal: "",
    deliverables: ["Dedicated video"],
    targetNiches: creatorUsername ? [] : ["Tech"],
    targetPlatforms: ["youtube"],
    budgetRange: BUDGET_RANGES[1],
    initialOfferAmount: "",
    isNegotiable: true,
    timeline: "",
    message: "",
  });

  const selectedPlatforms = useMemo(
    () => PLATFORMS.filter((platform) => form.targetPlatforms.includes(platform.value)).map((platform) => platform.label),
    [form.targetPlatforms],
  );
  const currentStep = steps[stepIndex];
  const isFinalStep = stepIndex === steps.length - 1;
  const progressPercent = ((stepIndex + 1) / steps.length) * 100;

  function setField<K extends keyof InquiryState>(key: K, value: InquiryState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleArray(key: "targetNiches" | "targetPlatforms" | "deliverables", value: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }));
  }

  function validateStep(index: number) {
    if (index === 0) {
      if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim()) {
        return "Add the company, contact, and work email before continuing.";
      }

      if (form.website.trim() && !/^https?:\/\/.+/i.test(form.website.trim())) {
        return "Use a full website URL beginning with http or https.";
      }

      if (form.campaignGoal.trim().length < 20) {
        return "Add a little more detail about the campaign goal.";
      }

      if (!Number.isFinite(Number(form.initialOfferAmount)) || Number(form.initialOfferAmount) <= 0) {
        return "Enter the exact initial offer amount in INR.";
      }

      if (!form.timeline.trim()) {
        return "Add the preferred campaign timeline.";
      }
    }

    if (index === 1) {
      if (form.deliverables.length === 0) return "Choose at least one deliverable.";
      if (form.targetNiches.length === 0) return "Choose at least one target niche.";
      if (form.targetPlatforms.length === 0) return "Choose at least one platform.";
    }

    return "";
  }

  function goNext() {
    const validationError = validateStep(stepIndex);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setError("");
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    const basicsError = validateStep(0);
    const deliverablesError = validateStep(1);
    if (basicsError || deliverablesError) {
      setError(basicsError || deliverablesError);
      setStepIndex(basicsError ? 0 : 1);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/brand-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, creatorUsername }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not start the collaboration.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) {
    return (
      <div className="bridge-card p-6 text-center">
        <h2 className="font-display text-2xl font-bold">Ready to start a collaboration?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
          Build a structured request with the campaign basics, deliverables, and first message.
        </p>
        <button type="button" onClick={() => setIsOpen(true)} className="bridge-button-primary mt-6 w-full sm:w-auto">
          <Send size={17} />
          Start Collaboration
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-5 backdrop-blur-sm sm:py-8">
      <div className="mx-auto flex min-h-full max-w-5xl items-center">
        <form
          onSubmit={onSubmit}
          aria-busy={isSaving}
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-collaboration-title"
          className="bridge-card my-auto w-full overflow-hidden"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="bridge-eyebrow">Start Collaboration</p>
              <p className="mt-2 text-xs font-semibold uppercase text-[var(--text-muted)]">
                Step {stepIndex + 1} of {steps.length}
              </p>
              <h2 id="start-collaboration-title" className="mt-2 font-display text-2xl font-black sm:text-3xl">
                {currentStep.title}
              </h2>
              <div className="mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-200" style={{ width: `${progressPercent}%` }} />
              </div>
              {stepIndex === 0 ? (
                <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                  Tell the creator what you&apos;re planning so they can quickly decide if it&apos;s a good fit.
                </p>
              ) : null}
              {creatorUsername ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Linked to @{creatorUsername}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Close collaboration modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)]">
            <aside className="min-w-0">
              <ol className="grid gap-2">
                {steps.map(({ title, icon: Icon }, index) => {
                  const isCurrent = index === stepIndex;
                  const isComplete = index < stepIndex || success;
                  const isUnavailable = index > stepIndex || isSaving || success;

                  return (
                    <li key={title}>
                      <button
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => {
                          if (index <= stepIndex) {
                            setError("");
                            setStepIndex(index);
                          }
                        }}
                        className={cn(
                          "focus-ring flex w-full min-w-0 items-center gap-3 rounded-[8px] border px-3 py-3 text-left text-sm font-semibold",
                          isCurrent
                            ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-50"
                            : "border-white/10 bg-white/[0.035] text-[var(--text-secondary)]",
                        )}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-black/20">
                          {isComplete ? <Check size={16} /> : <Icon size={16} />}
                        </span>
                        <span className="truncate">{title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </aside>

            <fieldset disabled={isSaving || success} className="min-w-0 border-0 p-0">
              {error ? (
                <div role="alert" className="mb-5 rounded-[8px] border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div role="status" className="py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950 text-emerald-200">
                    <Check size={24} />
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-bold">Collaboration request sent</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                    The creator will see this request in their dashboard and notification inbox.
                  </p>
                  <Link href="/creators" className="bridge-button-primary mt-6 w-full sm:w-auto">
                    Browse More Creators
                  </Link>
                </div>
              ) : null}

              {!success && stepIndex === 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <label>
                    <span className="bridge-label">Company name</span>
                    <input value={form.companyName} onChange={(event) => setField("companyName", event.target.value)} className="bridge-input mt-2" autoComplete="organization" required />
                  </label>
                  <label>
                    <span className="bridge-label">Contact name</span>
                    <input value={form.contactName} onChange={(event) => setField("contactName", event.target.value)} className="bridge-input mt-2" autoComplete="name" required />
                  </label>
                  <label>
                    <span className="bridge-label">Work email</span>
                    <input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} className="bridge-input mt-2" autoComplete="email" required />
                  </label>
                  <label>
                    <span className="bridge-label">Website</span>
                    <input value={form.website} onChange={(event) => setField("website", event.target.value)} className="bridge-input mt-2" placeholder="https://..." />
                  </label>
                  <label>
                    <span className="bridge-label">Budget range context</span>
                    <select value={form.budgetRange} onChange={(event) => setField("budgetRange", event.target.value)} className="bridge-input mt-2">
                      {BUDGET_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                    <span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">Use this as context; the exact offer is required below.</span>
                  </label>
                  <label>
                    <span className="bridge-label">Initial offer amount (INR)</span>
                    <input
                      value={form.initialOfferAmount}
                      onChange={(event) => setField("initialOfferAmount", event.target.value.replace(/[^\d]/g, ""))}
                      className="bridge-input mt-2"
                      inputMode="numeric"
                      placeholder="50000"
                      required
                    />
                    <span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">
                      This exact offer is sent to the creator in INR.
                    </span>
                  </label>
                  <label>
                    <span className="bridge-label">Timeline</span>
                    <input value={form.timeline} onChange={(event) => setField("timeline", event.target.value)} className="bridge-input mt-2" placeholder="Launch in 3 weeks" required />
                  </label>
                  <label className="flex items-center gap-3 rounded-[8px] border border-[var(--border)] bg-[#0d0d14] px-4 py-3 text-sm text-[var(--text-secondary)]">
                    <input type="checkbox" checked={form.isNegotiable} onChange={(event) => setField("isNegotiable", event.target.checked)} className="h-4 w-4 accent-cyan-500" />
                    <span>
                      <span className="block font-semibold text-[var(--text-primary)]">Offer is negotiable</span>
                      <span className="mt-1 block text-xs leading-5">Creators can request a revised offer before accepting.</span>
                    </span>
                  </label>
                  <label className="lg:col-span-2">
                    <span className="bridge-label">Campaign goal</span>
                    <textarea
                      value={form.campaignGoal}
                      onChange={(event) => setField("campaignGoal", event.target.value)}
                      className="bridge-input mt-2 min-h-32"
                      placeholder="Describe the product, audience, creator fit, and what success looks like."
                      required
                    />
                  </label>
                </div>
              ) : null}

              {!success && stepIndex === 1 ? (
                <div className="space-y-6">
                  <div>
                    <span className="bridge-label">Deliverables</span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {deliverableOptions.map((deliverable) => {
                        const selected = form.deliverables.includes(deliverable);
                        return (
                          <button
                            key={deliverable}
                            type="button"
                            onClick={() => toggleArray("deliverables", deliverable)}
                            className={cn(
                              "focus-ring rounded-full border px-3 py-2 text-sm font-semibold",
                              selected ? "border-cyan-700 bg-cyan-950/70 text-cyan-100" : "border-[var(--border)] text-[var(--text-secondary)]",
                            )}
                          >
                            {deliverable}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="bridge-label">Target niches</span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {NICHES.map((niche) => {
                        const selected = form.targetNiches.includes(niche);
                        return (
                          <button
                            key={niche}
                            type="button"
                            onClick={() => toggleArray("targetNiches", niche)}
                            className={cn(
                              "focus-ring rounded-full border px-3 py-2 text-sm font-semibold",
                              selected ? "border-violet-700 bg-violet-950 text-violet-100" : "border-[var(--border)] text-[var(--text-secondary)]",
                            )}
                          >
                            {niche}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="bridge-label">Target platforms</span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PLATFORMS.map((platform) => {
                        const selected = form.targetPlatforms.includes(platform.value);
                        return (
                          <button
                            key={platform.value}
                            type="button"
                            onClick={() => toggleArray("targetPlatforms", platform.value)}
                            className={cn(
                              "focus-ring rounded-full border px-3 py-2 text-sm font-semibold",
                              selected ? "border-emerald-800 bg-emerald-950 text-emerald-100" : "border-[var(--border)] text-[var(--text-secondary)]",
                            )}
                          >
                            {platform.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {!success && stepIndex === 2 ? (
                <label>
                  <span className="bridge-label">Message to Branzzo</span>
                  <textarea
                    value={form.message}
                    onChange={(event) => setField("message", event.target.value)}
                    className="bridge-input mt-2 min-h-64"
                    placeholder="Add creator preferences, location, sample references, constraints, or context that would help evaluate the collaboration."
                  />
                </label>
              ) : null}

              {!success && stepIndex === 3 ? (
                <div className="grid gap-4">
                  {[
                    ["Brand", `${form.companyName || "Company"} - ${form.contactName || "Contact"} (${form.email || "email not added"})`],
                    ["Campaign", form.campaignGoal || "Campaign goal not added"],
                    ["Deliverables", joinList(form.deliverables)],
                    ["Audience", joinList(form.targetNiches)],
                    ["Platforms", joinList(selectedPlatforms)],
                    ["Budget range", form.budgetRange],
                    ["Initial offer", form.initialOfferAmount ? formatINR(Number(form.initialOfferAmount)) : "Offer amount not added"],
                    ["Negotiable", form.isNegotiable ? "Yes" : "No"],
                    ["Timeline", form.timeline || "Timeline not added"],
                    ["Message", form.message || "No extra message added"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">{label}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </fieldset>
          </div>

          {!success ? (
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
              <button type="button" onClick={goBack} disabled={stepIndex === 0 || isSaving} className="bridge-button-secondary w-full sm:w-auto">
                <ChevronLeft size={17} />
                Back
              </button>
              {isFinalStep ? (
                <button type="submit" disabled={isSaving} className="bridge-button-primary w-full sm:w-auto">
                  {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  {isSaving ? "Starting Collaboration" : "Start Collaboration"}
                </button>
              ) : (
                <button type="button" onClick={goNext} disabled={isSaving} className="bridge-button-primary w-full sm:w-auto">
                  Continue
                  <ChevronRight size={17} />
                </button>
              )}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
