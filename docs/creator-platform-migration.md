# Creator platform-account backfill

`npm run migrate:creator-platforms` is dry-run only. It reports summary counts and never logs creator names, handles, URLs, codes, or document IDs. Use `--batch=N` to bound cursor batches.

Apply is deliberately separate: `npm run migrate:creator-platforms -- --apply`. Do not use apply against production until a dry-run report, backup, index review, and deployment approval are complete. Production apply additionally requires `CREATOR_PLATFORM_MIGRATION_ALLOW_PRODUCTION=true` for that process only.

The backfill updates only profiles with no platform accounts. It retains all legacy fields, converts valid HTTPS YouTube, Instagram, and podcast URLs, preserves compatible legacy YouTube verification, chooses the first valid legacy account as primary, and derives maximum audience fields centrally. Reruns skip converted profiles.

Recovery is additive: stop the command, inspect summary counts, and restore affected profile documents from the pre-apply database backup if rollback is required. Do not remove legacy fields during this release.
