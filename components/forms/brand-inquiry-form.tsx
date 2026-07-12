"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Building2, Check, ChevronLeft, ChevronRight, ClipboardList, Loader2, MessageSquare, Send, X } from "lucide-react";

import { NICHES, PLATFORMS } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { customPlatformValue, platformDisplayName } from "@/lib/platforms";
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
  customPlatformName: string;
  initialOfferAmount: string;
  timeline: string;
  message: string;
};

type InquiryErrors = Partial<Record<keyof InquiryState | "form", string>>;

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

function FieldError({ message }: { message?: string }) {
  return message ? <span className="mt-2 block text-xs leading-5 text-red-200">{message}</span> : null;
}

function hasErrors(errors: InquiryErrors) {
  return Object.values(errors).some(Boolean);
}

function firstError(errors: InquiryErrors) {
  return Object.values(errors).find(Boolean) ?? "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidFullUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isClearTimeline(value: string) {
  return /\b\d+\s*(day|days|week|weeks|month|months)\b/i.test(value.trim());
}

export function BrandInquiryForm({ creatorUsername = "" }: BrandInquiryFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<InquiryErrors>({});
  const [success, setSuccess] = useState(false);
  const submitInFlightRef = useRef(false);
  const finalSubmitRequestedRef = useRef(false);
  const draftLoadedRef = useRef(false);
  const draftKey = useMemo(() => `branzzo:collaboration-draft:${creatorUsername || "general"}`, [creatorUsername]);
  const [form, setForm] = useState<InquiryState>({
    companyName: "",
    contactName: "",
    email: "",
    website: "",
    campaignGoal: "",
    deliverables: ["Dedicated video"],
    targetNiches: creatorUsername ? [] : ["Tech"],
    targetPlatforms: ["youtube"],
    customPlatformName: "",
    initialOfferAmount: "",
    timeline: "",
    message: "",
  });

  const selectedPlatforms = useMemo(
    () => form.targetPlatforms.map((platform) => platformDisplayName(platform, form.customPlatformName)),
    [form.customPlatformName, form.targetPlatforms],
  );
  const currentStep = steps[stepIndex];
  const isFinalStep = stepIndex === steps.length - 1;
  const progressPercent = ((stepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft) as Partial<InquiryState>;
        setForm((current) => ({ ...current, ...parsed }));
      }
    } catch {
      window.localStorage.removeItem(draftKey);
    } finally {
      draftLoadedRef.current = true;
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftLoadedRef.current || success) return;
    window.localStorage.setItem(draftKey, JSON.stringify(form));
  }, [draftKey, form, success]);

  function setField<K extends keyof InquiryState>(key: K, value: InquiryState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function toggleArray(key: "targetNiches" | "targetPlatforms" | "deliverables", value: string) {
    setForm((current) => {
      const nextValues = current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value];
      return {
        ...current,
        [key]: nextValues,
        ...(key === "targetPlatforms" ? { customPlatformName: customPlatformValue(nextValues, current.customPlatformName) } : {}),
      };
    });
    setFieldErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function validateStep(index: number): InquiryErrors {
    const errors: InquiryErrors = {};

    if (index === 0) {
      if (!form.companyName.trim()) errors.companyName = "Company name is required.";
      if (!form.contactName.trim()) errors.contactName = "Contact name is required.";
      if (!form.email.trim()) errors.email = "Work email is required.";
      else if (!isValidEmail(form.email)) errors.email = "Enter a valid work email before continuing.";

      if (!isValidFullUrl(form.website)) errors.website = "Use a full website URL beginning with http or https.";

      if (form.campaignGoal.trim().length < 20) errors.campaignGoal = "Add at least 20 characters about the campaign goal.";

      if (!/^[1-9]\d*$/.test(form.initialOfferAmount.trim())) errors.initialOfferAmount = "Enter an exact positive INR amount.";

      if (!form.timeline.trim()) errors.timeline = "Timeline is required.";
      else if (!isClearTimeline(form.timeline)) errors.timeline = "Use a clear timeline like 2 weeks or 14 days.";
    }

    if (index === 1) {
      if (form.deliverables.length === 0) errors.deliverables = "Choose at least one deliverable.";
      if (form.targetNiches.length === 0) errors.targetNiches = "Choose at least one target niche.";
      if (form.targetPlatforms.length === 0) errors.targetPlatforms = "Choose at least one platform.";
      if (form.targetPlatforms.includes("other") && form.customPlatformName.trim().length < 2) {
        errors.customPlatformName = "Specify the other platform.";
      }
    }

    return errors;
  }

  function goNext() {
    if (isSaving || stepIndex >= steps.length - 1) return;

    const validationErrors = validateStep(stepIndex);
    if (hasErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      setError(firstError(validationErrors));
      return;
    }

    setError("");
    setFieldErrors({});
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setError("");
    setFieldErrors({});
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!finalSubmitRequestedRef.current || !isFinalStep || success) {
      finalSubmitRequestedRef.current = false;
      return;
    }

    finalSubmitRequestedRef.current = false;
    if (submitInFlightRef.current || isSaving) return;

    setError("");
    setSuccess(false);

    const basicsErrors = validateStep(0);
    const deliverablesErrors = validateStep(1);
    if (hasErrors(basicsErrors) || hasErrors(deliverablesErrors)) {
      const errors = hasErrors(basicsErrors) ? basicsErrors : deliverablesErrors;
      setFieldErrors(errors);
      setError(firstError(errors));
      setStepIndex(hasErrors(basicsErrors) ? 0 : 1);
      return;
    }

    submitInFlightRef.current = true;
    setIsSaving(true);

    try {
      const response = await fetch("/api/brand-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customPlatformName: customPlatformValue(form.targetPlatforms, form.customPlatformName),
          budgetRange: form.initialOfferAmount ? formatINR(Number(form.initialOfferAmount)) : "Exact offer not recorded",
          isNegotiable: false,
          creatorUsername,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not start the collaboration.");
        return;
      }

      setSuccess(true);
      window.localStorage.removeItem(draftKey);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      submitInFlightRef.current = false;
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
                    <FieldError message={fieldErrors.companyName} />
                  </label>
                  <label>
                    <span className="bridge-label">Contact name</span>
                    <input value={form.contactName} onChange={(event) => setField("contactName", event.target.value)} className="bridge-input mt-2" autoComplete="name" required />
                    <FieldError message={fieldErrors.contactName} />
                  </label>
                  <label>
                    <span className="bridge-label">Work email</span>
                    <input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} className="bridge-input mt-2" autoComplete="email" required />
                    <FieldError message={fieldErrors.email} />
                  </label>
                  <label>
                    <span className="bridge-label">Website</span>
                    <input value={form.website} onChange={(event) => setField("website", event.target.value)} className="bridge-input mt-2" placeholder="https://..." />
                    <FieldError message={fieldErrors.website} />
                  </label>
                  <label>
                    <span className="bridge-label">Offer amount (INR)</span>
                    <input
                      value={form.initialOfferAmount}
                      onChange={(event) => setField("initialOfferAmount", event.target.value.replace(/[^\d]/g, ""))}
                      className="bridge-input mt-2"
                      inputMode="numeric"
                      placeholder="50000"
                      required
                    />
                    <span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">
                      Enter the exact offer the creator can accept or decline.
                    </span>
                    <FieldError message={fieldErrors.initialOfferAmount} />
                  </label>
                  <label>
                    <span className="bridge-label">Timeline</span>
                    <input value={form.timeline} onChange={(event) => setField("timeline", event.target.value)} className="bridge-input mt-2" placeholder="2 weeks" required />
                    <FieldError message={fieldErrors.timeline} />
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
                    <FieldError message={fieldErrors.campaignGoal} />
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
                    <FieldError message={fieldErrors.deliverables} />
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
                    <FieldError message={fieldErrors.targetNiches} />
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
                    <FieldError message={fieldErrors.targetPlatforms} />
                    {form.targetPlatforms.includes("other") ? (
                      <label className="mt-4 block">
                        <span className="bridge-label">Specify platform</span>
                        <input
                          value={form.customPlatformName}
                          onChange={(event) => setField("customPlatformName", event.target.value)}
                          className="bridge-input mt-2"
                          placeholder="Kick, Snapchat, Threads, personal blog..."
                          required
                        />
                        <FieldError message={fieldErrors.customPlatformName} />
                      </label>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {!success && stepIndex === 2 ? (
                <label>
                  <span className="bridge-label">Message to creator</span>
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
                    ["Offer amount", form.initialOfferAmount ? formatINR(Number(form.initialOfferAmount)) : "Offer amount not added"],
                    ["Timeline", form.timeline || "Timeline not added"],
                    ["Message to creator", form.message || "No extra message added"],
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
                <button
                  type="submit"
                  onClick={() => {
                    finalSubmitRequestedRef.current = true;
                  }}
                  disabled={isSaving}
                  className="bridge-button-primary w-full sm:w-auto"
                >
                  {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  {isSaving ? "Sending Collaboration" : "Send Collaboration"}
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
