# Transactional email — Stage 2

## Product-event audit

| Event | Server write and entity | Durable ID | Replay/in-app behavior | Email point |
|---|---|---|---|---|
| Creator onboarding | `POST /api/onboarding/creator`; `User`, `CreatorProfile` upserts | User `_id` | Replayable; no in-app welcome | After both upserts and verification-reset write |
| Brand onboarding | `POST /api/onboarding/brand`; `User`, `BrandProfile` upserts | User `_id` | Replayable; no in-app welcome | After both upserts and verification-reset write |
| Collaboration invitation | `POST /api/brand-inquiries`; `BrandInquiry.create` | Inquiry `_id` | New record; existing in-app notification | After inquiry creation, through notification service |
| Accepted/declined | `POST /api/collaborations/[id]/creator-response`; `BrandInquiry.save` | Inquiry `_id` | State-guarded; existing in-app notification | After collaboration save, through notification service |
| Creator verification result | `PATCH /api/admin/verifications`; `CreatorVerificationRequest`, `CreatorProfile`, `User` | Verification request `_id` | Conditional pending-to-final write; existing in-app notification | After all three writes, through notification service |
| Contact confirmation | `POST /api/contact`; `ContactMessage.create` | Contact message `_id` | Each persisted submission is a new event | After contact record creation |

Email failure never reverses these successful business writes.

## Durable delivery

`EmailNotification.deliveryKey` has a unique partial database index. Initial
delivery is claimed atomically as `processing`; concurrent claims lose on the
unique index. Results store provider ID, normalized error, attempt count, and
`sent`, `failed`, `permanent_failed`, or `skipped` status. Only `failed`
records are eligible for controlled retry. Invalid recipients become
`permanent_failed`.

Delivery keys:

- `welcome:creator:<userId>`
- `welcome:brand:<userId>`
- `collaboration:invitation:<collaborationId>`
- `collaboration:accepted:<collaborationId>`
- `collaboration:declined:<collaborationId>`
- `verification:approved:<verificationRequestId>`
- `verification:rejected:<verificationRequestId>`
- `contact:confirmation:<contactId>`

## Preferences

`User.emailPreferences` includes collaboration invitations, collaboration
status updates, verification updates, product announcements, weekly digest,
and marketing email. Transactional categories default on; announcement,
digest, and marketing categories default off. A settings UI is intentionally
deferred until the account settings API supports these fields.

## Local tools

All Stage 1 and Stage 2 templates are available at
`/api/dev/email-preview/<template>` in development. The authenticated
`POST /api/dev/email-test` endpoint accepts the same template names and can
send only to `EMAIL_TEST_RECIPIENT`. It remains unavailable in production.
