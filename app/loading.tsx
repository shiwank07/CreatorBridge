export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
      <div className="bridge-card flex w-full max-w-sm items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--cyan)]" />
        <div>
          <p className="font-display text-sm font-bold">Loading CreatorBridge</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Preparing the marketplace...</p>
        </div>
      </div>
    </main>
  );
}
