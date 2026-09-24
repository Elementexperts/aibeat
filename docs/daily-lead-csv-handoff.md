# Daily discovery and weekly outreach queue

Daily discovery scans up to 30 candidates and targets up to 30 qualifying tools (defaults; repository variables can override). Product Hunt and BetaList candidates alternate so neither source crowds out the other. Product Hunt written website links and BetaList linked images are inspected. Discovered same-site visit/out/redirect links may resolve to the external product website; guessed destinations are never invented.

The product website must load successfully. Public business emails must belong to its domain or a subdomain. No personal inbox guessing or mailbox delivery verification. Retrieval is bounded: 8-second request timeout, 1 MB response cap, three redirects, eight contact pages and a 20-second contact-scan window. Public network checks apply to each destination. Blocked pages and missing contacts stay in reports, not the draft queue.

## Files and dates

- `data/outreach/daily-manual-leads.csv`: active queue, with discovered_at, contact_verified_at, discovery_run_id and public_contact_source_url.
- `data/outreach/daily-manual-leads.history.csv`: persistent completed history, including outreach_drafted_at. Created on the first successful batch; never cleared weekly.
- `data/outreach/reports/daily_<date>_<timestamp>_<run>.json` and `.md`: separate report per discovery run, including candidates that lacked contacts. Uploaded as artifacts.

Discovery checks active and historical emails, normalized website hosts and tool names; selects one contact per new tool. Suppressed and previously contacted store entries stay excluded. Existing CSV rows are preserved during discovery.

## Monday reset

Monday selects up to 120 new queue entries, newest dated discoveries first. After the whole selected batch creates drafts or confirms matching drafts already exist, it archives the completed entries and removes only those entries from the active CSV. Undrafted overflow and invalid rows remain; no lead is discarded just because the week changed. Disabled Gmail mode and failed batches do not reset the queue. Gmail drafts remain unsent.

Both workflows share concurrency group outreach-lead-queue, check out main and persist only the standard active CSV and history CSV using github-actions[bot]. They rebase without force push; conflicts fail visibly. Monday now uses the standard queue path explicitly rather than an alternate repository-variable path. This keeps reset/persistence on the same files. CSV-only commits may trigger existing Vercel Git integration; deployment settings are unchanged. No commits or pushes are executed during local validation.

Dry runs write reports only, never queue/history/store changes or drafts. Limits are targets, not guarantees: some tools expose no public email or block automated access. Existing repository variable values still override new defaults.
