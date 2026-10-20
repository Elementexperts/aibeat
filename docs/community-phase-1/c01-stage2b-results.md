# C01 Stage 2B concurrency results — 2026-10-16

Result: **7 PASS / 0 FAIL / 0 INCONCLUSIVE / 0 SKIPPED**. Executed once each, individually in prepared order. No retries. Stage 3 remains unexecuted.

## Environment and preflight

Branch: codex/c01-business-authorization-hardening.
Staging: aibeat-business-staging, oejxwsvlvelxmfbysjbx.
Session pooler: aws-0-us-west-1.pooler.supabase.com:5432; postgres database; postgres.oejxwsvlvelxmfbysjbx user.
Independent system identifier: 7692131729119822239.
Exact scoped passfile and fail-closed guard passed before every scenario; all three runner connections independently checked cluster identity.
Ten migration versions verified: 202608230001, 202608240001, 202608250001, 202608250002, 202608250003, 202608270001, 202608280001, 202609040001, 202609270001, 202610140001.
Initial retained totals matched prior evidence: 5 users, 2 organizations, 5 memberships, 2 audit records.
All new plans used fresh UUIDs and synthetic example.invalid users. No production credentials, CLI link changes, migrations, policy changes, deployment or external workflows.

## Expected and actual outcomes

Every actual result matched the prepared expected result.

| Scenario | Expected and observed transactions | Final invariants | Result |
|---|---|---|---|
| removal — concurrent last-owner removal | A COMMIT; B 23514 LAST_ACTIVE_OWNER, ROLLBACK | A membership removed; B sole active owner; one removal audit | PASS |
| suspension — concurrent membership suspension | A COMMIT; B 23514 LAST_ACTIVE_OWNER, ROLLBACK | A suspended; B sole active owner; one mutation audit | PASS |
| role_conflict — conflicting membership role changes | A COMMIT ADMIN; B COMMIT MANAGER | Target active MANAGER; two owners remain; two mutation audits | PASS |
| approval_conflict — concurrent approval decisions | A COMMIT APPROVED; B 23514 APPROVAL_ALREADY_RESOLVED, ROLLBACK | Approval resolved by A; run and step COMPLETED; only A approval/completion audits | PASS |
| approval_rollback — approval transaction rollback | A intentional 22012 division error, ROLLBACK; B COMMIT APPROVED | Observer saw PENDING approval, waiting run and zero audits before B commit; final approval by B, run/step complete, only B audits | PASS |
| provisioning — concurrent organization provisioning | Both COMMIT, identical returned result | Exactly one organization and active owner; one provisioning audit | PASS |
| onboarding — duplicate onboarding/idempotency | Both COMMIT, identical returned result | One organization/owner, onboarding marker, one context, five distinct template workflows, one onboarding audit plus provisioning audit | PASS |

26 prepared final invariant assertions passed, plus three rollback visibility assertions and both idempotent-return comparisons. Read-only postflight additionally verified ownership, memberships, approvals, runs, steps, audits and transaction completion.

## Genuine concurrency and blocking

Each execution used control/observer plus two actor connections. Actors authenticated with synthetic JWT claims and READ COMMITTED transactions.
For every run SQL pg_backend_pid() returned A=207156 and B=207157. Reuse across successive runs is expected from the pooler; actors were distinct within each run.
The observer queried pg_blocking_pids(207157), verified it contained 207156 and observed wait_event_type=Lock before releasing A.
A then committed, except the explicit rollback scenario. B completed with the exact expected outcome. No protocol PID was used.
No unexpected SQL errors, deadlocks, serialization errors or timeouts occurred. Defensive final ROLLBACK emitted benign "there is no transaction in progress" warnings. All read-only postflights found zero open actor transactions.
Evidence does not include wait duration or a complete lock graph; it records the verified blocker relationship and ordered release/outcomes.

## Retained synthetic evidence

| Scenario | Users | Organizations | Memberships | Audits | Other retained rows |
|---|---:|---:|---:|---:|---|
| removal | 3 | 1 | 2 | 1 | none |
| suspension | 3 | 1 | 3 | 1 | none |
| role_conflict | 3 | 1 | 3 | 2 | none |
| approval_conflict | 3 | 1 | 3 | 2 | 1 workflow, run, step and approval each |
| approval_rollback | 3 | 1 | 3 | 2 | 1 workflow, run, step and approval each |
| provisioning | 3 | 1 | 1 | 1 | none |
| onboarding | 3 | 1 | 1 | 2 | 5 workflows, 1 context |
| Stage 2B total | 21 | 7 | 16 | 11 | 7 workflows, 2 runs, 2 steps, 2 approvals, 1 context |
| Prior retained evidence | 5 | 2 | 5 | 2 | none |
| Current combined totals | 26 | 9 | 21 | 13 | as above |

Exact created and retained IDs, plans, expected SQL, outcomes and per-scenario postflight records are in c01-stage2b-evidence.json. Provisioning/onboarding actual organization IDs are in postflight; their unused preallocated plan organization IDs are not inserted.
Only the runner's transactions were rolled back/closed. No retained records were deleted, immutable audit protections bypassed, or last-owner protections disabled. Three setup users per scenario intentionally include unused actors in same-user provisioning/onboarding plans.

## Coverage limits and recommendation

All seven approved prepared scenarios passed; with Stage 2A, all eight prepared concurrency scenarios now have a passing controlled execution. The original isolationtester timeout remains historical runner failure evidence.
One A-first READ COMMITTED ordering was exercised per scenario. Reverse orderings, randomized stress, higher isolation, connection loss, service-role misuse and application/browser behavior remain untested. The rollback test uses an outer transaction error; it does not inject failure inside every approval function statement. SSL require encrypts transport but does not independently provide verify-full hostname validation; route scope and enrolled cluster identity remain part of the trust boundary.
Recommend proceeding to a separately approved Stage 3 Business E2E plan using synthetic staging-only accounts and disabled email/payment/external actions. These results do not authorize deployment or establish full application compatibility.

## Files added in this stage

- tests/rls/concurrency/postflight_stage2b.py — read-only identity-guarded evidence collection.
- docs/community-phase-1/c01-stage2b-evidence.json — seven exact execution plans/results/postflights.
- docs/community-phase-1/c01-stage2b-results.md — this report.

Existing concurrency plans, assertions, runner, C01 migration and application code were not changed during this stage. Pre-existing working-tree changes remain untouched. No commit or push.
