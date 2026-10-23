# A1 — source inspection

Date: 2026-10-23. **Inspection COMPLETE; implementation NOT AUTHORIZED; runtime/visual validation NOT EXECUTED.** Only this document and `a1-implementation-proposal.md` are new. No application, existing document, test, workflow, configuration, dependency or data file is changed. No application tests, typechecker, lint, dependency installation, build, browser, service, external request, commit, push or deployment was run. Read-only Git/file inspection, hashing and arithmetic on literal CSS tokens are inspection evidence only.

## 1. Approved references and repository baseline

All five required A0 documents were located and read during context recovery immediately preceding this inspection: `a0-preservation-baseline.md`, `a0-feature-scope-matrix.md`, `a0-implementation-staircase.md`, `a0-risk-and-release-gates.md`, `a0-executive-decision.md`, all under `docs/aibeat-directory-lite/`. The user's strategic approval supersedes their historical wording that scope approval was pending. It does not authorize implementation, runtime execution or release. AIBeat remains news, intelligence and curated tools; advanced launch/community platform work belongs to Toolsvio. Existing AIBeat commercial/launch offerings remain protected. The approved Lite roadmap's future basic votes/comments are outside A1.

| Item | Inspected current value |
| --- | --- |
| Repository / locally configured origin | Elementexperts/aibeat / https://github.com/Elementexperts/aibeat.git; no remote contacted |
| Root / worktree N | C:/Users/User/.codex/visualizations/2026/10/19/01a1539a-8159-7e13-bed8-88bc44dd19fd/nitro-v2-directory-discovery |
| Branch | codex/nitro-v2-directory-discovery; expected branch matches |
| HEAD | ed9ae9ede6fc73fdb53051246124db3418bcf0e9; expected baseline matches |
| Index / tracked changes at start | None |
| Pre-existing untracked files | 12; listed below; all preserved |
| Inspection instructions | No repository AGENTS.md found by the scoped inventory; A0/task restrictions apply |

The twelve existing untracked files are the five A0 documents above and these seven files: `.github/workflows/nitro-stage-0b-validation.yml`; `docs/nitro-v2/nitro-0b-ci-activation-checklist.md`, `nitro-0b-ci-design.md`, `nitro-0b-ci-implementation.md`, `nitro-0b-ci-security-review.md`, `nitro-0b-remote-testing-assessment.md`, `nitro-0b-testing-decision.md` (all six reports in that directory). Nothing was staged or removed.

Available worktrees (prefix C:/Users/User/ unless absolute N/F/C above/below):

| Worktree | Current HEAD / branch |
| --- | --- |
| N, current root above | ed9ae9e / codex/nitro-v2-directory-discovery |
| F: .codex/visualizations/2026/10/21/01a15e18-514a-71a0-b62d-157f773f95b3/nitro-v2-founder-submissions | af519d1 / codex/nitro-v2-founder-submissions |
| C: Desktop/aibeat-main/aibeat-main | 8e395c9 / codex/c01-business-authorization-hardening |
| .codex/worktrees/1a38/aibeat-main | b42ecd3 / detached |
| .codex/worktrees/95ca/aibeat-main | a94b28e / detached |
| .codex/worktrees/a087/aibeat-main | 928e8d9 / detached |
| .codex/worktrees/ff1b/aibeat-main | 0d21431 / detached |
| .codex/worktrees/latest-tool-submissions/aibeat-main | 605f44c / codex/latest-tool-submissions |
| .codex/worktrees/oct19-tool-listings/aibeat-main | 64ad465 / codex/oct19-tool-listings |

N/F/C are preservation subjects, not integration targets. Nitro 1A `52c6e90a8320ce46623c7c09db09310426ab73fd` remains in F's checkpoint ancestry; 1B-A HEAD is `af519d1e28e9a2224e2568339c3215b755a9b15e`. C01 HEAD is `8e395c9d586559ba5233939fea3305e802ee1d83`. No branch/worktree switch, reset, stash, merge, cherry-pick or rebase occurred. Other registrations were inventoried, not audited as application sources.

