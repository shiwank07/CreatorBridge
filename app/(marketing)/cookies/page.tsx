import Link from "next/link";

import { CONTACT_EMAILS, LEGAL_LAST_UPDATED } from "@/lib/constants";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata("Cookie Policy", "How Branzzo uses essential, authentication, analytics, and preference cookies across the creator marketplace.", "/cookies");

const categories = [
  {
    title: "Essential cookies",
    copy: "These support core security, request routing, fraud prevention, and reliable operation. Disabling them may prevent Branzzo from working.",
  },
  {
    title: "Authentication cookies",
    copy: "Clerk uses cookies and similar storage to keep you signed in, protect sessions, and complete authentication. These are necessary when you use an account.",
  },
  {
    title: "Analytics cookies",
    copy: "When enabled, analytics cookies help us understand aggregate traffic, feature usage, performance, and errors. Branzzo does not use this category to expose private profile or message content.",
  },
  {
    title: "Preference cookies",
    copy: "These remember choices such as display or interface preferences so you do not need to select them repeatedly.",
  },
];

export default function CookiePolicyPage() {
  return (
    <main className="relative overflow-hidden bg-[#05050d]">
      <section className="bridge-section py-16 sm:py-20">
        <p className="bridge-eyebrow">Cookie Policy</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-black sm:text-5xl">How Branzzo uses cookies.</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">
          Cookies are small pieces of data stored by your browser. This policy describes the categories Branzzo and its service providers may use.
        </p>
        <p className="mt-4 text-sm text-[var(--text-muted)]">Last updated: {LEGAL_LAST_UPDATED}</p>
      </section>
      <section className="bridge-section pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <article key={category.title} className="bridge-panel p-6">
              <h2 className="font-display text-2xl font-bold">{category.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{category.copy}</p>
            </article>
          ))}
        </div>
        <article className="bridge-panel mt-4 p-6">
          <h2 className="font-display text-2xl font-bold">Your controls and third parties</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
            You can remove or block cookies through your browser, although essential and authentication features may stop working. Providers including Clerk and our hosting or analytics services may set or read cookies under their own policies. We will update this page if our cookie use materially changes.
          </p>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Questions? Email <a className="text-cyan-100 hover:text-white" href={`mailto:${CONTACT_EMAILS.support}`}>{CONTACT_EMAILS.support}</a> or review our <Link href="/privacy" className="text-cyan-100 hover:text-white">Privacy Policy</Link>.
          </p>
        </article>
      </section>
    </main>
  );
}
