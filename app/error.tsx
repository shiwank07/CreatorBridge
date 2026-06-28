"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase text-violet-300">Something broke</p>
      <h1 className="mt-4 font-display text-4xl font-bold">CreatorBridge hit a snag.</h1>
      <p className="mt-4 text-[var(--text-secondary)]">
        Refresh the page, or head back to the homepage while we keep the public marketplace calm.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="bridge-button-primary">
          <RotateCcw size={16} />
          Try Again
        </button>
        <Link href="/" className="bridge-button-secondary">
          Go Home
        </Link>
      </div>
    </main>
  );
}
