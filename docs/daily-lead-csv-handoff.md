# Daily discovery and Gmail draft queue

Daily discovery scans up to 30 candidates and targets up to 30 qualifying tools (defaults; repository variables can override). Product Hunt and BetaList candidates alternate so neither source crowds out the other. Product Hunt written website links and BetaList linked images are inspected. Discovered same-site visit/out/redirect links may resolve to the external product website; guessed destinations are never invented.

The product website must load successfully. Public business emails must belong to its domain or a subdomain. No personal inbox guessing or mailbox delivery verification. Retrieval is bounded: 8-second request timeout, 1 MB response cap, three redirects, eight contact pages and a 20-second contact-scan window. Public network checks apply to each destination. Blocked pages and missing contacts stay in reports, not the draft queue.

## Files and dates

- `data/outreach/daily-manual-leads.csv`: active queue, with discovered_at, contact_verified_at, discovery_run_id and public_contact_source_url.
- `data/outreach/daily-manual-leads.history.csv`: persistent completed history, including outreach_drafted_at. Created on the first successful batch; never cleared weekly.
- `data/outreach/reports/daily_<date>_<timestamp>_<run>.json` and `.md`: separate report per discovery run, including candidates that lacked contacts. Uploaded as artifacts.

Discovery checks active and historical emails, normalized website hosts and tool names; selects one contact per new tool. Suppressed and previously contacted store entries stay excluded. Existing CSV rows are preserved during discovery.

## Daily draft generation

Daily discovery is followed by Gmail draft preparation for **all eligible queued leads**, including new discoveries and unfinished backlog. There is no separate 10/120-draft cap; discovery still has its configured candidate/lead limits. The Monday workflow is retired and its manual action points to daily discovery.

Each confirmed draft is archived immediately, before the next lead. Malformed rows remain verbatim in the active CSV with validation reasons in the run summary. They are not moved, fixed automatically, or deleted. Disabled drafting leaves the queue intact. Failures on individual Gmail requests do not discard other successful drafts.

Set `GMAIL_OUTREACH_DRAFTS_ENABLED=true` to enable drafting. The daily job uses the existing Gmail credentials and `SUBMISSIONS_SUPABASE_URL`/`SUBMISSIONS_SUPABASE_KEY` for a fresh, paginated unsubscribe check. If that check fails, drafting fails closed. The outreach store's suppression, unsubscribe, bounce, prior-contact and reply markers are also honored when present. External bounces/replies are not automatically imported from Gmail; keep those store records current. No sending is performed.

`data/outreach/gmail-draft-ledger.json` stores a SHA-256 contact key scoped to the initial Spotlight campaign, plus reservation/completion state and draft ID. Keys do not change weekly. Existing history suppresses earlier completed contacts; legacy weekly Gmail drafts are recognized by their exact recipient and marker. Sending/deleting a completed draft does not make that contact eligible again.

On GitHub Actions, each reservation is committed and pushed **before** Gmail creation; completion and queue/history are committed and pushed after each success. This adds small checkpoint commits but protects against runner termination and response loss. An interrupted reservation is lookup-only on later runs: if its draft is found, archive it; otherwise hold it for manual reconciliation. Check Gmail drafts and sent mail before resetting any reservation. Persistence failures halt drafting. Both discovery and drafting share `outreach-lead-queue`; no force push or automatic conflict resolution is used.

The summary reports discovered/qualified/added counts, eligible leads, created drafts, duplicates, exclusions, invalid rows, failures, uncertain outcomes, and disabled mode. Partial failures mark the run failed after preserving successful progress. Reports and ledger are uploaded as artifacts. There is no local live Gmail call during tests.

Before rollout, commit only implementation files, not unrelated local CSV edits. The workflow checks out current `main` and retains its queue/history. Pull remote queue updates before separately reconciling local data cleanup. Keep the history and ledger permanently: clearing them can remove deduplication evidence. Existing CSV-only commits and checkpoint commits may trigger Vercel's Git integration.

Dry runs write reports only, never queue/history/store changes or drafts. Limits are targets, not guarantees: some tools expose no public email or block automated access. Existing repository variable values still override new defaults.
