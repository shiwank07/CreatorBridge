export const COLLABORATION_STATUSES = [
  "NEW",
  "PENDING_CREATOR_RESPONSE",
  "NEGOTIATING",
  "ACCEPTED",
  "DECLINED",
  "IN_PROGRESS",
  "PROOF_SUBMITTED",
  "REVISION_REQUESTED",
  "APPROVED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const LEGACY_INQUIRY_STATUSES = [
  "offer_sent",
  "counter_requested",
  "counter_sent",
  "offer_accepted",
  "offer_declined",
  "work_started",
  "proof_submitted",
  "changes_requested",
  "approved",
  "completed",
  "closed",
  "new",
  "viewed",
  "interested",
  "reviewed",
  "contacted",
  "sent_to_creator",
  "creator_interested",
  "creator_declined",
  "rejected",
  "contact_shared",
] as const;

export const BRAND_INQUIRY_STATUS_VALUES = [...COLLABORATION_STATUSES, ...LEGACY_INQUIRY_STATUSES] as const;

export type CollaborationStatus = (typeof COLLABORATION_STATUSES)[number];
export type LegacyInquiryStatus = (typeof LEGACY_INQUIRY_STATUSES)[number];
export type BrandInquiryStatus = CollaborationStatus | LegacyInquiryStatus;

