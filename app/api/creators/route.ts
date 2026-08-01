import { NextResponse } from "next/server";

import { getCreatorDiscoveryPage } from "@/lib/queries/creators";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const result = await getCreatorDiscoveryPage({
    search: url.searchParams.get("q") ?? undefined,
    niche: url.searchParams.get("niche") ?? undefined,
    platform: url.searchParams.get("platform") ?? undefined,
    country: url.searchParams.get("country") ?? undefined,
    language: url.searchParams.get("language") ?? undefined,
    verification: (url.searchParams.get("verification") as "verified" | "unverified" | null) ?? undefined,
    availability: (url.searchParams.get("availability") as "open" | "closed" | null) ?? undefined,
    subscriberRange: url.searchParams.get("subs") ?? undefined,
    viewsRange: url.searchParams.get("views") ?? undefined,
    priceRange: url.searchParams.get("price") ?? undefined,
    engagementRange: url.searchParams.get("engagement") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    openToDeals: url.searchParams.get("open") === "true",
    page: Number(url.searchParams.get("page") ?? 1),
    pageSize: Number(url.searchParams.get("pageSize") ?? 30),
  });

  return NextResponse.json(result);
}
