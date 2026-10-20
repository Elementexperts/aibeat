# C01 Stage 3C.1 — invitation database integration preparation

## Decision

BLOCKED for Stage 3C.2 execution. Preparation and offline checks pass; no database test, query, migration, auth provisioning or browser test was executed. F1 is a source-review correctness finding with an expected-red regression, not a reproduced database failure. Neither migration was changed.

## Repository preflight

Branch: codex/c01-business-authorization-hardening. Current HEAD: d996449e908c237858fa0219efe0d01a673e605a (Add reviewed Novastart, Flippie Labs and Millionaire AI listings). This differs from the historical invitation report HEAD; current working-tree application and unrelated changes were preserved. No reset, clean, commit or push.

Reviewed c01-invitation-implementation.md, c01-invitation-fixture-activation.md, the prior fixture activation design, actual invitation SQL, frozen C01 authorization RPCs/triggers, baseline schemas and existing RLS test sources. New migration remains locally recorded as NOT APPLIED and its source hash is unchanged. Actual database migration history is UNKNOWN: independently confirming non-application would require the forbidden database connection. No repository artifact can prove all remote database states.

Frozen C01 SHA256, verified before/after:
731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C

Invitation migration SHA256, unchanged:
1F553E11F65B6015C7926E235B62258CA0738B12EAB33D7AA2DAD235E701E02C

## Migration security review

| Area | Source-review conclusion / required real validation |
|---|---|
| Ordering | Requires original foundation, invitation nullable user/email/inviter schema, later baseline alterations and frozen C01 lock/invariant/audit functions. Complete chain listed below. |
| Privileges | New acceptance/revocation RPCs revoke PUBLIC/anon execution and grant authenticated only. Receipt table revokes client table rights; existing membership insertion rights remain revoked. Catalog tests must verify effective/inherited/default privileges and trusted function ownership in the actual database. |
| SECURITY DEFINER | Three RPCs intentionally perform narrowly authorized writes, with empty search_path and qualified persistent objects. Trigger helpers are not client callable. Migration role must be independently trusted; no test runs as authenticated superuser. |
| RLS | Existing application policies are untouched; private receipts enable RLS with no client policy. Definers intentionally bypass table RLS and must independently verify caller identity. Tests SET ROLE authenticated and JWT subjects, not use superuser reads as authorization proof. |
| Identity | Acceptance locks auth.users and uses auth.uid(), current email and email_confirmed_at; caller/JWT email metadata cannot grant rights. Real auth schema behavior, user email changes and GoTrue session revocation remain later auth integration concerns. |
| Expiry/revocation | Seven-day new invitations; legacy NULL expiry fails closed. Explicit revocation is durable. Original inviter must currently remain active OWNER. Expiry checked using clock_timestamp after org lock. See F1 issuance/reissue defect. |
| Membership identity | New ACTIVE row; no binding UPDATE to immutable user_id/org/id. Existing first-owner, last-owner, org/user unique constraints and direct-write restrictions unchanged. Existing suspended membership cannot be overwritten. |
| Consumption | Original INVITED row retained with accepted timestamp. Receipt uniquely binds original invitation to the new member and authenticated user/email. Current UI still presents a retained INVITED history row; lifecycle display remains a presentation limitation, not authorization evidence. |
| Receipts/audits | Immutable receipt DML/truncate triggers reuse append-only guard; successful recipient attribution uses a reserved acceptance event. C01 runtime-audit whitelist does not permit forging that event. Receipt organization FK restricts deletion, consistent with existing audit retention; operational retention policy still needs review. |
| Concurrency | Trusted auth row share lock precedes org serialization. Independent same-invitation callers should block and then receive same ID. Acceptance rejects non-READ COMMITTED isolation. Owner mutations serialize on org; races with revoke/remove/role changes require actual DB execution, not prior Stage 2 evidence. |
| Retry | Receipt-first retry returns only same user's original still-ACTIVE membership with current matching confirmed email; no second insert/audit and no role reset/reactivation. Original invitation deletion/expiry after successful acceptance does not invalidate an existing grant. |
| Atomicity | Membership, accepted marker, receipt and final audit share one transaction. Test-only audit failure trigger exercises rollback after preceding writes. This has not been executed. |

No confirmed privilege-escalation defect was established by source review. This is NOT a PostgreSQL syntax, RLS or concurrency certification.

### F1 — stale-inviter reissue can return an unusable invitation (moderate correctness blocker)

