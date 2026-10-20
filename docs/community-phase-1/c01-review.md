# C01 Business authorization hardening — review record

Date: 2026-10-14. Branch: codex/c01-business-authorization-hardening.

## Status and scope

Source implementation and offline verification are complete. Database migration, RLS, concurrency and staging end-to-end verification are NOT executed. This is a proposed migration for development/isolated staging, not a production-ready release approval. No production database, deployment, data, email sending, paid placement, public community write or C02 changes were performed. No commit or push was performed.

## Baseline

Phase 0 audited commit: aff021876a64ada007f4dbab2639a452c5ea68fd.
Implementation branch baseline: 38e1d208240045c80e1f2b2b44e28cdc9d36c0ec (fetched origin/main and fast-forwarded the implementation branch).
The nine intervening commits concern outreach checkpoints and news content; relevant Business source, migrations and tests did not change. All documents in docs/community-phase-0/ were reviewed. That directory was already untracked and is not a C01 modification.

Repository schema is evidence of intended state only. No claim is made about deployed schema, grants, policies, migration history, authentication settings or data consistency.

## Exact C01 files

- supabase/migrations/202610140001_business_authorization_hardening.sql
- app/business/actions.ts
- app/business/onboarding/actions.ts
- lib/business/security.ts
- lib/business/supabase-store.ts
- tests/aibeat-business.test.ts
- tests/rls/business-isolation.sql
- tests/rls/business-ownership.spec
- tests/rls/README.md
- docs/community-phase-1/c01-review.md

## Vulnerabilities addressed and migration design

1. Removes unsafe first-owner policies, including permissive legacy policies on sensitive tables. First membership must match immutable organizations.created_by and be an active owner. Existing memberless organizations cannot be adopted through provisioning.
2. Narrow security-definer RPCs derive the actor from auth.uid(), use fixed search paths, validate inputs and reauthorize database membership. Raw authenticated membership mutations and sensitive column grants are revoked. Owner-only invitations, role/status changes and removals cannot accept a caller-supplied actor. Role changes clear custom permissions.
3. Organization creation locks the authenticated user and creates the organization, first owner and audit in one transaction. Onboarding adds seeded workflows, context and a completion marker atomically and idempotently. Provisioning explicitly requires READ COMMITTED isolation.
4. Membership mutations serialize on the organization row. Triggers protect the last active owner, including direct privileged DML, and reject changes to membership identity. A stale higher-isolation snapshot must abort rather than violate the invariant.
5. Audit writes use narrowly scoped RPCs or occur inside security transitions. UPDATE, DELETE and TRUNCATE are rejected by triggers; organization deletion cannot cascade away audit history. Runtime telemetry is allowlisted and actor-attributed, but its text is still administrator-supplied, not independently verified evidence.
6. Approval decisions, step/run changes, simulated continuation and audit records commit or roll back together. Approval creation captures a database workflow snapshot; approver role, tenant, run, step and current state are checked. Retries of an identical completed decision are idempotent. Current connectors remain pilot simulations; no external sending is introduced.
7. Immutable tenant identities, validated composite foreign keys, same-run constraints and subscription tool checks close cross-tenant reference paths. Restrictive tenant policies constrain additional permissive policies. Storage requires a valid organization path and retains member read / owner-admin write authorization.

The migration is transactional and fails on inconsistent historical references or active ownerless tenants; it does not silently repair records. Validation/index construction takes locks and can exceed the configured timeouts on large databases. Apply only after isolated schema/data preflight.

## Role and behavior compatibility

Active members retain tenant reads and document storage reads. Owners administer memberships. Owners/admins retain persisted Business writes, document uploads and integration/evaluation operations. Owners/admins/managers can decide approvals subject to the workflow's approver role list. Anonymous users and authenticated accounts without Business membership receive no tenant access. Self-service creation remains possible for an authenticated user without an active membership, solely for their own new organization; no community role grants existing tenant access.

The in-memory permission model previously advertised workflow running for members/managers while persisted workflow-write RLS required owner/admin. The server action now enforces the existing persisted role requirement before writes. This preexisting product/RLS mismatch needs an explicit product decision; this change does not widen database writes to resolve it.

Onboarding uses ACTIVE database workflow_templates, not a browser-supplied workflow definition. Verify seed parity and the selected workflow name in staging. Existing creator-owner partial onboarding can resume; already completed onboarding is idempotent. Existing organizations are not automatically backfilled with a completion marker.

