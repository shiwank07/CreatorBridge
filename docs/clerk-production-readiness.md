# Clerk production-readiness audit

## Current architecture

Branzzo uses `@clerk/nextjs` with a root `ClerkProvider`, Clerk's hosted
`<SignIn>` and `<SignUp>` components on path-based App Router routes, and
`clerkMiddleware`. Middleware protects `/onboarding`, `/admin`, `/dashboard`,
and `/notifications`; route handlers also perform their own `auth()` and
MongoDB role/ownership checks. Redirect query parameters pass through
`safeInternalRedirect`, which rejects external, protocol-relative, and
backslash-based destinations.

Clerk is the authentication authority. MongoDB `User` records are the
application authorization/profile authority. Creator and brand roles are
selected during onboarding and checked server-side. Production administrator
authorization now uses immutable Clerk user IDs from
`ADMIN_CLERK_USER_IDS`; email allowlisting remains non-production-only.
Organizations, Clerk public/private metadata authorization, custom password
forms, and custom authentication OTP implementations are not used.

`POST /api/webhooks/clerk` verifies the raw Svix payload and handles
`user.created`, `user.updated`, and `user.deleted`. Synchronous onboarding also
upserts the MongoDB user so product access does not depend on webhook timing.

## Credential findings and isolation

- `.env.playwright` contains development-only `+clerk_test` identities and the
  Clerk test OTP `424242`. It is ignored by Git and used by Playwright only.
- GitHub E2E jobs receive identities and OTP through isolated E2E secrets.
- `scripts/seed.ts` creates or updates development Clerk users with one
  environment-provided test password. It now permanently rejects
  `NODE_ENV=production`, `sk_live_`, and `pk_live_`; there is no production
  override.
- No seeded credentials or demo-login control is rendered in the product UI.
- Production must use a newly created real Clerk user. Copy its immutable
  `user_...` ID to `ADMIN_CLERK_USER_IDS`; do not reuse the seeded admin.
- Never place `.env.playwright`, `SEED_TEST_PASSWORD`, OTPs, or seeded users in
  production/staging runtime variables.

## Production blockers

1. Create the Clerk production instance and configure its domain, authentication
   methods, email branding, Google credentials, and webhook.
2. Install `pk_live_`/`sk_live_`, the production webhook signing secret, and an
   immutable administrator user ID in Cloudflare secrets/variables.
3. Configure Clerk-provided DNS records as DNS-only during validation and
   certificate issuance.
4. Replace legacy `NEXT_PUBLIC_CLERK_AFTER_SIGN_*` configuration with Clerk's
   current fallback redirect variables during production configuration.

## Recommended MVP authentication methods

Enable:

- Email address
- Password
- Email verification
- Clerk forgot-password/password-reset flow
- Google OAuth

Defer magic links and email-code-only sign-in to avoid overlapping methods and
support complexity. Defer passkeys until device recovery and support procedures
exist. Defer phone authentication because of cost, deliverability, abuse, and
regional compliance considerations. Keep Organizations disabled until Branzzo
has multi-member brand workspaces.

Clerk remains responsible for verification, OTP, sign-in codes, password reset,
session/security, and credential-change email. Resend remains responsible only
for Branzzo product and operational mail.

## Production URL plan

Canonical application origin: `https://branzzo.com`

- Allowed/authorized web origin: `https://branzzo.com`
- Sign-in URL: `https://branzzo.com/sign-in`
- Sign-up URL: `https://branzzo.com/sign-up`
- Sign-in fallback: `https://branzzo.com/auth/complete`
- Sign-up fallback: `https://branzzo.com/onboarding`
- Creator onboarding: `https://branzzo.com/onboarding?role=creator`
- Brand onboarding: `https://branzzo.com/onboarding?role=brand`
- Sign-out redirect: `https://branzzo.com/`
- Clerk webhook: `https://branzzo.com/api/webhooks/clerk`
- OAuth callback in the application: `https://branzzo.com/sso-callback`