Reproduction prepared in stale-inviter-reissue.sql: OWNER A issues a pending invitation; OWNER B demotes A while remaining OWNER; B calls invite_business_member for that email. The issuance query filters expiry/revocation/accepted state but not current inviter authority, so it returns A's old invitation. Acceptance independently rejects it as INVITATION_REVOKED. The application instruction to request a new invitation cannot resolve this by reissuing alone. Owner B can explicitly revoke the old invitation then issue a new one as a manual workaround.

Proposed correction, NOT IMPLEMENTED: inside invite_business_member, after business_lock_owner and email validation and before pending-invitation reuse, identify matching unaccepted/unbound/unrevoked pending rows whose invited_by is no longer an ACTIVE OWNER of that organization. Under the existing org lock, mark them revoked and append one MEMBER_INVITATION_REVOKED audit per row. Then execute the existing valid-pending reuse query/new issuance. Do not modify invited_by, email, expiry, ID, original audit or receipt. This preserves identity immutability and creates any replacement under the current authenticated owner. Acceptance checks remain unchanged. Apply only to the new additive migration source under separate correction approval; do not alter frozen C01.

An alternative explicit revocation-before-reissue application workflow is possible, but requires approval and its own tests. F1 regression is deliberately expected to fail current source behavior; it is not part of a passing integration claim. Stage 3C.2 must state whether it authorizes initial reproduction with an expected failure or requires a reviewed correction first.

## Prepared real PostgreSQL inventory

Source directory: tests/rls/invitations/. Nothing in that directory was executed against a database.

| ID | Prepared scenario | Evidence expected on future execution |
|---|---|---|
| 01 | Valid verified recipient | Distinct ACTIVE membership ID; trusted MEMBER role; empty permissions; retained unbound invitation marked accepted |
| 02 | Wrong recipient / forged JWT email | 42501 INVITATION_UNAVAILABLE; no successful grant |
| 03 | Unconfirmed authoritative email / forged confirmation claim | 42501 VERIFIED_EMAIL_REQUIRED |
| 04 | Expired invitation | 23514 INVITATION_EXPIRED; expiry fixture inserted expired without disabling trigger |
| 05 | Owner-revoked invitation | 23514 INVITATION_REVOKED |
| 06 | Duplicate acceptance | Same membership ID, single acceptance receipt/audit |
| 07 | Concurrent acceptance | Two real independent backend sessions, org-lock wait, same member ID, one membership/receipt/audit; both blocking orders on separate fresh databases |
| 08 | Retry after suspension | MEMBERSHIP_CHANGED; no reactivation |
| 09 | Retry after removal | MEMBERSHIP_CHANGED; no recreated membership |
| 10 | Identity immutability | Privileged user/tenant/email reassignment attempts rejected by actual triggers |
| 11 | Populated foreign tenant isolation | Positive admin sentinel; recipient cannot read foreign org, invite into it or insert memberships |
| 12 | Final audit failure | Whole acceptance subtransaction rolls back membership, receipt, marker and audit; normal retry can succeed after removing only the test fault trigger |
| 13 | Attribution | Exact recipient actor, tenant, member entity, original invitation reference and one receipt |
| 14 | Receipt immutability | Client read denied; privileged update/delete/truncate rejected |
| 15 | Last-owner protection | Sole owner demotion/removal still rejected |
| 16 | Existing C01 RLS regression | Existing business-isolation.sql rerun after new migration in disposable DB; fresh result, not reuse of historical 72/72 |
| F1 | Stale-inviter reissue | Expected-red source-review regression; correction or approved manual workflow must be dispositioned |

acceptance.sql covers 01-06 and 08-15 plus catalog privilege checks, in one rollback-only fixture transaction. The two concurrency .spec files are isolationtester programs with separate a/b/observer sessions and COMMIT steps, not reference models. Each contains ONE permutation; each needs its own fresh cluster/database because setup commits synthetic records and immutable history is deliberately retained. Result table stores backend PID and returned member ID. Case 16 is a separate existing SQL file. Existing historical Stage 1/2 tests were NOT rerun in this preparation.

Additional Stage 3C.2 expansion should exercise accept-vs-revoke, accept-vs-owner-demotion, different-invitation same-user uniqueness, rollback at receipt insertion, deleted original invitation retry, and REPEATABLE READ rejection. These are reviewed follow-up cases, not silently claimed covered by the 16-case inventory.

## Available tooling — filesystem discovery only

