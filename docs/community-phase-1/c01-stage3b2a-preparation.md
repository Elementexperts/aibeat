# C01 Stage 3B.2A — restricted staging harness preparation

## 1. Decision and authorized scope

**PASS for offline harness preparation and validation. BLOCKED for fixture provisioning and staging execution.** This does not certify independent Option B containment or complete Business E2E validation.

Option B is the approved strategy: independent default-deny egress with a separately authorized exact staging exception. This task did not enable that exception. Staging transport remains disabled in all prepared policies, --start refuses execution and Playwright global setup still unconditionally refuses staging runs.

No production/staging connection, database mutation, account provisioning, migration, deployment, real provider call, email/payment, infrastructure installation, host firewall change, commit/push or C02 work occurred. Only offline harness tests, localhost dummy-only containment probes, collection and static checks ran.

## 2. Preflight and preservation

Branch confirmed: codex/c01-business-authorization-hardening. HEAD unchanged: 38e1d208240045c80e1f2b2b44e28cdc9d36c0ec.

Reviewed the existing Stage 3B.0, 3B.1, 3B.1B and 3B.1C reports and the preceding conversation's testing-strategy review. The strategy review was in chat; no separate saved strategy file was supplied.

Initial working tree had 22 modified tracked files: four Business action/auth routes, two Business UI components, submitted-tools data, eight lib/business files, lib/supabase/config.ts and server.ts, middleware.ts, both package files, and two existing test files. Existing untracked material included Phase 0/1 reports, compatibility/session helpers, logos, C01 migration, compatibility/harness/config tests, tests/e2e and tests/rls. These changes were preserved. The tracked-file status list was unchanged at handoff; this task's code changes are within the previously untracked E2E/harness files plus a new test file. No production application source or package file was edited by this task.

C01 migration SHA256 remains exactly:
731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C

The change manifest records the exact code paths/hashes and preparation artifacts. Previous Stage 1/2 and Stage 3B evidence was not rewritten.

## 3. Exact code files changed

Modified existing preparation/harness files:
- tests/e2e/launch.cjs
- tests/e2e/local-runtime.cjs
- tests/e2e/runtime-preload.cjs
- tests/e2e/runtime-templates.cjs
- tests/e2e/containment.cjs
- tests/e2e/containment-probe.cjs
- tests/e2e/browser.ts
- tests/e2e/fixtures.ts
- tests/e2e/business.spec.ts
- tests/e2e/fixture-plan.cjs
- tests/e2e/playwright.config.ts
- tests/c01-e2e-harness.test.cjs
- tests/c01-runtime-containment.test.cjs

Added code/tests:
- tests/e2e/runtime-config.cjs
- tests/e2e/run-monitor.cjs
- tests/e2e/browser-policy.cjs
- tests/e2e/runner-policy.cjs
- tests/e2e/session-fixture.cjs
- tests/e2e/fixture-contract.cjs
- tests/e2e/provisioning-review.cjs
- tests/c01-restricted-harness.test.cjs

All new report/log/JSON paths under docs/community-phase-1/c01-stage3b2a-* are enumerated in c01-stage3b2a-change-manifest.json, including this report, the runtime requirements, fixture review, local runtime result/attempt history, collection/typecheck/static outputs and offline test logs.

## 4. Unified launcher evidence

Both the staging preparation entry and local verification now call runtime-config.cjs. There is one filtered snapshot/environment/preload path, including Windows-required variable handling, no inherited repository env files, public configuration, snapshot-only layout suppression/local badge substitution, Stripe fetch adaptation, dummy providers/mock AI, Node network/DNS/child/worker guards and middleware realm protection.

containment.cjs is now a compatibility import of runtime-preload.cjs, not a parallel security implementation. browser-policy.cjs is shared by the local browser and Playwright context fixture. runner-policy.cjs supplies common Chromium environment/proxy/options and a separate protected-manifest runner role. App processes do not receive the manifest environment pointer; native Chromium gets only explicit basic OS/profile variables. Next cannot be forked from the private runner role. The runner role permits the installed Playwright worker entry and tightly constrained installed Chromium launch; other subprocesses remain denied. Full live Playwright worker scheduling remains gated and unverified.

Intentional negative probes are enabled only in local-probe snapshots. The staging-prepared middleware cannot use the local self-probe exception. All shared Node/browser preparation still denies staging traffic; there is no environment-only opt-in. A live TLS/allowlisted transport path is not certified by this work and requires later authorization/integration with the independent boundary.

