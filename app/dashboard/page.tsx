import { redirect } from "next/navigation";

import { AccountUnavailable } from "@/components/shared/account-unavailable";
import { accountDestination, getApplicationAccountState } from "@/lib/application-account-state";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
  description: "Open your Branzzo collaboration dashboard.",
};

export default async function DashboardPage() {
  const state = await getApplicationAccountState();
  const destination = accountDestination(state);
  if (destination) redirect(destination);
  if (state.status === "temporarily_unavailable") return <AccountUnavailable retryHref="/dashboard" />;
  redirect("/sign-in?redirect_url=%2Fdashboard");

}
