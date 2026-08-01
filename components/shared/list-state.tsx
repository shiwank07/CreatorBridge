import Link from "next/link";

export function ListLoadingState({ rows = 6, label = "Loading records" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="bridge-card overflow-hidden p-4">
      <span className="sr-only">{label}</span>
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-[8px] bg-white/[0.055]" />)}
      </div>
    </div>
  );
}

export function ListErrorState({ title = "Could not load records", description, retryHref }: { title?: string; description: string; retryHref: string }) {
  return (
    <section role="alert" className="bridge-card p-6 text-center">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      <Link href={retryHref} className="bridge-button-secondary mt-5">Try again</Link>
    </section>
  );
}
