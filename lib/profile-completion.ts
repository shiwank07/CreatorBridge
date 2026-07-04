import { type BrandInquiryData, type BrandProfileData, type CreatorCardData } from "@/lib/types";

export type ProfileCompletionItem = {
  key: string;
  label: string;
  done: boolean;
  helper: string;
  weight: number;
};

export type ProfileCompletionResult = {
  percent: number;
  completedCount: number;
  totalCount: number;
  completedItems: ProfileCompletionItem[];
  remainingItems: ProfileCompletionItem[];
  items: ProfileCompletionItem[];
};

type CreatorCompletionInput = {
  creator: CreatorCardData | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

type BrandCompletionInput = {
  brand: BrandProfileData | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  collaborations?: BrandInquiryData[];
};

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function hasPositiveNumber(value?: number | null) {
  return typeof value === "number" && value > 0;
}

function summarize(items: ProfileCompletionItem[]): ProfileCompletionResult {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
  const completedItems = items.filter((item) => item.done);
  const remainingItems = items.filter((item) => !item.done);

  return {
    percent: totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0,
    completedCount: completedItems.length,
    totalCount: items.length,
    completedItems,
    remainingItems,
    items,
  };
}

export function calculateCreatorProfileCompletion({
  creator,
  emailVerified = false,
  phoneVerified = false,
}: CreatorCompletionInput): ProfileCompletionResult {
  const items: ProfileCompletionItem[] = [
    {
      key: "email",
      label: "Email verified",
      done: emailVerified,
      helper: "Confirm the account email used for creator notifications.",
      weight: 10,
    },
    {
      key: "phone",
      label: "Phone verified",
      done: Boolean(phoneVerified || creator?.phoneVerified),
      helper: "Verify a private phone number for trust and urgent support.",
      weight: 10,
    },
    {
      key: "photo",
      label: "Profile photo",
      done: hasText(creator?.avatar),
      helper: "Add a clear creator photo or channel image.",
      weight: 10,
    },
    {
      key: "bio",
      label: "Bio",
      done: hasText(creator?.bio),
      helper: "Explain your audience, style, and creator strengths.",
      weight: 12,
    },
    {
      key: "categories",
      label: "Categories",
      done: Boolean(creator?.niche.length),
      helper: "Choose the niches brands should discover you under.",
      weight: 10,
    },
    {
      key: "location",
      label: "Location",
      done: hasText(creator?.country),
      helper: "Add your primary country or market.",
      weight: 8,
    },
    {
      key: "pricing",
      label: "Pricing",
      done: hasPositiveNumber(creator?.sponsorshipRate),
      helper: "Set a base sponsorship rate so brands can budget correctly.",
      weight: 10,
    },
    {
      key: "social",
      label: "Social links",
      done: Boolean(creator?.youtubeUrl || creator?.instagramUrl || creator?.podcastUrl),
      helper: "Link at least one public creator channel.",
      weight: 10,
    },
    {
      key: "availability",
      label: "Availability",
      done: Boolean(creator),
      helper: "Keep your open-to-deals status current.",
      weight: 8,
    },
    {
      key: "portfolio",
      label: "Portfolio links",
      done: Boolean(creator?.sampleWorkUrls.length),
      helper: "Add sample work so brands can evaluate fit quickly.",
      weight: 12,
    },
  ];

  return summarize(items);
}

export function calculateBrandProfileCompletion({
  brand,
  emailVerified = false,
  phoneVerified = false,
  collaborations = [],
}: BrandCompletionInput): ProfileCompletionResult {
  const hasBudgetContext = collaborations.some((collaboration) =>
    hasPositiveNumber(collaboration.currentOfferAmount ?? collaboration.initialOfferAmount),
  );
  const items: ProfileCompletionItem[] = [
    {
      key: "email",
      label: "Email verified",
      done: Boolean(emailVerified || brand?.contactEmail),
      helper: "Use a reachable work email for brand contact and support.",
      weight: 10,
    },
    {
      key: "phone",
      label: "Phone verified",
      done: Boolean(phoneVerified || brand?.phoneVerified),
      helper: "Verify a private phone number for trust and urgent support.",
      weight: 10,
    },
    {
      key: "photo",
      label: "Profile photo",
      done: hasText(brand?.avatar),
      helper: "Use the account image or brand mark to make the workspace recognizable.",
      weight: 8,
    },
    {
      key: "bio",
      label: "Bio",
      done: hasText(brand?.notes) || hasText(brand?.companyRegistrationText),
      helper: "Add context about your company, campaign interests, or registration details.",
      weight: 10,
    },
    {
      key: "categories",
      label: "Categories",
      done: hasText(brand?.industry),
      helper: "Add the industry creators should associate with your brand.",
      weight: 10,
    },
    {
      key: "location",
      label: "Location",
      done: hasText(brand?.country),
      helper: "Add your primary country or market.",
      weight: 8,
    },
    {
      key: "pricing",
      label: "Pricing",
      done: hasBudgetContext,
      helper: "Send at least one collaboration with a clear offer amount.",
      weight: 10,
    },
    {
      key: "social",
      label: "Social links",
      done: hasText(brand?.website),
      helper: "Link the official brand website.",
      weight: 10,
    },
    {
      key: "availability",
      label: "Availability",
      done: Boolean(brand),
      helper: "Complete onboarding so creators know the brand workspace is active.",
      weight: 8,
    },
    {
      key: "portfolio",
      label: "Portfolio links",
      done: hasText(brand?.companyRegistrationText) || hasText(brand?.website),
      helper: "Add registration or website context to support brand trust review.",
      weight: 16,
    },
  ];

  return summarize(items);
}
