"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="bridge-card w-full max-w-xl p-6 text-center sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[8px] border border-red-900 bg-red-950/40 text-red-200">
          <AlertTriangle size={22} />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase text-red-200">Something broke</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">CreatorBridge hit a snag.</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
          Try again first. If the problem repeats, head home and come back to this workflow from the dashboard.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="bridge-button-primary w-full sm:w-auto">
            <RotateCcw size={16} />
            Try Again
          </button>
          <Link href="/" className="bridge-button-secondary w-full sm:w-auto">
            <Home size={16} />
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
