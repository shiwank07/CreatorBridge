"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Flag, Loader2, PlayCircle, RotateCcw, Upload, XCircle } from "lucide-react";

import { type BrandInquiryData } from "@/lib/types";

type CollaborationActionsProps = {
  collaboration: BrandInquiryData;
  mode: "creator" | "brand";
};

type ProofState = {
  videoUrl: string;
  timestampStart: string;
  timestampEnd: string;
  notes: string;
  referenceLink: string;
};

function canCreatorSubmitProof(status: BrandInquiryData["status"]) {
  return ["interested", "work_started", "proof_submitted", "changes_requested"].includes(status);
}

function canCreatorRespond(status: BrandInquiryData["status"]) {
  return status === "new" || status === "viewed";
}

function proofLabel(status: BrandInquiryData["status"]) {
  if (status === "changes_requested") return "Resubmit Proof";
  if (status === "proof_submitted") return "Update Proof";
  return "Submit Proof";
}

export function CollaborationActions({ collaboration, mode }: CollaborationActionsProps) {
  const router = useRouter();
  const proof = collaboration.deliveryProof;
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [responseNote, setResponseNote] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [proofForm, setProofForm] = useState<ProofState>({
    videoUrl: proof?.videoUrl ?? "",
    timestampStart: proof?.timestampStart ?? "",
    timestampEnd: proof?.timestampEnd ?? "",
    notes: proof?.notes ?? "",
    referenceLink: proof?.referenceLink ?? proof?.screenshotUrl ?? "",
  });

  function setProofField<K extends keyof ProofState>(key: K, value: ProofState[K]) {
    setProofForm((current) => ({ ...current, [key]: value }));
  }

  async function request(path: string, body?: Record<string, unknown>) {
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not update collaboration.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await request(`/api/collaborations/${collaboration.id}/proof`, proofForm);
  }

  async function review(action: "approve_delivery" | "request_changes" | "report_issue" | "mark_completed", note = "") {
    await request(`/api/collaborations/${collaboration.id}/review`, { action, note });
  }

  async function creatorResponse(action: "interested" | "decline") {
    await request(`/api/collaborations/${collaboration.id}/creator-response`, { action, note: responseNote });
  }

  if (mode === "creator") {
    if (canCreatorRespond(collaboration.status)) {
      return (
        <div className="mt-4 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 p-3">
          <p className="text-xs font-bold uppercase text-cyan-100">Request Details</p>
          {error ? <div className="mt-3 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-200">{error}</div> : null}

          <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--text-secondary)]">
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Brand:</span> {collaboration.companyName}
            </p>
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Budget:</span> {collaboration.budgetRange}
            </p>
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Timeline:</span> {collaboration.timeline}
            </p>
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Deliverables:</span>{" "}
              {collaboration.deliverables.length > 0 ? collaboration.deliverables.join(", ") : "Not listed"}
            </p>
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Audience:</span>{" "}
              {collaboration.targetNiches.length > 0 ? collaboration.targetNiches.join(", ") : "Not listed"}
            </p>
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Platforms:</span>{" "}
              {collaboration.targetPlatforms.length > 0 ? collaboration.targetPlatforms.join(", ") : "Not listed"}
            </p>
            {collaboration.message ? (
              <p className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-2">
                <span className="font-semibold text-[var(--text-primary)]">Brand note:</span> {collaboration.message}
              </p>
            ) : null}
          </div>

          <label className="mt-3 block">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Response note</span>
            <textarea
              value={responseNote}
              onChange={(event) => setResponseNote(event.target.value)}
              className="bridge-input mt-1 min-h-16 px-3 py-2 text-xs"
              placeholder="Optional note for the brand"
            />
          </label>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => creatorResponse("interested")} disabled={isSaving} className="bridge-button-primary w-full px-3 py-2 text-xs">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Interested
            </button>
            <button type="button" onClick={() => creatorResponse("decline")} disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Decline
            </button>
          </div>
        </div>
      );
    }

    if (!canCreatorSubmitProof(collaboration.status)) {
      return (
        <div className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-[var(--text-secondary)]">
          {collaboration.creatorResponseNote ? (
            <span>
              <span className="font-semibold text-[var(--text-primary)]">Response:</span> {collaboration.creatorResponseNote}
            </span>
          ) : (
            "Delivery proof opens after the collaboration is accepted."
          )}
        </div>
      );
    }

    return (
      <div className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
        {error ? <div className="mb-3 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-200">{error}</div> : null}

        {collaboration.creatorResponseNote ? (
          <div className="mb-3 rounded-[8px] border border-emerald-900/50 bg-emerald-950/25 px-3 py-2 text-xs leading-5 text-emerald-100">
            {collaboration.creatorResponseNote}
          </div>
        ) : null}

        {collaboration.status === "interested" ? (
          <button
            type="button"
            onClick={() => request(`/api/collaborations/${collaboration.id}/work-started`)}
            disabled={isSaving}
            className="bridge-button-secondary mb-3 w-full px-3 py-2 text-xs"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
            Mark Work Started
          </button>
        ) : null}

        {proof?.reviewNote && collaboration.status === "changes_requested" ? (
          <div className="mb-3 rounded-[8px] border border-yellow-700/50 bg-yellow-950/30 px-3 py-2 text-xs leading-5 text-yellow-100">
            {proof.reviewNote}
          </div>
        ) : null}

        <form onSubmit={submitProof} className="grid gap-3">
          <label>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Video URL</span>
            <input
              value={proofForm.videoUrl}
              onChange={(event) => setProofField("videoUrl", event.target.value)}
              className="bridge-input mt-1 px-3 py-2 text-xs"
              placeholder="https://..."
              required
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Start</span>
              <input
                value={proofForm.timestampStart}
                onChange={(event) => setProofField("timestampStart", event.target.value)}
                className="bridge-input mt-1 px-3 py-2 text-xs"
                placeholder="00:12"
                required
              />
            </label>
            <label>
              <span className="text-xs font-semibold text-[var(--text-primary)]">End</span>
              <input
                value={proofForm.timestampEnd}
                onChange={(event) => setProofField("timestampEnd", event.target.value)}
                className="bridge-input mt-1 px-3 py-2 text-xs"
                placeholder="01:04"
                required
              />
            </label>
          </div>
          <label>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Notes</span>
            <textarea
              value={proofForm.notes}
              onChange={(event) => setProofField("notes", event.target.value)}
              className="bridge-input mt-1 min-h-20 px-3 py-2 text-xs"
              placeholder="What should the brand review?"
              required
            />
          </label>
          <label>
            <span className="text-xs font-semibold text-[var(--text-primary)]">Reference link</span>
            <input
              value={proofForm.referenceLink}
              onChange={(event) => setProofField("referenceLink", event.target.value)}
              className="bridge-input mt-1 px-3 py-2 text-xs"
              placeholder="Optional reference URL"
            />
          </label>
          <button type="submit" disabled={isSaving} className="bridge-button-primary w-full px-3 py-2 text-xs">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {proofLabel(collaboration.status)}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Delivery Proof</p>
      {error ? <div className="mt-3 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-200">{error}</div> : null}

      {proof?.videoUrl ? (
        <div className="mt-3 grid gap-3">
          <Link href={proof.videoUrl} target="_blank" rel="noreferrer" className="bridge-button-secondary w-full px-3 py-2 text-xs">
            <ExternalLink size={14} />
            Open Video URL
          </Link>
          <div className="grid gap-2 text-xs leading-5 text-[var(--text-secondary)]">
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Timestamp:</span> {proof.timestampStart || "0:00"} - {proof.timestampEnd || "End"}
            </p>
            <p>{proof.notes}</p>
            {proof.referenceLink || proof.screenshotUrl ? (
              <Link href={proof.referenceLink || proof.screenshotUrl || ""} target="_blank" rel="noreferrer" className="inline-flex font-semibold text-cyan-200 hover:text-cyan-100">
                Open reference link
              </Link>
            ) : null}
            {proof.reviewNote ? (
              <p className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-2">
                <span className="font-semibold text-[var(--text-primary)]">Review note:</span> {proof.reviewNote}
              </p>
            ) : null}
            {proof.issueNote ? (
              <p className="rounded-[8px] border border-red-900/60 bg-red-950/30 px-3 py-2 text-red-100">
                <span className="font-semibold">Issue:</span> {proof.issueNote}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => review("approve_delivery")}
              disabled={isSaving || collaboration.status === "approved" || collaboration.status === "completed"}
              className="bridge-button-primary w-full px-3 py-2 text-xs"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Approve Delivery
            </button>
            {collaboration.status === "approved" ? (
              <button
                type="button"
                onClick={() => review("mark_completed")}
                disabled={isSaving}
                className="bridge-button-secondary w-full px-3 py-2 text-xs"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Mark Completed
              </button>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void review("request_changes", reviewNote);
            }}
            className="grid gap-2"
          >
            <textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              className="bridge-input min-h-16 px-3 py-2 text-xs"
              placeholder="Note for requested changes"
            />
            <button type="submit" disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Request Changes
            </button>
          </form>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void review("report_issue", issueNote);
            }}
            className="grid gap-2"
          >
            <textarea
              value={issueNote}
              onChange={(event) => setIssueNote(event.target.value)}
              className="bridge-input min-h-16 px-3 py-2 text-xs"
              placeholder="Describe an issue"
            />
            <button type="submit" disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
              Report Issue
            </button>
          </form>
        </div>
      ) : (
        <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">No delivery proof has been submitted yet.</p>
      )}
    </div>
  );
}
