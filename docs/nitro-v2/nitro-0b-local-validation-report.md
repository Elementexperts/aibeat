# Nitro 0B — controlled local validation

Date: 2026-10-21. Decision: **BLOCKED at independent outbound-containment preflight.**

No build, application server, browser, test suite, migration, provider call or database connection was executed during Stage 0B. The user explicitly required stopping if outbound isolation cannot be independently verified. Application code and configuration were not changed.

## 1. Repository and evidence preservation

Nitro worktree: `C:/Users/User/.codex/visualizations/2026/10/19/01a1539a-8159-7e13-bed8-88bc44dd19fd/nitro-v2-directory-discovery`.

Branch: `codex/nitro-v2-directory-discovery`. Base/current HEAD: `d5cc3b9013accd9a17a5fa132c9dd43d926ab255`. No fetch, checkout, reset, merge, rebase, commit or remote operation was performed.

Existing Stage 0A file manifest, preserved:

- Modified: `app/directory/page.tsx`, `components/ui/DirectoryClient.tsx`.
- Untracked: `lib/directory-filters.ts`, `tests/directory-filters.test.ts`, `tests/directory-tsconfig.json`, `docs/nitro-v2/nitro-0a-baseline.json`, `docs/nitro-v2/nitro-0a-implementation-report.md`.

The only Stage 0B added file is `docs/nitro-v2/nitro-0b-local-validation-report.md` (this report).

C01 remains on `codex/c01-business-authorization-hardening`, HEAD `8e395c9d586559ba5233939fea3305e802ee1d83`. Reviewed commit ancestry is intact:

`d996449e908c237858fa0219efe0d01a673e605a` -> `93b7545f9bba140eb6f0c12a4a176c42e5733ea8` -> `8e395c9d586559ba5233939fea3305e802ee1d83`.

C01 porcelain status and SHA-256 values for all 86 untracked evidence files match the retained Stage 0A snapshot. No C01 files were edited. Existing Nitro source/evidence hashes were captured before writing this report and checked afterwards.

## 2. Safety findings from source inspection

| Surface | Evidence and implication |
| --- | --- |
| Package scripts | `build` is `next build`; `start` is `next start`. No prebuild/postbuild/prestart/poststart hooks are defined. Neither script explicitly runs migrations, deployment, email, payments or scheduled workers. This does not establish that every imported route is side-effect-free. |
| Server binding | The existing start script has no explicit loopback binding. A future contained run must supply a loopback host argument; no server was started. Listening on localhost would not itself prevent outbound traffic. |
| Next configuration | `next.config.js` configures remote image domains `images.unsplash.com` and `logo.clearbit.com`, local headers and a local listing redirect. An image-domain allowlist is not an egress firewall. |
| Browser layout | `app/layout.tsx` includes Google Tag Manager/Analytics and a Google advertising script. These exist independently of the new directory filters. Ordinary browser rendering can initiate external requests. |
| Badges/logos | `components/layout/Footer.tsx` contains remote badge image sources; `components/ui/ToolLogo.tsx` renders catalog logo URLs as image sources. Catalog records include Google favicon URLs. These require controlled local replacements or browser rejection during validation. No images were fetched. |
| Analytics events | `components/analytics/PublicAnalytics.tsx` forwards annotated clicks to `window.gtag` when present. It is not disabled simply by binding the server to loopback. |
| Supabase | Existing helpers and Business middleware can call authentication/membership APIs when configured. No helper was invoked and no credential was used. The directory filter itself uses static local catalog data. |
| Environment files | Only `.env.example` was listed at the Nitro worktree root; no `.env.local` was present there. This alone does not verify inherited process variables or descendant environments. No values from environment files or secrets were printed. A clean allowlisted launch environment remains unverified. |
| Submission/email/payments/workers | Separate operational scripts exist in package.json. They were not invoked. An unrestricted production server would still expose application routes; prevention of submission processing and provider actions has not been runtime-verified. |
| Build-wide behavior | Static generation covers more than `/directory`. No claim is made that all build imports, telemetry, route generation or framework workers are safe without an enforced boundary. |

## 3. Independent boundary evidence

Read-only command discovery used `Get-Command`; Windows state was read through CIM, the current user's WSL registration registry and HCS/HNS inventory. No infrastructure was enabled or launched, and no network/firewall settings were changed.

| Check | Current observation |
| --- | --- |
| OS | Windows 10 Pro, 10.0.19045, 64-bit |
| Container command availability | docker, podman, nerdctl and ctr not found in PATH |
| VM command availability | Get-VM, WindowsSandbox, VBoxManage and vmrun not found |
| WSL | wsl.exe exists, but WSL optional feature InstallState=2 (disabled); no registered distributions found for this user |
| Hyper-V | Microsoft-Hyper-V-All InstallState=2 (disabled); HypervisorPresent=false |
| Firmware virtualization | VirtualizationFirmwareEnabled=false |
| Sandbox / Containers | Containers-DisposableClientVM and Containers InstallState=2 (disabled) |
| Virtual Machine Platform | InstallState=1 (enabled); this is not proof of a usable hypervisor or isolated guest |
| HCS/HNS | hcsdiag list reported no systems; Get-HnsNetwork returned an empty list |
| Enforcing execution boundary | None independently identified or verified for this run |
| Egress-denial probes | Not executed: no verified disposable boundary exists in which to run them safely |
| Node/Chromium descendants | Not launched or inspected; no containment claim |

