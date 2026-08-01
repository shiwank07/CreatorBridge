import HaloEmailLayout, { EmailBenefits, EmailText } from "./layout";

export type CreatorWelcomeEmailProps = { firstName?: string | null; profileUrl: string };
export const creatorWelcomePreviewProps: CreatorWelcomeEmailProps = {
  firstName: "Maya",
  profileUrl: "http://localhost:3000/dashboard/creator/edit",
};
export const creatorWelcomeSubject = () => "Welcome to Branzzo — let’s build your creator profile";
export const creatorWelcomePreheader = "Complete your Branzzo creator profile and get ready for brand collaborations.";
export const creatorWelcomeBenefits = [
  "Build a profile brands can trust",
  "Showcase your audience and content",
  "Receive relevant collaboration opportunities",
];
export function creatorWelcomeText({ firstName, profileUrl }: CreatorWelcomeEmailProps) {
  return `Hi ${firstName?.trim() || "there"},\n\nWelcome to Branzzo—where creators and brands build meaningful collaborations.\n\nBuild a polished creator profile so brands can understand your audience, content, and collaboration fit.\n\nWhat you can do:\n${creatorWelcomeBenefits.map((item) => `- ${item}`).join("\n")}\n\nComplete your creator profile: ${profileUrl}\n\nNeed help? support@branzzo.com\nBranzzo: https://branzzo.com\n\nHelping creators and brands build better partnerships.`;
}

export default function CreatorWelcomeEmail({ firstName, profileUrl }: CreatorWelcomeEmailProps) {
  return (
    <HaloEmailLayout preview={creatorWelcomePreheader} eyebrow="Welcome to Branzzo" title="Your next collaboration starts here" cta={{ label: "Complete your creator profile", href: profileUrl }}>
      <EmailText>Hi {firstName?.trim() || "there"},</EmailText>
      <EmailText>Welcome to Branzzo—where creators and brands build meaningful collaborations.</EmailText>
      <EmailText>Build a polished creator profile so brands can understand your audience, content, and collaboration fit.</EmailText>
      <EmailBenefits items={creatorWelcomeBenefits} />
    </HaloEmailLayout>
  );
}
