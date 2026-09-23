# News publishing and Bing SEO follow-up — 2026-09-23

## Changes

- Facts, source authority, freshness, publication scoring and model/provider settings are unchanged.
- The current HEAD already uses 30 model calls, not the older nine-call limit. Tests now exercise the configured budget; this patch does not increase it.
- Review logs expose only boolean quality flags and counts, not prompts, source text or model responses.
- Draft instructions request a specific, evidence-grounded reader implication and concise headlines; no new model call or editorial override is added.
- 429 cooldowns retain the provider reset and add a one-second buffer. Waits up to 60 seconds are honored across stages and candidates. Longer waits defer requests without spending calls until the remaining cooldown fits the wait window. Stage attempts and repairs retain their existing limits. This replaces the early retry caused by the old 30-second clamp.
- Preserve the ENHANCED_VERIFICATION result label after forced corroboration. The previous commit failed its existing regression test because the returned evidenceMode became TRUSTED_SINGLE_SOURCE despite forced verification. This is a reporting-label correction, not an acceptance change.
- Official OpenAI, Google and NVIDIA feeds join the existing broad technology feeds. Three additional discovery requests share the existing 32-request ceiling; source and candidate limits are unchanged. Exact-host authority rules and document-level review still apply.
- OpenAI and Google targeted discovery now use those feeds. No guessed article URLs or unrestricted scraping.
- Article HTML titles retain the complete headline without the inherited site-name suffix. The visible headline, social title, schema headline and article content are preserved.
- Tool logos and footer badges have descriptive alt text. Duplicate animated badge links remain aria-hidden and outside keyboard navigation. Editorial thumbnails remain decorative next to their linked headlines.

## Verified endpoints

Public checks returned HTTP 200 and parsed RSS on 2026-09-23:

- https://openai.com/news/rss.xml — 744,049 bytes; linked by https://openai.com/news/
- https://blog.google/rss/ — 29,615 bytes
- https://blogs.nvidia.com/feed/ — 277,953 bytes

All fit the existing 1,000,000-byte feed response limit. Future growth or retrieval failures still fail safely.

## Bing report evidence and limits

The first CSV contains issue totals (1 4xx, 388 image-alt warnings, 78 title warnings, 13 multiple-H1 notices). The second CSV lists only pages in the image-alt category. It does not identify the 4xx or other categories' affected URLs.

The live home page and the listed AfterQuery article both returned HTTP 200, had one H1 and no img elements missing an alt attribute. Empty alt values were present, including duplicated footer badges shared by both pages. This is consistent with the widespread image warning but does not prove Bing's exact element-level cause. A pre-change local build scan of 336 HTML pages found no missing alt attributes or multiple H1s; 92 titles exceeded a heuristic 65 characters. That threshold is an audit heuristic, not a Google ranking limit.

The unidentified 4xx and historical H1 notices remain unconfirmed. Do not redirect arbitrary missing URLs or rewrite article bodies without affected URLs. Some complete article titles can still be long; never truncate away factual qualifiers to meet a length heuristic. Bing needs a fresh crawl after deployment to establish revised counts.

## Citations and backlinks

Existing article source links and NewsArticle.citation already expose used evidence URLs. Official feed discovery supplies additional eligible primary sources to this mechanism. Adding outbound citations does not obtain inbound backlinks from OpenAI or other publishers, and no ranking gain is guaranteed. No outreach, backlink purchase, production publishing, commit or push is performed by this patch.

References: https://developers.google.com/search/docs/appearance/title-link and https://console.groq.com/docs/rate-limits

## Final validation

- Full npm test: 416 passed, zero failures.
- Typecheck: passed.
- Lint: passed with the pre-existing ToolLogo next/image advisory.
- Production build: passed, 373 generated routes.
- All 10 workflow YAML files parsed successfully; git diff --check passed.
- Post-build HTML scan: 339 HTML files, no missing alt attributes and no multiple H1s. Only one page retains empty alt values (decorative news thumbnails). The listed AfterQuery article has zero empty image alt values and its title no longer includes the site suffix.
- 63 rendered titles still exceed the heuristic 65-character count, compared with 92 in the older local build. The builds contain different page counts (339 vs 336); these are local checks, not replacement Bing crawl results or proof that all reported title issues are fixed.
- No commit, push, deployment or production news generation was performed.
