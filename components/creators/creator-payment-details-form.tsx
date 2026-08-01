"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type Details = { preferredMethod: "upi" | "bank"; upiId: string; accountHolderName: string; bankName: string; accountNumber: string; ifscCode: string; paymentNote: string };
const empty: Details = { preferredMethod: "upi", upiId: "", accountHolderName: "", bankName: "", accountNumber: "", ifscCode: "", paymentNote: "" };

export function CreatorPaymentDetailsForm() {
  const [form, setForm] = useState(empty);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { void fetch("/api/creator/payment-details", { cache: "no-store" }).then(async (r) => { const data = await r.json(); if (r.ok && data.paymentDetails) setForm({ ...empty, ...data.paymentDetails }); }); }, []);
  const set = <K extends keyof Details>(key: K, value: Details[K]) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try { const response = await fetch("/api/creator/payment-details", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) setError(data.error ?? "Could not save payment details."); else { setMessage("Payment details saved."); setRevealed(false); } } catch { setError("Could not reach the server."); } finally { setSaving(false); }
  }
  return <section className="mt-8 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
    <p className="bridge-eyebrow">Private settings</p><h2 className="mt-2 font-display text-2xl font-bold">Creator Payment Details</h2>
    <p className="mt-2 text-sm text-[var(--text-secondary)]">Saved once and shared only with brands in accepted collaborations.</p>
    <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm">Preferred method<select className="bridge-input mt-2" value={form.preferredMethod} onChange={(e) => set("preferredMethod", e.target.value as Details["preferredMethod"])}><option value="upi">UPI</option><option value="bank">Bank Transfer</option></select></label>
      <label className="text-sm">UPI ID<input className="bridge-input mt-2" value={form.upiId} onChange={(e) => set("upiId", e.target.value)} autoComplete="off" placeholder="name@bank" /></label>
      <label className="text-sm">Account-holder name<input className="bridge-input mt-2" value={form.accountHolderName} onChange={(e) => set("accountHolderName", e.target.value)} /></label>
      <label className="text-sm">Bank name<input className="bridge-input mt-2" value={form.bankName} onChange={(e) => set("bankName", e.target.value)} /></label>
      <label className="text-sm">Account number<div className="relative mt-2"><input className="bridge-input pr-11" type={revealed ? "text" : "password"} value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} inputMode="numeric" autoComplete="off" /><button type="button" aria-label={revealed ? "Hide account number" : "Reveal account number"} onClick={() => setRevealed((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">{revealed ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
      <label className="text-sm">IFSC code<input className="bridge-input mt-2 uppercase" value={form.ifscCode} onChange={(e) => set("ifscCode", e.target.value)} maxLength={11} /></label>
      <label className="text-sm sm:col-span-2">Optional payment note<textarea className="bridge-input mt-2 min-h-20" value={form.paymentNote} onChange={(e) => set("paymentNote", e.target.value)} maxLength={500} /></label>
      {error ? <p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}{message ? <p role="status" className="text-sm text-emerald-300 sm:col-span-2">{message}</p> : null}
      <button disabled={saving} className="bridge-button-primary w-fit sm:col-span-2">{saving ? <Loader2 className="animate-spin" size={16}/> : null}Save payment details</button>
    </form>
  </section>;
}
