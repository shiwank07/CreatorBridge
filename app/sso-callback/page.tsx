"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/auth/complete"
        signUpFallbackRedirectUrl="/auth/complete"
      />
    </main>
  );
}
