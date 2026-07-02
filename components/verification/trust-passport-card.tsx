import { Badge } from "@/components/shared/badge";
import { type BrandVerificationStatus, type VerificationStatus } from "@/lib/types";
import { normalizeCreatorVerificationStatus, verificationBadgeLabel } from "@/lib/verification";

type TrustPassportCardProps =
  | {
      accountType: "creator";
      emailVerified?: boolean;
      verificationStatus?: VerificationStatus;
      successfulCollaborations?: number;
      completedCollaborations?: number;
      className?: string;
    }
  | {
      accountType: "brand";
      emailVerified?: boolean;
      verificationStatus?: BrandVerificationStatus;
      successfulCollaborations?: number;
      completedCollaborations?: number;
      className?: string;
    };

function passportTone(isGood: boolean, isPending = false) {
  if (isGood) return "green";
  if (isPending) return "yellow";
  return "neutral";
}

function creatorProfileLabel(status?: VerificationStatus) {
  const normalized = normalizeCreatorVerificationStatus(status);
  if (normalized === "verified") return "Verified Creator";
  if (normalized === "pending") return "Verification Pending";
  if (normalized === "rejected") return "Rejected";
  return "Unverified";
}

export function TrustPassportCard(props: TrustPassportCardProps) {
  const normalized =
    props.accountType === "creator"
      ? normalizeCreatorVerificationStatus(props.verificationStatus)
      : props.verificationStatus ?? "unverified";
  const isVerified = normalized === "verified";
  const isPending = normalized === "pending";
  const completedCollaborations = props.completedCollaborations ?? props.successfulCollaborations ?? 0;

  return (
    <section className={props.className ?? "bridge-card p-5"}>
      <p className="bridge-eyebrow">Trust Passport</p>
      <h2 className="mt-2 font-display text-xl font-bold">Verification signals</h2>
      <div className="mt-4 grid gap-2">
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span className="text-[var(--text-secondary)]">Email verified</span>
          <Badge tone={passportTone(Boolean(props.emailVerified))}>{props.emailVerified ? "Verified" : "Not verified"}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span className="text-[var(--text-secondary)]">
            {props.accountType === "creator" ? "Platform verification status" : "Brand verification status"}
          </span>
          <Badge tone={passportTone(isVerified, isPending)}>{verificationBadgeLabel(props.verificationStatus, props.accountType)}</Badge>
        </div>
        {props.accountType === "creator" ? (
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <span className="text-[var(--text-secondary)]">Profile verification status</span>
            <Badge tone={passportTone(isVerified, isPending)}>{creatorProfileLabel(props.verificationStatus)}</Badge>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span className="text-[var(--text-secondary)]">Completed collaborations</span>
          <Badge tone="neutral">{completedCollaborations}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-sm">
          <span className="text-[var(--text-secondary)]">Active disputes</span>
          <Badge tone="green">None</Badge>
        </div>
      </div>
    </section>
  );
}
