import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase text-violet-300">404</p>
      <h1 className="mt-4 font-display text-4xl font-bold">This page is not on the bridge yet.</h1>
      <p className="mt-4 text-[var(--text-secondary)]">
        Try browsing the creator directory or heading back to the homepage.
      </p>
      <Link
        href="/creators"
        className="focus-ring mt-8 rounded-[8px] border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
      >
        Browse Creators
      </Link>
    </main>
  );
}
