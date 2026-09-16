# AIBeat Editorial Trust & News Quality v1

Implementation and validation report — September 16, 2026.

## 1. Existing architecture

Four RSS feeds supplied recent candidates. The generator deduplicated slugs, sent a short RSS summary to Groq, prepared an OG or generated image, and wrote MDX. Actions prepared recent images, committed as github-actions[bot], pushed main, and notified IndexNow after production content became available. Vercel's Git integration supplies the deployment. See `editorial-trust-audit.md` for the audit completed before implementation.

## 2. Problems discovered

The previous pipeline lacked retrieved-document evidence, source independence checks, cited facts, semantic claim review, risk rules, event deduplication and event freshness checks. Prompt instructions alone guarded facts. Rejected candidates consumed the publication limit. Image backfill could produce changes even without a new article.

## 3. Files changed

- `scripts/fetch-and-post.ts`: evidence-first orchestration, accepted-article counter, neutral fallback image prompt, structured metadata and relevant internal references. Existing category classification and optional LinkedIn behavior retained.
- `.github/workflows/daily-news.yml`: identify the generation step as `news`; condition image backfill, commit/push and IndexNow on a nonempty, nonzero `published_count` output.
- `lib/articles.ts`: optional quality, event and related-article fields.
- `app/news/[slug]/page.tsx`: prefer explicitly related articles, retaining the existing category fallback.
- `package.json`: include quality tests and the optional `audit:news` command.
- `.gitignore`: exclude private historical audit outputs.

## 4. Files created

- `scripts/news-quality/config.ts`: editorial source registry, risk patterns, thresholds and budgets.
- `scripts/news-quality/types.ts`: facts, citations, review and rejection contracts.
- `scripts/news-quality/sources.ts`: bounded, cached retrieval and source extraction.
- `scripts/news-quality/model.ts`: extraction, writing and review prompts with bounded Groq calls.
- `scripts/news-quality/gate.ts`: schema checks and deterministic publication rules.
- `scripts/news-quality/pipeline.ts`: candidate evaluation and publication boundary.
- `scripts/news-quality/audit.ts`: historical triage rules.
- `scripts/audit-news.ts`: private report command.
- `tests/news-quality.test.ts`: mocked regression scenarios.
- `docs/editorial-trust-audit.md` and this report.

## 5. New architecture

Discover recent candidates → retrieve source documents → check minimum evidence → extract cited facts → validate facts, dates and duplicate events → write structured prose from confirmed facts → remove unsupported numerical paragraphs → review all prose against evidence → enforce authority, independence and quality gates → recheck source availability → prepare image → write new MDX exclusively → commit/push → existing Vercel Git deployment → existing live-content-verified IndexNow.

Uncertain claims are omitted. Important conflicts reject the story. A rejected candidate continues to the next candidate within the run budget. Missing configuration remains a fatal error; normal editorial rejection does not fail the scheduled run. No accepted story means no image backfill, commit or IndexNow. There is no Deploy Hook invocation or new deployment mechanism.

## 6. Source ranking

A maintainable registry covers official company, research, regulator and government hosts plus established newsrooms. Matching uses exact hosts and selected paths; arbitrary subdomains, repositories and community pages do not inherit authority. Unknown sources default to discovery-only Tier 3. The existing four feeds remain the discovery entry points; related feed stories and outbound source links supply corroboration.

Tier 1 is potentially authoritative primary evidence; Tier 2 is reputable reporting. Each fact needs primary evidence or two independent Tier 2 reports. The semantic reviewer can reject claim-specific primary authority, but cannot promote a source's configured tier. Editorial independence groups, explicit wire attribution, identical documents and reviewer-identified derivative reports prevent simple source-count inflation. These are conservative editorial rules requiring maintenance, not a definitive ownership database.

## 7. High-risk rules

Legal, government, security, financial, employment, major policy and individual-related claims require authoritative primary evidence plus reputable independent reporting for every retained fact. Code patterns, extracted risk and final reviewer risk can escalate scrutiny. A high score cannot waive this requirement. Broad matching deliberately favors skipping questionable cases.

## 8. Publication threshold

Central constants require a score of at least 75 and fact/story model confidence of at least 85, alongside all hard evidence gates. Dimensions: source quality 25, verification 25, independence 15, original value 15, entity/date checks 10 and writing 10. A sole authoritative primary source receives fewer independence points; secondary-only evidence receives fewer source points. Eligible cases generally score 90–100 because the hard requirements are strict. This is an eligibility heuristic, not a calibrated accuracy probability. There is no 60–74 exception; concise briefs must pass the same safeguards.

## 9. Duplicate detection

Exact canonical source URLs and existing slugs are checked. Event metadata compares entity, normalized action, exact product/version and a 14-day window. Legacy stories use title/deck overlap with entity/product checks. Launch/unveil/release wording is normalized. Different product versions remain distinct. Historical articles are never overwritten automatically.

## 10. Freshness

Candidates and extracted events must be within 48 hours, with valid, nonfuture dates. Retrieved pages must provide a publication date; feed timestamps cannot substitute. Every core fact needs recent supporting evidence. Event-date evidence must match a retrieved passage or publication timestamp, and the reviewer must verify the actual new development. Older supporting context is allowed; refreshed coverage of an old event is rejected.

## 11. Quote protection

The v1 writer uses paraphrases only and rejects direct quotation marks, including reconstructed quotes. This is stricter than permitting verified quotations and avoids an attribution/quotation repair path. Citation excerpts stay internal. A deterministic check rejects copied runs of 14 words in body paragraphs; semantic review additionally checks derivative writing. Generated prose is escaped for HTML and MDX expressions.

## 12. Source transparency

