import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { BranzzoLogo } from "@/components/branding/branzzo-logo";
import { AuthSetupNotice } from "@/components/shared/auth-setup-notice";
import { getRedirectParam, safeInternalRedirect } from "@/lib/auth-redirect";
import { hasClerkKeys } from "@/lib/clerk-config";

type AuthSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignUpPage({ searchParams }: { searchParams: AuthSearchParams }) {
  if (!hasClerkKeys()) return <AuthSetupNotice />;

  const params = await searchParams;
  const requestedRedirect = getRedirectParam(params);
  const redirectUrl = safeInternalRedirect(requestedRedirect, "/onboarding");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" aria-label="Branzzo home" className="mb-6">
        <BranzzoLogo showWordmark size={52} priority wordmarkClassName="text-xl" />
      </Link>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={requestedRedirect ? redirectUrl : undefined}
      />
    </main>
  );
}
