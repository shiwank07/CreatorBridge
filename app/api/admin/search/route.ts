import { NextResponse } from "next/server";

import { getAdminState } from "@/lib/admin";
import { searchAdminDirectory } from "@/lib/queries/admin";

export async function GET(req: Request) {
  const admin = await getAdminState();
  if (!admin.isAdmin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const results = await searchAdminDirectory(searchParams.get("q") ?? "");

  return NextResponse.json({ results });
}
