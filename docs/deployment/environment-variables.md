# Environment variables

Never commit real values. Local values belong in ignored `.env.local`, `.env.playwright`, or `.dev.vars` files. Cloudflare runtime secrets belong in Worker secrets; GitHub Actions credentials belong in GitHub environment or repository secrets.

## Build-time public variables

These values are embedded into browser bundles when referenced by client code and are therefore public.

| Variable | Required | Environments | Purpose | Configure in | Public |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production authentication | Preview, production | Identifies the matching Clerk instance | GitHub environment variable for builds; Cloudflare variable for runtime | Yes |
| `NEXT_PUBLIC_APP_URL` | Production | Preview, production | Canonical application URL and metadata base | GitHub environment variable and Cloudflare variable | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Optional; defaults to `/sign-in` | All | Clerk sign-in route | Build environment | Yes |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional; defaults to `/sign-up` | All | Clerk sign-up route | Build environment | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Optional; defaults to app flow | All | Post-sign-in route | Build environment | Yes |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Optional; defaults to app flow | All | Post-sign-up route | Build environment | Yes |
| `NEXT_PUBLIC_CONTACT_EMAIL_DOMAIN` | Optional | All | Domain shown for public contact addresses | Build environment | Yes |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional | All | Public support address | Build environment | Yes |
| `NEXT_PUBLIC_PARTNERSHIPS_EMAIL` | Optional | All | Public partnerships address | Build environment | Yes |
| `NEXT_PUBLIC_LEGAL_EMAIL` | Optional | All | Public legal address | Build environment | Yes |

`NEXT_PUBLIC_*` values must never contain secrets. Changing one requires a new build because client-side values are compiled into output.

## Runtime secrets and server configuration

| Variable | Required | Environments | Purpose | Configure in | Public |
| --- | --- | --- | --- | --- | --- |
| `CLERK_SECRET_KEY` | Production authentication | Preview, production | Server-side Clerk API authentication | `wrangler secret put CLERK_SECRET_KEY` | No |
| `CLERK_WEBHOOK_SECRET` | If Clerk webhooks are enabled | Preview, production | Verifies Clerk webhook signatures | `wrangler secret put CLERK_WEBHOOK_SECRET` | No |
| `MONGODB_URI` | Database-backed features | Preview, production | TLS MongoDB Atlas connection URI | `wrangler secret put MONGODB_URI` | No |
| `MONGODB_DB_NAME` | Recommended | Preview, production | Selects the application database | Cloudflare encrypted secret or non-secret Worker variable | No |
| `ADMIN_EMAILS` | Required for email-based admin authorization | Production | Comma-separated admin allowlist | Cloudflare encrypted secret | No |
| `RESEND_API_KEY` | If outbound email is enabled | Preview, production | Resend API credential | `wrangler secret put RESEND_API_KEY` | No |
| `EMAIL_FROM` | If outbound email is enabled | Preview, production | Verified sender identity | Cloudflare variable | Not sensitive, but server-only |
| `BRANZZO_PUBLIC_URL` | If email logos are enabled | Preview, production | Absolute public base URL for email assets | Cloudflare variable | Yes |
| `SEED_ALLOW_PRODUCTION` | Normally unset | Controlled maintenance only | Explicit guard for production seed execution | Operator shell only | No |
| `SEED_TEST_PASSWORD` | Seed operation only | Isolated test data only | Password used by the seed script | Operator or CI secret store | No |

Cloudflare Worker runtime variables are available through the Node compatibility `process.env` bridge. Configure secrets before deployment. Do not place them under `vars` in `wrangler.jsonc`.

## CI-only variables and secrets

| Variable | Required | Scope | Purpose | Configure in | Public |
| --- | --- | --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deployment | GitHub `production` environment | Scoped Workers deployment credential | GitHub environment secret | No |
| `CLOUDFLARE_ACCOUNT_ID` | Deployment | GitHub `production` environment | Selects Cloudflare account | GitHub environment secret | No |
| `PRODUCTION_URL` | Deployment smoke test | GitHub `production` environment | Deployed canonical URL | GitHub environment variable | Yes |
| `ANALYTICS_TEST_MONGODB_URI` | Optional CI integration job | Repository or environment | Dedicated, disposable analytics test database | GitHub secret | No |
| `E2E_MONGODB_URI` | Authenticated E2E | E2E CI only | Dedicated E2E database, never production | GitHub secret | No |
| `E2E_CLERK_PUBLISHABLE_KEY` | Authenticated E2E | E2E CI only | Publishable key for test Clerk instance | GitHub secret | Technically public, retained with the test configuration |
| `E2E_CLERK_SECRET_KEY` | Authenticated E2E | E2E CI only | Secret key for test Clerk instance | GitHub secret | No |
| `E2E_CREATOR_EMAIL` | Authenticated E2E | E2E CI only | Seeded creator account | GitHub secret | No |
| `E2E_BRAND_EMAIL` | Authenticated E2E | E2E CI only | Seeded brand account | GitHub secret | No |
| `E2E_ADMIN_EMAIL` | Authenticated E2E | E2E CI only | Seeded admin account | GitHub secret | No |
| `E2E_CLERK_TEST_OTP` | Authenticated E2E | E2E CI only | Clerk test OTP | GitHub secret | No |
| `BASE_URL` | E2E runner | CI | Local server URL used by Playwright | Workflow environment | Yes |
| `CI` | Automatic | CI | Enables CI behavior and retries | GitHub Actions | Yes |

Forked pull requests do not receive repository secrets. Public tests still run; database integration and authenticated E2E explicitly skip when their isolated credentials are unavailable.

Trusted CI does not silently skip these gates: internal CI requires `ANALYTICS_TEST_MONGODB_URI`, while authenticated browser tests require the protected GitHub `e2e` environment. Only untrusted forks may run the public secret-free subset.
# Private proof uploads

Payment and campaign proof screenshots use the private `BRANZZO_UPLOADS` R2 binding. This is a Worker binding, not an environment secret. Production must bind it to `branzzo-uploads`; staging should use a separate bucket such as `branzzo-uploads-staging`. Never bind uploads to `branzzo-incremental-cache` and do not enable public bucket access.

`EMAIL_LOGO_URL` remains an optional backward-compatible override. By default email templates derive the verified `/branding/branzzo-logo.png` asset from `APP_URL`, then `NEXT_PUBLIC_APP_URL`.
