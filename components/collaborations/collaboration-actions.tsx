"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CreditCard, ExternalLink, Flag, Loader2, PlayCircle, RotateCcw, Upload, XCircle } from "lucide-react";

import { formatINR } from "@/lib/format";
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

type PaymentState = {
  paymentNote: string;
  paymentScreenshotUrl: string;
};

function canCreatorSubmitProof(status: BrandInquiryData["status"]) {
  return ["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED"].includes(status);
}

function canCreatorRespond(status: BrandInquiryData["status"]) {
  return ["NEW", "PENDING_CREATOR_RESPONSE"].includes(status);
}

function canBrandReviewProof(status: BrandInquiryData["status"]) {
  return ["PROOF_SUBMITTED", "REVISION_REQUESTED"].includes(status);
}

function canBrandCancel(status: BrandInquiryData["status"]) {
  return ["NEW", "PENDING_CREATOR_RESPONSE"].includes(status);
}

function canManagePayment(status: BrandInquiryData["status"]) {
  return ["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED", "APPROVED", "COMPLETED"].includes(status);
}

function paymentStatusLabel(status: BrandInquiryData["paymentStatus"]) {
  if (status === "payment_sent") return "Payment Sent";
  if (status === "payment_received") return "Payment Received";
  if (status === "payment_disputed") return "Payment Disputed";
  return "Payment Pending";
}

function proofLabel(status: BrandInquiryData["status"]) {
  if (status === "REVISION_REQUESTED") return "Resubmit Proof";
  if (status === "PROOF_SUBMITTED") return "Update Proof";
  return "Submit Proof";
}

function currentOfferLabel(collaboration: BrandInquiryData) {
  return collaboration.currentOfferAmount ? formatINR(collaboration.currentOfferAmount) : "Exact offer not recorded";
}

function OfferSummary({ collaboration }: { collaboration: BrandInquiryData }) {
  return (
    <div className="min-w-0 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 p-3 [overflow-wrap:anywhere]">
      <p className="text-xs font-bold uppercase text-cyan-100">Offer Details</p>
      <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--text-secondary)]">
        <p>
          <span className="font-semibold text-[var(--text-primary)]">Offer amount:</span> {currentOfferLabel(collaboration)}
        </p>
        <p>
          <span className="font-semibold text-[var(--text-primary)]">Currency:</span> {collaboration.currency}
        </p>
      </div>
    </div>
  );
}

