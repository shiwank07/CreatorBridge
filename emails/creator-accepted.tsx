import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type CreatorAcceptedEmailProps = {
  brandContactName: string;
  creatorName: string;
  companyName: string;
  note?: string;
  collaborationUrl: string;
};

export default function CreatorAcceptedEmail({
  brandContactName,
  creatorName,
  companyName,
  note,
  collaborationUrl,
}: CreatorAcceptedEmailProps) {
  return (
    <HaloEmailLayout
      preview={`${creatorName} accepted your collaboration request.`}
      eyebrow="Creator accepted"
      title="Your collaboration is moving forward"
      cta={{ label: "Open collaboration", href: collaborationUrl }}
    >
      <EmailText>Hi {brandContactName},</EmailText>
      <EmailText>{creatorName} accepted the collaboration request for {companyName}. You can now track the next steps from your dashboard.</EmailText>
      <EmailDetails
        items={[
          { label: "Creator", value: creatorName },
          { label: "Company", value: companyName },
          { label: "Creator note", value: note },
        ]}
      />
    </HaloEmailLayout>
  );
}
