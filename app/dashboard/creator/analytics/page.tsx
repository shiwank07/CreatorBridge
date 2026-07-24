import { redirect } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, Clock3 } from "lucide-react";

import { AnalyticsBars, AnalyticsCurrencyTrend, AnalyticsEmpty, AnalyticsHeader, AnalyticsInsights, AnalyticsKpi, AnalyticsTrend, MoneyRows } from "@/components/analytics/analytics-dashboard";
import { Navbar } from "@/components/shared/navbar";
import { getCreatorAnalytics } from "@/lib/analytics/service";
import { hasPeriodAnalyticsActivity } from "@/lib/analytics/core";
import { getCurrentAppUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";
export const metadata = { title: "Creator Analytics" };

export default async function CreatorAnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "creator") redirect(user.role === "brand" ? "/dashboard/brand/analytics" : "/dashboard");
  const { range } = await searchParams;
  const analytics = await getCreatorAnalytics(range);
  if (!analytics) redirect("/dashboard/creator");
  const { summary } = analytics;
  const hasPeriodActivity = hasPeriodAnalyticsActivity(summary);
  return (
    <>
      <Navbar />
      <main className="bridge-section max-w-7xl">
        <AnalyticsHeader title="Creator analytics" description="Understand offer conversion, collaboration value, response speed, profile demand, and the actions that can improve your pipeline." period={analytics.period} pathname="/dashboard/creator/analytics" />
        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnalyticsKpi label="Offers received" value={summary.total} detail="Non-draft collaboration requests created in this period." change={analytics.changes.offers} />
          <AnalyticsKpi label="Accepted" value={summary.accepted} detail={`${summary.active} currently active collaborations.`} />
          <AnalyticsKpi label="Active" value={summary.active} detail="Accepted work that has not reached completion." />
          <AnalyticsKpi label="Completed" value={summary.completed} detail="Collaborations completed in the selected period." />
          <AnalyticsKpi label="Rejected" value={summary.rejected} detail="Creator rejection events recorded in this period." />
          <AnalyticsKpi label="Acceptance rate" value={`${summary.acceptanceRate}%`} detail="Accepted offers divided by accepted plus declined decisions." change={analytics.changes.acceptance} />
          <AnalyticsKpi label="Terminal success rate" value={`${summary.completionRate}%`} detail="Completions divided by completions plus cancellations recorded in this period." />
          <AnalyticsKpi label="Average accepted deal" value={<MoneyRows values={summary.averageDealValueByCurrency} />} detail="Average accepted value in this period, separated by currency." />
          <AnalyticsKpi label="Completed value" value={<MoneyRows values={summary.completedValueByCurrency} />} detail="Value completed in this period, separated by currency." />
          <AnalyticsKpi label="Response time" value={summary.averageResponseHours ? `${summary.averageResponseHours}h` : "Unavailable"} detail="Average time from offer creation to first creator response." />
          <AnalyticsKpi label="Saved by brands · All-time" value={analytics.savedCount} detail="Current brand shortlists containing your creator account." />
          <AnalyticsKpi label="Verification" value={analytics.verificationStatus} detail={`${analytics.profileViews} tracked profile views; lifetime counter.`} />
        </section>
        {!hasPeriodActivity ? <div className="mt-5"><AnalyticsEmpty role="creator" /></div> : (
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <AnalyticsTrend points={summary.trend} title="Offers received over time" />
            <AnalyticsCurrencyTrend points={summary.trend} title="Completed deal value over time" />
            <AnalyticsBars title="Creator cumulative lifecycle funnel" items={analytics.creatorFunnel.map((item) => ({ label: item.label, value: item.count, conversion: item.conversion }))} />
            <AnalyticsBars title="Current status snapshot" items={summary.distribution} />
            <AnalyticsInsights insights={analytics.insights} />
          </div>
        )}
        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { label: "Pending actions", value: analytics.pendingActions, Icon: BriefcaseBusiness },
            { label: "Upcoming deadlines", value: analytics.upcoming.length, Icon: Clock3 },
            { label: "Verification signal", value: analytics.verificationStatus === "verified" ? 1 : 0, Icon: BadgeCheck },
          ].map(({ label, value, Icon }) => <div key={label} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4"><Icon size={18} className="text-cyan-200" /><p className="mt-3 font-mono text-2xl font-bold">{value}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{label}</p></div>)}
        </section>
      </main>
    </>
  );
}
