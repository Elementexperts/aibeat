# C01 Stage 2 concurrency remediation — 2026-10-15

Status: PREPARED ONLY. No database fixtures/retries, migrations, policy changes, trigger disabling, record deletion, application deployment, production access or C02 work.

## Confirmed timeout cause

Original run: A PID 125454 held its organization-row transaction lock after successful self-demotion and waited for the runner to send COMMIT. B PID 125455 executed change_business_member for its own membership and waited on transactionid owned by A. Control PID 125447 remained idle. This is expected serialization, not an observed cyclic database deadlock.

business_lock_owner first updates organizations.updated_at, taking the organization row lock. Only then does change_business_member select/update the membership. B waits at that first organization UPDATE, before it can re-evaluate ownership or reach the membership trigger's LAST_ACTIVE_OWNER rejection. The membership trigger repeats the organization lock and checks another active owner. RPC callers therefore serialize consistently for this race.

The original permutation is logically valid: A begins/demotes; B begins/attempts demotion and blocks; runner advances to A commit; B resumes and rejects; B rolls back; owner count is asserted. The harness failed at detecting the block, not at the logical placement of A COMMIT.

PostgreSQL 17 isolationtester obtains actor PIDs with libpq PQbackendPID and passes them to pg_isolation_test_session_is_blocked. Through this staging Session Pooler, those protocol PIDs differ from real PostgreSQL backend PIDs. A read-only libpq probe confirmed protocol PID 2138955952 versus SQL pg_backend_pid() 127635 on the SAME authenticated staging connection (another probe also mismatched). The pooler protocol PID is not a valid identifier for pg_stat_activity/lock observation.

Consequently the runner did not recognize B's wait, did not advance A COMMIT, and eventually canceled B. PG_TEST_TIMEOUT_DEFAULT=30 produces the observed 60-second isolationtester maximum (upstream multiplies it by two). After cancellation it advanced COMMIT/ROLLBACK; the final owner assertion passed, but LAST_ACTIVE_OWNER could not be reached because B had already been canceled. Exit code zero was not a passing scenario.

Evidence: c01-stage2-pid-probe.json; existing c01-stage2-session-observation.log and c01-stage2-runtime.log.
Upstream source: https://github.com/postgres/postgres/blob/REL_17_STABLE/src/test/isolation/isolationtester.c (PQbackendPID and blocker-query construction).

No cycle was observed. The organization-first ordering in these membership/approval RPCs makes this specific race a wait rather than a deadlock. This is NOT proof of global deadlock freedom: privileged direct writes, multi-organization transactions, workflow row updates and other lock orders require separate coverage. Provisioning locks auth.users before creating/locking its organization; its same-user race is covered by a newly prepared plan.

## Runner correction

Prepared a three-connection Python/libpq coordinator using the installed PostgreSQL 17.11 libpq DLL (no application dependency changes). All connections independently verify database postgres and cluster 7692131729119822239. Exact staging tuple and protected credential scope are required; ambiguous inherited routing/secrets are rejected.

Actor PIDs come from SQL inside their transactions, never the pooler's protocol metadata. B runs on a genuinely separate connection/thread. Observer must see pg_blocking_pids(B) include A and wait_event_type=Lock before releasing A. Early B completion, wrong blocker, absent lock or identity mismatch fails closed. Distinct actor PIDs are required. After release, expected SQLSTATE AND primary error are checked exactly; invariants must return true. Unexpected errors/timeouts stop without retry.

Timeouts were not increased: explicit SQL SET applies statement_timeout=15s, lock_timeout=10s and idle_in_transaction_session_timeout=30s to each connection; startup PGOPTIONS is not relied upon. Lock observation has a five-second deadline. Reports save generated SQL/IDs, observed blockers, transaction outcomes and invariants. Failures also write results. Cleanup rolls back only this runner's own open transactions and closes its connections; it never deletes committed evidence or disables protections.

Legacy isolationtester remains installed and the old spec is retained as historical evidence. invoke-c01-tests.ps1 now requires an explicit scenario for concurrency and routes it to the SQL-PID coordinator; no automatic legacy fallback.

## Prepared executable scenarios (all UNEXECUTED)

