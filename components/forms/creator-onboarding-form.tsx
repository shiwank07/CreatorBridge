"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, UserPlus } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { NICHES, PLATFORMS, RATE_TYPES } from "@/lib/constants";
import { splitList } from "@/lib/slug";

type CreatorOnboardingFormProps = {
  initialName: string;
  initialUsername: string;
  initialAvatar?: string;
};

type FormState = {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  niche: string[];
  country: string;
  languagesText: string;
  youtubeUrl: string;
  youtubeHandle: string;
  subscribers: string;
  avgViews: string;
  instagramUrl: string;
  instagramFollowers: string;
  podcastUrl: string;
  sponsorshipRate: string;
  rateType: "per_video" | "per_post" | "per_campaign";
  pastBrandsText: string;
  sampleWorkText: string;
  isOpenToDeals: boolean;
};

export function CreatorOnboardingForm({ initialName, initialUsername, initialAvatar = "" }: CreatorOnboardingFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    name: initialName,
    username: initialUsername,
    avatar: initialAvatar,
    bio: "",
    niche: [],
    country: "India",
    languagesText: "English, Hindi",
    youtubeUrl: "",
    youtubeHandle: "",
    subscribers: "",
    avgViews: "",
    instagramUrl: "",
    instagramFollowers: "",
    podcastUrl: "",
    sponsorshipRate: "",
    rateType: "per_video",
    pastBrandsText: "",
    sampleWorkText: "",
    isOpenToDeals: true,
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
    setIsSaving(true);

    const payload = {
      name: form.name,
      username: form.username,
      avatar: form.avatar,
      bio: form.bio,
      niche: form.niche,
      country: form.country,
      languages: splitList(form.languagesText),
      youtubeUrl: form.youtubeUrl,
      youtubeHandle: form.youtubeHandle,
      subscribers: Number(form.subscribers || 0),
      avgViews: Number(form.avgViews || 0),
      instagramUrl: form.instagramUrl,
      instagramFollowers: Number(form.instagramFollowers || 0),
      podcastUrl: form.podcastUrl,
      sponsorshipRate: Number(form.sponsorshipRate || 0),
      rateType: form.rateType,
      pastBrands: splitList(form.pastBrandsText),
      sampleWorkUrls: splitList(form.sampleWorkText),
      isOpenToDeals: form.isOpenToDeals,
    };

    try {
      const response = await fetch("/api/onboarding/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not save your creator profile.");
        return;
      }

      router.replace("/dashboard/creator");
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
          <label className="lg:col-span-2">
            <span className="bridge-label">Profile photo image URL</span>
            {/* TODO: Replace URL-only profile photos with Cloudflare R2 or UploadThing uploads. Do not store image files in MongoDB. */}
            <input value={form.avatar} onChange={(event) => setField("avatar", event.target.value)} className="bridge-input mt-2" placeholder="https://example.com/photo.jpg" />
            <span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">
              Paste a public image URL for now. Direct uploads are planned for a later release.
            </span>
          </label>
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
        <label className="mt-5 flex items-center gap-3 rounded-[8px] border border-[var(--border)] bg-[#0d0d14] px-4 py-3 text-sm text-[var(--text-secondary)]">
          <input type="checkbox" checked={form.isOpenToDeals} onChange={(event) => setField("isOpenToDeals", event.target.checked)} className="h-4 w-4 accent-violet-600" />
          Show me as open to brand deals
        </label>
      </section>
      </fieldset>

      <button
        type="submit"
        disabled={isSaving}
        className="bridge-button-primary w-full py-4"
      >
        {isSaving ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
        {isSaving ? "Saving Profile" : "Publish Creator Profile"}
      </button>
    </form>
  );
}
