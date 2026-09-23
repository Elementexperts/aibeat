# Trusted-publisher publishing

## Requested operating mode

Prioritize original reporting from registered editorial publishers, including TechCrunch, The Verge and verified Forbes staff articles. Ordinary news and the existing eligible business-event categories can use one original trusted report. Publisher eligibility is decided by the exact-host registry and retrieved article/byline classification; an omitted model publisher endorsement no longer blocks publication by itself.

This is not blanket approval for every page on a publisher domain. Contributor, sponsored, opinion, community and derivative content retain their existing exclusions. Sensitive allegations and related consequential categories retain the stronger evidence policy. Factual review can still reject unsupported claims, contradictions, derivative reporting, incorrect entities or dates.

## Changes

- Select up to four editorial candidates before up to two official announcements, then backfill unused slots. Existing published-URL filtering, event deduplication, broad technology scope and six-candidate limit remain.
- Keep official OpenAI, Google and NVIDIA discovery available without letting those feeds displace every independent report.
- Request informative original articles, roughly 250-450 words when the verified facts support that length. This is guidance, not a minimum or publication gate. Limited evidence can still produce shorter coverage. No padding or unsupported details.
- Extract material details and preserve who performed each action. Do not infer years absent from cited passages.
- Fix explicit month/day ranges such as Sept. 22-23 so the second day is not parsed as a negative number. Genuine negative quantities remain distinct. A year absent from citations is still unsupported.
- Log verified fact count, retained/removed paragraphs and body word count without logging article text.

## Preserved

Image alt-text fixes, news-title metadata, source links, citation schema, freshness, source retrieval protections, model schemas, factual review, current 30-call model ceiling, 32-request source ceiling, schedules, deployment identity and IndexNow behavior are unchanged. No existing articles were rewritten. No production requests to Groq, commit, push or deployment were performed.

## Operational limits

This makes eligible trusted reporting the preferred route; it does not guarantee one publication per run. Publisher 403s, Groq rate limits, malformed model responses and insufficient facts can still prevent publication. Do not treat inaccessible source pages or a publisher name alone as evidence.

After deployment, run Daily News once and inspect PUBLISH plus AIBeat Draft diagnostics. The draft line distinguishes sparse evidence from paragraphs removed by validation.
