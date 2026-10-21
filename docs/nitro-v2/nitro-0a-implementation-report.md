# Nitro 0A — directory filters local implementation

Date: 2026-10-21. Local implementation completed; offline directory checks PASS. Combined catalog/SEO regression suite: 26 PASS, 1 existing baseline failure. Browser/build validation NOT EXECUTED and not authorized. This is not a deployment-readiness decision.

## Branch, baseline and separation

- Nitro branch: `codex/nitro-v2-directory-discovery`.
- Base and current HEAD: `d5cc3b9013accd9a17a5fa132c9dd43d926ab255`, cached `origin/main`, article: openai-acquires-ai-biotech-startup-orchestra-bio. No remote refresh was performed; this is the latest available cached main, not a claim about live GitHub.
- Worktree: `C:/Users/User/.codex/visualizations/2026/10/19/01a1539a-8159-7e13-bed8-88bc44dd19fd/nitro-v2-directory-discovery`.
- Initial tracked/untracked Git status: clean. Changes remain uncommitted.
- C01 worktree remains `C:/Users/User/Desktop/aibeat-main/aibeat-main`, branch `codex/c01-business-authorization-hardening`, HEAD `8e395c9d586559ba5233939fea3305e802ee1d83`.
- Reviewed C01 commits remain intact: `d996449e908c237858fa0219efe0d01a673e605a` -> `93b7545f9bba140eb6f0c12a4a176c42e5733ea8` -> `8e395c9d586559ba5233939fea3305e802ee1d83`. They were not copied into the Nitro branch.
- C01 before/after porcelain status matches exactly. All 86 untracked files have matching SHA-256 hashes; no untracked additions or removals. No existing implementation or evidence was edited.

## Exact changed-file manifest

All paths below are relative to the Nitro worktree only.

| File | Change |
| --- | --- |
| `app/directory/page.tsx` | Modified: shared parsing for all filters; URL-derived client props; pricing/repeated-parameter-safe robots handling; no keyed remount. |
| `components/ui/DirectoryClient.tsx` | Modified: submitted search draft, router navigation, accessible category/pricing and reset controls, live count, stable global rank lookup. |
| `lib/directory-filters.ts` | Added: pure parsing, matching, URL serialization and navigation decision helpers. |
| `tests/directory-filters.test.ts` | Added: 14 focused offline tests, including static rendering and history simulation. |
| `tests/directory-tsconfig.json` | Added: automatic JSX transform for standalone Node/tsx rendering tests, leaving the application configuration intact. |
| `docs/nitro-v2/nitro-0a-baseline.json` | Added: pre-edit main catalog identity, all ranked slugs, featured slugs, protected source hashes and original directory metadata source. |
| `docs/nitro-v2/nitro-0a-implementation-report.md` | Added: this report. |

Ignored local support artifacts: `node_modules` junction to the existing C01 dependency installation (dependencies reused without installation or writes), and `next-env.d.ts` with only Next type references. No environment files, credentials, `.vercel` configuration or application build outputs were copied. These support artifacts are not deliverable source files.

## Implemented filter and navigation contract

- `q` is trimmed and truncated to 200 Unicode code points. Literal, case-insensitive substring matching uses the existing name, tagline and category fields. No regex/fuzzy search or database access.
- `category` accepts exact merged-catalog labels. `pricing` accepts free/freemium/paid after whitespace/case normalization. Unknown/default values are unrestricted. First occurrence wins for repeated parameters on server and client.
- Known parameters serialize in q/category/pricing order; empty defaults are omitted. Unrelated query entries, including duplicates, retain their order and values. The hash is preserved. Navigation targets are fixed to `/directory`.
- The server parses committed URL filters and passes them as props; the client derives results/selection directly from those props. Only the search draft is local state. Enter or Search commits the draft; typing alone does not filter or navigate. Category/pricing changes retain the committed search (discarding any unsubmitted draft). Individual/all reset controls retain unrelated URL state.
- Meaningful changes use App Router push with `scroll: false`; equivalent URL normalization uses replace; an identical URL is a no-op. Back/forward URL responses restore the committed props and search draft. Refresh parses the same shared contract. There is no category-keyed remount, and no window access during render.
- Explicit label, search form/submit button, named filter groups, aria-pressed states, native keyboard controls, focus-visible outlines and a persistent polite live result count were added. Existing horizontal mobile filter scrolling, responsive grids and empty-result recovery remain.

## Ranking and catalog preservation

