import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type CreatorDeclinedEmailProps = {
  brandContactName: string;
  creatorName: string;
  companyName: string;
  note?: string;
  collaborationUrl: string;
};

export default function CreatorDeclinedEmail({
  brandContactName,
  creatorName,
  companyName,
  note,
  collaborationUrl,
}: CreatorDeclinedEmailProps) {
  return (
    <HaloEmailLayout
      preview={`${creatorName} declined your collaboration request.`}
      eyebrow="Creator declined"
      title="The creator passed on this request"
      cta={{ label: "View request", href: collaborationUrl }}
    >
      <EmailText>Hi {brandContactName},</EmailText>
      <EmailText>{creatorName} declined the collaboration request for {companyName}. The request has been closed in your dashboard.</EmailText>
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
