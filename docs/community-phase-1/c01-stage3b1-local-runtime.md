# C01 Stage 3B.1 — local runtime containment verification

Date: 2026-10-19. Decision: **BLOCKED**. Local infrastructure probes ran successfully, but browser public configuration failed and complete process/network isolation is not established. Stage 3B E2E remains blocked.

## Scope and precheck

- Branch: codex/c01-business-authorization-hardening. HEAD: 38e1d208240045c80e1f2b2b44e28cdc9d36c0ec.
- Reviewed the progress recovery audit in the preceding chat and c01-stage3b0-harness.md. No separate saved recovery report was discovered.
- Existing C01 and unrelated working-tree changes preserved. No application source, package manifest/lockfile, SQL or migration was changed by this task.
- C01 migration SHA256 reverified before and after: 731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C.
- No Stage 1/2 reruns, database connections, staging fixtures, provider requests, production access, deployment, migrations, commits, pushes or C02 work.

## Exact files changed by this task

Modified existing harness files:
- tests/e2e/launch.cjs
- tests/e2e/browser.ts

Added implementation/tests:
- tests/e2e/local-runtime.cjs
- tests/e2e/runtime-preload.cjs
- tests/e2e/runtime-probe.cjs
- tests/e2e/runtime-templates.cjs
- tests/c01-runtime-containment.test.cjs

Added evidence/report files:
- docs/community-phase-1/c01-stage3b1-runtime-results.json
- docs/community-phase-1/c01-stage3b1-runtime-attempts.json
- docs/community-phase-1/c01-stage3b1-browser-bundle-scan.json
- docs/community-phase-1/c01-stage3b1-harness.log
- docs/community-phase-1/c01-stage3b1-regression.log
- docs/community-phase-1/c01-stage3b1-local-runtime.md

## Launcher implementation and environment

`node tests/e2e/launch.cjs --verify-local` constructs a fresh temporary application snapshot and starts Next 14.2.35 on 127.0.0.1:3101 with cwd in that snapshot. It does not start the repository-root application. The normal --start gate and Playwright global-setup refusal remain closed. Ambiguous --verify-local --start arguments were rejected without a launch. The local runner now returns a failing exit code for any non-PASS readiness decision.

No real configuration file or real key is read. The only Supabase URL is the approved reference https://oejxwsvlvelxmfbysjbx.supabase.co; the key is an explicit noncredential dummy. C01_E2E_STAGING_ENABLED remains 0. Provider values are known test dummies and AI mode is mock. A new environment is assembled from an allowlist; inherited NODE_OPTIONS, deployment settings and credentials are excluded.

Windows Node initially added profile/PATH variables despite an explicit environment. The initial allowlist rejected these before Next execution. The launcher now explicitly sets those Windows-required variables to blank, a minimal Node directory PATH or a fresh snapshot profile. Next's documented generated environment names are accepted separately. The preload validates baseline values and cwd in each observed Node process/thread. Deliberately poisoned child environments are rejected before entry, with names only recorded.

Root .env, .env.local, .env.development and .env.production files are absent in the running snapshot. .git, .vercel and Supabase CLI configuration are also absent. The original application middleware is preserved and invoked behind a test-only snapshot wrapper. Snapshot-only probe routes are injected; no probe route or middleware wrapper was added to production source.

The snapshot is not an OS filesystem boundary: reviewed code could explicitly read host paths, and dependencies are linked from shared node_modules. No real secret was observed in the running environment. This is a configuration/exclusion check, not a claim of inaccessible host secrets.

## Actual runtime evidence

The successful local probe session ran 2026-10-19 15:21:18–15:22:02 UTC+5. See c01-stage3b1-runtime-results.json for the complete sanitized event ledger and exact snapshot path.

| Process / realm | Evidence | Result |
|---|---|---|
| Main Next CLI | PID 14520, snapshot cwd, allowlisted startup environment, 20 probe checks | PASS for exercised checks |
| Next server worker | PID 20632, start-server.js, snapshot cwd and preload, 20 checks; local runtime route HTTP 200 | PASS for exercised checks |
| Node child process | PID 11544, runtime-probe.cjs, inherited verified policy/preload, 20 checks | PASS for exercised checks |
| Node worker thread | PID 20632/thread 1, startup policy verified, 20 checks | PASS for exercised checks |
| Middleware Edge realm | HTTP 200; original middleware invoked; unexpected remote fetch rejected; staging disabled, dummy key and no poison confirmed | PASS for exercised check |
| Chromium | Real headless browser loaded snapshot page, ran JS and rejected deliberate remote fetches | PARTIAL; public configuration failed |

Four probe-pass events contain 20 checks each: 80 logical Node probe checks total. This is the observed dev-runtime process topology, not proof for every lazy Next worker or production build. No worker configuration containing an unintended credential was allowed to run. All recorded Node processes exited, the browser was closed and a postcheck found no listener on port 3101. Temporary snapshots are retained with dummy-only configuration and local diagnostic logs.

## Provider and network results

Each of the four Node probe contexts rejected OpenAI, Gemini, transactional email, connector, webhook and staging REST fetches before transport. Gmail and Kit returned deterministic in-process mock responses. Stripe mock fetch and the real Stripe SDK configured with the fetch adapter returned a local synthetic checkout response. The application route also invoked MockModelRouter and confirmed mock usage.

