# C01 Stage 1 runtime security results — 2026-10-15

Target: aibeat-business-staging / oejxwsvlvelxmfbysjbx only.
Branch: codex/c01-business-authorization-hardening.
Run: eee5e188-70cb-4611-8ea2-decedbc67d1a.

## Outcome

72 assertion invocations executed: PASS 72, FAIL 0, SKIPPED 0. Counts include individual check_true/expect_error calls and loop iterations, not fixture setup, preflight or cleanup queries. All prepared SQL suite assertions were reached. Concurrency and broader coverage gaps are outside these totals, not passed tests.

CLI/psql exit code 0. No SQL errors or unexpected authorization bypass observed. Expected denied operations and injected P0001 failures were caught by the original assertions. No weakened policies, assertion changes, migrations, application deployment, production operations or C02 work.

## Preflight and execution

Confirmed exact staging project/host/port/database/user through the corrected wrapper and independently enrolled cluster system identifier 7692131729119822239. Guard passed. Recorded all ten expected versions through 202610140001. Users, organizations and storage objects were zero before execution. Credentials came only from the protected exact-scope staging password file; no credential values were printed or logged.

Reviewed SQL writes and cleanup: synthetic auth users with example.invalid emails, tenant/workflow/approval/storage fixtures and temporary failure-injection triggers, all inside BEGIN/ROLLBACK. DELETE/TRUNCATE probes are expected-denial tests within that transaction, not cleanup. No signup email, payment or external workflow was executed.

Used the guarded staging renderer and psql -X -w -v ON_ERROR_STOP=1. Generated helpers were augmented only with C01_PASS notices after successful existing checks for per-assertion reporting. Assertions and expected SQLSTATEs were preserved. Repository SQL, migration and policies were unchanged. No concurrency executable was invoked in this stage.

## Coverage reached

- Anonymous membership/provisioning/approval denial.
- Authenticated nonmember with forged owner metadata denied existing tenant access and mutation (community-only boundary without enabling community functionality).
- First-owner creator invariant and atomic creator onboarding.
- Cross-organization member mutation, workflow reference and approval isolation.
- Active admin/manager/member membership reads; promotion denial for nonowners; owner invitation and role change.
- Last active owner demotion, suspension and removal rejected.
- Creator identity update denied.
- Approval owner/admin/manager authorization, member/foreign-owner denial, and direct-update bypass denied.
- Injected audit failure rolled back approval/run/continuation; successful manager decision and retry produced exactly one continuation/audit.
- Audit UPDATE/DELETE/TRUNCATE denied, including privileged UPDATE trigger protection.
- Onboarding retry idempotency and seed failure rollback with no half-created organization or owner.
- Storage member read, member write denial, admin write success, foreign/malformed path and nonmember denial.

Every individual assertion is recorded in c01-stage1-results.json. Full synthetic-only diagnostics: c01-stage1-runtime.log. Generated run location: c01-stage1-run-path.txt.

## Cleanup

Normal fixture ROLLBACK completed. Independent read-only postcheck confirmed zero auth users, organizations, memberships, workflows, workflow runs, workflow steps, approvals, audit events, context items and storage objects. Both injected failure triggers are absent. See c01-stage1-cleanup.log. No cleanup failures and no destructive cleanup commands were required. Baseline templates/integrations and the existing private storage bucket were not removed.

## Remaining risks and recommendation

This is a pass of the prepared Stage 1 suite, not comprehensive proof of authorization correctness. Nonmember scans across otherwise empty tenant tables provide weaker evidence than populated sentinels. Remaining coverage includes suspended-user/full CRUD matrices, approval EDITED/REJECTED and legacy snapshot paths, revocation races, higher-isolation behavior, application authentication/UI compatibility and full storage API flows. Service-role/database-owner trust and the staging guard's documented physical-clone/SSL limitations remain.

Recommend separately approving Stage 2 concurrent ownership testing next. Stage 1 provides no evidence about lock contention, last-owner races or concurrent transaction retries. No Stage 2 execution is authorized or performed here. Stop after this report; do not deploy or begin C02.
