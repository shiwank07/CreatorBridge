"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, CreditCard, Eye, EyeOff, ExternalLink, Flag, Loader2, PlayCircle, RotateCcw, Upload, XCircle } from "lucide-react";

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
  screenshotUrl: string;
  referenceLink: string;
};

type PaymentState = {
  paymentNote: string;
  transactionId: string;
  proofId: string;
};

function canCreatorSubmitProof(status: BrandInquiryData["status"]) {
  return ["ACCEPTED", "IN_PROGRESS", "PROOF_SUBMITTED", "REVISION_REQUESTED"].includes(status);
}

function canCreatorRespond(collaboration: BrandInquiryData) {
  return ["NEW", "PENDING_CREATOR_RESPONSE"].includes(collaboration.status) ||
    (collaboration.status === "NEGOTIATING" && collaboration.offerHistory.at(-1)?.actor === "brand");
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
    <div className="min-w-0 rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 p-3 [overflow-wrap:break-word] [word-break:normal]">
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
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState("");
  const details = collaboration.creatorPaymentDetails;
  const rows = [
    ["UPI ID", details?.upiId],
    ["Account-holder name", details?.accountHolderName],
    ["Bank name", details?.bankName],
    ["Bank account number", details?.bankAccountNumber],
    ["IFSC", details?.ifscCode],
    ["Payment note", details?.paymentNote],
  ].filter(([, value]) => value && String(value).trim());

  async function copy(label: string, value: string) { try { await navigator.clipboard.writeText(value); setCopied(label); window.setTimeout(() => setCopied(""), 2000); } catch { setCopied("Copy failed"); window.setTimeout(() => setCopied(""), 2000); } }

  if (!rows.length) {
    return <p className="text-xs leading-5 text-[var(--text-secondary)]">Creator payment details have not been added yet.</p>;
  }

  return (
    <div className="grid gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5">
          <p className="font-semibold uppercase text-[var(--text-muted)]">{label}</p>
          <div className="mt-1 flex items-center justify-between gap-2"><p className="break-words text-[var(--text-primary)]">{label === "Bank account number" && !revealed ? `••••••${String(value).slice(-4)}` : value}</p><div className="flex gap-1">{label === "Bank account number" ? <button type="button" aria-label={revealed ? "Hide account number" : "Reveal account number"} onClick={() => setRevealed((v) => !v)}>{revealed ? <EyeOff size={14}/> : <Eye size={14}/>}</button> : null}<button type="button" aria-label={`Copy ${label}`} onClick={() => copy(String(label), String(value ?? ""))}><Copy size={14}/></button></div></div>
          {copied === label ? <p role="status" className="text-emerald-300">Copied</p> : null}{copied === "Copy failed" ? <p role="alert" className="text-red-300">Copy failed</p> : null}
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
  const [counterAmount, setCounterAmount] = useState(String(collaboration.currentOfferAmount ?? ""));
  const [counterNote, setCounterNote] = useState("");
  const [paymentForm, setPaymentForm] = useState<PaymentState>({
    paymentNote: collaboration.paymentNote ?? "",
    transactionId: "",
    proofId: "",
  });
  const [proofForm, setProofForm] = useState<ProofState>({
    videoUrl: proof?.videoUrl ?? "",
    timestampStart: proof?.timestampStart ?? "",
    timestampEnd: proof?.timestampEnd ?? "",
    notes: proof?.notes ?? "",
    screenshotUrl: proof?.screenshotUrl ?? "",
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

  async function creatorResponse(action: "accept_offer" | "decline_offer" | "counter_offer") {
    await request(
      `/api/collaborations/${collaboration.id}/creator-response`,
      { action, amount: action === "counter_offer" ? Number(counterAmount) : undefined, note: counterNote },
      action === "accept_offer" ? "Offer accepted. Contact details are now unlocked." : action === "counter_offer" ? "Counter offer sent." : "Offer declined.",
    );
  }

  async function brandResponse(action: "accept_counter" | "reject_counter" | "counter_offer") {
    await request(
      `/api/collaborations/${collaboration.id}/brand-response`,
      { action, amount: action === "counter_offer" ? Number(counterAmount) : undefined, note: counterNote },
      action === "accept_counter" ? "Counter offer accepted." : action === "counter_offer" ? "New offer sent." : "Counter offer rejected.",
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
    <div className="min-w-0 rounded-[8px] border border-yellow-700/40 bg-yellow-950/20 p-3 [overflow-wrap:break-word] [word-break:normal]">
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
        {mode === "brand" ? <><input aria-label="Transaction reference ID" value={paymentForm.transactionId} onChange={(event) => setPaymentField("transactionId", event.target.value)} className="bridge-input px-3 py-2 text-xs" placeholder="Optional transaction/reference ID"/><input aria-label="Payment screenshot" type="file" accept="image/jpeg,image/png,image/webp" className="bridge-input px-3 py-2 text-xs" onChange={async (event) => { const file=event.target.files?.[0]; if (!file) return; if (file.size > 1024*1024) { setError("Payment screenshot must be 1 MB or smaller."); return; } const data=new FormData(); data.set("proofType","payment"); data.set("files",file); data.set("transactionId",paymentForm.transactionId); data.set("note",paymentForm.paymentNote); const response=await fetch(`/api/collaborations/${collaboration.id}/proofs`,{method:"POST",body:data}); const result=await response.json(); if (!response.ok) setError(result.error ?? "Could not upload payment proof."); else { setPaymentField("proofId",result.proofIds[0]); setSuccess("Payment proof uploaded securely."); } }} />{paymentForm.proofId ? <p className="text-xs text-emerald-300">Screenshot ready</p> : null}</> : null}
        <textarea
          aria-label="Payment note"
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
  ) : mode === "brand" ? (
    <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs font-bold uppercase text-cyan-100">Creator Payment Details</p>
      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">Available after the creator accepts this collaboration.</p>
    </div>
  ) : null;

  if (mode === "creator") {
    if (canCreatorRespond(collaboration)) {
      return (
        <div className="mt-4 grid gap-3">
          <OfferSummary collaboration={collaboration} />
          <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 [overflow-wrap:break-word] [word-break:normal]">
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
          <form onSubmit={(event) => { event.preventDefault(); void creatorResponse("counter_offer"); }} className="mt-3 grid gap-2">
            <label>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Counter offer (INR)</span>
              <input type="number" min={1} value={counterAmount} onChange={(event) => setCounterAmount(event.target.value)} className="bridge-input mt-1 px-3 py-2 text-xs" required />
            </label>
            <label>
              <span className="text-xs font-semibold text-[var(--text-primary)]">Counter message</span>
              <textarea value={counterNote} onChange={(event) => setCounterNote(event.target.value)} className="bridge-input mt-1 min-h-16 px-3 py-2 text-xs" required />
            </label>
            <button type="submit" disabled={isSaving} className="bridge-button-secondary w-full px-3 py-2 text-xs">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}Counter Offer
            </button>
          </form>

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
          <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-[var(--text-secondary)] [overflow-wrap:break-word] [word-break:normal]">
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
        <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 [overflow-wrap:break-word] [word-break:normal]">
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
            <span className="text-xs font-semibold text-[var(--text-primary)]">Screenshot URL</span>
            <input value={proofForm.screenshotUrl} onChange={(event) => setProofField("screenshotUrl", event.target.value)} className="bridge-input mt-1 px-3 py-2 text-xs" placeholder="Optional screenshot URL" />
          </label>
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
      {collaboration.status === "NEGOTIATING" && collaboration.offerHistory.at(-1)?.actor === "creator" ? (
        <div className="rounded-[8px] border border-cyan-300/20 bg-cyan-300/10 p-3">
          <p className="text-xs font-bold uppercase text-cyan-100">Creator counter offer</p>
          <p className="mt-2 text-sm">{currentOfferLabel(collaboration)}</p>
          {collaboration.offerHistory.at(-1)?.note ? <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{collaboration.offerHistory.at(-1)?.note}</p> : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => brandResponse("accept_counter")} disabled={isSaving} className="bridge-button-primary px-3 py-2 text-xs"><Check size={14} />Accept Counter</button>
            <button type="button" onClick={() => brandResponse("reject_counter")} disabled={isSaving || counterNote.trim().length < 2} className="bridge-button-secondary px-3 py-2 text-xs"><XCircle size={14} />Reject Counter</button>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void brandResponse("counter_offer"); }} className="mt-3 grid gap-2">
            <input type="number" min={1} aria-label="New offer amount" value={counterAmount} onChange={(event) => setCounterAmount(event.target.value)} className="bridge-input px-3 py-2 text-xs" required />
            <textarea aria-label="Negotiation message" value={counterNote} onChange={(event) => setCounterNote(event.target.value)} className="bridge-input min-h-16 px-3 py-2 text-xs" placeholder="Message or rejection reason" />
            <button type="submit" disabled={isSaving} className="bridge-button-secondary px-3 py-2 text-xs"><RotateCcw size={14} />Submit Another Offer</button>
          </form>
        </div>
      ) : null}
      {paymentPanel}
      {canBrandCancel(collaboration.status) ? (
        <div className="min-w-0 rounded-[8px] border border-red-900/60 bg-red-950/25 p-3 [overflow-wrap:break-word] [word-break:normal]">
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
      <div className="min-w-0 rounded-[8px] border border-white/10 bg-white/[0.035] p-3 [overflow-wrap:break-word] [word-break:normal]">
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
                  aria-label="Revision note"
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
                  aria-label="Issue report details"
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
