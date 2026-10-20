# C01 Stage 3B.1C — isolated execution environment assessment

Date: 2026-10-19. Decision: **BLOCKED / NOT READY FOR EXECUTION**.

Assessment and preparation only. No VM, container, WSL distribution, Sandbox or browser was launched. No infrastructure was installed/activated and no Windows network/firewall setting was changed. No runtime tests were repeated. No database, staging, production or provider connection was made; public Microsoft/Docker documentation was consulted for option semantics.

## 1. Current environment and evidence

Branch: codex/c01-business-authorization-hardening. HEAD: 38e1d208240045c80e1f2b2b44e28cdc9d36c0ec. Existing working-tree changes preserved. C01 SHA256 remains 731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C.

Read-only inventory is saved in c01-stage3b1c-environment-inventory.json.

| Item | Observed state |
|---|---|
| OS/hardware | Windows 10 Pro x64, build 19045; HP ProBook 440 G3; approximately 7.9 GiB RAM |
| Hypervisor | HypervisorPresent=false |
| CPU virtualization | Firmware virtualization reported false; VM monitor and SLAT support reported true |
| Current shell | Elevated; elevation does not authorize infrastructure changes |
| Docker/Podman/nerdctl/ctr | Not found in PATH; Docker Desktop absent at its standard executable path |
| VM products | VBoxManage, vmrun and QEMU not found in PATH; no virtualization/container product found in checked uninstall registries; standard VirtualBox/VMware inventory files absent |
| WSL | wsl.exe exists, but Windows Subsystem for Linux feature is disabled; no distributions registered for this user |
| Virtual Machine Platform | Enabled, but not evidence of an active hypervisor or runnable guest |
| Hyper-V | Hyper-V features disabled; Get-VM unavailable; virtualization CIM inventory unavailable, not a successful zero-VM enumeration |
| Windows Sandbox / Containers | Features disabled; Sandbox executable absent |
| HCS/HNS | vmcompute and hns running; hcsdiag listed no running compute systems; HNS network query succeeded with zero networks |
| Host firewall | Profiles enabled; DefaultOutboundAction=NotConfigured; no dedicated C01 egress boundary established |
| Repository definitions | No Docker/devcontainer/WSB/VMX/VBOX definition found by the scoped rg search |
| Existing approved external environment | UNKNOWN; none identified or contacted |

These checks establish no usable local boundary. They do not prove that no unregistered VM disk or portable runtime exists anywhere on disk, nor that an operator has no environment elsewhere. No full-disk VM-image search or remote host discovery was performed.

Microsoft documents feature state 1 as enabled and 2 as disabled: [Win32_OptionalFeature](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/win32-optionalfeature).

## 2. Isolation options

| Option | Dependencies and privileges | Egress/localhost | Chromium descendants and verification | Removal/status |
|---|---|---|---|---|
| A. Network-disabled Linux container | Existing approved Linux engine; reviewed image with Node, Linux-native dependencies, Chromium and libraries already installed. Engine access can carry elevated authority. Installing a local Windows engine would additionally need virtualization prerequisites and separate approval. | --network none creates loopback only. Run Next, probes and Chromium inside the same container; publish no port. | All descendants share the container network boundary unless namespace/privileged escape is enabled. Independently inspect NetworkMode, interfaces/routes, each PID's network namespace and /proc environment. No privileged mode, Docker socket, host networking or host credential mounts. | Export evidence, remove the exact stopped test container/temporary volume. No global prune or engine uninstall. Not available here; current Windows-specific inspector/dependencies also need a reviewed Linux adaptation. |
| B. Disposable network-disabled Windows VM | Existing approved hypervisor on a virtualization-ready host, clean Windows x64 guest, offline Node/dependency/browser artifacts and a supported native environment inspector. Host VM management normally requires admin or delegated VM-management rights. Guest workload need not change host policy. | Configure the disposable clone with zero network adapters before start. All tests use 127.0.0.1 inside the guest; the host cannot browse it over a published port. | Browser, renderer, utility and other children have no guest NIC path. Independently verify hypervisor device configuration and guest routes, raw unhooked egress rejection and native process environments. Parent flags alone do not prove descendant configuration. | Export sanitized evidence, shut down, remove only the identified disposable clone/its owned disks. Preserve the base image. No host networking rollback is needed if it was never changed. Recommended conditional option; no such ready VM was identified here. |
| C. Existing approved isolated development environment | Operator must identify owner, location, access method, runtime versions and independent boundary evidence. Could be an already-approved VM/container. Privileges depend on that environment. | Must provide genuine deny-egress, not just a browser proxy or fetch shim. Keep app/browser together on its own loopback. | Require equivalent process membership, environment and network-policy evidence. A remote shell or ordinary devcontainer alone is insufficient. | Owner-approved exact-instance teardown after evidence export. Availability UNKNOWN; not assumed approved or ready. |
| Conditional Windows Sandbox | Requires pre-enabled Sandbox, functioning virtualization and offline Windows artifacts. Enabling it here would require separate admin/firmware/reboot work. | Custom .wsb can disable networking; localhost remains within the guest. Read-only input mapping plus a dedicated evidence output location is preferable to mapping the repository/home directory. | Guest-wide no-network boundary plus supported process inspection; mapped folders remain a host access path. | Closing discards guest contents; export evidence first. Not installed/enabled here. |

