# C01 security test preparation

Status: PREPARED, NOT EXECUTED. No fixture execution, migrations, deployment, email, payments, production access or C02 work in this task.

## Tools

Windows 10 build 19045; Winget 1.29.380, Chocolatey 2.7.1, Node 22.23.2, Python available at C:/Python314/python.exe. Docker and preexisting PostgreSQL tools were not on PATH.

Portable official EDB PostgreSQL Windows archive installed under %LOCALAPPDATA%/AIBeat/C01/tools/postgresql-17.11/pgsql. No database server was started, no service registered and no global PATH changed. Both psql --version and isolationtester -V report 17.11, matching staging server 17.11. The archive includes server/pgAdmin files but they are not used.

Source: https://www.enterprisedb.com/download-postgresql-binaries (Windows 17.11 link https://sbp.enterprisedb.com/getfile.jsp?fileid=1260616).
Archive SHA-256: 80379B2C04D51C30225532E0AE04509899141E9957ED096FE749D7FD9DF8F82F. This is a locally recorded fingerprint, not an independently published checksum verification. psql executable Authenticode status is NotSigned. Downloads used the official HTTPS source.

isolationtester is present at lib/pgxs/src/test/isolation/isolationtester.exe. An initial --help probe returned a parser error; upstream documents -V for version, which succeeded. No fixture was supplied or database connected by these tool probes. No alternative runner is needed. If this binary cannot operate through the session pooler, the proposed fallback is three independent psycopg/libpq connections (two actors plus observer), asserting pg_blocking_pids(B) contains A before committing A, then requiring B's LAST_ACTIVE_OWNER/23514 error and one remaining owner. A timing-only sleep or sequential RPC calls would not be an acceptable substitute.

## Staging and credentials

Pinned reference: oejxwsvlvelxmfbysjbx; project aibeat-business-staging.
Host: aws-0-us-west-1.pooler.supabase.com; port 5432 (SESSION pooling).
Database: postgres; user: postgres.oejxwsvlvelxmfbysjbx; SSL required.
Separate CLI workspace: %TEMP%/aibeat-c01-validation-oejxwsvlvelxmfbysjbx.

Saved project-ref and project-specific pooler username/host/port were rechecked. Read-only CLI metadata confirms server 17.11, ten migration versions, zero users, organizations and storage objects. Repository production link was untouched and unused. Direct psql credential connectivity has NOT been tested.

configure-c01-credential.ps1 prompts with Read-Host -AsSecureString, creates a current-user-only Windows ACL directory, and writes one exact-host/user/database password entry under %LOCALAPPDATA%/AIBeat/C01/credentials/staging.pgpass. It prints no password and connects nowhere. The file is plaintext as required by libpq, protected by its directory ACL; never commit, upload or log it. It has NOT been created/populated in this task. Supply only the staging database password interactively, never in chat. No API/service keys or production env files are needed.

use-c01-staging.ps1 clears inherited PG* environment routing, including PGHOSTADDR, PGSERVICE and PGPASSWORD, then pins staging settings and PGPASSFILE. Use a dedicated shell so clearing those settings does not affect other work. SSL require encrypts; it does not by itself establish certificate hostname verification. A future verify-full setup needs the appropriate trusted CA configuration. The session marker is an accident guard, not independent identity proof.

## Preparation changes

- configure-c01-credential.ps1: protected staging credential setup (not executed).
- use-c01-staging.ps1: pinned process-local connection configuration (no connection itself).
- prepare-c01-test-run.ps1: render-only local run directory; replaces database guard with postgres PLUS exact project marker, creates fresh UUIDs/emails for each concurrency run, saves the ID map. No migrations copied or run.
- business-ownership.spec: replaced JSON literals with jsonb_build_object because the upstream scanner ends SQL blocks at a closing brace, even within a SQL string. No test semantics changed.
- Generated SQL scopes the approval-audit count to its synthetic tenant so earlier race audits cannot affect repeat assertions. Original rollback-only SQL remains unchanged.

PowerShell preparation scripts parse successfully. Local render ran successfully. These are preparation checks only. Latest generated run directory:
%LOCALAPPDATA%/AIBeat/C01/runs/e9f88b52-d94d-4513-9a61-57335de5c3f0.
Do not use the earlier generated run; it predates the spec parser correction.

## Exact execution sequence — wait for approval

Run from the repository in a dedicated PowerShell session. Steps below have NOT been executed against the database. Do not run baseline reconstruction/preparation scripts again: migrations are already applied.

