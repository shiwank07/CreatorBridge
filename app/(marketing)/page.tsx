import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Handshake,
  ListChecks,
  LockKeyhole,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { FeaturedCreators } from "@/components/marketing/featured-creators";
import { FeaturedBrands } from "@/components/marketing/featured-brands";
import { LandingHero } from "@/components/marketing/landing-hero";
import { StatsBar } from "@/components/marketing/stats-bar";
import { Badge } from "@/components/shared/badge";
import { authHref } from "@/lib/auth-redirect";
import { NICHES } from "@/lib/constants";
import { publicPageMetadata, SITE_DESCRIPTION } from "@/lib/seo";

export const metadata = publicPageMetadata("Branzzo", SITE_DESCRIPTION, "/");

const STATIC_MARKETPLACE_DATA = {
  featuredCreators: [],
  featuredBrands: [],
  stats: { creators: 0, brands: 0, collaborations: 0 },
};

export default function HomePage() {
  const { featuredCreators, featuredBrands, stats } = STATIC_MARKETPLACE_DATA;

  return (
    <main className="marketing-home">
      <LandingHero />

      <section className="bridge-section !pt-8 sm:!pt-10" aria-labelledby="marketplace-overview-heading">
        <div className="mx-auto max-w-3xl text-center">
          <p className="bridge-eyebrow">Built for creator partnerships</p>
          <h2 id="marketplace-overview-heading" className="mt-3 font-display text-3xl font-black sm:text-4xl">
            One marketplace. Two sides. Built on trust.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "For Brands",
              copy: "Find campaign-fit creators and move from shortlist to structured request.",
              icon: Building2,
              tone: "text-cyan-200 border-cyan-300/25 bg-cyan-300/10",
              points: ["Discover creators", "Compare professional profiles", "Launch paid campaigns"],
            },
            {
              title: "For Creators",
              copy: "Turn your work, audience, and availability into a credible public profile.",
              icon: Users,
              tone: "text-violet-200 border-violet-300/25 bg-violet-300/10",
              points: ["Build a verified profile", "Receive brand offers", "Manage collaborations"],
            },
            {
              title: "Secure Platform",
              copy: "Use clear identity signals and organized workflows for professional outreach.",
              icon: ShieldCheck,
              tone: "text-emerald-200 border-emerald-300/25 bg-emerald-300/10",
              points: ["Identity verification", "Transparent pricing", "Safe communication"],
            },
          ].map(({ title, copy, icon: Icon, tone, points }) => (
            <article key={title} className="bridge-card bridge-card-hover p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-[8px] border ${tone}`}>
                <Icon aria-hidden="true" size={23} />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
              <ul className="mt-5 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm font-semibold text-[var(--text-primary)]">
                    <Check aria-hidden="true" size={16} className="text-cyan-200" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <StatsBar stats={stats} />

      <section id="how-it-works" className="bridge-section scroll-mt-24" aria-labelledby="how-branzzo-works">
        <div className="max-w-3xl">
          <p className="bridge-eyebrow">How Branzzo works</p>
          <h2 id="how-branzzo-works" className="mt-3 font-display text-3xl font-black sm:text-4xl">From creator discovery to paid partnership</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">A focused workflow for finding the right fit, sharing a clear brief, and keeping collaboration progress organized.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { step: "01", title: "Discover and compare", icon: Search, copy: "Filter creator profiles by niche, platform, audience signals, rates, and availability." },
            { step: "02", title: "Send a clear request", icon: Send, copy: "Share campaign goals, deliverables, budget, and timeline in one structured brief." },
            { step: "03", title: "Manage the partnership", icon: Handshake, copy: "Track responses, collaboration status, delivery, and communication from one workspace." },
          ].map(({ step, title, icon: Icon, copy }) => (
            <article key={step} className="bridge-card bridge-card-hover p-6">
              <div className="flex items-center justify-between"><span className="font-mono text-sm font-bold text-cyan-200">{step}</span><Icon aria-hidden="true" size={21} className="text-[var(--text-muted)]" /></div>
              <h3 className="mt-8 font-display text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[rgba(8,11,17,0.88)]">
        <div className="bridge-section grid gap-5 py-12 lg:grid-cols-2 lg:py-16">
          <article id="for-brands" className="scroll-mt-24 rounded-[12px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.08] to-transparent p-6 sm:p-8">
            <p className="bridge-eyebrow">For brands</p>
            <h2 className="mt-3 font-display text-3xl font-black">Find creators who fit the campaign—not just the follower count.</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">Compare professional creator profiles, audience and verification signals, pricing, samples, and availability before you send a paid collaboration request.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[{ icon: BarChart3, text: "Comparable profile signals" }, { icon: ListChecks, text: "Structured campaign briefs" }, { icon: CircleDollarSign, text: "Visible pricing context" }, { icon: MessageSquareText, text: "Organized communication" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-black/15 p-3 text-sm font-semibold"><Icon aria-hidden="true" size={17} className="text-cyan-200" />{text}</div>)}
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/creators" className="bridge-button-primary w-full sm:w-auto">Find Creators <ArrowRight size={16} /></Link><Link href={authHref("/sign-up", "/onboarding?role=brand")} className="bridge-button-secondary w-full sm:w-auto">Join as Brand <ArrowRight size={16} /></Link></div>
          </article>
          <article id="for-creators" className="scroll-mt-24 rounded-[12px] border border-violet-300/15 bg-gradient-to-br from-violet-300/[0.08] to-transparent p-6 sm:p-8">
            <p className="bridge-eyebrow">For creators</p>
            <h2 className="mt-3 font-display text-3xl font-black">Present your work professionally and receive better briefs.</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">Build a public profile around your niche, channels, audience, rates, portfolio, and availability—then manage brand opportunities without scattered conversations.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[{ icon: BadgeCheck, text: "Verification workflows" }, { icon: Sparkles, text: "Professional public profile" }, { icon: ClipboardCheck, text: "Clear collaboration status" }, { icon: Handshake, text: "Partnership workspace" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-black/15 p-3 text-sm font-semibold"><Icon aria-hidden="true" size={17} className="text-violet-200" />{text}</div>)}
            </div>
            <Link href={authHref("/sign-up", "/onboarding?role=creator")} className="bridge-button-secondary mt-7 w-full sm:w-auto">Join as Creator <ArrowRight size={16} /></Link>
          </article>
        </div>
      </section>

      <section className="bridge-section !pb-2">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="bridge-eyebrow">Creator categories</p><h2 className="mt-3 font-display text-3xl font-bold">Search by audience and content fit</h2></div>
          <Link href="/creators" className="bridge-button-secondary w-full md:w-auto"><Search size={16} /> Explore all creators</Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {NICHES.map((niche) => <Link key={niche} href={`/creators?niche=${encodeURIComponent(niche)}`}><Badge tone="neutral" className="transition hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]">{niche}</Badge></Link>)}
        </div>
      </section>

      <FeaturedCreators creators={featuredCreators} />
      <FeaturedBrands brands={featuredBrands} />

      <section className="bridge-section" aria-labelledby="why-branzzo">
        <div className="mx-auto max-w-3xl text-center"><p className="bridge-eyebrow">Why choose Branzzo</p><h2 id="why-branzzo" className="mt-3 font-display text-3xl font-black sm:text-4xl">Professional collaboration signals, without the noise</h2></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BadgeCheck, title: "Verified creators", copy: "Verification states help brands distinguish reviewed profiles and stats." },
            { icon: LockKeyhole, title: "Secure collaborations", copy: "Role-aware workflows keep collaboration actions and details controlled." },
            { icon: CircleDollarSign, title: "Transparent pricing", copy: "Creators can publish rate context before a brand starts outreach." },
            { icon: ClipboardCheck, title: "Professional profiles", copy: "Audience, niche, work samples, availability, and trust signals stay together." },
          ].map(({ icon: Icon, title, copy }) => <article key={title} className="bridge-card p-5"><Icon aria-hidden="true" size={21} className="text-cyan-200" /><h3 className="mt-5 font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p></article>)}
        </div>
      </section>

      <section className="bridge-section" aria-labelledby="faq-heading">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div><p className="bridge-eyebrow">FAQ</p><h2 id="faq-heading" className="mt-3 font-display text-3xl font-black">Questions about Branzzo</h2><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">The essentials for brands and creators evaluating the marketplace.</p></div>
          <div className="space-y-3">
            {[
              ["What is Branzzo?", "Branzzo is a marketplace that connects brands with creators for paid collaborations across YouTube, Instagram, TikTok, Twitch, and other platforms."],
              ["Who is Branzzo for?", "Branzzo is for brands looking for campaign-fit creators and creators who want a professional profile, clearer offers, and an organized partnership workflow."],
              ["How do brands find creators?", "Brands can browse and filter public creator profiles, compare niche, channels, audience signals, rates, work samples, verification, and availability."],
              ["What does creator verification mean?", "Verification status reflects Branzzo's available identity, platform-ownership, or creator-stat review workflows. Each profile displays its current status."],
              ["Can creators manage collaborations on Branzzo?", "Yes. Creators can review requests, respond to offers, follow collaboration status, communicate, and track delivery steps from their dashboard."],
            ].map(([question, answer]) => <details key={question} className="group bridge-card px-5 py-4"><summary className="focus-ring cursor-pointer list-none pr-8 font-display text-base font-bold marker:hidden">{question}</summary><p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-[var(--text-secondary)]">{answer}</p></details>)}
          </div>
        </div>
      </section>

      <section className="bridge-section !pt-4">
        <div className="relative overflow-hidden rounded-[16px] border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.16),transparent_38%),#0b0f16] px-6 py-10 text-center sm:px-10 sm:py-14">
          <div className="relative mx-auto max-w-3xl"><p className="bridge-eyebrow">Build the right partnership</p><h2 className="mt-3 font-display text-3xl font-black sm:text-4xl">Find the creator. Share the brief. Manage the collaboration on Branzzo.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Start by exploring professional creator profiles—or join as a creator and make your work discoverable to brands.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/creators" className="bridge-button-primary w-full sm:w-auto"><Search size={17} /> Find Creators</Link><Link href={authHref("/sign-up", "/onboarding?role=creator")} className="bridge-button-secondary w-full sm:w-auto"><UserPlus size={17} /> Join as Creator</Link><Link href={authHref("/sign-up", "/onboarding?role=brand")} className="bridge-button-secondary w-full sm:w-auto"><Building2 size={17} /> Join as Brand</Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
