# C01 Stage 3B.0 isolated E2E preparation

2026-10-17. Decision: **BLOCKED for staging E2E execution**. Local harness components are prepared and offline checks pass; this is not a claim of runtime containment or application compatibility.

## Baseline and scope

Branch `codex/c01-business-authorization-hardening`, HEAD `38e1d208240045c80e1f2b2b44e28cdc9d36c0ec`. Stage 3A implementation inventory was reviewed. The latest readiness report was supplied in the preceding conversation (no separate Stage 3B readiness file exists in the documentation directory); its missing runner, environment pairing, provider containment and fixtures were treated as blockers.

Prior uncommitted tracked changes were preserved: app/business/{actions.ts,auth/callback/route.ts,onboarding/actions.ts,sign-in/actions.ts}, components/business/{ApprovalModal.tsx,BusinessWorkspace.tsx}, lib/business/{auth.ts,document-ingestion.ts,security.ts,server-auth.ts,supabase-store.ts,types.ts,workspace-server.ts,workspace.ts}, lib/supabase/server.ts, middleware.ts, package.json, tests/aibeat-business.test.ts. Prior untracked Phase 0/1 documentation, lib/business/{compatibility,response-cookies,session-state}.ts, tests/c01-compatibility.test.ts, tests/rls and C01 migration remain. No unrelated tracked change was made in this stage.

C01 migration SHA256 remains `731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C`. No migration, application security code, policy or trigger was edited in this stage. No connection to staging or production occurred.

## Exact files changed in this stage

- package.json: pinned testing dependencies and two offline scripts (prior compatibility-test registration preserved).
- package-lock.json: dependency resolution.
- tests/c01-e2e-harness.test.cjs: offline guards, transport probes and fixture-plan validation.
- tests/e2e/guard.cjs: environment, endpoint, mock and snapshot policy.
- tests/e2e/containment.cjs: test-only Node fetch and socket interception.
- tests/e2e/containment-probe.cjs: isolated local probe; no live target enabled.
- tests/e2e/launch.cjs: isolated snapshot preparation; --start deliberately refuses execution.
- tests/e2e/playwright.config.ts: one Chromium worker, zero retries, stop on first failure, no webServer.
- tests/e2e/global-setup.ts: unconditional execution gate; listing does not invoke setup.
- tests/e2e/browser.ts: browser HTTP/redirect/WebSocket routing policy.
- tests/e2e/reporter.ts: suppress credential-bearing diagnostics, traces and attachments.
- tests/e2e/fixtures.ts: protected external manifest and least-privileged synthetic account helpers.
- tests/e2e/fixture-plan.cjs: offline UUID allocation and collision validation, no provisioning.
- tests/e2e/business.spec.ts: 18 requested case bodies plus explicit unsupported coverage.
- docs/community-phase-1/c01-stage3b0-harness.md: this report and execution prerequisites.

## Framework and safe commands

Node 22.23.2; @playwright/test 1.64.1; undici 8.12.2. Dependencies installed with lifecycle scripts disabled. No application build/dev server was run. Browser installation status is recorded below.

Allowed offline commands:

```powershell
npm.cmd run test:c01-e2e-harness
npm.cmd run test:c01-e2e-list
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

Do not run Playwright without --list at this stage. Its global setup refuses execution, and no webServer is configured. The launcher --start also refuses. Neither SQL approval nor earlier concurrency approval unlocks these gates. Do not remove them merely to collect tests.

## Environment isolation

Only `https://oejxwsvlvelxmfbysjbx.supabase.co`, project ref `oejxwsvlvelxmfbysjbx`, cluster anchor `7692131729119822239` and `http://127.0.0.1:3101` are accepted. No preview hostname is implicitly approved. Configuration must be an ACL-protected JSON file outside the repository, identified by C01_E2E_CONFIG_FILE; no actual file or secrets were created/read in this stage.

Required configuration fields: projectRef, supabaseUrl, anonKey, clusterId, baseURL. The JWT must claim the exact ref and anon role. Missing, foreign, service-role and opaque unverified keys fail closed. **JWT decoding and comparing a supplied cluster anchor are not independent identity verification.** A separately authorized read-only verification of live key/URL pairing and cluster identity remains required. No production-linked CLI is used.

