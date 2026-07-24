import Link from "next/link";
import { ArrowRight, CalendarDays, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { ANALYTICS_RANGES, formatAnalyticsBucket, type AnalyticsPeriod, type AnalyticsSeriesPoint, type MoneyTotal } from "@/lib/analytics/core";

type Change = { value: number; mode: "absolute" | "percent"; available: boolean };
const SERIES_COLORS = ["bg-cyan-300", "bg-violet-400", "bg-emerald-300", "bg-rose-300", "bg-amber-300"];

export function formatMoneyGroup(group: Pick<MoneyTotal, "currency" | "amount">) {
  if (group.currency === "UNKNOWN") return `Unknown currency ${group.amount.toLocaleString()}`;
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: group.currency, maximumFractionDigits: 0 }).format(group.amount);
  } catch {
    return `${group.currency} ${group.amount.toLocaleString()}`;
  }
}

export function MoneyRows({ values, empty = "No value recorded" }: { values: MoneyTotal[]; empty?: string }) {
  if (!values.length) return <span>{empty}</span>;
  return <span className="grid gap-1">{values.map((group) => <span key={group.currency}>{formatMoneyGroup(group)}</span>)}</span>;
}

export function AnalyticsRangeFilter({ active, pathname }: { active: string; pathname: string }) {
  const labels = { "7d": "7 days", "30d": "30 days", "90d": "90 days", year: "This year", all: "All time" };
  return (
    <nav aria-label="Analytics date range" className="flex max-w-full gap-2 overflow-x-auto pb-1">
      {ANALYTICS_RANGES.map((range) => (
        <Link key={range} href={`${pathname}?range=${range}`} className={active === range ? "bridge-button-primary shrink-0" : "bridge-button-secondary shrink-0"}>
          {labels[range]}
        </Link>
      ))}
    </nav>
  );
}

export function AnalyticsHeader({ title, description, period, pathname }: { title: string; description: string; period: AnalyticsPeriod; pathname: string }) {
  return (
    <header className="rounded-[8px] border border-cyan-300/15 bg-white/[0.045] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div className="max-w-3xl">
          <p className="bridge-eyebrow">Analytics · UTC</p>
          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--text-muted)]"><CalendarDays size={14} />{period.label}; dates are calculated in UTC and displayed in your locale.</p>
        </div>
        <AnalyticsRangeFilter active={period.key} pathname={pathname} />
      </div>
    </header>
  );
}

function changeLabel(change?: Change) {
  if (!change?.available) return "Comparison unavailable";
  const prefix = change.value > 0 ? "+" : "";
  return change.mode === "percent" ? `${prefix}${change.value}% vs previous period` : `${prefix}${change.value} vs previous period`;
}

export function AnalyticsKpi({ label, value, detail, change }: { label: string; value: ReactNode; detail: string; change?: Change }) {
  const positive = Boolean(change && change.value >= 0);
  return (
    <article data-testid="analytics-kpi" data-label={label} className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 break-words font-mono text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{detail}</p>
      {change ? <p className={`mt-2 inline-flex items-center gap-1 text-xs ${change.available ? positive ? "text-emerald-200" : "text-rose-200" : "text-[var(--text-muted)]"}`}>{change.available ? positive ? <TrendingUp size={13} /> : <TrendingDown size={13} /> : null}{changeLabel(change)}</p> : null}
    </article>
  );
}

