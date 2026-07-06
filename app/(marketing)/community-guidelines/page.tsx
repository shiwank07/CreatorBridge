import Link from "next/link";
import { Flag, Handshake, MessageSquareWarning, ShieldCheck } from "lucide-react";

import { CONTACT_EMAILS, LEGAL_LAST_UPDATED } from "@/lib/constants";

export const metadata = {
  title: "Community Guidelines",
  description: "Branzzo Community Guidelines for brands and creators.",
};

const guidelineSections = [
  {
    title: "Be honest about identity and fit",
    items: [
      "Use your real creator, brand, company, agency, or representative identity.",
      "Keep profile details, campaign details, social links, rates, availability, and contact information accurate.",
      "Do not impersonate creators, brands, agencies, team members, or Branzzo staff.",
      "Do not exaggerate metrics, audience quality, brand authority, budgets, deliverables, timelines, or approvals.",
    ],
  },
  {
    title: "Collaborate with respect",
    items: [
      "Use professional language and give people enough context to make informed decisions.",
      "Respect declines, negotiation boundaries, response time, creator availability, and brand review processes.",
      "Do not harass, pressure, threaten, shame, dox, discriminate against, or exploit another user.",
      "Do not send repeated unsolicited pitches, spam, or irrelevant requests.",
    ],
  },
  {
    title: "Create responsible campaigns",
    items: [
      "Brands should provide clear briefs, deliverables, usage rights, approval steps, disclosure expectations, and payment terms before work starts.",
      "Creators should disclose sponsored content where required and follow the rules of the platforms where content is published.",
      "Do not coordinate fake reviews, fake engagement, undisclosed advertising, illegal claims, or deceptive endorsements.",
      "Campaigns involving regulated, sensitive, or age-restricted products must follow all applicable laws and platform policies.",
    ],
  },
  {
    title: "Protect privacy and confidential information",
    items: [
      "Do not share private emails, phone numbers, documents, contracts, screenshots, or internal campaign information without permission.",
      "Do not request passwords, one-time codes, banking credentials, private account access, or unnecessary personal information.",
      "Use Branzzo contact-sharing and workflow tools as intended, especially before a collaboration is accepted.",
    ],
  },
  {
    title: "Report safety, fraud, and policy concerns",
    items: [
      "Report suspected fraud, impersonation, harassment, non-payment, fake metrics, phishing, or unsafe campaigns as soon as possible.",
      "Include profile links, account emails, collaboration references, screenshots, and a concise timeline when available.",
      "Do not make false reports or use reporting tools to intimidate another user in a business dispute.",
    ],
  },
  {
    title: "Enforcement",
    items: [
      "Branzzo may remove content, limit features, pause collaborations, reject verification, suspend accounts, or terminate access when these Guidelines are violated.",
      "Serious or repeated violations may lead to permanent removal from the platform.",
      "Branzzo may consider context, severity, user history, available evidence, and risk to the community when deciding what action to take.",
    ],
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <main className="relative overflow-hidden bg-[#05050d]">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-25" />
      <section className="bridge-section relative py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="bridge-eyebrow">Community Guidelines</p>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">
            A professional standard for creator collaboration.
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">
            Branzzo works best when brands and creators bring accurate information, respectful communication, and
            realistic expectations to every conversation. These Guidelines explain the conduct we expect on the platform.
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--text-muted)]">Last updated: {LEGAL_LAST_UPDATED}</p>
        </div>
      </section>

      <section className="bridge-section relative pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Accurate profiles", icon: ShieldCheck },
            { label: "Respectful outreach", icon: Handshake },
            { label: "Responsible campaigns", icon: Flag },
            { label: "Useful reports", icon: MessageSquareWarning },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="bridge-card bridge-card-hover p-5">
              <Icon size={22} className="text-cyan-100" />
              <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bridge-section relative pt-0">
        <div className="grid gap-4">
          {guidelineSections.map((section) => (
            <article key={section.title} className="bridge-panel p-5 sm:p-6">
              <h2 className="font-display text-2xl font-bold">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                {section.items.map((item) => (
                  <li key={item} className="border-l border-emerald-300/25 pl-4">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[8px] border border-[var(--border)] bg-[rgba(8,11,17,0.76)] p-5 text-sm leading-6 text-[var(--text-secondary)] sm:p-6">
          To report a concern, contact{" "}
          <a href={`mailto:${CONTACT_EMAILS.support}`} className="font-semibold text-cyan-100 hover:text-cyan-50">
            {CONTACT_EMAILS.support}
          </a>
          {" "}or use the{" "}
          <Link href="/contact" className="font-semibold text-cyan-100 hover:text-cyan-50">
            Contact Us
          </Link>
          {" "}page.
        </div>
      </section>
    </main>
  );
}
