# Bing SEO audit — 2026-09-30

Source: aibeat.dev_FailingUrls_9_29_2026.csv (50 URLs). The CSV has only a URL column, without issue labels or Bing thresholds. Before-edit live evidence is saved in tests/fixtures/bing-seo-before.json.

## Findings

- All 37 supplied tool URLs used generic review descriptions (79–99 characters). The shared generator now uses product descriptions, meaningful pricing when needed, and existing category data for search and social snippets.
- Reverse Image Location was the longest title at 67 characters including the layout suffix. Vedic Astrology Chart was also 66. Both exceeded the chosen 65-character budget; the export cannot establish a single Bing-flagged title. They are now 56 and 55 characters; other supplied tool titles are unchanged.
- All 1,118 image occurrences across the 50 live responses had ALT attributes. Raw images in ToolLogo, Footer, partners, and the submission badge HTML already have ALT. No missing-ALT defect was reproduced. Decorative news thumbnails intentionally have empty ALT. No speculative image edits were made.
- /directory?category=AI Video returns noindex,follow with a clean canonical. Search parameters remain noindex. /business/dashboard and /business/context redirect unauthenticated requests to sign-in; authentication pages are noindex. Protected workspace metadata remains noindex,nofollow. No robots.txt URL was supplied and no policy defect was demonstrated.
- Seven public landing-page descriptions were short. Their new text describes existing content and removes unsupported blanket claims such as 500+ tools, hands-on testing, and no credit card required.

## Diff

- lib/tool-seo.ts: reusable description generator; 120–160-character target; sentence/word-boundary truncation; product-pricing fallback; title budget includes layout suffix.
- app/tools/[slug]/page.tsx: delegate metadata to the shared helper.
- app/{categories,compare,directory,free-tools,launches,news,tools}/page.tsx: description text only.
- tests/tool-seo.test.ts: catalog uniqueness/lengths, supplied URL coverage, title evidence, sparse data.
- tests/seo-coverage.test.ts: raw ALT coverage, directory robots, protected-page metadata, unauthenticated middleware redirects.
- tests/seo-built.test.ts: actual production HTML metadata/social descriptions and semantic logo ALT; rendered image coverage on supplied static pages.
- package.json: register unit tests and explicit post-build checks.

## Limits and unchanged scope

Muse Video is an existing test record whose only description is “Muse Video (test).” Its snippet remains short rather than inventing facts. The other 115 catalog descriptions meet the target; all 116 are unique.

The supplied /news/gta-vi-goes-digital article retains its short existing deck. Expanding it requires editorial evidence; no automated padding or article architecture change was made.

News-quality/publishing code, NewsArticle architecture, sitemaps, indexing strategy, IndexNow, authentication, private-route metadata and robots rules are unchanged. The only news page edit is its public index description.

No commit, push or deployment. Work is in the existing feature-mangatranslate worktree; the original checkout and its unrelated outreach CSV edit are untouched.

## Validation

- npm run typecheck: passed after replacing iterator spreads and a block function declaration for this repository’s ES5 TypeScript target.
- Relevant tool SEO, ALT/robots, news SEO and submitted-tool tests: 20 passed, 0 failed.
- npm run build: passed; all 401 pages generated. Existing ToolLogo next/image lint recommendation and webpack cache-performance warnings only.
- npm run test:seo-built: 2 passed, 0 failed; checks all 116 tool pages and supplied static-page images in production HTML.
- git diff --check: passed.

Tracked diff: 10 files, 67 insertions, 17 deletions. Five additional untracked files are the audit report, captured evidence fixture, and three regression test files. Nothing is staged, committed or pushed.
