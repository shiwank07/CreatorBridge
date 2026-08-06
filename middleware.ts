import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { clerkConfigurationIssue, hasClerkKeys } from "@/lib/clerk-config";

const isProtectedRoute = createRouteMatcher(["/onboarding(.*)", "/admin(.*)", "/dashboard(.*)", "/notifications(.*)"]);
const isStaticPublicRoute = createRouteMatcher([
  "/", "/about", "/contact", "/privacy", "/terms", "/cookies", "/trust-safety",
  "/community-guidelines", "/pricing", "/robots.txt", "/sitemap.xml", "/account-unavailable",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isStaticPublicRoute(req)) return NextResponse.next();

  if (process.env.NODE_ENV === "production" && clerkConfigurationIssue()) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication service is unavailable." }, { status: 503 });
    }
    if (isProtectedRoute(req) || ["/sign-in", "/sign-up", "/sso-callback", "/auth/complete"].some((path) => req.nextUrl.pathname.startsWith(path))) {
      const unavailable = new URL("/account-unavailable", req.url);
      unavailable.searchParams.set("returnTo", `${req.nextUrl.pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(unavailable);
    }
  }
  if (!hasClerkKeys()) return NextResponse.next();
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
