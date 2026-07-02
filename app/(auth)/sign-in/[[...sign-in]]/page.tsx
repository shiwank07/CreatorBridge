import { SignIn } from "@clerk/nextjs";

import { AuthSetupNotice } from "@/components/shared/auth-setup-notice";
import { getRedirectParam, safeInternalRedirect } from "@/lib/auth-redirect";
import { hasClerkKeys } from "@/lib/clerk-config";

type AuthSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignInPage({ searchParams }: { searchParams: AuthSearchParams }) {
  if (!hasClerkKeys()) return <AuthSetupNotice />;

  const params = await searchParams;
  const requestedRedirect = getRedirectParam(params);
  const redirectUrl = safeInternalRedirect(requestedRedirect, "/onboarding");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
        fallbackRedirectUrl={redirectUrl}
        forceRedirectUrl={requestedRedirect ? redirectUrl : undefined}
      />
    </main>
  );
}
