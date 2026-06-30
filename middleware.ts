import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { hasClerkKeys } from "@/lib/clerk-config";

const isProtectedRoute = createRouteMatcher(["/onboarding(.*)", "/admin(.*)", "/dashboard(.*)", "/notifications(.*)"]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!hasClerkKeys()) return NextResponse.next();
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