`environment()` constructs a new allowlist environment. It does not spread process.env. Provider credentials, PATH, NODE_PATH, NODE_OPTIONS, deployment flags and Supabase keys from the parent are excluded. Only basic Windows OS/temp variables survive. Known dummy provider credentials are added for mock paths; staging transport is disabled by default. AI mode is mock. Runtime browser sessions use the anon key plus each user's JWT; no postgres or service-role credential belongs in the manifest.

`snapshot()` copies allowlisted application roots/configuration to a fresh temp directory, excluding dotfiles, env files, key files and source symlinks. .next, .git, Supabase config and repository-root environment files are not copied. Only node_modules is linked for dependencies. Next must eventually run with cwd set to this snapshot and the constructed environment. A poison fixture proved `.env.local`, `.env.production`, `.env` and `env.local` are absent from the copied tree and inherited credentials do not survive environment construction. No real repository environment file contents were inspected.

The snapshot alone is not an OS filesystem security boundary: trusted code can explicitly read arbitrary host paths, and the dependency junction is shared. No actual Next process has been launched to validate worker behavior. A future reviewed launch must preserve cwd, env and preload in every worker and reject source/configuration drift. The source library's outreach CLI has an explicit relative `.env.local` loader; it is not executed here and no such file exists in the snapshot.

## Provider containment

- Business AI uses its existing deterministic mock mode. Unexpected OpenAI/Gemini endpoint calls are rejected rather than silently simulated as successful AI results.
- Gmail OAuth, messages/send and drafts have deterministic in-process mock replies.
- Kit subscriber/form/tag subscriber paths have deterministic mock replies.
- Stripe checkout sessions return a local mock checkout URL. Only the snapshot copy of lib/stripe.ts receives a guarded, exact-match substitution selecting Stripe's fetch transport; repository application code is untouched. Unknown Stripe calls are rejected.
- Unregistered transactional mail, connector and webhook destinations are rejected. Supabase signup, OTP, recovery, admin/invite, functions and realtime endpoints are also rejected to prevent remotely initiated email or external effects.
- Node fetch permits only exact staging auth user/logout/password/refresh and REST/storage routes when an explicit staging enable flag is set; otherwise even those routes are blocked. Remote redirects are rejected. TLS verifies certificates. Raw HTTP(S), TLS, sockets, UDP and HTTP/2 are blocked except the internal trusted staging fetch connector and loopback socket path.
- Browser routes permit exact local origin or staging endpoints; redirect responses are inspected without following them first. External requests are mocked or aborted, and unexpected requests fail the case. Service workers are blocked. Only local Next HMR WebSocket is allowed.
- The sanitized reporter prints case names and statuses only. Trace, video and screenshots are disabled. Do not replace it with verbose reporters during real execution; error payloads/action logs can contain credentials.

Offline probe proved fetch/raw socket rejection and successful Gmail/Kit/Stripe mocks without enabling the staging transport. Missing credentials were not the containment mechanism.

**Containment limitation / execution blocker:** Node interception is for the reviewed application, not hostile code or an OS firewall. Child processes, alternate JS realms, native addons, DNS APIs, browser background requests and Next middleware/worker fetch implementations have not been validated. Loopback socket connectivity is restricted to port 3101; the future launch must verify that this port belongs to the isolated application. The staging transport's live TLS and auth behavior is also untested. Require a local-only runtime containment probe (with staging disabled) across all Next workers and browser transport, and preferably an OS/container egress boundary, before approving staging E2E. The hard execution gates deliberately remain closed. Do not interpret 17 offline tests as proving total runtime egress isolation.

## Prepared case inventory (not executed)

All cases are collected, not passed. The following describes their current assertions and limits.

