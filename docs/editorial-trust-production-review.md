# Editorial Trust v1: first production execution review

Review date: September 16, 2026. No commit, push or production execution was performed by this review. Live probes retrieved public feeds/documents only; they did not call Groq or create articles/images.

## 1. Which discovery source was unavailable

**Not recoverable from the supplied execution log.** The old catch block deliberately discarded both the feed URL and the exception. The supplied workflow YAML does not include run-specific data. GitHub Actions API access returned 404 through both the available connector and an unauthenticated read, so no additional execution evidence was available.

All four configured endpoints were rechecked with the existing fetcher and RSS parser:

| Feed | Current check |
| --- | --- |
| `https://techcrunch.com/category/artificial-intelligence/feed/` | HTTP 200, 20 items |
| `https://feeds.feedburner.com/venturebeat/SZYF` | HTTP 200, 7 items |
| `https://www.theverge.com/rss/index.xml` | HTTP 200, 10 items |
| `https://hnrss.org/frontpage?q=AI+LLM+GPT+Claude+Gemini` | HTTP 200, valid feed, zero items |

The empty HN feed is not an unavailable feed: it parses successfully. These present-day observations do not establish which endpoint failed earlier. Naming one as the production failure would be speculation.

## 2. Why it was unavailable

The historical cause is likewise unknown. The old message covered HTTP errors, timeouts, DNS failures, body/type limits and XML parsing errors. All four passed the same retrieval limits during this review. New logs report the endpoint and specific safe failure code, and distinguish a valid empty feed from an unavailable endpoint. URLs omit credentials, query strings and fragments; exception bodies and documents are not logged.

## 3. Why every candidate showed Primary: 0

The six observed headlines were still present in the current feeds. Replaying the original collector reproduced zero primary documents for all six, without model calls. The four slots were occupied by:

| Candidate | Reproduced old selection |
| --- | --- |
| Boox Palma 3 | Four Verge pages, including an author page and 2024 Palma coverage |
| Canon EOS R8 Mark II | Four Verge pages, including an author page and different-camera coverage from 2025 |
| Nvidia/Jensen Huang | Four TechCrunch pages, including older and unrelated reporting |
| AI/data-center polling | Four Verge pages, including an author page and March/April coverage |
| Data-center boom | Four TechCrunch pages, including July coverage and a category page |
| Microsoft Windows/Surface event | Four Verge pages: current story, author page, newsletter landing page and a May 2024 roundup |

The old collector expanded links only on its first valid source. Links on later pages were ignored; a page failing body/date extraction lost all its discovery links. Same-publisher links could exhaust four evidence slots before a primary source was found. RSS content links, structured source/canonical links and known official discovery endpoints were not used. Unknown official-looking domains correctly remained Tier 3; Boox/Canon were not silently promoted to primary.

## 4. Bug or insufficient evidence?

**Both.** Confirmed discovery bugs reduced the chance of finding primary evidence. The minimum-evidence rules correctly prevented unsupported publication. Zero publications alone is not a failure.

A separate confirmed independence bug affected the Microsoft collection: the old May 2024 Verge roundup included a reference to Reuters and was reassigned to the Reuters group. It was still a Verge document, not independent Reuters reporting. This could let a same-publisher collection pass the initial two-group check. The fix retains publisher ownership and only collapses groups for explicit wire bylines/copying; a reference to Reuters never creates independence. The semantic independence review remains required.

## 5. Primary-source discovery improvements

- Retain official outbound hints from RSS article content; hints are never evidence by themselves.
- Extract article links, canonical/source links and typed JSON-LD citations before body/date validation, and from every retrieved document.
- Prioritize exact-registry primary URLs ahead of secondary links; allow primary discovery to replace a secondary slot when necessary.
- Ignore author/category/tag navigation, pagination, administrative handlers and page chrome; require topical overlap for linked Tier 2 articles.
- Use at most two verified official entry points for organizations mentioned in the headline or article text. Supported entry points include Microsoft/Windows, NVIDIA, OpenAI, Anthropic, Google, Meta and Adobe. Company blog/newsroom pages and RSS feeds supply actual article URLs; no article path is guessed.
- Added exact-host registry entries for `blogs.windows.com`, `blog.adobe.com` and `news.adobe.com`, verified against official pages. Existing exact-host and community-path restrictions remain.
- Existing government/regulatory/research and scoped official GitHub rules still apply to discovered links. No arbitrary domain, repository or subdomain becomes primary.
- Listing pages and RSS summaries do not become primary evidence; linked documents must be retrieved and pass normal extraction and publication checks.
- Log individual retrieval failures, retrieved publication dates, primary URL counts, document counts, Tier 2 groups before semantic review, attempts and decision stage.

Official endpoint checks: Microsoft and NVIDIA feeds returned valid RSS; Windows, Anthropic, Google, Meta and Adobe pages were accessible. OpenAI's news page returned HTTP 403 from the probing environment; this remains a logged failure rather than a bypass. Endpoint availability is not guaranteed across hosts or time.

## 6. Microsoft INVALID_DATE investigation

