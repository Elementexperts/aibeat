# Risk classification audit and fix

This report supersedes the broad risk-keyword/body-scan behavior in the earlier risk-based publishing report. Scope is risk classification, related routing, diagnostics, model schema/prompts and tests. Publisher/document trust, evidence requirements, scoring, freshness and publication guards are unchanged.

## 1. Root cause

The pre-model classifier applied the old `HIGH_RISK` regex to the candidate title plus the retrieved article's entire extracted text. The collector used the same whole-body predicate to decide whether single-source processing was available. `evaluateCandidate` then enforced high-risk source policy before calling the model; a match could reject the candidate without any semantic risk assessment.

Replaying saved original HTML from the earlier discovery investigation reproduces the problem. Both the Boox and Canon originals match **Policy**, inside a reCAPTCHA privacy notice retained in extracted article text. Microsoft matches **CEO** and **Policy**. The other snapshots match broad topic/business vocabulary. This is a deterministic false-positive bug, not a HIGH default for malformed model output.

These are saved-document reproductions, not claimed copies of the latest Actions runner's exact document bytes. The old production logs did not preserve matched terms. Nevertheless the same candidate HTML and classifier reproduce the reported behavior for all six, with a specific non-news trigger for the hardware articles.

| Saved original | Old matching terms | Revised initial risk |
| --- | --- | --- |
| Boox Palma 3 stylus/redesign | Policy | LOW |
| Canon EOS R8 Mark II | Policy | LOW |
| Nvidia/Jensen Huang on AI regulation and safety | regulation, CEO, regulations, billion, lawsuit, hacking, breach, government, valuation, million | MEDIUM |
| AI/data-center polling | Policy, policy, ban, regulation | MEDIUM |
| Data-center boom and industrial cities | profit, million, government, executive | MEDIUM |
| Microsoft Windows/Surface event | CEO, Policy | LOW |

The three MEDIUM classifications describe the headline-level topic, not advance approval of every body claim. Any actual enforcement, breach, misconduct, serious safety or similar consequential claim still gets stronger verification. Original editorial classification and ordinary fact/citation review remain mandatory. The Microsoft announcement date still needs the unchanged freshness/event-date validation.

## 2. Broad patterns audited

Removed standalone role/topic matches: `government`, `contract`, `policy`, `ceo`, `cfo`, `executive`, `appointed`, `headcount`, `valuation`, `earnings`, `revenue`, `profit`, money symbols, `million`, `billion`, `raised?`, `depart*`, `resign*`, `fired`. These are not independently consequential claims. `depart*` could even match department. Whole-page privacy notices made `policy` especially harmful.

Narrowed court/regulatory, criminal/allegation, security/vulnerability, acquisition, funding, employment, safety, and ban/sanction matching. Routine words such as launch, company, data, camera, support and product names were not standalone old regex triggers; the body scan could encounter a different broad word later in the document. The previous model prompts also encouraged HIGH for entire legal/government/security/financial/employment/policy topic areas and generic claims about individuals.

## 3. Replacement rules

`HIGH_RISK_RULES` defines named contextual categories: LAWSUIT, COURT_DECISION, REGULATORY_ENFORCEMENT, SECURITY_BREACH, ACQUISITION, FUNDING, EMPLOYMENT_REDUCTION, SERIOUS_ALLEGATION, SERIOUS_SAFETY_INCIDENT, BAN_OR_SANCTIONS.

Examples: regulator + enforcement/investigation/fine; court + ruling/order; security/data breach; acquisition/merger or acquiring a company; funding round or raising an amount/capital; cutting jobs/workforce; accusation + serious misconduct; serious injury/fatal incident. Ordinary retail-price increases do not match raising investment funds. The legacy read-only historical audit shares this contextual vocabulary.

Initial routing examines candidate and source headlines, not full article bodies. Subsequent checks classify each extracted factual claim. Core consequential claims escalate the story; non-core consequential claims retain strict primary-plus-independent evidence requirements individually. Uncertain claims excluded from publication do not escalate unrelated confirmed launch facts. No source extraction, trust classifier, score formula or numeric validation has been relaxed.

If a non-core consequential claim lacks evidence, publication fails with a `CLAIM_ONLY:<category>` diagnostic. It does not trigger a retry that incorrectly locks every unrelated claim HIGH. The existing bounded, sticky-HIGH retry remains for central-story escalation. A mixed article whose consequential claim has adequate evidence records enhanced verification while retaining its non-HIGH overall story label.

## 4. Taxonomy

