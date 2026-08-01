# GitHub Actions deployment

## Production environment

In repository settings, create an environment named `production`.

1. Add environment secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `MONGODB_URI`, and any maintenance-only database secrets required by manual workflows.
2. Add environment variables `PRODUCTION_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `MONGODB_DB_NAME`.
3. Add required reviewers where the GitHub plan supports them.
4. Restrict deployment branches to `main`.
5. Review deployment history from the repository Environments page.

These dashboard settings are instructions; they are not configured by this repository.

Create a separate environment named `e2e` for authenticated browser tests. Store only isolated test Clerk, MongoDB, and account credentials there. The E2E database name must visibly contain `test`, `testing`, `ci`, `e2e`, or `integration`; the workflow rejects any other database.

## Cloudflare API token

Create an API token—not a Global API Key—for the one Cloudflare account that owns Branzzo. Scope it to the Worker resources needed for script deployment and Worker version management. Add extra permissions only if the configuration later adds resources such as R2 or Cloudflare Images. Store the token and account ID in the GitHub `production` environment.

Rotate the token periodically and immediately after suspected exposure. Create the replacement, update the GitHub secret, validate a deployment, and then revoke the old token.

## Workflows

- **CI** validates branches and pull requests. It never receives Cloudflare deployment credentials.
- **Deploy Production** runs only from `main` or a manual dispatch, passes validation, deploys the Worker, and performs non-destructive smoke checks.
- **E2E** runs public tests locally and enables authenticated suites only with isolated test Clerk and MongoDB credentials.
- **Run Analytics Migration** is manual, defaults to dry-run, and requires the exact `APPLY analytics` confirmation for writes.
- **Verify or Apply Analytics Indexes** is manual, defaults to verification, never drops indexes, and requires `APPLY indexes` before creating missing indexes.

Failed workflows can be rerun from the Actions run page. Production can be manually triggered from **Actions → Deploy Production → Run workflow**. A failed validation step prevents deployment.

## Branch protection checklist

- Protect `main`.
- Require a pull request before merging.
- Require the `CI / validate` check.
- Require conversation resolution.
- Dismiss stale approvals when sensitive code changes.
- Block force pushes and branch deletion.
- Limit production deployment to `main`.
- Optionally require the E2E check once isolated CI credentials are configured reliably.

No branch protection setting is changed automatically by these files.

## Secret-handling rules

Do not upload `.env*`, `.dev.vars*`, Playwright authentication state, database dumps, production cookies, or access tokens as artifacts. The workflows upload only reports, traces, screenshots, and selected build outputs. Playwright storage-state files are explicitly excluded.
