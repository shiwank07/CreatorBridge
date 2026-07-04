import Link from "next/link";
import { ArrowRight, Building2, ClipboardList, Flag, Mail, ShieldCheck, UserCog, Users } from "lucide-react";

import { getAdminMetrics } from "@/lib/queries/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const metrics = await getAdminMetrics();
  const cards = [
    { label: "Total Creators", value: metrics.totalCreators, icon: Users },
    { label: "Total Brands", value: metrics.totalBrands, icon: Building2 },
    { label: "Active Collaborations", value: metrics.activeCollaborations, icon: ClipboardList },
    { label: "Pending Verifications", value: metrics.pendingVerifications, icon: ShieldCheck },
    { label: "Open Reports", value: metrics.openReports, icon: Flag },
    { label: "Emails Sent Today", value: metrics.emailsSentToday, icon: Mail },
  ];
  const sections = [
    {
      href: "/admin/creators",
      title: "Creators",
      description: "Review creator identity, account status, and public visibility.",
      icon: Users,
    },
    {
      href: "/admin/brands",
      title: "Brands",
      description: "Review brand verification, profile visibility, and suspensions.",
      icon: Building2,
    },
    {
      href: "/admin/collaborations",
      title: "Collaborations",
      description: "Track brand, creator, budget, status, and update timing.",
      icon: ClipboardList,
    },
    {
      href: "/admin/verification",
      title: "Verification Queue",
      description: "Process pending creator verification submissions.",
      icon: ShieldCheck,
    },
    {
      href: "/admin/reports",
      title: "Reports",
      description: "Resolve delivery issues and suspend reported users when needed.",
      icon: Flag,
    },
    {
      href: "/admin/email-logs",
      title: "Email Logs",
      description: "Inspect notification delivery status and retry failed sends.",
      icon: Mail,
    },
    {
      href: "/admin/users",
      title: "Users",
      description: "Search, filter, suspend, hide, and restore creator or brand accounts.",
      icon: UserCog,
    },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase text-violet-300">Project Halo Admin</p>
          <h1 className="mt-3 font-display text-4xl font-black">Overview</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Monitor accounts, verification, collaboration activity, reports, and email delivery.
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

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="bridge-card bridge-card-hover p-5">
              <Icon size={21} className="text-violet-300" />
              <h2 className="mt-4 font-display text-xl font-bold">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{section.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300">
                Open
                <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