Supabase CLI exists at C:\supabase\supabase.exe. PostgreSQL was not on PATH, but the earlier C01 bundle exists at C:\Users\User\AppData\Local\AIBeat\C01\tools\postgresql-17.11\pgsql\bin with psql, postgres, initdb, pg_ctl and libpq. The matching isolationtester executable was not found there. Extension control-file discovery is recorded in c01-stage3c1-tooling.json; file presence does not prove installed SQL extensions or compatible libraries. No server was started, service queried, connection opened or CLI status/link command run. No approved initialized disposable cluster, auth schema, extension catalog, RLS or triggers were verified.

## Exact required environment and migration order

Operator-provided disposable, network-isolated Supabase-compatible PostgreSQL 17.11 test cluster (matching available bundle) plus matching PostgreSQL isolationtester build, or another explicitly reviewed pinned engine version if supplied. Record actual version/image digest and any parity gap with eventual staging. Server must listen only on runtime-local loopback; cluster must have no remote provider hooks, mail/webhook integrations, production data or credentials. No GoTrue, storage HTTP service, browser or application server needs to run for these SQL tests.

Required prerequisites: real auth.users schema including email/email_confirmed_at and auth.uid(); anon/authenticated roles; storage.buckets/objects/foldername with real grants/policies; pgcrypto and vector extensions with compatible binaries. Do not replace these with permissive stubs and claim Supabase compatibility. Use an ephemeral trusted cluster migration owner for baseline DDL and synthetic auth fixture setup; tested operations must SET ROLE authenticated/anon. No direct ACTIVE role seeding replaces invitation acceptance. Expired INVITED rows and local audit-failure triggers are narrowly scoped DB test fixtures, not application provisioning adapters.

Apply these reviewed files individually, in order, only after Stage 3C.2 approval and identity preflight:

1. 202608230001_aibeat_business_foundation.sql
2. 202608240001_business_self_serve_onboarding.sql
3. 202608250001_business_memory_ingestion_scheduler.sql
4. 202608250002_business_connector_runtime.sql
5. 202608250003_business_notifications_admin_evals.sql
6. 202608270001_fix_business_workspace_provisioning.sql
7. 202608280001_seed_business_workflow_templates.sql
8. 202609040001_public_form_submissions.sql
9. 202609270001_submission_automation.sql
10. 202610140001_business_authorization_hardening.sql
11. 202610200001_business_invitation_acceptance.sql

Do not split migrations' explicit BEGIN/COMMIT or use a runner that silently retries. Hash every reviewed file before transfer/execution. Steps 8-9 are retained for complete repository baseline parity, not invitation functionality.

## Future isolated execution procedure — DO NOT EXECUTE under Stage 3C.1

1. Operator independently approves runtime ownership, image, data directory, loopback listener/port and deny-all network policy; provision a fresh Supabase-compatible cluster. A database name, UUID marker or loopback alone cannot establish safety.
2. Operator creates exactly one identity row in c01_test_control.identity with columns run_id uuid and purpose text; purpose must equal C01_DISPOSABLE_INVITATION_ONLY and run UUID must be independently recorded. This is a secondary accident guard, not authorization. Preserve trusted management-plane identity evidence. A fresh clone/run needs a distinct reviewed marker.
3. Supply a protected passfile outside the repository; never inline passwords or use repository .env/linked Supabase configuration. In a fresh shell remove inherited PG connection/service/options variables, then explicitly configure only the reviewed loopback connection and PGPASSFILE. No database connection string with a remote host is acceptable.
4. After explicit approval, identity preflight precedes EVERY migration/test connection. Example PowerShell commands below use placeholders requiring operator input; they have NOT been run:

```powershell
$psql = 'C:\Users\User\AppData\Local\AIBeat\C01\tools\postgresql-17.11\pgsql\bin\psql.exe'
$connection = 'host=127.0.0.1 port=<approved-port> dbname=aibeat_c01_isolation user=<disposable-migration-owner> connect_timeout=5'
$runId = '<independently-recorded-disposable-UUID>'
$env:PGPASSFILE = '<protected-outside-repository-passfile>'
& $psql -X --no-password --dbname=$connection --set=ON_ERROR_STOP=1 --set=expected_run_id=$runId --file=tests/rls/invitations/identity.sql
if ($LASTEXITCODE -ne 0) { throw 'Identity gate failed; STOP' }
# For EACH explicitly listed reviewed migration, repeat identity.sql first, then:
& $psql -X --no-password --dbname=$connection --set=ON_ERROR_STOP=1 --file='<one-reviewed-migration-path>'
if ($LASTEXITCODE -ne 0) { throw 'Migration failed; discard this disposable cluster' }
# After the full chain, record catalogs/grants/triggers/version/extension evidence, then:
& $psql -X --no-password --dbname=$connection --set=ON_ERROR_STOP=1 --set=expected_run_id=$runId --file=tests/rls/invitations/acceptance.sql
if ($LASTEXITCODE -ne 0) { throw 'SQL assertions failed; STOP' }
# Case 16, after another successful identity.sql preflight:
& $psql -X --no-password --dbname=$connection --set=ON_ERROR_STOP=1 --file=tests/rls/business-isolation.sql
if ($LASTEXITCODE -ne 0) { throw 'Post-migration C01 RLS regression failed; STOP' }
```

