# Production follow-up: broad technology coverage

The user selected broad technology coverage. No AI-only filter, reduced editorial thresholds, extra model requests, or guaranteed-publication fallback was introduced.

## Implemented

1. Resolution identifiers: adjacent 2K/4K/8K/16K near TV, display, monitor, screen, video or resolution wording use a distinct resolution_k unit. Matching Apple TV 4K evidence now passes; 4K versus 8K, 4000 or $4000 does not. Explicit monetary $4K remains a monetary magnitude. Other ambiguous K usage stays rejected. Existing numeric diagnostics show the new unit.
2. Shared cooldown: every HTTP 429 records the next permissible request time in the shared model adapter. The next stage/candidate waits for any remaining delay, including after terminal repair or retry exhaustion. Time spent retrieving sources counts toward that wait. The existing 1–30 second delay bounds, Retry-After/reset parsing, retry count, single repair and nine actual HTTP requests remain unchanged. Budget exhaustion is checked before waiting or sending another request.
3. Candidate slots: known published source URLs are filtered before the existing source-tier/freshness sort and six-candidate cap. Broad technology topics remain eligible. Existing final event deduplication and all evidence/publication gates remain intact. The first fully approved story reaches the existing image/article publication path and the existing configured article limit still stops the run.

## Limits

These changes remove demonstrated avoidable failures; they cannot guarantee publication if all candidates fail factual/originality checks or Groq remains rate-limited. Persistent quotas and server delays longer than the existing 30-second cap may still block progress. Draft shape and Base Labs LOW_INFORMATION_VALUE failures are not bypassed. Production rollout and a manual Daily News run are still required to observe the live result; this task did not commit, push or trigger publication.

## Verification

403 tests passed, including resolution-versus-money boundaries, cross-candidate terminal-repair cooldown, elapsed-time handling, six-slot selection with published URLs, broad technology coverage, and existing editorial/retry/budget tests. Typecheck, lint and production build passed (existing ToolLogo.tsx image warning). All 10 workflow YAML files validated and git diff --check passed. Editorial configuration, gate, risk, trust and workflows are unchanged.

Recommended commit: fix(news): preserve resolution evidence and share rate-limit cooldowns