## 2. Route and component map

Evidence references are repository-relative source paths and inspected line numbers, not production URLs fetched by this task. “Tests” below describes coverage found in source, not new passing results. DF=`tests/directory-filters.test.ts`; ST=`tests/submitted-tools.test.ts`; TS=`tests/tool-seo.test.ts`; SC=`tests/seo-coverage.test.ts`; SB=`tests/seo-built.test.ts`.

| Exact file / component or function | Responsibility and dependencies | Scope / other-page impact | Existing relevant tests |
| --- | --- | --- | --- |
| app/directory/page.tsx:8–17 / generateMetadata, DirectoryPage | /directory server entry; TOOLS categories, parseDirectoryFilters, DirectoryClient; clean canonical and filter robots policy | Directory-only route; protected SEO/URL boundary | DF metadata/server-prop tests; SC metadata |
| components/ui/DirectoryClient.tsx:15–193 / DirectoryClient | Search form, Category/Pricing groups, clear/status/empty states, grouped/flat grids and submit CTA; React state/memos/effect, next/navigation, next/link, data/filter/analytics helpers, ToolLogo/ToolAffiliateOffer | Directory-only; only current importer found is app/directory/page.tsx (plus DF) | DF covers filters, static markup, grouping and source wiring; no browser execution |
| components/ui/DirectoryClient.tsx:195–224 / private ToolCard | Product logo/name/category/tagline, global #rank, rating/pricing and optional affiliate offer; next/link and shared display helpers | Private local function used in both directory grids; safest first edit surface, not exported/shared | DF listing URLs/ranks; no direct card heading/focus/overflow/featured assertions |
| lib/directory-filters.ts:12–51 / parseDirectoryFilters, hasDirectoryFilterInput, directoryFilterHref, directoryNavigation, filterDirectoryTools | Pure parsing/serialization/navigation/filtering contract; no service dependency | Used by directory server and client; must remain unchanged | DF parsing/search/AND/history model/clear/robots; SC |
| lib/data.ts:22–42,2090,2495–2539 / Tool, TOOLS, getFeaturedTools, getToolPopularityScore, getPopularTools, getToolRatingLabel | Catalog interface/merge, deterministic popularity order and featured subset, factual score labels; submitted/automated data and merge helper | Shared homepage/news/tools/comparisons/free/launch surfaces and automation; excluded | DF frozen catalog/ranks/hashes; ST fields/featured/unrated; TS metadata |
| lib/automated-tool-catalog.ts:4–25 / productIdentity, mergeToolCatalog | Manual precedence; slug/product-URL dedup; no server imports | Shared website/worker; excluded | Catalog/submission automation suites; DF protected data baseline indirectly |
| app/tools/page.tsx:13–113 / ToolsPage | /tools alternate all-tools index in TOOLS order; local inline cards, rating/logo, inert category spans, trending/submit links | Separate route, not DirectoryClient; changing it is an additional slice | SC image scan; no dedicated category interaction/card-layout test located |
| app/tools/[slug]/page.tsx:13–158 / generateStaticParams, generateMetadata, ToolPage | Detail pages and notFound; data/tool SEO, filesystem articles, ToolLogo, ToolShareLinks, ToolAffiliateOffer; category deep link, related news, outbound affiliate/official links | Protected indexed detail paths; article/data/SEO coupling; excluded | DF protected source hash; TS tool metadata; SC ALT; SB built HTML only |
| app/categories/page.tsx:11–43 / CategoriesPage | Unique categories/counts and encoded /directory?category= links, first three tool names | Separate category route; no taxonomy rewrite | No dedicated category browser test located; source baseline protects links |
| app/free-tools/page.tsx:13–end / FreeToolsPage | Free/freemium subsets with inline card markup, shared logos/rating, newsletter subscription surface | Separate route with newsletter coupling; excluded | Catalog coverage indirectly; no dedicated layout coverage located |
| app/launches/page.tsx:12–39 / LaunchesPage | getFeaturedTools collection, PremiumToolCard, /launch CTA; not a scheduling/competition engine | Existing launch/promotion route, protected | ST featured membership; no paid-origin presentation test found |
| components/ui/PremiumToolCard.tsx:19–83 / PremiumToolCard | Shared standard/featured/compact type; enlarged variant layout, tool.featured badge, score, pricing, View link, presentation-only Save button | Homepage app/page.tsx:216,236,312 and /launches:31; NOT the /directory card; excluded | No dedicated interaction/accessibility tests located; ST only data membership |
| components/ui/ToolLogo.tsx:18–42 / ToolLogo | Lazy/async img with name+logo ALT; absent/error fallback to initials/background; React useState | Directory/detail/home/news/free/tools/comparison shared; do not edit | SC raw JSX ALT scan; SB built tool ALT; no onError/fallback AT/browser test found |
| components/ui/ToolAffiliateOffer.tsx:3–25 / ToolAffiliateOffer | Existing discount/code, external CTA, commission disclosure, rel sponsored/noopener/noreferrer | Shared directory and tool detail; commercial contract, excluded | No direct card-layout/offer-accessibility test located |
| components/layout/CommandSearch.tsx:17–end / CommandSearch | Ctrl/Cmd+K modal, featured defaults, query over name/tagline/category/description; six tool results plus pages | Global Navbar search; semantics intentionally differ from directory, excluded | No dedicated keyboard/focus test located |
| components/layout/Navbar.tsx:13–48, Footer.tsx:8–12, BreakingTicker.tsx:4–5 | Discover /directory, /tools, /categories, /free-tools; Launches/Trending /launches; footer/ticker links | Shared site navigation; excluded, no route relabeling | No dedicated directory nav/browser test located |
| app/layout.tsx:93–123 / RootLayout; app/globals.css:35–88,136–205; tailwind.config.js | Shared shell/scripts/main/nav/footer; global focus and hover classes, legacy paper/ink tokens, responsive utilities | Site-wide including news/Business/promotions/auth; immutable in A1 | DF checks only presence of focus/overflow utility text; no computed-style/contrast evidence |