The current [Microsoft event article](https://www.theverge.com/news/994714/microsoft-windows-surface-event-october-7-san-francisco) has a usable publication date: **2026-09-15T20:36:59Z**, parsed successfully by the old and new extraction paths. Thus the current candidate is not missing its publication date, and this review did not reproduce a parser failure on that article. The old collector also supplied 2024/older documents, which could confuse event extraction.

The exact historical INVALID_DATE branch cannot be established without the original extracted facts/review, which were not retained. In this code, an old event produces STALE_STORY, while INVALID_DATE can mean malformed/future event date, missing exact event-date evidence, invalid supporting publication date or reviewer refusal to verify the event date. A date conflict can also be expressed through review refusal. Do not infer that the September announcement was stale solely from this message.

October 7 is a scheduled event date, not the September announcement date. The extraction prompt now explicitly distinguishes these; the announcement date must itself be evidenced. Future-event and 48-hour checks are unchanged. No model replay was run, so this distinction is a plausible failure mode, not a proven historical model error.

Separate parser defects were corrected: case-insensitive/itemprop publication metadata, correct quoted HTML attributes, typed article JSON-LD rather than the first arbitrary embedded datePublished, calendar rollover rejection, and distinct missing/unparsable/conflicting publication-date diagnostics. These defects are regression-tested, but are not claimed as the Microsoft execution's proven cause.

With the false Reuters grouping removed, the current Microsoft collection has one publisher group and no matching primary announcement from the checked official entry points. It is insufficient evidence before model generation, regardless of the date question.

## 7. Request-budget impact

No increase. Limits remain 32 evidence requests per run, six source attempts per candidate, four evidence documents, six candidates, nine model calls, 12-second requests and existing size/token caps. Official endpoint requests consume those same limits, including redirects. At most two endpoints are considered per candidate and cached across candidates. Threshold 75, confidence 85, high-risk corroboration and 48-hour freshness are unchanged.

A read-only replay during development used 24 requests including four charged discovery-feed requests, versus 30 in the reported production run. It found a Meta primary document dated July 28 (context only, not fresh-event support) and logged a linked OpenAI HTTP 403. That run is a diagnostic observation, not a performance or publication guarantee; the final patch also filters administrative/tag links seen in the replay. No live model calls were made.

## 8. Files changed

Modified:

- `scripts/fetch-and-post.ts`
- `scripts/news-quality/config.ts`
- `scripts/news-quality/types.ts`
- `scripts/news-quality/sources.ts`
- `scripts/news-quality/gate.ts` — diagnostic detail only; same decision requirements.
- `scripts/news-quality/pipeline.ts`
- `scripts/news-quality/model.ts` — evidenced announcement-date clarification.
- `tests/news-quality.test.ts`

Created:

- `scripts/news-quality/documents.ts`
- `scripts/news-quality/diagnostics.ts`
- `scripts/news-quality/feeds.ts`
- This report.

No workflow, article, image, SEO, IndexNow, deployment, dependency or local Git identity changes. No Deploy Hook was added.

## 9. Regression tests added

17 scenarios cover: second-hop primary links; undated canonical discovery; RSS hints despite inaccessible pages; actual official feed URLs without treating summaries as evidence; prioritization over navigation; 404/count/redacted logs; exact-host protection; structured citations/quoted attributes; itemprop/typed JSON-LD dates; missing/impossible/conflicting dates; distinct event-date failure branches; identified HTTP/XML/empty-feed outcomes; unchanged budgets and thresholds; Reuters mentions versus independence; transitive wire/ownership grouping; navigation/admin exclusion; and body-only organization discovery. One earlier logging assertion now accounts for the new candidate-start message.

## 10. Full validation results

- `npm run typecheck`: passed.
- `npm run lint`: passed; the existing `components/ui/ToolLogo.tsx` native-img warning remains.
- `npm test`: **245 passed, zero failures** (17 additional regression scenarios).
- `npm run build`: passed, **366 static pages**, including your latest duplicate-article deletion. The isolated Windows dependency junction produced nonfatal webpack cache snapshot warnings.
- All **10 workflow YAML files** parsed successfully; workflow bytes are unchanged.
- The original collector was reproduced read-only on all six headlines, and current feeds/official endpoints were checked without model calls or publication.
- Historical article/image and workflow bytes are compared before applying the patch; source/destination hashes are verified during application.

## 11. Example improved diagnostic log

Representative rejection assembled from the observed Microsoft retrieval results and unchanged minimum-evidence rule (the live probe itself did not execute the publication/model pipeline):

```text
[AIBeat Quality Gate] Candidate: Microsoft announces Windows and Surface event for October 7th
[AIBeat Discovery] Retrieved: https://www.theverge.com/news/994714/microsoft-windows-surface-event-october-7-san-francisco | Tier: 2 | Published: 2026-09-15T20:36:59.000Z | WITHIN_48H
[AIBeat Discovery] Official endpoint: https://blogs.windows.com/ | Matching official URLs: 0
[AIBeat Discovery] Official endpoint: https://blogs.microsoft.com/feed/ | Matching official URLs: 0
[AIBeat Discovery] Documents retrieved: 5 | Official-domain candidates: 0 | Primary documents retrieved: 0 | Tier 2 documents: 3 | Tier 2 groups before semantic review: 1 | Attempts: 5/6
[AIBeat Quality Gate] SKIPPED: Microsoft announces Windows and Surface event for October 7th | Stage: minimum_evidence | Reason: INSUFFICIENT_EVIDENCE | Sources checked: 3 | Primary: 0
```

Future date failures identify details such as `EVENT_DATE_IN_FUTURE`, `EVENT_DATE_EVIDENCE_NOT_FOUND`, `PUBLICATION_DATE_MISSING` or `REVIEW_EVENT_DATE_NOT_VERIFIED`. Feed failures identify their endpoint and codes such as `HTTP_403`, `TIMEOUT`, `BODY_TOO_LARGE` or `FEED_PARSE_ERROR`. No source text or model output is dumped.

## 12. Another production test?

Yes: after you review, commit and push, run the existing daily workflow once and retain its run URL/logs. Check feed-specific diagnostics and primary discovery before interpreting publication count. Publishing zero remains valid when fresh authoritative evidence is unavailable. Do not relax the thresholds to force a publication. This review does not commit, push or dispatch a workflow.
