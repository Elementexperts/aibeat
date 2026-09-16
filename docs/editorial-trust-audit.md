# Editorial Trust v1: pre-change audit

The existing sequence is four RSS feeds → recent feed entries → exact slug dedupe → one Groq prose request using 500 summary characters → OG/AI image preparation → MDX → optional LinkedIn → Actions image backfill → Git commit/push → Vercel Git integration → live-content-verified IndexNow.

Existing components retained: Groq provider/model configuration, RSS discovery, MDX HTML rendering and optional source fields, 1200×675 WebP pipeline, historical content, SEO/feed/sitemap helpers, github-actions[bot] identity, three daily schedules and the single Git-based deployment path. IndexNow already verifies publication on production.

Gaps: no full-document evidence collection, publisher classification, source independence check, cited fact structure, semantic corroboration, explicit risk gate, event-level dedupe or event-date validation. Malformed model JSON could contain structurally invalid article data. Source hints were prompt-only safeguards. Failures counted against the publication limit, preventing later candidates from being considered. The standalone image-backfill step could modify historical files even when all new candidates were rejected.

Implementation will fail closed before images and MDX, cap retrieval/model calls, preserve legacy frontmatter, and provide a local-only historical audit report. The daily backfill/commit/IndexNow steps will be conditional on a successfully accepted new article. Existing rejection-independent infrastructure error handling stays available.