Directory sorting controls: **none found** in DirectoryClient. The existing order comes from getPopularTools, not a select/menu. Directory pagination: **none found**; all matches are rendered. /tools uses catalog order, /categories catalog-category order, /launches featured catalog order; do not unify those orders. The directory's unfiltered DOM groups by first category occurrence in the ranked list, with ranked subsequences inside each category. It is not a globally sorted flat DOM in the unfiltered view.

## 3. Listing-card findings

| Aspect | Source evidence / supported finding | Impact and verification limit |
| --- | --- | --- |
| Name / hierarchy | DirectoryClient:203 name is text-sm semibold in a div; category:204 is uppercase 10px, tagline:205 11px/clamped to two lines | Product name visible and strongest card text, but no heading navigation per card. Dense supporting text; exact perceived readability unverified |
| Description | Uses existing tool.tagline, not full description; two-line clamp; no title/expansion | Full product details remain on same destination. Do not truncate stored data or replace tagline with marketing copy. Visual clipping/zoom requires runtime |
| Category | One string per Tool, one label per card, no dedicated wrapping constraints | Multiple category chips are not supported by this data shape. A long single category can wrap; actual clipping/overflow unverified; no new taxonomy/multi-category feature |
| Pricing / rating | DirectoryClient:206–215 flex justify-between/items-center, no wrap/gap; free/freemium are labels, paid displays tool.pricing; getToolRatingLabel gives AIBeat Score or Not yet rated | Preserve exact factual values. Long paid text and score can compete for width; wrapping proposal supported by layout source, actual overflow not measured |
| Imagery | 36px square logo, shrink-0; ToolLogo onError switches to initials/background | Missing logoUrl already has fallback; don't invent missing-image defect. Actual failed-load swap, initials contrast and AT fallback name unverified |
| Primary action | DirectoryClient:198–216 one block Link to /tools/slug encloses main card content; no explicit View label; outer p-4 and affiliate block are outside that link | Native Enter navigation available; not literally whole card clickable. Existing link name can include logo, rank, category, description, rating and price. A concise name can improve link lists without a second duplicate link |
| Affiliate interaction | Separate ToolAffiliateOffer outside main Link:217–220; offer contains its own external anchor/disclosure | No nested anchor in current card. Keep separate sibling offer, destination/rel/disclosure/promo code unchanged; padding must not conceal offer |
| Hover / focus | Link has block card-hover; globals.css:86–88 only sets transition-colors/cursor-pointer; global :focus-visible:58–61 exists | Do not claim focus is absent or hover transforms this card. No directory-specific hover color or focus override. Focus contrast can be improved locally; real clipping/visibility unverified |
| Narrow viewport | Both grids at DirectoryClient:153,168 use grid-cols-2 md:grid-cols-4; no one-column base. p-4 cells; score/pricing unwrapped | At 320px before borders, two columns yield about 160px cells and about 128px inner width. This is arithmetic, not screenshot evidence. Long names/category/price/offer content may become crowded |
| Long strings | Name/category/price lack break-words/min-w-0 guards; tagline clamps visually | Safe local wrapping/stacking is useful, without changing source strings. Do not claim a specific current catalog entry overflows without rendering |
| Featured indicator | Directory ToolCard never reads tool.featured; no badge currently. PremiumToolCard reads it:36–41 | Directory currently has no visual standard/featured distinction; preserve existing fields/membership/order. Paid interpretation unresolved; see section 5 |

