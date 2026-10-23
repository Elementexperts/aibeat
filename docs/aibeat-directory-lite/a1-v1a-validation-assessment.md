# A1 V1A — validation safety assessment

Date: 2026-10-23. **Assessment COMPLETE; application execution on this host remains BLOCKED pending independently verified containment and explicit execution approval.** Only this assessment is created. No existing file was edited, no application command/test/parser/compiler/linter/build/server/browser was run, and no dependency installation, provider/DB/auth request, CI dispatch, commit, push or deployment occurred. Read-only Git/source/configuration/lockfile inspection, static comparisons and byte hashing are the evidence for this assessment.

## 1. Repository state and preserved implementation

| Item | Verified state |
| --- | --- |
| Repository / root | Elementexperts/aibeat; C:/Users/User/.codex/visualizations/2026/10/19/01a1539a-8159-7e13-bed8-88bc44dd19fd/nitro-v2-directory-discovery (N) |
| Branch | codex/nitro-v2-directory-discovery |
| HEAD | ed9ae9ede6fc73fdb53051246124db3418bcf0e9; matches expected baseline |
| Tracked local changes | components/ui/DirectoryClient.tsx; tests/directory-filters.test.ts only |
| Index | No staged changes |
| Pre-existing untracked files | 15: five A0 docs, two A1 inspection/proposal docs, A1 implementation report, inactive Nitro 0B workflow and six Nitro 0B assessment/CI reports |
| Required baseline documentation | A0 preservation/risk gates; A1 inspection/proposal/implementation report; Nitro 0B local-validation report, CI security review and activation checklist reviewed |

The current request authorizes assessment/documentation, not repairs or runtime execution. Existing A0/A1 and Nitro reports retain their historical status wording. No branch switch/reset/stash/merge/cherry-pick/rebase occurred. This worktree's node_modules is a **junction to C:/Users/User/Desktop/aibeat-main/aibeat-main/node_modules**, the C01 desktop checkout. Its link metadata was inspected without executing packages through it. This is not a pristine, pinned or Linux-native isolated dependency tree.

## 2. Complete local diff review

Both full tracked diffs were reviewed against HEAD. The implementation matches the three approved P0 changes:

- Both directory result grids change only to one base column, two sm columns and four md columns. Group maps, first-category order, filter result order, keys and global-rank lookups are unchanged.
- Only private ToolCard presentation changes: article/h2, larger existing text, stronger category/rank palette token, long-word/min-width guards, wrapping score/pricing row, local detail-link focus/hover classes and a decorative logo wrapper.
- The existing detail anchor remains `/tools/${tool.slug}`, with an explicit name containing the same visible product name. There is one main detail link, no nested action, new tabindex/role/keyboard shortcut or extra CTA. Article/div/h2/anchor nesting is valid by source review. The sole new aria-hidden applies to a noninteractive repeated logo wrapper; the explicit anchor name is purposeful, not a replacement for native link semantics. Actual AT announcements remain unverified.
- Existing name/category/tagline/rating/pricing expressions remain. The affiliate conditional/component subtree is unchanged and remains outside the main anchor. No Featured/Sponsored/Editorial badge, price/checkout/eligibility/provenance change was introduced.
- The test file's original fourteen cases/imports are preserved as its original text prefix; four cases and local helpers are appended. No dependency, config, application helper or fixture baseline changed.

Static comparison confirms the entire DirectoryClient prefix before ToolCard is unchanged after accounting for the two approved grid class replacements (UTF-8 text, normalized line endings). This protects discovery state/effect/commit/URL/filter/rank/group logic, header, clear/empty states and submit CTA. Frozen metadata/data/source hashes were not refreshed.

**Correction disposition:** no source defect requiring an application repair was identified by this inspection. No correction is authorized or made here. Risks requiring later validation: larger text and four columns at md can still crowd; outlines could clip; two-line taglines remain visually clamped; headings/link-name/logo decoration need AT review. These are not verified failures, nor verified passes. Any failure discovered during an authorized run must be reported before a separately authorized repair; do not change code or expected baselines merely to get green results.

