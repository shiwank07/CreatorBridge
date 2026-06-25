import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-errors";
import { hasMongoUri, verifyDBConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!hasMongoUri()) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          error: "MongoDB is not configured yet.",
        },
        { status: 503 },
      );
    }

    const status = await verifyDBConnection();

    return NextResponse.json({
      ok: true,
      configured: true,
      database: status.database,
      readyState: status.readyState,
    });
  } catch (error) {
    return handleRouteError(error, "Database health check failed", "Could not verify database connection.");
  }
}
