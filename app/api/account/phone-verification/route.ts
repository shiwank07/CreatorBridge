import { NextResponse } from "next/server";

function unavailable() {
  return NextResponse.json({ error: "Phone verification is currently unavailable." }, { status: 503 });
}

export async function GET() {
  return unavailable();
}

export async function POST() {
  return unavailable();
}
