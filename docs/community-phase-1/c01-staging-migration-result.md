# C01 staging migration result

Target: aibeat-business-staging / oejxwsvlvelxmfbysjbx.
Branch: codex/c01-business-authorization-hardening.
Migration: 202610140001_business_authorization_hardening.sql.
SHA-256: 731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C.

## Execution

SUCCESS, CLI exit 0. Applied once, without edits or retries. History now contains the nine baseline versions plus 202610140001. No SQL errors. Repeated CREATE UNIQUE INDEX IF NOT EXISTS notices occurred because multiple foreign keys share the same parent unique index; these are expected and all 26 new constraints are validated.

Before execution, verified the separate staging workspace project-ref and project-specific pooler user/host, exact nine-version baseline history, unchanged baseline SHA-256 checksums, empty users/organizations/storage objects and matching replacement-function signatures/core tables/audit FK. Saved pre-migration schema/policies/functions/grants/constraints in c01-pre-migration.json. Dry-run listed only C01. No table/schema drops or immediate customer data deletion were found. Intended policy replacements, grant revocations and audit-FK replacement were reviewed.

Used only TEMP/aibeat-c01-validation-oejxwsvlvelxmfbysjbx with staging CLI-managed authentication. No repository environment credentials or production CLI target were used. Production configuration and baseline files were unchanged.

## Read-only postflight

See c01-post-migration.json and c01-catalog-checks.json. Execution output is c01-staging-execution.log.

- 78 public/storage policies total, including 28 restrictive policies.
- Unsafe first-owner insert policy removed; membership retains only permissive SELECT with restrictive tenant checks. Membership mutation RPCs exist; creator/last-active-owner checks are present in the enabled invariant trigger.
- Audit table has no permissive write policy; UPDATE/DELETE and TRUNCATE protection triggers are enabled. Organization FK now restricts audit-erasing deletion.
- Approval request INSERT remains scoped to active owners/admins and pending self-attributed requests. Direct authenticated approval UPDATE/DELETE grants are absent. Snapshot trigger and atomic decision RPC exist.
- Tenant identity triggers, restrictive table/storage policies and 26 validated C01 constraints installed.
- Relevant new/updated callable functions have fixed search paths. Authenticated can execute intended RPCs; anonymous cannot execute those mutation RPCs. Internal helpers are not executable by anon/authenticated. Existing service_role grants remain a privileged trust boundary.
- Anonymous SELECT table grants remain, but no applicable permissive anonymous policy grants Business rows, and restrictive tenant policies apply. This distinction must be verified with real-role tests.
- Users, organizations and storage objects remain zero.

## Compatibility and limitations

No unexpected schema change identified in the inspected authorization surfaces. Successful DDL and catalog assertions do NOT prove runtime authorization, transaction atomicity or concurrency behavior. PL/pgSQL runtime paths still require execution tests.

Existing application raw-write callers are incompatible with revoked mutation grants; coordinated application changes are required for a later approved deployment. No application was deployed now. Pending approvals without snapshots fail closed for approval/edit and require rejection/re-request; staging currently has no organizations or requests. Database owners can alter triggers; service-role access remains privileged. Routine record mutations, simulated workflow continuation and onboarding seed compatibility remain untested in this database.

## Remaining tests and prerequisites

Recommend proceeding to separately authorized staging tests, not production deployment:

1. Anonymous and community-only denial; creator provisioning; cross-tenant access and reference denial.
2. Owner/admin/manager/member behavior, membership mutation restrictions, last-owner remove/demote/suspend.
3. Real two-session ownership races, blocking and serialization/retry behavior.
4. Audit append-only enforcement, approval success/edit/rejection/retry and injected-failure rollback.
5. Atomic onboarding success/idempotency/rollback and storage role/path boundaries.
6. Staging Business authentication/workflow compatibility and offline public/submission/newsletter/Gmail/paid-placement regression evidence, without email, payments or external effects.

Prepared SQL and concurrency fixtures remain unexecuted. Required tools: psql and PostgreSQL 17 isolationtester (or a separately reviewed true multi-session equivalent). These were previously unavailable; no tools were installed during this migration task. Direct tests need staging-only Postgres credentials via a protected password file and the verified session pooler; CLI account authentication already works. No production credentials are needed. Later application tests require isolated staging URL/keys.

Stopped after migration and read-only inspection. No fixture writes, deployment, production access, C02, commit or push performed.
