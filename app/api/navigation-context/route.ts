import { NextResponse } from "next/server";

import { getApplicationAccountState } from "@/lib/application-account-state";

export async function GET() {
  const state = await getApplicationAccountState();
  const headers = { "Cache-Control": "private, no-store" };
  if (state.status === "anonymous") return NextResponse.json({ role: null, username: null, onboardingComplete: false }, { status: 401, headers });
  if (state.status === "temporarily_unavailable") return NextResponse.json({ code: "DATABASE_UNAVAILABLE", retryable: true }, { status: 503, headers });
  if (state.status === "account_restricted") return NextResponse.json({ role: null, username: null, onboardingComplete: false }, { status: 403, headers });
  if (state.status === "needs_onboarding") return NextResponse.json({ role: null, username: null, onboardingComplete: false }, { headers });
  return NextResponse.json({ role: state.status, username: "username" in state ? state.username : null, onboardingComplete: true }, { headers });
}