## 3. Assessment of all eighteen focused tests

### Existing fourteen

`tests/directory-filters.test.ts:22–184` covers defaults/exact categories, first duplicate parameter, Unicode search bounds, stable serialization/unrelated repeated keys/hash, literal case-insensitive AND search, a modeled push/replace/back/forward/refresh history, clearing filters, frozen catalog/ranked/featured/source hashes, stable category/pricing subsequences, server markup/listing links/global ranks, unfiltered category grouping/empty state, metadata/robots/canonical, sitemap source invariants and client wiring.

These are meaningful regression contracts. The history test is an in-memory model and server-prop reconstruction, not actual App Router interaction. Sitemap is inspected as unchanged source rather than importing the baseline server-cache-incompatible route outside Next. Catalog baseline asserts 147 tools and existing rank/featured order. Source wiring checks use regexes and do not prove effects or keyboard execution.

### Four additions

| Case / source region | Meaningful coverage | Limits / brittleness |
| --- | --- | --- |
| Named link/heading/cards, lines 193–221 | Both grouped/filtered card order/count, native detail href/name, h2 product title, no nested input/action, decorative-logo subtree and global rank; empty result | Known-markup regexes; no browser/AT tree validation |
| Text/score/pricing, lines 223–240 | Catalog text, rated/unrated, all pricing types, no new placement labels | Text serialization/literal-label coupling; no computed readability |
| Separate affiliate offer, lines 242–260 | Distinct anchor count, original offer destination, target/rel, CTA/code/commission disclosure and no offer inside detail link | Anchor markup/string coupling; no actual navigation |
| Static responsive/focus contract, lines 262–282 | Both grid utility tokens, explicit local outline and wrapping metadata classes | Utility presence only; no CSS engine, viewport or focus execution |

The first three cases extract known SSR article/anchor/heading markup using regex. They do not depend on complete Tailwind class strings. They are intentionally structural, not a general HTML validator: whitespace/tag refactors, alternate heading wrappers, escaped text changes and React SSR serialization can affect assertions. The decorative-wrapper regex stops at a closing div rather than parsing a complete tree; it is a limited guard, not proof that all hidden/interactive descendants are correct. Missing matches can produce a generic indexing failure instead of a tailored assertion. The placement-label exclusion is a narrow literal match, not a general provenance checker. These are test-quality limitations to interpret on first execution, not evidence that an assertion already fails.

The fourth case intentionally checks individual CSS utility tokens because no CSS engine is used. It is coupled to Tailwind implementation choices; presence does not prove generated CSS, responsive behavior, actual focus or contrast. Existing rank-span/section-label regexes likewise constrain markup. Retain meaningful behavioral expectations; any future robustness changes require explicit test-file editing permission, not silent weakening.

**Syntax judgment:** all eighteen cases and the appended TypeScript helpers/regexes appear syntactically valid on manual review; no apparent syntax defect found. **Parser/compiler validity is NOT VERIFIED.** No node --check, tsx, TypeScript API/compiler or package-backed parser was invoked, because that would itself introduce runtime execution. tsx transpilation is not full TypeScript type checking.

No browser is required by this suite. It uses React renderToStaticMarkup and a stub AppRouterContext, whose router methods do nothing. React effects/event callbacks do not run during this static render. The suite cannot establish real link prefetch/history/focus, image onError, assistive-technology behavior, breakpoints, zoom or browser loading of logo URLs. Long/unbroken text and full private-state boundaries are not certified by these checks.

## 4. Focused execution surface and side effects

The test imports Node builtins (test/assert/crypto/fs), React/react-dom server, a Next internal AppRouterContext, DirectoryClient, the server directory page, directory helpers, catalog and frozen baseline JSON. The inspected repository-level import closure continues through `lib/data.ts` to `data/submitted-tools.ts`, `data/automated-tools.json`, `lib/automated-tool-catalog.ts`; DirectoryClient also imports constants from `lib/analytics.ts`, shared ToolLogo/ToolAffiliateOffer, next/link and next/navigation.

