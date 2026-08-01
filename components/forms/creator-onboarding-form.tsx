"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, UserPlus } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { ProfileImageUpload } from "@/components/shared/profile-image-upload";
import { submitOnboardingWithBusyRetry } from "@/lib/onboarding-request";
import { NICHES, PLATFORMS, RATE_TYPES } from "@/lib/constants";
import { splitList } from "@/lib/slug";

type CreatorOnboardingFormProps = {
  initialName: string;
  initialUsername: string;
  initialAvatar?: string;
  initialValues?: {
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  const selectedPlatforms = useMemo(
    () =>
      PLATFORMS.filter((platform) => {
        if (platform.value === "youtube") return Boolean(form.youtubeUrl || form.subscribers);
        if (platform.value === "instagram") return Boolean(form.instagramUrl || form.instagramFollowers);
        if (platform.value === "podcast") return Boolean(form.podcastUrl);
        return false;
      }),
    [form.instagramFollowers, form.instagramUrl, form.podcastUrl, form.subscribers, form.youtubeUrl],
  );

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
      youtubeUrl: form.youtubeUrl,
      youtubeHandle: form.youtubeHandle,
      subscribers: Number(form.subscribers || 0),
      avgViews: Number(form.avgViews || 0),
      engagementRate: Number(form.engagementRate || 0),
      instagramUrl: form.instagramUrl,
      instagramFollowers: Number(form.instagramFollowers || 0),
      podcastUrl: form.podcastUrl,
      sponsorshipRate: Number(form.sponsorshipRate || 0),
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
        return;
      }

      setSuccess(successMessage);
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
        <h2 className="font-display text-xl font-bold">Profile basics</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="bridge-label">Creator name</span>
            <input value={form.name} onChange={(event) => setField("name", event.target.value)} className="bridge-input mt-2" required />
          </label>
          <label>
            <span className="bridge-label">Username</span>
            <input
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
            <input value={form.country} onChange={(event) => setField("country", event.target.value)} className="bridge-input mt-2" required />
          </label>
          <label>
            <span className="bridge-label">Languages</span>
            <input value={form.languagesText} onChange={(event) => setField("languagesText", event.target.value)} className="bridge-input mt-2" />
          </label>
        </div>
      </section>

      <section className="bridge-card p-5">
        <h2 className="font-display text-xl font-bold">Platform stats</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="bridge-label">YouTube URL</span>
            <input value={form.youtubeUrl} onChange={(event) => setField("youtubeUrl", event.target.value)} className="bridge-input mt-2" placeholder="https://youtube.com/..." />
          </label>
          <label>
            <span className="bridge-label">YouTube handle</span>
            <input value={form.youtubeHandle} onChange={(event) => setField("youtubeHandle", event.target.value)} className="bridge-input mt-2" placeholder="@creator" />
          </label>
          <label>
            <span className="bridge-label">Subscribers</span>
            <input value={form.subscribers} onChange={(event) => setField("subscribers", event.target.value)} className="bridge-input mt-2" inputMode="numeric" />
          </label>
          <label>
            <span className="bridge-label">Average views</span>
            <input value={form.avgViews} onChange={(event) => setField("avgViews", event.target.value)} className="bridge-input mt-2" inputMode="numeric" />
          </label>
          <label>
            <span className="bridge-label">Engagement rate (%)</span>
            <input value={form.engagementRate} onChange={(event) => setField("engagementRate", event.target.value)} className="bridge-input mt-2" inputMode="decimal" placeholder="4.8" />
          </label>
          <label>
            <span className="bridge-label">Instagram URL</span>
            <input value={form.instagramUrl} onChange={(event) => setField("instagramUrl", event.target.value)} className="bridge-input mt-2" placeholder="https://instagram.com/..." />
          </label>
          <label>
            <span className="bridge-label">Instagram followers</span>
            <input value={form.instagramFollowers} onChange={(event) => setField("instagramFollowers", event.target.value)} className="bridge-input mt-2" inputMode="numeric" />
          </label>
          <label className="lg:col-span-2">
            <span className="bridge-label">Podcast URL</span>
            <input value={form.podcastUrl} onChange={(event) => setField("podcastUrl", event.target.value)} className="bridge-input mt-2" placeholder="https://..." />
          </label>
        </div>
        {selectedPlatforms.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedPlatforms.map((platform) => (
              <Badge key={platform.value} tone="neutral">
                {platform.label}
              </Badge>
            ))}
          </div>
        ) : null}
      </section>

      <section className="bridge-card p-5">
        <h2 className="font-display text-xl font-bold">Rates and proof</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label>
            <span className="bridge-label">Base sponsorship rate in INR</span>
            <input value={form.sponsorshipRate} onChange={(event) => setField("sponsorshipRate", event.target.value)} className="bridge-input mt-2" inputMode="numeric" />
          </label>
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
