export default function Loading() {
  return (
    <main className="bridge-section min-h-screen" aria-busy="true" aria-label="Loading page" aria-live="polite">
      <section className="relative overflow-hidden rounded-[8px] border border-cyan-300/15 bg-white/[0.045] p-5 sm:p-6">
        <div className="bridge-skeleton h-4 w-32" />
        <div className="bridge-skeleton mt-5 h-10 w-full max-w-2xl" />
        <div className="bridge-skeleton mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="bridge-skeleton h-11 w-full sm:w-40" />
          <div className="bridge-skeleton h-11 w-full sm:w-36" />
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
            <div className="bridge-skeleton h-3 w-24" />
            <div className="bridge-skeleton mt-4 h-8 w-20" />
            <div className="bridge-skeleton mt-4 h-4 w-full" />
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
              <div className="bridge-skeleton h-5 w-48" />
              <div className="bridge-skeleton mt-4 h-4 w-full" />
              <div className="bridge-skeleton mt-3 h-4 w-3/4" />
            </div>
          ))}
        </div>
        <div className="rounded-[8px] border border-white/10 bg-white/[0.035] p-5">
          <div className="bridge-skeleton h-5 w-40" />
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bridge-skeleton h-10 w-full" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
