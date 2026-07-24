import { normalizeCollaborationStatus } from "@/lib/collaborations";

export const ANALYTICS_RANGES = ["7d", "30d", "90d", "year", "all"] as const;
export type AnalyticsRangeKey = (typeof ANALYTICS_RANGES)[number];

export type AnalyticsPeriod = {
  key: AnalyticsRangeKey;
  label: string;
  start: Date | null;
  end: Date;
  previousStart: Date | null;
  previousEnd: Date | null;
  timezone: "UTC";
};

export type MoneyTotal = { currency: string; amount: number; count?: number };
export type AnalyticsSeriesPoint = {
  label: string;
  series: Record<string, number>;
  currencySeries?: Record<string, number>;
};

export type AnalyticsCollaboration = {
  _id: unknown;
  status?: string;
  createdAt?: Date;
  deadline?: Date | null;
  currentOfferAmount?: number;
  initialOfferAmount?: number;
  currency?: string | null;
  firstViewedAt?: Date | null;
  firstCreatorResponseAt?: Date | null;
  acceptedAt?: Date | null;
  rejectedAt?: Date | null;
  cancelledAt?: Date | null;
  workStartedAt?: Date | null;
  proofSubmittedAt?: Date | null;
  completedAt?: Date | null;
  statusHistory?: Array<{ event?: string; createdAt?: Date | null }>;
};

const RANGE_LABELS: Record<AnalyticsRangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  year: "This year",
  all: "All time",
};

export function parseAnalyticsRange(value?: string | null, now = new Date()): AnalyticsPeriod {
  const key = ANALYTICS_RANGES.includes(value as AnalyticsRangeKey) ? (value as AnalyticsRangeKey) : "30d";
  const end = new Date(now);
  let start: Date | null = null;
  if (key.endsWith("d")) {
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() - Number(key.slice(0, -1)));
  } else if (key === "year") {
    start = new Date(Date.UTC(end.getUTCFullYear(), 0, 1));
  }
  const duration = start ? end.getTime() - start.getTime() : 0;
  return {
    key,
    label: RANGE_LABELS[key],
    start,
    end,
    previousStart: start ? new Date(start.getTime() - duration) : null,
    previousEnd: start ? new Date(start) : null,
    timezone: "UTC",
  };
}

export function safeRate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((numerator / denominator) * 1000) / 10));
}

export function metricChange(current: number, previous: number) {
  if (previous === 0) return { value: current === 0 ? 0 : current, mode: "absolute" as const, available: current !== 0 };
  return { value: Math.round(((current - previous) / previous) * 1000) / 10, mode: "percent" as const, available: true };
}

export type FunnelStage = { label: string; count: number; conversion: number };

export function buildCreatorFunnel(funnel: FunnelStage[]) {
  const stages = [funnel[0], funnel[2], funnel[3], funnel[5]].filter((stage): stage is FunnelStage => Boolean(stage));
  return stages.map((stage, index) => ({
    ...stage,
    conversion: index === 0 ? (stage.count ? 100 : 0) : safeRate(stage.count, stages[index - 1].count),
  }));
}

export function hasPeriodAnalyticsActivity(summary: { total: number; accepted: number; rejected: number; cancelled: number; completed: number }) {
  return summary.total + summary.accepted + summary.rejected + summary.cancelled + summary.completed > 0;
}

export function dateInPeriod(date: Date | null | undefined, start: Date | null, end: Date) {
  return Boolean(date && (!start || date >= start) && date < end);
}

