# Groq model diagnostics and bounded recovery

Provider: Groq. Model: unchanged GROQ_MODEL configuration, default openai/gpt-oss-120b. Original stage prompts, JSON object format, temperature 0.1, 3,000 output tokens, 12-second per-request timeout and nine HTTP calls per run remain unchanged.

## Production evidence

The supplied production diagnostics show successful schema-valid executions, one HTTP-200/stop/valid-JSON schema failure (generic field `facts`), and three HTTP 429 failures. They do not reveal the exact malformed field or rate-limit dimension. No truncation was observed.

## Recovery bounds

- Original facts/draft/review requests: at most three attempts, retrying HTTP 429 only.
- Prefer Retry-After seconds or HTTP date; otherwise use Groq request/token reset durations (the larger applicable delay). Invalid headers fall back to 5 then 10 seconds plus 0–1 second jitter.
- Each delay is clamped to 1–30 seconds. At most two waits per stage invocation.
- After HTTP success, stop, valid JSON and failure of the existing parser: one additional repair request, with the same original input and instructions plus one safe structural issue. No failed response is replayed. The repair may not invent facts or change editorial judgments to satisfy validation.
- Explicit empty confirmedFacts abstention is not repaired into new claims.
- Repair uses the exact same parser. There are no further repair attempts, including no 429 retries on the repair request. All other failures remain final.
- Every HTTP request consumes the existing nine-call run budget. A stage can use at most four requests (three transport attempts plus one repair), subject to that global budget. No request budget increase. Recovery may leave fewer calls for later candidates.
- Editorial validation remains in the pipeline. Unsupported claims, missing primary evidence, confidence, risk, freshness, citations, semantic review and other editorial failures do not trigger recovery.

## Safe logs

Existing ten diagnostic categories remain. Original attempts show 1/3, 2/3 or 3/3; repair shows Repair attempt: 1/1 with Repair JSON parse and Repair schema validation. Retry logs show only numeric seconds. Schema repair logs Initial schema validation: FAIL. No credentials, prompts, documents, raw completions, provider error bodies or raw retry headers are logged.

## Separate source-retrieval findings (unchanged)

Official discovery matches candidate titles and up to 6,500 characters of retrieved article/main text against a fixed verified registry. Microsoft/windows/surface/copilot matches can select both Microsoft endpoints and fill the two-hub allowance because Microsoft is first in registry order. This can be an incidental-text false match; the exact Treble trigger cannot be determined without its retrieved page/run artifact. There is no persistent prior-candidate hub state in collectSources.

Publication dates require specific metadata, supported JSON-LD article datePublished, or a time datetime attribute in the extracted body. Visible plain-text dates, unsupported structured fields and client-rendered dates can therefore be missed. PUBLICATION_DATE_MISSING means no supported date was extracted, not that the event is stale. BODY_TOO_LARGE rejects responses above 1,000,000 bytes based on Content-Length or streamed bytes before article text extraction. Large hydration/page payloads can trigger it even when article prose is short. No retrieval or freshness changes are included.
