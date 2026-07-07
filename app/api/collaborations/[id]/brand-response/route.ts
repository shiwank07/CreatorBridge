import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Offer changes are no longer supported. Creators can accept or decline the exact offer." },
    { status: 410 },
  );
}
