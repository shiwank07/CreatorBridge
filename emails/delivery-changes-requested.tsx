import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type DeliveryChangesRequestedEmailProps = {
  creatorName: string;
  companyName: string;
  note?: string;
  collaborationUrl: string;
};

export default function DeliveryChangesRequestedEmail({
  creatorName,
  companyName,
  note,
  collaborationUrl,
}: DeliveryChangesRequestedEmailProps) {
  return (
    <HaloEmailLayout
      preview={`${companyName} requested a revision.`}
      eyebrow="Revision requested"
      title="A revision was requested"
      cta={{ label: "Open collaboration", href: collaborationUrl }}
    >
      <EmailText>Hi {creatorName},</EmailText>
      <EmailText>{companyName} requested changes to your delivery proof. Review the note and submit updated proof when ready.</EmailText>
      <EmailDetails
        items={[
          { label: "Brand", value: companyName },
          { label: "Revision note", value: note },
        ]}
      />
    </HaloEmailLayout>
  );
}
