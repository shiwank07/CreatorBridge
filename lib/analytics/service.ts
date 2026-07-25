import mongoose from "mongoose";

import { getAdminState } from "@/lib/admin";
import type { BrandInquiryStatus } from "@/lib/collaborations";
import {
  metricChange,
  buildCreatorFunnel,
  fillAnalyticsTrendBuckets,
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

function bucketExpression(field: string, period: AnalyticsPeriod) {
  return {
    $dateToString: {
      format: dateFormat(period.key),
      date: period.key === "90d" ? { $dateTrunc: { date: `$${field}`, unit: "week", startOfWeek: "Sunday", timezone: "UTC" } } : `$${field}`,
      timezone: "UTC",
    },
  };
}

type CurrencyFacet = Array<{ _id: string; amount: number; count: number }>;
type EventResult = { count: number; trend: Array<{ _id: string; value: number }>; averageHours?: number };

function currencyGroups(rows: CurrencyFacet): MoneyTotal[] {
  return rows.map((row) => ({ currency: row._id || "UNKNOWN", amount: row.amount, count: row.count }));
}

function normalizedStatusExpression() {
  return {
    $let: {
      vars: { status: { $toUpper: { $ifNull: ["$status", "UNKNOWN"] } } },
      in: {
        $switch: {
          branches: [
            { case: { $in: ["$$status", ["NEW"]] }, then: "NEW" },
            { case: { $in: ["$$status", ["PENDING_CREATOR_RESPONSE", "OFFER_SENT", "VIEWED", "REVIEWED", "CONTACTED", "SENT_TO_CREATOR"]] }, then: "PENDING_CREATOR_RESPONSE" },
            { case: { $in: ["$$status", ["NEGOTIATING", "COUNTER_SENT", "COUNTER_REQUESTED"]] }, then: "NEGOTIATING" },
            { case: { $in: ["$$status", ["ACCEPTED", "OFFER_ACCEPTED", "INTERESTED", "CREATOR_INTERESTED", "CONTACT_SHARED"]] }, then: "ACCEPTED" },
            { case: { $in: ["$$status", ["DECLINED", "OFFER_DECLINED", "CREATOR_DECLINED", "REJECTED"]] }, then: "DECLINED" },
            { case: { $in: ["$$status", ["IN_PROGRESS", "WORK_STARTED"]] }, then: "IN_PROGRESS" },
            { case: { $in: ["$$status", ["PROOF_SUBMITTED"]] }, then: "PROOF_SUBMITTED" },
            { case: { $in: ["$$status", ["REVISION_REQUESTED", "CHANGES_REQUESTED"]] }, then: "REVISION_REQUESTED" },
            { case: { $in: ["$$status", ["APPROVED"]] }, then: "APPROVED" },
            { case: { $in: ["$$status", ["COMPLETED", "CLOSED"]] }, then: "COMPLETED" },
            { case: { $in: ["$$status", ["CANCELLED"]] }, then: "CANCELLED" },
          ],
          default: "UNKNOWN",
        },
      },
    },
  };
}

async function eventMetrics(ownership: Record<string, unknown>, field: string, period: AnalyticsPeriod, response = false): Promise<EventResult> {
  const rows = await BrandInquiry.aggregate<{
    count: Array<{ value: number; averageHours?: number }>;
    trend: Array<{ _id: string; value: number }>;
  }>([
    { $match: { ...ownership, ...rangeMatch(field, period.start, period.end) } },
    ...(response ? [{ $match: { $expr: { $gte: [`$${field}`, "$createdAt"] } } }] : []),
    {
      $facet: {
        count: [
          {
            $group: {
              _id: null,
              value: { $sum: 1 },
              ...(response ? { averageHours: { $avg: { $divide: [{ $subtract: [`$${field}`, "$createdAt"] }, 3_600_000] } } } : {}),
            },
          },
        ],
        trend: [
          { $group: { _id: bucketExpression(field, period), value: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);
  return {
    count: rows[0]?.count[0]?.value ?? 0,
    trend: rows[0]?.trend ?? [],
    averageHours: response && rows[0]?.count[0]?.averageHours !== undefined ? Math.round(rows[0].count[0].averageHours! * 10) / 10 : undefined,
  };
}

async function moneyMetrics(ownership: Record<string, unknown>, field: string, period: AnalyticsPeriod) {
  return BrandInquiry.aggregate<{
    totals: CurrencyFacet;
    trend: Array<{ _id: { label: string; currency: string }; value: number }>;
  }>([
    { $match: { ...ownership, ...rangeMatch(field, period.start, period.end) } },
    {
      $facet: {
        totals: [
          { $group: { _id: { $ifNull: ["$currency", "UNKNOWN"] }, amount: { $sum: { $ifNull: ["$currentOfferAmount", { $ifNull: ["$initialOfferAmount", 0] }] } }, count: { $sum: 1 } } },
        ],
        trend: [
          { $group: { _id: { label: bucketExpression(field, period), currency: { $ifNull: ["$currency", "UNKNOWN"] } }, value: { $sum: { $ifNull: ["$currentOfferAmount", { $ifNull: ["$initialOfferAmount", 0] }] } } } },
          { $sort: { "_id.label": 1 } },
        ],
      },
    },
  ]).then((rows) => rows[0] ?? { totals: [], trend: [] });
}

function historyEvent(event: string, actor?: string) {
  return {
    $gt: [
      {
        $size: {
          $filter: {
            input: { $ifNull: ["$statusHistory", []] },
            as: "entry",
            cond: {
              $and: [
                { $eq: ["$$entry.event", event] },
                ...(actor ? [{ $eq: ["$$entry.actor", actor] }] : []),
              ],
            },
          },
        },
      },
      0,
    ],
  };
}

/**
 * KPI definitions:
 * - total: requests whose createdAt is in the selected period.
 * - accepted/rejected/cancelled/completed: immutable event timestamp in period.
 * - monetary totals: final recorded offer grouped by currency and event time.
 * - response time: firstCreatorResponseAt - createdAt, grouped by first response period.
 * - active/distribution: explicitly current, all-time snapshots.
 */
export async function aggregateCollaborationsForOwnership(ownership: Record<string, unknown>, period: AnalyticsPeriod) {
  const createdRange = rangeMatch("createdAt", period.start, period.end);
  const laterThanAccepted = [...ACTIVE_STATUSES, "COMPLETED"];
  const [createdEvent, viewedEvent, responseEvent, acceptedEvent, rejectedEvent, cancelledEvent, proofEvent, completedEvent, acceptedMoneyResult, completedMoneyResult, snapshotRows, funnelRows] = await Promise.all([
    eventMetrics(ownership, "createdAt", period),
    eventMetrics(ownership, "firstCreatorViewedAt", period),
    eventMetrics(ownership, "firstCreatorResponseAt", period, true),
    eventMetrics(ownership, "acceptedAt", period),
    eventMetrics(ownership, "rejectedAt", period),
    eventMetrics(ownership, "cancelledAt", period),
    eventMetrics(ownership, "proofSubmittedAt", period),
    eventMetrics(ownership, "completedAt", period),
    moneyMetrics(ownership, "acceptedAt", period),
    moneyMetrics(ownership, "completedAt", period),
    BrandInquiry.aggregate<{
      distribution: Array<{ _id: string; value: number }>;
      active: Array<{ count: number }>;
      missing: Array<{ creatorView: number; firstResponse: number; acceptance: number; rejection: number; cancellation: number; completion: number }>;
    }>([
      { $match: ownership },
      { $addFields: { _normalizedStatus: normalizedStatusExpression() } },
      {
        $facet: {
          distribution: [{ $group: { _id: "$_normalizedStatus", value: { $sum: 1 } } }, { $sort: { value: -1 } }],
          active: [{ $match: { _normalizedStatus: { $in: ACTIVE_STATUSES } } }, { $count: "count" }],
          missing: [{
            $group: {
              _id: null,
              creatorView: { $sum: { $cond: [{ $and: [historyEvent("VIEWED", "creator"), { $eq: [{ $ifNull: ["$firstCreatorViewedAt", null] }, null] }] }, 1, 0] } },
              firstResponse: { $sum: { $cond: [{ $and: [{ $or: [historyEvent("COUNTERED", "creator"), historyEvent("ACCEPTED", "creator"), historyEvent("DECLINED", "creator")] }, { $eq: [{ $ifNull: ["$firstCreatorResponseAt", null] }, null] }] }, 1, 0] } },
              acceptance: { $sum: { $cond: [{ $and: [historyEvent("ACCEPTED"), { $eq: [{ $ifNull: ["$acceptedAt", null] }, null] }] }, 1, 0] } },
              rejection: { $sum: { $cond: [{ $and: [historyEvent("DECLINED"), { $eq: [{ $ifNull: ["$rejectedAt", null] }, null] }] }, 1, 0] } },
              cancellation: { $sum: { $cond: [{ $and: [historyEvent("CANCELLED"), { $eq: [{ $ifNull: ["$cancelledAt", null] }, null] }] }, 1, 0] } },
              completion: { $sum: { $cond: [{ $and: [historyEvent("COMPLETED"), { $eq: [{ $ifNull: ["$completedAt", null] }, null] }] }, 1, 0] } },
            },
          }],
        },
      },
    ]),
    BrandInquiry.aggregate<{ total: number; viewed: number; responded: number; accepted: number; proof: number; completed: number }>([
      { $match: { ...ownership, ...createdRange } },
      { $addFields: { _normalizedStatus: normalizedStatusExpression() } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          viewed: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$firstCreatorViewedAt", null] }, null] }, { $ne: [{ $ifNull: ["$firstCreatorResponseAt", null] }, null] }, { $in: ["$_normalizedStatus", laterThanAccepted] }] }, 1, 0] } },
          responded: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$firstCreatorResponseAt", null] }, null] }, { $ne: [{ $ifNull: ["$acceptedAt", null] }, null] }, { $in: ["$_normalizedStatus", laterThanAccepted] }] }, 1, 0] } },
          accepted: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$acceptedAt", null] }, null] }, { $in: ["$_normalizedStatus", laterThanAccepted] }] }, 1, 0] } },
          proof: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$proofSubmittedAt", null] }, null] }, { $ne: [{ $ifNull: ["$completedAt", null] }, null] }, { $in: ["$_normalizedStatus", ["PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED"]] }] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $or: [{ $ne: [{ $ifNull: ["$completedAt", null] }, null] }, { $eq: ["$_normalizedStatus", "COMPLETED"] }] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const accepted = acceptedEvent.count;
  const rejected = rejectedEvent.count;
  const completed = completedEvent.count;
  const snapshot = snapshotRows[0] ?? { distribution: [], active: [], missing: [] };
  const missing = snapshot.missing[0] ?? { creatorView: 0, firstResponse: 0, acceptance: 0, rejection: 0, cancellation: 0, completion: 0 };
  const funnelRaw = funnelRows[0] ?? { total: 0, viewed: 0, responded: 0, accepted: 0, proof: 0, completed: 0 };
  const funnelCounts = [funnelRaw.total, funnelRaw.viewed, funnelRaw.responded, funnelRaw.accepted, funnelRaw.proof, funnelRaw.completed];
  const funnelLabels = ["Sent", "Viewed", "Responded or negotiating", "Accepted", "Proof submitted", "Completed"];
  const trends = new Map<string, AnalyticsSeriesPoint>();
  const mergeTrend = (rows: Array<{ _id: string; value: number }>, series: string) => rows.forEach((row) => {
    const label = row._id;
    const point = trends.get(label) ?? { label, series: {} };
    point.series[series] = row.value;
    trends.set(label, point);
  });
  mergeTrend(createdEvent.trend, "Created");
  mergeTrend(viewedEvent.trend, "Viewed");
  mergeTrend(responseEvent.trend, "First response");
  mergeTrend(acceptedEvent.trend, "Accepted");
  mergeTrend(rejectedEvent.trend, "Rejected");
  mergeTrend(completedEvent.trend, "Completed");
  completedMoneyResult.trend.forEach((row) => {
    const key = row._id;
    const point = trends.get(key.label) ?? { label: key.label, series: {} };
    point.currencySeries ??= {};
    point.currencySeries[key.currency || "UNKNOWN"] = row.value;
    trends.set(key.label, point);
  });
  const acceptedMoney = currencyGroups(acceptedMoneyResult.totals);
  const trend = fillAnalyticsTrendBuckets([...trends.values()].sort((a, b) => a.label.localeCompare(b.label)), period);
  const legacyMissing = missing;
  const legacyExcluded = Object.values(legacyMissing).reduce((sum, value) => sum + value, 0);
  return {
    total: createdEvent.count,
    accepted,
    rejected,
    cancelled: cancelledEvent.count,
    completed,
    active: snapshot.active[0]?.count ?? 0,
    acceptanceRate: safeRate(accepted, accepted + rejected),
    completionRate: safeRate(completed, completed + cancelledEvent.count),
    averageResponseHours: responseEvent.averageHours ?? 0,
    completedValueByCurrency: currencyGroups(completedMoneyResult.totals),
    committedValueByCurrency: acceptedMoney,
    averageDealValueByCurrency: acceptedMoney.map((group) => ({ currency: group.currency, amount: group.count ? Math.round(group.amount / group.count) : 0 })),
    distribution: snapshot.distribution.map((row) => ({ label: row._id || "UNKNOWN", value: row.value })),
    funnel: funnelCounts.map((stageCount, index) => ({ label: funnelLabels[index], count: stageCount, conversion: index === 0 ? (stageCount ? 100 : 0) : safeRate(stageCount, funnelCounts[index - 1]) })),
    trend,
    periodActivityCount: createdEvent.count + viewedEvent.count + responseEvent.count + acceptedEvent.count + rejectedEvent.count + cancelledEvent.count + proofEvent.count + completedEvent.count,
    legacyMissing,
    legacyExcluded,
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
    aggregateCollaborationsForOwnership(ownership, period),
    previous ? aggregateCollaborationsForOwnership(ownership, previous) : null,
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
    aggregateCollaborationsForOwnership(ownership, period),
    previous ? aggregateCollaborationsForOwnership(ownership, previous) : null,
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
    aggregateCollaborationsForOwnership({}, period),
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
    InAppNotification.countDocuments(userRange),
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
