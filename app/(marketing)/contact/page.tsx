import { BriefcaseBusiness, Clock, LifeBuoy, Scale } from "lucide-react";

import { ContactUsForm } from "@/components/forms/contact-us-form";
import { CONTACT_EMAILS } from "@/lib/constants";

export const metadata = {
  title: "Contact Us",
  description: "Contact CreatorBridge support, partnerships, or legal.",
};

const contactRoutes = [
  {
    title: "Support",
    email: CONTACT_EMAILS.support,
    description: "Account access, onboarding, collaboration workflow, profile, notification, and product support.",
    icon: LifeBuoy,
  },
  {
    title: "Business partnerships",
    email: CONTACT_EMAILS.partnerships,
    description: "Brand partnerships, strategic collaborations, media inquiries, and commercial conversations.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Legal contact",
    email: CONTACT_EMAILS.legal,
    description: "Legal notices, policy questions, intellectual property issues, and formal rights requests.",
    icon: Scale,
  },
];

const responseExpectations = [
  "Support requests are usually reviewed within 2 business days.",
  "Business partnership messages are usually reviewed within 3 business days.",
  "Legal notices are reviewed by the appropriate team as soon as practical, usually within 5 business days.",
  "Trust, safety, fraud, or account-risk reports may be prioritized when they include enough detail to investigate.",
];

export default function ContactPage() {
  return (
    <main className="relative overflow-hidden bg-[#05050d]">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-25" />
      <section className="bridge-section relative py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="bridge-eyebrow">Contact Us</p>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">
            Reach the CreatorBridge team.
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">
            Use the best contact route for your request so the right team can review it. Include your account email,
            profile link, collaboration reference, or any screenshots when they help explain the issue.
          </p>
        </div>
      </section>

      <section className="bridge-section relative pt-0">
        <div className="grid gap-4 lg:grid-cols-3">
          {contactRoutes.map(({ title, email, description, icon: Icon }) => (
            <article key={title} className="bridge-card bridge-card-hover p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
                <Icon size={21} />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">{title}</h2>
              <a href={`mailto:${email}`} className="mt-3 block break-all text-sm font-semibold text-cyan-100 hover:text-cyan-50">
                {email}
              </a>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bridge-section relative pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ContactUsForm />

          <aside className="bridge-panel p-5 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-violet-300/25 bg-violet-300/10 text-violet-100">
              <Clock size={18} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Response expectations</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-[var(--text-secondary)]">
              {responseExpectations.map((expectation) => (
                <li key={expectation} className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
                  {expectation}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">
              Response times are estimates, not guarantees. They may vary during holidays, launches, or complex safety
              reviews.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