This agrees with historical C01 environment evidence, but the decision above uses fresh local inventory. It does not prove that no portable/unregistered runtime exists anywhere or that an external operator has none. No full-disk runtime search was performed. Filesystem sandbox permissions, localhost binding, absent credentials, fetch hooks or browser routing alone were not accepted as independent network isolation.

**Stop point:** Task 2 cannot pass. Tasks requiring an execution boundary were not started.

## 4. SEO baseline comparison

Historical Stage 0A result, not re-executed here:

- Test: `tests/tool-seo.test.ts`, `all catalog descriptions are unique, bounded and based on product data`.
- Assertion: line 20, `(String(metadata.title) + ' | AIBeat.dev').length <= 65`.
- Slug: `a2o-lite-neon-ai-dance-generator`.
- Recorded complete title: `A2O LITE NEON AI Dance Generator — Features & Pricing | AIBeat.dev`.
- Recorded measured length: 66; limit: 65.

Independent **static** baseline comparison this turn: `git show d5cc3b9013accd9a17a5fa132c9dd43d926ab255:tests/tool-seo.test.ts` confirms the same assertion on the selected main commit. `git diff --exit-code` against that SHA for tracked `lib`, `data`, `tests/tool-seo.test.ts`, `app/sitemap.ts`, tool detail page and homepage returned clean. The new filter helper is untracked and not imported by the tool SEO test. Source inspection of `lib/tool-seo.ts` confirms its fallback title is not shortened again if it still exceeds the maximum.

Conclusion: unchanged test/SEO/catalog inputs support the failure being unrelated to Nitro filters. **Fresh execution against a clean main snapshot: NOT EXECUTED / pending**, because the containment stop condition took precedence. Static source equivalence is not reported as a reproduced clean-main test run. No SEO/catalog file was edited.

## 5. Build and browser results

| Validation | Stage 0B result |
| --- | --- |
| Production build | NOT EXECUTED — containment blocked |
| Build TypeScript / static generation / warnings | UNKNOWN — no build output |
| Clean/search/category/pricing/combined URLs | NOT EXECUTED |
| Invalid/repeated parameters; refresh; back/forward | NOT EXECUTED |
| Individual reset; clear all; empty results; Enter/submit | NOT EXECUTED |
| Keyboard and screen-reader semantics | NOT EXECUTED interactively; no accessibility PASS claimed |
| Mobile/tablet/desktop layouts | NOT EXECUTED; no visual PASS claimed |
| Search focus/scroll and rapid navigation | NOT EXECUTED |
| Rendered rank labels and listing routes | NOT EXECUTED in browser |
| Rendered robots/canonical and generated sitemap | NOT EXECUTED |
| External access attempts during execution | No application execution occurred; denial/rejection behavior was not tested |

Historical 0A evidence remains 14/14 new offline directory checks PASS; combined regressions 26 PASS/1 FAIL; TypeScript/lint/whitespace PASS. These are not new Stage 0B results and do not substitute for browser or build validation.

## 6. Ranking, catalog and Business regression status

Read-only diff inspection confirms tracked catalog data, popularity formula, featured selection, catalog merge code, tool SEO/detail routes, homepage and sitemap are unchanged from the selected main base. Existing directory-only implementation changes are preserved. Baseline JSON retains the 147-tool catalog identity and complete rank/featured sequences. Dynamic/browser verification remains pending. No Business C01 application, migration, flag or evidence file was modified.

## 7. Release blockers and next step

1. Provide an approved disposable execution environment with independently enforceable default-deny egress covering build workers, server, Chromium and every descendant. No such boundary is currently verified here.
2. Transfer a reviewed secret-free Nitro snapshot and offline platform-compatible Node 22/dependencies/Chromium into it. Do not transfer the current dependency junction as a host access path, `.env*` credentials, `.vercel`, browser profiles or host credential directories. Use a clean environment allowlist, disabled telemetry and no staging/production configuration.
3. Verify boundary identity, no external route or equivalent independent enforcement, descendant membership and teardown before any application execution. Run the server and browser inside the same boundary using loopback only; prevent application submissions and replace/reject analytics, ads, badges and remote images locally. Never weaken production code to satisfy the local test.
4. Once the boundary is verified, resume Stage 0B: reproduce the title failure on a clean base snapshot, run the existing production build, then execute the bounded directory-only browser/SEO/ranking/accessibility/responsive matrix and collect results. Stop on unexpected external activity. Preserve C01 and all previous evidence.
5. Export sanitized evidence, terminate the whole test runtime and dispose only of its dedicated instance.

Required operator action: identify/provide an already approved isolated VM/container or equivalent environment with verifiable egress controls and offline artifacts. A disposable VM without network adapters is one possible design, not a verified available resource. Infrastructure installation or host firewall changes are not authorized or proposed for automatic execution. After that environment is available, resume under this task's build/browser scope; separately authorize any necessary infrastructure preparation or application remediation.

The title-length defect remains a separate existing issue. No additional functional defect or production readiness can be determined from this blocked run. No commits, pushes, PRs, deployment, database access, migrations, email, payment, background-worker execution or C01 change occurred. Stop after reporting.