Docker's none driver supplies only loopback, so application and browser must both run inside it: [Docker documentation](https://docs.docker.com/engine/network/drivers/none/). Windows Sandbox defaults to networking enabled; explicit disabling and read-only mapped folders are supported: [Microsoft Sandbox configuration](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-configure-using-wsb-file).

## 3. Recommended approach and required operator actions

Use an **operator-provided disposable Windows x64 VM on an already virtualization-ready host, with zero network adapters**, preferably a clone of an existing approved clean image. This is a conditional recommendation, not a claim that such a VM already exists. It reuses the tested Windows harness and native artifacts without porting it or enabling infrastructure on this laptop.

The operator must:
1. Identify the host, hypervisor, exact disposable VM name/ID and owner. Confirm it is a dedicated clone, not an existing production/shared VM.
2. Provide that clone powered off with zero network adapters, no host credential/home mounts, no host-network proxy/forwarding, and no clipboard/drive redirection carrying credentials.
3. Provide offline Windows x64 Node 22.23.2, the reviewed project dependencies including Next/Playwright 1.64.1, and Chromium build 1248 plus its supporting files. No npm/browser downloads during the isolated run.
4. Provide a read-only, supported native process-environment inspection method for browser, renderer, GPU and utility PIDs, or propose equivalent independently verifiable evidence for review. No such reader is currently supplied; this is a real readiness blocker.
5. Approve only the exact disposable instance, minimal sanitized payload and bounded evidence export destination, then separately authorize execution of the plan below.

If no existing approved host/image is available, the operator must arrange one. Installing infrastructure on this laptop is not the next automatic action: it would first require explicit authorization for firmware virtualization, appropriate Windows features/runtime installation and any reboot. Nothing in this assessment grants that authorization.

## 4. Expected file changes

This task created only:
- docs/community-phase-1/c01-stage3b1c-environment-inventory.json
- docs/community-phase-1/c01-stage3b1c-assessment.md

No application, harness, migration, package or infrastructure configuration was changed.

Future separately authorized preparation would produce a manifest/checksummed sanitized payload and guest evidence. It also needs a reviewed extension of tests/e2e/runtime-browser-inspection.cjs for the chosen native environment reader and tests/e2e/local-runtime.cjs to validate independent evidence before clearing the current hardcoded BLOCKED decision. No environment variable or operator assertion alone may change the decision to PASS.

## 5. Bounded execution plan — NOT EXECUTED