Only fact-cited documents become article sources, with useful publisher names and primary/reporting labels. The existing Sources section renders them. Optional frontmatter adds qualityScore, sourceCount, primarySourceCount, newsEvent and relatedArticles; existing articles need none of these. Prompts, evidence excerpts and review reasoning are not rendered publicly. Internal links use matching confirmed entities/products and existing content, capped at three tool and three article references. Existing directory/category navigation remains available.

## 13. Historical audit

Run `npm run audit:news` locally. It creates ignored `reports/news-quality-audit.json` and `.md` files, flagging missing sources/dates, numerical claims, high-risk wording, weak attribution and possible duplicates. It does not contact models, rewrite or delete articles, publish reports, or upload Actions artifacts. Flags are triage suggestions, not findings of falsehood. Validation audited 206 historical MDX files without modifying them.

## 14. API and cost impact

An eligible candidate normally uses three Groq calls (facts, prose, review), compared with one old prose call; evidence-rich prompts also increase input tokens. Early evidence rejection uses no model call. Limits per run: six evaluated candidates, four documents per candidate, six retrieval attempts per candidate, 32 evidence network requests including feeds/redirects/availability checks, nine model calls, 3,000 output tokens per call, twelve facts and at most three accepted articles. The workflow retains ARTICLE_LIMIT=1. Source documents are cached and capped at 1 MB downloaded / 6,500 extracted characters. Requests have 12-second timeouts. Model calls have no retry loop.

Image requests retain the separate existing image pipeline limits and only occur after acceptance; they are not part of the 32 evidence-request budget. No new paid provider is introduced. Actual cost depends on the configured Groq model and token usage; the caps bound requests rather than guaranteeing a currency amount. Groq JSON mode is combined with local schema validation: [API reference](https://console.groq.com/docs/api-reference), [structured outputs](https://console.groq.com/docs/structured-outputs).

## 15. Tests added

26 mocked tests cover primary-source briefs, independent reporting, weak sources, high-risk rejection and acceptance, reviewer escalation, conflicts, fabricated quotes, unsupported numbers/citations, copying, low confidence, MDX escaping, duplicate events and distinct versions, stale/invalid dates, malformed models, unavailable sources, zero rejected side effects, single accepted publication, authority/independence downgrades, exact-host classification, bounded cached retrieval, source dates, call budgets, legacy MDX, private audit immutability and workflow publication conditions.

## 16. Validation results

- `npm run typecheck`: passed.
- `npm run lint`: passed; existing ToolLogo.tsx native-img warning remains.
- `npm test`: 228 passed, zero failures; no live model calls.
- `npm run build`: passed, 366 static pages. The isolated Windows dependency junction emitted nonfatal webpack cache snapshot warnings.
- All 10 workflow YAML files parsed successfully.
- Production HTTP checks: `/feed.xml`, `/sitemap.xml`, `/news-sitemap.xml` returned 200 and valid XML; 50 RSS items, 332 sitemap URLs and seven news-sitemap URLs at validation time. Canonical hosts remained www.aibeat.dev.
- A historical article returned 200 with NewsArticle, canonical metadata and Sources intact.
- Historical content and news-image bytes are checked against the source repository before applying the patch.

## 17. Environment variables

No new secrets or environment variables are required. Existing GROQ_API_KEY, optional GROQ_MODEL, ARTICLE_LIMIT, IndexNow and optional LinkedIn settings are retained. The existing FAIL_ON_NEWS_ERROR=false workflow setting remains for compatibility; candidate failures now always skip, while fatal configuration/infrastructure failures fail the process. Thresholds and budgets live in `scripts/news-quality/config.ts`. No VERCEL_DEPLOY_HOOK variable is consumed by the pipeline.

## 18. Manual steps

Review and commit/push these implementation files. The next scheduled run uses the gate; a manual daily workflow run can be used after pushing. A zero-publication run is expected when evidence is insufficient. Review concise rejection logs and maintain source rules as publishers change. The historical audit is optional and local-only. No Vercel configuration, integration, protection or local Git identity change is needed. This implementation does not itself push a commit or trigger a production run.

## 19. Example PASS

Fictional test fixture: Acme's official, recent announcement confirms the Atlas editor launch. Exact retrieved evidence supports the entity, product and event date. A short original brief reports the launch and labels a modest developer implication as analysis. No invented price, benchmark or quote is added. Review confirms authority and support; the candidate passes before image creation.

## 20. Example FAIL

A small blog claims Acme acquired another company for $47.8 million, with no authoritative primary document and independent reputable corroboration. The story is high risk and fails the evidence gate regardless of model confidence. No final image, MDX, article commit, deployment or IndexNow notification is produced for it.

## 21. Remaining limitations

This system cannot guarantee factual accuracy. Extraction and review use separate calls to the same configured model, so correlated errors remain possible. Exact citations/numbers do not prove semantic truth. Written-out numbers, nuanced attribution and arbitrary individual names depend partly on model review. Source authority and independence need editorial maintenance. Deduplication is heuristic and can miss or overmatch events.

Retrieval supports accessible static HTML with article/main content and a discoverable publication date. Paywalls, JavaScript-only pages, PDFs, missing dates, truncation, unsupported HEAD requests or changed redirects can cause conservative skips. The final HEAD check establishes availability, not unchanged content or truth. Corroboration is limited to related feed entries and source links; no unrestricted search service was added. Source fetching validates public HTTPS destinations, but publisher extraction is intentionally simple and will need adjustments as page structures change.

Strict evidence rules, paraphrases-only output and the copied-span check trade publication volume for caution. Human review remains valuable for consequential stories. Existing image backfill still runs when a new article is accepted; it is skipped on zero-publication runs. Neutral generated fallback images preserve the existing optimized image path; original source imagery remains subject to the existing attribution behavior.
