import { redirect } from "next/navigation";

import { getAdminState } from "@/lib/admin";
import { getCurrentAppUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AuthCompletePage() {
  const admin = await getAdminState();
  if (!admin.userId) redirect("/sign-in");
  if (admin.isAdmin) redirect("/admin");

  const user = await getCurrentAppUser();
  if (!user?.onboardingComplete) redirect("/onboarding");
  if (user.role === "creator") redirect("/dashboard/creator");
  if (user.role === "brand") redirect("/dashboard/brand");

  redirect("/onboarding");
}
