"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

import { emptyNavigationContext, parseNavigationContext, type NavigationContext } from "@/lib/navigation-context";

export function useNavigationContext() {
  const { isLoaded: authLoaded, isSignedIn, sessionClaims, sessionId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const parsed = useMemo(() => parseNavigationContext({ sessionClaims, publicMetadata: user?.publicMetadata }), [sessionClaims, user?.publicMetadata]);
  const [fallback, setFallback] = useState<{ sessionId: string; context: NavigationContext } | null>(null);

  useEffect(() => {
    if (!authLoaded || !userLoaded || !isSignedIn) return;
    const controller = new AbortController();
    fetch("/api/navigation-context", { credentials: "same-origin", signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("navigation context unavailable")))
      .then((data: unknown) => {
        const resolved = parseNavigationContext({ publicMetadata: data });
        if (sessionId) setFallback({ sessionId, context: resolved ?? emptyNavigationContext(true) });
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) return;
      });
    return () => controller.abort();
  }, [authLoaded, isSignedIn, parsed, sessionId, userLoaded]);

  if (!authLoaded || !userLoaded) return emptyNavigationContext(false);
  if (!isSignedIn) return emptyNavigationContext(true);
  return (fallback?.sessionId === sessionId ? fallback.context : null) ?? parsed ?? emptyNavigationContext(false);
}