Public directory, submissions, newsletter, Gmail drafts and paid placement source were not modified. Existing Business authentication/session establishment and ordinary workflow execution remain in place. Offline regression evidence does not establish deployed end-to-end compatibility.

## Verification results

- Offline regression suite: 153 passed, 0 failed. Includes Business, submitted tools, submission automation, public form email, newsletter request/unsubscribe/contacts, Gmail scheduled drafts, tool SEO and Stripe listing packages.
- Final Business-only rerun after the last edits: 64 passed, 0 failed, with the same offline guard.
- TypeScript: npx tsc --noEmit --incremental false passed.
- Next lint: passed with one preexisting next/no-img-element warning at components/ui/ToolLogo.tsx:29.
- git diff --check: passed (line-ending conversion notices only).
- Test process blocked network socket connections/fetch and removed service credential environment variables; no production calls were made.
- Prepared SQL assertions cover anonymous/nonmember/forged metadata denial, creator invariants, onboarding success/idempotency/failure rollback, roles, cross-tenant references, owner preservation, approval rollback and retry, audit immutability, and storage boundaries.
- Prepared two-session isolationtester specification covers concurrent owner demotion and preservation of the final owner.
- SQL migration, SQL assertions, concurrency spec and live UI/auth/storage/workflow checks: NOT RUN. psql and Docker were unavailable, no Supabase local config exists, and no isolated target credentials were verified. The installed Supabase CLI was not used against its linked project.

SQL review corrected dollar-quote delimiter defects before delivery. Static review and mocked RPC tests cannot validate PostgreSQL execution, grants, lock behavior or schema compatibility. See tests/rls/README.md for the required isolated validation gate.

## Remaining risks and production compatibility

- Actual deployed schema/policies/grants/function ownership and data are unknown. Migration assumes the repository's complete prior migration chain, Supabase auth/storage schemas and expected constraint names.
- Existing pending approvals have no trustworthy snapshot. Approve/edit fails closed; rejection remains available. Reject and rerun under the new code to create a fresh request, subject to Nomoz's rollout decision.
- Application and database changes require a coordinated release: old callers use raw writes that the migration revokes; new callers require new RPCs. Do not independently deploy either half to production.
- SQL continuation mirrors existing simulated connector behavior. Future real connector execution requires an independently designed transactional outbox/idempotency boundary; a SQL transaction cannot roll back external effects.
- Tenant FK coverage applies to modeled relational keys, not every semantic identifier embedded in text/JSON or arrays (including related_tool_ids). These need separate validation if used as authorization inputs.
- Privileged database owners can alter/disable triggers. Service-role bypass remains a privileged trust boundary; protect credentials and audit operational access. Runtime audit telemetry is not a tamper-proof external ledger.
- Active owner protection intentionally blocks deletion of the last owner and audit-bearing organizations. Account erasure/retention and administrator recovery need a separately approved operational procedure.
- Invitation acceptance is not added. Existing invitation records remain invitations; no community enrollment capability is enabled.
- SQL concurrency and staging behavior are unverified. Do not label C01 deployment-ready until those gates pass.

## Rollback procedure

Before applying anywhere, capture a schema/grant/policy export and backup from that explicitly approved environment. If migration execution fails, its transaction rolls back all DDL/data changes; investigate the failure before retrying. For an isolated disposable database, discard and rebuild from the baseline migrations to repeat testing.

After a successful commit, prefer a reviewed forward fix while retaining authorization protections. Do not restore the unsafe first-owner policy or remove audit/last-owner guards as an automatic down migration. Do not roll the application back to raw-write callers against the hardened database. Any production restore, schema reversal, trigger disabling or data reconciliation requires a separate approved plan and backup verification; none is included or executed here.

## Items requiring Nomoz's approval or decision

1. Identify/authorize the specific isolated staging database and credentials before executing the prepared database tests; development implementation itself is already authorized.
2. Decide whether member/manager workflow execution should eventually be supported by narrow database operations, or the existing persisted owner/admin requirement is the intended product rule.
3. Approve treatment of preexisting pending approvals (reject/re-request) and any historical ownerless or inconsistent tenant data remediation after preflight findings.
4. Approve a coordinated production change window, verified production schema/grant/backup preflight, production migration and application deployment separately. No such operation is currently authorized or attempted.
5. Approve any production recovery/rollback, retention or privileged repair operation separately.

C02 remains out of scope. No production approval is requested by running these local source changes.
