"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, ClipboardList, Flag, LayoutDashboard, Mail, Menu, ShieldCheck, UserCog, Users, X } from "lucide-react";

import { BranzzoLogo } from "@/components/branding/branzzo-logo";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/creators", label: "Creators", icon: Users },
  { href: "/admin/brands", label: "Brands", icon: Building2 },
  { href: "/admin/collaborations", label: "Collaborations", icon: ClipboardList },
  { href: "/admin/verification", label: "Verification Queue", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/email-logs", label: "Email Logs", icon: Mail },
  { href: "/admin/users", label: "Users", icon: UserCog },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>("a,button:not([disabled])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuButton?.focus();
    };
  }, [open]);

  function isActive(href: string) {
    return href === "/admin" ? pathname === href : pathname.startsWith(href);
  }

  const navigation = (
    <nav aria-label="Admin sections" className="space-y-2">
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={`focus-ring flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-semibold ${
              active ? "bg-violet-950/70 text-violet-100" : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon size={17} aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[#0d0d14] px-4 py-3 lg:hidden">
        <Link href="/admin" aria-label="Branzzo admin home">
          <BranzzoLogo showWordmark size={36} />
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Open admin menu"
          aria-expanded={open}
          aria-controls="admin-mobile-drawer"
          className="focus-ring rounded-[8px] border border-[var(--border)] p-2.5 text-[var(--text-primary)]"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </header>

      <aside className="hidden min-h-screen border-r border-[var(--border)] bg-[#0d0d14] lg:block">
        <div className="px-5 py-5">
          <Link href="/admin" aria-label="Branzzo admin home">
            <BranzzoLogo showWordmark size={40} />
          </Link>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Admin</p>
        </div>
        <div className="px-3">{navigation}</div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" aria-label="Close admin menu" onClick={() => setOpen(false)} />
          <div
            ref={drawerRef}
            id="admin-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 w-[min(88vw,340px)] overflow-y-auto border-r border-[var(--border)] bg-[#0d0d14] p-4 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <BranzzoLogo showWordmark size={36} />
              <button type="button" aria-label="Close admin menu" className="focus-ring rounded-[8px] p-2" onClick={() => setOpen(false)}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {navigation}
          </div>
        </div>
      ) : null}
    </>
  );
}