Raw HTTP, HTTPS, TCP sockets, TLS, UDP, HTTP/2, DNS callback/promise APIs and arbitrary child spawning were rejected. Only literal loopback access to port 3101 is allowed by the Node transport guard. Literal loopback lookup is handled locally; remote hostname resolution is blocked. Known Next child forks and the exact probe worker entry are policy checked. Expected-denial accounting uses AsyncLocalStorage so unrelated concurrent failures cannot be mislabeled as probe denials. Unexpected Node denials are retained even when application code catches them. Final runtime ledger: zero unexpected Node transport blocks; four expected poisoned-child environment rejections.

Middleware uses a separate fetch realm. A test-only wrapper installed in the snapshot rejects remote fetches, and the lower-level Node socket/DNS guards provide an additional layer. This does not establish hostile-code resistance or coverage of all future framework realms/native addons.

Chromium was launched with an explicit Windows environment allowlist, a fresh profile, background networking/QUIC/DNS-prefetch suppression, host resolver denial rules and a loopback deny proxy. Browser HTTP requests are intercepted and only exact local GET paths are forwarded by the controller to 127.0.0.1:3101. Redirect responses are not followed remotely. WebSockets and service workers are blocked in this probe. No remote request is forwarded by the proxy. Separate local-only tests verified HTTP and CONNECT proxy requests return 403. The runtime browser session recorded zero proxy requests, so those runtime proxy paths were not exercised by Chromium itself.

Windows firewall profiles are enabled but default outbound actions are NotConfigured. No program-specific egress rule or container/network namespace was established. Docker was unavailable; the WSL executable did not provide a usable installed Linux runtime. No host firewall settings were changed. Native browser descendant environments were not independently inspected. Browser background/native traffic and arbitrary native addons are therefore not proven isolated at OS level. **Do not claim complete network containment.**

## Browser configuration failure and rejected requests

The browser executed the existing lib/supabase/config.ts helpers. They returned the probe's public-config-unavailable result: the env-parameter alias does not receive Next's static public-variable inlining. The generated client chunks contained no intended dummy key or Supabase URL. This confirms the previously documented configuration blocker; no application helper change was made under this local containment task.

A local static scan of the generated client chunks found zero foreign Supabase URLs and zero inspected credential-pattern matches. This is a bounded pattern scan, not exhaustive proof of all possible secret formats. Provider/service-role values were absent from the observed browser configuration.

The browser rejected all three deliberate fetch probes: an unexpected host, staging Supabase REST, and Stripe. It also rejected existing application layout requests to googletagmanager, googlesyndication and external badge hosts (truetier, launchbuff, launchnest, daniellaunches, launchstag, findly.tools, startupbase and sellwithboost). None were forwarded to those hosts. These application-originated attempts are reported as unexpected activity, not counted as successful application readiness. The runner now explicitly treats such hosts as readiness blockers even if public configuration is later fixed.

## Validation results

| Validation | Result |
|---|---|
| Existing harness plus new isolation/proxy tests | 21 PASS, 0 FAIL, 0 SKIPPED |
| Selected offline Business/C01/public/provider-mock regression suites | 162 PASS, 0 FAIL, 0 SKIPPED |
| Total offline tests in those two runners | 183 PASS |
| Runtime Node probes | 80 logical checks across four observed contexts |
| Middleware local probe | PASS |
| Browser local-only remote-fetch rejection probes | 3/3 rejected |
| Browser public configuration | FAIL / unavailable |
| TypeScript --noEmit --incremental false | Passed, no diagnostics |
| Changed/new CJS syntax checks | Passed |
| git diff --check | Passed |
| Migration checksum | Unchanged |
| Staging E2E, SQL and fixture execution | Not run |

Earlier attempts are preserved in c01-stage3b1-runtime-attempts.json: Windows environment injection, undefined optional Next fork properties, literal-loopback DNS rejection, private-folder probe route naming (404), and Next-generated environment names rejected during child verification. These were local harness issues, not database or application authorization failures. The final runtime session reached and completed the browser checks. Subsequent changes hardened ambiguous-argument rejection, non-PASS exit status, local proxy testability and unexpected-browser-host classification; proxy behavior was checked offline without repeating the completed browser flow.

## Remaining blockers and recommended next authorization

1. Authorize the minimal application public-config helper correction and verify it in a fresh isolated browser runtime. Keep explicit env injection for unit tests while using direct process.env.NEXT_PUBLIC_* references for the browser default path.
2. Review/suppress external analytics, advertising and badge assets in the isolated snapshot, or explicitly inventory their denied attempts; do not silently ignore unexpected requests. The guards already reject them.
3. Establish an appropriate OS/container egress boundary and independently verify native browser descendant configuration, or explicitly accept/document a narrower reviewed-application containment boundary. This report does not certify an equivalent OS boundary.
4. Revalidate only the changed/unresolved runtime boundaries. Do not repeat Stage 1 or Stage 2.

Do not authorize staging E2E on the basis of these results. Live staging URL/key and independent identity verification, fixture provisioning-script review and exact fixture setup remain separate future authorizations. No real key was verified and no fixtures were created here. Keep the staging transport and E2E execution gates closed.

Stopped after local implementation, verification and this report.
