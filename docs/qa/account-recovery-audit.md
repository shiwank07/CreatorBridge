# Branzzo account recovery audit

## Authoritative account fields

| field | current source | authoritative source | synchronization method |
|---|---|---|---|
| Clerk user ID | Clerk `auth().userId`; `User.clerkId` mirror | Clerk | Clerk webhook and onboarding lookup |
| email | Clerk user/email webhook; `User.email` mirror | Clerk | Signed Clerk webhook and onboarding refresh |
| role | `User.role`; cached in Clerk public metadata/session claims | MongoDB `User.role` | Secure metadata update after onboarding; reconciliation script |
| onboardingComplete | `User.onboardingComplete`; cached in Clerk metadata | MongoDB | Secure metadata update after onboarding; reconciliation script |
| accountStatus | `User.accountStatus` | MongoDB | Application/admin writes only |
| creator username | `User.username` | MongoDB | Creator onboarding upsert; cached to Clerk navigation metadata |
| brand username | `User.username` | MongoDB | Brand onboarding upsert; cached to Clerk navigation metadata |
| creator profile ID | `CreatorProfile._id` related by unique `userId` | MongoDB | Idempotent `findOneAndUpdate({userId}, upsert)` |
| brand profile ID | `BrandProfile._id` related by unique `userId` | MongoDB | Idempotent `findOneAndUpdate({userId}, upsert)` |
| admin status | immutable `ADMIN_CLERK_USER_IDS` | server environment configuration | Project configuration; Clerk metadata only caches navigation role |

`getApplicationAccountState()` is the routing contract. Clerk metadata is a client navigation cache and must fall back to this server contract; it is not authoritative.

## Visible route/action matrix

| label | page | intended user | href/action | auth | fixed result |
|---|---|---|---|---|---|
| Find Creators | home | all | `/creators` | no | creator directory |
| Join as Creator | home | signed out | sign-up then `/onboarding?role=creator` | completion yes | creator onboarding; hidden/replaced in hero for completed accounts |
| Join as Brand | home | signed out | sign-up then `/onboarding?role=brand` | completion yes | brand onboarding; visible alongside creator path |
| Login | navbar | signed out | `/sign-in` | no | Clerk sign-in then auth completion |
| Dashboard | navbar | completed account | role dashboard | yes | creator, brand, or admin destination |
| Creator/Brand role choice | onboarding | new account | query-backed role selection | yes | no implicit preselection; completed accounts redirect |
| Save/Publish profile | onboarding/edit | account owner | onboarding API | yes | idempotent profile upsert, metadata refresh, correct dashboard |
| Retry | account service error | signed-in account | preserved current destination | yes | repeats account lookup; never creates or onboards |
| My/Brand Profile | authenticated navbar | completed role | public profile or edit fallback | yes | existing profile loads |
| Notifications | authenticated navbar | completed/admin | `/notifications` | yes | notification page |
| Account Settings | account menu | signed in | `/dashboard/settings/account` | yes | account settings |

Static audit found no homepage `href="#"` placeholders. Deeper authenticated action behavior remains covered by the existing role-specific browser suites and requires configured isolated Clerk accounts for live completion.