Inspected application helpers in this closure use local static data/pure functions. Analytics imports define names/mappings; they do not send events. The test does not import RootLayout, operational workers, submission handlers, Supabase/Stripe/Gmail clients or the 1B-A harness. No direct fetch, network socket, DB connection, provider call, file write, child-process launch, lifecycle command, Git/CI/deploy action is present in the focused test source. Local `readFileSync` reads code and baseline hashes. URLs in catalog/markup are strings; static server markup does not fetch those images or follow those links. History arrays are local memory, not browser storage or remote mutation.

This is **apparent source safety, not independently verified runtime safety**. Node, tsx/esbuild, Next/React and every transitively resolved dependency still execute code with the process's privileges. This inspection did not certify installed dependency bytes, hidden hooks/loaders, transitive module side effects, cache paths, binaries or runtime denial behavior. Any of those could introduce reads/writes or network beyond the explicit test body.

Environment dependencies: `TSX_TSCONFIG_PATH=tests/directory-tsconfig.json` is required for the automatic JSX transform; that config extends the root tsconfig for aliases/resolution. Node/Next/React observe environment/mode, and injected NODE_OPTIONS/loaders or user/module/cache/temp configuration can affect execution. The test body does not require production credentials. Do not infer that inherited environment or readable .env files are safe because the directory code uses none.

Explicit local test code mutates only temporary JS arrays/objects. No test-driven persistence was found. Nevertheless tsx/esbuild/Node may use temporary files/caches and the runner may spawn test processes. An independent read-only source mount plus bounded dedicated writable temp/home/results storage is required to prevent uncontrolled writes. Writable host checkout/C01 dependencies are not acceptable scratch space. No claim that the process is wholly write-free is made.

## 5. Package, dependency, configuration and lifecycle review

| Surface | Inspected finding and implication |
| --- | --- |
| Root scripts | package.json build=next build, start=next start, typecheck=tsc --noEmit, lint=next lint. No root preinstall/install/postinstall/prepare/pretest/posttest/prebuild/postbuild/prestart/poststart hooks found. Direct node test command avoids npm lifecycle dispatch; it does not avoid imported executable code |
| npm test | Broad operational/regression suite list; does not include directory-filters. Not the intended focused command; do not run it as a substitute |
| Versions | .nvmrc and engines request Node 22.x; actual executable identity/version not invoked or qualified. Lock metadata: tsx 4.22.3, nested esbuild 0.28.0, TS 5.9.3, ESLint 8.57.1, eslint-config-next/Next 14.2.35, React/react-dom 18.3.1, Tailwind 3.4.19, PostCSS 8.5.15, autoprefixer 10.5.0, sharp 0.35.4. These are lock records, not installed-binary attestations |
| Dependency install flags | Lockfile marks install scripts for @google/genai, fsevents, protobufjs, tsx/node_modules/esbuild and unrs-resolver. Metadata does not describe or certify every hook/native setup. Absence of a flag for another package is not proof of no installation/runtime risk |
| Installation | Not needed as a command in a future focused run IF reviewed, matching native dependencies are already supplied. Current junction is not such proof. No npm ci/install/npx or download fallback; acquisition/setup must be independently reviewed and separately authorized. --ignore-scripts alone does not prove a functioning/native-complete installation |
| tsx | Imported loader executes transformation/resolution plus native esbuild; may cache. Existing directory config supplies JSX/aliases. No loader/binary/cache or end-to-end behavior was executed/certified |
| TypeScript | Root tsconfig includes all TS/TSX, allowJs, .next types, aliases and a Next language-service plugin declaration; incremental=true by default. --noEmit --incremental false avoids normal compiler emission/build-info output. Standard tsc does not ordinarily run tsserver language-service plugins simply because listed; do not equate this flag with plugin execution proof. Compiler/module resolution still reads broad source/declaration inputs and uses executable dependencies, so needs containment |
| ESLint | .eslintrc.json extends next/core-web-vitals: executable shared config/plugins/resolvers/parsers, transitive package/config discovery. Proposed direct lint uses no --fix/--cache, but that is not an OS write/network boundary. Do not change configuration or auto-fix |
| Next build | Loads executable next.config.js redirects/headers and image config; PostCSS/Tailwind configs/plugins; full route imports/native workers; can load .env files and create .next, caches, generated types/next-env declarations or update configuration. Full-app service independence remains unproven; clean env alone cannot establish it |
| Browser/server | Root layout analytics/ads, remote logo/badge images, Link prefetch, middleware/auth routes and production redirect concerns remain. Browser profile, download/cache/service-worker/process behavior requires separate qualification |

