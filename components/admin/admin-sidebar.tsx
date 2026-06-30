import Link from "next/link";
import { ClipboardList, LayoutDashboard, ShieldCheck, Users } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/creators", label: "Creators", icon: Users },
  { href: "/admin/verification", label: "Verification", icon: ShieldCheck },
  { href: "/admin/brand-verifications", label: "Brands", icon: ShieldCheck },
  { href: "/admin/inquiries", label: "Collaborations", icon: ClipboardList },
];

export function AdminSidebar() {
  return (
    <aside className="border-b border-[var(--border)] bg-[#0d0d14] lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5">
        <Link href="/" className="font-display text-lg font-bold">
          CreatorBridge
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
