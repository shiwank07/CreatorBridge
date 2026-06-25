import { NextResponse } from "next/server";

import { getCreators } from "@/lib/queries/creators";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const creators = await getCreators({
    search: url.searchParams.get("q") ?? undefined,
    niche: url.searchParams.get("niche") ?? undefined,
    platform: url.searchParams.get("platform") ?? undefined,
    country: url.searchParams.get("country") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    openToDeals: url.searchParams.get("open") === "true",
    limit: Number(url.searchParams.get("limit") ?? 24),
  });

  return NextResponse.json({ creators });
}
