# News production reliability

The GPT-OSS models on Groq now use strict JSON Schema for facts, draft and review. This prevents structural failures (empty objects, arrays instead of drafts, missing keys and wrong types) at generation time. It does not establish factual accuracy. Local parsers, source requirements, confidence, freshness, deduplication and final review still decide eligibility. Facts use passage IDs, not generated quotations. Empty fact arrays remain available for abstention.

Provider and default model remain Groq / openai/gpt-oss-120b, Chat Completions, temperature 0.1, 3000 maximum output tokens. Configured models outside the verified GPT-OSS pair retain json_object compatibility. Logs identify the response format. Schema string lengths and array cardinalities remain local checks for portability; detailed draft diagnostics now identify the offending field, and the prompt states paragraph/section limits.

Reference: https://console.groq.com/docs/structured-outputs (checked 2026-09-24).

One semantic schema-repair request may now make up to three HTTP attempts when rate limited. This is not three semantic repairs: the same original evidence and same structural correction are retried. Every HTTP attempt still consumes the shared 30-call ceiling. Provider cooldown, the 60-second per-wait limit, and pipeline rejection behavior remain. Successful responses with explicit depleted request/token headers schedule the next request after the provider reset; absent or malformed headers do not invent a delay. This anticipates some, not all, token throttling because next-stage input size and other account traffic vary.

The 5K micro OLED display parsing regression is fixed with bounded display-context recognition. Unknown magnitude contexts, mismatched resolutions and unsupported years still fail.

## Validation and rollout

Mocked production-path tests exercise passage facts, malformed draft, two repair 429s, valid draft, final review, rendering and the publication callback. A negative case proves that review rejection still prevents publication after transport recovery. These do not substitute for live provider verification.

After deploying, manually run Daily AI News Automation and inspect Response format: json_schema, per-call status, PUBLISH and published_count, then the commit and Vercel deployment. No live API calls, article writes, commits or pushes are part of this patch's verification. No guarantee of an article every run: an outage, exhausted quota, only stale/duplicate stories or unsupported evidence can still result in zero. Never fill the gap with fabricated or unchecked content.
