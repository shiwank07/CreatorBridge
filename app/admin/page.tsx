import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardList, Crown, ShieldCheck, Users } from "lucide-react";

import { getAdminMetrics } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const metrics = await getAdminMetrics();
  const cards = [
    { label: "Creators", value: metrics.creators, icon: Users },
    { label: "Featured", value: metrics.featuredCreators, icon: Crown },
    { label: "Verified", value: metrics.verifiedCreators, icon: BadgeCheck },
    { label: "Pending Verification", value: metrics.pendingVerifications, icon: ShieldCheck },
    { label: "Pending Brands", value: metrics.pendingBrandVerifications, icon: ShieldCheck },
    { label: "Open Collaborations", value: metrics.openInquiries, icon: ClipboardList },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-violet-300">Admin Dashboard</p>
          <h1 className="mt-3 font-display text-4xl font-black">Review marketplace activity</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Manage creator visibility and collaboration requests from one small control surface.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bridge-card p-5">
              <Icon size={22} className="text-violet-300" />
              <p className="mt-4 font-mono text-3xl font-bold">{card.value}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/creators" className="bridge-card bridge-card-hover p-5">
          <h2 className="font-display text-xl font-bold">Creator Controls</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Manage featured placement and creator profile visibility in public discovery.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
            Open creators
            <ArrowRight size={16} />
          </span>
        </Link>
        <Link href="/admin/verification" className="bridge-card bridge-card-hover p-5">
          <h2 className="font-display text-xl font-bold">Verification Queue</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Review YouTube ownership codes and manually approve claimed subscriber stats.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
            Open verification
            <ArrowRight size={16} />
          </span>
        </Link>
        <Link href="/admin/brand-verifications" className="bridge-card bridge-card-hover p-5">
          <h2 className="font-display text-xl font-bold">Brand Verification</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Review company websites, domains, and contact details before approving brand badges.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
            Open brands
            <ArrowRight size={16} />
          </span>
        </Link>
        <Link href="/admin/inquiries" className="bridge-card bridge-card-hover p-5">
          <h2 className="font-display text-xl font-bold">Collaboration Review</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Track collaboration requests from new review through follow-up and closure.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
            Open collaborations
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>
    </div>
  );
}
