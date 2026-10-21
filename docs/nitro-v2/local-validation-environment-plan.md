# Reusable local validation environment plan

Date: 2026-10-21. Decision: **SETUP REQUIRED**.

**Preferred environment: one disposable Ubuntu 24.04 LTS x86-64 VM on an operator-approved, supported Hyper-V host, with zero virtual network adapters.** Reuse a pinned, secret-free base image and create a disposable clone for each validation run. Keep build, application, browser and later local database tooling inside that guest. No usable instance or host has yet been supplied or verified.

This is an assessment and proposed procedure only. No installation, firewall change, VM/container creation or launch, application build/test, browser execution, database access, push, deployment or commit occurred. Public vendor documentation was read; no application/provider API was called. The only added file is this plan in the Nitro worktree. C01 remains paused.

## 1. Available infrastructure

Current Nitro branch: `codex/nitro-v2-directory-discovery`, HEAD/base `d5cc3b9013accd9a17a5fa132c9dd43d926ab255`. Existing Nitro source changes and reports remain in place. C01 remains at `8e395c9d586559ba5233939fea3305e802ee1d83` with 86 untracked evidence files; no C01 file was edited.

Fresh read-only inventory:

- Windows 10 Pro x64, build 19045; Intel Pentium 4405U; approximately 7.9 GiB physical RAM.
- Firmware virtualization reports false; SLAT support reports true; HypervisorPresent=false. These observations do not certify that firmware can be enabled or that the host meets every Hyper-V requirement.
- WSL, Hyper-V, Containers and Windows Sandbox optional features: disabled (InstallState=2). Virtual Machine Platform: enabled (1), without a verified runnable guest.
- wsl.exe exists but no user distributions are registered. No docker, podman, nerdctl, ctr, Get-VM, WindowsSandbox, VBoxManage, vmrun or QEMU system command was found in the scoped command checks. No Docker/Podman/VirtualBox/VMware/QEMU product was found in the inspected machine uninstall registries. Portable products elsewhere were not ruled out.
- hcsdiag reported no compute systems; HNS network list was empty. Running management services/executables alone do not establish a boundary.
- Windows Firewall profiles are enabled; their DefaultOutboundAction reports NotConfigured (0). No dedicated default-deny validation policy or process-tree enforcement was verified. This is not a full effective-policy audit.
- No approved remote runner identity, owner, image or network policy was supplied. Existing GitHub workflow files do not prove an approved isolated runner or safe deployment controls; no workflow was invoked.

Windows 10's normal support ended in October 2025. Current ESU entitlement/servicing was not verified, and Windows 11 eligibility was not assessed. Prefer an already supported host rather than assuming this laptop should be upgraded or is suitable. [Microsoft lifecycle](https://learn.microsoft.com/en-us/lifecycle/announcements/windows-10-end-of-support).

### Options comparison

| Option | Actual availability | Privileges/setup | Network and descendants | Browser/operations |
| --- | --- | --- | --- | --- |
| A. Windows Sandbox | Disabled; no usable instance verified | Firmware virtualization, supported eligible Windows edition/servicing, administrator feature enablement and reboot; offline payload | Networking must explicitly be disabled; whole guest covers Node and Chromium children. Sharing/clipboard are separate host channels to restrict. | Chromium can run with compatible offline Windows artifacts. Less initial setup for Nitro alone; volatile state means repeated tool preparation. Does not supply Supabase-compatible DB/auth tooling. Low recurring complexity after packaging. |
| B. Hyper-V / supported VM | Hyper-V disabled; no active hypervisor. Other inspected VM products unavailable | Approved supported host, firmware virtualization, admin hypervisor setup/reboot if absent; VM-management authority; prepared guest image | Remove every virtual NIC, not NAT/host-only/disconnected-switch assumptions. No host shares, device passthrough, tunnels or forwarded sockets. Guest descendants have the same absent external transport. Host can stop the whole clone. | Headless Chromium and viewport screenshots inside Linux. Moderate one-time setup, low repeat cost using immutable base/throwaway clones. Preferred reusable option. |
| C. WSL2 | Executable only; feature disabled, no distributions | Admin feature setup/reboot and distro import; compatible platform/version | Ordinary NAT or mirrored networking provides connectivity, not deny-egress. Requires separately verified no-network configuration/policy and control of DNS tunneling, proxies and Windows interoperability. Native Windows children can otherwise leave the intended Linux scope. | Linux Chromium is possible, but do not launch host Chrome/WSLg helpers as a shortcut. Medium/high assurance burden here; not selected. |
| D. Docker / Podman | No usable engine found | Install/approve runtime, often WSL2/VM prerequisites on Windows; engine access can confer substantial authority; offline Linux image/dependencies | Docker Linux network-none supplies loopback only. Put app and browser in the same container; no host networking, privileged mode, engine socket or credential mounts. Verify every process namespace; enforce resource/termination scope. Podman equivalence must be verified, not assumed. | Chromium needs compatible libraries, shared-memory resources and working browser sandbox. Moderate/high setup here because no engine exists; good when infrastructure is already installed. |
| E. Host Windows Firewall process restrictions | Firewall available; required policy absent/unverified | Administrator policy changes and rollback; complete executable/process inventory and effective-policy review | Program-path rules are not an automatic inherited process-tree sandbox. Node/Chrome rules do not cover arbitrary helper executables, brokers or host services; broad block rules can also obstruct required loopback. No disposable filesystem or whole-run termination by themselves. | Native browser supported, but high policy/verification complexity and host-wide operational risk. Not selected. |
| F. Approved remote disposable CI | Availability UNKNOWN; no approved instance supplied | Owner approval, artifact-transfer authority, least-privilege control plane and quotas; administrator/operator network controls | Ordinary hosted CI has outbound access and may inject tokens. Require independent deny-egress enforcement around workload/children, metadata-service denial, no deploy credentials and offline artifact transfer. CI orchestration connectivity is outside the workload boundary and must not be exposed to it. | Linux Chromium possible; separate evidence/teardown design. No repository push or workflow change is necessary for assessment. Potential alternative only after operator evidence; not presumed safer by provider name. |

