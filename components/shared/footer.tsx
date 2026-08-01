import Link from "next/link";

import { CONTACT_EMAILS } from "@/lib/constants";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Creators", href: "/creators" },
      { label: "Brands", href: "/#for-brands" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[#09090d]" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          <div>
            <Link href="/" className="font-display text-xl font-black tracking-tight">Branzzo</Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              A creator-first marketplace for clearer discovery, trusted profiles, and transparent collaboration.
            </p>
            <a className="mt-5 inline-block text-sm font-semibold text-cyan-100 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300" href={`mailto:${CONTACT_EMAILS.support}`}>
              {CONTACT_EMAILS.support}
            </a>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={`${column.title} links`}>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">{column.title}</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.label}><Link href={link.href} className="text-[var(--text-secondary)] hover:text-white">{link.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)]">
          <p>© 2026 Branzzo</p>
        </div>
      </div>
    </footer>
  );
}
