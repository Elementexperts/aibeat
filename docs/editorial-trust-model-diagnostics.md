# Groq model-output diagnostics

## Scope

Diagnostic-only changes. Provider remains Groq and the configured model still comes from `GROQ_MODEL`, defaulting to `openai/gpt-oss-120b`. API endpoint, all prompts, `json_object` response format, temperature, 3,000 output-token allowance, 12-second timeout and nine-call run budget are unchanged. No normalization, retry/repair mechanism, provider migration or schema-constrained generation was introduced.

## Categories

| Category | Meaning |
| --- | --- |
| MODEL_HTTP_ERROR | Non-success HTTP response other than 429 or 5xx |
| MODEL_RATE_LIMITED | HTTP 429 |
| MODEL_SERVER_ERROR | HTTP 500–599 |
| MODEL_TRUNCATED | `finish_reason: length` |
| MODEL_EMPTY_CONTENT | Missing, non-string or whitespace-only content |
| MODEL_INVALID_JSON | Assistant content cannot be parsed as JSON |
| MODEL_SCHEMA_INVALID | Existing local facts/draft/review parser rejects the parsed value |
| MODEL_INVALID_FINISH_REASON | Finish reason other than stop/length, including missing or unknown |
| MODEL_TIMEOUT | AbortError or TimeoutError during fetch/body reading |
| MODEL_UNEXPECTED_ERROR | Other exceptions, including malformed API response envelopes |

`ModelFailure` carries a typed category. It retains the existing `MALFORMED_MODEL_OUTPUT` rejection family for compatibility, with the precise category in its detail. Workflow output includes the category explicitly rather than only the umbrella reason. Budget exhaustion remains `BUDGET_EXHAUSTED`.

## Logging and safety

Every executed model call reports provider, stage, sanitized configured model identifier, HTTP status, allowlisted finish reason, content character count, JSON parsing result, local schema result, attempt `1/1`, prompt/completion/total token usage when supplied, and the unchanged output limit.

For example, a mocked truncation produces:

```text
[AIBeat Model] Provider: Groq | Stage: facts | Model: openai/gpt-oss-120b | HTTP status: 200 | Finish reason: length | Content chars: 1 | JSON parse: NOT_RUN | Schema validation: NOT_RUN | Attempt: 1/1 | Prompt tokens: 1000 | Completion tokens: 3000 | Total tokens: 4000 | Max output tokens: 3000 | Failure: MODEL_TRUNCATED
```

A schema rejection can end with:

```text
JSON parse: PASS | Schema validation: FAIL | ... | Failure: MODEL_SCHEMA_INVALID | Field: confirmedFacts | Problem: missing_required_field
```

Only one schema issue is reported. Field paths and problem labels come from code, never model-provided keys or values. Generic constraint failures receive a fixed fallback label. Invalid JSON reports `json_syntax_error` and character count, not the native parser message, because parser messages can contain source snippets. HTTP error bodies are not parsed or printed. Prompts, evidence, raw completions, credentials and exception messages are never logged. Usage values must be nonnegative safe integers. Unknown finish values and invalid model identifiers are redacted; model identifiers containing the credential are also redacted.

## Validation behavior

The model adapter invokes the exact existing facts/draft/review parsers to associate shape-validation results with API metadata. Existing pipeline validation is retained. This repeats pure shape checks; it neither changes acceptance rules nor replaces evidence validation. Model schema failures are now logged at their API call, before the existing pipeline parser would have rejected the same value.

Risk, confidence, evidence/source policy, unsupported facts/numbers/quotes, freshness, deduplication and publication guards remain unchanged. Unknown additional properties retain their previous acceptance behavior. Fenced JSON remains rejected. No malformed or editorially rejected response is retried. The existing separate risk-escalation discovery path is unchanged.

## Tests

Added 17 mocked cases covering all ten categories, empty content, malformed response envelopes, success for all three stages, unchanged request parameters, capped missing-field diagnostics, extra-property compatibility, unchanged fenced-JSON rejection, credential/log-injection redaction, and no retries/publication on malformed, unsupported or low-confidence output. Existing editorial tests remain active.

## Validation results

- `npm run typecheck`: passed.
- `npm run lint`: passed with the existing `components/ui/ToolLogo.tsx:29` image warning.
- `npm test`: 315 passed, zero failed, including 113 quality-gate tests.
- `npm run build`: passed; 370 pages generated. The isolated validation copy emitted nonfatal webpack cache snapshot warnings and the same existing image warning.
- All 10 workflow YAML files parsed with duplicate-key and required workflow-structure checks.
- Hash checks confirmed all 207 article-directory files, 37 news-image files and 10 workflows unchanged. The reviewed diff contains only the four files below; gate, risk, trust, configuration, prompts and pipeline files retain their original behavior.
- Validation ran in an isolated local copy before applying the four hash-verified files to the original repository. No temporary helpers, logs or build artifacts are included.

## Next production run

The earlier run's generic logs cannot establish its exact historical cause. GitHub connector access to run `35117376318` returned 404, and no local Groq credential was available for a live reproduction. Mocked responses verify diagnostic classification, not the historical production cause.

After reviewing and deploying this diagnostic-only change, run the existing daily-news workflow once and inspect `[AIBeat Model]` lines. Use HTTP status, finish reason, token usage, JSON result and schema issue to decide whether any structured-output/repair change is warranted. No production execution, commit or push was performed here.

Recommended commit: `fix(news): add safe Groq model-output diagnostics`

Files: `scripts/news-quality/model.ts`, new `scripts/news-quality/model-diagnostics.ts`, `tests/news-quality.test.ts`, and this report.
