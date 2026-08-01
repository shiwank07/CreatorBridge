# Branzzo operational email configuration

## Required production configuration

- `EMAIL_FROM="Branzzo <notifications@updates.branzzo.com>"`
- `EMAIL_SECURITY_FROM="Branzzo Security <security@updates.branzzo.com>"`
- `EMAIL_REPLY_TO="support@branzzo.com"`
- `EMAIL_LOGO_URL="https://branzzo.com/branding/branzzo-logo.png"` (or the actual deployed public HTTPS asset path)
- `ADMIN_NOTIFICATION_EMAIL=<private operations mailbox>`
- `RESEND_WEBHOOK_SECRET=<endpoint signing secret from Resend>`
- `EMAIL_PROCESSING_TIMEOUT_MS=900000`

Until `branzzo.com` serves the asset, `EMAIL_LOGO_URL` may deliberately point to a
public HTTPS test asset. Production validation rejects localhost and non-HTTPS
logo URLs. Local previews may use localhost and fall back to the text “Branzzo”.

The existing logo file is `branzzo-logo.png` at
`public/branding/branzzo-logo.png`. Next.js serves it from the site root:

- Local preview: `http://localhost:3000/branding/branzzo-logo.png`
- Production: `https://branzzo.com/branding/branzzo-logo.png`

Email URLs must never include the filesystem-only `/public` segment.

## Templates and integration points

Development previews:

- `/api/dev/email-preview/account-security-alert`
- `/api/dev/email-preview/contact-admin-alert`

The protected, non-production `POST /api/dev/email-test` accepts either template
name and always sends only to `EMAIL_TEST_RECIPIENT`.

`sendAccountSecurityAlert` supports only administrator-role changes, suspension,
reactivation, and important Branzzo-owned notices. Suitable future integration
points are the existing admin account-status mutations and any future,
server-owned admin-role mutation. It is intentionally not wired to Clerk-owned
password reset, OTP, sign-in, verification, login-link, or credential events.

The contact endpoint independently schedules the user confirmation and internal
`contact:admin-alert:<contactId>` delivery after persistence. Either delivery may
fail without removing the contact record.

## Recovery and indexes

Email delivery uses a unique logical delivery key, bounded attempts, exponential
backoff, atomic claims, and permanent-recipient-failure suppression. Stale
`processing` records can be recovered with `recoverStaleEmailProcessing`, which
is suitable for a future Cloudflare scheduled trigger. No public retry endpoint
exists; the admin retry endpoint only reconstructs eligible contact deliveries
from their source record.

Run `npm run indexes:email` for a read-only duplicate/index audit. It aborts on
duplicate delivery keys or provider IDs and never drops or creates indexes.

## Resend webhook setup after deployment

In the Resend dashboard, create one webhook pointing to:

`https://branzzo.com/api/webhooks/resend`

Select `email.sent`, `email.delivered`, `email.delivery_delayed`,
`email.bounced`, `email.complained`, `email.failed`, and `email.suppressed`.
Copy that endpoint’s signing secret into `RESEND_WEBHOOK_SECRET`, then replay a
test event. The route verifies the raw request with Svix headers, deduplicates by
`svix-id`, correlates `data.email_id`, and ignores unknown messages. Do not
register the endpoint until the route is deployed over HTTPS.
