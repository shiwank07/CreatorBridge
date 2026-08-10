import Image from "next/image";
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
import { ScrollReveal } from "@/components/shared/scroll-reveal";
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

      {/* Overview Section: Asymmetric Composition */}
      <section className="bridge-section !pt-10 sm:!pt-14" aria-labelledby="marketplace-overview-heading">
        <ScrollReveal delay={0}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="bridge-eyebrow">BUILT FOR CREATOR PARTNERSHIPS</p>
            <h2 id="marketplace-overview-heading" className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              One marketplace. Two sides. Built on trust.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              Branzzo connects verified creators directly with forward-thinking brands for high-impact campaigns.
            </p>
          </div>
        </ScrollReveal>

        {/* Asymmetric 2+1 Pillar Composition */}
        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Pillar 1: For Brands (7 Cols on desktop) */}
          <article className="bridge-card bridge-card-hover group relative overflow-hidden p-7 lg:col-span-7 bg-gradient-to-br from-cyan-950/20 via-[var(--bg-surface)] to-[#0c0f17]">
            <ScrollReveal delay={100}>
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl transition group-hover:bg-cyan-400/10" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-inner">
                <Building2 aria-hidden="true" size={24} />
              </div>
              <span className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-cyan-300">FOR BRANDS</span>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight">Discover campaign-fit creators</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Find campaign-fit creators and move seamlessly from shortlist to structured, trackable requests.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Discover creators", "Compare profiles", "Launch campaigns"].map((point) => (
                  <li key={point} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 p-2.5 text-xs font-semibold text-[var(--text-primary)]">
                    <Check aria-hidden="true" size={14} className="shrink-0 text-cyan-300" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </article>

          {/* Pillar 2: For Creators (5 Cols on desktop) */}
          <article className="bridge-card bridge-card-hover group relative overflow-hidden p-7 lg:col-span-5 bg-gradient-to-br from-violet-950/20 via-[var(--bg-surface)] to-[#0c0f17]">
            <ScrollReveal delay={200}>
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-violet-400/5 blur-3xl transition group-hover:bg-violet-400/10" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/10 text-violet-200 shadow-inner">
                <Users aria-hidden="true" size={24} />
              </div>
              <span className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-violet-300">FOR CREATORS</span>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight">Turn availability into offers</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Turn your work, audience stats, and availability into a credible public profile brands trust.
              </p>
              <ul className="mt-6 space-y-2.5">
                {["Build a verified profile", "Receive brand offers", "Manage collaborations"].map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-xs font-semibold text-[var(--text-primary)]">
                    <Check aria-hidden="true" size={14} className="shrink-0 text-violet-300" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </article>

          {/* Pillar 3: Secure Platform (Full width 12 Cols horizontal trust banner) */}
          <article className="bridge-card bridge-card-hover p-6 lg:col-span-12 flex flex-col justify-between gap-6 md:flex-row md:items-center bg-gradient-to-r from-emerald-950/20 via-[var(--bg-surface)] to-[var(--bg-surface)] border-emerald-500/20">
            <ScrollReveal delay={300} className="w-full flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-inner">
                  <ShieldCheck aria-hidden="true" size={24} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Secure Platform Guarantee</h3>
                  <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">Clear identity signals and structured collaboration workflows for professional outreach.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5 text-emerald-200">Identity Verification</span>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1.5 text-cyan-200">Transparent Pricing</span>
                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3.5 py-1.5 text-violet-200">Safe Communication</span>
              </div>
            </ScrollReveal>
          </article>
        </div>
      </section>

      <ScrollReveal delay={0}>
        <StatsBar stats={stats} />
      </ScrollReveal>

      {/* How Branzzo Works: Connected Process Step Timeline */}
      <section id="how-it-works" className="bridge-section scroll-mt-24 relative overflow-hidden !py-14 sm:!py-20" aria-labelledby="how-branzzo-works">
        <div className="relative z-10">
          <ScrollReveal delay={0}>
            <div className="max-w-3xl">
              <p className="bridge-eyebrow">HOW BRANZZO WORKS</p>
              <h2 id="how-branzzo-works" className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                From creator discovery to paid partnership
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                A focused workflow for finding the right fit, sharing a clear brief, and keeping collaboration progress organized.
              </p>
            </div>
          </ScrollReveal>

          {/* Connected Process Steps Timeline */}
          <div className="relative mt-12 grid gap-6 md:grid-cols-3">
            {/* Subtle connecting horizontal border line on desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1px] -translate-y-6 bg-gradient-to-r from-cyan-400/30 via-violet-400/30 to-emerald-400/30 z-0" />

            {[
              { step: "01", title: "Discover and compare", icon: Search, copy: "Filter creator profiles by niche, platform, audience signals, rates, and availability.", border: "hover:border-cyan-400/40", accent: "text-cyan-300 bg-cyan-400/10 border-cyan-400/30", delay: 100 },
              { step: "02", title: "Send a clear request", icon: Send, copy: "Share campaign goals, deliverables, budget, and timeline in one structured brief.", border: "hover:border-violet-400/40", accent: "text-violet-300 bg-violet-400/10 border-violet-400/30", delay: 200 },
              { step: "03", title: "Manage the partnership", icon: Handshake, copy: "Track responses, collaboration status, delivery, and communication from one workspace.", border: "hover:border-emerald-400/40", accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30", delay: 300 },
            ].map(({ step, title, icon: Icon, copy, border, accent, delay }) => (
              <ScrollReveal key={step} delay={delay}>
                <article className={`bridge-card bridge-card-hover relative z-10 p-7 ${border} transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center justify-center h-8 w-10 rounded-lg border font-mono text-xs font-bold ${accent}`}>{step}</span>
                    <Icon aria-hidden="true" size={22} className="text-[var(--text-muted)]" />
                  </div>
                  <h3 className="mt-7 font-display text-xl font-bold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>


      {/* Deep Feature Split: For Brands & Creators Showcase */}
      <section className="border-y border-[var(--border)] bg-gradient-to-b from-[#090b10] via-[#0d1017] to-[#090b10]">
        <div className="bridge-section grid gap-8 py-14 lg:grid-cols-2 lg:py-20">
          <ScrollReveal delay={0}>
            <article id="for-brands" className="scroll-mt-24 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/20 via-[rgba(17,19,26,0.92)] to-[#0a0d14] p-7 sm:p-9 shadow-2xl transition hover:border-cyan-400/35">
              <p className="bridge-eyebrow text-cyan-300">FOR BRANDS</p>
              <h2 className="mt-3 font-display text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                Find creators who fit the campaign—not just the follower count.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                Compare professional creator profiles, audience and verification signals, pricing, samples, and availability before you send a paid collaboration request.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: BarChart3, text: "Comparable profile signals" },
                  { icon: ListChecks, text: "Structured campaign briefs" },
                  { icon: CircleDollarSign, text: "Visible pricing context" },
                  { icon: MessageSquareText, text: "Organized communication" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5 text-xs font-semibold text-white backdrop-blur-sm">
                    <Icon aria-hidden="true" size={18} className="shrink-0 text-cyan-300" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/creators" className="bridge-button-primary w-full sm:w-auto">
                  Find Creators <ArrowRight size={16} />
                </Link>
                <Link href={authHref("/sign-up", "/onboarding?role=brand")} className="bridge-button-secondary w-full sm:w-auto">
                  Join as Brand <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <article id="for-creators" className="scroll-mt-24 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-950/20 via-[rgba(17,19,26,0.92)] to-[#0a0d14] p-7 sm:p-9 shadow-2xl transition hover:border-violet-400/35">
              <p className="bridge-eyebrow text-violet-300">FOR CREATORS</p>
              <h2 className="mt-3 font-display text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                Present your work professionally and receive better briefs.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                Build a public profile around your niche, channels, audience, rates, portfolio, and availability—then manage brand opportunities without scattered conversations.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: BadgeCheck, text: "Verification workflows" },
                  { icon: Sparkles, text: "Professional public profile" },
                  { icon: ClipboardCheck, text: "Clear collaboration status" },
                  { icon: Handshake, text: "Partnership workspace" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5 text-xs font-semibold text-white backdrop-blur-sm">
                    <Icon aria-hidden="true" size={18} className="shrink-0 text-violet-300" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <Link href={authHref("/sign-up", "/onboarding?role=creator")} className="bridge-button-secondary mt-8 w-full sm:w-auto">
                Join as Creator <ArrowRight size={16} />
              </Link>
            </article>
          </ScrollReveal>
        </div>
      </section>

      {/* Creator Niche Cloud Section */}
      <section className="bridge-section !py-12">
        <ScrollReveal delay={0}>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="bridge-eyebrow">CREATOR CATEGORIES</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight">Search by audience and content fit</h2>
            </div>
            <Link href="/creators" className="bridge-button-secondary w-full md:w-auto">
              <Search size={16} /> Explore all creators
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {NICHES.map((niche) => (
              <Link key={niche} href={`/creators?niche=${encodeURIComponent(niche)}`}>
                <Badge tone="neutral" className="px-3.5 py-1.5 text-xs transition duration-200 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-200">
                  {niche}
                </Badge>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <FeaturedCreators creators={featuredCreators} />
      <FeaturedBrands brands={featuredBrands} />

      {/* Why Choose Branzzo Feature Matrix */}
      <section className="bridge-section !py-14 sm:!py-20" aria-labelledby="why-branzzo">
        <ScrollReveal delay={0}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="bridge-eyebrow">WHY CHOOSE BRANZZO</p>
            <h2 id="why-branzzo" className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Professional collaboration signals, without the noise
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BadgeCheck, title: "Verified creators", copy: "Verification states help brands distinguish reviewed profiles and stats.", accent: "text-cyan-300 bg-cyan-400/10 border-cyan-400/25", delay: 100 },
            { icon: LockKeyhole, title: "Secure collaborations", copy: "Role-aware workflows keep collaboration actions and details controlled.", accent: "text-violet-300 bg-violet-400/10 border-violet-400/25", delay: 180 },
            { icon: CircleDollarSign, title: "Transparent pricing", copy: "Creators can publish rate context before a brand starts outreach.", accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25", delay: 260 },
            { icon: ClipboardCheck, title: "Professional profiles", copy: "Audience, niche, work samples, availability, and trust signals stay together.", accent: "text-rose-300 bg-rose-400/10 border-rose-400/25", delay: 340 },
          ].map(({ icon: Icon, title, copy, accent, delay }) => (
            <ScrollReveal key={title} delay={delay}>
              <article className="bridge-card bridge-card-hover p-6 transition duration-300 hover:-translate-y-1">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${accent}`}>
                  <Icon aria-hidden="true" size={22} />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{title}</h3>
                <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">{copy}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section className="bridge-section !py-12 sm:!py-16" aria-labelledby="faq-heading">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <ScrollReveal delay={0}>
            <div>
              <p className="bridge-eyebrow">FAQ</p>
              <h2 id="faq-heading" className="mt-3 font-display text-3xl font-black tracking-tight lg:text-4xl">
                Questions about Branzzo
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                The essentials for brands and creators evaluating the marketplace.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <div className="space-y-3.5">
              {[
                ["What is Branzzo?", "Branzzo is a marketplace that connects brands with creators for paid collaborations across YouTube, Instagram, TikTok, Twitch, and other platforms."],
                ["Who is Branzzo for?", "Branzzo is for brands looking for campaign-fit creators and creators who want a professional profile, clearer offers, and an organized partnership workflow."],
                ["How do brands find creators?", "Brands can browse and filter public creator profiles, compare niche, channels, audience signals, rates, work samples, verification, and availability."],
                ["What does creator verification mean?", "Verification status reflects Branzzo's available identity, platform-ownership, or creator-stat review workflows. Each profile displays its current status."],
                ["Can creators manage collaborations on Branzzo?", "Yes. Creators can review requests, respond to offers, follow collaboration status, communicate, and track delivery steps from their dashboard."],
              ].map(([question, answer]) => (
                <details key={question} className="group bridge-card px-6 py-4 transition hover:border-cyan-400/30">
                  <summary className="focus-ring cursor-pointer list-none pr-8 font-display text-base font-bold text-white marker:hidden flex items-center justify-between">
                    <span>{question}</span>
                    <span className="text-xs text-[var(--text-muted)] transition group-open:rotate-180">▼</span>
                  </summary>
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-6 text-[var(--text-secondary)]">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Final Conversion Banner */}
      <section className="atmospheric-section bridge-section !pt-6 !pb-16">
        <div className="atmospheric-container relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#0b0f16] px-6 py-12 sm:px-12 sm:py-16 shadow-2xl">
          {/* Atmospheric Background Layer: Mahi.png */}
          <div className="atmospheric-layer-mahi">
            <Image
              src="/media/Mahi.webp"
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              className="object-cover object-right-top md:object-right pointer-events-none select-none"
              loading="lazy"
            />
            <div className="atmospheric-overlay-mahi" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <ScrollReveal delay={0}>
              <p className="bridge-eyebrow text-cyan-300">BUILD THE RIGHT PARTNERSHIP</p>
              <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Find the creator. Share the brief. Manage the collaboration on Branzzo.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                Start by exploring professional creator profiles—or join as a creator and make your work discoverable to brands.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/creators" className="bridge-button-primary w-full sm:w-auto">
                  <Search size={17} /> Find Creators
                </Link>
                <Link href={authHref("/sign-up", "/onboarding?role=creator")} className="bridge-button-secondary w-full sm:w-auto">
                  <UserPlus size={17} /> Join as Creator
                </Link>
                <Link href={authHref("/sign-up", "/onboarding?role=brand")} className="bridge-button-secondary w-full sm:w-auto">
                  <Building2 size={17} /> Join as Brand
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </main>
  );
}
