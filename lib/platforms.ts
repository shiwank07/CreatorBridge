import { PLATFORMS } from "@/lib/constants";

const EXTRA_PLATFORM_LABELS: Record<string, string> = {
  twitch: "Twitch",
  other: "Other",
};

export function platformDisplayName(platform?: string | null, customPlatformName?: string | null) {
  const normalized = platform?.trim().toLowerCase() ?? "";
  const customName = customPlatformName?.trim() ?? "";

  if (normalized === "other") return customName || "Other";

  return PLATFORMS.find((item) => item.value === normalized)?.label ?? EXTRA_PLATFORM_LABELS[normalized] ?? platform ?? "";
}

export function customPlatformValue(platforms: string[] = [], customPlatformName?: string | null) {
  return platforms.includes("other") ? customPlatformName?.trim() ?? "" : "";
}