| Case | Expected outcome / scope |
|---|---|
| 01 onboarding | New preconfirmed account completes UI onboarding; exactly one active owner membership |
| 02 recovery | Incomplete creator resumes onboarding without duplicate membership |
| 03 authentication | Existing account reaches authenticated dashboard |
| 04 refresh/logout | SDK refresh preserves user, UI logout protects dashboard; expired SSR cookie renewal separately BLOCKED |
| 05 tenants | Select valid second tenant; stale cookie falls back to lexically first active organization |
| 06 roles | Owner invitation control enabled; admin/manager/member disabled; workflow execution enabled only for owner/admin; unauthorized membership RPC rejected; suspended/nonmember redirected and tenant reads empty |
| 07 invitation | UI creates one INVITED row; no acceptance or email |
| 08 membership | Owner UI role change persists to authoritative member row |
| 09 last owner | Sole second-tenant owner demotion returns LAST_ACTIVE_OWNER and leaves ACTIVE OWNER |
| 10 approval | UI approval of specifically seeded sole pending request persists APPROVED |
| 11 pause/resume | Reviewed workflow UI run pauses; approval resumes that single-boundary run to COMPLETED |
| 12 failure display | Seeded failed run displays FAILED and database agrees; inducing a new partial-write failure is not covered |
| 13 audit | Failure visible and actor-attributed audit rows retained; detailed per-event UI correlation remains to extend |
| 14 ingestion | Two identical-content uploads in one tenant index with distinct document and chunk IDs; cross-tenant duplicate content/failure injection remain to extend |
| 15 tenant isolation | Member cannot read foreign org or mutate its membership |
| 16 storage | Member upload to foreign tenant path rejected; full allowed read/write/delete matrix remains to extend |
| 17 public/submissions | Public tools renders; synthetic submission returns success with mocked notification; requires public submission RPC present in staging |
| 18 newsletter/payment | Local routes return success against mocked Kit/Stripe; mock checkout stays local |

Four additional cases explicitly say NOT IMPLEMENTED: invitation acceptance, atomic approval request-and-pause, multiple approval boundaries, automated legacy recovery. A fifth additional case marks expired-browser-cookie refresh BLOCKED. A total of 23 tests are collected; zero E2E tests ran. Cases require reviewed fixture data; collection/typecheck do not validate selectors at runtime. Approval reject/edit/duplicate variants, direct workflow-execution denial beyond disabled controls, and permitted storage reads remain coverage extensions before a comprehensive Stage 3B claim.

## Synthetic fixture provisioning proposal — not executed

Nine preconfirmed synthetic accounts: owner, admin, manager, member, suspended, nonmember, secondOwner, newOwner, recoverOwner. All emails must be `${runId}-${role}@example.invalid`, runId is `c01-e2e-<fresh UUID>`. Passwords are separately generated locally and retained only in the protected external manifest, never code/logs. No signup or password-reset email flow is used. No existing Stage 2 identity is reused.

1. Allocate UUIDs offline with fixture-plan.cjs and compare every ID against all retained Stage 2 evidence IDs. validatePlan rejects supplied collisions; live absence must also be checked later. Do not treat allocation as provisioning.
2. Separately approve a bounded privileged identity setup operation to create exactly nine email-confirmed staging auth users without email delivery. Keep its credential in a separate short-lived setup process, absent from application and browser runtime.
3. Create primary, secondary and recovery organizations via authenticated creator provisioning RPCs. newOwner initially has no organization and creates a fourth through case 01. Recover owner has the incomplete marker. Confirm creator authorization and immutable identity protections remain active.
4. Invitation acceptance is unavailable. Proposed role bootstrap is narrowly scoped privileged insertion of membership rows for those nine exact verified user IDs/tenant IDs with normal triggers enabled, then owner-authorized role/status RPCs where supported. This SQL has NOT been implemented or reviewed for all trigger/grant interactions: a separate reviewed setup script is a blocker. If triggers reject bootstrap, stop; do not disable them or fabricate invited-user activation. Owner is MEMBER (not OWNER) in the second organization, whose sole owner is secondOwner. The nonmember has no membership. Suspended membership is not active.
5. Prepare bounded synthetic workflow definitions: one valid single-boundary workflow with no prior runs, one distinct sole pending approval/run for case 10, and a failed run with actor-attributed audit for display. Use authenticated owner/admin operations; do not insert arbitrary immutable audit evidence through a bypass. Exact snapshot/action/input values must be reviewed before setup. Keep only the intended request pending for each UI review.
6. Manifest must contain returned actual IDs, membership IDs, protected passwords, organization IDs, approval/run/workflow IDs, workflow input labels/values and the existing Business storage bucket. Assigned auth UUIDs may need mapping to returned IDs; validate and record that mapping before execution.
7. Record every created ID and exact storage object path in a separate non-secret run ledger, plus timestamp, actor and per-case outcomes. Capture new onboarding IDs and submitted form IDs after creation. Preserve all Stage 2 retained evidence. Never operate on wildcard tenant/email matches for cleanup.

