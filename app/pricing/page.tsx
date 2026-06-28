import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Navbar } from "@/components/shared/navbar";

export const metadata = {
  title: "Pricing",
  description: "CreatorBridge pricing placeholder.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#05050d]">
        <div className="pointer-events-none absolute inset-0 surface-grid opacity-35" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.22),transparent_54%),linear-gradient(135deg,rgba(103,232,249,0.08),transparent_42%)]" />
        <section className="bridge-section relative flex min-h-[70vh] items-center justify-center py-20">
          <div className="max-w-2xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-cyan-100">
              <Sparkles size={15} />
              Pricing placeholder
            </div>
            <h1 className="mt-6 font-display text-5xl font-black sm:text-6xl">
              Plans are coming soon.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
              CreatorBridge is currently focused on verified discovery, brand inquiries, and trust workflows before paid plans are introduced.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/creators" className="bridge-button-primary">
                Explore Creators
                <ArrowRight size={17} />
              </Link>
              <Link href="/" className="bridge-button-secondary">
                Back Home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