Configure `https://www.branzzo.com` as a permanent redirect to the canonical
apex origin; do not run a second Clerk application origin there. If Clerk
offers/configures `accounts.branzzo.com` for the Account Portal, use the exact
DNS targets Clerk displays. Do not guess them.

Clerk will display the required Frontend API/account-portal CNAMEs and any
certificate records when the production domain is added. In Cloudflare, create
those exact values and set them to **DNS only** until Clerk validates DNS and
issues certificates. Preserve any CAA records required by Clerk's displayed
certificate instructions.

The staging Worker origin must remain attached to a separate development Clerk
instance. Do not authorize a `workers.dev` origin in the production instance.

## Four-environment model

| Environment | Clerk | Keys | Database | Seed/test users | Webhook | Real users |
| --- | --- | --- | --- | --- | --- | --- |
| Local | Development instance | `pk_test_`/`sk_test_` | Local/dev DB | Allowed | Optional tunnel endpoint with dev secret | No |
| E2E | Dedicated development instance | `pk_test_`/`sk_test_` | Dedicated E2E DB | Required; `424242` test OTP | Dedicated E2E endpoint if tested | No |
| Cloudflare staging | Separate development instance | `pk_test_`/`sk_test_` | `branzzo_staging` | Controlled staging test users only | Staging Worker URL and staging secret | Invited testers only |
| Production | Production instance | `pk_live_`/`sk_live_` | Production DB | Forbidden | `https://branzzo.com/api/webhooks/clerk` | Yes |

E2E, staging, and production must never share databases. Prefer a dedicated E2E
Clerk instance rather than sharing staging once CI volume or destructive tests
increase.

## Google OAuth checklist

1. Use a company-controlled Google account; `branzzohq@gmail.com` is a suitable
   initial owner. Add a second trusted recovery/administrator owner.
2. Create a dedicated Google Cloud project for Branzzo production.
3. Configure an External OAuth consent screen:
   - Application name: `Branzzo`
   - Support email: `branzzohq@gmail.com` initially
   - Homepage: `https://branzzo.com`
   - Privacy policy: `https://branzzo.com/privacy`
   - Terms: `https://branzzo.com/terms`
   - Authorized domain: `branzzo.com`
4. Create a Web application OAuth client.
5. Authorized JavaScript origin: `https://branzzo.com`.
6. Copy the **exact Authorized Redirect URI shown by the Clerk production
   dashboard** into Google. Do not substitute `/sso-callback`; Google redirects
   to Clerk first, and Clerk completes the application callback.
7. Copy the Google client ID and secret into Clerk's production Google
   connection. Never add them to public environment variables.
8. While the consent screen is Testing, add only named testers. Before public
   launch, resolve verification requirements and set it to **In production**.
9. Test new signup, returning sign-in, account chooser, revoked consent, and
   duplicate-email/account-linking behavior.

## Clerk-owned email branding

In the Clerk production dashboard, configure:

- Product name and logo: Branzzo and the public Branzzo logo
- Support contact: `support@branzzo.com`
- Links: `https://branzzo.com`, `/privacy`, and `/terms`
- Professional copy for verification, password reset, OTP/sign-in codes, and
  Clerk account-security messages
- A Clerk-supported authentication sender/domain configured exactly as Clerk
  instructs

Do not make Clerk authentication mail appear to come from the Resend product
senders. Branzzo Resend identities are
`notifications@updates.branzzo.com` and `security@updates.branzzo.com`;
Clerk's sender identity and DNS records are separately managed by Clerk.

## Synchronization and security findings

### Critical

- **Production instance not configured.** Development keys/users must not serve
  real users. Runtime guards now reject protected/API traffic when production
  keys or immutable admin IDs are missing/mistyped.

### High

- **Admin email authorization was mutable.** Remediated for production with
  `ADMIN_CLERK_USER_IDS`; email allowlists are now non-production-only.
