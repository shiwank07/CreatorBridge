import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type ProofSubmittedEmailProps = {
  brandContactName: string;
  creatorName: string;
  companyName: string;
  proofUrl?: string;
  notes?: string;
  collaborationUrl: string;
};

export default function ProofSubmittedEmail({
  brandContactName,
  creatorName,
  companyName,
  proofUrl,
  notes,
  collaborationUrl,
}: ProofSubmittedEmailProps) {
  return (
    <HaloEmailLayout
      preview={`${creatorName} submitted delivery proof for ${companyName}.`}
      eyebrow="Proof submitted"
      title="Delivery proof is ready for review"
      cta={{ label: "Review proof", href: collaborationUrl }}
    >
      <EmailText>Hi {brandContactName},</EmailText>
      <EmailText>{creatorName} submitted delivery proof for your collaboration. Review it and approve the delivery or request changes.</EmailText>
      <EmailDetails
        items={[
          { label: "Creator", value: creatorName },
          { label: "Company", value: companyName },
          { label: "Proof link", value: proofUrl },
          { label: "Creator notes", value: notes },
        ]}
      />
    </HaloEmailLayout>
  );
}
