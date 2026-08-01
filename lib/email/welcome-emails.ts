import "server-only";

import { createElement } from "react";

import BrandWelcomeEmail, { brandWelcomeSubject, brandWelcomeText } from "@/emails/brand-welcome";
import CreatorWelcomeEmail, { creatorWelcomeSubject, creatorWelcomeText } from "@/emails/creator-welcome";
import { absoluteAppUrl, readEmailEnvironment } from "./email-config";
import { deliverEmailOnce } from "./email-delivery";
import { sendEmail, type EmailServiceDependencies } from "./email-service";

type WelcomeInput = { to: string; firstName?: string | null; idempotencyKey?: string };

export async function sendCreatorWelcome(input: WelcomeInput, dependencies: EmailServiceDependencies = {}) {
  const config = readEmailEnvironment(dependencies.env);
  const props = { firstName: input.firstName, profileUrl: absoluteAppUrl("/dashboard/creator/edit", config.appUrl) };
  return sendEmail({ to: input.to, subject: creatorWelcomeSubject(), react: createElement(CreatorWelcomeEmail, props), text: creatorWelcomeText(props), idempotencyKey: input.idempotencyKey }, dependencies);
}

export async function sendBrandWelcome(input: WelcomeInput, dependencies: EmailServiceDependencies = {}) {
  const config = readEmailEnvironment(dependencies.env);
  const props = { firstName: input.firstName, discoverUrl: absoluteAppUrl("/creators", config.appUrl) };
  return sendEmail({ to: input.to, subject: brandWelcomeSubject(), react: createElement(BrandWelcomeEmail, props), text: brandWelcomeText(props), idempotencyKey: input.idempotencyKey }, dependencies);
}

export async function sendCreatorWelcomeOnce(input: WelcomeInput & { userId: string }, dependencies: EmailServiceDependencies = {}) {
  return deliverEmailOnce({
    deliveryKey: `welcome:creator:${input.userId}`, recipient: input.to, event: "welcome:creator",
    send: () => sendCreatorWelcome(input, dependencies),
  });
}

export async function sendBrandWelcomeOnce(input: WelcomeInput & { userId: string }, dependencies: EmailServiceDependencies = {}) {
  return deliverEmailOnce({
    deliveryKey: `welcome:brand:${input.userId}`, recipient: input.to, event: "welcome:brand",
    send: () => sendBrandWelcome(input, dependencies),
  });
}