5. Real concurrency requires independently obtained/reviewed matching isolationtester. On a FRESH equivalently migrated cluster per spec, run (shell with input redirection):

```text
isolationtester "host=127.0.0.1 port=<approved-port> dbname=aibeat_c01_isolation user=<disposable-owner> connect_timeout=5 options='-c c01.expected_run_id=<recorded-UUID>'" < tests/rls/invitations/acceptance-concurrency.spec
```

Repeat on a separate fresh cluster for acceptance-concurrency-reverse.spec. Capture both actual backend PIDs, explicit waiting/completion order, verify-step success and absence of SQL errors. Exit code alone is insufficient; isolationtester may report errors in its transcript without a failing process status. No automated transcript comparator is claimed prepared here; operator review is mandatory before PASS.

6. On another fresh cluster, execute stale-inviter-reissue.sql through the same guarded psql invocation. Current migration is expected to exit 4 at F1. Unexpected success/failure needs review, not automatic acceptance. If a correction is approved, update reviewed hashes and expected result before asserting PASS.
7. First identity mismatch, unexpected SQL error, missing wait, duplicate result/audit, leaked privilege, failed rollback or test timeout stops the run. Do not bypass checks, disable immutable triggers, repair data, retry automatically or continue on a partially migrated cluster. acceptance.sql/F1 transactions roll back on success or disconnect; concurrency setup persists until whole-cluster disposal.
8. Export sanitized test IDs/statuses, engine/schema/function/grant/extension evidence, source/image hashes, timing/wait transcript and exact disposable runtime identity. No passwords, session cookies, real JWTs or production environment files. Then stop all owned DB/test processes and destroy only the independently identified disposable runtime/data directory. Verify no descendants/listeners remain. Do not clean test history with privileged DELETE/TRUNCATE.

## Offline validation and evidence boundaries

- 110/110 targeted application/invitation/compatibility/public-config offline tests PASS (mocked RPC and explicitly labeled reference-model tests included).
- 6/6 new preparation/static checks PASS: 16-case collection plus F1, collection-only safety, identity guards, independent-session spec structure, rollback fault source and both unchanged migration hashes.
- Test collection produces 17 PREPARED_NOT_EXECUTED entries; it cannot launch SQL. Command: node tests/rls/invitations/collect.cjs --list.
- TypeScript: node node_modules/typescript/bin/tsc --noEmit --incremental false. Final result recorded in evidence.
- SQL static checks inspect source only, not PostgreSQL parsing or execution. Diff/whitespace checks recorded separately.
- PostgreSQL integration: NOT EXECUTED. Supabase authentication integration (GoTrue/JWT verification/session lifecycle): NOT EXECUTED; SET ROLE/request.jwt.claims simulation is not that validation. Browser E2E: NOT EXECUTED. No prior completed stage was rerun as a database test.

Exact changed-file list and hashes: c01-stage3c1-change-manifest.json. Only new test/evidence/report files were created; no migration or application implementation changed. Logs: c01-stage3c1-preparation-offline.log, c01-stage3c1-application-offline.log, c01-stage3c1-typecheck.log. Tool inventory and collection JSON are separate evidence artifacts.

## Required Stage 3C.2 authorization

Approve a named, independently verified disposable Supabase-compatible PostgreSQL runtime; explicit synthetic auth fixture seeding, baseline/new migration application there, all 16 real SQL scenarios plus both concurrent orderings, audit fault injection, F1 reproduction/disposition, sanitized evidence capture and whole-runtime disposal. Explicitly decide whether to authorize the proposed F1 source correction first or reproduce the expected-red case unchanged. Provide matching isolationtester and required extension/schema prerequisites without assuming the local bundle supplies them.

This approval must remain local/disposable only: no staging/production connection, real accounts/emails, browser E2E or deployments. Separate future authorization is still required for GoTrue integration, staging migration/preflight/provisioning and E2E. STOP after this preparation report.