1. Confirm the exact dedicated clone and no-NIC configuration while powered off. Reject an unknown/shared VM, connected or merely assumed-disconnected network, and missing management evidence.
2. Transfer a reviewed offline payload using read-only media; boot only after authorization. Copy it into C:\C01\source inside the guest and detach input media if practical.
3. Payload contains only allowlisted application/configuration files, tests/e2e, verified dependency files and portable runtime/browser artifacts. Exclude .git, .env*, .vercel, Supabase CLI links/credentials, secret/key files, browser profiles, fixture manifests and host homes. Reuse snapshot filtering, but do not copy its host node_modules junction: dependency artifacts must be actual files with no links back to the host. Create docs/community-phase-1 in the guest source for evidence. Transfer no Stage 1/2 retained fixture credentials.
4. Verify payload hashes, platform/version compatibility, absent env files, no guest NIC/default route and no host proxy/tunnel. Reconfirm migration SHA256. No package installation, migration or live credential verification.
5. Run an unpreloaded raw network denial check after the no-NIC preflight, using documentation-only IP addresses. A timeout is inconclusive, not PASS. Record OS route-denial errors and independent hypervisor evidence; do not rely on the Node preload for this test.
6. Run the existing isolated local Next launcher with dummy public key, mock providers and staging transport disabled. It starts a new guest-local snapshot, not a repository-root normal dev server.
7. The runner launches Chromium inside the same guest. A reviewed inspection checkpoint must keep it alive long enough for the independent environment reader to check all observed descendants. Compare only allowed names/values and record booleans or digests, never plaintext secrets.
8. Verify browser public configuration, expected remote-request rejection, descendant membership and guest-wide network restrictions. Stop if any unintended configuration appears, a nonlocal connection succeeds or a descendant cannot be inspected. Do not run Business staging E2E or provision fixtures.
9. Collect sanitized JSON/logs, source/artifact hashes, hypervisor configuration, guest route/interface evidence, raw egress-denial results and process environment comparison outcomes. Export only reviewed evidence through an exact dedicated transfer artifact, not a host network share.
10. Confirm Node/Chromium shutdown, shut down the guest, retain evidence and remove only the disposable clone/its explicitly owned disks under the operator's approved disposal scope. Preserve base images and repository files.

## 6. Exact verification commands — future execution only

The following commands were **not run**. They assume the operator selects an existing Hyper-V host and a prepared Windows guest. Other hypervisors need their own reviewed equivalent; do not install Hyper-V here to make these commands work.

On the operator's existing Hyper-V host, read-only preflight:

```powershell
$c01VmName = Read-Host 'Exact approved disposable C01 VM name'
$c01Vm = Get-VM -Name $c01VmName -ErrorAction Stop
$c01Vm | Select-Object Name,Id,State,Path
if ($c01Vm.State -ne 'Off') { throw 'Provide the dedicated clone powered off' }
$c01Adapters = @(Get-VMNetworkAdapter -VMName $c01VmName -ErrorAction Stop)
$c01Adapters | Select-Object Name,SwitchName,MacAddress,Status
if ($c01Adapters.Count -ne 0) { throw 'STOP: provide a disposable clone with zero NICs' }
```

Only after separate launch authorization, start that approved clone (not executed here):

```powershell
Start-VM -VM $c01Vm
```

