# C01 Stage 2A controlled demotion rerun — 2026-10-16

Result: PASS. One scenario executed once; no retries or additional scenarios.
Target: aibeat-business-staging / oejxwsvlvelxmfbysjbx.
Branch: codex/c01-business-authorization-hardening.
Run: a48ab156-b8bd-4127-b3cd-ba9f7d853432.

## Preconditions

Corrected staging guard and independent cluster identifier 7692131729119822239 passed. All ten expected migration versions confirmed. Old residual counts remained 2 users, 1 organization, 2 memberships, 1 audit, with one active owner. The previous automatic-approval usage-limit failure had prevented execution; this was the first actual replacement-runner demotion execution.

Used fresh synthetic UUIDs/example.invalid users and protected exact-scope staging credentials. Reviewed runner: each connection checks cluster identity; actor PID comes from SELECT pg_backend_pid(); observer uses pg_blocking_pids(B), not protocol PID. No credential values were printed.

## Concurrency evidence and sequence

1. A and B began distinct READ COMMITTED transactions and assumed their authorized owner identities.
2. A successfully demoted itself to MEMBER, holding the organization transaction lock.
3. B attempted its own demotion concurrently on a separate connection/thread.
4. The independent observer verified wait_event_type=Lock and that pg_blocking_pids(206419) included 206417. A PID=206417; B PID=206419.
5. Only after verified blocking did the runner issue A COMMIT; it succeeded.
6. B resumed and returned SQLSTATE 23514 with exact primary message LAST_ACTIVE_OWNER. B ROLLBACK succeeded.
7. All four final invariant assertions passed. No unexpected timeout, deadlock, serialization error or authorization bypass occurred.

PASS is based on actual blocker verification, A commit, exact B rejection/rollback and invariants, not merely final owner count. Runner result: c01-stage2a-result.json. Generated synthetic plan: c01-stage2a-plan.json.

## Postflight and cleanup

Independent read-only postflight (c01-stage2a-postflight.log) confirmed new organization 71bd06a7-5e79-4c38-836c-14b194ba3d8b has exactly ONE ACTIVE OWNER. A is ACTIVE MEMBER, B ACTIVE OWNER; the shared fixture's third synthetic member is unchanged ACTIVE MEMBER. Exactly one MEMBER_ROLE_UPDATED audit exists, attributed to A and its membership. B's rejected operation added no audit record.

Actor PIDs had zero open transactions. Runner finally blocks rolled back any remaining own transactions and closed all three connections. Harmless 'there is no transaction in progress' warnings came from defensive ROLLBACK after already completed transactions; no test failure or timeout.

New retained synthetic setup: 3 users, 1 organization, 3 memberships, 1 immutable audit record. The shared scenario builder includes a third member, unused by this demotion case. Total retained across old and new runs: 5 users, 2 organizations, 5 memberships, 2 audits. No broad deletion or trigger bypass was attempted. Data cleanup is retention, not deletion: preserving the owner/audit evidence is consistent with the prepared fixture plan. No full-cleanup claim is made. Old residual data remains unchanged; exact new IDs are in the saved result/plan. No new workflows or approvals were used.

## Risks and next recommendation

This validates one owner-demotion ordering at READ COMMITTED through the corrected three-session coordinator. It does not validate the seven other scenarios, alternate scheduler permutations, higher isolation, application E2E, or production compatibility. Retained evidence needs the separately reviewed retention/disposal plan. Existing privileged-role, physical-clone identity and SSL configuration limitations remain.

Recommend separately authorizing the remaining seven prepared concurrency scenarios, individually with stop-on-failure and no automatic retries. No additional execution is implied by this recommendation. No migrations, policy changes, application deployment, Business E2E, production operations, C02 or Stage 3 occurred. Stopped after reporting.