export function AnalyticsTrend({ points, title }: { points: AnalyticsSeriesPoint[]; title: string }) {
  const seriesNames = [...new Set(points.flatMap((point) => Object.keys(point.series)))];
  const max = Math.max(1, ...points.flatMap((point) => Object.values(point.series)));
  return (
    <section data-testid="analytics-chart" className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <p className="bridge-eyebrow">Trend</p>
      <h2 className="mt-2 font-display text-xl font-bold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[var(--text-muted)]">
        {seriesNames.map((series, index) => <span key={series} className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-sm ${SERIES_COLORS[index % SERIES_COLORS.length]}`} />{series}</span>)}
      </div>
      {points.length < 2 ? (
        <div className="mt-5 rounded-[8px] border border-dashed border-white/10 p-8 text-center text-sm text-[var(--text-secondary)]">At least two activity points are needed for a meaningful trend.</div>
      ) : (
        <div className="mt-6 flex h-56 min-w-0 items-end gap-2 overflow-hidden" role="img" aria-label={`${title} bar chart`}>
          {points.map((point) => (
              <div key={point.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                <div className="flex h-[85%] items-end justify-center gap-px">
                  {seriesNames.map((series, index) => {
                    const value = point.series[series] ?? 0;
                    return <span key={series} title={`${formatAnalyticsBucket(point.label)} · ${series}: ${value}`} className={`min-h-1 flex-1 rounded-t ${SERIES_COLORS[index % SERIES_COLORS.length]}`} style={{ height: `${Math.max(2, (value / max) * 100)}%` }} />;
                  })}
                </div>
                <span className="truncate text-center text-[9px] text-[var(--text-muted)]">{formatAnalyticsBucket(point.label)}</span>
              </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AnalyticsCurrencyTrend({ points, title }: { points: AnalyticsSeriesPoint[]; title: string }) {
  const currencies = [...new Set(points.flatMap((point) => Object.keys(point.currencySeries ?? {})))];
  const max = Math.max(1, ...points.flatMap((point) => Object.values(point.currencySeries ?? {})));
  return (
    <section data-testid="analytics-chart" className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <p className="bridge-eyebrow">Trend by currency</p>
      <h2 className="mt-2 font-display text-xl font-bold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[var(--text-muted)]">{currencies.map((currency, index) => <span key={currency} className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-sm ${SERIES_COLORS[index % SERIES_COLORS.length]}`} />{currency}</span>)}</div>
      {points.filter((point) => point.currencySeries && Object.keys(point.currencySeries).length).length < 2 ? (
        <div className="mt-5 rounded-[8px] border border-dashed border-white/10 p-8 text-center text-sm text-[var(--text-secondary)]">At least two value points are needed for a meaningful trend.</div>
      ) : (
        <div className="mt-6 flex h-56 min-w-0 items-end gap-2 overflow-hidden" role="img" aria-label={`${title} bar chart`}>
          {points.map((point) => <div key={point.label} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
            <div className="flex h-[85%] items-end justify-center gap-px">{currencies.map((currency, index) => {
              const value = point.currencySeries?.[currency] ?? 0;
              return <span key={currency} title={`${formatAnalyticsBucket(point.label)} · ${formatMoneyGroup({ currency, amount: value })}`} className={`min-h-1 flex-1 rounded-t ${SERIES_COLORS[index % SERIES_COLORS.length]}`} style={{ height: `${Math.max(2, (value / max) * 100)}%` }} />;
            })}</div>
            <span className="truncate text-center text-[9px] text-[var(--text-muted)]">{formatAnalyticsBucket(point.label)}</span>
          </div>)}
        </div>
      )}
    </section>
  );
}

export function AnalyticsBars({ title, items }: { title: string; items: Array<{ label: string; value: number; conversion?: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <section className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-[var(--text-secondary)]">{item.label.replaceAll("_", " ")}</span><span className="shrink-0 font-mono">{item.value}{item.conversion !== undefined ? ` · ${item.conversion}%` : ""}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-violet-400" style={{ width: `${(item.value / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AnalyticsInsights({ insights }: { insights: string[] }) {
  return (
    <section className="rounded-[8px] border border-amber-300/15 bg-amber-300/[0.05] p-5">
      <div className="flex items-center gap-2"><Lightbulb size={18} className="text-amber-200" /><h2 className="font-display text-xl font-bold">Actionable insights</h2></div>
      <ul className="mt-4 grid gap-3">{insights.slice(0, 5).map((insight) => <li key={insight} className="rounded-[8px] border border-white/10 bg-black/20 p-3 text-sm leading-6 text-[var(--text-secondary)]">{insight}</li>)}</ul>
    </section>
  );
}

export function AnalyticsEmpty({ role }: { role: "creator" | "brand" }) {
  const creator = role === "creator";
  return (
    <div className="rounded-[8px] border border-dashed border-white/10 p-8 text-center">
      <h2 className="font-display text-xl font-bold">No activity in this period</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{creator ? "Complete your profile and enable collaborations to start receiving offers." : "Discover creators and send your first collaboration request."}</p>
      <Link href={creator ? "/dashboard/creator/edit" : "/creators"} className="bridge-button-primary mt-5">{creator ? "Complete profile" : "Discover creators"}<ArrowRight size={16} /></Link>
    </div>
  );
}
