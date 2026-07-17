"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";

type GoogleAccountActionsProps = {
  redirectUrl: string;
};

export function GoogleAccountActions({ redirectUrl }: GoogleAccountActionsProps) {
  const { fetchStatus, signIn } = useSignIn();
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function useAnotherGoogleAccount() {
    if (fetchStatus === "fetching" || isStarting) return;

    setIsStarting(true);
    setErrorMessage("");

    try {
      const { error } = await signIn.sso({
        strategy: "oauth_google",
        oidcPrompt: "select_account",
        redirectCallbackUrl: "/sso-callback",
        redirectUrl,
      });

      if (error) {
        setErrorMessage(error.longMessage || error.message || "Could not open the Google account chooser.");
        setIsStarting(false);
      }
    } catch {
      setErrorMessage("Could not open the Google account chooser. Please try again.");
      setIsStarting(false);
    }
  }

  return (
    <div className="mt-4 w-full max-w-[400px] text-center">
      <button
        type="button"
        onClick={useAnotherGoogleAccount}
        disabled={fetchStatus === "fetching" || isStarting}
        className="focus-ring w-full rounded-[8px] border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/10 disabled:cursor-wait disabled:opacity-60"
      >
        {isStarting ? "Opening Google…" : "Use another Google account"}
      </button>
      {errorMessage ? <p className="mt-2 text-sm text-red-300" role="alert">{errorMessage}</p> : null}
    </div>
  );
}
