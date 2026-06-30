import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type VerificationRejectedEmailProps = {
  name: string;
  accountType: "creator" | "brand";
  note?: string;
  verificationUrl: string;
};

export default function VerificationRejectedEmail({ name, accountType, note, verificationUrl }: VerificationRejectedEmailProps) {
  return (
    <HaloEmailLayout
      preview={`Your ${accountType} verification needs another review.`}
      eyebrow="Verification rejected"
      title="Your verification was not approved"
      cta={{ label: "Review verification", href: verificationUrl }}
    >
      <EmailText>Hi {name},</EmailText>
      <EmailText>Your {accountType} verification was not approved this time. Review the note, update your information, and submit again when ready.</EmailText>
      <EmailDetails items={[{ label: "Admin note", value: note || "No note was provided." }]} />
    </HaloEmailLayout>
  );
}
