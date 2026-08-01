# Transactional email — Stage 1

Branzzo sends transactional email through the server-only Resend service in
`lib/email`. Clerk remains the owner of password resets, OTPs, sign-in codes,
and email verification.

## Environment

- `RESEND_API_KEY`: restricted, sending-only Resend key (required in production)
- `NEXT_PUBLIC_APP_URL`: canonical absolute application URL
- `EMAIL_FROM`: `Branzzo <notifications@updates.branzzo.com>`
- `EMAIL_REPLY_TO`: `support@branzzo.com`
- `EMAIL_TEST_RECIPIENT`: development-only allowlisted manual-test recipient

## Local preview

Start the application with `npm run dev`, then open:

- `http://localhost:3000/api/dev/email-preview/creator`
- `http://localhost:3000/api/dev/email-preview/brand`

Previewing never sends mail, needs no Resend key, and returns 404 in production.

## Manual test

Sign in locally as an administrator, configure all email environment variables
including `EMAIL_TEST_RECIPIENT`, then explicitly send a POST request from the
authenticated browser session:

```js
fetch("/api/dev/email-test", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ template: "creator" }), // or "brand"
}).then((response) => response.json()).then(console.log);
```

The endpoint sends only to `EMAIL_TEST_RECIPIENT`, returns only normalized
status/error fields and the safe provider message ID, and returns 404 in
production.

## Stage 2 integration candidates

The creator and brand onboarding POST routes are the natural integration
points, but they currently use replayable upserts. Before connecting welcome
email delivery, add a durable unique idempotency record keyed by user and
welcome-template type, and send only after the corresponding onboarding
transaction first reaches completion.
