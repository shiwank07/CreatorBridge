# Admin search and retained-cap audit

## Search strategies

- Creators: `CreatorProfile` aggregation with a bounded page `$facet` and a
  `$lookup` to `User`. Search and account/profile filters run before count,
  sort, skip, and limit.
- Brands: `BrandProfile` aggregation with a bounded page `$facet` and a
  `$lookup` to `User`.
- Users: direct `User` query. Clerk IDs are searched only as exact identifiers
  beginning with `user_`.
- Collaborations: direct `BrandInquiry` query. Valid MongoDB object IDs receive
  an exact `_id` alternative.
- Contacts: the current product models these as creator/brand account contact
  records, not contact-form submissions. A `User` aggregation looks up the
  associated creator and brand profiles before search and pagination.
- Email logs: direct `EmailNotification` query. Search is limited to recipient,
  event, and provider reference.

All free-text input is trimmed, truncated to 120 characters, and escaped before
constructing a case-insensitive regular expression.

## Index behavior

Equality filters and deterministic sorts use the compound indexes declared on
the schemas. Unanchored substring regular expressions cannot use an ordinary
B-tree index for the substring itself. MongoDB can still use the leading
verification, role, status, event, or ownership index to narrow candidates,
then evaluate the escaped regex. Populated synthetic `executionStats` results
are produced by `npm run explain:pagination`.

## Retained bounds

- `lib/queries/collaborations.ts`: 100 recent creator or brand collaborations.
  This is a deliberately bounded dashboard preview. The complete collection is
  available through `/dashboard/history`.
- `lib/queries/admin.ts`: 200 recent reported issues for the operational report
  triage screen. This screen still needs its own pagination pass and is not one
  of the six release-blocking lists.
- `lib/queries/admin.ts`: 100 pending creator and 100 pending brand verification
  records for dashboard summaries. The dedicated verification endpoint is
  paginated.
- `lib/queries/admin.ts`: global admin search is deliberately bounded to eight
  candidates per source and twelve combined suggestions; it is an autocomplete
  preview, not a complete-results list.

The former 100–300 record admin list helpers were removed. The former public
creator 500-candidate ceiling was replaced by an uncapped aggregation search,
so valid creators are not hidden behind candidate preselection.
