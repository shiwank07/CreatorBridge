import Link from "next/link";

import { CONTACT_EMAILS, LEGAL_LAST_UPDATED } from "@/lib/constants";

export const metadata = {
  title: "Terms of Service",
  description: "Branzzo Terms of Service.",
};

const termsSections = [
  {
    title: "Acceptance and eligibility",
    items: [
      "By accessing or using Branzzo, you agree to these Terms of Service and any policies referenced here.",
      "You must provide accurate account information and have authority to use Branzzo on behalf of yourself or the company, creator business, agency, or organization you represent.",
      "Branzzo is designed for professional creator collaboration. If you are a minor where you live, you must use the platform only with appropriate parent, guardian, or legal representative involvement.",
    ],
  },
  {
    title: "Brand responsibilities",
    items: [
      "Brands must provide accurate company, contact, campaign, budget, timeline, deliverable, and website information.",
      "Brands are responsible for ensuring campaign briefs, products, claims, usage rights, approvals, disclosures, and creator instructions comply with applicable laws and platform rules.",
      "Brands must not pressure creators into undisclosed advertising, unsafe claims, misleading endorsements, fake engagement, or work that violates community rules.",
      "Brands are responsible for honoring accepted collaboration terms, payment commitments, product delivery, review windows, and any separate written agreements with creators.",
    ],
  },
  {
    title: "Creator responsibilities",
    items: [
      "Creators must provide accurate profile, audience, niche, platform, rate, availability, and sample-work information.",
      "Creators are responsible for evaluating collaboration requests, meeting accepted deliverables, respecting deadlines, and communicating material changes promptly.",
      "Creators must comply with advertising disclosure rules, platform policies, intellectual property rules, and any legal obligations that apply to sponsored content.",
      "Creators must not misrepresent reach, engagement, identity, ownership of channels, work history, or the performance of campaign content.",
    ],
  },
  {
    title: "Platform responsibilities",
    items: [
      "Branzzo provides discovery, profiles, collaboration workflows, notifications, verification signals, admin review, and trust and safety tooling.",
      "Branzzo may review accounts, profiles, inquiries, collaborations, and verification submissions to operate the service and enforce policies.",
      "Branzzo does not guarantee that any creator, brand, collaboration, campaign result, audience metric, payment, or business outcome will meet expectations.",
      "Branzzo may change, limit, pause, or discontinue features as the product evolves.",
    ],
  },
  {
    title: "Prohibited behavior",
    items: [
      "Do not harass, threaten, abuse, discriminate against, exploit, or dox another person or team.",
      "Do not upload illegal, harmful, hateful, sexually exploitative, violent, infringing, deceptive, or privacy-invasive content.",
      "Do not spam users, scrape the platform, sell account access, bypass rate limits, interfere with security, or attempt unauthorized access.",
      "Do not use Branzzo to coordinate fake engagement, undisclosed paid endorsements, illegal products, regulated claims without substantiation, or deceptive campaigns.",
      "Do not move users off-platform to evade review, policy enforcement, safety checks, or agreed collaboration records when a Branzzo workflow is active.",
    ],
  },
  {
    title: "Fraud and abuse",
    items: [
      "Fraud includes false identities, fake companies, impersonation, fabricated metrics, fake followers, payment manipulation, refund abuse, chargeback abuse, phishing, credential theft, and forged proof of work.",
      "Branzzo may investigate suspected fraud using account data, collaboration records, verification information, reports, technical signals, and communications submitted to the platform.",
      "We may preserve relevant records, restrict features, warn affected users, or cooperate with service providers, payment providers, platforms, or legal authorities when appropriate.",
    ],
  },
  {
    title: "Suspension and enforcement",
    items: [
      "Branzzo may warn, remove content, limit visibility, pause workflows, reject verification, suspend accounts, terminate access, or block future use when we believe these Terms or our policies have been violated.",
      "We may take immediate action when conduct creates legal risk, safety risk, fraud risk, platform integrity risk, or harm to another user.",
      "Users may contact support if they believe an enforcement action was made in error, but Branzzo is not required to restore access or content.",
    ],
  },
  {
    title: "Intellectual property",
    items: [
      "Branzzo owns the platform, software, design, trademarks, and product experience, except for content owned by users or third parties.",
      "Users retain ownership of the content they submit, including profile materials, campaign materials, messages, samples, and collaboration deliverables they own.",
      "By submitting content to Branzzo, you grant us a limited license to host, display, process, transmit, and use that content to operate, improve, secure, and promote the platform.",
      "Brands and creators must separately agree on campaign usage rights, whitelisting, exclusivity, licensing periods, approvals, edits, and paid media permissions when those terms matter.",
      "Do not upload or use content that infringes another party's copyright, trademark, publicity, privacy, or other rights.",
    ],
  },
  {
    title: "Payments disclaimer",
    items: [
      "Rates, exact offers, and payment details shown in Branzzo workflows are collaboration information, not a payment guarantee.",
      "Unless a specific Branzzo product expressly says otherwise, Branzzo is not an escrow agent, payment processor, payroll provider, tax advisor, talent agency, or party to the brand-creator agreement.",
      "Brands and creators are responsible for agreeing to payment terms, invoices, taxes, refunds, cancellation terms, usage fees, and compliance with applicable financial obligations.",
      "Branzzo may introduce paid products later. Any paid product may have additional terms shown at purchase or signup.",
    ],
  },
  {
    title: "Third-party services",
    items: [
      "Branzzo may rely on third-party providers for authentication, infrastructure, databases, email, analytics, security, and other operational services.",
      "Third-party websites, social platforms, payment tools, and external links are governed by their own terms and policies.",
      "Branzzo is not responsible for third-party services, outages, content, moderation decisions, or policy changes.",
    ],
  },
  {
    title: "Disclaimers",
    items: [
      "Branzzo is provided on an as-is and as-available basis to the maximum extent permitted by law.",
      "We do not promise uninterrupted access, error-free operation, particular marketplace results, verified availability of users, or accuracy of all user-submitted information.",
      "Trust signals, verification states, badges, reviews, and admin notes are platform signals, not legal, financial, or professional endorsements.",
    ],
  },
  {
    title: "Limitation of liability",
    items: [
      "To the maximum extent permitted by law, Branzzo and its team will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, lost profits, lost revenue, lost data, reputational harm, or business interruption.",
      "To the maximum extent permitted by law, Branzzo's total liability for claims relating to the service will not exceed the greater of the amount you paid to Branzzo for the service in the 3 months before the claim or INR 10,000.",
      "Some jurisdictions do not allow certain liability limits, so parts of this section may not apply to you.",
    ],
  },
  {
    title: "Indemnity",
    items: [
      "You agree to defend and hold Branzzo harmless from claims, losses, liabilities, damages, costs, and expenses arising from your content, collaborations, breach of these Terms, violation of law, or infringement of another party's rights.",
    ],
  },
  {
    title: "Governing law",
    items: [
      "These Terms are governed by the laws of India, without regard to conflict-of-law rules, unless a separate written agreement with Branzzo states otherwise.",
      "Subject to mandatory legal protections that may apply where you live, courts located in India will have exclusive jurisdiction over disputes relating to these Terms or Branzzo.",
    ],
  },
  {
    title: "Changes and contact",
    items: [
      "We may update these Terms as Branzzo changes. Continued use after the updated Terms become effective means you accept the updated Terms.",
      `Questions about these Terms can be sent to ${CONTACT_EMAILS.legal}. Product support requests should be sent through the Contact Us page.`,
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="relative overflow-hidden bg-[#05050d]">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-25" />
      <section className="bridge-section relative py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="bridge-eyebrow">Terms of Service</p>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">
            The rules for using Branzzo.
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">
            These Terms describe the responsibilities of brands, creators, and Branzzo when using the platform for
            discovery, profiles, collaboration requests, verification, and trust workflows.
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--text-muted)]">Last updated: {LEGAL_LAST_UPDATED}</p>
        </div>
      </section>

      <section className="bridge-section relative pt-0">
        <div className="grid gap-4">
          {termsSections.map((section) => (
            <article key={section.title} className="bridge-panel p-5 sm:p-6">
              <h2 className="font-display text-2xl font-bold">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                {section.items.map((item) => (
                  <li key={item} className="border-l border-violet-300/25 pl-4">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[8px] border border-[var(--border)] bg-[rgba(8,11,17,0.76)] p-5 text-sm leading-6 text-[var(--text-secondary)] sm:p-6">
          For formal legal notices, contact{" "}
          <a href={`mailto:${CONTACT_EMAILS.legal}`} className="font-semibold text-cyan-100 hover:text-cyan-50">
            {CONTACT_EMAILS.legal}
          </a>
          . For account support, use{" "}
          <Link href="/contact" className="font-semibold text-cyan-100 hover:text-cyan-50">
            Contact Us
          </Link>
          .
        </div>
      </section>
    </main>
  );
}
