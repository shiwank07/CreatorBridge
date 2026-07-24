import mongoose, { type PipelineStage } from "mongoose";

import { getAdminState } from "@/lib/admin";
import type { BrandInquiryStatus } from "@/lib/collaborations";
import {
  metricChange,
  buildCreatorFunnel,
  parseAnalyticsRange,
  safeRate,
  type AnalyticsPeriod,
  type AnalyticsRangeKey,
  type AnalyticsSeriesPoint,
  type MoneyTotal,
} from "@/lib/analytics/core";
import { getCurrentAppUser } from "@/lib/current-user";
import { connectDB, hasMongoUri } from "@/lib/db";
import { BrandInquiry } from "@/lib/models/BrandInquiry";
import { BrandProfile } from "@/lib/models/BrandProfile";
import { CreatorProfile } from "@/lib/models/CreatorProfile";
import { CreatorVerificationRequest } from "@/lib/models/CreatorVerificationRequest";
import { InAppNotification } from "@/lib/models/InAppNotification";
import { Message } from "@/lib/models/Message";
import { SavedCreator } from "@/lib/models/SavedCreator";
import { User } from "@/lib/models/User";

const ACTIVE_STATUSES: BrandInquiryStatus[] = ["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED"];

function objectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function rangeMatch(field: string, start: Date | null, end: Date) {
  return start ? { [field]: { $gte: start, $lt: end } } : { [field]: { $lt: end } };
}

function dateFormat(range: AnalyticsRangeKey) {
  return range === "year" || range === "all" ? "%Y-%m" : "%Y-%m-%d";
}

type CountFacet = Array<{ count: number }>;
type CurrencyFacet = Array<{ _id: string; amount: number; count: number }>;
type TrendFacet = Array<{ _id: string; value: number; currency?: string }>;
type AnalyticsFacet = {
  created: CountFacet;
  accepted: CountFacet;
  rejected: CountFacet;
  cancelled: CountFacet;
  completed: CountFacet;
  active: CountFacet;
  response: Array<{ hours: number }>;
  completedMoney: CurrencyFacet;
  acceptedMoney: CurrencyFacet;
  distribution: Array<{ _id: string; value: number }>;
  funnel: Array<{ total: number; viewed: number; responded: number; accepted: number; proof: number; completed: number }>;
  createdTrend: TrendFacet;
  acceptedTrend: TrendFacet;
  rejectedTrend: TrendFacet;
  completedTrend: TrendFacet;
  completedValueTrend: TrendFacet;
  legacyExcluded: CountFacet;
};

function count(facet: CountFacet) {
  return facet[0]?.count ?? 0;
}

function currencyGroups(rows: CurrencyFacet): MoneyTotal[] {
  return rows.map((row) => ({ currency: row._id || "UNKNOWN", amount: row.amount, count: row.count }));
}

