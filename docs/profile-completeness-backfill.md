# Profile completeness backfill

The backfill is idempotent and dry-run by default. It evaluates existing records with the same central functions used by onboarding and writes no personal fields.

Run a future environment-approved dry run with `npx tsx scripts/backfill-profile-completeness.ts`. Review summary counts only. Apply only after approval with `npx tsx scripts/backfill-profile-completeness.ts --apply`.

Incomplete accounts and their existing collaborations remain intact. Public discovery queries suppress incomplete profiles, and new marketplace outreach is blocked until required fields are completed. The script does not fabricate data, verify profiles, change visibility choices, delete profiles, or run during build/deployment.
