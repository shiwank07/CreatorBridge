export function formatNumber(n?: number | null): string {
  if (!n || n <= 0) return "0";
  if (n >= 1_000_000) {
    const value = n / 1_000_000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export function formatINR(n?: number | null): string {
  const value = n ?? 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function timeAgo(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31_536_000 },
    { label: "month", seconds: 2_592_000 },
    { label: "day", seconds: 86_400 },
    { label: "hour", seconds: 3_600 },
    { label: "minute", seconds: 60 },
  ] as const;

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count === 1 ? "" : "s"} ago`;
  }

  return "just now";
}