## 4. Accessibility evidence and limits

Existing positives: native detail anchors, search form role and associated label, explicit Search submit button, named Category/Pricing groups with aria-pressed, focused filter controls, live polite/atomic result count, clear/empty recovery buttons, global keyboard focus outline, logo ALT. These are source features, not proof of assistive-technology compatibility. There are no nested interactive controls in the directory detail anchor.

Specific issues suitable for a local proposal: product name is not a heading; card accessible name is verbose; category and rank use light ink-4 at 10px; the global focus cyan is light against the directory paper surface. The fallback div's aria-label is not equivalent to a semantic image role; no browser/AT result establishes its announcement. Prefer treating the repeated card logo as decorative through a directory-only wrapper if the detail link is explicitly named from the visible product title, rather than altering shared ToolLogo.

Static token evidence: tailwind.config.js supplies ink-4=#999999, ink-3=#666666, ink=#0a0a0a, paper=#f8f7f4. app/globals.css:202–204 gives main's non-dark-page child the paper surface; app/layout.tsx:120 inserts directory children there. Standard sRGB relative-luminance arithmetic on these literals gives ink-4/paper **2.66:1**, ink-3/paper **5.36:1**, ink/paper **18.48:1**, global focus cyan #22d3ee/paper **1.69:1**. This supports replacing light small text and local focus styling. These are token-pair calculations, not computed browser contrast, exhaustive badge/hover/theme contrast, WCAG certification or proof that every pixel has that background. Rendered backgrounds, focus adjacency, zoom, loaded fonts and all pricing/offer states remain unverified. No remote standard/document was fetched.

No card aria-label by itself fixes heading hierarchy, reading order or focus styling. Preserve visible product names within accessible link names, don't use aria-hidden on an interactive subtree, and don't add an inert View button. Card-sized main links already offer large targets; filter/offer/submit target dimensions and focus clipping need later measured checks. No claim of a target-size failure is made from class names alone.

## 5. Featured, sponsored and editorial meaning

