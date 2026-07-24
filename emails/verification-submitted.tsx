import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export default function VerificationSubmittedEmail({
  name,
  platform,
  profileUrl,
  verificationUrl,
}: {
  name: string;
  platform: string;
  profileUrl: string;
  verificationUrl: string;
}) {
  return (
    <HaloEmailLayout
      preview="Your creator verification request is in review."
      eyebrow="Verification submitted"
      title="Your request is in review"
      cta={{ label: "View verification", href: verificationUrl }}
    >
      <EmailText>Hi {name},</EmailText>
      <EmailText>We received your creator verification request. An admin will check the code on your public profile.</EmailText>
      <EmailDetails items={[{ label: "Platform", value: platform }, { label: "Profile", value: profileUrl }]} />
    </HaloEmailLayout>
  );
}
