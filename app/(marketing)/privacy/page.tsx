import Link from "next/link";

import { CONTACT_EMAILS, LEGAL_LAST_UPDATED } from "@/lib/constants";

export const metadata = {
  title: "Privacy Policy",
  description: "Branzzo Privacy Policy.",
};

const privacySections = [
  {
    title: "Information we collect",
    items: [
      "Account information such as name, email address, username, role, authentication identifiers, and onboarding status.",
      "Creator profile information such as bio, niches, platforms, rates, public links, availability, audience details, and sample work you choose to provide.",
      "Brand profile information such as company name, website, industry, contact person, work email, country, campaign interests, and verification details.",
      "Collaboration and inquiry information such as campaign goals, deliverables, budget context, offer amounts, timelines, messages, workflow status, and review history.",
      "Trust and support information such as phone number, verification status, notes submitted for review, reports, admin actions, and support correspondence.",
      "Technical information such as device, browser, IP address, log data, cookies, session activity, and approximate location inferred from network or account details.",
    ],
  },
  {
    title: "How we use information",
    items: [
      "Operate Branzzo, create accounts, publish profiles, route collaboration requests, and provide dashboards.",
      "Help brands discover creators and help creators evaluate brand outreach with useful context.",
      "Verify trust signals, prevent abuse, investigate fraud, enforce our policies, and protect users and the platform.",
      "Send product, collaboration, notification, support, verification, and administrative messages.",
      "Improve our product, debug issues, measure performance, and understand how users move through core workflows.",
      "Comply with legal obligations, respond to lawful requests, and establish or defend legal claims.",
    ],
  },
  {
    title: "How information is shared",
    items: [
      "Public profile fields are visible to visitors and users when you publish a creator or brand profile.",
      "Collaboration details are shared with the creator, brand, and Branzzo team members who need them to operate or review the workflow.",
      "Contact information may be shared between a brand and creator only when the relevant workflow or user action allows it.",
      "Service providers may process information for authentication, hosting, database, email delivery, analytics, support, security, and infrastructure needs.",
      "Information may be shared when required by law, to protect rights and safety, to investigate abuse, or as part of a business transfer such as a merger or acquisition.",
      "We do not sell personal information as a standalone product.",
    ],
  },
  {
    title: "Your choices and rights",
    items: [
      "You can edit many profile and onboarding details from your account experience when those controls are available.",
      "You can choose what optional public profile information to provide, but some fields may be required to use core marketplace features.",
      "You can request access, correction, deletion, or export of personal information by contacting us, subject to identity verification and legal limits.",
      "You can unsubscribe from certain non-essential emails, but we may still send service, security, legal, and account messages.",
    ],
  },
  {
    title: "Retention",
    items: [
      "We keep information for as long as needed to provide Branzzo, support users, satisfy legal obligations, resolve disputes, and enforce agreements.",
      "Collaboration, trust, verification, fraud, and safety records may be retained longer when needed to protect users or document platform decisions.",
      "When deletion is available and appropriate, we may keep limited records where required for security, legal compliance, accounting, or abuse prevention.",
    ],
  },
  {
    title: "Security",
    items: [
      "We use administrative, technical, and organizational safeguards designed to protect information from unauthorized access, misuse, or loss.",
      "No online service can guarantee perfect security. Users should protect their login credentials and report suspected unauthorized access promptly.",
      "Private support phone numbers and verification notes are intended for trust, support, and urgent follow-up, not public display.",
    ],
  },
  {
    title: "Children and minors",
    items: [
      "Branzzo is intended for professional use and is not directed to children under 13.",
      "Users who are minors in their jurisdiction should use Branzzo only with appropriate parent, guardian, or legal representative involvement.",
    ],
  },
  {
    title: "International processing",
    items: [
      "Branzzo may process and store information in countries other than where you live.",
      "By using the platform, you understand that privacy laws and access rules may differ across jurisdictions.",
    ],
  },
  {
    title: "Changes to this policy",
    items: [
      "We may update this Privacy Policy as Branzzo changes. Material updates will be reflected by changing the last updated date and, when appropriate, providing additional notice.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="relative overflow-hidden bg-[#05050d]">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-25" />
      <section className="bridge-section relative py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="bridge-eyebrow">Privacy Policy</p>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">
            How Branzzo handles personal information.
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">
            This Privacy Policy explains what information Branzzo collects, how we use it, when we share it, and
            the choices users have when using our creator marketplace and collaboration tools.
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--text-muted)]">Last updated: {LEGAL_LAST_UPDATED}</p>
        </div>
      </section>

      <section className="bridge-section relative pt-0">
        <div className="grid gap-4">
          {privacySections.map((section) => (
            <article key={section.title} className="bridge-panel p-5 sm:p-6">
              <h2 className="font-display text-2xl font-bold">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                {section.items.map((item) => (
                  <li key={item} className="border-l border-cyan-300/25 pl-4">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[8px] border border-[var(--border)] bg-[rgba(8,11,17,0.76)] p-5 text-sm leading-6 text-[var(--text-secondary)] sm:p-6">
          For privacy questions or requests, contact{" "}
          <a href={`mailto:${CONTACT_EMAILS.legal}`} className="font-semibold text-cyan-100 hover:text-cyan-50">
            {CONTACT_EMAILS.legal}
          </a>
          . For product support, visit{" "}
          <Link href="/contact" className="font-semibold text-cyan-100 hover:text-cyan-50">
            Contact Us
          </Link>
          .
        </div>
      </section>
    </main>
  );
}
