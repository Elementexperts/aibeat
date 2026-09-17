# UNSUPPORTED_CLAIM inspection and diagnostics

## Production reconstruction limits

Requested run: https://github.com/Elementexperts/aibeat/actions/runs/35221546748/job/105202659869 . The connected GitHub log API returned 404; the web fallback failed to connect and no local gh executable was found. No saved fixtures/logs matching the three titles were found in the searched repository docs/tests/diagnostic logs. Do not substitute current web articles or fresh model output for the original evidence.

Apple Watch Series 12, the AI-agent teammate story, and the Halloween streamers story all reportedly reached facts_validation after HTTP/JSON/schema success. Their extracted fact counts, failing indexes and actual evidence are not present in the supplied excerpt. It cannot establish hallucination versus a representation mismatch for any of the three.

## Exact path and contract

processCandidate wraps the model call and sets stage=facts_validation when facts return. evaluateCandidate invokes parseFacts, then checkFacts. At this stage UNSUPPORTED_CLAIM originates in checkFacts's per-fact/per-citation checks:

1. citation.sourceId must exactly equal a retrieved source.id (case-sensitive). A URL is not an ID; URL normalization is not used for this comparison.
2. normalize(source.text) must contain normalize(citation.excerpt), a contiguous passage. normalize lowercases, applies Unicode NFKC, collapses whitespace and trims. It does not reconcile punctuation, ellipses, omitted words or paraphrased excerpts.
3. Every numeric token in fact.claim must be present in EACH citation.excerpt's token set. Commas and whitespace are removed, but currency, scale and other textual representations can differ. $10 versus 10 dollars is rejected despite numerical equivalence; this is covered by a regression without changing the behavior. Multiple citations cannot distribute support for different numbers under this rule.

All confirmed facts, including non-core facts, and every citation must pass. One failed citation rejects the entire story before draft generation. The claim itself can be paraphrased; it is not searched verbatim in source text. These checks do not prove semantic entailment. Independent final review remains necessary.

parseFacts checks structural shape, nonempty citation arrays, excerpt length >=20, unique fact IDs, required risk fields and score ranges. It cannot verify actual source membership or excerpt provenance. Structurally valid JSON can therefore fail evidence checks. Missing/wrong-type fields normally fail schema validation; a well-formed but nonexistent source ID fails facts validation.

The extraction prompt asks for supported paraphrased facts and verbatim excerpts, consistent with the main contract. It does not specify every numeric-token representation rule or that each citation must contain all claim numbers. That is a contract gap, not proof that these production claims were false positives. No prompt change is included.

Confidence below threshold produces INSUFFICIENT_EVIDENCE, not UNSUPPORTED_CLAIM. Event-date evidence references produce INVALID_DATE; entity/product names must occur in the combined normalized excerpts or produce UNVERIFIED_ENTITY. Source-policy failures retain their own reasons. Extra unknown properties are ignored. Included non-core claims can fail; uncertain claims are excluded from prose. Event metadata has its own checks rather than automatically causing this reason.

## Added diagnostics

Only the previously combined rejection paths are split into safe detail labels: SOURCE_ID_NOT_FOUND, EXCERPT_NOT_IN_SOURCE, CLAIM_NUMBER_NOT_IN_EXCERPT. The parent reason remains UNSUPPORTED_CLAIM. No conditions, thresholds, source policies, prompts or recovery rules change.

Example (one-based indexes):

    [AIBeat Facts Validation] Result: FAIL | Failure: UNSUPPORTED_CLAIM | Facts extracted: 5 | Fact index: 2 | Core: NO | Citation count: 1 | Citation index: 1 | Evidence source matched: YES | Failure detail: EXCERPT_NOT_IN_SOURCE

No claim category is invented; only existing structural data is reported. No claims, source IDs, excerpts, source bodies, credentials or raw model output are logged. Pipeline skip logs include the same fixed detail.

## Nine-call budget

One createModel instance is shared for the run. Every actual HTTP attempt, including 429s and repairs, consumes one of nine calls. A new stage attempt is blocked when calls >=9. A 429 retry requires calls <9 as well as attempts remaining and a non-repair request. A ninth request returning 429 therefore logs Attempt: 1/3 but no retry, then throws MODEL_RATE_LIMITED. A later invocation would throw BUDGET_EXHAUSTED. A regression reproduces this exactly, without changing model.ts.

The supplied excerpt accounts for eight requests: candidate 1=1, candidate 4=3, candidate 5=3, Snap=1. If Snap's 1/3 was a normal original request and the run completed normally, the current code implies Snap was request nine and one earlier request is omitted from the excerpt. Its candidate/stage cannot be established without the complete log. Do not present a guessed assignment to AI safety or Treble as exact accounting.

## Next diagnostic evidence

Run once with the safe diagnostics after review/deployment. Retain the full ordered AIBeat Model lines and candidate boundaries (including any Repair attempt lines) plus AIBeat Facts Validation and skip lines. This establishes exact request accounting and failure categories/indexes. For a substantive false-positive determination, create a small authorized/redacted fixture containing the failed fact and its cited passage/source-ID mapping; do not log whole articles or raw responses. Fix only the demonstrated mismatch, with a regression, in the subsequent production-unblock task. Do not introduce semantic auto-repair.

## Validation

Typecheck passed; lint passed with the existing ToolLogo.tsx image warning; all 332 tests passed; production build passed (370 static pages); all 10 workflow YAML files parsed; git diff --check passed. Six new regressions cover the three categories, normalized paraphrases, equivalent numeric formatting, and a ninth-call 429 without retry. No commit or push.
