# RC1 release report

Date: 2026-07-27

## Checklist

| Gate | Status | Evidence |
| --- | --- | --- |
| Production dependency advisories | Complete | Next.js 15.5.22 uses scoped PostCSS 8.5.23 and Sharp 0.35.3 overrides; production audit reports zero vulnerabilities. |
| Worker bundle size | Complete | Final minified Wrangler dry run: 10,024.31 KiB raw / 2,653.23 KiB gzip, below the 3 MiB Free-plan compressed limit. |
| Integration test environment | Repository complete; external secret required | Tests reject non-isolated database names. Trusted CI fails without `ANALYTICS_TEST_MONGODB_URI`; forks remain secret-free. |
| Playwright environment | Repository complete; GitHub environment required | Public and authenticated jobs are isolated. Authenticated tests require the protected `e2e` environment and refuse non-test databases. |
| Full CI locally | Partial | `ci:check` passes: audit, types, lint, 16 unit tests, Next standalone build, OpenNext adaptation, and Wrangler dry run. Startup profiling passes. Eight integration cases skip locally because no isolated URI is configured. |
| Production environment variables | Locally inventoried | Required names are documented and local development names are present. GitHub environment values cannot be inspected from this workstation. |
| Dependency versions | Complete | All direct production and development dependencies use exact versions; `package-lock.json` is synchronized. |
| Production secrets | Blocked externally | Read-only Wrangler verification reports that Worker `branzzo` does not exist, so deployed secret names cannot yet be verified. |

## Release decision

RC1 code and pipeline configuration are ready for an environment-backed validation run, but production release approval remains blocked until:

1. `ANALYTICS_TEST_MONGODB_URI` points to a dedicated integration database.
2. The GitHub `e2e` environment contains isolated Clerk, MongoDB, and role-test credentials.
3. The GitHub `production` environment variables and secrets are configured.
4. An approved first Worker creation/deployment makes Cloudflare runtime secret-name verification possible.
5. Trusted GitHub CI, authenticated E2E, and post-deployment smoke checks all pass.

No deployment was performed during RC1 hardening.

The full development-tool audit still reports 14 high-severity transitive findings in ESLint/OpenNext tooling (`minimatch`, `brace-expansion`, `glob`, and `js-yaml` chains). They are absent from the production dependency audit and Worker runtime bundle. Registry-proposed remediations require incompatible framework/tool downgrades or major upgrades, so RC1 does not force unsafe overrides; track upstream patched releases and keep CI inputs trusted.

## Browser validation

The secret-free public Playwright suite passed all 67 cases, covering accessibility, authorization boundaries, discovery/search/filter/pagination behavior, public profiles, responsive layouts, branding assets, image validation, and public-page UI audits. Authenticated suites were not run locally because the existing credentials and database could not be proven isolated; the protected `e2e` workflow now enforces that boundary.
