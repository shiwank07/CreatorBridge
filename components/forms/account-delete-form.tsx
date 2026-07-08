"use client";

import { type FormEvent, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

type AccountDeleteFormProps = {
  accountLabel: string;
};

export function AccountDeleteForm({ accountLabel }: AccountDeleteFormProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const canDelete = confirmation === "DELETE" && !isDeleting;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canDelete) return;

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not delete this account.");
        return;
      }

      await signOut().catch(() => undefined);
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bridge-card border-red-900/70 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-red-900 bg-red-950/40 text-red-200">
          <AlertTriangle size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase text-red-200">Delete Account</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Permanently delete {accountLabel}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            This is permanent. Your Clerk sign-in will be deleted, your Branzzo account will be disabled, and public profile/contact details will be removed where safe.
          </p>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="bridge-label">Type DELETE to confirm</span>
        <input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="bridge-input mt-2"
          autoComplete="off"
          placeholder="DELETE"
        />
      </label>

      {error ? (
        <div role="alert" className="mt-4 rounded-[8px] border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={!canDelete} className="bridge-button-secondary mt-5 w-full border-red-900/70 text-red-100 hover:border-red-700 hover:bg-red-950/30">
        {isDeleting ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
        {isDeleting ? "Deleting Account" : "Delete Account"}
      </button>
    </form>
  );
}