Tool interface (`lib/data.ts:22–42`) exposes featured:boolean, rating, affiliate URLs/offer and product fields; no per-tool paid-placement origin, sponsorship interval or editorial-selection provenance field. getFeaturedTools simply filters featured. getToolPopularityScore adds featuredBoost=8 to other heuristic weights; this is not an organic vote rank. Standard/nonfeatured is only featured=false, not proof of free placement. Rating is independent and nullable; never fabricate community scores or interpret null as zero in presentation.

PremiumToolCard's visual `variant==='featured'` is distinct from `tool.featured`: the former controls large layout; only the latter renders its Featured badge. Homepage uses enlarged variants for selected popular tools too. The directory uses neither variant nor badge. /launches renders the featured subset but has no live campaign timing proof.

Commercial source creates ambiguity: `data/founder-services.ts:143,173,331–380` describes Featured visibility, Sponsored paid promotion, and CONTENT_LABELS calls Featured purchasable/paid. The catalog also contains literal “Free featured option” pricing (`lib/data.ts:942,1885,1932`). Consequently the boolean alone cannot certify paid vs editorial selection. `app/affiliate-disclosure/page.tsx:45` says rankings aren't sold while the heuristic includes a featured boost; this is a provenance/product-policy question, not proof that a particular listing bought rank. Do not change logic or promises in this task.

Current directory affiliate offers do clearly disclose potential commission separately (`ToolAffiliateOffer.tsx:12–21`). An affiliate relationship is not proof of paid placement. No reliable per-tool “Sponsored” or “Editor's Pick” derivation was found in inspected catalog/card code.

Minimal optional proposal: add a neutral Featured badge only for tool.featured after explicit wording approval, preserving all selections and scores, and never treating it as a paid/verified/organic badge. It does not solve paid disclosure. Accurate Sponsored/Editorial labels require independently reviewed per-listing provenance and an additional data/commercial scope; defer rather than guess. No P0 data/paid-label change is recommended.

## 6. Nitro 0A invariants: leave discovery unchanged

Preserve `lib/directory-filters.ts` in full, `app/directory/page.tsx` in full, DirectoryClient's state/memo/commit/filter/group/render ordering, `lib/data.ts`, `lib/automated-tool-catalog.ts`, catalog sources, baseline JSON, SEO/detail routes, sitemap/robots and shared navigation.

- parseDirectoryFilters: first occurrence for repeated q/category/pricing (including empty first value); trim q, cap at 200 Unicode code points, exact allowed category; pricing trimmed/lowercased and restricted to free/freemium/paid; unknown values reset to default.
- filterDirectoryTools: literal case-insensitive substring of name/tagline/category, AND with exact category/pricing; stable filter of already ranked tools, no fuzzy search, URL fetching or new fields.
- directoryFilterHref/directoryNavigation: fixed /directory route; q/category/pricing serialization order, empty omission, preserve unrelated duplicate query entries/order and hash; no-op on identical URL, replace for normalization-only differences, push for semantic change.
- Client state: initialFilters authoritative; draft search commits by Enter/Search, not onChange. useEffect syncs q/category/pricing after navigation; mounted input retained, router scroll:false. Keep clear individual/all controls and empty recovery.
- Ranking/grouping: use getPopularTools unchanged; ties use name.localeCompare. Global ranks are assigned before filtering/grouping and are never renumbered. Unfiltered groups follow first category occurrence; filtered flat lists are stable ranked subsequences. No sort control or pagination to add.
- Metadata: clean /directory canonical/title/description unchanged; first nonempty filter input, even invalid, yields noindex/follow, clean/irrelevant-query URL index/follow; do not turn repeated/empty semantics into a new convention.
- Frozen baseline JSON records 147 catalog entries, 31 categories and 33 featured entries; exact catalog/ranked/featured sequences and four protected source hashes are existing assertions, not a newly executed catalog test. Don't refresh this fixture to accept drift.

## 7. Existing tests and gaps

