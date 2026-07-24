import { expect, test } from "@playwright/test";

import { buildCreatorFunnel, hasPeriodAnalyticsActivity, summarizeCollaborations, metricChange, parseAnalyticsRange, safeRate } from "../../lib/analytics/core";
import { deriveLifecycleTimestampBackfill, resolveOwnershipBackfill } from "../../lib/analytics/migration";
import { appendCollaborationTimeline } from "../../lib/collaborations";

const start = new Date("2026-02-01T00:00:00Z");
const end = new Date("2026-03-01T00:00:00Z");

test("period metrics use immutable event time instead of current status or creation time", () => {
  const summary = summarizeCollaborations([
    { _id: "old-completed-now", status: "COMPLETED", createdAt: new Date("2026-01-01T00:00:00Z"), acceptedAt: new Date("2026-01-10T00:00:00Z"), completedAt: new Date("2026-02-10T00:00:00Z"), currentOfferAmount: 200, currency: "INR" },
    { _id: "new-completed-later", status: "COMPLETED", createdAt: new Date("2026-02-02T00:00:00Z"), acceptedAt: new Date("2026-02-03T00:00:00Z"), completedAt: new Date("2026-03-10T00:00:00Z"), currentOfferAmount: 300, currency: "USD" },
    { _id: "accepted-then-cancelled", status: "CANCELLED", createdAt: new Date("2026-01-01T00:00:00Z"), acceptedAt: new Date("2026-02-05T00:00:00Z"), cancelledAt: new Date("2026-03-05T00:00:00Z"), currentOfferAmount: 100, currency: "INR" },
  ], "30d", start, end);
  expect(summary.total).toBe(1);
  expect(summary.accepted).toBe(2);
  expect(summary.completed).toBe(1);
  expect(summary.cancelled).toBe(0);
  expect(summary.completedValueByCurrency).toEqual([{ currency: "INR", amount: 200, count: 1 }]);
});

test("currencies and averages remain separate and missing currency is UNKNOWN", () => {
  const summary = summarizeCollaborations([
    { _id: "1", acceptedAt: new Date("2026-02-02T00:00:00Z"), completedAt: new Date("2026-02-10T00:00:00Z"), currentOfferAmount: 100, currency: "INR" },
    { _id: "2", acceptedAt: new Date("2026-02-03T00:00:00Z"), completedAt: new Date("2026-02-11T00:00:00Z"), currentOfferAmount: 200, currency: "USD" },
    { _id: "3", acceptedAt: new Date("2026-02-04T00:00:00Z"), completedAt: new Date("2026-02-12T00:00:00Z"), currentOfferAmount: 50 },
  ], "30d", start, end);
  expect(summary.completedValueByCurrency).toEqual([
    { currency: "INR", amount: 100, count: 1 },
    { currency: "USD", amount: 200, count: 1 },
    { currency: "UNKNOWN", amount: 50, count: 1 },
  ]);
  expect(summary.averageDealValueByCurrency).toEqual([
    { currency: "INR", amount: 100 },
    { currency: "USD", amount: 200 },
    { currency: "UNKNOWN", amount: 50 },
  ]);
});

test("first creator response timestamp is immutable across later responses", () => {
  const first = new Date("2026-02-02T00:00:00Z");
  const later = new Date("2026-02-03T00:00:00Z");
  const collaboration: Parameters<typeof appendCollaborationTimeline>[0] = {};
  appendCollaborationTimeline(collaboration, { event: "COUNTERED", actor: "creator", createdAt: first });
  appendCollaborationTimeline(collaboration, { event: "ACCEPTED", actor: "creator", createdAt: later });
  expect(collaboration.firstCreatorResponseAt).toEqual(first);
  expect(collaboration.acceptedAt).toEqual(later);
});

test("cumulative funnels are monotonic even with skipped or duplicate history", () => {
  const summary = summarizeCollaborations([
    { _id: "one", status: "COMPLETED", createdAt: new Date("2026-02-01T00:00:00Z"), completedAt: new Date("2026-02-20T00:00:00Z"), statusHistory: [{ event: "VIEWED" }, { event: "VIEWED" }] },
    { _id: "two", status: "ACCEPTED", createdAt: new Date("2026-02-02T00:00:00Z"), acceptedAt: new Date("2026-02-05T00:00:00Z") },
  ], "30d", start, end);
  expect(summary.funnel.map((stage) => stage.count)).toEqual([2, 2, 2, 2, 1, 1]);
  expect(summary.funnel.every((stage) => stage.conversion >= 0 && stage.conversion <= 100)).toBeTruthy();
});