export function analyticsBucket(date: Date, range: AnalyticsRangeKey) {
  if (range === "year" || range === "all") return date.toISOString().slice(0, 7);
  if (range === "90d") {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay());
    return copy.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

export function formatAnalyticsBucket(label: string) {
  if (/^\d{4}-\d{2}$/.test(label)) {
    return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${label}-01T00:00:00Z`));
  }
  return label;
}

function amount(doc: AnalyticsCollaboration) {
  return typeof doc.currentOfferAmount === "number" ? doc.currentOfferAmount : typeof doc.initialOfferAmount === "number" ? doc.initialOfferAmount : 0;
}

function moneyGroups(docs: AnalyticsCollaboration[]) {
  const groups = new Map<string, { amount: number; count: number }>();
  for (const doc of docs) {
    const currency = doc.currency?.trim().toUpperCase() || "UNKNOWN";
    const current = groups.get(currency) ?? { amount: 0, count: 0 };
    current.amount += amount(doc);
    current.count += 1;
    groups.set(currency, current);
  }
  return [...groups].map(([currency, value]) => ({ currency, amount: value.amount, count: value.count }));
}

/**
 * Deterministic reference implementation used by tests and migrations.
 * Period KPIs use immutable event timestamps; current status is used only for the
 * explicitly labelled snapshot. Missing event timestamps are not inferred here.
 */
export function summarizeCollaborations(
  docs: AnalyticsCollaboration[],
  range: AnalyticsRangeKey,
  start: Date | null = null,
  end: Date = new Date(8.64e15),
) {
  const created = docs.filter((doc) => dateInPeriod(doc.createdAt, start, end));
  const acceptedDocs = docs.filter((doc) => dateInPeriod(doc.acceptedAt, start, end));
  const rejectedDocs = docs.filter((doc) => dateInPeriod(doc.rejectedAt, start, end));
  const cancelledDocs = docs.filter((doc) => dateInPeriod(doc.cancelledAt, start, end));
  const completedDocs = docs.filter((doc) => dateInPeriod(doc.completedAt, start, end));
  const responses = docs
    .filter((doc) => dateInPeriod(doc.firstCreatorResponseAt, start, end) && doc.createdAt)
    .map((doc) => doc.firstCreatorResponseAt!.getTime() - doc.createdAt!.getTime())
    .filter((duration) => duration >= 0);

  // Legacy inference is conservative and cumulative: reaching a later milestone
  // proves all logically prior stages, even when old statusHistory is incomplete.
  const funnelRows = created.map((doc) => {
    const status = normalizeCollaborationStatus(doc.status);
    const completed = Boolean(doc.completedAt) || status === "COMPLETED";
    const proof = completed || Boolean(doc.proofSubmittedAt) || ["PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED"].includes(status);
    const accepted = proof || Boolean(doc.acceptedAt) || ["ACCEPTED", "IN_PROGRESS"].includes(status);
    // Cancellation, rejection, and negotiation alone do not prove that the
    // creator responded; only the immutable creator-response milestone or a
    // logically later accepted milestone does.
    const responded = accepted || Boolean(doc.firstCreatorResponseAt);
    const viewed = responded || Boolean(doc.firstViewedAt);
    return { viewed, responded, accepted, proof, completed };
  });
  const stageCounts = [
    created.length,
    funnelRows.filter((row) => row.viewed).length,
    funnelRows.filter((row) => row.responded).length,
    funnelRows.filter((row) => row.accepted).length,
    funnelRows.filter((row) => row.proof).length,
    funnelRows.filter((row) => row.completed).length,
  ];
  const labels = ["Sent", "Viewed", "Responded or negotiating", "Accepted", "Proof submitted", "Completed"];
  const trend = new Map<string, AnalyticsSeriesPoint>();
  const addTrend = (date: Date | null | undefined, series: string, value = 1, currency?: string | null) => {
    if (!dateInPeriod(date, start, end) || !date) return;
    const label = analyticsBucket(date, range);
    const point = trend.get(label) ?? { label, series: {} };
    if (currency) {
      point.currencySeries ??= {};
      const key = currency.trim().toUpperCase() || "UNKNOWN";
      point.currencySeries[key] = (point.currencySeries[key] ?? 0) + value;
    } else {
      point.series[series] = (point.series[series] ?? 0) + value;
    }
    trend.set(label, point);
  };
  docs.forEach((doc) => {
    addTrend(doc.createdAt, "Created");
    addTrend(doc.acceptedAt, "Accepted");
    addTrend(doc.rejectedAt, "Rejected");
    addTrend(doc.completedAt, "Completed");
    addTrend(doc.completedAt, "Completed value", amount(doc), doc.currency || "UNKNOWN");
  });
  const distribution = Object.entries(
    docs.reduce<Record<string, number>>((result, doc) => {
      const status = normalizeCollaborationStatus(doc.status);
      result[status] = (result[status] ?? 0) + 1;
      return result;
    }, {}),
  ).map(([label, value]) => ({ label, value }));
  const completedValueByCurrency = moneyGroups(completedDocs);
  const acceptedValueByCurrency = moneyGroups(acceptedDocs);
  return {
    total: created.length,
    accepted: acceptedDocs.length,
    rejected: rejectedDocs.length,
    cancelled: cancelledDocs.length,
    active: docs.filter((doc) => ["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED"].includes(normalizeCollaborationStatus(doc.status))).length,
    completed: completedDocs.length,
    acceptanceRate: safeRate(acceptedDocs.length, acceptedDocs.length + rejectedDocs.length),
    // Terminal success rate is stable by event period: completions divided by
    // completions plus cancellations recorded in the same period.
    completionRate: safeRate(completedDocs.length, completedDocs.length + cancelledDocs.length),
    averageResponseHours: responses.length ? Math.round((responses.reduce((sum, value) => sum + value, 0) / responses.length / 3_600_000) * 10) / 10 : 0,
    completedValueByCurrency,
    averageDealValueByCurrency: acceptedValueByCurrency.map((group) => ({ currency: group.currency, amount: group.count ? Math.round(group.amount / group.count) : 0 })),
    committedValueByCurrency: acceptedValueByCurrency,
    trend: [...trend.values()].sort((a, b) => a.label.localeCompare(b.label)),
    distribution,
    funnel: stageCounts.map((count, index) => ({ label: labels[index], count, conversion: index === 0 ? (count ? 100 : 0) : safeRate(count, stageCounts[index - 1]) })),
    legacyExcluded: docs.filter((doc) => !doc.acceptedAt && !doc.rejectedAt && !doc.cancelledAt && !doc.completedAt && (doc.statusHistory?.length ?? 0) > 0).length,
  };
}
