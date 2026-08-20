import type { Metadata } from "next";

import { AccountUnavailable } from "@/components/shared/account-unavailable";
import { safeInternalRedirect } from "@/lib/auth-redirect";

export const metadata: Metadata = {
  title: "Account Unavailable",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccountUnavailablePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  return <AccountUnavailable retryHref={safeInternalRedirect(returnTo, "/")} />;
}
