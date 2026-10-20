# C01 Stage 3B.2B restricted-runtime integration report

Decision: BLOCKED. Local assessment and fixture design completed; restricted runtime integration and independent containment verification could not proceed. No Next.js or Chromium runtime was launched in this stage. No security gate was downgraded.

## Repository and scope

Branch: codex/c01-business-authorization-hardening. HEAD: 38e1d208240045c80e1f2b2b44e28cdc9d36c0ec. Existing dirty application tree preserved. All 21 harness source hashes match c01-stage3b2a-change-manifest.json. No application, harness, package or migration changes were made. No staging/production requests, identities, memberships, deployments, commits or pushes.

Migration SHA256: 731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C (unchanged).

## Environment selection and stop condition

Reviewed c01-stage3b2a-runtime-requirements.md and shared runtime-config, preload, runner, browser policy and monitor tests. Appropriate target remains an operator-provided approved disposable VM/container with independently managed default-deny egress covering controller and all descendants. For this local gate it must have NO external exception; loopback must work inside the boundary. A future exact staging-origin exception requires separate authorization and fresh verification.

Current read-only inventory: docker/podman/nerdctl/ctr/Get-VM/WindowsSandbox unavailable; WSL optional feature disabled; Containers, Sandbox and Hyper-V features disabled; VirtualMachinePlatform enabled but hypervisor absent and CPU firmware virtualization disabled. wsl/hcsdiag/HNS command availability alone does not establish a running boundary. HCS returned no system listing; HNS returned no networks. Evidence is in c01-stage3b2b-environment-evidence.json. No remote approved environment was supplied or inspected; availability elsewhere is UNKNOWN.

Because a required boundary cannot independently be verified, runtime integration stopped before launching Next.js/Chromium. No infrastructure was installed or activated, and no host networking settings were changed. An unrestricted-host adapter would not satisfy this contract; no such adapter was added.

## Control evidence

| Control | Current evidence | Decision / remaining work |
|---|---|---|
| Independent egress, DNS, raw sockets, alternate transports | No usable enforcing boundary identified | BLOCKED; operator must supply policy and management-plane evidence, then controlled deny-only probes |
| Main/worker process containment | Existing offline environment/preload tests pass | PARTIAL; run full process family inside approved boundary |
| Descendant termination and shutdown | Offline supervisor test terminates offending Node process and registered sibling, fences later scenarios | PARTIAL; native Chromium descendants and boundary-scoped teardown remain unverified |
| Credential separation | Offline snapshot tests reject poisoned env, exclude environment files, use dummy config; runner/app separation tested | PARTIAL; native descendant environment comparison remains unverified |
| Browser network policy | Shared browser policy simulated in offline tests | PARTIAL; no Chromium executed this stage; independent native enforcement remains BLOCKED |
| Staging transport | Snapshot flag remains 0; opt-in rejected; global execution/provisioning gates closed in tests | PASS for offline gate checks only |

Historical Stage 3B.2A 80 Node runtime checks / 3 browser rejections are not new evidence and do not prove an independent boundary. Point-in-time connection lists, proxy arguments and JavaScript interception are insufficient for that claim.

## Reproducible checks executed

From repository root:

```powershell
node --test tests/c01-e2e-harness.test.cjs tests/c01-runtime-containment.test.cjs tests/c01-restricted-harness.test.cjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
git diff --check
Get-FileHash supabase/migrations/202610140001_business_authorization_hardening.sql -Algorithm SHA256
Get-Command docker,podman,nerdctl,ctr,Get-VM,WindowsSandbox -ErrorAction SilentlyContinue
Get-CimInstance Win32_ComputerSystem | Select-Object HypervisorPresent
Get-CimInstance Win32_Processor | Select-Object VirtualizationFirmwareEnabled
Get-CimInstance Win32_OptionalFeature | Where-Object Name -in @('Microsoft-Windows-Subsystem-Linux','Containers','Containers-DisposableClientVM','Microsoft-Hyper-V-All','VirtualMachinePlatform') | Select-Object Name,InstallState
hcsdiag list
Get-HnsNetwork
```

Results: 33/33 offline tests PASS (0 skipped), TypeScript exit 0, diff check exit 0 (existing LF/CRLF warning only). Logs: c01-stage3b2b-offline.log and c01-stage3b2b-typecheck.log. Unit tests use dummy snapshots, controlled local Node children and loopback test doubles; they do not run application browser E2E. No Stage 1/2 SQL tests were repeated. Temporary dummy test snapshots may remain under the harness's existing temp directory behavior; no broad cleanup was attempted.

## Next authorization gate

Operator: identify/provide an approved existing isolated runtime and its scoped network/process policy. Supply an evidence route for native descendant environment comparison without logging values, default-deny policy inspection, controlled deny probes, and scoped whole-runtime teardown. If new infrastructure or firmware changes are needed, request separate explicit operator authorization; none is implied here.

Then authorize local dummy-only integration and deny-only verification inside that named boundary. Require policy/configuration hashes, controller/Next/Playwright/Chromium PID ancestry, sanitized environment-key and expected-value comparisons, independent deny counters/logs for TCP/UDP/DNS/alternate transports, unexpected-attempt abort and subsequent no-descendant shutdown evidence. No actual external provider endpoint may be contacted for probes. No staging allowlist or identity preflight is part of that authorization.

Fixture activation design and blocker register are separate artifacts. Staging preflight, fixture writes and E2E remain closed. STOP after this report.
