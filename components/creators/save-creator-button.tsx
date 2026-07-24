"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

export function SaveCreatorButton({
  username,
  initialSaved = false,
  className = "bridge-button-secondary px-4",
}: {
  username: string;
  initialSaved?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/saved-creators", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update saved creators.");
      setSaved(Boolean(result.saved));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update saved creators.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0">
      <button type="button" onClick={toggle} disabled={saving} aria-pressed={saved} className={`${className} w-full`}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {saved ? "Saved" : "Save Creator"}
      </button>
      {error ? <p role="alert" className="mt-1 text-xs text-red-200">{error}</p> : null}
    </div>
  );
}
