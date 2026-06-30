export const COLLABORATION_STATUSES = [
  "new",
  "viewed",
  "interested",
  "work_started",
  "proof_submitted",
  "changes_requested",
  "approved",
  "completed",
  "closed",
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

export const COLLABORATION_TIMELINE_STEPS: {
  statuses: CollaborationStatus[];
  label: string;
  description: string;
}[] = [
  {
    statuses: ["new", "viewed"],
    label: "Created",
    description: "Request created",
  },
  {
    statuses: ["interested"],
    label: "Accepted",
    description: "Collaboration accepted",
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
    statuses: ["completed", "closed"],
    label: "Completed",
    description: "Collaboration wrapped",
  },
];

export function normalizeCollaborationStatus(status?: string): CollaborationStatus {
  if (status === "reviewed" || status === "contacted" || status === "sent_to_creator") return "viewed";
  if (status === "creator_interested" || status === "contact_shared") return "interested";
  if (status === "creator_declined" || status === "rejected") return "closed";

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
