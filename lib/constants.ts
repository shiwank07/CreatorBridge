export const APP_NAME = "Branzzo";
export const APP_INITIALS = "BZ";

const contactEmailDomain = process.env.NEXT_PUBLIC_CONTACT_EMAIL_DOMAIN?.trim() || "branzzo.com";

export const CONTACT_EMAILS = {
  support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || `support@${contactEmailDomain}`,
  partnerships: process.env.NEXT_PUBLIC_PARTNERSHIPS_EMAIL?.trim() || `partnerships@${contactEmailDomain}`,
  legal: process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim() || `legal@${contactEmailDomain}`,
} as const;

export const LEGAL_LAST_UPDATED = "July 6, 2026";

export const NICHES = [
  "Gaming",
  "Tech",
  "Finance",
  "Fashion",
  "Food",
  "Travel",
  "Fitness",
  "Education",
  "Comedy",
  "Beauty",
  "Lifestyle",
  "Cars",
] as const;

export const PLATFORMS = [
  { label: "YouTube", value: "youtube" },
  { label: "Instagram", value: "instagram" },
  { label: "Podcast", value: "podcast" },
] as const;

export const BUDGET_RANGES = [
  "Under Rs. 10,000",
  "Rs. 10,000 - Rs. 50,000",
  "Rs. 50,000 - Rs. 1,00,000",
  "Rs. 1,00,000+",
] as const;

export const RATE_TYPES = [
  { label: "Per video", value: "per_video" },
  { label: "Per post", value: "per_post" },
  { label: "Per campaign", value: "per_campaign" },
] as const;

export const DEMO_AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=320&q=80",
] as const;
