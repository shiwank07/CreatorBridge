"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" className="bridge-card p-6 text-center">
      <h2 className="font-display text-2xl font-bold">Could not load admin records</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
        The records could not be loaded safely. Existing rows have been hidden.
      </p>
      <button type="button" onClick={reset} className="bridge-button-secondary mt-5">Try again</button>
    </section>
  );
}