```powershell
# Interactive local secret setup; no database operation.
& ./tests/rls/configure-c01-credential.ps1
. ./tests/rls/use-c01-staging.ps1
$c01Run = & ./tests/rls/prepare-c01-test-run.ps1

# First verify the direct client connection with read-only SQL.
& $c01Psql -X -w -v ON_ERROR_STOP=1 -c "BEGIN READ ONLY; SELECT current_database(), current_setting('server_version'), current_setting('c01.staging_project',true), to_regprocedure('pg_catalog.pg_isolation_test_session_is_blocked(integer,integer[])'); SELECT version FROM supabase_migrations.schema_migrations ORDER BY version; COMMIT;"
if ($LASTEXITCODE -ne 0) { throw 'Connection preflight failed; STOP' }
# Inspect: postgres, 17.11, exact staging marker, lock observer function present,
# ten expected versions including 202610140001. Stop on mismatch.
# Also inspect prior-run IDs using concurrency-id-map.json before repeat testing.

# Only AFTER approval for security fixtures:
& $c01Psql -X -w -v ON_ERROR_STOP=1 -f (Join-Path $c01Run 'business-isolation.sql') 2>&1 | Tee-Object (Join-Path $c01Run 'isolation.log')
if ($LASTEXITCODE -ne 0) { throw 'SQL assertions failed; STOP without retries or cleanup' }

$env:PG_TEST_TIMEOUT_DEFAULT='30'
Get-Content (Join-Path $c01Run 'business-ownership.spec') -Raw | & $c01Isolation 'dbname=postgres' 2>&1 | Tee-Object (Join-Path $c01Run 'ownership.log')
if ($LASTEXITCODE -ne 0) { throw 'Concurrency runner failed; STOP' }
# Exit zero is insufficient: inspect expected wait, 23514/LAST_ACTIVE_OWNER,
# and successful final owner-count assertion. Reject other errors/timeouts.
```

Retain run ID map, generated files, checksums, output and exit codes. Never include credentials in logs. After failures, inspect only; do not automatically retry, modify migrations or disable protection triggers.

## Coverage and expected outcomes

| Area | Prepared assertions | Expected / failure condition |
| --- | --- | --- |
| Anonymous | Membership helper, provisioning and approval RPC | No membership; 42501 on mutation |
| Community-only | Authenticated nonmember with forged owner metadata | No tenant rows; cannot invite/join existing org |
| Cross-tenant | Role mutation, workflow reference, approval read/decision | Deny mutation/read; foreign FK reference 23503 |
| Roles | Member/manager/admin cannot promote; owner invite/change; manager approval | Correct role succeeds; others 42501 |
| Last owner | Demotion, suspension, removal | 23514; active owner preserved |
| Audit | UPDATE/DELETE/TRUNCATE denied; privileged UPDATE trigger denial | 42501; no altered history |
| Approval rollback | Inject final audit failure; inspect approval/run/steps; retry success | All partial work rolled back; one audit and continuation |
| Concurrency | Two distinct sessions demote their own ownership | B waits for A, then LAST_ACTIVE_OWNER; exactly one owner |
| Onboarding | Creator ownership, marker/context/template idempotence; injected seed failure | One coherent setup; no partial org/owner after error |
| Storage | Member read, admin insert, nonmember/foreign/malformed path denial | Intended same-org access only |

Comprehensive validation still needs additional cases beyond this initial suite: populated sentinels for every tenant table (empty-table zero counts alone cannot prove isolation), suspended-user full matrix, anonymous reads across populated tables, all role-specific CRUD paths, approval EDITED/REJECTED, snapshot mismatch/legacy requests, revocation races, repeated concurrent permutations including higher isolation, and application-level auth/storage checks. Community-only means an auth account without Business membership; no community schema or registration is enabled. A passing initial suite must not be reported as complete coverage of these gaps.

## Safety, repeatability and cleanup

All identities use fixed synthetic UUIDs or generated run UUIDs and example.invalid emails. Users are inserted directly in SQL; no signup email is sent. Current connector approval continuation is simulated only.

The ordinary SQL suite runs within BEGIN/ROLLBACK, including injected trigger creation/removal. Expected-denial DELETE/TRUNCATE statements intentionally test controls; if they unexpectedly succeed, expect_error throws and psql stops, causing transaction rollback on disconnect. They are not cleanup commands. Run only on isolated staging without parallel application traffic. Validate no stale synthetic IDs or injection triggers before any retry; stop if found.

The concurrency fixture commits setup and A's demotion. It intentionally leaves two synthetic users, one organization, memberships and an audit event. Each newly rendered run uses fresh IDs/emails, so it can be repeated without deleting history. Never rerun an already-used generated spec. Audit immutability/last-owner protections must not be disabled to clean up. Deleting or resetting staging would require separate explicit approval; it is not part of this plan.

An interrupted ordinary transaction is rolled back when its connection closes. An interrupted concurrency run can leave committed setup or an open actor transaction until connection termination. Record the run ID and inspect session state before proceeding. Do not terminate unrelated sessions.

## Recommendation

Tools and local preparation are ready for a first controlled staging run after explicit fixture approval and secure provisioning of the staging password. Direct psql authentication, session marker forwarding and lock-observer permissions remain unverified. Stop on any failure. No runtime security test has passed yet.

References: official PostgreSQL 17 password-file documentation https://www.postgresql.org/docs/17/libpq-pgpass.html and isolationtester/scanner source https://github.com/postgres/postgres/tree/REL_17_STABLE/src/test/isolation.
