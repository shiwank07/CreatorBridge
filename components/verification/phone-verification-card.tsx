"use client";

import { useEffect, useRef, useState } from "react";
import { useReverification, useUser } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
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

type PhoneVerificationPhase =
  | "not_added"
  | "reverification_required"
  | "sending_otp"
  | "otp_sent"
  | "verifying"
  | "verified"
  | "failed";

const E164_PHONE_PATTERN = /^\+\d{7,15}$/;
const RESEND_COOLDOWN_SECONDS = 30;

function isVerified(phone?: ClerkPhoneResource | null) {
  return phone?.verification?.status === "verified";
}

function clerkErrors(error: unknown) {
  if (typeof error === "object" && error !== null && "errors" in error) {
    return (error as { errors?: { code?: string; longMessage?: string; message?: string }[] }).errors ?? [];
  }

  return [];
}

function hasClerkErrorCode(error: unknown, code: string) {
  return clerkErrors(error).some((item) => item.code === code);
}

function clerkErrorMessage(error: unknown, fallback = "Could not verify this phone number.") {
  const errors = clerkErrors(error);
  const firstError = errors[0];
  const errorCode = firstError?.code ?? "";
  const message = firstError?.longMessage ?? firstError?.message ?? (error instanceof Error ? error.message : "");
  const normalizedMessage = message.toLowerCase();

  if (errorCode === "session_reverification_required") {
    return "Reverification is required before adding this phone number. Complete the Clerk security check, then the OTP will be sent.";
  }

  if (errorCode === "form_code_incorrect" || normalizedMessage.includes("incorrect") || normalizedMessage.includes("invalid code")) {
    return "That OTP is incorrect. Check the code and try again.";
  }

  if (errorCode.includes("expired") || normalizedMessage.includes("expired")) {
    return "That OTP has expired. Send a new OTP and try again.";
  }

  return message || fallback;
}

function statusLabel(phase: PhoneVerificationPhase) {
  if (phase === "verified") return { label: "Verified", tone: "green" as const };
  if (phase === "reverification_required") return { label: "Reverification required", tone: "yellow" as const };
  if (phase === "sending_otp") return { label: "Sending OTP", tone: "yellow" as const };
  if (phase === "otp_sent") return { label: "OTP sent", tone: "yellow" as const };
  if (phase === "verifying") return { label: "Verifying", tone: "yellow" as const };
  if (phase === "failed") return { label: "Failed", tone: "neutral" as const };
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
  const [phase, setPhase] = useState<PhoneVerificationPhase>(initialPhoneVerified ? "verified" : "not_added");
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const currentStatus = statusLabel(phase);
  const canSend =
    isLoaded &&
    Boolean(user) &&
    E164_PHONE_PATTERN.test(normalizedPhoneNumber) &&
    !phoneVerified &&
    !isSending &&
    !isVerifying &&
    cooldownRemaining === 0;
  const canVerify = codeSent && Boolean(code.trim()) && !isSending && !isVerifying;

  const findOrCreatePhoneNumber = useReverification(async (value: string) => {
    if (!user) throw new Error("Sign in before verifying a phone number.");

    const existingPhone = user.phoneNumbers.find((phone) => samePhoneNumber(phone.phoneNumber, value)) as ClerkPhoneResource | undefined;
    if (existingPhone) return existingPhone;

    try {
      return (await user.createPhoneNumber({ phoneNumber: value })) as ClerkPhoneResource;
    } catch (createError) {
      if (hasClerkErrorCode(createError, "session_reverification_required")) {
        setPhase("reverification_required");
      }
      throw createError;
    }
  });

  useEffect(() => {
    if (!cooldownEndsAt) {
      setCooldownRemaining(0);
      return;
    }

    function updateCooldown() {
      setCooldownRemaining(Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000)));
    }

    updateCooldown();
    const intervalId = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldownEndsAt]);

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
    setPhase("verified");
    setCode("");
    setCodeSent(false);
    setCooldownEndsAt(0);
    activePhoneRef.current = null;
    setSuccess("Phone verified.");
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
    setPhase("sending_otp");
    try {
      const phone = await findOrCreatePhoneNumber(normalizedPhoneNumber);
      setPhase("sending_otp");

      if (isVerified(phone)) {
        await user.reload();
        await syncVerifiedPhone(phone);
        return;
      }

      const preparedPhone = await phone.prepareVerification();
      activePhoneRef.current = preparedPhone;
      setPhoneNumber(preparedPhone.phoneNumber || normalizedPhoneNumber);
      setPhoneVerified(false);
      setCodeSent(true);
      setPhase("otp_sent");
      setCooldownEndsAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setSuccess("Verification code sent.");
    } catch (sendError) {
      setPhase("failed");
      setError(
        isReverificationCancelledError(sendError)
          ? "Reverification was cancelled. Complete reverification before sending an OTP."
          : clerkErrorMessage(sendError, "Could not send an OTP to this phone number."),
      );
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
    setPhase("verifying");
    try {
      const attemptedPhone = await activePhone.attemptVerification({ code: code.trim() });
      const reloadedUser = await user.reload();
      const verifiedPhone = isVerified(attemptedPhone)
        ? attemptedPhone
        : (reloadedUser.phoneNumbers.find((phone) => phone.id === activePhone.id) as ClerkPhoneResource | undefined);

      if (!verifiedPhone || !isVerified(verifiedPhone)) {
        setPhase("failed");
        const verificationStatus = attemptedPhone.verification?.status ?? verifiedPhone?.verification?.status ?? "";
        setError(
          verificationStatus === "expired"
            ? "That OTP has expired. Send a new OTP and try again."
            : "That OTP did not verify the phone number. Check the code or request a new OTP.",
        );
        return;
      }

      await syncVerifiedPhone(verifiedPhone);
    } catch (verifyError) {
      setPhase("failed");
      setError(clerkErrorMessage(verifyError, "Could not verify this OTP."));
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
              setPhase("not_added");
              setCodeSent(false);
              setCooldownEndsAt(0);
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
          {phoneVerified
            ? "Synced"
            : isSending
              ? "Sending"
              : cooldownRemaining > 0
                ? `Resend in ${cooldownRemaining}s`
                : codeSent
                  ? "Resend OTP"
                  : "Send OTP"}
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
