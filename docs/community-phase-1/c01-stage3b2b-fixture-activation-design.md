# C01 Stage 3B.2B fixture activation design review

Decision: BLOCKED for activation; design proposal only. No account or membership created, and no implementation or migration applied.

## Existing approved mechanisms

app/business/sign-in/actions.ts and auth/callback/route.ts authenticate normally, then select ACTIVE memberships; neither accepts invitations. sign-up/actions.ts creates an auth identity and may trigger confirmation delivery; profile metadata does not grant membership. Do not invoke signup in this preparation.

app/business/onboarding/actions.ts calls complete_business_onboarding. In the C01 migration, create_business_organization binds the authenticated creator as first ACTIVE OWNER, serializes on the auth user, refuses another creator workspace for an already active member, and retries idempotently. complete_business_onboarding seeds templates/context and completes setup atomically. A creator-owned, incompletely onboarded workspace can use this recovery path. This is not arbitrary membership activation.

app/business/actions.ts delegates invitations and role changes through lib/business/supabase-store.ts to owner-authorized invite_business_member and change_business_member. Invitations are INVITED rows with user_id NULL. change_business_member explicitly raises INVITATION_NOT_ACCEPTED when an invitation is activated. business_membership_invariant rejects changes to membership id, organization_id OR user_id; an in-place NULL-to-user binding would fail. Direct authenticated membership writes are revoked. There is no approved invitation-acceptance RPC, server action or UI in the inspected application/migrations. Demo store invitation objects are not a persisted activation mechanism.

## Nine-account design

| Actor | Required starting state | Legitimate future path |
|---|---|---|
| owner | ACTIVE OWNER primary; ACTIVE MEMBER secondary for case 05 | Creator onboarding primary; invitation from secondOwner and verified acceptance into secondary |
| admin | ACTIVE ADMIN primary only | Primary owner invite; verified acceptance |
| manager | ACTIVE MANAGER primary only | Primary owner invite; verified acceptance |
| member | ACTIVE MEMBER primary only | Primary owner invite; verified acceptance; MUST NOT join secondary (foreign-data denial cases) |
| suspended | SUSPENDED MEMBER primary; no other active tenant | Accept MEMBER invitation, then primary owner uses change_business_member to suspend |
| nonmember | Authenticated identity, no membership | No organization provisioning or acceptance |
| secondOwner | ACTIVE OWNER secondary | Independent creator onboarding before inviting owner into secondary; retain sole owner for last-owner test |
| newOwner | No membership before case 01 | Case 01 performs ordinary UI onboarding; do not precreate workspace |
| recoverOwner | Creator ACTIVE OWNER recovery org, incomplete onboarding marker | Authenticated create_business_organization only; case 02 completes normal onboarding |

Nine is the existing full-harness contract, not nine accounts created now. Three organizations are prepared conceptually, with a fourth created by case 01. A separate invitation-only synthetic address for case 07 is not a tenth auth account. Pure fixture-plan UUIDs are placeholders: creator RPCs and future acceptance return actual IDs; record actual primary and secondary membership IDs separately. Never force planned UUIDs with SQL. No passwords, JWTs or cookies belong in an evidence ledger.

Suspending after acceptance must occur before scenarios; keep primary MEMBER unchanged or restore through existing owner RPC as case 08 already requires. Never grant extra roles to make denial tests pass. Recovery needs an incomplete marker, not a missing-owner repair. Do not generate that condition by updating the database. Keep naturally produced immutable audit IDs and exact namespaced storage paths; current data definitions remain a separate design gate.

## Smallest safe application proposal (requires separate implementation approval)

Add one narrowly scoped, ordinary authenticated invitation-acceptance API plus server action/UI; a new additive reviewed migration would implement its transaction. Do not edit the frozen C01 migration or weaken its identity/last-owner triggers, RLS or grants. This stage does not authorize writing that migration.

