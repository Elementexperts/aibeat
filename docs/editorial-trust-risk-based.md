# Risk-based trusted-source publishing

This policy supersedes the universal multi-source requirement for ordinary technology news described in the earlier Editorial Trust v1 documents. The publication gate remains mandatory.

## Registry and document classification

`scripts/news-quality/config.ts` owns exact-host publisher rules and ownership groups. The trusted editorial registry derives from the existing Tier 2 registry, with Forbes added only for dated `/sites/<author>/<year>/<month>/<day>/` article paths. Normalizing `www.` does not authorize arbitrary subdomains. Primary-source and official-discovery host rules are unchanged.

Registered publishers include Reuters, AP, Bloomberg, Financial Times, WSJ, Barron's, BBC, The Guardian, NYT, Washington Post, TechCrunch, The Verge, VentureBeat, Wired, Ars Technica, MIT Technology Review, CNBC, ZDNET, and Forbes. Registration is eligibility for document review, not blanket trust of host content.

`trust.ts` inspects article metadata, structured authors, byline/category labels, article-opening text and paths. Contributor, opinion, sponsored, press-release syndication, aggregation and community indicators override staff markers. Ordinary outlets require article and author metadata with no exclusion indicators. Forbes additionally requires an explicit Forbes Staff marker in author metadata or an identified byline; a staff mention in ordinary body text is insufficient. Forbes PR and council content are excluded even if staff-labelled. Ambiguous documents are downgraded to Tier 3 for evidence policy. The final semantic reviewer must affirm original editorial reporting and may never promote an untrusted document.

## Evidence decision tree

1. Retrieve the candidate's original article and classify publisher, document and story risk.
2. A qualifying original editorial article about an ordinary launch, release, update, feature or technology announcement may enter `TRUSTED_SINGLE_SOURCE`. Its publication date must pass the existing 48-hour rule; a refreshed RSS timestamp cannot rescue it.
3. Every factual claim needs a directly matching retrieved passage and the existing confidence, number, entity, date and semantic checks. Known material contradictions reject publication.
4. Unknown, weak, ambiguous or non-editorial originals enter `ENHANCED_VERIFICATION`: authoritative primary evidence OR two independent reputable reporting sources, per fact. Discovering just one trusted secondary does not promote an unknown original.
5. High-risk reporting always requires authoritative primary evidence AND independent reputable reporting, per fact. Existing risk terms remain intact; explicit safety/data-leak terms supplement them. Original article text/headline, extracted facts and final review can escalate risk.
6. A late model risk escalation permits one enhanced-discovery retry. The original retrieval is cached, risk is locked high, and the full fact/draft/review checks run again. Contradictions, unsupported claims and malformed output do not trigger this retry. Failure or budget exhaustion skips publication.
7. Availability verification still precedes the only image/MDX publication boundary.

## Attribution and score

Single-source output starts with an escaped, linked `Based on reporting by <Publisher>` attribution. The Sources list remains, with retrieved article title where available. Analysis retains its explicit AIBeat analysis heading. Paraphrase-only, copied-span, quotation, unsupported-number and MDX-escaping protections remain.

The existing score threshold remains 75 and fact/story confidence minimums remain 85. A fully passing trusted single-source ordinary story scores 87: source quality 22 + supported facts 25 + single-source independence component 5 + original value 15 + entity/date checks 10 + writing 10. Independence adds value but does not veto this narrowly eligible mode. Primary and two-source scoring is unchanged. Score remains internal frontmatter/logging metadata; no public score UI or schema field is added.

## Budgets and retrieval

An eligible ordinary story stops collection after its original article: typically one GET and one pre-publication HEAD, excluding redirects and shared feed discovery. It does not automatically retrieve four documents or official newsrooms. Compared with four successful document GETs, this saves three article retrievals (75%); actual savings depend on the prior candidate's discovery path. A no-redirect single-source publication uses two evidence requests versus potentially eight for four used sources plus their HEAD checks.

