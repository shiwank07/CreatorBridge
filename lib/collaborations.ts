export const COLLABORATION_STATUSES = [
  "offer_sent",
  "counter_requested",
  "counter_sent",
  "offer_accepted",
  "work_started",
  "proof_submitted",
  "changes_requested",
  "approved",
  "completed",
  "offer_declined",
  "closed",
  "new",
  "viewed",
  "interested",
] as const;

export const LEGACY_INQUIRY_STATUSES = [
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
  offer_sent: "Offer Sent",
  counter_requested: "Counter Requested",
  counter_sent: "Revised Offer Sent",
  offer_accepted: "Offer Accepted",
  offer_declined: "Offer Declined",
  new: "New",
  viewed: "Viewed",
  interested: "Interested",
  work_started: "Work Started",
  proof_submitted: "Proof Submitted",
  changes_requested: "Changes Requested",
  approved: "Approved",
  completed: "Completed",
  closed: "Closed",
};

const ACTIVE_HISTORY_STATUSES: CollaborationStatus[] = [
  "offer_sent",
  "counter_requested",
  "counter_sent",
  "offer_accepted",
  "work_started",
  "proof_submitted",
  "changes_requested",
  "approved",
  "new",
  "viewed",
  "interested",
];

const COMPLETED_HISTORY_STATUSES: CollaborationStatus[] = ["completed", "closed"];
const DECLINED_HISTORY_STATUSES: CollaborationStatus[] = ["offer_declined"];

export type CollaborationHistoryBucket = "active" | "completed" | "declined";

export const COLLABORATION_TIMELINE_STEPS: {
  statuses: CollaborationStatus[];
  label: string;
  description: string;
}[] = [
  {
    statuses: ["offer_sent", "new", "viewed"],
    label: "Offer Sent",
    description: "Brand sent an exact INR offer",
  },
  {
    statuses: ["counter_requested", "counter_sent"],
    label: "Negotiation",
    description: "Offer revision in progress",
  },
  {
    statuses: ["offer_accepted", "interested"],
    label: "Accepted",
    description: "Offer accepted",
  },
  {
    statuses: ["work_started"],
    label: "Work Started",
    description: "Creator is working",
  },
  {
    statuses: ["proof_submitted"],
    label: "Proof Submitted",
    description: "Delivery proof is in review",
  },
  {
    statuses: ["changes_requested", "approved"],
    label: "Brand Reviewed",
    description: "Brand reviewed proof",
  },
  {
    statuses: ["completed", "closed", "offer_declined"],
    label: "Closed",
    description: "Collaboration wrapped",
  },
];

export function normalizeCollaborationStatus(status?: string): CollaborationStatus {
  if (status === "reviewed" || status === "contacted" || status === "sent_to_creator") return "viewed";
  if (status === "creator_interested" || status === "contact_shared") return "offer_accepted";
  if (status === "creator_declined" || status === "rejected") return "offer_declined";

  if (COLLABORATION_STATUSES.includes(status as CollaborationStatus)) {
    return status as CollaborationStatus;
  }

  return "new";
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
