"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Check, Loader2, Plus, Trash2, UserPlus } from "lucide-react";

import { ProfileImageUpload } from "@/components/shared/profile-image-upload";
import { createBrowserDraftId } from "@/lib/browser-draft-id";
import { submitOnboardingWithBusyRetry } from "@/lib/onboarding-request";
import { NICHES, RATE_TYPES } from "@/lib/constants";
import { splitList } from "@/lib/slug";
import { AUDIENCE_TYPES, PLATFORM_DEFINITIONS, PLATFORM_KINDS, type AudienceType, type PlatformKind } from "@/lib/creator-platforms";

type PlatformAccountDraft = { id: string; platform: PlatformKind; customPlatformName: string; profileUrl: string; handle: string; audienceType: AudienceType; audienceCount: string; averageViews: string; engagementRate: string; isPrimary: boolean };

const INITIAL_PLATFORM_ACCOUNT_DRAFT_ID = "initial-platform-account";

function emptyPlatformAccount(id: string, isPrimary = false): PlatformAccountDraft {
  return { id, platform: "instagram", customPlatformName: "", profileUrl: "", handle: "", audienceType: "followers", audienceCount: "", averageViews: "", engagementRate: "", isPrimary };
}

type CreatorOnboardingFormProps = {
  initialName: string;
  initialUsername: string;
  initialAvatar?: string;
  initialValues?: {
    platformAccounts?: Array<{ id: string; platform: PlatformKind; customPlatformName?: string; profileUrl: string; handle?: string; audienceType: AudienceType; audienceCount: number; averageViews?: number; engagementRate?: number; isPrimary: boolean }>;
    phoneNumber?: string;
    avatar?: string;
    bio?: string;
    niche?: string[];
    country?: string;
    languagesText?: string;
    youtubeUrl?: string;
    youtubeHandle?: string;
    subscribers?: string;
    avgViews?: string;
    engagementRate?: string;
    instagramUrl?: string;
    instagramFollowers?: string;
    podcastUrl?: string;
    sponsorshipRate?: string;
    pricingChoice?: "starting_price" | "contact_for_pricing";
    rateType?: "per_video" | "per_post" | "per_campaign";
    pastBrandsText?: string;
    sampleWorkText?: string;
    availabilityStatus?: "open_to_deals" | "limited_availability" | "unavailable" | "closed";
    isOpenToDeals?: boolean;
    upiId?: string;
    paypalEmail?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    ifsc?: string;
    preferredPaymentNote?: string;
  };
  redirectHref?: string | null;
  submitLabel?: string;
  successMessage?: string;
};

type FormState = {
  name: string;
  username: string;
  phoneNumber: string;
  avatar: string;
  bio: string;
  niche: string[];
  country: string;
  languagesText: string;
  youtubeUrl: string;
  youtubeHandle: string;
  subscribers: string;
  avgViews: string;
  engagementRate: string;
  instagramUrl: string;
  instagramFollowers: string;
  podcastUrl: string;
  sponsorshipRate: string;
  pricingChoice: "starting_price" | "contact_for_pricing";
  rateType: "per_video" | "per_post" | "per_campaign";
  pastBrandsText: string;
  sampleWorkText: string;
  availabilityStatus: "open_to_deals" | "limited_availability" | "unavailable" | "closed";
  isOpenToDeals: boolean;
  upiId: string;
  paypalEmail: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifsc: string;
  preferredPaymentNote: string;
};