test("cancellation or rejection alone does not imply a creator response", () => {
  const summary = summarizeCollaborations([
    { _id: "cancelled", status: "CANCELLED", createdAt: new Date("2026-02-01T00:00:00Z"), cancelledAt: new Date("2026-02-02T00:00:00Z") },
    { _id: "rejected-by-brand", status: "DECLINED", createdAt: new Date("2026-02-03T00:00:00Z"), rejectedAt: new Date("2026-02-04T00:00:00Z") },
  ], "30d", start, end);
  expect(summary.funnel.find((stage) => stage.label === "Responded or negotiating")?.count).toBe(0);
});

test("creator funnel recalculates conversion against visible creator stages", () => {
  const creatorFunnel = buildCreatorFunnel([
    { label: "Sent", count: 10, conversion: 100 },
    { label: "Viewed", count: 8, conversion: 80 },
    { label: "Responded", count: 6, conversion: 75 },
    { label: "Accepted", count: 3, conversion: 50 },
    { label: "Proof", count: 2, conversion: 66.7 },
    { label: "Completed", count: 1, conversion: 50 },
  ]);
  expect(creatorFunnel.map((stage) => stage.conversion)).toEqual([100, 60, 50, 33.3]);
});

test("period completion activity prevents a false empty state", () => {
  expect(hasPeriodAnalyticsActivity({ total: 0, accepted: 0, rejected: 0, cancelled: 0, completed: 1 })).toBeTruthy();
  expect(hasPeriodAnalyticsActivity({ total: 0, accepted: 0, rejected: 0, cancelled: 0, completed: 0 })).toBeFalsy();
});

test("migration derives only trustworthy history timestamps and is idempotent", () => {
  const accepted = new Date("2026-02-05T00:00:00Z");
  const first = deriveLifecycleTimestampBackfill({ statusHistory: [{ event: "ACCEPTED", actor: "creator", createdAt: accepted }] });
  expect(first).toMatchObject({ acceptedAt: accepted, firstCreatorResponseAt: accepted, lastMeaningfulActivityAt: accepted });
  expect(deriveLifecycleTimestampBackfill({ acceptedAt: accepted, firstCreatorResponseAt: accepted, lastMeaningfulActivityAt: accepted, statusHistory: [{ event: "ACCEPTED", actor: "creator", createdAt: accepted }] })).toEqual({});
  expect(deriveLifecycleTimestampBackfill({ statusHistory: [{ event: "COMPLETED", createdAt: null }] })).toEqual({});
});

test("ownership migration reports ambiguity and never guesses", () => {
  const ambiguous = resolveOwnershipBackfill({ emailBrands: [{ userId: "a", profileId: "pa" }, { userId: "b", profileId: "pb" }] });
  expect(ambiguous).toEqual({ set: {}, ambiguous: true });
  const unique = resolveOwnershipBackfill({ emailBrands: [{ userId: "a", profileId: "pa" }] });
  expect(unique).toEqual({ set: { brandUserId: "a", brandProfileId: "pa" }, ambiguous: false });
});

test("reference totals remain exact above former hard caps", () => {
  const docs = Array.from({ length: 12_001 }, (_, index) => ({ _id: String(index), createdAt: new Date("2026-02-10T00:00:00Z") }));
  expect(summarizeCollaborations(docs, "30d", start, end).total).toBe(12_001);
});

test("range and defensive rate helpers remain stable", () => {
  const now = new Date("2026-07-24T00:00:00Z");
  const invalid = parseAnalyticsRange("10000d", now);
  expect(invalid.key).toBe("30d");
  expect(invalid.previousEnd?.toISOString()).toBe(invalid.start?.toISOString());
  expect(safeRate(3, 0)).toBe(0);
  expect(safeRate(20, 10)).toBe(100);
  expect(metricChange(5, 0)).toEqual({ value: 5, mode: "absolute", available: true });
});
