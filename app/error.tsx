"use client";

import Link from "next/link";

export default function ErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase text-violet-300">Something broke</p>
      <h1 className="mt-4 font-display text-4xl font-bold">CreatorBridge hit a snag.</h1>
      <p className="mt-4 text-[var(--text-secondary)]">
        Refresh the page, or head back to the homepage while we keep the public marketplace calm.
      </p>
      <Link
        href="/"
        className="focus-ring mt-8 rounded-[8px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      >
        Go Home
      </Link>
    </main>
  );
}
