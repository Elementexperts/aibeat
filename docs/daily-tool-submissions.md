# Daily tool submissions

GitHub Actions runs `daily-tool-submissions.yml` every day at 04:00 UTC (09:00 Tashkent). It does not need a local computer or Codex. GitHub can delay scheduled jobs; workflow_dispatch supports an immediate run, with dry-run enabled by default.

The worker reads NEW/IN_REVIEW tool submissions directly from Supabase, including backlog, and deduplicates product URLs. It reviews at most five new products per run using official website/pricing text and the existing Gemini credential. Only fetched public page text/URLs are sent to Gemini: no private form payloads, contact addresses, submission IDs or credentials are included in its prompt. Inaccessible sites and API failures remain retryable. Unclear products/pricing and paid-placement requests are held for attention; `retry_held` explicitly reconsiders these records.

Approved listings are validated, unscored standard free directory entries in `data/automated-tools.json`. JSON data cannot execute generated code. Curated directory entries take precedence. The workflow tests and builds before committing only that JSON file to main. The existing Vercel Git integration deploys main; no `GITHUB_TOKEN`-triggered secondary Actions workflow is assumed.

The worker checks each production page's HTTP response, product title, canonical path and official product URL before creating its confirmation draft. Deployment delays defer confirmations; subsequent runs retry. Drafts go to the submission contact from hello@aibeat.dev. There is no send endpoint in this worker.

The private `tool_submission_automation` table records review, publication and Gmail draft state. A reservation is saved before Gmail creation. After an interrupted request, the worker looks for the draft's stable marker. If it cannot reconcile the result, it stops that item for manual review instead of risking a duplicate. The current OAuth grant is compose-only, so it cannot search sent mail or attach replies to existing sent conversations. Existing curated listings are treated as historical entries without generating fresh confirmation emails. The worker creates new individual confirmation drafts for new listings; it does not automatically send or create recurring promotional reminders.

## Setup

Apply `supabase/migrations/202609270001_submission_automation.sql` once. The ledger is inaccessible to anonymous/authenticated clients; use the project's service-role key only in the worker.

Repository secrets: `SUBMISSIONS_SUPABASE_KEY` (project service-role key), `GEMINI_API_KEY`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`.

Repository variable: `SUBMISSIONS_SUPABASE_URL` (https://PROJECT.supabase.co).

Start with Actions → Daily Tool Submissions → Run workflow → dry_run=true. Check the run summary, then run with dry_run=false. The workflow must be present on main for its schedule to run. Disable the replaced Codex heartbeat after the hosted workflow is verified.

## Operation

Review per-run summaries for approved tools, held IDs and failures. Contact data stays in Supabase/Gmail, not Git or uploaded artifacts. `held` records include a review reason. A `drafting` record with no matching draft needs manual reconciliation: inspect Gmail, then either record its draft ID and phase `complete`, or reset to `prepared` only after confirming no draft was sent or created. Completed records prevent re-creation even if a user sends or deletes the draft.

To stop new daily processing, disable the workflow in GitHub Actions. Existing published listings and drafts are retained.
