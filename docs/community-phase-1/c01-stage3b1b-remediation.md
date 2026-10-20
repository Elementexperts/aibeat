# C01 Stage 3B.1B — browser configuration and containment remediation

Date: 2026-10-19. Overall decision: **BLOCKED**.

The browser configuration and snapshot layout blockers are resolved and actual local runtime checks passed. Independent OS/container egress isolation and independent Chromium descendant environment verification remain BLOCKED. Stage 3B staging E2E remains disabled.

## 1. Scope and precheck

Expected branch confirmed: codex/c01-business-authorization-hardening. HEAD remains 38e1d208240045c80e1f2b2b44e28cdc9d36c0ec. Reviewed c01-stage3b0-harness.md and c01-stage3b1-local-runtime.md. Existing application and unrelated working-tree modifications were preserved.

No staging/production connections, database mutations, account provisioning, migrations, deployment, emails, payments, real external-provider calls, C02 work, commits or pushes occurred. Only local infrastructure probes ran; no Business E2E spec was executed. No host firewall rule, privileged component or persistent network setting was changed.

C01 migration checksum remains:
731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C

## 2. Exact files modified or added in this task

Modified existing files:
- lib/supabase/config.ts
- tests/e2e/local-runtime.cjs
- tests/e2e/runtime-templates.cjs
- tests/c01-runtime-containment.test.cjs

Added implementation/tests:
- tests/e2e/runtime-layout.cjs
- tests/e2e/runtime-browser-inspection.cjs
- tests/c01-supabase-config.test.ts

Added evidence/report files:
- docs/community-phase-1/c01-stage3b1b-runtime-results.json
- docs/community-phase-1/c01-stage3b1b-runtime-attempts.json
- docs/community-phase-1/c01-stage3b1b-network-assessment.json
- docs/community-phase-1/c01-stage3b1b-browser-bundle-scan.json
- docs/community-phase-1/c01-stage3b1b-static-checks.json
- docs/community-phase-1/c01-stage3b1b-harness.log
- docs/community-phase-1/c01-stage3b1b-regression.log
- docs/community-phase-1/c01-stage3b1b-config-recheck.log
- docs/community-phase-1/c01-stage3b1b-remediation.md

Prior Stage 3B.1 evidence was preserved; the runner now writes separate 3B.1B artifacts.

## 3. Browser configuration root cause and smallest correction

The old helper defaulted an env parameter to process.env and then read env.NEXT_PUBLIC_SUPABASE_*. Next's static browser substitution does not populate this alias. The preceding real browser probe reported public-config-unavailable, and the preceding generated chunks lacked the intended public values.

The correction keeps explicit env injection unchanged but uses direct process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY references when no env object is supplied. Required-value errors remain unchanged; there is no service-role fallback or hardcoded production credential. Existing createBrowserClient initialization is unchanged. No database migration or other application behavior was modified.

This was a variable-substitution issue, not a missing snapshot variable. The snapshot environment already supplied the intended values. The corrected client bundle now contains them and initialization succeeds.

## 4. Actual browser verification

The final local session ran 2026-10-19 15:46:12–15:47:02 UTC+5. It launched a fresh Next snapshot at 127.0.0.1:3101 with no repository env files, dummy-only configuration, mock AI and C01_E2E_STAGING_ENABLED=0. No protected configuration file or real key was used.

The browser executed the real configuration helpers and real createClient factory. Results:
- Public URL resolved to https://oejxwsvlvelxmfbysjbx.supabase.co.
- Public key resolved to the explicit noncredential dummy.
- Supabase client initialized and the browser singleton behavior was preserved.
- Service-role and private Gmail configuration were absent in the browser probe.
- All three deliberate browser fetch probes were rejected: unexpected example.invalid host, staging Supabase REST and Stripe.
- No unexpected remote host was requested by the page after snapshot remediation. The local HMR WebSocket was deliberately rejected by the probe's policy.

The seven generated client chunks were inspected locally. The approved URL and dummy key were present; no inspected credential pattern or unexpected configured Supabase project URL was found. Three other URL strings were inspected and classified as SDK documentation examples: example.supabase.co, myproject.supabase.co and xyzcompany.supabase.co. They are not runtime configuration or observed destinations. The bundle scan is bounded evidence, not an exhaustive secret-format audit.

## 5. Unexpected layout requests and test-only remediation

Sources:
- app/layout.tsx unconditionally renders the Google Tag Manager script, an inline analytics initializer and the Google advertising script; the measurement ID has a production-oriented default even without inherited credentials.
- components/layout/Footer.tsx renders eight externally hosted badge image sources.
- PublicAnalytics installs click-event forwarding to window.gtag. Its mere presence does not itself create the initial script requests.

A snapshot-only AST adapter suppresses four layout nodes: the two Next Script nodes, advertising script and PublicAnalytics mount. It replaces the eight badge image sources with a generated local SVG while preserving anchor destinations and the rest of the footer. Structured-data markup is retained. Exact expected node/source counts fail closed on source drift.

Production app/layout.tsx, Footer.tsx and PublicAnalytics.tsx were not edited. An offline test hashes the source layout/footer before and after adapter execution and verifies unchanged production files, preserved badge links and structured data, and failure on an already-modified snapshot.