| Name | Synchronization and expected outcome |
| --- | --- |
| removal | Two owners remove themselves; B blocks; A commits; B rejects 23514/LAST_ACTIVE_OWNER; one active owner remains. |
| demotion | Two owners demote themselves; same serialization and last-owner rejection; A MEMBER, B OWNER. |
| suspension | Two owners suspend themselves; same serialization and last-active-owner rejection; B stays ACTIVE. |
| role_conflict | Two owners change one target MEMBER to ADMIN then MANAGER; B blocks and applies after A commit; final MANAGER and two audit records. |
| approval_conflict | A approves, B rejects same request; B blocks; A commits; B rejects 23514/APPROVAL_ALREADY_RESOLVED; one successful decision/audit and completed run. |
| approval_rollback | A completes approval in its uncommitted transaction; B waits; deliberate division-by-zero aborts A; A rollback; B approves/commits. Observer checks old pending/run/no-audit state while B is uncommitted, then verifies one B decision and no A audit. This tests outer transaction rollback under contention, not a new final-audit trigger injection (Stage 1 covered injection). |
| provisioning | Same user invokes create_business_organization twice; B blocks on auth user; A commits; B returns same UUID; one org/owner. |
| onboarding | Same-user overlapping complete_business_onboarding; same UUID; one creator owner, completed marker, one context, unique full active-template set and one onboarding audit. |

All plans use generated UUIDs and example.invalid emails; no signup/email or external connector effects. Setup is transactional and committed per scenario for visibility to both actors. Each run uses fresh IDs and a new output directory. Re-running a scenario creates additional retained synthetic data; it does not erase prior evidence.

## Local validation

- Python compile checks passed for all five modules.
- PowerShell wrapper parser check passed.
- 13 local unittest tests passed, including mocked coordination for all eight scenarios, exact expected error contracts, identity/config rejection, missing/wrong blocking detection, transaction release ordering, unique synthetic IDs and no destructive cleanup.
- 104 generated SQL statements parsed successfully using pglast 8.6. Its bundled PostgreSQL parser is 18.6; this checks grammar for the used common SQL syntax, NOT PostgreSQL 17 runtime typing/function existence or permission behavior. Installed runtime libpq remains 17.11. No staging PREPARE/fixture statements were executed to claim otherwise.
- Read-only SQL/protocol PID comparison and scoped residual inspection completed. Mock passes are not runtime security passes.

## Residual data and cleanup proposal — approval required

Read-only inspection confirms organization 152ef3a6-7d0a-464b-85d1-1e3faf1da966; creator/user A 754cb461-0b96-45b1-8ce4-82382cad7d04; user B 9f39be30-5c6f-439a-bb24-8b25c46f19f7. Membership A 0d4fbfae-81d3-490b-8afd-ff08495f7551 is MEMBER; B fa56ee17-b38f-4aac-a423-db414ac16bca is ACTIVE OWNER. Audit 74a4d896-7691-4749-a902-1e70960f57fb records MEMBER_ROLE_UPDATED by A. Two synthetic users, one org, two memberships, one audit remain; no records changed.

A safe full row-deletion plan is unavailable under current immutable-audit and final-owner protections. The audit actor/user foreign-key action can also attempt an immutable audit update during user deletion. Do not add a replacement owner merely to circumvent the guard, disable triggers, drop constraints, delete audits or reset the existing project.

Proposed default: retain this exact ID set as labeled evidence in the manifest; exclude it from new run checks by fresh IDs. If complete disposability is required, request separate approval to create a dedicated ephemeral staging project, independently enroll its identity, install the reviewed migrations there under separate migration approval, and approve eventual whole-environment disposal after exporting results. No such operations are performed or implied by this task. Any partial removal proposal must enumerate exact IDs and account for audit FK effects before separate approval; none is executed now.

## Exact files changed in this remediation

- tests/rls/invoke-c01-tests.ps1
- tests/rls/concurrency/.gitignore
- tests/rls/concurrency/libpq_client.py
- tests/rls/concurrency/probe_identity.py
- tests/rls/concurrency/scenarios.py
- tests/rls/concurrency/runner.py
- tests/rls/concurrency/test_local.py
- tests/rls/README.md
- docs/community-phase-1/c01-stage2-pid-probe.json
- docs/community-phase-1/c01-stage2-residual-inspection.log
- docs/community-phase-1/c01-stage2-remediation.md

## Controlled rerun recommendation

Recommend a separately approved demotion-only rerun first, after reviewing this runner and retention plan. Example command ONLY AFTER approval:

    powershell.exe -NoProfile -File tests/rls/invoke-c01-tests.ps1 -Suite concurrency -Scenario demotion -ApprovedFixtureExecution

Require verified blocker evidence, A COMMIT, B 23514/LAST_ACTIVE_OWNER rollback, and one active owner. Stop on any deviation; do not retry silently. Only after that passes and the seven additional scenarios are explicitly approved, run each individually with its corresponding scenario name, reviewing each result before the next. Do not batch into an automatic retry loop. No Stage 3 recommendation until coverage is executed and reviewed.

Remaining limits: no runtime proof for the new coordinator/fixtures; one READ COMMITTED ordering per scenario; no alternate scheduler permutations/higher isolation yet; external workflow effects not covered; service-role/admin trust and physical-clone/SSL guard limitations remain. No production readiness claim.