DF contains fourteen node:test cases: parse/defaults, repeated params, Unicode bounds, serialization/hash preservation, literal AND matching, modeled history/back/forward/refresh, clear behavior, frozen catalog/rank/featured/source hashes, all category/pricing combinations, server markup/links/global ranks, grouped/empty markup, metadata, static sitemap source and client wiring. It uses renderToStaticMarkup with a stub AppRouterContext; no effects, real clicks, browser history, focus or CSS layout are exercised. Its existing rank-span and section-label regexes are structural assumptions to preserve where possible; don't discard assertions to accommodate unnecessary markup churn.

ST covers catalog identity, featured selection, unrated factual labels and preserved requested listings. TS covers product metadata/length/canonical and sparse product facts; the A0-documented 66-character title vs 65 assertion is historical, not rerun here. SC checks ALT declarations, directory robots/canonical and broader Business metadata/middleware. SB reads prebuilt .next HTML after an authorized build; it is not a browser/responsive test and is not runnable evidence without that artifact.

No dedicated directory test found for heading/link-name quality, logo fallback error interaction, Featured label semantics, touch sizes, computed focus/contrast, keyboard traversal, narrow viewport, zoom or long-string overflow. No Playwright configuration/test was found by the repository inventory; no browser tooling should be added as part of the first source slice. Package npm test includes broader suites and omits directory-filters; use the explicitly documented focused invocation after separate execution approval, never assume npm test covers A1.

Command references only (NOT RUN), from `docs/nitro-v2/nitro-0a-implementation-report.md:53–61` and disabled CI steps:

```powershell
$env:TSX_TSCONFIG_PATH = 'tests/directory-tsconfig.json'
node --import tsx --test tests/directory-filters.test.ts tests/submitted-tools.test.ts tests/tool-seo.test.ts tests/seo-coverage.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js app/directory/page.tsx components/ui/DirectoryClient.tsx lib/directory-filters.ts tests/directory-filters.test.ts
git diff --check
```

The recorded 0A 14/14 and combined 26 PASS/1 FAIL counts are historical only. Current untracked Nitro 0B workflow:97–131 deliberately fails containment and disables install/type/lint/tests/build. It must not be activated, dispatched or altered. Its diff allowlist does not approve Directory Lite files. Runtime/dependency-lifecycle/no-egress/descendant/teardown qualification remains a separate gate. Localhost and environment flags alone do not qualify execution; shared layout analytics/ads, logos, remote badges, middleware and link prefetch require an enforced boundary. Do not follow canonical/affiliate/production URLs for validation.

## 8. Shared risks, uncertainties and preservation

Keep the private directory ToolCard in place. Do not extract a reusable cross-site card or retrofit PremiumToolCard: that would affect homepage/news/promotions or introduce false Save functionality. Do not edit ToolLogo/ToolAffiliateOffer, global CSS/Tailwind, Navbar/CommandSearch/Footer, RootLayout, news/article files, Business/auth/middleware, payments/submission/worker/config/migrations/workflows. Local Tailwind utility changes in DirectoryClient avoid new stylesheets and global selectors. Caller-local logo decoration must leave all other logo usages intact.

Unverified: live deployed commit/UI; actual mobile/zoom/focus/AT/contrast; failed images and outbound behavior; complete commercial provenance; qualified runtime/release route. Historical 403, preview-to-production redirects and no real 1B-A integration are not resolved by this inspection. No infrastructure or credentials were accessed to resolve them. The exact UI delta still needs implementation approval; the companion proposal is the requested concrete review surface.

Preservation inventory before documentation: N 902 existing tracked/nonignored-untracked files, F 915, C 1030. Link/reparse entries are rejected by the inventory rather than followed. Ignored node_modules/caches/environment files are outside this hash inventory and were not edited or traversed. Existing N/F/C HEADs/index/status and byte-hash inventories are compared again after the two authorized documents are written. The earlier context-recovery check also matched all 86 C01 evidence hashes, both protected migration hashes, 14 founder checkpoint files and nine original 0A checkpoint hashes against retained records. No existing docs need rewriting to reflect this task.
