import HaloEmailLayout, { EmailBenefits, EmailText } from "./layout";

export type BrandWelcomeEmailProps = { firstName?: string | null; discoverUrl: string };
export const brandWelcomePreviewProps: BrandWelcomeEmailProps = {
  firstName: "Arjun",
  discoverUrl: "http://localhost:3000/creators",
};
export const brandWelcomeSubject = () => "Welcome to Branzzo — discover creators for your brand";
export const brandWelcomePreheader = "Find trusted creators and start building high-fit partnerships on Branzzo.";
export const brandWelcomeBenefits = [
  "Discover relevant creators",
  "Review audience and content fit",
  "Manage collaborations in one place",
];
export function brandWelcomeText({ firstName, discoverUrl }: BrandWelcomeEmailProps) {
  return `Hi ${firstName?.trim() || "there"},\n\nThanks for joining Branzzo. We’re excited to help you discover creators who fit your brand.\n\nDiscover creators whose audience and style align with your next campaign.\n\nWhat you can do:\n${brandWelcomeBenefits.map((item) => `- ${item}`).join("\n")}\n\nDiscover creators: ${discoverUrl}\n\nNeed help? support@branzzo.com\nBranzzo: https://branzzo.com\n\nHelping creators and brands build better partnerships.`;
}

export default function BrandWelcomeEmail({ firstName, discoverUrl }: BrandWelcomeEmailProps) {
  return (
    <HaloEmailLayout preview={brandWelcomePreheader} eyebrow="Welcome to Branzzo" title="Find the right voice for your brand" cta={{ label: "Discover creators", href: discoverUrl }}>
      <EmailText>Hi {firstName?.trim() || "there"},</EmailText>
      <EmailText>Thanks for joining Branzzo. We’re excited to help you discover creators who fit your brand.</EmailText>
      <EmailText>Discover creators whose audience and style align with your next campaign.</EmailText>
      <EmailBenefits items={brandWelcomeBenefits} />
    </HaloEmailLayout>
  );
}
