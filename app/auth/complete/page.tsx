import { redirect } from "next/navigation";

import { AccountUnavailable } from "@/components/shared/account-unavailable";
import { accountDestination, getApplicationAccountState } from "@/lib/application-account-state";

export const dynamic = "force-dynamic";

export default async function AuthCompletePage() {
  const state = await getApplicationAccountState();
  const destination = accountDestination(state);
  if (destination) redirect(destination);
  if (state.status === "temporarily_unavailable") return <AccountUnavailable retryHref="/auth/complete" />;
  redirect("/sign-in");
}