The isolated main baseline contains 147 tools. Tests compare catalog slug/category/pricing/rating/featured identity, the complete popularity-ranked slug sequence and the complete featured sequence against the captured baseline. Every category/pricing combination is checked to remain a subsequence of the original rank order without mutating tools. Static rendering checks global rank numbers and tool URLs on filtered cards, and first-occurrence category grouping on the clean page.

`lib/data.ts` is untouched. Popularity scoring, name tie-breaking, featured selection, catalog merge precedence, listing URLs and homepage selections remain unchanged. Source hashes cover data, tool SEO, tool detail page and sitemap. `git diff --exit-code d5cc3b9013accd9a17a5fa132c9dd43d926ab255 -- lib/data.ts lib/tool-seo.ts lib/site-seo.ts data tests/tool-seo.test.ts` returned clean. No pagination or filter-driven reranking was introduced.

## SEO preservation

The directory title, description and clean `/directory` canonical are unchanged. Clean URLs remain index/follow; nonempty first q/category/pricing values, even invalid ones, are conservatively noindex/follow. Empty first values are unrestricted and use the clean index policy; later repeated values are ignored consistently. Unrelated tracking keys do not change robots policy.

Tool metadata, structured-data generation, listing paths, robots and sitemap implementation were not edited. Sitemap verification is explicitly static: unchanged source/hash, one clean directory path, catalog tool enumeration and deduplication. A standalone sitemap import encountered the baseline React 18 `cache` API incompatibility outside Next; no shim was introduced and no runtime sitemap generation is claimed.

## Validation and reproduction

From this worktree in PowerShell:

```powershell
$env:TSX_TSCONFIG_PATH = 'tests/directory-tsconfig.json'
node --import tsx --test tests/directory-filters.test.ts tests/submitted-tools.test.ts tests/tool-seo.test.ts tests/seo-coverage.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js app/directory/page.tsx components/ui/DirectoryClient.tsx lib/directory-filters.ts tests/directory-filters.test.ts
git diff --check
```

| Check | Final result |
| --- | --- |
| New directory/filter tests | 14/14 PASS |
| Existing submitted-tool/catalog tests | 5/5 PASS |
| Existing SEO coverage tests | 4/4 PASS |
| Existing tool SEO tests | 3 PASS, 1 FAIL |
| Combined regression command | 26 PASS, 1 FAIL, exit 1 |
| TypeScript noEmit, no incremental output | PASS |
| Configured ESLint on four changed TS/TSX files | PASS, no findings |
| Additional standalone parser/React-hooks checks | PASS, no findings |
| Diff/whitespace | PASS; Git only warns about normal LF/CRLF conversion |
| React review checklist | Reviewed URL authority, bounded draft sync, stable keys/components, Map-based rank lookup, hydration, accessibility and mobile classes |

Existing SEO failure: `tests/tool-seo.test.ts:20`, slug `a2o-lite-neon-ai-dance-generator`. Its unchanged title plus site suffix is `A2O LITE NEON AI Dance Generator — Features & Pricing | AIBeat.dev` (66 characters; test maximum 65). The test and its catalog/SEO inputs match the base commit. No unrelated catalog/title changes were made to silence it.

Early test preparation exposed standalone JSX transform and React server-cache assumptions; the final test configuration uses the automatic JSX runtime and the sitemap check is explicitly static. The rendered-card test chooses an actual baseline category/pricing combination instead of assuming AI Coding has free tools.

## Limits and next milestone

Navigation tests are an in-memory history model using the real URL decision helper, server-prop reconstruction and static component-wiring checks. Markup tests use React server rendering with a local App Router context double; they are not interactive browser tests. Hydration, real history/refresh, focus/scroll retention, rapid successive interactions, screen-reader announcements, mobile touch/overflow and generated metadata/sitemap still need runtime validation. Search/category changes wait for the App Router response; pending-navigation behavior must be included in that review.

Next authorization: local Nitro-only build and controlled browser validation, using dummy/absent provider configuration and blocked unexpected external traffic. Verify direct combined-filter URLs, repeated/invalid parameters, Enter/Search, individual/all resets, back/forward/refresh, focus/scroll, keyboard/mobile behavior, hydration and emitted SEO. Separately decide whether to correct the existing 66-character title; it is outside this filter change.

No build, application server, browser, database, staging/production access, external API request, migration, deployment, dependency installation, commit, push, PR, remote Git operation or GitHub/Vercel configuration change was performed. C01 remains paused/deferred; GitHub synchronization remains restricted.
