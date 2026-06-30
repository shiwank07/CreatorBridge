import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type VerificationApprovedEmailProps = {
  name: string;
  accountType: "creator" | "brand";
  statusLabel: string;
  note?: string;
  verificationUrl: string;
};

export default function VerificationApprovedEmail({
  name,
  accountType,
  statusLabel,
  note,
  verificationUrl,
}: VerificationApprovedEmailProps) {
  return (
    <HaloEmailLayout
      preview={`Your ${accountType} verification was approved.`}
      eyebrow="Verification approved"
      title="Your verification is approved"
      cta={{ label: "View dashboard", href: verificationUrl }}
    >
      <EmailText>Hi {name},</EmailText>
      <EmailText>Your {accountType} verification review is complete. Your profile now has the trust signal brands and creators look for.</EmailText>
      <EmailDetails
        items={[
          { label: "Status", value: statusLabel },
          { label: "Admin note", value: note },
        ]}
      />
    </HaloEmailLayout>
  );
}