function PaymentDetailsList({ collaboration }: { collaboration: BrandInquiryData }) {
  const details = collaboration.creatorPaymentDetails;
  const rows = [
    ["UPI ID", details?.upiId],
    ["PayPal email", details?.paypalEmail],
    ["Bank account name", details?.bankAccountName],
    ["Bank account number", details?.bankAccountNumber],
    ["IFSC", details?.ifsc],
    ["Preferred payment note", details?.preferredPaymentNote],
  ].filter(([, value]) => value && String(value).trim());

  if (!rows.length) {
    return <p className="text-xs leading-5 text-[var(--text-secondary)]">Creator payment details have not been added yet.</p>;
  }

  return (
    <div className="grid gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5">
          <p className="font-semibold uppercase text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 break-words text-[var(--text-primary)]">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function CollaborationActions({ collaboration, mode }: CollaborationActionsProps) {
  const router = useRouter();
  const proof = collaboration.deliveryProof;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [paymentForm, setPaymentForm] = useState<PaymentState>({
    paymentNote: collaboration.paymentNote ?? "",
    paymentScreenshotUrl: collaboration.paymentScreenshotUrl ?? "",
  });
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

  function setPaymentField<K extends keyof PaymentState>(key: K, value: PaymentState[K]) {
    setPaymentForm((current) => ({ ...current, [key]: value }));
  }

  async function request(path: string, body?: Record<string, unknown>, successMessage = "Collaboration updated.") {
    setError("");
    setSuccess("");
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

      setSuccess(successMessage);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await request(`/api/collaborations/${collaboration.id}/proof`, proofForm, "Delivery proof was submitted.");
  }

  async function review(action: "approve_delivery" | "request_changes" | "report_issue" | "mark_completed", note = "") {
    const messages = {
      approve_delivery: "Delivery was approved.",
      request_changes: "Revision request was sent.",
      report_issue: "Issue report was submitted.",
      mark_completed: "Collaboration was closed as completed.",
    };
    await request(`/api/collaborations/${collaboration.id}/review`, { action, note }, messages[action]);
  }

  async function creatorResponse(action: "accept_offer" | "decline_offer") {
    await request(
      `/api/collaborations/${collaboration.id}/creator-response`,
      { action },
      action === "accept_offer" ? "Offer accepted. Contact details are now unlocked." : "Offer declined.",
    );
  }

  async function cancelCollaboration() {
    await request(
      `/api/collaborations/${collaboration.id}/cancel`,
      { note: "Brand cancelled before creator acceptance." },
      "Collaboration request was cancelled.",
    );
  }

  async function updatePayment(action: "mark_payment_sent" | "mark_payment_received" | "mark_payment_disputed") {
    const messages = {
      mark_payment_sent: "Payment marked as sent.",
      mark_payment_received: "Payment marked as received.",
      mark_payment_disputed: "Payment marked as disputed.",
    };
    await request(`/api/collaborations/${collaboration.id}/payment`, { action, ...paymentForm }, messages[action]);
  }

  const paymentPanel = canManagePayment(collaboration.status) ? (
    <div className="min-w-0 rounded-[8px] border border-yellow-700/40 bg-yellow-950/20 p-3 [overflow-wrap:anywhere]">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-200" />
        <p className="text-xs leading-5 text-yellow-100">
          Branzzo does not process payments yet. Payments happen outside the platform. We recommend written confirmation and partial advance before work begins.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">
          <CreditCard size={13} />
          {paymentStatusLabel(collaboration.paymentStatus)}
        </span>
      </div>

      {mode === "brand" ? (
        <div className="mt-3 grid gap-3">
          <p className="text-xs font-bold uppercase text-yellow-100">Creator payment details</p>
          <PaymentDetailsList collaboration={collaboration} />
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        <input
          value={paymentForm.paymentScreenshotUrl}
          onChange={(event) => setPaymentField("paymentScreenshotUrl", event.target.value)}
          className="bridge-input px-3 py-2 text-xs"
          placeholder="Optional payment screenshot URL"
        />
        <textarea
          value={paymentForm.paymentNote}
          onChange={(event) => setPaymentField("paymentNote", event.target.value)}
          className="bridge-input min-h-16 px-3 py-2 text-xs"
          placeholder="Optional payment note"
        />
        {mode === "brand" ? (
          <button type="button" onClick={() => updatePayment("mark_payment_sent")} disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
            Mark Payment Sent
          </button>
        ) : (
          <button type="button" onClick={() => updatePayment("mark_payment_received")} disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Mark Payment Received
          </button>
        )}
        <button type="button" onClick={() => updatePayment("mark_payment_disputed")} disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
          Mark Payment Disputed
        </button>
      </div>
    </div>
  ) : null;

  if (mode === "creator") {
    if (canCreatorRespond(collaboration.status)) {
      return (
        <div className="mt-4 grid gap-3">
          <OfferSummary collaboration={collaboration} />
          <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 [overflow-wrap:anywhere]">
          <p className="text-xs font-bold uppercase text-cyan-100">Request Details</p>
          {error ? (
            <div role="alert" className="mt-3 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div role="status" className="mt-3 rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-100">
              {success}
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 text-xs leading-5 text-[var(--text-secondary)]">
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Deliverables:</span>{" "}
              {collaboration.deliverables.length > 0 ? collaboration.deliverables.join(", ") : "Not listed"}
            </p>
            <p>
              <span className="font-semibold text-[var(--text-primary)]">Timeline:</span> {collaboration.timeline}
            </p>
            {collaboration.message ? (
              <p className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-2">
                <span className="font-semibold text-[var(--text-primary)]">Brand note:</span> {collaboration.message}
              </p>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => creatorResponse("accept_offer")} disabled={isSaving} className="bridge-button-primary w-full px-3 py-2 text-xs">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Accept
            </button>
            <button type="button" onClick={() => creatorResponse("decline_offer")} disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Decline
            </button>
          </div>

          <p className="mt-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
            Accept to unlock contact email and move the collaboration into active work, or decline to close the request.
          </p>
          </div>
        </div>
      );
    }

    if (!canCreatorSubmitProof(collaboration.status)) {
      return (
        <div className="mt-4 grid gap-3">
          <OfferSummary collaboration={collaboration} />
          <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-[var(--text-secondary)] [overflow-wrap:anywhere]">
            {collaboration.creatorResponseNote ? (
              <span>
                <span className="font-semibold text-[var(--text-primary)]">Response:</span> {collaboration.creatorResponseNote}
              </span>
            ) : (
              "Delivery proof opens after the collaboration is accepted."
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 grid gap-3">
        <OfferSummary collaboration={collaboration} />
        {paymentPanel}
        <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 [overflow-wrap:anywhere]">
        {error ? (
          <div role="alert" className="mb-3 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}
        {success ? (
          <div role="status" className="mb-3 rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-100">
            {success}
          </div>
        ) : null}

        {collaboration.creatorResponseNote ? (
          <div className="mb-3 rounded-[8px] border border-emerald-900/50 bg-emerald-950/25 px-3 py-2 text-xs leading-5 text-emerald-100">
            {collaboration.creatorResponseNote}
          </div>
        ) : null}

        {collaboration.status === "ACCEPTED" ? (
          <button
            type="button"
            onClick={() => request(`/api/collaborations/${collaboration.id}/work-started`, undefined, "Work status moved to in progress.")}
            disabled={isSaving}
            className="bridge-button-secondary mb-3 w-full px-3 py-2 text-xs"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
            Mark In Progress
          </button>
        ) : null}

        {proof?.reviewNote && collaboration.status === "REVISION_REQUESTED" ? (
          <div className="mb-3 rounded-[8px] border border-yellow-700/50 bg-yellow-950/30 px-3 py-2 text-xs leading-5 text-yellow-100">
            {proof.reviewNote}
          </div>
        ) : null}

        <form onSubmit={submitProof} aria-busy={isSaving} className="grid gap-3">
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
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      <OfferSummary collaboration={collaboration} />
      {paymentPanel}
      {canBrandCancel(collaboration.status) ? (
        <div className="min-w-0 rounded-[8px] border border-red-900/60 bg-red-950/25 p-3 [overflow-wrap:anywhere]">
          <p className="text-xs font-bold uppercase text-red-100">Pending request</p>
          <p className="mt-2 text-xs leading-5 text-red-100/90">
            You can cancel this request before the creator accepts. After acceptance or work start, cancellation requires dispute/admin review.
          </p>
          {error ? (
            <div role="alert" className="mt-3 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          ) : null}
          {success ? (
            <div role="status" className="mt-3 rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-100">
              {success}
            </div>
          ) : null}
          <button type="button" onClick={cancelCollaboration} disabled={isSaving} className="bridge-button-secondary mt-3 w-full px-3 py-2 text-xs">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Cancel Collaboration
          </button>
        </div>
      ) : canManagePayment(collaboration.status) ? (
        <div className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
          Cancellation after acceptance or work start requires dispute/admin review.
        </div>
      ) : null}
      <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 [overflow-wrap:anywhere]">
      <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Delivery Proof</p>
      {error ? (
        <div role="alert" className="mt-3 rounded-[8px] border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="mt-3 rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-100">
          {success}
        </div>
      ) : null}

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

          {collaboration.status === "COMPLETED" ? (
            <div className="rounded-[8px] border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs leading-5 text-emerald-100">
              This collaboration is complete. No further review actions are available.
            </div>
          ) : null}

          {collaboration.status === "APPROVED" ? (
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => review("mark_completed")}
                disabled={isSaving}
                className="bridge-button-secondary w-full px-3 py-2 text-xs"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Close Collaboration
              </button>
            </div>
          ) : null}

          {canBrandReviewProof(collaboration.status) ? (
            <>
              <button
                type="button"
                onClick={() => review("approve_delivery")}
                disabled={isSaving}
                className="bridge-button-primary w-full px-3 py-2 text-xs"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Approve Delivery
              </button>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void review("request_changes", reviewNote);
                }}
                aria-busy={isSaving}
                className="grid gap-2"
              >
                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  className="bridge-input min-h-16 px-3 py-2 text-xs"
                  placeholder="Revision note"
                  required
                />
                <button type="submit" disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  Request Revision
                </button>
              </form>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void review("report_issue", issueNote);
                }}
                aria-busy={isSaving}
                className="grid gap-2"
              >
                <textarea
                  value={issueNote}
                  onChange={(event) => setIssueNote(event.target.value)}
                  className="bridge-input min-h-16 px-3 py-2 text-xs"
                  placeholder="Describe an issue"
                  required
                />
                <button type="submit" disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                  Report Issue
                </button>
              </form>
            </>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">No delivery proof has been submitted yet.</p>
      )}
      </div>
    </div>
  );
}
