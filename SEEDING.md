# Database seeding

The Branzzo seed creates deterministic Clerk authentication users, MongoDB accounts, profiles, collaborations, verification requests, notifications, and reviews. Clerk users are reused by exact email address, every MongoDB user stores the matching Clerk user ID, and database-level unique indexes prevent duplicate sample records when the command is rerun.

## Run locally

1. Set `MONGODB_URI` and `CLERK_SECRET_KEY` in `.env.local` for the test environment you intend to seed.
2. Set `SEED_TEST_PASSWORD` in your shell or secret manager. The seed exits before contacting Clerk or MongoDB when it is missing.
3. Run:

   ```bash
   npm run seed
   ```

The command is safe to rerun. Existing Clerk users are found by exact email address and reused, and their passwords are updated in place from `SEED_TEST_PASSWORD`; missing Clerk users are created with that password. Existing seed records are retained, missing records are inserted, MongoDB records are linked to the authoritative Clerk IDs, and unrelated application data is never deleted.

## Login accounts

All seed users use the password supplied through `SEED_TEST_PASSWORD`. Existing matching Clerk users have their password updated during every seed run, while missing users are created with it. The password is never printed by the seed and is intentionally not stored in this document.

| Role | Email |
| --- | --- |
| Admin | `admin+clerk_test@branzzo.com` |
| Brand | `nike+clerk_test@branzzo.com` |
| Brand | `samsung+clerk_test@branzzo.com` |
| Creator | `gamingcreator+clerk_test@branzzo.com` |
| Creator | `techcreator+clerk_test@branzzo.com` |
| Creator | `lifestylecreator+clerk_test@branzzo.com` |
| Creator | `fitnesscreator+clerk_test@branzzo.com` |
| Creator | `financecreator+clerk_test@branzzo.com` |

## Production safeguard

Seeding exits without writing when `NODE_ENV=production`. If demo data is intentionally required in a production-mode environment, confirm the target database and explicitly opt in for that command:

```bash
SEED_ALLOW_PRODUCTION=true npm run seed
```

In PowerShell, use `$env:SEED_ALLOW_PRODUCTION="true"` before `npm run seed`.

The seeded admin account has the database role `admin`. Admin page access remains protected by the application's Clerk `ADMIN_EMAILS` allowlist, so add `admin+clerk_test@branzzo.com` there only in an appropriate test environment.
