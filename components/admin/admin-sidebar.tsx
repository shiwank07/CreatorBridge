import Link from "next/link";
import { Building2, ClipboardList, Flag, LayoutDashboard, Mail, ShieldCheck, UserCog, Users } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/creators", label: "Creators", icon: Users },
  { href: "/admin/brands", label: "Brands", icon: Building2 },
  { href: "/admin/collaborations", label: "Collaborations", icon: ClipboardList },
  { href: "/admin/verification", label: "Verification Queue", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/email-logs", label: "Email Logs", icon: Mail },
  { href: "/admin/users", label: "Users", icon: UserCog },
];

export function AdminSidebar() {
  return (
    <aside className="border-b border-[var(--border)] bg-[#0d0d14] lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5">
        <Link href="/" className="font-display text-lg font-bold">
          Branzzo
        </Link>
        <p className="hidden text-xs text-[var(--text-secondary)] lg:mt-1 lg:block">Admin</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-2 lg:px-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring flex shrink-0 items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:border-transparent"
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
