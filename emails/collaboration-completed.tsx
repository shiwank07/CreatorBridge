import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type CollaborationCompletedEmailProps = {
  creatorName: string;
  companyName: string;
  note?: string;
  collaborationUrl: string;
};

export default function CollaborationCompletedEmail({
  creatorName,
  companyName,
  note,
  collaborationUrl,
}: CollaborationCompletedEmailProps) {
  return (
    <HaloEmailLayout
      preview={`${companyName} marked the collaboration complete.`}
      eyebrow="Collaboration completed"
      title="The collaboration is complete"
      cta={{ label: "View working history", href: collaborationUrl }}
    >
      <EmailText>Hi {creatorName},</EmailText>
      <EmailText>{companyName} closed the collaboration as completed. It now appears in your Working History.</EmailText>
      <EmailDetails
        items={[
          { label: "Brand", value: companyName },
          { label: "Completion note", value: note },
        ]}
      />
    </HaloEmailLayout>
  );
}
