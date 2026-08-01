# Cloudflare compatibility audit

## Runtime assessment

- Next.js App Router, route handlers, dynamic routes, middleware, cookies, and headers are supported by the OpenNext Cloudflare adapter.
- The project uses the default Next.js Node runtime. No route declares the unsupported Edge runtime.
- Application runtime code does not use `fs`, `child_process`, local persistence, or long-running background jobs. Filesystem and native `sharp` usage is limited to local build/maintenance scripts.
- Polling timers are browser-side UI behavior and do not create Worker background jobs.
- Middleware uses Clerk's standard Next.js middleware and does not depend on Node middleware mode.
- Remote images use Next image optimization. The initial configuration uses OpenNext defaults and does not assume a paid Cloudflare Images binding. Revisit the image binding if production image optimization load warrants it.

## MongoDB and Mongoose

MongoDB and Mongoose run through Workers' Node compatibility layer and outbound TCP support. A connection is cached per warm Worker isolate; it cannot be globally shared across all isolates. The existing cached connection/promise prevents duplicate connection creation inside one isolate, uses a bounded pool, disables command buffering, and resets a failed promise.

Production requirements:

- Store `MONGODB_URI` as a Worker secret.
- Use a `mongodb+srv://` TLS connection string with URL-encoded credentials.
- Use a separate database and least-privilege database user for production.
- Use separate isolated databases for preview, integration, and E2E.
- Monitor Atlas connection counts because scaling creates multiple isolates and therefore multiple pools.
- Atlas requires an explicit network-access policy. Workers do not provide one stable outbound IP by default.
- If Atlas uses `0.0.0.0/0`, retain TLS, strong unique credentials, least privilege, and review the exposure before launch. This repository does not modify Atlas networking.

## Clerk

Use a production Clerk instance with production publishable and secret keys. Configure the canonical allowed origin, `/sign-in`, `/sign-up`, post-auth routes, callback URLs, and the `/api/webhooks/clerk` webhook with its own signing secret. A custom Clerk domain is optional. Test keys and test accounts are confined to E2E secrets and must never be reused in production.

## Build-time and runtime environment

`NEXT_PUBLIC_*` values are embedded during `next build`; production builds must receive the production values. Server-only values are read at request time through `process.env` and must be configured as Worker secrets or variables. Static generation can execute server code during the build, so any page that truly requires a private value at build time must receive a dedicated build credential—not an untrusted pull-request or production database secret.

## Operational constraints

- No automatic data migration or index synchronization runs during deployment.
- Email sending and webhook work are request-bound. If volume grows, move retryable asynchronous delivery to Cloudflare Queues rather than extending request duration.
- Worker bundle compressed size must fit the selected Cloudflare Workers plan.
- Preview deployment remains deferred until isolated preview Clerk and MongoDB resources exist.

## Current launch gates

- The minified Worker bundle is 2,653.23 KiB compressed and fits the Workers Free-plan 3 MiB compressed limit.
- Next.js is pinned to 15.5.22 with scoped PostCSS 8.5.23 and Sharp 0.35.3 overrides. The production dependency audit reports zero vulnerabilities.
- On this Windows workstation, OpenNext builds successfully when allowed normal host path access, but local `wrangler dev` fails while spawning `workerd`. Linux GitHub runners remain the authoritative preview/deployment environment.
- The `branzzo` Worker does not yet exist in the authenticated Cloudflare account, so runtime secret names cannot be remotely verified until an approved first deployment or Worker creation.