The final browser runtime recorded no analytics, advertising or badge-host request attempts. Browser routing still rejects and records unexpected hosts; Node denials are logged even if caught by application code. Deliberate rejection probes were not silently counted as application requests.

## 6. Network isolation mechanism and evidence

Existing application-level restrictions remain active: allowlisted environments, snapshot cwd, preloaded Node transport/child-process guards, a separate middleware realm wrapper, browser routing, disabled service workers/WebSockets, a loopback deny proxy, disabled QUIC/background networking and resolver-denial flags.

Eighty logical Node checks passed again across the main CLI, Next server child, probe child and worker thread. Raw HTTP(S), TCP, TLS, UDP, HTTP/2, DNS and arbitrary child spawning were rejected. Gmail/Kit/Stripe mocks and the real Stripe SDK through the mock fetch transport passed; the route also confirmed mock AI. Middleware rejected its remote fetch probe. Zero unexpected Node transport denials were recorded.

The independent-boundary assessment is BLOCKED:
- No docker, podman, nerdctl or ctr command was available.
- Windows Sandbox executable was absent.
- Host compute/network services were running, but hcsdiag listed no running compute system; those services alone are not an isolated runtime.
- Windows firewall profiles were enabled with DefaultOutboundAction NotConfigured. No task-specific OS egress restriction was established.
- No privileged runtime was installed and no persistent host network policy was modified.

The deny proxy is an additional transport control, not a claim of OS-enforced no-egress. Its local HTTP and CONNECT denial tests passed. Browser configuration cannot prove that every native transport obeys it. Existing WSL limitations remain as documented in Stage 3B.1; this task did not install or enable a distribution.

## 7. Chromium descendant evidence

CDP and an independent Windows CIM process-tree query agreed on these processes during the final browser session:

| PID | Observed role | Parent |
|---|---|---|
| 6192 | Chromium Headless Shell browser | Controller 16180 |
| 20724 | Renderer | 6192 |
| 5828 | GPU process | 6192 |
| 19460 | Utility: network.mojom.NetworkService | 6192 |

No additional descendant was observed at that snapshot. This does not prove that no short-lived descendant existed elsewhere in the lifecycle.

Root command-line inspection confirmed the deny proxy, disabled loopback proxy bypass, resolver denial, background-network suppression and disabled QUIC. Windows inspection independently confirmed readable command lines and the root proxy/resolver switches; the network utility also had a resolver switch. Absence of a proxy switch on a child is not proof of absent proxy policy because Chromium can pass configuration internally; equally, root flags alone do not prove descendant enforcement.

No owned TCP connection was observed at the inspection instant. This is a point-in-time observation, not a packet capture or proof of prevention. Raw command lines and environment values were not logged.

The launch environment was explicitly allowlisted, but no supported independent reader was configured to inspect each native descendant's environment. EnvironmentIndependentlyRead is false for all four observed processes. Descendant containment therefore remains **BLOCKED**, rather than inferred from the parent launch contract.

After the run, all recorded Next/probe/Chromium processes had exited and port 3101 had no listener.

## 8. Validation results

| Check | Result |
|---|---|
| Selected offline regressions plus three new configuration tests | 165 PASS, 0 FAIL, 0 SKIPPED |
| Harness/isolation/proxy/layout tests | 22 PASS, 0 FAIL, 0 SKIPPED |
| Unique offline total across those runners | 187 PASS |
| Focused configuration test recheck after fixture typing correction | 3 PASS; not added again to the total |
| Node runtime probe checks | 80 passed across four contexts |
| Middleware remote rejection | PASS |
| Browser configuration and client initialization | PASS |
| Browser deliberate remote-fetch rejection | 3/3 rejected |
| Unexpected remote layout requests | Zero |
| Final TypeScript --noEmit --incremental false | Exit 0 |
| Changed/new CJS syntax checks | Exit 0 |
| git diff --check | Exit 0 |
| Migration integrity | Exact expected SHA256 |
| Independent egress / native descendant environments | BLOCKED |

Initial local issues were retained honestly: Browser.getBrowserCommandLine first refused because --enable-automation was absent; the test launch now supplies it. TypeScript initially rejected new test objects missing Next's required NODE_ENV field; only the fixture typing was corrected, then focused tests and TypeScript passed. There was no staging/provider execution or retry.

## 9. Remaining blockers and exact operator requirements

No browser configuration or layout-request blocker remains in the exercised local flow. Two local blockers remain:
1. Independent OS/container egress restriction for all Node and Chromium processes.
2. Independent descendant environment verification or an equivalently demonstrable credential-free isolated guest boundary.

The operator must provide a preconfigured disposable VM with its external NIC disabled, or an existing container runtime capable of running the required Node/Chromium workload with network disabled. Put all tested processes inside that boundary, use localhost within it, and supply only the snapshot/dependencies and dummy configuration; do not mount host credential directories or repository environment files. Also provide a supported read-only process-environment inspection mechanism or verifiable equivalent isolation evidence.

Any privileged runtime installation or host firewall modification requires separate explicit authorization. No such action was attempted here.

## 10. Next required authorization

Once an appropriate environment is provided, authorize only local independent-boundary and descendant-verification checks there, with staging transport disabled. Reuse the completed browser correction and layout adapter; do not repeat Stage 1/2.

This report does not authorize staging URL/key verification, synthetic provisioning or staging E2E. Those remain separately gated future work. Stop after this report.
