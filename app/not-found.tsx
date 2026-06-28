import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase text-violet-300">404</p>
      <h1 className="mt-4 font-display text-4xl font-bold">This page is not on the bridge yet.</h1>
      <p className="mt-4 text-[var(--text-secondary)]">
        Try browsing the creator directory or heading back to the homepage.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/creators" className="bridge-button-primary">
          Browse Creators
        </Link>
        <Link href="/" className="bridge-button-secondary">
          Go Home
        </Link>
      </div>
    </main>
  );
}
