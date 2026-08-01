import HaloEmailLayout, { EmailDetails, EmailText } from "./layout";

export type AccountSecurityAlertType =
  | "admin_role_granted"
  | "admin_role_removed"
  | "account_suspended"
  | "account_reactivated"
  | "important_account_notice";

export type AccountSecurityAlertProps = {
  firstName?: string | null;
  alertType: AccountSecurityAlertType;
  changed: string;
  actionTime?: string | null;
  actionUrl: string;
};

const alertTitles: Record<AccountSecurityAlertType, string> = {
  admin_role_granted: "Administrator access was granted",
  admin_role_removed: "Administrator access was removed",
  account_suspended: "Your Branzzo account was suspended",
  account_reactivated: "Your Branzzo account was reactivated",
  important_account_notice: "Important account notice",
};

export const accountSecurityAlertSubject = () => "Important update to your Branzzo account";
export const accountSecurityAlertPreheader = "A Branzzo account setting or status was updated.";
export const accountSecurityAlertPreviewProps: AccountSecurityAlertProps = {
  firstName: "Maya",
  alertType: "account_reactivated",
  changed: "Your account was restored to active status.",
  actionTime: "29 July 2026 at 10:30 IST",
  actionUrl: "http://localhost:3000/dashboard",
};
export const accountSecurityAlertText = (p: AccountSecurityAlertProps) =>
  `Hi ${p.firstName?.trim() || "there"},\n\n${alertTitles[p.alertType]}.\n${p.changed.trim()}${p.actionTime?.trim() ? `\nTime: ${p.actionTime.trim()}` : ""}\n\nReview account: ${p.actionUrl}\n\nIf you do not recognize this activity, contact support@branzzo.com.`;
export function AccountSecurityAlertEmail(p: AccountSecurityAlertProps) {
  return <HaloEmailLayout preview={accountSecurityAlertPreheader} eyebrow="Account notice" title={alertTitles[p.alertType]} cta={{ label: "Review account", href: p.actionUrl }}>
    <EmailText>Hi {p.firstName?.trim() || "there"},</EmailText>
    <EmailText>{p.changed.trim()}</EmailText>
    {p.actionTime?.trim() ? <EmailDetails items={[{ label: "Time", value: p.actionTime }]} /> : null}
    <EmailText>If you do not recognize this activity, contact support@branzzo.com.</EmailText>
  </HaloEmailLayout>;
}

export type ContactAdminAlertProps = {
  senderName: string;
  senderEmail: string;
  category: string;
  messagePreview: string;
  contactUrl: string;
};
export const contactAdminAlertSubject = () => "Branzzo Contact Alert";
export const contactAdminAlertPreheader = "A new contact message is ready for admin review.";
export const contactAdminAlertPreviewProps: ContactAdminAlertProps = {
  senderName: "Maya Rao", senderEmail: "maya@example.com", category: "support",
  messagePreview: "I need help updating my brand profile.", contactUrl: "http://localhost:3000/admin/contacts",
};
export const contactAdminAlertText = (p: ContactAdminAlertProps) =>
  `A new Branzzo contact message was received.\n\nName: ${p.senderName}\nEmail: ${p.senderEmail}\nCategory: ${p.category}\nMessage preview: ${p.messagePreview}\n\nOpen contact record: ${p.contactUrl}`;
export function ContactAdminAlertEmail(p: ContactAdminAlertProps) {
  return <HaloEmailLayout preview={contactAdminAlertPreheader} eyebrow="Contact alert" title="A new contact message was received" cta={{ label: "Open contact record", href: p.contactUrl }}>
    <EmailDetails items={[
      { label: "Name", value: p.senderName }, { label: "Email", value: p.senderEmail },
      { label: "Category", value: p.category }, { label: "Message preview", value: p.messagePreview },
    ]} />
  </HaloEmailLayout>;
}
