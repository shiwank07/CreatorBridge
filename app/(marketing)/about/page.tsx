import Link from "next/link";
import { ArrowRight, Eye, Handshake, ShieldCheck, Target } from "lucide-react";

export const metadata = {
  title: "About Us",
  description: "Learn about Branzzo mission, vision, and trust-first collaboration philosophy.",
};

const principles = [
  {
    title: "Clear identity",
    description: "Creators and brands should know who they are speaking with before work begins.",
  },
  {
    title: "Better context",
    description: "Collaboration requests should include campaign goals, budgets, timelines, and deliverables upfront.",
  },
  {
    title: "Respectful decisions",
    description: "A creator can accept, decline, negotiate, or ask for more detail without being pressured into a blind commitment.",
  },
  {
    title: "Trust workflows",
    description: "Verification, review, and support paths help the platform respond when something looks wrong.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden bg-[#05050d]">
      <div className="pointer-events-none absolute inset-0 surface-grid opacity-25" />
      <section className="bridge-section relative py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="bridge-eyebrow">About Us</p>
          <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-5xl">
            Branzzo helps trusted creators and serious brands find each other with less noise.
          </h1>
          <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">
            Branzzo is an India-first marketplace for creator discovery, public profiles, structured campaign
            requests, and trust-aware collaboration workflows. We are building the connective layer between people who
            make culture and teams who want to work with them responsibly.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/creators" className="bridge-button-primary">
              Browse Creators
              <ArrowRight size={17} />
            </Link>
            <Link href="/contact" className="bridge-button-secondary">
              Contact the Team
            </Link>
          </div>
        </div>
      </section>

      <section className="bridge-section relative pt-0">
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="bridge-card bridge-card-hover p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
              <Target size={21} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Mission</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Help creators turn credibility into opportunity, and help brands discover partners who match their
              audience, voice, and campaign goals.
            </p>
          </article>

          <article className="bridge-card bridge-card-hover p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-violet-300/25 bg-violet-300/10 text-violet-100">
              <Handshake size={21} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Why We Exist</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Creator partnerships too often start in scattered DMs, vague briefs, and unclear expectations. Branzzo
              gives both sides a cleaner place to evaluate fit before they commit time, money, or reputation.
            </p>
          </article>

          <article className="bridge-card bridge-card-hover p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-emerald-300/25 bg-emerald-300/10 text-emerald-100">
              <Eye size={21} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Vision</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              A creator economy where verified profiles, structured outreach, transparent expectations, and practical
              safety checks are normal parts of every professional collaboration.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
        <div className="bridge-section">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
                <ShieldCheck size={24} />
              </div>
              <p className="bridge-eyebrow mt-5">Trust-first philosophy</p>
              <h2 className="mt-3 font-display text-3xl font-bold">Trust is a workflow, not a tagline.</h2>
              <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                Branzzo is designed around practical collaboration signals: identity, campaign context, creator
                control, review history, and clear escalation paths.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {principles.map((principle) => (
                <article key={principle.title} className="bridge-panel p-5">
                  <h3 className="font-display text-lg font-bold">{principle.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{principle.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
