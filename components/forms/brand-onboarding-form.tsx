"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Building2, Loader2 } from "lucide-react";
import { ProfileImageUpload } from "@/components/shared/profile-image-upload";
import { submitOnboardingWithBusyRetry } from "@/lib/onboarding-request";

type BrandOnboardingFormProps = {
  initialContactName: string;
  initialEmail: string;
  initialLogo?: string;
  initialValues?: {
    companyName?: string;
    contactName?: string;
    contactRole?: string;
    contactEmail?: string;
    phoneNumber?: string;
    logo?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    country?: string;
    companyRegistrationText?: string;
    notes?: string;
    displayPublicly?: boolean;
  };
  redirectHref?: string | null;
  submitLabel?: string;
  successMessage?: string;
};

type FormState = {
  companyName: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  phoneNumber: string;
  logo: string;
  website: string;
  industry: string;
  companySize: string;
  country: string;
  companyRegistrationText: string;
  notes: string;
  displayPublicly: boolean;
};

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export function BrandOnboardingForm({
  initialContactName,
  initialEmail,
  initialLogo = "",
  initialValues,
  redirectHref = "/dashboard/brand",
  submitLabel = "Save Brand Profile",
  successMessage = "Brand profile saved.",
}: BrandOnboardingFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<FormState>({
    companyName: initialValues?.companyName ?? "",
    contactName: initialValues?.contactName ?? initialContactName,
    contactRole: initialValues?.contactRole ?? "",
    contactEmail: initialValues?.contactEmail ?? initialEmail,
    phoneNumber: initialValues?.phoneNumber ?? "",
    logo: initialValues?.logo ?? initialLogo,
    website: initialValues?.website ?? "",
    industry: initialValues?.industry ?? "",
    companySize: initialValues?.companySize ?? COMPANY_SIZES[1],
    country: initialValues?.country ?? "India",
    companyRegistrationText: initialValues?.companyRegistrationText ?? "",
    notes: initialValues?.notes ?? "",
    displayPublicly: initialValues?.displayPublicly ?? false,
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const { response, result } = await submitOnboardingWithBusyRetry("/api/onboarding/brand", form);

      if (!response.ok) {
        setError(result.error ?? "Could not save your brand profile.");
        return;
      }

      setSuccess(successMessage);
      await user?.reload();
      if (redirectHref) router.replace(redirectHref);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} aria-busy={isSaving} className="space-y-6">
      {error ? (
        <div role="alert" className="rounded-[8px] border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <fieldset disabled={isSaving} className="min-w-0 space-y-6 border-0 p-0">
      <section className="bridge-card p-5">
        <h2 className="font-display text-xl font-bold">Brand basics</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="bridge-label">Company name</span>
            <input value={form.companyName} onChange={(event) => setField("companyName", event.target.value)} className="bridge-input mt-2" required />
          </label>
          <label>
            <span className="bridge-label">Industry</span>
            <input value={form.industry} onChange={(event) => setField("industry", event.target.value)} className="bridge-input mt-2" placeholder="Consumer tech" required />
          </label>
          <label>
            <span className="bridge-label">Website</span>
            <input value={form.website} onChange={(event) => setField("website", event.target.value)} className="bridge-input mt-2" placeholder="https://..." />
          </label>
          <label>
            <span className="bridge-label">Company size</span>
            <select value={form.companySize} onChange={(event) => setField("companySize", event.target.value)} className="bridge-input mt-2">
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-2">
            <span className="bridge-label">Country</span>
            <input value={form.country} onChange={(event) => setField("country", event.target.value)} className="bridge-input mt-2" required />
          </label>
          <ProfileImageUpload
            accountType="brand"
            name={form.companyName || form.contactName}
            initialImageUrl={form.logo}
            onImageChange={(imageUrl) => setField("logo", imageUrl)}
          />
          <label className="lg:col-span-2 flex cursor-pointer items-start gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
            <input
              type="checkbox"
              checked={form.displayPublicly}
              onChange={(event) => setField("displayPublicly", event.target.checked)}
              className="mt-1 h-4 w-4 accent-cyan-300"
            />
            <span>
              <span className="block font-semibold text-[var(--text-primary)]">Display publicly on Branzzo</span>
              <span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">
                Opt in to showing only your logo, company name, industry, and verification badge in the public brand showcase.
              </span>
            </span>
          </label>
          <label className="lg:col-span-2">
            <span className="bridge-label">GST, CIN, or company registration text</span>
            <textarea
              value={form.companyRegistrationText}
              onChange={(event) => setField("companyRegistrationText", event.target.value)}
              className="bridge-input mt-2 min-h-24"
              placeholder="Optional text only. Do not upload documents."
            />
          </label>
        </div>
      </section>

      <section className="bridge-card p-5">
        <h2 className="font-display text-xl font-bold">Contact details</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="bridge-label">Contact name</span>
            <input value={form.contactName} onChange={(event) => setField("contactName", event.target.value)} className="bridge-input mt-2" required />
          </label>
          <label>
            <span className="bridge-label">Role</span>
            <input value={form.contactRole} onChange={(event) => setField("contactRole", event.target.value)} className="bridge-input mt-2" placeholder="Growth lead" />
          </label>
          <label className="lg:col-span-2">
            <span className="bridge-label">Work email</span>
            <input type="email" value={form.contactEmail} onChange={(event) => setField("contactEmail", event.target.value)} className="bridge-input mt-2" required />
          </label>
          <label className="lg:col-span-2">
            <span className="bridge-label">Notes</span>
          <textarea value={form.notes} onChange={(event) => setField("notes", event.target.value)} className="bridge-input mt-2 min-h-28" placeholder="Creator categories, markets, or internal context." />
        </label>
      </div>
      </section>
      </fieldset>

      <button
        type="submit"
        disabled={isSaving}
        className="bridge-button-primary w-full py-4"
      >
        {isSaving ? <Loader2 size={17} className="animate-spin" /> : <Building2 size={17} />}
        {isSaving ? "Saving Profile" : submitLabel}
      </button>
    </form>
  );
}