- **Seed script could previously be overridden into production.** Remediated:
  production and live Clerk keys are now always rejected.

### Medium

- Middleware protects primary UI namespaces, but API security is distributed
  across individual handlers. Maintain an authenticated-route inventory and
  test every mutation for unauthenticated and cross-role access.
- Webhook errors rely on provider retry but there is no reconciliation command
  for missed or permanently failed events.
- Clerk component appearance uses documented element keys but is coupled to
  Clerk's internal presentation contract; visual regression-test SDK upgrades.
- Some user-facing validation responses can reveal whether usernames already
  exist. This is acceptable marketplace behavior but should be rate-limited.
- No explicit application-origin/CSRF guard exists on every cookie-authenticated
  mutation. Clerk cookies provide browser protections, but JSON content type,
  same-origin checks, and rate limits should be standardized.

### Low

- `CLERK_WEBHOOK_SECRET` is retained as a compatibility fallback. New
  environments should use Clerk's current `CLERK_WEBHOOK_SIGNING_SECRET`.
- No Organizations are used; keep the feature disabled to avoid unused claims
  and role ambiguity.

## Required environment variables

Production:

```text
NEXT_PUBLIC_APP_URL=https://branzzo.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SIGNING_SECRET=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/auth/complete
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
ADMIN_CLERK_USER_IDS=user_...
```

Do not set `CLERK_TEST_OTP`, `SEED_TEST_PASSWORD`, seeded emails,
`ADMIN_EMAILS`, `pk_test_`, or `sk_test_` in production.

## Validation plan

Automate against isolated development/E2E instances:

- Internal redirect rejection
- Key-type and immutable-admin configuration guards
- Creator, brand, admin login and role isolation
- Non-admin rejection from admin UI and APIs
- Session persistence/logout
- Onboarding redirect and cross-role API rejection
- Webhook signature rejection, replay, and synchronization with isolated MongoDB
- Deleted-user access and database cleanup/anonymization contract
- Mobile sign-in/sign-up layout
- Staging/E2E key and database separation

Manually validate in the production instance before launch:

- Creator and brand signup plus email verification
- Password creation, reset, expired/invalid reset links
- Google signup/sign-in and account chooser
- Duplicate email/account linking
- Authentication email sender, branding, links, and mobile rendering
- Cookie/session behavior on `branzzo.com`
- Sign-out return to the homepage
- DNS/certificate and Account Portal behavior
- Production webhook delivery/replay
- Email change propagation
- Clerk-dashboard deletion and retention outcome

## Ordered production-instance creation

1. Finish the role-locking, deletion-policy, and webhook-ledger blockers.
2. In Clerk, create a new **production** instance for Branzzo; do not clone test
   users or credentials.
3. Set the primary application domain to `branzzo.com`.
4. Add exactly the DNS records Clerk displays in Cloudflare as DNS-only and
   complete Clerk certificate deployment.
5. Configure the application URLs and redirects listed above.
6. Enable email/password, email verification, password reset, and Google;
   leave deferred methods and Organizations disabled.
7. Configure Clerk email/product branding and support links.
8. Configure the Google production OAuth client using Clerk's exact redirect
   URI, then publish/verify the Google consent screen as required.
9. Create a fresh real production administrator, enable MFA for that account,
   and store its immutable Clerk user ID in `ADMIN_CLERK_USER_IDS`.
10. Create the Clerk webhook for the three user lifecycle events at
    `https://branzzo.com/api/webhooks/clerk`; store its signing secret as
    `CLERK_WEBHOOK_SIGNING_SECRET`.
11. Add production keys/secrets to Cloudflare without printing or committing
    them. Confirm no test variables are present.
12. Deploy only through the normal reviewed deployment workflow.
13. Execute the full manual production validation plan with non-admin creator
    and brand accounts before opening registration.

No Clerk instance, Google project, DNS record, webhook, or deployment was
created by this audit.