No caps increased: 32 network requests per run, six source attempts per candidate, four retained sources, nine model calls per run, three normal model stages, 3,000 output tokens per call, six candidates, and 48-hour freshness. Late risk escalation may use four to six model calls for that candidate, still inside the shared nine-call cap. Retrying discovery reuses the cached original and counts it within the six-attempt pass, so it does not allocate a new unrestricted request budget. There is no new classification API call and no unrestricted search/scraping. Feed discovery and enhanced official-link discovery remain bounded.

## Regression coverage

Added 27 mocked cases (70 quality tests total): TechCrunch/Reuters/Forbes staff single-source acceptance, score and attribution; Forbes contributor/opinion/sponsored/ambiguous/press-release rejection; structured staff and contradictory contributor labels; body-only staff mentions; unknown/spoofed/subdomain/community/aggregated/syndicated/missing-author documents; acquisition/security/safety strictness; risk hidden in source body/headline; model/reviewer escalation; semantic rejection and derivative evidence; unsupported numerical facts and paragraph removal; stale originals; event duplicates; one-GET collection plus HEAD; bounded enhanced discovery; sticky-risk retry success/failure; no retry for unsupported claims; source disappearance; mandatory review schema; escaped attribution.

Existing tests continue covering malformed output, quote/copy guards, exact primary hosts, independence/ownership, request/model budgets, date parsing, historical compatibility, rejected-candidate side effects, and image/commit/IndexNow workflow guards.

## Example diagnostic output

Illustrative passing mocked launch:

```text
[AIBeat Quality Gate] Candidate: Acme launches Atlas editor
[AIBeat Discovery] Documents retrieved: 1 | Official-domain candidates: 1 | Primary documents retrieved: 0 | Tier 2 documents: 1 | Tier 2 groups before semantic review: 1 | Attempts: 1/6
[AIBeat Quality Gate] Publisher: TechCrunch | Publisher trust: TRUSTED_EDITORIAL | Content type: STAFF_REPORTING | Risk: LOW/MEDIUM_PENDING_REVIEW | Evidence mode: TRUSTED_SINGLE_SOURCE
[AIBeat Quality Gate] PUBLISH | Evidence mode: TRUSTED_SINGLE_SOURCE | Sources: 1 | Primary: 0 | Risk: low | Facts: 1 | Uncertain claims omitted: 0 | Paragraphs removed: 0 | Score: 87
```

An acquisition from the same publisher follows `ENHANCED_VERIFICATION` and fails with `NO_PRIMARY_SOURCE` if no authoritative primary evidence is retrieved. Forbes contributor and unknown-blog originals without corroboration fail `INSUFFICIENT_EVIDENCE`. A stale original fails `STALE_STORY`; contradictory reporting fails `CONFLICTING_SOURCES`.

## Remaining limitations

Classification is conservative and metadata-dependent, not proof of staff employment. Publisher markup changes, absent author metadata, paywalls and bot blocking can cause rejection. Forbes staff markup outside identified bylines may remain ambiguous. The semantic reviewer must catch unlabelled aggregation or sponsored content. Broad risk terms can send otherwise ordinary articles to enhanced verification; they were not weakened. A single source can itself be wrong. Skipping optional corroboration saves requests but cannot discover contradictions on documents that were never retrieved. No live paid generation or production publication was performed during validation.

Keep reviewing production decisions and publisher-specific fixtures before expanding registry rules. Do not guess official article paths or disable safeguards to increase publication volume.

## Validation (2026-09-16)

- `npm run typecheck`: passed.
- `npm run lint`: passed with the existing `components/ui/ToolLogo.tsx:29` Next.js `<img>` warning.
- `npm test`: 272 passed, zero failed (including 70 quality-gate tests).
- `npm run build`: passed, 370 pages generated. The isolated validation copy reported nonfatal webpack cache snapshot warnings and the same existing image lint warning.
- All 10 workflow YAML documents parsed with duplicate-key detection and required `on`/`jobs` checks.
- Hash comparison confirmed all 207 article-directory files, 37 news-image files, and 10 workflow files unchanged.
- No commit, push, live generation, email sending, deployment or IndexNow request was performed.

Changed files: `scripts/fetch-and-post.ts`; `scripts/news-quality/{config,gate,model,pipeline,sources,trust,types}.ts`; `tests/news-quality.test.ts`; this document. No workflow, frontend, database, payment, dependency or historical article changes.
