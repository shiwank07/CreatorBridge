import "server-only";

import { createElement, type ComponentType } from "react";
import {
  CollaborationAcceptedEmail, CollaborationDeclinedEmail, CollaborationInvitationEmail, ContactConfirmationEmail,
  VerificationApprovedEmail, VerificationRejectedEmail, collaborationAcceptedSubject, collaborationAcceptedText,
  collaborationDeclinedSubject, collaborationDeclinedText, collaborationInvitationSubject, collaborationInvitationText,
  contactConfirmationSubject, contactConfirmationText, verificationApprovedSubject, verificationApprovedText,
  verificationRejectedSubject, verificationRejectedText, type CollaborationAcceptedProps, type CollaborationDeclinedProps,
  type CollaborationInvitationProps, type ContactConfirmationProps, type VerificationApprovedProps, type VerificationRejectedProps,
} from "@/emails/core-product-emails";
import { deliverEmailOnce } from "./email-delivery";
import type { EmailPreferenceSnapshot } from "./email-policy";
import { sendEmail, type EmailServiceDependencies } from "./email-service";
import {
  AccountSecurityAlertEmail, ContactAdminAlertEmail, accountSecurityAlertSubject, accountSecurityAlertText,
  contactAdminAlertSubject, contactAdminAlertText, type AccountSecurityAlertProps, type ContactAdminAlertProps,
} from "@/emails/operational-emails";

type BaseInput = { to: string; eventId: string; preferences?: EmailPreferenceSnapshot; retryFailed?: boolean };
type Definition<P extends object> = { event: string; preference?: "collaborationInvitations" | "collaborationStatusUpdates" | "verificationUpdates"; subject: () => string; text: (props: P) => string; component: ComponentType<P> };

async function sendCore<P extends object>(input: BaseInput & P, definition: Definition<P>, dependencies: EmailServiceDependencies = {}) {
  const { to, eventId, preferences, retryFailed, ...props } = input;
  return deliverEmailOnce({
    deliveryKey: `${definition.event}:${eventId}`, recipient: to, event: definition.event,
    preferences, preference: definition.preference, retryFailed,
    send: () => sendEmail({
      to, subject: definition.subject(), react: createElement(definition.component, props as P),
      text: definition.text(props as P), idempotencyKey: `${definition.event}:${eventId}`,
    }, dependencies),
  });
}

export const sendCollaborationInvitation = (input: BaseInput & CollaborationInvitationProps, deps?: EmailServiceDependencies) =>
  sendCore(input, { event: "collaboration:invitation", preference: "collaborationInvitations", subject: collaborationInvitationSubject, text: collaborationInvitationText, component: CollaborationInvitationEmail }, deps);
export const sendCollaborationAccepted = (input: BaseInput & CollaborationAcceptedProps, deps?: EmailServiceDependencies) =>
  sendCore(input, { event: "collaboration:accepted", preference: "collaborationStatusUpdates", subject: collaborationAcceptedSubject, text: collaborationAcceptedText, component: CollaborationAcceptedEmail }, deps);
export const sendCollaborationDeclined = (input: BaseInput & CollaborationDeclinedProps, deps?: EmailServiceDependencies) =>
  sendCore(input, { event: "collaboration:declined", preference: "collaborationStatusUpdates", subject: collaborationDeclinedSubject, text: collaborationDeclinedText, component: CollaborationDeclinedEmail }, deps);
export const sendVerificationApproved = (input: BaseInput & VerificationApprovedProps, deps?: EmailServiceDependencies) =>
  sendCore(input, { event: "verification:approved", preference: "verificationUpdates", subject: verificationApprovedSubject, text: verificationApprovedText, component: VerificationApprovedEmail }, deps);
export const sendVerificationRejected = (input: BaseInput & VerificationRejectedProps, deps?: EmailServiceDependencies) =>
  sendCore(input, { event: "verification:rejected", preference: "verificationUpdates", subject: verificationRejectedSubject, text: verificationRejectedText, component: VerificationRejectedEmail }, deps);
export const sendContactConfirmation = (input: BaseInput & ContactConfirmationProps, deps?: EmailServiceDependencies) =>
  sendCore(input, { event: "contact:confirmation", subject: contactConfirmationSubject, text: contactConfirmationText, component: ContactConfirmationEmail }, deps);

export async function sendAccountSecurityAlert(input: BaseInput & AccountSecurityAlertProps, deps: EmailServiceDependencies = {}) {
  const { to, eventId, preferences, retryFailed, ...props } = input;
  return deliverEmailOnce({
    deliveryKey: `account:security-alert:${eventId}`, recipient: to, event: `account:security-alert:${props.alertType}`,
    preferences, retryFailed,
    send: () => sendEmail({
      to, subject: accountSecurityAlertSubject(), react: createElement(AccountSecurityAlertEmail, props),
      text: accountSecurityAlertText(props), idempotencyKey: `account:security-alert:${eventId}`, sender: "security",
    }, deps),
  });
}

export async function sendContactAdminAlert(input: BaseInput & ContactAdminAlertProps, deps: EmailServiceDependencies = {}) {
  const { to, eventId, preferences, retryFailed, ...props } = input;
  return deliverEmailOnce({
    deliveryKey: `contact:admin-alert:${eventId}`, recipient: to, event: "contact:admin-alert",
    preferences, retryFailed,
    send: () => sendEmail({
      to, subject: contactAdminAlertSubject(), react: createElement(ContactAdminAlertEmail, props),
      text: contactAdminAlertText(props), idempotencyKey: `contact:admin-alert:${eventId}`,
    }, deps),
  });
}
