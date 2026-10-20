# C01 staging identity guard correction — 2026-10-15

## Result

Guard corrected and verified with read-only psql and isolationtester connections. No security fixtures, migrations, application deployment or production access occurred.

## Root cause

The previous renderer required current_setting('c01.staging_project',true), supplied through PGOPTIONS at connection startup. Through this Session Pooler, authentication succeeded but the custom setting was absent. This confirms startup-option forwarding is unavailable for this setting on this path; it does not establish that every PostgreSQL option is discarded. A caller-defined marker was also not independent identity evidence, even if forwarded. Removed that dependency rather than setting a self-asserted marker after connecting.

## Identity method

Pinned project: oejxwsvlvelxmfbysjbx. Exact connection tuple: aws-0-us-west-1.pooler.supabase.com:5432 / postgres / postgres.oejxwsvlvelxmfbysjbx.

Independent anchor: PostgreSQL pg_catalog.pg_control_system().system_identifier = 7692131729119822239, obtained via the separately authenticated, explicitly staging-linked Supabase CLI. This CLI path uses its account-managed login rather than the supplied password file. The project-ref and pooler identity were checked before querying. The observed cluster_name was merely main, so it is not used as identity.

Configuration checks require every tuple field and project reference, exact single-entry password-file scope (no wildcard/multiple entries), and matching cached staging workspace metadata including database path. Known production routing is rejected before inherited libpq variables are cleared. Password values are never logged. A password's provenance cannot be determined from its opaque bytes; production-scoped credential entries are rejected, and a wrong password or different database identity aborts before fixtures.

Read-only preflight checks the actual server database and system identifier. Generated SQL fixtures check them again in the same connection before any insert. The concurrency specification checks the control connection before setup and each actor connection before its first mutation/role switch. Missing permissions for pg_control_system(), null/unknown/different identity or failed authentication all abort. No fallback to hostname-only checks exists.

use-c01-staging.ps1 prepares configuration but is not itself proof of server identity. Use check-c01-connection.ps1 for preflight and invoke-c01-tests.ps1 for future approved execution. The latter verifies identity, renders fresh guarded copies and then invokes the selected runner. Its approval switch is an explicit local execution safeguard, not a substitute for human authorization.

## Validation

- 21 local mocked tests passed: valid configuration, each missing/wrong tuple field/project, missing credential, multiple entries, wildcard scope, production-scoped entry, valid server identity and null/missing/wrong/ambiguous database identity.
- Read-only psql preflight and in-connection SQL guard passed.
- Read-only isolationtester probe passed for control plus two actor sessions; each actor selected postgres under a read-only transaction. It contained no fixture inserts, schema writes or security test assertions.
- Initial direct login failed; refreshing the protected password file from the already authorized staging-only source restored access. No password printed.
- Initial read-only isolationtester probe had an unsupported per-session teardown declaration; parser failed before connection. Corrected only that temporary probe syntax; subsequent probe passed. No fixture failure/retry occurred.

Existing SQL/RLS assertions were preserved. Renderer still maps fresh synthetic concurrency IDs and scopes the audit count as previously documented. Old generated marker-dependent copies must not be reused.

## Exact changed files in this guard correction

- tests/rls/c01-staging-guard.ps1 (new shared validators and SQL guard)
- tests/rls/check-c01-connection.ps1 (new read-only check)
- tests/rls/invoke-c01-tests.ps1 (new approval-gated future runner)
- tests/rls/test-c01-guard.ps1 (new offline mocked tests)
- tests/rls/use-c01-staging.ps1 (full tuple/credential validation; no marker)
- tests/rls/prepare-c01-test-run.ps1 (server identity in control and actor guards)
- tests/rls/README.md
- docs/community-phase-1/c01-staging-guard-correction.md

## Commands

Read-only, already verified:

    powershell.exe -NoProfile -File tests/rls/check-c01-connection.ps1

Offline self-tests:

    powershell.exe -NoProfile -File tests/rls/test-c01-guard.ps1

Only AFTER explicit approval for fixtures (NOT executed):

    powershell.exe -NoProfile -File tests/rls/invoke-c01-tests.ps1 -Suite sql -ApprovedFixtureExecution
    powershell.exe -NoProfile -File tests/rls/invoke-c01-tests.ps1 -Suite concurrency -ApprovedFixtureExecution

Stop after the first test failure. Concurrency exit zero still requires inspecting expected blocking, LAST_ACTIVE_OWNER and the final owner assertion. No automatic cleanup, migration, repair or retry.

## Limits and readiness

Ready for separately approved fixture execution; no runtime security test pass is claimed. Existing coverage gaps from c01-security-test-preparation.md remain. PostgreSQL cluster system IDs identify a database cluster, not an unforgeable cloud project: physical clones can share one, and a privileged operator can alter server infrastructure or local trusted scripts. Combined account-linked enrollment, project-specific routing, credential scope and in-connection server checks protect against accidental wrong-project use under the current trusted-admin model. SSL require encrypts but does not provide verify-full hostname validation. Pooler routing/restore or staging recreation changes require fresh independent identity enrollment, never automatic anchor replacement.

Older docs describing PGOPTIONS markers or direct unguarded runner invocations are superseded by this document. Repository production CLI configuration remains unchanged. No C02 work.