Maximum initial scope: nine auth accounts; three provisioned organizations plus one UI-created organization; bounded per-role memberships (including owner's second-tenant MEMBER row); one invitation; two uploaded documents/objects; fixture workflow/run/step/approval rows plus a single executed workflow; one public submission; immutable audits created naturally. Final row counts depend on existing triggers and must be inventoried, not guessed.

Cleanup defaults to retention. No automated cleanup script is provided. Audit immutability and last-owner protection can prevent deletion. Later cleanup requires an exact approved ID/path allowlist, dependency inventory, ordinary authorized operations only and read-only postchecks. Do not delete auth users if cascades could erase evidence. Preserve failed-run data for diagnosis. Never disable triggers, truncate tables or broadly delete synthetic-looking records. Fresh IDs make reruns isolated, not automatically idempotent; no automatic retry.

## Readiness blockers and next authorization

1. Verify live staging URL/anon-key pairing and independent cluster identity through separately approved read-only preflight; opaque keys currently fail closed.
2. Complete/review the bounded privileged setup script and fixture definition snapshots; verify public submission schema compatibility without applying migrations.
3. Validate containment across actual Next workers and browser runtime with all live staging access disabled; add an OS egress boundary or demonstrate equivalent containment. Unexpected outbound attempts must fail the run even when application code catches the request error.
4. Complete narrower coverage gaps above before claiming comprehensive Stage 3B readiness. Runtime selectors and PostgREST shapes remain unverified.
5. Verify browser key availability in the future isolated build: lib/supabase/config.ts reads through an env parameter; static public-variable inlining must not be assumed to populate that alias. No browser build/session was exercised here.
6. After these gates, authorize exact synthetic provisioning IDs/operations separately, then authorize a controlled staging application launch and 18-case run with zero retries and stop on first unexpected failure. Keep unsupported features skipped and retained audit evidence intact. Opening the deliberately closed launcher/global-setup gates requires a reviewed change under that execution authorization.

**Recommended next authorization:** local-only runtime containment hardening/verification with staging transport disabled, plus read-only staging application credential/identity verification. Do not authorize a staging E2E run merely on the basis of this report. Privileged fixture setup and actual E2E execution need their own explicit bounded approval after blockers are resolved.

No production access, staging fixtures, migrations, deployment, real email/payment/AI, actual E2E, C02, commit or push occurred.

## Offline validation results

- Harness: 17 PASS / 0 FAIL / 0 SKIPPED.
- Existing selected Business, public directory/submissions, newsletter, Gmail draft and paid-placement suites: 161 PASS / 0 FAIL / 0 SKIPPED.
- TypeScript --noEmit --incremental false: passed.
- Playwright --list: 23 cases collected; no browser/global setup/application execution.
- Checksum: C01 unchanged, as recorded above.
- Browser installation and final file checks: see final verification entry below.

## Final verification

Chromium and Chrome Headless Shell 156.0.8078.4 (Playwright build 1248), FFmpeg 1013 and Winldd 1007 installed successfully; installer exit 0. No browser was launched. Final harness rerun: 17/17 passed. Final TypeScript and CJS syntax checks passed. Final case collection: 23. git diff --check passed. Authentication middleware is included in the isolated snapshot and its preservation is asserted by the poison-environment test. Migration checksum reverified unchanged. Total offline assertions/tests reported by the two selected runners: 178 passed, zero failed. Staging E2E readiness remains BLOCKED for the reasons above.