The final actual localhost run passed its application-level checks: main Next PID 5056, server PID 4244, child PID 5456 and worker thread 1 each passed 20 logical checks, for 80 total. Middleware rejection and the real browser public-config/client initialization checks passed. Three deliberate browser remote requests were rejected. Four layout nodes were suppressed and eight badge sources replaced in the snapshot. No unexpected Node or browser violations occurred. All recorded processes exited; port 3101 had no listener afterward.

The local runtime result correctly remains BLOCKED because no independent egress boundary/native descendant environment evidence exists. This is separate from the successful preparation decision.

## 5. Immediate-abort implementation and evidence

An unexpected Node/browser violation writes and fsyncs a sanitized first-violation record, then terminates the originating process before a caller can catch the original request error and continue. A run supervisor watches the shared abort state, stops registered/observed owned run processes and closes registered browsers. Each prepared Playwright scenario checks the persisted fence before starting. Complete corrupt/unreadable ledger evidence also fails closed. Later violations do not overwrite the first record.

The middleware snapshot wrapper signals unexpected remote attempts through a snapshot-only fatal local endpoint; ordinary caught fetch errors do not serve as the monitoring mechanism. The local intentional middleware probe remains distinct. Unsafe local-to-remote redirects are rejected and fatal; no remote redirect is followed. Expected negative probe scope uses AsyncLocalStorage and does not cover unrelated requests.

Offline evidence demonstrates:
- An unexpected fetch could not reach its catch handler or continuation marker.
- The supervisor stopped a sibling process and a later simulated scenario could not start.
- A browser-policy violation used the same persisted fatal path, rather than waiting for an end-of-case assertion.
- An intentional probe succeeded as a rejection check; a subsequent unrelated request still terminated the process.
- A local HTTP redirect to an unexpected destination was recorded and fatal even inside application try/catch; the remote destination was never contacted.
- Evidence corruption caused abort rather than silent loss of supervision.
- A separate guarded runner subprocess had its manifest pointer while app/native browser environments did not; an arbitrary runner child executable was rejected.

These are offline/local containment proofs, not execution of the 23 Business cases. Supervisor notification/termination is event driven with polling fallback, not hard-real-time or OS-atomic across all processes. Independent egress enforcement must prevent the packet; the monitor provides fail-closed scheduling/shutdown and evidence. A future external runtime must provide scoped group teardown and independent descendant verification.

## 6. E2E coverage preparation

All 23 cases still collect. None ran against staging.

| Area | Prepared change | Evidence limit |
|---|---|---|
| Actual browser SSR renewal | Replaced the blanket blocked body with a protected, fixture-gated expired-cookie navigation check; asserts new cookie emission, changed session, authenticated UI, same subject and renewed expiry | Requires a genuinely expired signed session and valid refresh token. Offline validation checks shape/claims only; it does not forge or cryptographically verify a live session |
| Unauthorized workflow execution | Case 06 uses a snapshot-only page calling the real runBusinessWorkflowAction through Next's server-action boundary; manager/member must receive the exact role denial and leave run IDs unchanged | Prepared browser/server-action assertion; not executed against staging |
| Approval permissions | Case 10 adds member RPC denial with unchanged PENDING state, admin/manager UI control checks, owner resolution identity and exact approval audit correlation | Successful admin/manager decisions, saved-policy denial and reject/edit/duplicate variants remain additional fixture/coverage work |
| Audit correlation | Case 13 uses exact audit ID, actor, event, entity, run and tenant fields from a reviewed naturally generated fixture | Explicitly fixture-gated; no fabricated immutable audit insertion |
| Foreign resources | Case 15 proves secondary-owner visibility of document/workflow/approval sentinels before member denial | Requires actual populated foreign sentinels; empty tables do not count |
| Storage | Case 16 adds permitted own-object download, foreign-object download denial, and same-/foreign-tenant member write denial | Requires exact pre-provisioned paths; unexpected successful writes are failures and must be retained/inventoried |
| Schema correctness | Approval queries now use approvals, matching the actual migrations rather than nonexistent approval_requests | Actual PostgREST behavior remains unverified |

Case 08 now checks the ACTIVE MEMBER baseline, performs the UI promotion and restores MEMBER through the ordinary owner-authorized RPC in finally. Later member isolation cases independently assert the baseline and stop on drift; they never silently repair unexpected state. A restoration failure fails the run under maxFailures=1.

