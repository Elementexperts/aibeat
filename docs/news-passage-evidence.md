# Passage-based news evidence

## Changes

1. Retrieved source text is split deterministically into exact contiguous passages, normally at most 600 characters (a short final tail may be merged). The pieces reconstruct the retrieved text without loss or duplication. Each ID is scoped to its source, such as s1:p1.
2. Facts requests send these passages instead of another copy of the source text. The provider cites sourceId + passageId. The model adapter resolves each reference into an original excerpt before the existing local fact schema and factual gates run. Unknown, missing and cross-source passage references fail schema validation; any provider-written excerpt is ignored. The existing one-repair limit remains.
3. Event-date evidence uses eventDatePassageId from eventSourceId, or publication_timestamp for an actual announcement date. Code supplies the source timestamp; freshness and final date review still apply.
4. Entities and product names are checked against complete retrieved text from sources actually cited by retained facts. Names appearing only in uncited documents do not qualify. Matching uses normalized text with letter/number boundaries; it does not infer aliases or roles. Final review still verifies the factual relationship.
5. Draft diagnostics identify title, deck, heading, paragraph or fact-reference index and a fixed reason. Removed numeric paragraphs report DROP. Missing core coverage is explicit. Entity diagnostics identify the event field/index. No rejected names, model text, prompts, API keys or source documents are printed by these new diagnostics.
6. The writer receives verified claim text, fact IDs and core flags, without repeated excerpts. Final review retains retrieved sources and code-resolved fact evidence.

## Preserved

Provider/model, 3,000 output-token ceiling, 30-request model budget, retry and repair limits, source request/text budgets, source trust, sensitive-risk handling, confidence, freshness, numeric validation, duplicate checks and publication scoring are unchanged. Exact excerpt provenance still runs after reference resolution. Passage IDs add modest prompt metadata; no requests or model stages are added. All model generation remains evidence-bound and may still abstain.

## Examples of safe diagnostics

```
[AIBeat Entity Validation] Field: event.entities[1] | Problem: NAME_NOT_IN_CITED_SOURCE | Cited sources: 1
[AIBeat Draft Validation] Result: FAIL | Field: deck | Problem: NUMBER_NOT_IN_CONFIRMED_FACTS
[AIBeat Draft Validation] Result: FAIL | Field: sections[0].paragraphs[0].factIds[0] | Problem: UNKNOWN_FACT_REFERENCE
```

## Regression coverage

Exact passage reconstruction; stable IDs; invented/missing/cross-source reference rejection; code-owned excerpts and date evidence; safe repair diagnostics; three-request end-to-end adapter/pipeline success; names elsewhere in a cited source; uncited names and partial matches rejected; final semantic review rejection; safe draft-field diagnostics and paragraph removal.

No historical article content was rewritten, and no production Groq call, commit, push or deployment was performed. The supplied production log cannot reveal which exact entity string or Enveda draft field failed; these changes address the observed failure mechanisms and make the next failure identifiable.
