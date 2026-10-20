# C01 isolated database verification

These tests are prepared, NOT executed. Never run against production or a copy that still has production integrations/credentials. A database name check is an additional accident guard, not proof that a target is safe.

## Environment gate

Use a disposable Supabase-compatible PostgreSQL database named exactly aibeat_c01_isolation, with synthetic data, auth.users, anon/authenticated roles, auth.uid(), storage schemas/bucket prerequisites, and the complete repository migration chain. Confirm host/project identity independently; use only nonproduction credentials. Do not reuse the repository's linked Supabase project or .env.local implicitly. No verified isolated target was available during implementation.

Apply the baseline migrations in order, then 202610140001_business_authorization_hardening.sql using an authorized migration owner. This migration contains BEGIN/COMMIT; do not wrap it in a runner that splits the transaction. Capture all failures and inspect resulting schema/grants. Historical data compatibility also needs a separately sanitized fixture, not production access.

## SQL assertions

With the verified nonproduction connection supplied explicitly through libpq environment/configuration, run:

    psql -X --set=ON_ERROR_STOP=1 --file=tests/rls/business-isolation.sql

The fixture transaction rolls back on successful completion. Stop on any error and discard the disposable database if its state is uncertain. Assertions intentionally switch to anon/authenticated roles and JWT subjects. The privileged connection is used only to set up synthetic fixtures and failure injection.

Coverage: anonymous and nonmember denial; forged metadata; organization creator; atomic and idempotent onboarding; owner/admin/manager/member boundaries; tenant references; last-owner demotion/suspension/removal; approval transaction rollback on audit failure and retry; immutable audit DML; storage read/write/path boundaries.

## Real concurrency

Use PostgreSQL's isolationtester from a matching PostgreSQL test-tools build (not psql) and feed business-ownership.spec on stdin with the explicit isolated connection string. For example, in a shell supporting input redirection:

    isolationtester "dbname=aibeat_c01_isolation host=<verified-isolated-host> user=<test-owner>" < tests/rls/business-ownership.spec

Do not put passwords into command history. Expected ordering: session B's demotion blocks until A commits; B then fails LAST_ACTIVE_OWNER; the final assertion finds exactly one active owner. Inspect the output, not only exit status: isolationtester can print expected SQL errors without a failing process status. The spec commits synthetic setup and deliberately leaves it until the whole disposable database is discarded. Repeat from a fresh database; do not disable append-only triggers to clean up.

This is a prepared manual isolation specification, not a passing automated concurrency CI gate. Capture reviewed expected output and add an environment-specific runner before relying on it in CI. Also validate repeated requests and serialization retries at the staging application boundary.

## Required staging checks before release approval

Verify Business sign-in, new and partial onboarding, active role behavior, invitation/role management, workflow run and approval/rejection/edit flows, and document storage with two organizations. Check existing legacy pending approvals fail closed and can be rejected/re-requested. Confirm database template seed parity. Confirm public directory, product submissions, newsletter, Gmail draft generation and paid placements still work without changing send/payment behavior. Do not send mail or charge payments as a test.

Offline TypeScript tests mock the RPC boundary and cannot establish database security. No SQL, concurrency, browser or production test pass is claimed by the offline results.

## Current hosted staging preparation

Baseline and C01 are now installed on isolated staging. For installed PostgreSQL 17.11 tools, secure credentials, fresh per-run copies, exact approval-gated execution commands and coverage gaps, use docs/community-phase-1/c01-security-test-preparation.md. Do not rerun migration setup. Runtime security fixtures remain unexecuted. The original database guard remains intentionally strict; the render-only prepare-c01-test-run.ps1 creates staging-specific copies.

## Guard correction (2026-10-15)

The Session Pooler does not forward the custom startup marker. Do not use old generated copies or PGOPTIONS-marker instructions. Use docs/community-phase-1/c01-staging-guard-correction.md and the new check-c01-connection.ps1 / invoke-c01-tests.ps1 wrappers. They validate the exact staging connection tuple and independently enrolled PostgreSQL cluster identity. Security fixture execution still requires explicit approval.

## Stage 2 runner remediation

See docs/community-phase-1/c01-stage2-remediation.md. Pooler protocol PIDs differ from real PostgreSQL PIDs, so legacy isolationtester automatic wait detection is not suitable for this connection. New local plans use the SQL-PID three-session runner, with an explicit scenario argument and separate execution approval. All eight new plans remain UNEXECUTED. No residual data has been deleted.