On that host after launch, repeat the independent zero-NIC assertion and save its result. Disconnect-VMNetworkAdapter is a documented alternative for operator-managed guests, but this plan requires zero adapters to reduce accidental reconnection risk: [Microsoft command reference](https://learn.microsoft.com/en-us/powershell/module/hyper-v/disconnect-vmnetworkadapter?view=windowsserver2025-ps).

Inside the guest, verify no nonloopback route/active adapter and no inherited preload:

```powershell
Get-NetAdapter -IncludeHidden | Select-Object Name,Status,InterfaceDescription
Get-NetIPConfiguration
Get-NetRoute | Select-Object InterfaceAlias,DestinationPrefix,NextHop,RouteMetric
if (@(Get-NetAdapter -IncludeHidden | Where-Object Status -eq 'Up').Count) {
  throw 'STOP: review an active guest adapter before any probe'
}
if (@(Get-NetRoute | Where-Object DestinationPrefix -in @('0.0.0.0/0','::/0')).Count) {
  throw 'STOP: default route exists'
}
if ($env:NODE_OPTIONS) { throw 'STOP: raw network verifier must have no preload' }
```

Read-only artifact/version checks inside the prepared guest:

```powershell
Set-Location -LiteralPath C:\C01\source
& C:\C01\runtime\node.exe --version
& C:\C01\runtime\node.exe -p "require('./node_modules/@playwright/test/package.json').version"
Get-FileHash -LiteralPath C:\C01\source\package-lock.json -Algorithm SHA256
if (@(Get-ChildItem -LiteralPath C:\C01\source -Force -File -Filter '.env*').Count) {
  throw 'STOP: payload contains root environment files'
}
```

Also verify the transferred dependency/browser manifest and scan nested allowlisted source roots. A root-only env check does not replace snapshot filtering or a payload manifest.

Raw OS-route denial, independent of application hooks, inside the no-NIC guest:

```powershell
& C:\C01\runtime\node.exe -e 'const net=require("node:net"); const s=net.connect({host:"198.51.100.1",port:443}); s.setTimeout(2000); s.once("connect",()=>{console.log("FAIL: connection succeeded");process.exitCode=1;s.destroy()}); s.once("error",e=>{const denied=["ENETUNREACH","EHOSTUNREACH"].includes(e.code);console.log(JSON.stringify({code:e.code,routeDenied:denied}));process.exitCode=denied?0:2}); s.once("timeout",()=>{console.log("BLOCKED: timeout is inconclusive");process.exitCode=2;s.destroy()})'
```

198.51.100.1 is a documentation-only test address, not a provider/staging endpoint. Run this only after independent zero-NIC verification; do not substitute a public service. Failure of one connection alone is not complete isolation proof: the no-NIC hypervisor configuration is the independent boundary evidence for every protocol/process.

Local runner inside the prepared guest, only after its independent-inspector extension is reviewed:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\C01\browsers'
& C:\C01\runtime\node.exe C:\C01\source\tests\e2e\launch.cjs --verify-local
Get-Content -LiteralPath C:\C01\source\docs\community-phase-1\c01-stage3b1b-runtime-results.json -Raw
```

The current runner intentionally exits nonzero for BLOCKED even when its application-level checks pass. Do not reinterpret that as PASS or remove the gate without independent evidence. Its browser inspector already collects sanitized CIM/CDP topology; it does not yet read descendant environments. The exact native environment-reader invocation cannot be supplied until an approved reader is selected and integrated. This missing command is explicitly a preparation blocker, not an implied completed check.

Guest network/process evidence during the inspection checkpoint:

```powershell
Get-CimInstance Win32_Process |
  Where-Object Name -in @('node.exe','chrome.exe','chrome-headless-shell.exe') |
  Select-Object Name,ProcessId,ParentProcessId
Get-NetTCPConnection | Select-Object OwningProcess,State,LocalAddress,RemoteAddress
Get-NetRoute | Select-Object InterfaceAlias,DestinationPrefix,NextHop
```

Shut down from inside the guest after evidence export (future authorized action):

```powershell
Stop-Computer
```

On the management host, verify the named clone is Off. Do not use a wildcard VM deletion, Remove-VM or recursive disk deletion as an automatic cleanup command; the operator must confirm exact clone/disk ownership before disposal.

Container alternative verification, only if an approved Linux engine/image is later provided:

```sh
# These inspect commands assume an already-approved exact test container name.
docker inspect c01-containment --format '{{.HostConfig.NetworkMode}}'
docker exec c01-containment ip -brief address
docker exec c01-containment ip route
docker exec c01-containment ip -6 route
```

Required results: network mode none, loopback only and no external route. A future Linux inspector can compare /proc/<pid>/ns/net and /proc/<pid>/environ for exact browser PIDs without printing values. The current Windows inspector is not that implementation. An image must already contain all dependencies; no image pull, npm install, host-network mount or Docker socket exposure is authorized here.

## 7. Security, rollback and readiness

Preserve application-level guards as defense in depth inside the independently isolated guest. Keep staging transport disabled and use only dummy credentials. Verify both management-plane configuration and guest runtime evidence; do not substitute a failed fetch, a proxy setting or an inherited environment assertion for boundary proof. Native environment inspection may require guest elevation; guest authority must not imply host administrator access.

Rollback is exact-instance shutdown/disposal after evidence export. Since this assessment changed no infrastructure, there is no host networking/feature rollback to perform. Future payload/guest evidence is disposable and must not erase existing Stage 1/2 retained staging evidence or local reports.

**Ready for execution: NO.** Required host/guest, offline artifacts, native inspector and final launch authorization are not supplied. Current browser/configuration and Stage 1/2 results need not be repeated to assess infrastructure.

**Next required authorization:** after the operator identifies and prepares the exact isolated VM/environment, authorize bounded payload preparation, native-inspector integration and local-only verification in that environment. No staging credentials, staging E2E, provisioning, installation or host firewall changes are included.

Stopped after assessment and plan preparation.
