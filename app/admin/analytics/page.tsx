import Link from "next/link";

import { AnalyticsBars, AnalyticsCurrencyTrend, AnalyticsHeader, AnalyticsInsights, AnalyticsKpi, AnalyticsTrend, MoneyRows } from "@/components/analytics/analytics-dashboard";
import { getAdminAnalytics } from "@/lib/analytics/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Platform Analytics" };

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const analytics = await getAdminAnalytics(range);
  if (!analytics) return null;
  const { summary, totals } = analytics;
  const registrations = [...analytics.registrationTrend.reduce((points, item) => {
    const point = points.get(item.label) ?? { label: item.label, series: {} as Record<string, number> };
    point.series[item.role === "creator" ? "Creators" : item.role === "brand" ? "Brands" : item.role] = item.value;
    points.set(item.label, point);
    return points;
  }, new Map<string, { label: string; series: Record<string, number> }>()).values()];
  const verifications = [...analytics.verificationTrend.reduce((points, item) => {
    const point = points.get(item.label) ?? { label: item.label, series: {} as Record<string, number> };
    point.series[item.series] = item.value;
    points.set(item.label, point);
    return points;
  }, new Map<string, { label: string; series: Record<string, number> }>()).values()];
  return (
    <div className="max-w-7xl">
      <AnalyticsHeader title="Platform analytics" description="Marketplace growth, conversion, operational backlog, activity, and collaboration health from real Branzzo records." period={analytics.period} pathname="/admin/analytics" />
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsKpi label="Total users" value={totals.users} detail={`${totals.creators} creators · ${totals.brands} brands`} />
        <AnalyticsKpi label="Verified creators" value={totals.verifiedCreators} detail={`${totals.pendingVerifications} verification requests pending.`} />
        <AnalyticsKpi label="Collaborations" value={totals.collaborations} detail={`${summary.active} active in the selected period.`} />
        <AnalyticsKpi label="New users" value={totals.newUsers} detail={`${totals.newCreators} creators · ${totals.newBrands} brands in this period.`} />
        <AnalyticsKpi label="Active collaborations" value={summary.active} detail="Accepted through approved work still in motion." />
        <AnalyticsKpi label="Completed" value={summary.completed} detail={`${summary.completionRate}% terminal success rate (completions divided by completions plus cancellations in this period).`} />
        <AnalyticsKpi label="Cancelled or declined" value={totals.cancelled} detail="Final rejected or cancelled collaborations in this period." />
        <AnalyticsKpi label="Messages" value={totals.messages} detail="Message count only; content is never loaded." />
        <AnalyticsKpi label="Notifications" value={totals.notifications} detail="Notifications created in the selected period." />
        <AnalyticsKpi label="Acceptance rate" value={`${summary.acceptanceRate}%`} detail="Accepted divided by finalized collaboration decisions." />
        <AnalyticsKpi label="Brand-to-creator ratio" value={totals.creators ? `1:${Math.round((totals.creators / Math.max(1, totals.brands)) * 10) / 10}` : "Unavailable"} detail="Registered brands compared with registered creators." />
        <AnalyticsKpi label="Average accepted deal" value={<MoneyRows values={summary.averageDealValueByCurrency} />} detail="Accepted values in the period, separated by currency." />
        <AnalyticsKpi label="Average acceptance time" value={summary.averageResponseHours ? `${summary.averageResponseHours}h` : "Unavailable"} detail="Time from request creation to the first recorded creator response." />
        <AnalyticsKpi label="Completed value" value={<MoneyRows values={summary.completedValueByCurrency} />} detail="Completed marketplace value, separated by currency." />
      </section>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <AnalyticsTrend points={summary.trend} title="Collaboration creation over time" />
        <AnalyticsCurrencyTrend points={summary.trend} title="Completed marketplace value over time" />
        <AnalyticsBars title="Cumulative marketplace funnel" items={summary.funnel.map((item) => ({ label: item.label, value: item.count, conversion: item.conversion }))} />
        <AnalyticsTrend points={registrations} title="User registrations over time" />
        <AnalyticsTrend points={verifications} title="Verification submitted vs approved" />
        <AnalyticsBars title="Operational health" items={[{ label: "Pending verification", value: totals.pendingVerifications }, { label: "Stale 14+ days", value: totals.stale }, { label: "Past deadline", value: totals.pastDeadline }]} />
        <AnalyticsInsights insights={analytics.insights} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/admin/verification" className="bridge-button-secondary">Review verification backlog</Link>
        <Link href="/admin/collaborations" className="bridge-button-secondary">Review collaborations</Link>
      </div>
    </div>
  );
}