The lockfile was parsed as JSON with Python stdlib; project configs were read as text, never required/imported. No dependency tree was executed or recursively followed through the junction. A full transitive supply-chain/source audit, installed integrity check and advisories review are not available evidence here. No network lookup or new tool was used to fill that gap.

## 6. Exact proposed commands and classifications

Definitions: SAFE TO PROPOSE means a narrowly bounded assessment command can be considered under its explicit scope; it is not an application execution grant. REQUIRES CONTAINMENT means plausible workload content, prohibited here until independently qualified environment and explicit approval. BLOCKED means additional prerequisites/tooling/scope are absent. NOT APPLICABLE means excluded from A1 validation. Classification concerns the method, not whether a test would pass.

| Activity | Exact command or procedure reference (NOT RUN) | Classification / prerequisites |
| --- | --- | --- |
| Static diff/preservation | git --no-optional-locks diff --check; exact path/status/source hash comparison | SAFE TO PROPOSE; read-only methods performed during V1A |
| Focused eighteen tests ONLY | `node --import tsx --test tests/directory-filters.test.ts`, with `TSX_TSCONFIG_PATH=tests/directory-tsconfig.json` and cwd at reviewed snapshot root | REQUIRES CONTAINMENT; reviewed Node 22/native loader deps/source; clean environment; explicit V1B approval. Do not use npm test or a wildcard |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | REQUIRES CONTAINMENT; pristine reviewed source/types/native deps; reads whole repo; separate approval from focused tests |
| Scoped ESLint | `node node_modules/eslint/bin/eslint.js components/ui/DirectoryClient.tsx tests/directory-filters.test.ts` | REQUIRES CONTAINMENT; existing shared config/plugins/resolvers reviewed; no --fix/--cache; separate command approval. Two changed files only |
| Next build | Existing `npm run build` (next build) | BLOCKED; full-app no-production-service proof, reviewed setup/config/native artifacts and output-only writable snapshot required; not V1B focused boundary |
| Built SEO suite | `npm run test:seo-built` after an independently approved build | BLOCKED; requires verified matching .next artifact; not focused test coverage |
| Future local production server | Existing reference `npm run start -- --hostname 127.0.0.1 --port 3102` after qualified build, inside same boundary | BLOCKED; server/routes/browser isolation and owned descendant teardown separately reviewed; loopback is not egress control |
| Browser layout | No repository-approved Playwright config/script exists; no exact runnable browser command can yet be named | BLOCKED; separately approve pinned tool/browser/native libraries, bounded test harness/URLs and runtime. Do not invent an npx/download command |
| Keyboard accessibility | Same separately approved browser/server; manual Tab/Shift-Tab/Enter through search, filters, main detail/offer actions; focus visibility and URL/history checks | BLOCKED; no standalone keyboard CLI exists here; manual testing is browser execution too |
| Assistive technology | Separately approved accessible-tree/real screen-reader procedure against qualified local UI | BLOCKED; actual AT/browser/version and transport must be approved. SSR/aria/Chromium tree is not a screen-reader pass |
| Responsive/zoom | Qualified browser at 320/375/640/768/1024 CSS px and 200% text/zoom; long/unbroken strings, empty/filter/group, rated/unrated, image/offer states | BLOCKED; requires previous browser prerequisites. No fake screenshot or utility-token PASS |
| DB/auth/provider/1B-A/C01 fixtures, payments, publishing/CI/deploy | No command proposed | NOT APPLICABLE; expressly excluded |

