# C01 Stage 2 concurrency validation — 2026-10-15

Staging only: aibeat-business-staging / oejxwsvlvelxmfbysjbx.
Branch: codex/c01-business-authorization-hardening.
Run: 85ad7629-744e-4d3e-b48f-af30f8a7708b.

## Totals

Requested scenarios: 8. Executed: 1. PASS: 0. FAIL: 1. SKIPPED: 7.

A zero isolationtester process exit is NOT a pass: expected error/blocking output did not match. No retry was performed. No migration, policy weakening, application/Business E2E execution, production access, production CLI relink or C02 work occurred.

## Preconditions

Corrected guard and independent cluster identity 7692131729119822239 passed. Exact staging project and session-pooler tuple verified, protected exact-scope staging credential used without disclosure. Ten expected migration versions confirmed. Stage 1 cleanup verified: users, organizations, memberships, audits, storage objects and injection triggers all zero. isolationtester version 17.11 confirmed. Reviewed synthetic UUID/example.invalid setup and committed-retention cleanup limitation before running.

## Scenario results

| Scenario | Status | Expected / actual / proposed missing fixture |
| --- | --- | --- |
| Concurrent last-owner removal | SKIPPED | No executable removal race fixture. Proposed: two owners remove themselves in overlapping transactions; one removal commits, other rejects and one owner remains. |
| Concurrent owner demotion | FAIL | Expected B waits for A, A commits, B then rejects LAST_ACTIVE_OWNER and rolls back. Actual B blocked, runner canceled B after 60 seconds, then A committed and B rolled back. Final one-owner assertion passed, but expected business-rule rejection was not reached. |
| Concurrent membership suspension | SKIPPED | No fixture. Proposed overlapping self-suspension of two owners; serialize and reject last active owner suspension. |
| Conflicting membership role changes | SKIPPED | No fixture. Proposed two authorized owners update the same target membership; verify serialized authorized final state and audit consistency. |
| Concurrent approval decisions | SKIPPED | No fixture. Proposed competing decisions on one pending request; one commits, other rejects conflict or accepts an identical authorized retry without duplicate continuation. |
| Approval transaction rollback | SKIPPED | Stage 1 tested sequential injected rollback, not concurrency. Proposed fail first decision at audit insertion while second waits; verify first rolls back wholly and second reevaluates pending state. |
| Concurrent organization provisioning | SKIPPED | No fixture. Proposed same user creates organization through two sessions; one organization and creator membership, stable returned identity. |
| Duplicate onboarding/idempotency | SKIPPED | No fixture. Proposed overlapping onboarding calls for one user; one context/template set and completion marker, no duplicate org. |

Coverage gaps and proposed tests were communicated before execution. No additional concurrency fixtures were invented or developed for this run.

## Genuine concurrency evidence and transaction results

isolationtester parsed two actor sessions plus its control connection. During the blocked step, independent pg_stat_activity/pg_blocking_pids observation showed:

- A: PID 125454, Supavisor/a, idle in transaction.
- B: PID 125455, Supavisor/b, active, Lock / transactionid, blocked by PID 125454.
- Control: PID 125447, Supavisor/control connection, idle.

See c01-stage2-session-observation.log. Thus real overlapping database transactions and a real database lock were demonstrated; this was not sequential mocked execution.

Runner output: 'canceling step b_demote after 60 seconds', then 'ERROR: canceling statement due to user request'. A COMMIT succeeded, B ROLLBACK succeeded, final owner count assertion succeeded. No deadlock or serialization error was observed. No retry occurred. Expected LAST_ACTIVE_OWNER rejection was absent. The last-owner invariant was preserved in the observed final state, but protection under the intended post-commit race was not validated.

The runner failed to recognize/advance past the blocked statement as intended through this pooler. The precise cause remains undiagnosed; investigate isolationtester's backend PID/block detection and Session Pooler behavior. Do not assert a database authorization defect or a successful race test solely from this result.

## Cleanup verification / retained data

Read-only postcheck found no active or idle-in-transaction test actor/control sessions. All actor transactions ended.

Retained synthetic records, scoped to organization 152ef3a6-7d0a-464b-85d1-1e3faf1da966:

- 2 auth users
- 1 organization
- 2 active memberships: A MEMBER, B OWNER
- 1 append-only audit record

Exact generated identifiers: c01-stage2-id-map.json. Postcheck: c01-stage2-postcheck.log. Full output: c01-stage2-runtime.log.

Full data cleanup is NOT complete. The prepared fixture commits setup and A's mutation, and intentionally retains records. Removing the last owner or deleting immutable audit history would violate the protections being tested; deleting the audit-bearing organization is restricted. No disabling triggers, broad deletion, database reset or protection bypass was attempted. Partial deletion was avoided to preserve the coherent fixture and diagnostic evidence. Retention is explicitly reported, not represented as successful cleanup. A separately reviewed retention/disposal plan is needed if these records must be removed.

## Recommendation

Do not advance to Stage 3/Business E2E yet. First diagnose the concurrency harness through the session pooler and propose a corrected bounded runner or verified direct connection, then obtain approval for a new run. An alternative is a three-connection driver that explicitly observes pg_blocking_pids(B) containing A before committing A, rather than relying on pooler protocol backend IDs. Develop and review the seven missing executable fixtures before claiming Stage 2 coverage. No automatic repair/retry or additional stage is performed.