1. Accept an invitation identifier, never a target user ID, desired role, permissions or claimed email. Resolve auth.uid() and confirmed current email from authoritative auth storage; reject unconfirmed, missing, changed or mismatched email. Do not trust editable user metadata or email supplied by the caller. Normalize email using the same rules as invitations.
2. Use a fixed search path, explicit authenticated-only execute grant and a narrowly reviewed security-definer authorization check, consistent with existing application RPCs. The definer is an application authorization mechanism, not a generic provisioning adapter. No service-role client or raw SQL fixture insertion is permitted.
3. Serialize on the organization row before reading/locking invitation and membership state, consistent with existing membership mutation order and stale-snapshot protections. Cannot call business_lock_owner for the invitee: it requires an existing OWNER. Design a private lock helper or equivalent inline lock without exposing a generic write capability. Recheck invitation scope, pending state and trusted inviter's current authority under the lock; reject ambiguity, stale/revoked invitations and unsupported isolation levels.
4. Preserve immutable membership identities: atomically consume the unbound INVITED row and insert a NEW ACTIVE row bound to auth.uid(), using only its owner-approved role and empty permissions. Proposed minimal consumption is deletion of that unbound INVITED row with an immutable acceptance audit linking original invitation ID and new membership ID. Do not UPDATE user_id. Existing original MEMBER_INVITED audit must remain. Inspect all foreign keys and retention requirements before implementing deletion; if deletion is incompatible, use a separate explicit invitation lifecycle structure instead. No existing status enum value means accepted/expired (only ACTIVE/SUSPENDED/INVITED).
5. Do not silently replace or reactivate existing suspended memberships. Reject conflicting existing membership or role drift. Unique (organization_id,user_id) and organization serialization prevent duplicate membership. Define idempotent retry using an explicit immutable acceptance record keyed by invitation ID and authenticated actor; never return success solely because some membership already exists. Concurrent accept/revoke/role-change behavior must be specified and tested atomically. Deleted invitation retries need that durable record.
6. Owner-role invitations require an explicit policy decision before implementation: either validate and preserve the existing owner's deliberate OWNER grant or reject OWNER acceptance until approved. Do not silently change production semantics. The proposed fixtures need only ADMIN/MANAGER/MEMBER acceptance.
7. Add a safe acceptance entry point that works before ACTIVE membership exists. Current sign-in/callback routing sends nonmembers to onboarding, so preserve a sanitized invitation intent across authentication and present acceptance before workspace creation. Enforce server authentication, CSRF/origin controls and safe redirects; no automatic grant on login or callback. No invitation lookup should expose other tenants' membership lists.
8. Keep acceptance itself free of provider/email side effects. Expiration/revocation semantics are currently missing; specify an explicit validity policy and invitation identity/replay protection before implementation. If tokens are introduced, use server-stored hashes, bounded lifetime and one-time consumption; do not log raw tokens. Do not pretend existing invitations already have these fields.

## Required future validation

Offline application tests: unauthenticated/unverified/wrong-email/wrong-tenant rejection; caller-controlled role/user/metadata ignored; pre-membership routing; safe redirect handling; no provider calls; suspended member cannot reactivate. Separately authorized isolated-database tests must prove lock ordering, duplicate/concurrent acceptance and revocation, atomic audit/rollback, trigger compatibility, least-privilege grants and immutable identity/last-owner preservation. Offline mocks alone cannot certify new SQL authorization. Do not repeat historical Stage 1/2 results as proof of a changed schema.

A separately authorized identity setup design is still required for preconfirmed synthetic example.invalid accounts without email delivery. It must remain separate from application/browser runtime and cannot activate memberships using elevated credentials. Genuine expired-session fixture provenance, exact data/API provisioning definitions, backend effects review, and actual ID mapping remain future gates.

## Recommendation

Authorize design finalization and local-only implementation/tests of the acceptance flow separately, including a reviewed additive migration source if desired, with no database application or identity creation. Resolve invitation consumption/retention, validity, OWNER policy and idempotency decisions first. Independently provide the restricted runtime. Only after both gates pass should staging identity preflight, writes and selected E2E be considered under their own explicit authorizations.
