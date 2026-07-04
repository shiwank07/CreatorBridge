import Link from "next/link";
import { AlertTriangle, BadgeCheck, FileSearch } from "lucide-react";

import { CONTACT_EMAILS, LEGAL_LAST_UPDATED } from "@/lib/constants";

export const metadata = {
  title: "Trust & Safety",
  description: "How CreatorBridge approaches verification, reporting, fraud prevention, and platform safety.",
};

const trustLayers = [
  {
    title: "Profile signals",
    description: "Creator and brand profiles collect public context such as niche, platform, website, work samples, and availability.",
  },
  {
    title: "Verification review",
    description: "Creators and brands can submit trust details for admin review, including website, work email, phone, and profile context.",
  },
  {
    title: "Structured collaboration records",
    description: "Campaign goals, deliverables, offers, timelines, and status changes stay attached to collaboration workflows.",
  },
  {
    title: "Admin escalation paths",
    description: "Reports, verification decisions, and suspicious activity can be reviewed by the CreatorBridge team.",
  },
];

const safetySections = [
  {
    title: "Verification and trust signals",
    items: [
      "Verification status is a CreatorBridge signal based on submitted information and admin review. It is not a guarantee of performance, payment, legal compliance, or identity beyond what we can reasonably review.",
      "Creators may be reviewed for profile completeness, public platform links, support phone availability, and consistency across submitted details.",
      "Brands may be reviewed for company website, work email, contact details, company registration context, and consistency across submitted details.",
      "CreatorBridge may approve, reject, revisit, or remove verification signals if information changes or new risk appears.",
    ],
  },
  {
    title: "Contact and privacy protections",
    items: [
      "Private phone numbers are used for trust, support, and urgent follow-up. They are not intended for public display.",
      "Collaboration contact details should be shared only through approved workflows or with clear user permission.",
      "Users should not request passwords, one-time codes, bank credentials, private analytics access, or unnecessary personal information.",
    ],
  },
  {
    title: "Fraud prevention",
    items: [
      "CreatorBridge monitors for suspicious patterns such as impersonation, fabricated metrics, fake companies, phishing, spam, forged proof, and abuse of collaboration workflows.",
      "We may limit account features, pause a collaboration, require additional verification, or suspend access while reviewing suspected fraud.",
      "Users should verify payment terms, usage rights, deadlines, and identity before starting work outside CreatorBridge workflows.",
    ],
  },
  {
    title: "Reporting concerns",
    items: [
      "Report suspected fraud, harassment, impersonation, non-payment, unsafe campaign instructions, or privacy violations through Contact Us or support email.",
      "Useful reports include profile links, account emails, collaboration IDs, dates, screenshots, payment records, and a short description of what happened.",
      "CreatorBridge reviews reports based on urgency, available evidence, policy impact, and risk to users.",
    ],
  },
  {
    title: "Enforcement approach",
    items: [
      "CreatorBridge may remove content, reject verification, limit profile visibility, pause workflows, warn users, suspend accounts, or terminate access.",
      "We may prioritize urgent risks, including fraud, harassment, impersonation, credential requests, unsafe campaign demands, and threats to user privacy.",
      "Platform decisions may rely on available evidence and may not resolve every contractual or payment dispute between brands and creators.",
    ],
  },
  {
    title: "User safety checklist",
    items: [
      "Keep work conversations, key agreements, deliverables, and approvals documented.",
      "Confirm the campaign brief, exact payment amount, payment timing, cancellation terms, usage rights, and disclosure expectations before starting work.",
      "Be cautious with requests to rush, hide sponsorship, change bank details unexpectedly, share credentials, or move sensitive conversations into untracked channels.",
      "Report suspicious requests early, even if you are not sure whether a policy was violated.",
    ],
  },
];

export default function TrustSafetyPage() {
  return (
    <main className="relative overflow-hidden bg-[#05050d]">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-25" />
      <section className="bridge-section relative py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="bridge-eyebrow">Trust & Safety</p>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">
            Safer collaboration starts before the first brief is accepted.
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">
            CreatorBridge builds trust through clearer profiles, structured requests, verification review, admin tooling,
            and practical safety expectations for both sides of a collaboration.
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--text-muted)]">Last updated: {LEGAL_LAST_UPDATED}</p>
        </div>
      </section>

      <section className="bridge-section relative pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {trustLayers.map((layer, index) => (
            <article key={layer.title} className="bridge-card bridge-card-hover p-5">
              <p className="font-mono text-sm text-[var(--cyan)]">0{index + 1}</p>
              <h2 className="mt-4 font-display text-lg font-bold">{layer.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{layer.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
        <div className="bridge-section">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Verification", icon: BadgeCheck, copy: "Manual review helps add confidence to profiles and account details." },
              { title: "Review", icon: FileSearch, copy: "Structured collaboration records make issues easier to understand." },
              { title: "Response", icon: AlertTriangle, copy: "Reports and risk signals can trigger limits, review, or enforcement." },
            ].map(({ title, icon: Icon, copy }) => (
              <div key={title} className="bridge-panel p-5">
                <Icon size={22} className="text-cyan-100" />
                <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bridge-section relative">
        <div className="grid gap-4">
          {safetySections.map((section) => (
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
          Need help with a safety concern? Contact{" "}
          <a href={`mailto:${CONTACT_EMAILS.support}`} className="font-semibold text-cyan-100 hover:text-cyan-50">
            {CONTACT_EMAILS.support}
          </a>
          {" "}or visit{" "}
          <Link href="/contact" className="font-semibold text-cyan-100 hover:text-cyan-50">
            Contact Us
          </Link>
          .
        </div>
      </section>
    </main>
  );
}