For a future independently approved Linux guest, an exact **conditional example** for the focused command uses this proposed operator layout: reviewed Node at `/opt/aibeat-validation/node/bin/node`, pristine source/deps at `/work/aibeat`, bounded writable `/work/home` and `/work/tmp`. Those paths are not provisioned or certified by V1A. Run as a dedicated nonroot user, cwd `/work/aibeat`, only after independent qualification and explicit command approval:

```sh
env -i PATH=/opt/aibeat-validation/node/bin:/usr/bin:/bin HOME=/work/home TMPDIR=/work/tmp LANG=C.UTF-8 NODE_ENV=test NEXT_TELEMETRY_DISABLED=1 TSX_TSCONFIG_PATH=tests/directory-tsconfig.json /opt/aibeat-validation/node/bin/node --import tsx --test tests/directory-filters.test.ts
```

No host credential/config/socket mount, NODE_OPTIONS/PYTHON/PG/provider environment inheritance, production values or actual .env files. The snapshot must carry both current uncommitted A1 source edits; Git HEAD alone would test old code. Bind the exact current source/test hashes below, required local data/config inputs, dependency/native image digest and operator-reviewed command. No installation happens during this workload; native preparation is a separate gate. Capture exit status without a masking pipeline and retain only sanitized bounded output outside the read-only source. The env command itself neither enforces egress nor qualifies dependencies.

## 7. Independent containment requirements and Nitro conflicts

Preserved authority: `docs/nitro-v2/nitro-0b-local-validation-report.md`, `nitro-0b-ci-security-review.md`, `nitro-0b-ci-activation-checklist.md`, plus A0 risk gate G2. Their earlier machine observations are historical; V1A did not rescan OS virtualization or run denial probes. **No new independent execution-boundary evidence was provided or established.**

Before any application command, the independent operator must supply approved exact instance/image/source/dependency identity; unprivileged workload; enforced default-deny outbound network covering Node, native transformers and every descendant; no host networking/mounts/engine sockets/credential channels; clean environment and secret-free source; read-only source/dependencies; dedicated bounded disposable home/temp/results; command/time/resource limits; independent watchdog and verified whole-workload termination/disposal. Preparation/control-plane artifact networking is separate from application egress. Verify routes/denial, descendant containment, environment/mount provenance, timeout/cancellation and teardown independently of application-supplied status claims. No such probe is authorized on this host now.

Conflicts to reject:

- Directly running host Node/tsx/tsc/ESLint through the C01 dependency junction contradicts pristine/no-host-path and lifecycle/containment requirements. A read-only task sandbox, localhost, absent credentials, telemetry flags or fetch monkey-patch alone is insufficient.
- Ordinary GitHub-hosted Actions networking is not independent workload containment. Current untracked workflow retains its unconditional failure gate and five literal-false app/install steps. Its diff allowlist does not cover Directory Lite. Do not flip conditions, remove the gate, dispatch it, or treat scaffold metadata checks as application validation.
- No blanket infrastructure installation/firewall change, remote artifact download, container privileged shortcut or new wrapper file is authorized here. Any missing trusted orchestration/image/helper work requires separately scoped preparation approval.
- No Nitro 1B-A qualification/SQL/auth fixture, C01 validation, production credential, real email/payment, operational npm script, CI/push/preview/deployment operation belongs in V1B focused tests. Prior Vercel403/preview production redirects remain release/server concerns, not obstacles to bypass for this assessment.

## 8. Preservation verification and missing evidence

Before/after V1A byte inventory covers all pre-existing Git-tracked/nonignored-untracked regular files. Each file is SHA-256 hashed; the aggregate is SHA-256 of UTF-8 `json.dumps(relative_path_to_sha256, sort_keys=True)`. Link/reparse file entries are rejected instead of followed; ignored node_modules/caches/environment files are not traversed. Only the newly authorized assessment path is excluded from N's before/after inventory. Existing modified A1 source/test files are INCLUDED, so this also detects accidental edits to them.

