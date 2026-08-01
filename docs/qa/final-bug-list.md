# Final Bug List

| ID | Severity | Title | Route/role | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| QA-001 | P2 | Seed was not deterministic after workflow mutations | Seed tooling | Initial verification reported 20 collaborations but 9 accepted, 4 pending, 4 verification requests | Fixed; seeded records are recreated by prefix and profiles reset |
| QA-002 | P2 | ESLint scanned generated OpenNext/Wrangler bundles | Repository validation | 39,486 generated-code findings | Fixed via generated-directory ignores |
| QA-003 | P2 | Generic Chromium project duplicated authenticated suites without storage state | Playwright config | Invalid 322-case run failed on logged-out admin pages | Fixed; final matrix correctly lists 193 cases |
| APP-001 | P1 | Unrelated-creator chat isolation assertion returned 401 | Chat API / creator | `creator-collaboration-chat-.../trace.zip` | Unresolved; no content exposure observed, but expected authorization contract was not met |
| APP-002 | P1 | Rejected/cancelled collaboration chat gating test failed | Collaboration chat / brand | `brand-collaboration-chat-.../trace.zip` | Unresolved |
| APP-003 | P2 | Creator profile edit emitted hydration mismatch | `/dashboard/creator/edit` / creator | Failure shows client-only `caret-color: transparent` mutation | Unresolved; may involve the test browser environment, but broad suppression is not acceptable |
| APP-004 | P2 | Clerk-hosted brand image had zero natural dimensions | `/dashboard/history` / brand | `brand-ui-audit-.../test-failed-1.png` | Unresolved |
| APP-005 | P2 | Brand dashboard tablet assertion found duplicate hidden/visible command-center labels | `/dashboard/brand`, 768×1024 | `brand-dashboard.responsive-.../trace.zip` | Unresolved selector/layout ambiguity |
| TEST-001 | P3 | Creator verification tests use an ambiguous duplicate heading | `/dashboard/verification` | Six failures; two “Creator verification” h2 elements | Unresolved test selector; product page rendered |
| TEST-002 | P3 | Admin verification “Next” selector also matches Next.js dev tools | `/admin/verification` | Strict-mode collision with “Open Next.js Dev Tools” | Unresolved test selector |
| ENV-001 | P2 | Clerk requests aborted during admin inquiry audit | `/admin/inquiries` / admin | Two `net::ERR_ABORTED` Clerk requests | Unresolved/transient |
| ENV-002 | P2 | Admin email-log navigation exceeded 45 seconds once | `/admin/email-logs` / admin | Timeout trace; other viewport runs passed | Unresolved/transient |

No P0 data exposure or corruption was observed. Raw Playwright result: 16 failed, consolidated above.
