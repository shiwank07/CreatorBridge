import { type BrandInquiryData } from "@/lib/types";

type ResponseActor = "creator" | "brand";

function parseDate(input?: string | null) {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function positiveDuration(start?: string | null, end?: string | null) {
  const startedAt = parseDate(start);
  const endedAt = parseDate(end);
  if (!startedAt || !endedAt) return null;

  const duration = endedAt.getTime() - startedAt.getTime();
  return duration > 0 ? duration : null;
}

function formatDuration(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;

  const days = Math.round(hours / 24);
  return `${days}d`;
}

function creatorResponseDuration(collaboration: BrandInquiryData) {
  return positiveDuration(collaboration.createdAt, collaboration.creatorResponseAt);
}

function brandResponseDuration(collaboration: BrandInquiryData) {
  const history = collaboration.statusHistory
    .filter((entry) => entry.createdAt)
    .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
  const creatorSignal = history.find((entry) => entry.actor === "creator" && entry.event !== "VIEWED");
  if (!creatorSignal?.createdAt) return null;

  const brandSignal = history.find((entry) => {
    if (entry.actor !== "brand" || !entry.createdAt || !creatorSignal.createdAt) return false;
    return new Date(entry.createdAt).getTime() > new Date(creatorSignal.createdAt).getTime();
  });

  return positiveDuration(creatorSignal.createdAt, brandSignal?.createdAt);
}

export function averageResponseTimeLabel(collaborations: BrandInquiryData[], actor: ResponseActor) {
  const durations = collaborations
    .map((collaboration) => (actor === "creator" ? creatorResponseDuration(collaboration) : brandResponseDuration(collaboration)))
    .filter((duration): duration is number => typeof duration === "number" && duration > 0);

  if (!durations.length) return "No data";

  const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  return `${formatDuration(average)} avg`;
}

export function countDisputes(collaborations: BrandInquiryData[]) {
  return collaborations.filter((collaboration) => Boolean(collaboration.deliveryProof?.issueReportedAt)).length;
}