function trendStages(field: string, period: AnalyticsPeriod, monetary = false): PipelineStage.FacetPipelineStage[] {
  const groupId = monetary
    ? {
        label: { $dateToString: { format: dateFormat(period.key), date: `$${field}`, timezone: "UTC" } },
        currency: { $ifNull: ["$currency", "UNKNOWN"] },
      }
    : { $dateToString: { format: dateFormat(period.key), date: `$${field}`, timezone: "UTC" } };
  return [
    { $match: rangeMatch(field, period.start, period.end) },
    {
      $group: {
        _id: groupId,
        value: monetary ? { $sum: { $ifNull: ["$currentOfferAmount", { $ifNull: ["$initialOfferAmount", 0] }] } } : { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];
}

/**
 * KPI definitions:
 * - total: requests whose createdAt is in the selected period.
 * - accepted/rejected/cancelled/completed: immutable event timestamp in period.
 * - monetary totals: final recorded offer grouped by currency and event time.
 * - response time: firstCreatorResponseAt - createdAt, grouped by first response period.
 * - active/distribution: explicitly current, all-time snapshots.
 */
async function aggregateCollaborations(ownership: Record<string, unknown>, period: AnalyticsPeriod) {
  const createdRange = rangeMatch("createdAt", period.start, period.end);
  const laterThanViewed = [...ACTIVE_STATUSES, "COMPLETED", "NEGOTIATING"];
  const laterThanAccepted = [...ACTIVE_STATUSES, "COMPLETED"];
  const result = await BrandInquiry.aggregate<AnalyticsFacet>([
    { $match: ownership },
    {
      $facet: {
        created: [{ $match: createdRange }, { $count: "count" }],
        accepted: [{ $match: rangeMatch("acceptedAt", period.start, period.end) }, { $count: "count" }],
        rejected: [{ $match: rangeMatch("rejectedAt", period.start, period.end) }, { $count: "count" }],
        cancelled: [{ $match: rangeMatch("cancelledAt", period.start, period.end) }, { $count: "count" }],
        completed: [{ $match: rangeMatch("completedAt", period.start, period.end) }, { $count: "count" }],
        active: [{ $match: { status: { $in: ACTIVE_STATUSES } } }, { $count: "count" }],
        response: [
          { $match: rangeMatch("firstCreatorResponseAt", period.start, period.end) },
          { $match: { $expr: { $gte: ["$firstCreatorResponseAt", "$createdAt"] } } },
          { $group: { _id: null, hours: { $avg: { $divide: [{ $subtract: ["$firstCreatorResponseAt", "$createdAt"] }, 3_600_000] } } } },
          { $project: { _id: 0, hours: { $round: ["$hours", 1] } } },
        ],
        completedMoney: [
          { $match: rangeMatch("completedAt", period.start, period.end) },
          { $group: { _id: { $ifNull: ["$currency", "UNKNOWN"] }, amount: { $sum: { $ifNull: ["$currentOfferAmount", { $ifNull: ["$initialOfferAmount", 0] }] } }, count: { $sum: 1 } } },
        ],
        acceptedMoney: [
          { $match: rangeMatch("acceptedAt", period.start, period.end) },
          { $group: { _id: { $ifNull: ["$currency", "UNKNOWN"] }, amount: { $sum: { $ifNull: ["$currentOfferAmount", { $ifNull: ["$initialOfferAmount", 0] }] } }, count: { $sum: 1 } } },
        ],
        distribution: [{ $group: { _id: "$status", value: { $sum: 1 } } }, { $sort: { value: -1 } }],
        funnel: [
          { $match: createdRange },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              viewed: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$firstViewedAt", null] }, null] }, { $ne: [{ $ifNull: ["$firstCreatorResponseAt", null] }, null] }, { $in: ["$status", laterThanViewed] }] }, 1, 0] } },
              responded: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$firstCreatorResponseAt", null] }, null] }, { $ne: [{ $ifNull: ["$acceptedAt", null] }, null] }, { $in: ["$status", laterThanAccepted] }] }, 1, 0] } },
              accepted: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$acceptedAt", null] }, null] }, { $in: ["$status", laterThanAccepted] }] }, 1, 0] } },
              proof: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$proofSubmittedAt", null] }, null] }, { $ne: [{ $ifNull: ["$completedAt", null] }, null] }, { $in: ["$status", ["PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED"]] }] }, 1, 0] } },
              completed: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$completedAt", null] }, null] }, { $eq: ["$status", "COMPLETED"] }] }, 1, 0] } },
            },
          },
        ],
        createdTrend: trendStages("createdAt", period),
        acceptedTrend: trendStages("acceptedAt", period),
        rejectedTrend: trendStages("rejectedAt", period),
        completedTrend: trendStages("completedAt", period),
        completedValueTrend: trendStages("completedAt", period, true),
        legacyExcluded: [
          {
            $match: {
              $and: [
                { status: { $in: [...laterThanViewed, "COMPLETED"] } },
                { acceptedAt: null },
                { rejectedAt: null },
                { cancelledAt: null },
                { completedAt: null },
              ],
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);
  const facets = result[0] ?? ({} as AnalyticsFacet);
  const accepted = count(facets.accepted);
  const rejected = count(facets.rejected);
  const completed = count(facets.completed);
  const funnelRaw = facets.funnel?.[0] ?? { total: 0, viewed: 0, responded: 0, accepted: 0, proof: 0, completed: 0 };
  const funnelCounts = [funnelRaw.total, funnelRaw.viewed, funnelRaw.responded, funnelRaw.accepted, funnelRaw.proof, funnelRaw.completed];
  const funnelLabels = ["Sent", "Viewed", "Responded or negotiating", "Accepted", "Proof submitted", "Completed"];
  const trends = new Map<string, AnalyticsSeriesPoint>();
  const mergeTrend = (rows: TrendFacet, series: string) => rows.forEach((row) => {
    const label = typeof row._id === "string" ? row._id : String((row._id as unknown as { label: string }).label);
    const point = trends.get(label) ?? { label, series: {} };
    point.series[series] = row.value;
    trends.set(label, point);
  });
  mergeTrend(facets.createdTrend ?? [], "Created");
  mergeTrend(facets.acceptedTrend ?? [], "Accepted");
  mergeTrend(facets.rejectedTrend ?? [], "Rejected");
  mergeTrend(facets.completedTrend ?? [], "Completed");
  (facets.completedValueTrend ?? []).forEach((row) => {
    const key = row._id as unknown as { label: string; currency: string };
    const point = trends.get(key.label) ?? { label: key.label, series: {} };
    point.currencySeries ??= {};
    point.currencySeries[key.currency || "UNKNOWN"] = row.value;
    trends.set(key.label, point);
  });
  const acceptedMoney = currencyGroups(facets.acceptedMoney ?? []);
  return {
    total: count(facets.created),
    accepted,
    rejected,
    cancelled: count(facets.cancelled),
    completed,
    active: count(facets.active),
    acceptanceRate: safeRate(accepted, accepted + rejected),
    completionRate: safeRate(completed, completed + count(facets.cancelled)),
    averageResponseHours: facets.response?.[0]?.hours ?? 0,
    completedValueByCurrency: currencyGroups(facets.completedMoney ?? []),
    committedValueByCurrency: acceptedMoney,
    averageDealValueByCurrency: acceptedMoney.map((group) => ({ currency: group.currency, amount: group.count ? Math.round(group.amount / group.count) : 0 })),
    distribution: (facets.distribution ?? []).map((row) => ({ label: row._id || "UNKNOWN", value: row.value })),
    funnel: funnelCounts.map((stageCount, index) => ({ label: funnelLabels[index], count: stageCount, conversion: index === 0 ? (stageCount ? 100 : 0) : safeRate(stageCount, funnelCounts[index - 1]) })),
    trend: [...trends.values()].sort((a, b) => a.label.localeCompare(b.label)),
    legacyExcluded: count(facets.legacyExcluded),
  };
}

function previousPeriod(period: AnalyticsPeriod): AnalyticsPeriod | null {
  if (!period.previousStart || !period.previousEnd) return null;
  return { ...period, start: period.previousStart, end: period.previousEnd, previousStart: null, previousEnd: null };
}

export async function getCreatorAnalytics(range?: string) {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "creator" || !hasMongoUri()) return null;
  await connectDB();
  const period = parseAnalyticsRange(range);
  const profile = await CreatorProfile.findOne({ userId: user.id }).select("_id verificationStatus profileViews").lean();
  if (!profile) return null;
  const ownership = { $or: [{ creatorUserId: objectId(user.id) }, { creatorProfileId: profile._id }] };
  const previous = previousPeriod(period);
  const [summary, previousSummary, savedCount, upcoming, pendingActions] = await Promise.all([
    aggregateCollaborations(ownership, period),
    previous ? aggregateCollaborations(ownership, previous) : null,
    SavedCreator.countDocuments({ creatorUserId: user.id }),
    BrandInquiry.find({ ...ownership, status: { $in: ACTIVE_STATUSES }, deadline: { $gte: period.end } }).sort({ deadline: 1 }).limit(5).select("campaignTitle companyName deadline").lean(),
    BrandInquiry.countDocuments({ ...ownership, status: { $in: ["NEW", "PENDING_CREATOR_RESPONSE", "NEGOTIATING", "REVISION_REQUESTED"] } }),
  ]);
  const creatorFunnel = buildCreatorFunnel(summary.funnel);
  return {
    role: "creator" as const,
    period,
    summary,
    creatorFunnel,
    savedCount,
    profileViews: profile.profileViews ?? 0,
    verificationStatus: profile.verificationStatus,
    changes: {
      offers: metricChange(summary.total, previousSummary?.total ?? 0),
      acceptance: metricChange(summary.acceptanceRate, previousSummary?.acceptanceRate ?? 0),
    },
    upcoming: upcoming.map((doc) => ({ id: String(doc._id), title: doc.campaignTitle || doc.companyName || "Campaign", deadline: doc.deadline!.toISOString() })),
    pendingActions,
    insights: [
      summary.total === 0 ? "No offers were received in this period." : `${summary.total} offers were received in this period.`,
      savedCount > 0 ? `${savedCount} brand${savedCount === 1 ? " has" : "s have"} saved your profile (all time).` : "No brands have saved your profile yet.",
      summary.legacyExcluded ? `${summary.legacyExcluded} legacy records lack exact lifecycle timestamps and are excluded from event-period metrics.` : "All lifecycle records used by period metrics have exact timestamps.",
    ],
  };
}

export async function getBrandAnalytics(range?: string) {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "brand" || !hasMongoUri()) return null;
  await connectDB();
  const period = parseAnalyticsRange(range);
  const profile = await BrandProfile.findOne({ userId: user.id }).select("_id").lean();
  const ownership = {
    $or: [
      { brandUserId: objectId(user.id) },
      { createdByClerkId: user.clerkId },
      ...(profile ? [{ brandProfileId: profile._id }] : []),
    ],
  };
  const previous = previousPeriod(period);
  const [summary, previousSummary, savedCount, upcoming, pendingActions, creatorStats, uniqueCreatorRows] = await Promise.all([
    aggregateCollaborations(ownership, period),
    previous ? aggregateCollaborations(ownership, previous) : null,
    SavedCreator.countDocuments({ brandUserId: user.id }),
    BrandInquiry.find({ ...ownership, status: { $in: ACTIVE_STATUSES }, deadline: { $gte: period.end } }).sort({ deadline: 1 }).limit(5).select("campaignTitle creatorUsername deadline").lean(),
    BrandInquiry.countDocuments({ ...ownership, status: { $in: ["PROOF_SUBMITTED", "NEGOTIATING", "APPROVED"] } }),
    BrandInquiry.aggregate<{ _id: string; value: number }>([
      { $match: { ...ownership, ...rangeMatch("createdAt", period.start, period.end), creatorUserId: { $ne: null } } },
      { $group: { _id: { $ifNull: ["$creatorUsername", "Unlinked creator"] }, value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 5 },
    ]),
    BrandInquiry.aggregate<{ count: number }>([
      { $match: { ...ownership, ...rangeMatch("createdAt", period.start, period.end), creatorUserId: { $ne: null } } },
      { $group: { _id: "$creatorUserId" } },
      { $count: "count" },
    ]),
  ]);
  return {
    role: "brand" as const,
    period,
    summary,
    savedCount,
    uniqueCreators: uniqueCreatorRows[0]?.count ?? 0,
    changes: {
      requests: metricChange(summary.total, previousSummary?.total ?? 0),
      acceptance: metricChange(summary.acceptanceRate, previousSummary?.acceptanceRate ?? 0),
    },
    upcoming: upcoming.map((doc) => ({ id: String(doc._id), title: doc.campaignTitle || doc.creatorUsername || "Campaign", deadline: doc.deadline!.toISOString() })),
    pendingActions,
    mostActive: creatorStats.map((row) => ({ label: row._id, value: row.value })),
    insights: [
      summary.total === 0 ? "No collaboration requests were sent in this period." : `${summary.acceptanceRate}% of decisions recorded in this period were acceptances.`,
      savedCount ? `${savedCount} creators are currently saved (all time).` : "Build a shortlist by saving creators from Discovery.",
      summary.legacyExcluded ? `${summary.legacyExcluded} legacy records lack exact lifecycle timestamps and are excluded from event-period metrics.` : "All lifecycle records used by period metrics have exact timestamps.",
    ],
  };
}

export async function getAdminAnalytics(range?: string) {
  const admin = await getAdminState();
  if (!admin.isAdmin || !hasMongoUri()) return null;
  await connectDB();
  const period = parseAnalyticsRange(range);
  const userRange = rangeMatch("createdAt", period.start, period.end);
  const staleBefore = new Date(period.end.getTime() - 14 * 86_400_000);
  const [
    summary,
    users,
    creators,
    brands,
    newUsers,
    newCreators,
    newBrands,
    verifiedCreators,
    pendingVerifications,
    collaborations,
    messages,
    notifications,
    stale,
    pastDeadline,
    registrationTrend,
    verificationTrend,
  ] = await Promise.all([
    aggregateCollaborations({}, period),
    User.countDocuments(),
    User.countDocuments({ role: "creator" }),
    User.countDocuments({ role: "brand" }),
    User.countDocuments(userRange),
    User.countDocuments({ role: "creator", ...userRange }),
    User.countDocuments({ role: "brand", ...userRange }),
    CreatorProfile.countDocuments({ verificationStatus: "verified" }),
    CreatorVerificationRequest.countDocuments({ status: "pending" }),
    BrandInquiry.countDocuments(),
    Message.countDocuments(),
    InAppNotification.countDocuments(),
    BrandInquiry.countDocuments({ status: { $in: ACTIVE_STATUSES }, lastMeaningfulActivityAt: { $lt: staleBefore } }),
    BrandInquiry.countDocuments({ status: { $in: ACTIVE_STATUSES }, deadline: { $lt: period.end } }),
    User.aggregate<{ _id: { label: string; role: string }; value: number }>([
      { $match: userRange },
      { $group: { _id: { label: { $dateToString: { format: dateFormat(period.key), date: "$createdAt", timezone: "UTC" } }, role: "$role" }, value: { $sum: 1 } } },
      { $sort: { "_id.label": 1 } },
    ]),
    CreatorVerificationRequest.aggregate<{ _id: { label: string; series: string }; value: number }>([
      { $match: { $or: [rangeMatch("submittedAt", period.start, period.end), rangeMatch("reviewedAt", period.start, period.end)] } },
      { $project: { events: [{ date: "$submittedAt", series: { $literal: "Submitted" } }, { date: { $cond: [{ $eq: ["$status", "approved"] }, "$reviewedAt", null] }, series: { $literal: "Approved" } }] } },
      { $unwind: "$events" },
      { $match: { "events.date": { $ne: null, ...(period.start ? { $gte: period.start } : {}), $lt: period.end } } },
      { $group: { _id: { label: { $dateToString: { format: dateFormat(period.key), date: "$events.date", timezone: "UTC" } }, series: "$events.series" }, value: { $sum: 1 } } },
      { $sort: { "_id.label": 1 } },
    ]),
  ]);
  return {
    role: "admin" as const,
    period,
    summary,
    totals: {
      users,
      creators,
      brands,
      newUsers,
      newCreators,
      newBrands,
      verifiedCreators,
      pendingVerifications,
      collaborations,
      messages,
      notifications,
      stale,
      pastDeadline,
      cancelled: summary.cancelled + summary.rejected,
    },
    registrationTrend: registrationTrend.map((row) => ({ label: row._id.label, role: row._id.role, value: row.value })),
    verificationTrend: verificationTrend.map((row) => ({ label: row._id.label, series: row._id.series, value: row.value })),
    insights: [
      `${pendingVerifications} creator verification request${pendingVerifications === 1 ? " is" : "s are"} waiting for review.`,
      `${stale} active collaboration${stale === 1 ? " has" : "s have"} had no meaningful update for 14 days.`,
      summary.legacyExcluded ? `${summary.legacyExcluded} legacy collaborations are excluded from exact event-period metrics.` : "All lifecycle records used by period metrics have exact timestamps.",
    ],
  };
}

export function analyticsRangeFromSearch(value?: string) {
  return parseAnalyticsRange(value).key as AnalyticsRangeKey;
}