Sandbox supports explicit networking disablement and read-only input mapping: [Microsoft Sandbox configuration](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-configure-using-wsb-file). WSL normally has NAT connectivity and additional DNS/proxy pathways: [Microsoft WSL networking](https://learn.microsoft.com/en-us/windows/wsl/networking). Linux Docker's none driver exposes only loopback: [Docker none network](https://docs.docker.com/engine/network/drivers/none/). Windows application firewall rules use complete executable paths; application tagging requires additional policy: [Microsoft firewall rules](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/rules). CI tokens require deliberate scoping: [GitHub secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use).

## 2. Minimum Nitro runtime, separate from C01

Nitro needs Node 22.x with the repository's pinned dependency tree; compatible Linux-native packages (including sharp); matching Playwright/Chromium and OS libraries; local catalog/content/test files; writable guest scratch space; production Next build/start; and a headless browser in the same guest. The existing Windows node_modules junction must not be copied as a Linux dependency installation or host filesystem bridge. Verify versions/lockfile rather than installing latest packages during validation.

No PostgreSQL, Supabase service, real login, provider credential, submission endpoint invocation, email, payment, scheduler or staging connection is needed for directory filtering. Production layout analytics/ads/badges/logos need test-only local replacement/rejection and request accounting. Do not remove production functionality to make tests green.

Rendered HTML/metadata and local sitemap can be inspected through guest loopback. Chromium viewport emulation covers mobile/tablet/desktop layout and input checks; it does not prove real mobile hardware, Safari/WebKit or an assistive-technology user's experience. Semantic accessibility inspection is not equivalent to screen-reader testing.

Ubuntu 24.04 is in Playwright's current Linux support list; compatibility must also be checked against the pinned repository browser version. [Playwright requirements](https://playwright.dev/docs/intro).

## 3. Why this one environment

A no-NIC VM provides an outer boundary covering arbitrary Node workers, browser renderers/utilities and later PostgreSQL sessions without a host-wide executable firewall policy. A retained Linux base makes native extension builds and canonical Supabase-related tooling practical later. Windows Sandbox is simpler for Nitro alone, but provides less reuse for the future Linux service stack. Docker/WSL here would first need another virtualization layer and its own networking review. This is an engineering recommendation, not evidence of a currently ready machine.

Proposed practical resource budget: supported host with at least 16 GiB RAM and sufficient SSD space; guest initially 4 vCPUs, 8 GiB RAM and 60 GiB disk. These are planning targets, not measured minimums or a performance guarantee. Adjust only after measuring a safe run. The current 8 GiB laptop is not recommended for concurrent host, Next build, Chromium and future DB workloads. Prefer an existing suitable operator machine; no purchase or upgrade is authorized.

## 4. Exact setup requirements — operator actions, NOT executed

1. Identify the host owner, supported/patched OS, firmware capability, available memory/disk and exact hypervisor version. Supply an already approved Hyper-V host where possible. If none exists, approve host preparation separately; do not assume this laptop qualifies.
2. If required on that approved host, an administrator enables firmware virtualization and Hyper-V, verifies SLAT/other requirements, reboots and verifies the hypervisor is running. Do not change host firewall rules for this design. [Hyper-V requirements](https://learn.microsoft.com/windows-server/virtualization/hyper-v/host-hardware-requirements?pivots=windows).
3. An authorized VM operator creates a dedicated Generation 2 Ubuntu 24.04 LTS x86-64 base using a verified full installation ISO/offline package bundle. Configure Ubuntu-compatible Secure Boot (Microsoft UEFI Certificate Authority). No virtual NICs, shared host directories, clipboard/drive redirection, USB passthrough or general host integration transport are permitted. Use the basic management console. [Ubuntu Hyper-V setup](https://ubuntu.com/server/docs/how-to/virtualisation/ubuntu-on-hyper-v/).
4. In an explicitly approved preparation phase, supply signed/hash-verified OS updates, Node, repository dependencies, Playwright/Chromium and browser libraries via offline read-only media. Artifact acquisition is a separate operator activity; do not grant the validation clone Internet access to install missing packages. No production credentials are used in image preparation.
5. Create an unprivileged guest test account and clean home. Review provisioned services: no timers/workers/provider agents or production integrations. Keep guest administrative access for independent inspection only; app/browser run unprivileged with Chromium sandbox enabled.
6. Power off and seal the clean base. Record image/manifest hashes and versions. For each run create a uniquely identified disposable clone/differencing disk with zero NICs. Disable automatic checkpoints/saved-state reuse that could carry prior test secrets. Preserve the base read-only.
7. Transfer an allowlisted Nitro source snapshot including uncommitted reviewed changes, tests and content as an exact hashed payload. Exclude .git, .env files, .vercel, credential stores, browser profiles, deployment keys, staging CLI state and links/reparse points into the host. Transfer actual matching Linux dependency artifacts. Inspect content as well as filenames; do not assume secrets occur only in .env files.
8. Approve the exact clone identity, working/evidence directories, bounded run duration, resource budget and whole-clone shutdown/disposal authority. No C01 database runtime is included in initial Nitro setup.

## 5. Verification criteria — every criterion required before READY

### Independent configuration and network evidence

Host operator captures VM ID, image identity and hardware configuration with zero NICs before boot and confirms it remains unchanged afterwards. Future read-only Hyper-V commands:

```powershell
$validationVmName = '<exact approved disposable clone name>'
Get-VM -Name $validationVmName | Select-Object Name,Id,State,Path
$validationAdapters = @(Get-VMNetworkAdapter -VMName $validationVmName -ErrorAction Stop)
if ($validationAdapters.Count -ne 0) { throw 'STOP: validation VM must have zero network adapters' }
```

The cmdlet enumerates the specified VM's adapters: [Get-VMNetworkAdapter](https://learn.microsoft.com/en-us/powershell/module/hyper-v/get-vmnetworkadapter).

Inside that guest, record `ip -brief address`, IPv4/IPv6 route tables and configured DNS/proxy/interoperability channels. Only loopback transport is allowed; reject hidden tunnels, guest NICs or integration paths. No host-shared network socket or clipboard relay may act as a proxy.

Before app start, run approved unhooked IPv4/IPv6 TCP/UDP and DNS denial probes against documentation-only addresses/names, never staging, production or real providers. Expect immediate OS route-denial consistent with zero NICs and record any guest loopback DNS forwarding attempt. Timeouts alone are inconclusive. Correlate host adapter configuration, guest route state, packet/process accounting and raw OS failures; finite probes alone do not prove all protocols denied. Failure or missing independent evidence means BLOCKED.

### Credentials and descendants

Launch through a reviewed clean-environment wrapper, not an inherited host shell environment. Allow only needed PATH, clean guest HOME/TMP, locale, NODE_ENV, disabled telemetry and local browser-artifact settings; dummy public configuration only when safely supported. No real provider, Supabase, deployment, SMTP, payment or database credentials are present. Do not print secret values.

For Node, workers and Chromium parent/renderer/GPU/utility/other descendants, record PID/PPID/executable and guest membership. Compare `/proc/<pid>/environ` against an approved name/value policy using an independent privileged guest inspector when required, reporting only pass/fail/redacted digests. Check `/proc/<pid>/ns/net` membership against the guest's intended namespace and route evidence; process flags alone are insufficient. Inspect newly appearing descendants throughout the bounded run, not just one initial snapshot. If an environment cannot be read, do not bypass the Chromium sandbox: retain the blocker or obtain an approved equivalent inspector.

### Termination and filesystem

Use a dedicated guest systemd service/cgroup with KillMode=control-group and a run timeout for the launcher, build/server and browser, then verify its cgroup contains no processes. Record every child outside that group as a failure requiring whole-guest stop. The independent host-side VM power-off is the final termination boundary, including orphaned/reparented processes. Acceptance requires recorded guest Off state and no lingering workload, not only a parent PID exit code.

All writable source, browser profile, .next output, temporary files and any future DB data live on the clone disk. No writable host mounts. Export sanitized evidence after guest shutdown through an exact dedicated artifact/disk, treat it as untrusted data, then destroy only the approved clone and its owned disks. Avoid global VM/container prune commands; retain the sealed base and reports. Disposal success must be recorded by the host operator.

## 6. Nitro procedure — future separately authorized run

1. Pass the independent preflight above and verify source/artifact hashes, absent secrets, local-only URLs, no scheduled services and working teardown.
2. Reproduce the existing 66-character tool-title failure on a clean snapshot of base `d5cc3b9013accd9a17a5fa132c9dd43d926ab255`; then compare with the Nitro snapshot. Preserve both logs; do not silently fix unrelated SEO.
3. Run the existing production build with a clean environment and telemetry disabled, inside the clone/cgroup. Capture TypeScript/static generation/warnings and any denied access. Missing offline artifacts or unexpected network attempts stop the run; no fallback download.
4. After success start Next with explicit `127.0.0.1` binding inside the guest. Verify listening sockets. Launch matching Chromium inside the same guest/cgroup; the host browser must not be used to reach the guest server.
5. Install reviewed test-only request guards before browser navigation. Permit only the exact loopback application origin and necessary locally generated data/blob resources. Supply local known images/mocks for expected external assets and record those substitutions. Reject every other host/protocol/redirect, block service-worker bypass, deny unsafe submission/API methods and report unexpected attempts. These controls complement the no-NIC boundary; they do not replace it.
6. Test all Stage 0B cases: clean/search/category/pricing/combined/invalid/repeated URLs; Enter and Search; refresh/back/forward; individual/all clears; empty results; focus/scroll; rapid interactions; keyboard/semantics; representative mobile/tablet/desktop viewports. Compare global rank numbers, category groups and featured/catalog identity with the recorded baseline.
7. Inspect rendered clean index/follow, filtered noindex/follow, clean canonical, local generated sitemap without query variants and unchanged tool URLs. Run authorized offline regressions and collect screenshots, browser/console/request logs, process evidence and source hashes. Never invoke submission, email/payment, login or Business workflows for Nitro.
8. Close browser/context and server; verify cgroup empty. Shut down the VM, export sanitized evidence and dispose of the clone. No results imply approval to deploy or synchronize GitHub.

## 7. C01 compatibility and outstanding gates

The same outer Linux VM boundary can later contain C01 tooling, but it does not automatically make C01 tests ready. Existing PostgreSQL 17.11 Windows binaries cannot run natively in this guest and were not executed. Stage 3C.2A reports pgvector and isolationtester missing and Supabase schema/runtime parity unverified.

Before separately authorized DB integration, supply pinned Linux PostgreSQL 17.11 (or explicitly approved equivalent), compatible pgcrypto and real pgvector library/control/SQL files, canonical reviewed Supabase auth/storage schemas/functions/grants, and the full reviewed Business migration/trigger chain. Do not substitute permissive mock auth/storage tables and call that integration coverage.

Supply matching isolationtester or implement/review the independent three-session concurrency runner and both lock orders; retain RLS, audit, receipt, rollback and membership-identity assertions. The old staging-oriented runner must not be reused unchanged. Any DB lives on loopback within the guest using synthetic-only local credentials and a disposable data directory; neither DB creation nor migration execution is authorized by this plan.

GoTrue session/email verification, local storage/auth HTTP integration and Business browser workflows require additional compatible service artifacts and explicit scope. Future use of native services or containers inside this VM needs its own review; it is not a prerequisite for Nitro and not silently installed now. A no-NIC guest cannot test remote staging: staging preflight, fixtures/memberships, migrations and E2E remain separate approvals, with independent restricted networking design if ever requested. All existing C01 security gates remain in force.

## 8. Risks, limitations and authorization

Main limitations: no approved host/image yet; current laptop resources/servicing are unsuitable without further qualification; Linux dependencies/browser must be packaged offline; finite network probes and screenshots are not absolute security proofs; process-environment inspection needs permission; base image and hypervisor remain trusted components. Offline analytics/image substitutes limit production-asset fidelity. Early build failures caused by blocked dependencies must be diagnosed rather than bypassing egress enforcement.

Decision is SETUP REQUIRED, not READY: the architecture is viable but no working boundary was independently exercised. If an approved suitable host cannot be supplied, execution remains BLOCKED. No existing project security requirement has been downgraded.

Next authorization should name the host owner/identity and approve only: host/guest preparation as needed, offline artifact packaging, one dedicated no-NIC clone, independent network/process/termination qualification and exact disposal scope. Distinguish privileged host setup (admin/firmware/reboot) from delegated VM operations and unprivileged app tests. Do not authorize host firewall modifications, staging credentials, databases or deployments as part of Nitro setup.

After qualification evidence passes, authorize or explicitly resume the bounded Nitro Stage 0B build/browser scope. C01 database/auth/staging work requires its own later authorization and remains paused. No installation or execution plan in this document has been run.
