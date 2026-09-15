# Monday Gmail outreach drafts

Runs Mondays at 16:00 UTC (21:00 Asia/Tashkent), or manually through GitHub Actions. Creates individual unsent Gmail drafts for up to 120 approved, nonsuppressed contacts from the input CSV. Same-week duplicate drafts are skipped.

The workflow and script default to 120 and the script caps the batch at 120. If the repository variable `GMAIL_OUTREACH_DRAFT_LIMIT` is already set to 50, change it to 120 in GitHub Actions variables or remove it to use the default. Smaller explicit limits remain supported.

Use the optional CSV columns `tool_name`, `category`, `personalized_opening`, and `product_benefit` for reviewed product facts. `product_benefit` should describe a concrete user outcome, such as “Turn meeting notes into action items.” Drafts use this benefit and category to tailor the pitch, explain discovery, product presentation, and website CTA benefits, and include https://www.aibeat.dev/submit as a clickable HTML link and a plain-text URL. Missing product facts use neutral copy without inventing features.

Keep `GMAIL_OUTREACH_DRAFTS_ENABLED=true` for draft creation. This workflow does not send emails. Existing Gmail credentials and sender configuration are unchanged.
