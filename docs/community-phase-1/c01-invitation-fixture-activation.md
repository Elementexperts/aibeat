# C01 fixture activation update — acceptance implementation prepared

This addendum supersedes only the missing-local-implementation finding in c01-stage3b2b-fixture-activation-design.md. Historical reports remain unchanged. New SQL is NOT APPLIED and database/runtime validation is pending. Provisioning and E2E remain BLOCKED.

Future, separately authorized fixture sequence:

1. Establish nine fresh synthetic preconfirmed identities through a separately reviewed setup process with email disabled. Setup credentials must never enter app/browser environments. No identity is created by the current acceptance implementation.
2. owner creates/completes primary organization and secondOwner creates/completes secondary organization via existing authenticated creator flows. Record actual IDs. recoverOwner creates a creator workspace only, leaving ordinary onboarding for the recovery scenario. newOwner and nonmember start without membership.
3. Primary OWNER calls invite_business_member for admin (ADMIN), manager (MANAGER), member (MEMBER) and suspended (MEMBER). Record each returned invitation UUID, trusted role and expiry. Reissue legacy/expired invitations instead of extending or editing them.
4. Each intended verified identity explicitly submits /business/invitations/accept?invitation=<actual UUID>, which calls accept_business_invitation under that recipient's normal session. A narrowly reviewed setup client may call the SAME authenticated RPC with the same normal identity, but cannot substitute target user/role/tenant inputs. Record actual new membership IDs returned; planned UUIDs are not authoritative.
5. Primary OWNER suspends the designated suspended membership through change_business_member. Acceptance retry must not reactivate it. Keep the ordinary MEMBER ACTIVE MEMBER in primary only.
6. secondOwner invites owner as MEMBER into secondary; owner accepts under its own verified identity. Record this secondary membership ID separately. Never join the primary MEMBER to secondary: foreign sentinel/storage denial tests require that separation. secondOwner remains sole secondary OWNER for last-owner testing.
7. newOwner creates its own organization during case 01; recoverOwner completes its existing workspace during case 02. The case 07 invitation-only address requires no tenth auth identity and remains unaccepted unless separately scoped.
8. Define and create exact workflow/document/storage/audit fixtures through approved application APIs only, under separately authorized writes. Record genuine immutable audit IDs and exact paths. Preserve prior Stage 1/2 records; no broad cleanup.

Activation must stop for wrong/unverified identity, expired/revoked invitation, original inviter no longer OWNER, conflicting/suspended membership, unexpected tenant/role or unvalidated SQL. Acceptance never uses direct SQL/service-role membership insertion. OWNER invitation support preserves existing owner grant semantics but is unnecessary for the proposed non-owner fixtures.

Receipt and retry semantics: retained INVITED row has invitation_accepted_at; new ACTIVE row has a distinct immutable identity. Receipt links them and survives original invitation removal. Repeated acceptance returns only the original still-ACTIVE membership and emits no second acceptance audit. Existing role changes are preserved. Removal/suspension requires owner intervention, never retry-based repair.

Ready: local application/RPC source and offline tests. NOT ready: actual database certification/application, independent runtime, staging credential preflight, identity provisioning, data definitions, genuine expired cookie and staging E2E. Existing provisioning adapter remains non-executable. A future acceptance E2E scenario still needs its own exact pending invitation fixture and approved scope; the placeholder is not a success assertion.
