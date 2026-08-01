import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type CollaborationInvitationProps = {
  firstName?: string | null; brandName: string; title: string; message?: string | null;
  budget?: string | null; collaborationUrl: string;
};
export const collaborationInvitationPreviewProps: CollaborationInvitationProps = {
  firstName: "Maya", brandName: "Northstar Labs", title: "Summer creator partnership",
  message: "We think your content is a strong fit for this campaign.", budget: "₹50,000", collaborationUrl: "http://localhost:3000/dashboard/collaborations/demo",
};
export const collaborationInvitationSubject = () => "New collaboration invitation on Branzzo";
export const collaborationInvitationPreheader = "A brand invited you to review a collaboration on Branzzo.";
export const collaborationInvitationText = (p: CollaborationInvitationProps) =>
  `Hi ${p.firstName?.trim() || "there"},\n\n${p.brandName} invited you to collaborate on “${p.title}”.\n${p.message?.trim() || "Review the collaboration details and respond when you’re ready."}${p.budget?.trim() ? `\nBudget: ${p.budget.trim()}` : ""}\n\nView collaboration: ${p.collaborationUrl}\n\nNeed help? support@branzzo.com\nHelping creators and brands build better partnerships.`;
export function CollaborationInvitationEmail(p: CollaborationInvitationProps) {
  return <HaloEmailLayout preview={collaborationInvitationPreheader} eyebrow="New collaboration" title="You have a new invitation" cta={{ label: "View collaboration", href: p.collaborationUrl }}>
    <EmailText>Hi {p.firstName?.trim() || "there"},</EmailText><EmailText><strong>{p.brandName}</strong> invited you to collaborate on “{p.title}”.</EmailText>
    <EmailText>{p.message?.trim() || "Review the collaboration details and respond when you’re ready."}</EmailText>
    {p.budget?.trim() ? <EmailDetails items={[{ label: "Budget", value: p.budget }]} /> : null}
  </HaloEmailLayout>;
}

export type CollaborationAcceptedProps = { firstName?: string | null; creatorName: string; title: string; collaborationUrl: string };
export const collaborationAcceptedPreviewProps: CollaborationAcceptedProps = { firstName: "Arjun", creatorName: "Maya", title: "Summer creator partnership", collaborationUrl: "http://localhost:3000/dashboard/collaborations/demo" };
export const collaborationAcceptedSubject = () => "Your Branzzo collaboration was accepted";
export const collaborationAcceptedPreheader = "A creator accepted your Branzzo collaboration.";
export const collaborationAcceptedText = (p: CollaborationAcceptedProps) => `Hi ${p.firstName?.trim() || "there"},\n\n${p.creatorName} accepted “${p.title}”. You can now confirm next steps and manage the collaboration from your dashboard.\n\nOpen collaboration: ${p.collaborationUrl}\n\nNeed help? support@branzzo.com\nHelping creators and brands build better partnerships.`;
export function CollaborationAcceptedEmail(p: CollaborationAcceptedProps) {
  return <HaloEmailLayout preview={collaborationAcceptedPreheader} eyebrow="Collaboration accepted" title="Your collaboration is moving forward" cta={{ label: "Open collaboration", href: p.collaborationUrl }}>
    <EmailText>Hi {p.firstName?.trim() || "there"},</EmailText><EmailText><strong>{p.creatorName}</strong> accepted “{p.title}”.</EmailText><EmailText>You can now confirm next steps and manage the collaboration from your dashboard.</EmailText>
  </HaloEmailLayout>;
}

export type CollaborationDeclinedProps = { firstName?: string | null; title: string; collaborationsUrl: string };
export const collaborationDeclinedPreviewProps: CollaborationDeclinedProps = { firstName: "Arjun", title: "Summer creator partnership", collaborationsUrl: "http://localhost:3000/dashboard/history" };
export const collaborationDeclinedSubject = () => "Collaboration update on Branzzo";
export const collaborationDeclinedPreheader = "There is an update to one of your Branzzo collaborations.";
export const collaborationDeclinedText = (p: CollaborationDeclinedProps) => `Hi ${p.firstName?.trim() || "there"},\n\nThe creator won’t be moving forward with “${p.title}” at this time. You can review your collaborations and continue planning from your dashboard.\n\nView collaborations: ${p.collaborationsUrl}\n\nNeed help? support@branzzo.com\nHelping creators and brands build better partnerships.`;
export function CollaborationDeclinedEmail(p: CollaborationDeclinedProps) {
  return <HaloEmailLayout preview={collaborationDeclinedPreheader} eyebrow="Collaboration update" title="An update on your collaboration" cta={{ label: "View collaborations", href: p.collaborationsUrl }}>
    <EmailText>Hi {p.firstName?.trim() || "there"},</EmailText><EmailText>The creator won’t be moving forward with “{p.title}” at this time.</EmailText><EmailText>You can review your collaborations and continue planning from your dashboard.</EmailText>
  </HaloEmailLayout>;
}

