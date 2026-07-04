import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <section className="bridge-card max-w-lg p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[8px] border border-red-900 bg-red-950/40 text-red-200">
          <ShieldX size={24} />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase text-red-200">403</p>
        <h1 className="mt-2 font-display text-3xl font-black">Admin access required</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          This area is limited to accounts listed in the admin email allowlist.
        </p>
        <Link href="/" className="bridge-button-primary mt-6 w-full">
          Back to CreatorBridge
        </Link>
      </section>
    </main>
  );
}
