import Link from "next/link";
import { KeyRound } from "lucide-react";

export function AuthSetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <KeyRound size={32} className="text-violet-300" />
      <h1 className="mt-5 font-display text-3xl font-bold">Connect Clerk to continue</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        Add your Clerk publishable key and secret key to `.env.local`, then restart the app to use authentication.
      </p>
      <Link
        href="/"
        className="focus-ring mt-6 inline-flex rounded-[8px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
      >
        Back Home
      </Link>
    </main>
  );
}
