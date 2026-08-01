# Clerk application-side blocker resolution

## Durable ledger and ordering

Every verified Clerk `user.created`, `user.updated`, or `user.deleted` delivery
is claimed in `ClerkWebhookEvent` by its unique signed `svix-id`. A concurrent
duplicate cannot acquire a second claim. Completed/skipped duplicates return
success without running synchronization again. Failed records retain a
normalized error and can be reclaimed up to five bounded attempts.

Signature verification occurs before MongoDB ledger access. Signature headers
and secrets are never persisted.

Ordering uses Clerk `data.updated_at` (milliseconds) for create/update events
and the signed Svix timestamp as the deletion fallback. `User` stores
`latestClerkEventAt` and `latestClerkEventId`. Updates apply only when newer, or
when replaying the exact same event ID and timestamp. Equal-time different
events are conservatively skipped. Deletion atomically writes a tombstone and
ordering version before cleanup, so stale updates cannot reactivate it. A
delete arriving before any user record creates a minimal tombstone for that
Clerk ID.

## Reconciliation

Read-only by default:

```text
npm run reconcile:clerk -- --user-id=user_...
npm run reconcile:clerk -- --limit=25
```

Apply one or more explicit non-production repairs with `--apply`. In production,
apply mode requires exactly one explicit Clerk user ID. Reconciliation updates
only Clerk-authoritative identity fields (email, verification, name, avatar,
and sync version). It never reads roles/admin status from metadata and never
changes an existing role. Deleted tombstones are not reactivated.

## Role lock

The first successfully completed creator or brand onboarding atomically writes
the role and `onboardingComplete`. Replaying that same role remains supported.
The opposite completed role fails with HTTP 403. The unique Clerk ID index makes
concurrent conflicting onboarding claims safe: one succeeds and the other
receives the conflict response. Neither payload nor query parameters can select
`admin`.

Future role changes require a separate admin-only workflow; the public
onboarding endpoints are not that workflow.

## Deletion and retention policy

Self-service deletion and Clerk-dashboard `user.deleted` now call the same
idempotent anonymization service.

Deleted/anonymized immediately:

- Account access, onboarding, verification, subscription, feature, phone, and
  email-preference state
- Email, username, name, avatar, and public identity
- Creator and brand profile documents
- Creator verification requests
- Saved-creator relationships
- Notifications addressed to the deleted user
- Actor identity/metadata on retained notifications
- Operational email-log recipient addresses
- Brand contact email/name/website in retained collaboration records
- Creator username snapshots in retained collaboration records

Retained with tombstone/anonymized references:

- The MongoDB `User` tombstone and immutable Clerk ID
- Collaborations and their status/payment/moderation history
- Conversations and messages
- Reviews
- Webhook processing/audit ledger

Public discovery already requires an active, completed user and a profile;
deletion removes the profile and sets `accountStatus=deleted`. Admin account
views and filters distinguish `deleted` from active, hidden, and suspended.
Admin restore/hide/suspend actions are not offered for deleted users, and the
admin mutation routes reject stale attempts with HTTP 409.

This describes implemented product behavior only and does not claim legal or
regulatory compliance.

## Index safety

Schema indexes cover unique webhook event ID, Clerk user ID, per-user ordering,
deletion lookup, and failed/processing ledger review. Run the read-only audit:

```text
npm run indexes:clerk-sync
```

It checks for duplicate event/user IDs and reports existing index counts. It
does not create or drop indexes.

## E2E production-mode server

Playwright now builds the standalone application and starts it with:

```text
npm run build
npm run start:e2e -- --port 3000
```

`npm run dev` remains unchanged for local development. Authenticated tests must
still use isolated Clerk development and MongoDB E2E credentials.
