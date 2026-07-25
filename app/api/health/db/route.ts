import { NextResponse } from "next/server";

import { hasMongoUri, verifyDBConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasMongoUri()) {
    return NextResponse.json(
      { ok: false, status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const startedAt = Date.now();

  try {
    await verifyDBConnection();
    return NextResponse.json(
      { ok: true, status: "ready", latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
