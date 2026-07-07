import { type ReactNode } from "react";

import { Badge } from "@/components/shared/badge";
import { type BrandVerificationStatus, type VerificationStatus } from "@/lib/types";
import { normalizeCreatorVerificationStatus } from "@/lib/verification";

type TrustPassportCardProps =
  | {
      accountType: "creator";
      emailVerified?: boolean;
      phoneAdded?: boolean;
      phoneNumber?: string;
      phoneVerified?: boolean;
      verificationStatus?: VerificationStatus;
      creatorVerificationStatus?: VerificationStatus;
      brandVerificationStatus?: BrandVerificationStatus;
      successfulCollaborations?: number;
      completedCollaborations?: number;
      joinedDate?: string;
      responseTimeLabel?: string;
      disputes?: number;
      className?: string;
    }
  | {
      accountType: "brand";
      emailVerified?: boolean;
      phoneAdded?: boolean;
      phoneNumber?: string;
      phoneVerified?: boolean;
      verificationStatus?: BrandVerificationStatus;
      creatorVerificationStatus?: VerificationStatus;
      brandVerificationStatus?: BrandVerificationStatus;
      successfulCollaborations?: number;
      completedCollaborations?: number;
      joinedDate?: string;
      responseTimeLabel?: string;
      disputes?: number;
      className?: string;
    };

function passportTone(isGood: boolean, isPending = false) {
  if (isGood) return "green";
  if (isPending) return "yellow";
  return "neutral";
}

function formattedDate(input?: string) {
  if (!input) return "Not available";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function statusTone(status?: VerificationStatus | BrandVerificationStatus, accountType: "creator" | "brand" = "creator") {
  const normalized = accountType === "creator" ? normalizeCreatorVerificationStatus(status as VerificationStatus | undefined) : status;
  return passportTone(normalized === "verified", normalized === "pending");
}

function phoneStatus(phoneAdded: boolean, phoneVerified: boolean) {
  if (phoneVerified) {
    return {
      label: "Verified",
      tone: "green" as const,
    };
  }

  if (phoneAdded) {
    return {
      label: "Pending verification",
      tone: "yellow" as const,
    };
  }

  return {
    label: "Not added",
    tone: "neutral" as const,
  };
}

function creatorPassportLabel(status?: VerificationStatus) {
  const normalized = normalizeCreatorVerificationStatus(status);
  if (normalized === "verified") return "Verified";
  if (normalized === "pending") return "Pending Review";
  return "Unverified";
}

function brandPassportLabel(status?: BrandVerificationStatus) {
  if (!status) return "Not applicable";
  if (status === "verified") return "Verified";
  if (status === "pending") return "Pending Review";
  return "Unverified";
}

function TrustRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: "violet" | "green" | "yellow" | "neutral";
}) {
  return (
    <div className="flex min-w-0 flex-col items-start justify-between gap-2 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm sm:flex-row sm:items-center">
      <span className="min-w-0 text-[var(--text-secondary)]">{label}</span>
      <Badge tone={tone} className="max-w-full shrink">
        {value}
      </Badge>
    </div>
  );
}

export function TrustPassportCard(props: TrustPassportCardProps) {
  const fallbackVerificationStatus =
    props.accountType === "creator"
      ? props.verificationStatus
      : props.verificationStatus ?? "unverified";
  const creatorVerificationStatus =
    props.accountType === "creator"
      ? props.creatorVerificationStatus ?? (fallbackVerificationStatus as VerificationStatus | undefined)
      : props.creatorVerificationStatus;
  const brandVerificationStatus =
    props.accountType === "brand"
      ? props.brandVerificationStatus ?? (fallbackVerificationStatus as BrandVerificationStatus | undefined)
      : props.brandVerificationStatus;
  const completedCollaborations = props.completedCollaborations ?? props.successfulCollaborations ?? 0;
  const disputes = props.disputes ?? 0;
  const hasResponseTime = Boolean(props.responseTimeLabel && props.responseTimeLabel !== "No data");
  const hasPhone = Boolean(props.phoneVerified || props.phoneAdded || props.phoneNumber?.trim());
  const phone = phoneStatus(hasPhone, Boolean(props.phoneVerified));

  return (
    <section className={props.className ?? "bridge-card p-5"}>
      <p className="bridge-eyebrow">Trust Passport</p>
      <h2 className="mt-2 font-display text-xl font-bold">Verification and history signals</h2>
      <div className="mt-4 grid gap-2">
        <TrustRow label="Email Verified" value={props.emailVerified ? "Verified" : "Not verified"} tone={passportTone(Boolean(props.emailVerified))} />
        <TrustRow label="Phone" value={phone.label} tone={phone.tone} />
        <TrustRow
          label="Creator Verification"
          value={creatorVerificationStatus ? creatorPassportLabel(creatorVerificationStatus) : "Not applicable"}
          tone={creatorVerificationStatus ? statusTone(creatorVerificationStatus, "creator") : "neutral"}
        />
        <TrustRow
          label="Brand Verification"
          value={brandPassportLabel(brandVerificationStatus)}
          tone={brandVerificationStatus ? statusTone(brandVerificationStatus, "brand") : "neutral"}
        />
        <TrustRow
          label="Completed Collaborations"
          value={completedCollaborations > 0 ? completedCollaborations : "Stats pending"}
          tone={completedCollaborations > 0 ? "green" : "neutral"}
        />
        <TrustRow label="Joined Date" value={formattedDate(props.joinedDate)} />
        <TrustRow label="Response Time" value={props.responseTimeLabel ?? "No data"} tone={hasResponseTime ? "green" : "neutral"} />
        <TrustRow label="Disputes" value={disputes > 0 ? `${disputes} reported` : "None"} tone={disputes > 0 ? "yellow" : "green"} />
      </div>
    </section>
  );
}