export const COLLABORATION_STATUS_LABELS: Record<CollaborationStatus, string> = {
  NEW: "New",
  PENDING_CREATOR_RESPONSE: "Pending Creator Response",
  NEGOTIATING: "Negotiating",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  IN_PROGRESS: "In Progress",
  PROOF_SUBMITTED: "Proof Submitted",
  REVISION_REQUESTED: "Revision Requested",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ACTIVE_HISTORY_STATUSES: CollaborationStatus[] = [
  "NEW",
  "PENDING_CREATOR_RESPONSE",
  "NEGOTIATING",
  "ACCEPTED",
  "IN_PROGRESS",
  "PROOF_SUBMITTED",
  "REVISION_REQUESTED",
  "APPROVED",
];

const COMPLETED_HISTORY_STATUSES: CollaborationStatus[] = ["COMPLETED"];
const DECLINED_HISTORY_STATUSES: CollaborationStatus[] = ["DECLINED", "CANCELLED"];

export type CollaborationHistoryBucket = "active" | "completed" | "declined";
export type CollaborationTimelineEvent =
  | "CREATED"
  | "VIEWED"
  | "COUNTERED"
  | "ACCEPTED"
  | "DECLINED"
  | "IN_PROGRESS"
  | "PROOF_SUBMITTED"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED";

export const COLLABORATION_TIMELINE_EVENT_LABELS: Record<CollaborationTimelineEvent, string> = {
  CREATED: "Created",
  VIEWED: "Viewed",
  COUNTERED: "Counter Offer",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  IN_PROGRESS: "In Progress",
  PROOF_SUBMITTED: "Proof Submitted",
  REVISION_REQUESTED: "Revision Requested",
  APPROVED: "Approved",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const COLLABORATION_TIMELINE_STEPS: {
  statuses: CollaborationStatus[];
  label: string;
  description: string;
}[] = [
  {
    statuses: ["NEW"],
    label: "New",
    description: "Collaboration was created",
  },
  {
    statuses: ["PENDING_CREATOR_RESPONSE"],
    label: "Pending Response",
    description: "Creator needs to accept or decline",
  },
  {
    statuses: ["NEGOTIATING"],
    label: "Negotiating",
    description: "A counter offer is waiting for a response",
  },
  {
    statuses: ["ACCEPTED"],
    label: "Accepted",
    description: "Creator accepted and contact email unlocked",
  },
  {
    statuses: ["IN_PROGRESS"],
    label: "In Progress",
    description: "Creator is working",
  },
  {
    statuses: ["PROOF_SUBMITTED"],
    label: "Proof Submitted",
    description: "Delivery proof is in review",
  },
  {
    statuses: ["REVISION_REQUESTED"],
    label: "Revision",
    description: "Brand requested proof changes",
  },
  {
    statuses: ["APPROVED"],
    label: "Approved",
    description: "Brand approved delivery",
  },
  {
    statuses: ["COMPLETED"],
    label: "Completed",
    description: "Collaboration moved to history",
  },
  {
    statuses: ["DECLINED", "CANCELLED"],
    label: "Ended",
    description: "Collaboration did not move forward",
  },
];

export function normalizeCollaborationStatus(status?: string): CollaborationStatus {
  const normalized = status?.trim().toUpperCase();

  if (COLLABORATION_STATUSES.includes(normalized as CollaborationStatus)) {
    return normalized as CollaborationStatus;
  }

  if (status === "new") return "NEW";
  if (status === "offer_sent" || status === "viewed" || status === "reviewed" || status === "contacted" || status === "sent_to_creator") {
    return "PENDING_CREATOR_RESPONSE";
  }
  if (status === "counter_sent" || status === "counter_requested") return "NEGOTIATING";
  if (status === "offer_accepted" || status === "interested" || status === "creator_interested" || status === "contact_shared") return "ACCEPTED";
  if (status === "work_started") return "IN_PROGRESS";
  if (status === "proof_submitted") return "PROOF_SUBMITTED";
  if (status === "changes_requested") return "REVISION_REQUESTED";
  if (status === "approved") return "APPROVED";
  if (status === "completed" || status === "closed") return "COMPLETED";
  if (status === "offer_declined" || status === "creator_declined" || status === "rejected") return "DECLINED";

  return "NEW";
}

export function canRevealCollaborationContactEmail(status?: string) {
  const normalized = normalizeCollaborationStatus(status);

  return ["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED"].includes(normalized);
}

export function collaborationStatusLabel(status?: string) {
  return COLLABORATION_STATUS_LABELS[normalizeCollaborationStatus(status)];
}

export function collaborationStatusIndex(status?: string) {
  const normalized = normalizeCollaborationStatus(status);
  return COLLABORATION_TIMELINE_STEPS.findIndex((step) => step.statuses.includes(normalized));
}

export function collaborationHistoryBucket(status?: string): CollaborationHistoryBucket {
  const normalized = normalizeCollaborationStatus(status);

  if (COMPLETED_HISTORY_STATUSES.includes(normalized)) return "completed";
  if (DECLINED_HISTORY_STATUSES.includes(normalized)) return "declined";
  if (ACTIVE_HISTORY_STATUSES.includes(normalized)) return "active";

  return "active";
}

export function collaborationTimelineEventLabel(event?: string) {
  const normalized = event?.trim().toUpperCase() as CollaborationTimelineEvent | undefined;
  return normalized && normalized in COLLABORATION_TIMELINE_EVENT_LABELS
    ? COLLABORATION_TIMELINE_EVENT_LABELS[normalized]
    : "Status Updated";
}

export function appendCollaborationTimeline(
  collaboration: {
    firstViewedAt?: Date | null;
    firstCreatorResponseAt?: Date | null;
    acceptedAt?: Date | null;
    rejectedAt?: Date | null;
    cancelledAt?: Date | null;
    workStartedAt?: Date | null;
    proofSubmittedAt?: Date | null;
    completedAt?: Date | null;
    lastMeaningfulActivityAt?: Date | null;
    statusHistory?: {
      event?: string;
      status?: string;
      actor?: string;
      note?: string;
      createdAt?: Date | null;
    }[];
  },
  input: {
    event: CollaborationTimelineEvent;
    status?: string;
    actor?: "brand" | "creator" | "admin" | "system";
    note?: string;
    createdAt?: Date;
  },
) {
  const occurredAt = input.createdAt ?? new Date();
  collaboration.statusHistory = collaboration.statusHistory ?? [];
  collaboration.statusHistory.push({
    event: input.event,
    status: normalizeCollaborationStatus(input.status),
    actor: input.actor ?? "system",
    note: input.note ?? "",
    createdAt: occurredAt,
  });

  // Lifecycle timestamps are immutable facts. Later status changes must not erase
  // an earlier acceptance, rejection, response, or completion event.
  const firstFieldByEvent: Partial<Record<CollaborationTimelineEvent, keyof typeof collaboration>> = {
    VIEWED: "firstViewedAt",
    ACCEPTED: "acceptedAt",
    DECLINED: "rejectedAt",
    CANCELLED: "cancelledAt",
    IN_PROGRESS: "workStartedAt",
    PROOF_SUBMITTED: "proofSubmittedAt",
    COMPLETED: "completedAt",
  };
  const eventField = firstFieldByEvent[input.event];
  if (eventField && !collaboration[eventField]) {
    (collaboration[eventField] as Date | null | undefined) = occurredAt;
  }
  if (input.actor === "creator" && ["COUNTERED", "ACCEPTED", "DECLINED"].includes(input.event) && !collaboration.firstCreatorResponseAt) {
    collaboration.firstCreatorResponseAt = occurredAt;
  }
  collaboration.lastMeaningfulActivityAt = occurredAt;
}

export function hasCollaborationTimelineEvent(
  collaboration: {
    statusHistory?: {
      event?: string;
      actor?: string;
    }[];
  },
  event: CollaborationTimelineEvent,
  actor?: string,
) {
  return Boolean(
    collaboration.statusHistory?.some((entry) => entry.event === event && (!actor || entry.actor === actor)),
  );
}