export function CreatorOnboardingForm({
  initialName,
  initialUsername,
  initialAvatar = "",
  initialValues,
  redirectHref = "/dashboard/creator",
  submitLabel = "Publish Creator Profile",
  successMessage = "Creator profile saved.",
}: CreatorOnboardingFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState("");
  const legacyAccounts: PlatformAccountDraft[] = initialValues?.platformAccounts?.map((account) => ({ ...account, customPlatformName: account.customPlatformName ?? "", handle: account.handle ?? "", audienceCount: String(account.audienceCount), averageViews: account.averageViews ? String(account.averageViews) : "", engagementRate: account.engagementRate ? String(account.engagementRate) : "" })) ?? [];
  const [platformAccounts, setPlatformAccounts] = useState<PlatformAccountDraft[]>(legacyAccounts.length ? legacyAccounts : [emptyPlatformAccount(INITIAL_PLATFORM_ACCOUNT_DRAFT_ID, true)]);
  const [form, setForm] = useState<FormState>({
    name: initialName,
    username: initialUsername,
    phoneNumber: initialValues?.phoneNumber ?? "",
    avatar: initialValues?.avatar ?? initialAvatar,
    bio: initialValues?.bio ?? "",
    niche: initialValues?.niche ?? [],
    country: initialValues?.country ?? "India",
    languagesText: initialValues?.languagesText ?? "English, Hindi",
    youtubeUrl: initialValues?.youtubeUrl ?? "",
    youtubeHandle: initialValues?.youtubeHandle ?? "",
    subscribers: initialValues?.subscribers ?? "",
    avgViews: initialValues?.avgViews ?? "",
    engagementRate: initialValues?.engagementRate ?? "",
    instagramUrl: initialValues?.instagramUrl ?? "",
    instagramFollowers: initialValues?.instagramFollowers ?? "",
    podcastUrl: initialValues?.podcastUrl ?? "",
    sponsorshipRate: initialValues?.sponsorshipRate ?? "",
    pricingChoice: initialValues?.pricingChoice ?? (initialValues?.sponsorshipRate ? "starting_price" : "contact_for_pricing"),
    rateType: initialValues?.rateType ?? "per_video",
    pastBrandsText: initialValues?.pastBrandsText ?? "",
    sampleWorkText: initialValues?.sampleWorkText ?? "",
    availabilityStatus: initialValues?.availabilityStatus ?? (initialValues?.isOpenToDeals === false ? "unavailable" : "open_to_deals"),
    isOpenToDeals: initialValues?.isOpenToDeals ?? true,
    upiId: initialValues?.upiId ?? "",
    paypalEmail: initialValues?.paypalEmail ?? "",
    bankAccountName: initialValues?.bankAccountName ?? "",
    bankAccountNumber: initialValues?.bankAccountNumber ?? "",
    ifsc: initialValues?.ifsc ?? "",
    preferredPaymentNote: initialValues?.preferredPaymentNote ?? "",
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleNiche(niche: string) {
    setForm((current) => ({
      ...current,
      niche: current.niche.includes(niche) ? current.niche.filter((item) => item !== niche) : [...current.niche, niche],
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess("");
    setIsSaving(true);

    const payload = {
      name: form.name,
      username: form.username,
      phoneNumber: form.phoneNumber,
      avatar: form.avatar,
      bio: form.bio,
      niche: form.niche,
      country: form.country,
      languages: splitList(form.languagesText),
      platformAccounts: platformAccounts.map((account) => ({ ...account, audienceCount: Number(account.audienceCount || 0), averageViews: account.averageViews ? Number(account.averageViews) : undefined, engagementRate: account.engagementRate ? Number(account.engagementRate) : undefined })),
      youtubeUrl: form.youtubeUrl,
      youtubeHandle: form.youtubeHandle,
      subscribers: Number(form.subscribers || 0),
      avgViews: Number(form.avgViews || 0),
      engagementRate: Number(form.engagementRate || 0),
      instagramUrl: form.instagramUrl,
      instagramFollowers: Number(form.instagramFollowers || 0),
      podcastUrl: form.podcastUrl,
      sponsorshipRate: Number(form.sponsorshipRate || 0),
      pricingChoice: form.pricingChoice,
      rateType: form.rateType,
      pastBrands: splitList(form.pastBrandsText),
      sampleWorkUrls: splitList(form.sampleWorkText),
      availabilityStatus: form.availabilityStatus,
      isOpenToDeals: form.availabilityStatus === "open_to_deals" || form.availabilityStatus === "limited_availability",
      upiId: form.upiId,
      paypalEmail: form.paypalEmail,
      bankAccountName: form.bankAccountName,
      bankAccountNumber: form.bankAccountNumber,
      ifsc: form.ifsc,
      preferredPaymentNote: form.preferredPaymentNote,
    };

    try {
      const { response, result } = await submitOnboardingWithBusyRetry("/api/onboarding/creator", payload);

      if (!response.ok) {
        setError(result.error ?? "Could not save your creator profile.");
        setFieldErrors(result.fieldErrors ?? {});
        const firstField = Object.keys(result.fieldErrors ?? {})[0];
        if (firstField) window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`[name="${firstField}"]`)?.focus());
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
        <div role="alert" aria-live="assertive" className="rounded-[8px] border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <p className="font-semibold">{error}</p>
          {Object.keys(fieldErrors).length ? <ul className="mt-2 list-disc space-y-1 pl-5">{Object.entries(fieldErrors).flatMap(([key, messages]) => messages.map((message) => <li key={`${key}-${message}`}>{message}</li>))}</ul> : null}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <fieldset disabled={isSaving} className="min-w-0 space-y-6 border-0 p-0">
      <section className="bridge-card p-5">
        <h2 className="font-display text-xl font-bold">Profile basics</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="bridge-label">Creator name</span>
            <input name="name" value={form.name} onChange={(event) => setField("name", event.target.value)} className="bridge-input mt-2" required />
          </label>
          <label>
            <span className="bridge-label">Username</span>
            <input
              name="username"
              value={form.username}
              onChange={(event) => setField("username", event.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
              className="bridge-input mt-2"
              required
            />
          </label>
          <ProfileImageUpload
            accountType="creator"
            name={form.name}
            initialImageUrl={form.avatar}
            onImageChange={(imageUrl) => setField("avatar", imageUrl)}
          />
          <label className="lg:col-span-2">
            <span className="bridge-label">Bio</span>
            <textarea
              name="bio"
              value={form.bio}
              onChange={(event) => setField("bio", event.target.value)}
              className="bridge-input mt-2 min-h-32"
              placeholder="Tell brands what you create, who watches, and what campaigns work best."
              required
            />
          </label>
        </div>
      </section>

      <section className="bridge-card p-5">
        <h2 className="font-display text-xl font-bold">Niche and audience</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {NICHES.map((niche) => {
            const isSelected = form.niche.includes(niche);
            return (
              <button
                key={niche}
                type="button"
                onClick={() => toggleNiche(niche)}
                className={`focus-ring rounded-full border px-3 py-2 text-sm font-semibold ${
                  isSelected ? "border-violet-700 bg-violet-950 text-violet-100" : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {isSelected ? <Check size={14} className="mr-1 inline" /> : null}
                {niche}
              </button>
            );
          })}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="bridge-label">Country</span>
            <input name="country" value={form.country} onChange={(event) => setField("country", event.target.value)} className="bridge-input mt-2" required />
          </label>
          <label>
            <span className="bridge-label">Languages</span>
            <input name="languages" value={form.languagesText} onChange={(event) => setField("languagesText", event.target.value)} className="bridge-input mt-2" />
          </label>
        </div>
      </section>

      <section className="bridge-card min-w-0 p-5">
        <h2 className="font-display text-xl font-bold">Platform accounts</h2>
        <p id="platform-help" className="mt-2 text-sm text-[var(--text-secondary)]">Add at least one public HTTPS profile URL and its positive audience count so brands can evaluate reach. YouTube is not required.</p>
        <div className="mt-5 space-y-4">
          {platformAccounts.map((account, index) => {
            const definition = PLATFORM_DEFINITIONS[account.platform];
            const update = (changes: Partial<PlatformAccountDraft>) => setPlatformAccounts((current) => current.map((item) => item.id === account.id ? { ...item, ...changes } : item));
            return <fieldset key={account.id} className="min-w-0 rounded-[8px] border border-[var(--border)] p-4">
              <legend className="px-2 font-semibold">Account {index + 1}</legend>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <label><span className="bridge-label">Platform</span><select aria-label={`Platform for account ${index + 1}`} value={account.platform} onChange={(event) => { const platform = event.target.value as PlatformKind; update({ platform, audienceType: PLATFORM_DEFINITIONS[platform].audienceType, customPlatformName: platform === "other" ? account.customPlatformName : "" }); }} className="bridge-input mt-2">{PLATFORM_KINDS.map((platform) => <option key={platform} value={platform}>{PLATFORM_DEFINITIONS[platform].label}</option>)}</select></label>
                {account.platform === "other" ? <label><span className="bridge-label">Platform name</span><input required maxLength={50} value={account.customPlatformName} onChange={(event) => update({ customPlatformName: event.target.value })} className="bridge-input mt-2" /></label> : null}
                <label className="sm:col-span-2"><span className="bridge-label">{definition.label} profile URL *</span><input name="platformAccounts" required aria-describedby="platform-help" type="url" value={account.profileUrl} onChange={(event) => update({ profileUrl: event.target.value })} className="bridge-input mt-2 min-w-0" placeholder="https://..." /></label>
                <label><span className="bridge-label">Handle (optional)</span><input maxLength={80} value={account.handle} onChange={(event) => update({ handle: event.target.value })} className="bridge-input mt-2" placeholder="@creator" /></label>
                {account.platform === "other" ? <label><span className="bridge-label">Audience type</span><select value={account.audienceType} onChange={(event) => update({ audienceType: event.target.value as AudienceType })} className="bridge-input mt-2">{AUDIENCE_TYPES.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></label> : null}
                <label><span className="bridge-label">{account.audienceType[0].toUpperCase() + account.audienceType.slice(1)} *</span><input required min="1" step="1" type="number" value={account.audienceCount} onChange={(event) => update({ audienceCount: event.target.value })} className="bridge-input mt-2" /></label>
                <label><span className="bridge-label">{account.platform === "instagram" ? "Average Reel views" : account.platform === "kick" || account.platform === "twitch" ? "Average concurrent viewers" : "Average views (optional)"}</span><input min="0" step="1" type="number" value={account.averageViews} onChange={(event) => update({ averageViews: event.target.value })} className="bridge-input mt-2" /></label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm"><input type="radio" name="primaryPlatform" checked={account.isPrimary} onChange={() => setPlatformAccounts((current) => current.map((item) => ({ ...item, isPrimary: item.id === account.id })))} /> Primary account</label>{platformAccounts.length > 1 ? <button type="button" onClick={() => setPlatformAccounts((current) => { const remaining = current.filter((item) => item.id !== account.id); if (account.isPrimary && remaining[0]) remaining[0] = { ...remaining[0], isPrimary: true }; return remaining; })} className="bridge-button-secondary"><Trash2 size={16} /> Remove</button> : null}</div>
            </fieldset>;
          })}
        </div>
        <button type="button" onClick={() => setPlatformAccounts((current) => [...current, emptyPlatformAccount(createBrowserDraftId())])} className="bridge-button-secondary mt-4"><Plus size={16} /> Add another platform account</button>
      </section>

      <section className="bridge-card p-5">
        <h2 className="font-display text-xl font-bold">Rates and proof</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label><span className="bridge-label">Pricing choice *</span><select value={form.pricingChoice} onChange={(event) => { const choice = event.target.value as FormState["pricingChoice"]; setField("pricingChoice", choice); if (choice === "contact_for_pricing") setField("sponsorshipRate", ""); }} className="bridge-input mt-2"><option value="starting_price">Publish a starting price</option><option value="contact_for_pricing">Contact for pricing</option></select></label>
          {form.pricingChoice === "starting_price" ? <label><span className="bridge-label">Starting sponsorship price in INR *</span><input required min="1" step="1" type="number" value={form.sponsorshipRate} onChange={(event) => setField("sponsorshipRate", event.target.value)} className="bridge-input mt-2" inputMode="numeric" /></label> : null}
          <label>
            <span className="bridge-label">Rate type</span>
            <select value={form.rateType} onChange={(event) => setField("rateType", event.target.value as FormState["rateType"])} className="bridge-input mt-2">
              {RATE_TYPES.map((rate) => (
                <option key={rate.value} value={rate.value}>
                  {rate.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="bridge-label">Past brands</span>
            <textarea value={form.pastBrandsText} onChange={(event) => setField("pastBrandsText", event.target.value)} className="bridge-input mt-2 min-h-24" placeholder="OnePlus, Boat, Groww" />
          </label>
          <label>
            <span className="bridge-label">Sample work URLs</span>
            <textarea value={form.sampleWorkText} onChange={(event) => setField("sampleWorkText", event.target.value)} className="bridge-input mt-2 min-h-24" placeholder="One URL per line" />
          </label>
        </div>
        <label className="mt-5 flex min-w-0 flex-col gap-3 rounded-[8px] border border-[var(--border)] bg-[#0d0d14] px-4 py-3 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center">
          <span className="min-w-0 flex-1">
            <span className="bridge-label block">Collaboration availability</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">
              Controls whether brands can start collaboration requests from your public profile.
            </span>
          </span>
          <select
            value={form.availabilityStatus}
            onChange={(event) => setField("availabilityStatus", event.target.value as FormState["availabilityStatus"])}
            className="bridge-input w-full sm:w-64"
          >
            <option value="open_to_deals">Open to deals</option>
            <option value="limited_availability">Limited availability</option>
            <option value="unavailable">Unavailable</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </section>

      </fieldset>

      <button
        type="submit"
        disabled={isSaving}
        className="bridge-button-primary w-full py-4"
      >
        {isSaving ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
        {isSaving ? "Saving Profile" : submitLabel}
      </button>
    </form>
  );
}
