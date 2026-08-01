# Cloudflare Workers staging release

The staging Worker is `branzzo-staging` and is configured by
`wrangler.staging.jsonc`. The production Worker remains `branzzo` in
`wrangler.jsonc`. Staging uses its `workers.dev` address and has no routes or
custom domains.

## Protected GitHub environment

Create a protected GitHub environment named `staging`. Keep required reviewers
enabled for the first release. The `Deploy Staging` workflow is manual-only.

Environment variables:

- `STAGING_URL`: exact `https://branzzo-staging.<account-subdomain>.workers.dev`
  origin
- `STAGING_MONGODB_DB_NAME`: exactly `branzzo_staging`
- `STAGING_CLERK_PUBLISHABLE_KEY`: `pk_test_...` key from the isolated Clerk
  instance
- `E2E_CLERK_PUBLISHABLE_KEY`: the same isolated staging Clerk publishable key
- `CLERK_STAGING_CONFIGURATION_VERIFIED`: `true` only after the staging
  workers.dev origin and the `/sign-in`, `/sign-up`, `/onboarding`, callback,
  and sign-out flows have been configured and manually checked in Clerk

Environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `STAGING_MONGODB_URI` (must select `branzzo_staging`)
- `STAGING_CLERK_SECRET_KEY`
- `STAGING_ADMIN_EMAILS`
- `ANALYTICS_TEST_MONGODB_URI`
- `E2E_MONGODB_URI`
- `E2E_CLERK_SECRET_KEY`
- `E2E_CREATOR_EMAIL`
- `E2E_BRAND_EMAIL`
- `E2E_ADMIN_EMAIL`
- `E2E_CLERK_TEST_OTP`

Optional staging secrets are `STAGING_CLERK_WEBHOOK_SECRET` and
`STAGING_RESEND_API_KEY`. Leave them absent unless those integrations are
intentionally exercised.

The three MongoDB URIs must select different databases. The staging database is
fixed to `branzzo_staging`; integration and E2E names must clearly identify
their test purpose. Use database-scoped users. The preflight rejects missing
database names and recognizable administrative usernames without logging any
part of a URI.

## First deployment

Dispatch `Deploy Staging` manually. It fails before any Cloudflare mutation
unless all required values pass the isolation preflight and all local release
gates pass. Wrangler uploads runtime secrets atomically with the first Worker
version through an ephemeral runner-only secrets file. The file is removed by
an `always()` cleanup step and is never uploaded as an artifact.

After deployment, the workflow checks the public routes and runs the
authenticated role suites against the real workers.dev origin. Review Worker
logs separately with:

```text
npx wrangler tail --config wrangler.staging.jsonc
```

Check for uncaught exceptions, database or Clerk failures, redirect loops,
asset routing failures, compatibility errors, and stack traces. Do not paste
secret-bearing request data into release records.

## Rollback and removal

List the staging versions and deployments:

```text
npx wrangler versions list --config wrangler.staging.jsonc
npx wrangler deployments list --config wrangler.staging.jsonc
```

Roll back only staging:

```text
npx wrangler rollback <STAGING_VERSION_ID> --config wrangler.staging.jsonc
```

Remove individual staging secrets:

```text
npx wrangler secret delete <SECRET_NAME> --config wrangler.staging.jsonc
```

Delete the staging Worker only after independently confirming the resolved
Worker name is `branzzo-staging`:

```text
npx wrangler delete --config wrangler.staging.jsonc
```

Never run these commands with `wrangler.jsonc`; that file targets the reserved
production Worker. Connect the purchased domain only after a successful real
runtime smoke test and log review, in a separate approved production task.