The four unsupported-feature cases remain visible skips. The SDK refresh assertion in case 04 is still distinct from the new genuine browser SSR renewal case. Browser assertions, SDK/RPC assertions and mocked integrations are not presented as interchangeable evidence. Critical fixture-gated skips must be resolved before claiming complete supported-scope C01 E2E validation.

## 7. Fixture script readiness

**Review artifact ready; provisioning execution BLOCKED.** provisioning-review.cjs is a bounded offline script/module with no network, auth-admin or SQL executor. Its execution entry always refuses before any account or database operation.

The reviewed proposal retains nine synthetic identities, three prepared organizations and one organization created through the onboarding UI. It describes preconfirmed/no-email identity setup in a separate short-lived privileged process, authenticated creator provisioning, protected password inputs, actual returned-ID mapping, exact resource paths, ordinary authenticated data setup and naturally generated audits. It never supplies direct membership INSERT, disabled triggers, weaker RLS, fabricated invitation acceptance or broad cleanup.

C01 lacks an approved ordinary activation path for the non-owner and cross-tenant memberships this fixture set needs. Under the instruction not to bypass authorization policies, that stage cannot be safely implemented as a service-role/SQL shortcut. An approved legitimate activation mechanism or separately resolved fixture design is required before any part of provisioning is authorized.

The candidate plan was compared offline against 126 unique UUID references in preserved Stage 2 JSON evidence. This is a conservative reference set, not a count of live rows. Allocated candidate IDs are PLANNED ONLY. Created count is zero. The fixture contract validates unique UUIDs, exact synthetic emails, approved bucket, namespace-bounded paths and audit expectation shape. Existing Stage 1/2 data was not queried or changed.

## 8. Restricted runtime requirements

See c01-stage3b2a-runtime-requirements.md for the full contract:
- Independently enforced default-deny for all processes/protocols, not only fetch/socket hooks.
- Separately approved exact staging hostname/443 exception, controlled DNS, certificate/hostname verification and no wildcard/shared-IP substitution.
- No remote credential-bearing redirect following; only exact local-origin redirects.
- Independent Chromium descendant environment/boundary evidence and safe owned-group shutdown.
- Separate app, test-worker/browser and privileged setup credentials.
- Persistent sanitized violations, immediate source stop, global scenario fence and no automatic retry.

No external runtime was installed/activated, proxy exception enabled, firewall changed or staging key/URL pairing verified here.

## 9. Validation results

| Check | Final result |
|---|---|
| Offline harness/isolation/monitor/fixture tests | 33 PASS, 0 FAIL, 0 SKIPPED |
| Actual localhost Node runtime probes | 80 logical checks passed across four contexts |
| Middleware / browser configuration | Local checks passed |
| Browser deliberate remote rejection | 3/3 rejected |
| Unexpected local runtime violations | Zero |
| Playwright collection | 23 cases; no setup/browser/Business scenario execution |
| TypeScript --noEmit --incremental false | Exit 0 |
| E2E CJS syntax / whitespace | Exit 0 |
| Migration SHA256 | Exact expected value, unchanged |
| Fixture accounts created | Zero |
| Staging E2E | Not run; gates remain closed |

Earlier local development diagnostics included a TypeScript cookie typing omission and a test expecting exit 86 when the supervisor could terminate the process first. Those were corrected; the final test asserts failure, persisted evidence, absent catch/continuation and sibling shutdown. Final logs are authoritative; focused rechecks are not added again to the 33-test total. Historical 187 application/offline results were not rerun or represented as current results.

## 10. Remaining blockers and next authorization

Remaining before actual staging E2E:
1. Operator-provided independent Option B boundary, controlled gateway/exception and descendant environment evidence.
2. Separately authorized staging URL/key/cluster identity and backend-effect preflight.
3. Legitimate membership activation/fixture design, exact data snapshots, genuine expired-session provenance and provisioning authorization.
4. Authorized live transport integration and verification with the boundary; supervised Playwright worker/bootstrap proof in the chosen runtime. Current flags alone cannot unlock it.
5. Separate selection/run authorization and explicit disposition of coverage gaps/skips; no comprehensive validation claim yet.

**Exact next authorization recommended:** authorize local-only integration/verification in an identified independently restricted runtime and review a legitimate fixture-activation design. Keep live staging disabled. After those pass, seek separate read-only staging preflight, exact fixture provisioning and selected-case E2E approvals. No database/migration or policy-bypass change is implied.

Stopped after preparation, allowed validation and reporting.
