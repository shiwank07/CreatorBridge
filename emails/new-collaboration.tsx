import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type NewCollaborationEmailProps = {
  creatorName: string;
  companyName: string;
  campaignGoal: string;
  budgetRange: string;
  timeline: string;
  collaborationUrl: string;
};

export default function NewCollaborationEmail({
  creatorName,
  companyName,
  campaignGoal,
  budgetRange,
  timeline,
  collaborationUrl,
}: NewCollaborationEmailProps) {
  return (
    <HaloEmailLayout
      preview={`New collaboration request from ${companyName}.`}
      eyebrow="New collaboration"
      title="A brand wants to work with you"
      cta={{ label: "Review collaboration", href: collaborationUrl }}
    >
      <EmailText>Hi {creatorName},</EmailText>
      <EmailText>{companyName} sent you a new collaboration request. Review the brief and respond when you are ready.</EmailText>
      <EmailDetails
        items={[
          { label: "Brand", value: companyName },
          { label: "Goal", value: campaignGoal },
          { label: "Offer amount", value: budgetRange },
          { label: "Timeline", value: timeline },
        ]}
      />
    </HaloEmailLayout>
  );
}