| Worktree | Existing files / aggregate SHA-256 | Preservation result |
| --- | --- | --- |
| N current directory | 905 / 43aaa7d94432cd74445dba30697fcdbb2772c4c428876200b1c69c078885aefd | Matched in final before/after check |
| F founder-submissions | 915 / fffcb77af555aeae0197600c532292dec94863d1c254e58ab2aa8ec97f5e0785 | Final before/after match; also matches retained A1 implementation inventory |
| C original desktop C01 | 1030 / 3a9ba7fa89511530c5f4144f6b28d8a75c40a2e9b706362de85746d8d606eb50 | Final before/after match; also matches retained A1 inventory, including all86 evidence files |

Current A1 file hashes exactly match the implementation report:

| File | SHA-256 |
| --- | --- |
| components/ui/DirectoryClient.tsx | f8eceb67856ad8891e0c1d44090e8a40abe6f37cf54cecf4f138dbd783853a86 |
| tests/directory-filters.test.ts | 9982b9fb37b9981b62328ddcfce2897dcd53ef957cdc6396e78514d727390716 |

Additional static verification passed: original fourteen test bodies remain an unchanged prefix; discovery prefix except two grid class lists matches HEAD; all four original 0A protected hashes in `nitro-0a-baseline.json` match (lib/data.ts, app/sitemap.ts, lib/tool-seo.ts, app/tools/[slug]/page.tsx); git diff --check reports no whitespace error. Git's LF/CRLF advisories are not a source change or test result.

F remains `codex/nitro-v2-founder-submissions` at `af519d1e28e9a2224e2568339c3215b755a9b15e`; C remains `codex/c01-business-authorization-hardening` at `8e395c9d586559ba5233939fea3305e802ee1d83`; both have clean tracked/index state and their four/86 untracked files preserved. N's two approved tracked changes remain unstaged; its fifteen prior untracked files remain, plus only this new assessment. Search/filter/catalog/rank/tool URLs/SEO/shared cards/home/news/Business/founder/C01/workflow preservation is supported by source diff and retained hashes, not inferred from unexecuted tests.

Missing/unverified evidence explicitly retained: parser/type/lint/test outcomes; independently qualified OS/runtime/dependency bytes/native caches/write paths; full transitive supply-chain audit; current live deployed source/settings; real browser/AT/contrast/zoom outcomes. Historical title-length failure (66 vs65) belongs to broader tool-SEO regression, not the exact focused eighteen-case command. It remains unchanged and must be disclosed if broader suites are later approved; do not skip/fix it inside V1B without authorization.

## 9. Recommended V1B boundary and explicit approval

V1A can finish as an assessment while execution remains blocked. **Recommend V1B as one narrowly authorized, qualified, offline directory-test attempt**, not a generic host validation command or automatic full validation sweep:

1. Independently approve/qualify the disposable guest, exact source including uncommitted edits, Node/native dependency artifact, no-egress/write/descendant/timeout/teardown controls. If those are unavailable, approve only separately bounded readiness/helper/artifact preparation; do not execute application code.
2. Authorize the exact focused eighteen-test command/config/environment above, its source/image hashes, resource/time limits, sanitized evidence destination and operator responsible for teardown. No install/server/browser/build/DB/CI/provider operation included. Stop on unexpected environment/egress/write/process/config drift, preserve sanitized evidence and terminate the exact whole workload; no retry via host or relaxed controls.
3. Review the actual command exit/output and independent teardown before claiming tests passed. An execution failure may require a separately approved correction, not source edits under assessment authority. TypeScript and scoped ESLint require their own explicit command approval even if the same qualified boundary can be reused; build/browser/AT remain later gates.

No runtime command is unconditionally safe/authorized on the current Windows host from the evidence available. No code or tooling remediation was performed. No existing security restriction was weakened. The next approval should name an already qualified environment or explicitly scope its preparation, then approve only the exact focused command; no commit/push/deployment or milestone advancement is implied.

**A1 V1A COMPLETE — AWAITING TEST EXECUTION APPROVAL**
