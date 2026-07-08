export const CREATOR_AVAILABILITY_STATUSES = [
  "open_to_deals",
  "limited_availability",
  "unavailable",
  "closed",
] as const;

export type CreatorAvailabilityStatus = (typeof CREATOR_AVAILABILITY_STATUSES)[number];

export function normalizeCreatorAvailability(
  status?: string | null,
  isOpenToDeals = true,
): CreatorAvailabilityStatus {
  if (status && CREATOR_AVAILABILITY_STATUSES.includes(status as CreatorAvailabilityStatus)) {
    return status as CreatorAvailabilityStatus;
  }

  return isOpenToDeals ? "open_to_deals" : "unavailable";
}

export function creatorAvailabilityLabel(status?: string | null, isOpenToDeals = true) {
  const normalized = normalizeCreatorAvailability(status, isOpenToDeals);

  if (normalized === "limited_availability") return "Limited availability";
  if (normalized === "unavailable" || normalized === "closed") return "Not accepting collaborations";
  return "Open to deals";
}

export function creatorAvailabilityTone(status?: string | null, isOpenToDeals = true) {
  const normalized = normalizeCreatorAvailability(status, isOpenToDeals);

  if (normalized === "open_to_deals") return "green" as const;
  if (normalized === "limited_availability") return "yellow" as const;
  return "neutral" as const;
}

export function canStartCreatorCollaboration(status?: string | null, isOpenToDeals = true) {
  const normalized = normalizeCreatorAvailability(status, isOpenToDeals);

  return normalized === "open_to_deals" || normalized === "limited_availability";
}

export function creatorAvailabilityNotice(status?: string | null, isOpenToDeals = true) {
  const normalized = normalizeCreatorAvailability(status, isOpenToDeals);

  if (normalized === "limited_availability") {
    return "This creator has limited availability. Response may be slower.";
  }

  if (normalized === "unavailable" || normalized === "closed") {
    return "This creator is not accepting collaborations right now.";
  }

  return "";
}
