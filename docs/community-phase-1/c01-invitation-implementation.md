# C01 secure invitation acceptance — local implementation report

Local implementation and offline validation: PASS. Database integration, migration application, native runtime validation and staging E2E: NOT EXECUTED / BLOCKED pending separate authorization. No staging/production connection, account creation, invitation email, database mutation, deployment, commit or push occurred.

Branch: codex/c01-business-authorization-hardening. HEAD remains 38e1d208240045c80e1f2b2b44e28cdc9d36c0ec. Existing unrelated working-tree changes preserved. Changes in already-dirty sign-in/callback/middleware/package files are limited to invitation intent handling or test registration; historical compatibility changes remain.

## Security contract

- The sole acceptance input is an invitation UUID. No client-supplied tenant, user ID, email, role or permissions are accepted. The UUID locates an invitation; possession alone grants nothing.
- Database authorization reads auth.uid() and the current email/email_confirmed_at from auth.users, under an identity lock. It does not trust JWT email, caller data or editable metadata. Application getUser verification adds safe UX; SQL independently checks the identity.
- New owner-authorized invitations have seven-day expiry. Legacy invitations with NULL expiry fail closed and require owner reissue; no silent validity backfill. Invited email, inviter and expiry are immutable after creation.
- Pending revocation is available through revoke_business_invitation, which requires a current owner. Existing owner removal also makes an unaccepted invitation unavailable. Original inviter must still be an active OWNER at acceptance. Acceptance after expiry or revocation fails.
- Existing owner-authorized OWNER invitations remain supported intentionally. No recipient chooses a role. ADMIN/MANAGER/MEMBER fixture grants use the same path. Role changes remain owner-authorized under existing C01 APIs.
- No existing membership is reassigned or reactivated. The unbound INVITED row is retained and marked accepted; a NEW ACTIVE row is inserted using its trusted role and empty permissions. Existing membership identity, unique org/user, first-owner and last-owner triggers remain enabled and unchanged.
- A private RLS-enabled receipt table is immutable, has one receipt per invitation and no client table privileges. It records invitation, organization, new member, recipient, inviter, granted role and acceptance time. Historical user/member/invitation identifiers deliberately have no deletion-cascading foreign keys. Its organization FK restricts deletion while receipts exist; this retention behavior needs database review before application.
- The transaction locks the trusted auth identity before the organization; organization locking precedes invitation/membership state checks, consistent with C01 owner mutations. Acceptance requires READ COMMITTED. Unique constraints and the receipt serialize duplicate acceptance; all membership/receipt/marker/audit writes are atomic.
- Successful acceptance writes MEMBER_INVITATION_ACCEPTED with the recipient as actor, new membership as entity and original invitation UUID in the summary. Original invitation audit remains intact.
- Retry of an accepted invitation returns the original membership only for the same confirmed user AND current matching email, provided that exact membership is still ACTIVE. It creates no membership or audit, does not reset later role changes, and does not reinstate removed/suspended access. Retry remains valid after original invitation deletion or expiry because it confirms an earlier completed grant. A fresh invitation cannot silently replace an existing membership. Revoke of an already accepted invitation is rejected; owners manage the resulting membership separately.

## Database source prepared, not applied

supabase/migrations/202610200001_business_invitation_acceptance.sql adds three nullable invitation timestamps, the private immutable receipt table, an invitation-identity trigger, updated issuance with expiry, narrow owner revocation and verified-recipient acceptance RPCs. It adds no broad membership grants and changes no existing RLS policy or identity/last-owner trigger. All definers use an empty search_path and explicit object qualification; new RPC grants are authenticated-only. No migration was executed.

Frozen C01 SHA256 before/after:
731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C

New migration SHA256:
1F553E11F65B6015C7926E235B62258CA0738B12EAB33D7AA2DAD235E701E02C

## Application flow

/business/invitations/accept?invitation=<UUID> is authenticated but does not require an existing workspace membership. GET renders a confirmation and never activates. POST uses a Next server action and the normal user client; Next's server-action origin protection applies. The server validates the UUID/getUser/confirmed email, then calls only accept_business_invitation. Errors are mapped to fixed safe messages; raw database/provider errors are not exposed. Success verifies the returned user/ACTIVE status, selects the returned organization using the existing HttpOnly/SameSite cookie and redirects to dashboard.

Sign-in, existing-session middleware, immediate-session signup and auth callback preserve only an exact validated invitation intent before onboarding. Ordinary onboarding and tenant resolution remain unchanged. Recovery callbacks keep their password-reset priority. The link is constructed from the actual invitation UUID returned by the existing owner invitation API; no automatic email delivery or provisioning adapter was added. Native browser navigation/cookie behavior remains a future runtime check.

## Validation executed

- 110/110 targeted offline tests PASS: invitation suite plus Business application, C01 compatibility and public Supabase configuration regressions. Zero skipped.
- 33/33 existing offline harness tests PASS. Zero skipped. Dummy snapshots, controlled local children and loopback doubles only; no Next.js/Chromium E2E execution.
- TypeScript --noEmit --incremental false PASS after fixing an iterator compatibility diagnostic.
- Migration STATIC contract checks PASS: narrow RPC input/grants, trusted identity, expiry/revocation, tenant binding, role provenance, immutable receipt and transaction/retry ordering, no disabled protection or broad membership grants. These checks are not a PostgreSQL parser or execution proof.
- git diff --check PASS (line-ending warnings only).

Commands:
```text
node --import tsx --test tests/c01-invitation-acceptance.test.ts tests/c01-compatibility.test.ts tests/aibeat-business.test.ts tests/c01-supabase-config.test.ts
node --test tests/c01-e2e-harness.test.cjs tests/c01-runtime-containment.test.cjs tests/c01-restricted-harness.test.cjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
```

The concurrent/duplicate transactional tests are explicitly labeled offline reference-model tests, not execution of the migration. Recipient/error tests use mocked Supabase responses. Source assertions inspect the actual SQL authorization contract. None proves real locking, RLS, PostgreSQL syntax, privileges or trigger execution. Historical 72/72 and 8/8 results are preserved; they do not certify this new schema.

## Remaining gates and next authorization

1. Review new migration source and approve isolated disposable-database integration validation, with no staging/production access. Validate application of prerequisites/new SQL, catalog grants/RLS, actual recipient email security, race/idempotency/revoke/role-change outcomes, unique constraints, trigger compatibility, rollback/audit atomicity and retention/deletion behavior. No live PostgreSQL validation was available or authorized in this task.
2. Supply an approved independent external runtime; authorize dummy-only process/Chromium/network/termination verification. Existing independent-boundary blockers remain.
3. Separately approve staging project/key preflight, migration application, exact fixture identity and membership writes, backend effects review and bounded E2E. No one gate implies the others. Genuine expired-session fixtures and exact data definitions remain pending.

Fixture design is updated in c01-invitation-fixture-activation.md. Provisioning review now names the legitimate flow but its execution adapter still unconditionally refuses. The E2E acceptance placeholder now accurately says database validation pending; unsupported approval features remain visible skips. No E2E case was executed and no membership is provisioned.
