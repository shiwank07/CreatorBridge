type HistoryEntry = {
  event?: string;
  actor?: string;
  createdAt?: Date | null;
};

export const EVENT_TIMESTAMP_FIELDS = {
  ACCEPTED: "acceptedAt",
  DECLINED: "rejectedAt",
  CANCELLED: "cancelledAt",
  IN_PROGRESS: "workStartedAt",
  PROOF_SUBMITTED: "proofSubmittedAt",
  COMPLETED: "completedAt",
} as const;

type TimestampDocument = {
  firstCreatorViewedAt?: Date | null;
  firstCreatorResponseAt?: Date | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  cancelledAt?: Date | null;
  workStartedAt?: Date | null;
  proofSubmittedAt?: Date | null;
  completedAt?: Date | null;
  lastMeaningfulActivityAt?: Date | null;
  statusHistory?: HistoryEntry[];
};

/**
 * Backfill priority is explicit field, then earliest trustworthy status-history
 * event. No timestamp is inferred from updatedAt or current status.
 */
export function deriveLifecycleTimestampBackfill(document: TimestampDocument) {
  const set: Record<string, Date> = {};
  const history = (document.statusHistory ?? [])
    .filter((entry): entry is HistoryEntry & { createdAt: Date } => entry.createdAt instanceof Date)
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  for (const [event, field] of Object.entries(EVENT_TIMESTAMP_FIELDS)) {
    if (document[field as keyof TimestampDocument]) continue;
    const match = history.find((entry) => entry.event === event);
    if (match) set[field] = match.createdAt;
  }
  if (!document.firstCreatorViewedAt) {
    const creatorView = classifyCreatorViewBackfill(document);
    if (creatorView.status === "valid") set.firstCreatorViewedAt = creatorView.date;
  }
  if (!document.firstCreatorResponseAt) {
    const response = history.find((entry) => entry.actor === "creator" && ["COUNTERED", "ACCEPTED", "DECLINED"].includes(entry.event ?? ""));
    if (response) set.firstCreatorResponseAt = response.createdAt;
  }
  if (!document.lastMeaningfulActivityAt && history.length) {
    set.lastMeaningfulActivityAt = history[history.length - 1].createdAt;
  }
  return set;
}

export function classifyCreatorViewBackfill(document: TimestampDocument) {
  if (document.firstCreatorViewedAt) return { status: "already_populated" as const };
  const views = (document.statusHistory ?? []).filter((entry) => entry.event === "VIEWED");
  if (views.some((entry) => !entry.actor)) return { status: "missing_actor" as const };
  if (views.some((entry) => !["creator", "brand", "admin", "system"].includes(entry.actor ?? ""))) return { status: "ambiguous" as const };
  const valid = views
    .filter((entry): entry is HistoryEntry & { createdAt: Date } => entry.actor === "creator" && entry.createdAt instanceof Date)
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  if (valid.length) return { status: "valid" as const, date: valid[0].createdAt };
  return { status: "unresolved" as const };
}

export type OwnershipCandidates = {
  currentBrandUserId?: unknown;
  currentBrandProfileId?: unknown;
  currentCreatorUserId?: unknown;
  currentCreatorProfileId?: unknown;
  clerkBrand?: { userId: unknown; profileId?: unknown } | null;
  emailBrands?: Array<{ userId: unknown; profileId: unknown }>;
  usernameCreator?: { userId: unknown; profileId?: unknown } | null;
};

export function resolveOwnershipBackfill(candidates: OwnershipCandidates) {
  const set: Record<string, unknown> = {};
  let ambiguous = false;
  if (!candidates.currentBrandUserId) {
    if (candidates.clerkBrand) set.brandUserId = candidates.clerkBrand.userId;
    else if (candidates.emailBrands?.length === 1) set.brandUserId = candidates.emailBrands[0].userId;
    else if ((candidates.emailBrands?.length ?? 0) > 1) ambiguous = true;
  }
  if (!candidates.currentBrandProfileId) {
    if (candidates.clerkBrand?.profileId) set.brandProfileId = candidates.clerkBrand.profileId;
    else if (candidates.emailBrands?.length === 1) set.brandProfileId = candidates.emailBrands[0].profileId;
  }
  if (!candidates.currentCreatorUserId && candidates.usernameCreator) set.creatorUserId = candidates.usernameCreator.userId;
  if (!candidates.currentCreatorProfileId && candidates.usernameCreator?.profileId) set.creatorProfileId = candidates.usernameCreator.profileId;
  return { set, ambiguous };
}
