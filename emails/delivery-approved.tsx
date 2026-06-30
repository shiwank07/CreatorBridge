import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type DeliveryApprovedEmailProps = {
  creatorName: string;
  companyName: string;
  note?: string;
  collaborationUrl: string;
};

export default function DeliveryApprovedEmail({ creatorName, companyName, note, collaborationUrl }: DeliveryApprovedEmailProps) {
  return (
    <HaloEmailLayout
      preview={`${companyName} approved your delivery.`}
      eyebrow="Delivery approved"
      title="Your delivery has been approved"
      cta={{ label: "Open collaboration", href: collaborationUrl }}
    >
      <EmailText>Hi {creatorName},</EmailText>
      <EmailText>{companyName} approved your delivery proof. Nice work. The collaboration is ready for the next step.</EmailText>
      <EmailDetails
        items={[
          { label: "Brand", value: companyName },
          { label: "Brand note", value: note },
        ]}
      />
    </HaloEmailLayout>
  );
}
