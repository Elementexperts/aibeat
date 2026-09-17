# News Pipeline Production Unblock

## Scope and production evidence

The supplied run showed three valid fact responses rejected for CLAIM_NUMBER_NOT_IN_EXCERPT, an invalid top-level draft followed by a rate-limited repair, incidental Microsoft discovery for a funding story, and known primary date/size retrieval failures. This patch targets those mechanisms. The original failed fact JSON/excerpts were not supplied; it does not claim to prove that every production rejection was a false positive or guarantee those stories will publish.

## Numeric evidence

The shared numerical evidence comparator now uses exact decimal strings, currency units, percentage units and explicit magnitude scales. It never uses floating point rounding or currency conversion. Thousands separators must have valid grouping. Examples accepted: $10 / 10 dollars; $2,200 / 2200 dollars; 10% / 10 percent; 18 million / 18,000,000; 2 billion / 2000 million; 10.00 / 10. Explicitly monetary 'Raised 18 million' may use an excerpt saying 'Raised $18 million', where that value has one source currency. A claim cannot add a currency absent from its evidence. Short k/m/b scales require monetary context or an explicit currency/unit; ambiguous 5m cable is not treated as five million.

Different values, currency mismatches, percent mismatches, different scales and ambiguous currency additions remain rejected. Arbitrary unit conversions, spelled-out numbers and inferred exchange rates are not supported. Every citation still must explicitly support all claim numbers; combining unrelated citations to manufacture support is not permitted. This comparison also applies to existing draft numerical checks, retaining their citation and semantic checks.

## Prompt contracts

Fact extraction now explicitly requires supplied source IDs, minimal exact contiguous excerpts, no paraphrased evidence, and numerical support in every cited excerpt. Claims may be paraphrased. Draft instructions explicitly require one top-level object containing title, deck and sections, describe nested objects, and prohibit null, arrays, encoded strings, wrappers and code fences. Validators are not relaxed. Groq configuration, API format, 3,000 output tokens, one schema-repair attempt, 429 retries and nine actual HTTP-call budget remain unchanged.

## Official discovery

Verified endpoint selection uses organization/product mentions in the candidate headline or a related retrieved article headline. Incidental article-body mentions no longer select endpoint hubs. The existing exact-host registry, known endpoint URLs, discovered outbound URLs, source authority checks and request budget are unchanged. No guessed announcement URLs or Treble-specific exceptions are introduced. Direct retrieved source links still undergo the existing authority/evidence gates. Organization relationships that appear only in prose may be missed; this conservative tradeoff avoids the observed irrelevant hub selection.

## Publication dates

Official pages additionally support citation_date, dc.date.issued, dcterms.issued, dc.date.published, parsely-pub-date, og:article:published_time, and explicit datePublished microdata attributes. JSON-LD recognizes schema.org-qualified article types and typed @value publication dates. Existing datePublished, article:published_time and time datetime support remains. Explicit dateModified time elements are not publication fallbacks. Missing, impossible, conflicting and stale dates still fail; no arbitrary page text or RSS fallback is used. JavaScript-only dates remain unavailable.

## Bounded large HTML

Verified primary HTML may be downloaded through the existing streaming reader up to a hard 4,000,000-byte limit, versus the prior 1,000,000-byte cap. Non-primary documents and feeds keep the 1 MB cap. Both Content-Length and actual streamed bytes enforce limits; oversized streams are cancelled. A large primary page is accepted only after non-JSON-LD scripts, styles and comments are stripped, a complete article/main region remains, and the retained document fits the original 1 MB cap. JSON-LD, article text and metadata are preserved; ordinary extraction/date/minimum-content rules then run unchanged. No partial article truncation is used to evade the download cap. JavaScript-only, still-too-large or undated evidence continues to fail. The 6,500-character model evidence cap and fetch/timeout budgets are unchanged. Temporary download buffers are bounded to 4 MB of accepted bytes plus bounded decoding/compaction copies; the network byte allowance increases only for verified primary HTML, not request count.

## Optional facts

Core numerical mismatches still reject. Only a non-core, independently optional low-risk numerical mismatch may be dropped, before drafting/review, after ALL citations match actual source IDs and excerpts and after confidence, source-policy and date checks pass. The story must be low-risk with no consequential risk assessments; core facts must remain standalone and independently contain event entity/product/date evidence. Referential core claims and qualifying/conditional/comparative optional claims do not qualify. Missing source IDs, fabricated excerpts, confidence failures, primary-source failures, consequential facts and source-policy failures never use this path. DROP diagnostics contain indexes/categories only. Facts are removed, not rewritten, and subsequent semantic review still sees the original sources. This is deliberately narrow; other optional-fact failures remain closed.

## Preserved gates

Quality >=75, fact confidence >=85, story confidence >=85, high-risk verification, source tiers and trust, primary evidence, 48-hour freshness, deduplication, citation provenance, final semantic review, candidate/article limits and schedules remain unchanged. No provider migration, budget increase or additional retry was made. No commit or push.

## Validation results

- npm run typecheck: passed.
- npm run lint: passed; existing ToolLogo.tsx image warning.
- npm test: 390 passed, zero failed (58 added regressions).
- npm run build: passed; 370 static pages generated.
- All 10 workflow YAML files parsed with duplicate-key and required-structure checks.
- git diff --check passed.
- Compared the model adapter from retryDelay onward against HEAD: retry/repair implementation, API settings and global budget are unchanged. Config, risk, trust and workflows have no diff.

Recommended commit: fix(news): normalize numeric evidence and improve primary retrieval
