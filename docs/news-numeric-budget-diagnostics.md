# Numeric evidence and model-budget diagnostics

## Scope

Diagnostic only: no acceptance-rule, source-trust, quality-threshold, publication-policy, model/provider, retry, repair or call-budget changes. The original quantitiesSupported acceptance predicate remains unchanged. Parsed quantities gain observational fields; diagnostic comparison reasons are checked against acceptance in regressions. No commit or push.

## Apple TV 4K

The supplied log establishes six parsed facts and a core first fact failing numerical support after source provenance matched. The original claim and excerpt are absent. A concrete local reproduction finds that identical claim/excerpt text containing Apple TV 4K is rejected: the numeric parser reads K as the k magnitude, marks it ambiguous without monetary context, and sets its value to INVALID. This proves a parser limitation and is a strong candidate for the production cause, but the failed production pair is needed to confirm it. The bug is intentionally not fixed in this diagnostic patch.

On the same numerical failure path, a bounded JSON diagnostic records one-based fact/citation token indexes, core status, claim text, source ID, excerpt, raw numeric tokens, normalized values, units/currency/scale/percentage/monetary context, the first failed claim token, and why each shown excerpt token does not match. Only the failing citation is logged. Text is capped at 25 words and 200 claim / 240 excerpt characters; tokens at eight per side and 48 characters per displayed numeric value. The first failed claim token is included even if outside that initial window. Counts and clipping flags explicitly disclose omissions. Credential-like strings and URL query/userinfo are redacted; token details are suppressed when redaction changes input so embedded credential digits are not leaked through numeric extraction. Full documents, environment variables, provider bodies and complete model responses are never logged.

## Exact supplied production request ledger

| Global call | Candidate | Stage | Result |
| --- | --- | --- | --- |
| 1 | Base Labs | facts | 200, schema PASS |
| 2 | Base Labs | draft | 200, schema PASS; subsequent LOW_INFORMATION_VALUE |
| 3 | Pinterest | facts | 200, schema PASS |
| 4 | Pinterest | draft attempt 1 | 429; waited 4 seconds |
| 5 | Pinterest | draft attempt 2 | 200, schema FAIL, expected_object |
| 6 | Pinterest | one draft repair | 429; no repair retry |
| 7 | Apple TV | facts attempt 1 | 429; waited 22 seconds |
| 8 | Apple TV | facts attempt 2 | 200, schema PASS; subsequent numeric rejection |
| 9 | Xbox | facts attempt 1 | 429; global budget exhausted |

Camp Snap and robotaxi made zero model requests: both were blocked before fetch. Total: nine HTTP requests, four 429s, five HTTP-200 responses (four schema-valid, one schema-invalid). Retries and repairs consume the same budget because calls increments before every fetch. Displayed stage attempts reset between invocations and do not indicate remaining global capacity. Source requests are a separate budget; the run reported ten source requests.

The original request gets up to two 429 retries only while global calls remain. Repairs have one request and no retry. Retry-After seconds/date is preferred, otherwise parsed Groq reset durations (larger request/token duration), otherwise 5 then 10 seconds plus 0–1 second jitter. Each delay is clamped to 1–30 seconds. Actual 4/22-second waits imply server-derived delays, but the old log does not identify which header. The code does not preserve a cooldown across candidate boundaries after a terminal 429.

Safe model logs now add Global call N/9, Parsed JSON type, reason for skipping a 429 retry (repair limit, stage limit or global budget), and pre-fetch budget rejection. Counters and branching behavior are unchanged. A mocked replay verifies the exact ledger and wait sequence.

## Draft expected_object

JSON.parse passed, but schemaIssue reports expected_object only for null, array or primitive JSON. A dictionary missing title/sections would receive a different structural issue. This indicates that the returned top-level JSON violated the requested object shape, not invalid JSON syntax or evidence that the local parser rejected a valid draft object. The 1,869-character log cannot identify its exact type. New logs record only the parsed type (null/array/string/number/boolean/object), never the response. No unwrapping, coercion, parser relaxation or prompt change was made.

## Recommended next actions (not implemented)

1. Use the next failed fact's diagnostics to confirm 4K, then narrowly separate product/resolution identifiers from financial magnitude parsing with positive and negative evidence tests. Do not broadly disable numeric validation.
2. Preserve nine total actual HTTP requests. The smallest rate-limit improvement is a shared provider cooldown after EVERY 429, including a terminal repair 429, before the next candidate/stage request. This could avoid the immediate new-candidate 429 seen after Pinterest. Keep a hard elapsed-time bound; if the provider asks for a delay beyond it, end/defer the run rather than retry earlier than requested. It cannot guarantee recovery from quota exhaustion; the precise rate-limit dimension was not logged.
3. Do not simply stop counting 429s: that silently increases total HTTP requests and can amplify throttling. Consider separate completion/transport budgets only as an explicitly approved future policy change.
4. Use Parsed JSON type to narrow the next draft-shape failure before another prompt/schema change. Base Labs LOW_INFORMATION_VALUE is a separate editorial rejection and remains unchanged.

## Validation

News-quality tests: 198 passed, zero failed (10 new tests). Typecheck and lint passed; lint retains the existing ToolLogo.tsx image warning. Production build passed with 370 static pages. All 10 workflow YAML files validated. git diff --check passed. The numeric acceptance predicate was compared directly against HEAD and is unchanged. No source, threshold, workflow or publication-policy files changed.
