import { redirect } from "next/navigation";

import { AnalyticsBars, AnalyticsCurrencyTrend, AnalyticsEmpty, AnalyticsHeader, AnalyticsInsights, AnalyticsKpi, AnalyticsTrend, MoneyRows } from "@/components/analytics/analytics-dashboard";
import { Navbar } from "@/components/shared/navbar";
import { getBrandAnalytics } from "@/lib/analytics/service";
import { hasPeriodAnalyticsActivity } from "@/lib/analytics/core";
import { getCurrentAppUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";
export const metadata = { title: "Brand Analytics" };

export default async function BrandAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "brand") redirect(user.role === "creator" ? "/dashboard/creator/analytics" : "/dashboard");
  const { range } = await searchParams;
  const analytics = await getBrandAnalytics(range);
  if (!analytics) redirect("/dashboard/brand");
  const { summary } = analytics;
  const hasPeriodActivity = hasPeriodAnalyticsActivity(summary);
  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-7xl">
        <AnalyticsHeader title="Brand analytics" description="Measure creator response, request conversion, committed campaign value, completed spend, and the health of your collaboration pipeline." period={analytics.period} pathname="/dashboard/brand/analytics" />
        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnalyticsKpi label="Requests sent" value={summary.total} detail={`${analytics.uniqueCreators} unique creators contacted.`} change={analytics.changes.requests} />
          <AnalyticsKpi label="Accepted" value={summary.accepted} detail={`${summary.active} active collaborations.`} />
          <AnalyticsKpi label="Rejected" value={summary.rejected} detail="Creator-declined or cancelled requests." />
          <AnalyticsKpi label="Active" value={summary.active} detail="Accepted campaigns still in motion." />
          <AnalyticsKpi label="Completed" value={summary.completed} detail="Campaigns completed in the selected period." />
          <AnalyticsKpi label="Unique creators" value={analytics.uniqueCreators} detail="Distinct creator accounts contacted." />
          <AnalyticsKpi label="Acceptance rate" value={`${summary.acceptanceRate}%`} detail="Accepted requests divided by accepted plus rejected decisions." change={analytics.changes.acceptance} />
          <AnalyticsKpi label="Terminal success rate" value={`${summary.completionRate}%`} detail="Completions divided by completions plus cancellations recorded in this period." />
          <AnalyticsKpi label="Accepted budget" value={<MoneyRows values={summary.committedValueByCurrency} />} detail="Value accepted in this period, separated by currency." />
          <AnalyticsKpi label="Completed spend" value={<MoneyRows values={summary.completedValueByCurrency} />} detail="Value completed in this period, separated by currency." />
          <AnalyticsKpi label="Average accepted deal" value={<MoneyRows values={summary.averageDealValueByCurrency} />} detail="Average accepted value in this period, separated by currency." />
          <AnalyticsKpi label="Creator response" value={summary.averageResponseHours ? `${summary.averageResponseHours}h` : "Unavailable"} detail="Average time to the first meaningful creator response." />
          <AnalyticsKpi label="Saved creators · All-time" value={analytics.savedCount} detail="Creators currently saved to your shortlist." />
        </section>
        {!hasPeriodActivity ? <div className="mt-5"><AnalyticsEmpty role="brand" /></div> : (
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <AnalyticsTrend points={summary.trend} title="Requests sent over time" />
            <AnalyticsCurrencyTrend points={summary.trend} title="Completed spend over time" />
            <AnalyticsBars title="Cumulative collaboration funnel" items={summary.funnel.map((item) => ({ label: item.label, value: item.count, conversion: item.conversion }))} />
            <AnalyticsBars title="Most active creators" items={analytics.mostActive} />
            <AnalyticsInsights insights={analytics.insights} />
          </div>
        )}
      </main>
    </>
  );
}
