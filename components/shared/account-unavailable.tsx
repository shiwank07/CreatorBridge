import Link from "next/link";

export function AccountUnavailable({ retryHref }: { retryHref: string }) {
  return (
    <main className="bridge-section py-16">
      <section role="alert" className="bridge-card mx-auto max-w-xl p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Your account is temporarily unavailable</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">We could not load your Branzzo account right now. Please retry.</p>
        <Link href={retryHref} className="bridge-button-primary mt-6">Retry</Link>
      </section>
    </main>
  );
}