- LOW: ordinary product/hardware/software/model/API launches, features, retail price and availability.
- MEDIUM: competitive/benchmark claims, strategy, partnerships, controversial product behavior; also genuine classification uncertainty. Qualifying trusted staff reporting remains eligible for single-source review.
- HIGH: central consequential claims in the named categories above. Primary evidence plus independent reputable reporting remains required. Every individually consequential claim receives that same strict evidence requirement even when non-core.

Missing, invalid or contradictory model schema is rejected as malformed; it is never silently converted to MEDIUM or HIGH.

## 5. Model and diagnostic changes

Facts and review prompts now share the explicit taxonomy and requested Canon/Boox/OpenAI/Microsoft-style distinctions, a competitive-benchmark MEDIUM example, and lawsuit/enforcement/breach/acquisition/job-cut HIGH examples. They explicitly distinguish incidental mentions and ordinary prices from consequential claims.

Both responses require internal `riskAssessments: [{factId, category}]`, empty when none. This identifies the precise consequential fact rather than collecting or publishing free-form reasoning. Category and fact references are validated. A model HIGH story must reference at least one core fact; deterministic core-claim detection may escalate an incorrectly LOW/MEDIUM label. Review can also add consequential claim assessments. Nothing is added to public article metadata or UI.

Diagnostics use controlled category labels, without full documents, claim text, model reasoning or secrets:

```text
Risk: LOW | Risk trigger: ROUTINE_PRODUCT_ANNOUNCEMENT
Risk: MEDIUM | Risk trigger: BUSINESS_CLAIM_SCRUTINY
Risk escalated: LOW → HIGH | Trigger: SECURITY_BREACH
Claim risk: HIGH | Trigger: SECURITY_BREACH | Scope: NON_CORE_CLAIM
```

## 6. Regression coverage

Added 26 cases beyond the existing 70 quality tests, plus adjusted the previous whole-body-escalation test to the new requested semantics. Cases cover Boox/Canon routing and full mocked publication, retail price correctness, API/model releases, Microsoft, security features, government customers, generic words, uncertainty, MEDIUM acceptance, acquisition, breach, lawsuit, enforcement, job cuts, serious individual allegations, funding, court decisions, safety, bans, incidental uncertain claims, per-claim evidence, deterministic escalation diagnostics and malformed risk classifications.

Existing high-risk retry tests now provide the required concrete risk annotations. All other existing quality, trust, source independence, quote/copy, number, freshness, availability, deduplication and side-effect tests remain active.

## 7. Validation

- `npm run typecheck`: passed. An initial error was limited to the temporary replay helper; that investigation-only file was moved outside the validation project and the check rerun successfully.
- `npm run lint`: passed, with the existing `components/ui/ToolLogo.tsx:29` Next.js image warning.
- `npm test`: 298 passed, zero failed, including 96 quality-gate tests.
- `npm run build`: passed, 370 pages generated. The isolated validation copy emitted nonfatal webpack cache snapshot warnings and the same existing image warning.
- All 10 workflow YAML files parsed successfully with duplicate-key and required workflow-structure checks.
- Hash comparison: all 207 article-directory files, 37 news-image files and 10 workflow files unchanged.
- Tested in the isolated local validation copy; only the nine reviewed source/test/report files were applied to the original repository using hash guards. No replay helpers, logs, build artifacts or credentials were copied.

## 8–9. Expected production routing and reachability

The six saved-document outcomes are listed above. Boox, Canon and Microsoft are initially LOW; Nvidia commentary, polling and industrial-city reporting are initially MEDIUM. Final classification depends on extracted core claims and semantic review. No candidate receives guaranteed publication.

The trusted-single-source path is demonstrably reachable: the Boox and Canon regression cases pass through fact checking, review, availability verification and the mocked publication boundary with privacy boilerplate present. They still fail if evidence, dates, unsupported numbers or other existing gates fail.

## 10. Limitations and scope

Contextual patterns are conservative heuristics, not a complete language understanding system. Semantic extraction/review remains responsible for paraphrased consequential claims, centrality and ambiguous context. Publishers may still be inaccessible or fail document trust. An ambiguous valid classification is MEDIUM, but genuinely malformed model output is rejected. No live paid model generation or production publishing was performed.

No budget increase: the same 32-request, nine-model-call and per-candidate discovery caps apply. No workflow, schedule, bot identity, Vercel, IndexNow, publisher registry entries, score/confidence thresholds, article content, images, database, payments, dependency or frontend changes. No commit or push.

Changed files: `scripts/news-quality/config.ts`, `gate.ts`, `model.ts`, `pipeline.ts`, `risk.ts` (new), `trust.ts`, `types.ts`; `tests/news-quality.test.ts`; this report.