export type VerificationApprovedProps = { firstName?: string | null; profileUrl: string };
export const verificationApprovedPreviewProps: VerificationApprovedProps = { firstName: "Maya", profileUrl: "http://localhost:3000/dashboard/creator" };
export const verificationApprovedSubject = () => "Your Branzzo creator profile is verified";
export const verificationApprovedPreheader = "Your creator verification has been approved.";
export const verificationApprovedText = (p: VerificationApprovedProps) => `Hi ${p.firstName?.trim() || "there"},\n\nYour creator verification has been approved. The verified badge shows brands that Branzzo reviewed the identity and profile signals submitted with your request.\n\nView your profile: ${p.profileUrl}\n\nNeed help? support@branzzo.com\nHelping creators and brands build better partnerships.`;
export function VerificationApprovedEmail(p: VerificationApprovedProps) {
  return <HaloEmailLayout preview={verificationApprovedPreheader} eyebrow="Verification approved" title="Your creator profile is verified" cta={{ label: "View your profile", href: p.profileUrl }}>
    <EmailText>Hi {p.firstName?.trim() || "there"},</EmailText><EmailText>Your creator verification has been approved.</EmailText><EmailText>The verified badge shows brands that Branzzo reviewed the identity and profile signals submitted with your request.</EmailText>
  </HaloEmailLayout>;
}

export type VerificationRejectedProps = { firstName?: string | null; reason?: string | null; verificationUrl: string };
export const verificationRejectedPreviewProps: VerificationRejectedProps = { firstName: "Maya", reason: "Please provide a clearer ownership signal on the linked channel.", verificationUrl: "http://localhost:3000/dashboard/verification" };
export const verificationRejectedSubject = () => "Action needed for your Branzzo verification";
export const verificationRejectedPreheader = "Review your verification details and submit again when ready.";
export const verificationRejectedText = (p: VerificationRejectedProps) => `Hi ${p.firstName?.trim() || "there"},\n\nWe couldn’t approve your creator verification yet.${p.reason?.trim() ? `\nReason: ${p.reason.trim()}` : ""}\n\nReview the requested changes, update your evidence, and resubmit when ready.\n\nReview verification: ${p.verificationUrl}\n\nNeed help? support@branzzo.com\nHelping creators and brands build better partnerships.`;
export function VerificationRejectedEmail(p: VerificationRejectedProps) {
  return <HaloEmailLayout preview={verificationRejectedPreheader} eyebrow="Verification update" title="Your verification needs attention" cta={{ label: "Review verification", href: p.verificationUrl }}>
    <EmailText>Hi {p.firstName?.trim() || "there"},</EmailText><EmailText>We couldn’t approve your creator verification yet.</EmailText>
    {p.reason?.trim() ? <EmailDetails items={[{ label: "Reason", value: p.reason }]} /> : null}<EmailText>Review the requested changes, update your evidence, and resubmit when ready.</EmailText>
  </HaloEmailLayout>;
}

export type ContactConfirmationProps = { firstName?: string | null; websiteUrl: string };
export const contactConfirmationPreviewProps: ContactConfirmationProps = { firstName: "Maya", websiteUrl: "http://localhost:3000" };
export const contactConfirmationSubject = () => "We received your Branzzo message";
export const contactConfirmationPreheader = "Your message has been received by the Branzzo team.";
export const contactConfirmationText = (p: ContactConfirmationProps) => `Hi ${p.firstName?.trim() || "there"},\n\nWe received your message. The appropriate Branzzo team will review it and follow up if more information is needed.\n\nVisit Branzzo: ${p.websiteUrl}\n\nNeed help? support@branzzo.com\nHelping creators and brands build better partnerships.`;
export function ContactConfirmationEmail(p: ContactConfirmationProps) {
  return <HaloEmailLayout preview={contactConfirmationPreheader} eyebrow="Message received" title="Thanks for contacting Branzzo" cta={{ label: "Visit Branzzo", href: p.websiteUrl }}>
    <EmailText>Hi {p.firstName?.trim() || "there"},</EmailText><EmailText>We received your message.</EmailText><EmailText>The appropriate Branzzo team will review it and follow up if more information is needed.</EmailText>
  </HaloEmailLayout>;
}
