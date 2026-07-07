"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Phone, Send } from "lucide-react";

import { Badge } from "@/components/shared/badge";
import { samePhoneNumber } from "@/lib/clerk-verification";
import { normalizePhoneNumber } from "@/lib/phone";
import { cn } from "@/lib/utils";

type ClerkPhoneResource = {
  id: string;
  phoneNumber: string;
  verification?: {
    status?: string | null;
  } | null;
  prepareVerification: () => Promise<ClerkPhoneResource>;
  attemptVerification: (params: { code: string }) => Promise<ClerkPhoneResource>;
};

type PhoneVerificationCardProps = {
  initialPhoneNumber?: string;
  initialPhoneVerified?: boolean;
  className?: string;
};

const E164_PHONE_PATTERN = /^\+\d{7,15}$/;

function isVerified(phone?: ClerkPhoneResource | null) {
  return phone?.verification?.status === "verified";
}

function clerkErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "errors" in error) {
    const errors = (error as { errors?: { longMessage?: string; message?: string }[] }).errors;
    const message = errors?.[0]?.longMessage ?? errors?.[0]?.message;
    if (message) return message;
  }

  return error instanceof Error ? error.message : "Could not verify this phone number.";
}

function statusLabel(phoneNumber: string, phoneVerified: boolean) {
  if (phoneVerified) return { label: "Verified", tone: "green" as const };
  if (phoneNumber.trim()) return { label: "Pending verification", tone: "yellow" as const };
  return { label: "Not added", tone: "neutral" as const };
}

export function PhoneVerificationCard({
  initialPhoneNumber = "",
  initialPhoneVerified = false,
  className,
}: PhoneVerificationCardProps) {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const activePhoneRef = useRef<ClerkPhoneResource | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [code, setCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(initialPhoneVerified);
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const currentStatus = statusLabel(phoneNumber, phoneVerified);
  const canSend = isLoaded && Boolean(user) && E164_PHONE_PATTERN.test(normalizedPhoneNumber) && !phoneVerified && !isSending && !isVerifying;
  const canVerify = Boolean(code.trim()) && !isSending && !isVerifying;

  async function syncVerifiedPhone(phone: ClerkPhoneResource) {
    const response = await fetch("/api/account/phone-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: phone.phoneNumber,
        clerkPhoneNumberId: phone.id,
      }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      phoneNumber?: string;
    };

    if (!response.ok) {
      throw new Error(result.error ?? "Phone was verified in Clerk but could not be saved to Branzzo.");
    }

    setPhoneNumber(result.phoneNumber ?? phone.phoneNumber);
    setPhoneVerified(true);
    setCode("");
    setCodeSent(false);
    activePhoneRef.current = null;
    setSuccess("Phone verified.");
    await user?.reload();
    router.refresh();
  }

  async function sendCode() {
    if (isSending || isVerifying) return;
    setError("");
    setSuccess("");

    if (!user) {
      setError("Sign in before verifying a phone number.");
      return;
    }

    if (!E164_PHONE_PATTERN.test(normalizedPhoneNumber)) {
      setError("Enter your phone number in international format, for example +91 98765 43210.");
      return;
    }

    setIsSending(true);
    try {
      const existingPhone = user.phoneNumbers.find((phone) => samePhoneNumber(phone.phoneNumber, normalizedPhoneNumber)) as ClerkPhoneResource | undefined;
      const phone = existingPhone ?? ((await user.createPhoneNumber({ phoneNumber: normalizedPhoneNumber })) as ClerkPhoneResource);

      if (isVerified(phone)) {
        await syncVerifiedPhone(phone);
        return;
      }

      const preparedPhone = await phone.prepareVerification();
      activePhoneRef.current = preparedPhone;
      setPhoneNumber(preparedPhone.phoneNumber || normalizedPhoneNumber);
      setPhoneVerified(false);
      setCodeSent(true);
      setSuccess("Verification code sent.");
    } catch (sendError) {
      setError(clerkErrorMessage(sendError));
    } finally {
      setIsSending(false);
    }
  }

  async function verifyCode() {
    if (isVerifying || isSending) return;
    setError("");
    setSuccess("");

    if (!user) {
      setError("Sign in before verifying a phone number.");
      return;
    }

    const activePhone =
      activePhoneRef.current ??
      (user.phoneNumbers.find((phone) => samePhoneNumber(phone.phoneNumber, normalizedPhoneNumber)) as ClerkPhoneResource | undefined);

    if (!activePhone) {
      setError("Send a verification code before entering the OTP.");
      return;
    }

    setIsVerifying(true);
    try {
      const attemptedPhone = await activePhone.attemptVerification({ code: code.trim() });
      const verifiedPhone = isVerified(attemptedPhone)
        ? attemptedPhone
        : ((await user.reload()).phoneNumbers.find((phone) => phone.id === activePhone.id) as ClerkPhoneResource | undefined);

      if (!verifiedPhone || !isVerified(verifiedPhone)) {
        setError("That code did not verify the phone number.");
        return;
      }

      await syncVerifiedPhone(verifiedPhone);
    } catch (verifyError) {
      setError(clerkErrorMessage(verifyError));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <section className={cn("bridge-card min-w-0 p-5", className)}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="bridge-eyebrow">Phone Verification</p>
          <h2 className="mt-2 font-display text-xl font-bold">Private account trust phone</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Your phone number is private and used only for account trust, support, and urgent collaboration issues.
          </p>
        </div>
        <Badge tone={currentStatus.tone} className="sm:shrink-0">
          {currentStatus.label}
        </Badge>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="min-w-0">
          <span className="bridge-label">Phone number</span>
          <input
            value={phoneNumber}
            onChange={(event) => {
              setPhoneNumber(event.target.value);
              setPhoneVerified(false);
              setCodeSent(false);
              setCode("");
              activePhoneRef.current = null;
            }}
            className="bridge-input mt-2"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+91 98765 43210"
          />
        </label>
        <button type="button" onClick={sendCode} disabled={!canSend} className="bridge-button-secondary mt-0 h-12 self-end px-4 lg:mt-7">
          {isSending ? <Loader2 size={17} className="animate-spin" /> : phoneVerified ? <CheckCircle2 size={17} /> : <Send size={17} />}
          {phoneVerified ? "Synced" : isSending ? "Sending" : "Send OTP"}
        </button>
      </div>

      {codeSent ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="min-w-0">
            <span className="bridge-label">One-time code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
              className="bridge-input mt-2"
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="123456"
            />
          </label>
          <button type="button" onClick={verifyCode} disabled={!canVerify} className="bridge-button-primary h-12 self-end px-4 lg:mt-7">
            {isVerifying ? <Loader2 size={17} className="animate-spin" /> : <Phone size={17} />}
            {isVerifying ? "Verifying" : "Verify Phone"}
          </button>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="mt-4 rounded-[8px] border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="mt-4 rounded-[8px] border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}
    </section>
  );
}
