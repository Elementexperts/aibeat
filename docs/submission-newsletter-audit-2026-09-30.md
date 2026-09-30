# Newsletter and submission processing audit — 2026-09-30

## Findings and changes

- SEO fixes were pushed in commit 4b0fad9554cfcc904cb9c55a22c4dd1c120c16b8; Vercel reported a successful deployment.
- The popup posts to `/api/newsletter-request`, which stores requests in Supabase. It did not enroll contacts in a mailing audience. A Gmail notification failure could return an error after the database had already accepted a signup. Saved requests now return success independently of the owner notification; database failures still return an error.
- The requested destination is Google Contacts label `Newsletter`, not Kit. The new hourly GitHub workflow reads stored requests, deduplicates addresses, reuses contacts, and adds only this label. Unsubscribe records override signup records regardless of completion status. It removes opted-out contacts from this label without deleting contacts or changing other labels. Mixed-consent contact aliases require manual review. No newsletter email is sent by this workflow.
- Local Gmail OAuth refresh succeeded, but its token has only Gmail compose scope. A People API read returned HTTP 403 for insufficient scope. Production Gmail notification configuration could not be confirmed: the connected Vercel account lacks project access. Do not interpret passing mocks as proof of production email delivery.
- [September 30 submission run](https://github.com/Elementexperts/aibeat/actions/runs/36699923691) passed verification/build, but the reviewer returned HTTP 503 for ShopChief and a localized MangaTranslate submission. Bounded retries already exist; permanent review bypasses were not added.
- Existing curated listings previously remained NEW in the source queue. Reconciliation now verifies the production page's title, product link and slug before completing those requests. It preserves existing correspondence rather than generating duplicate confirmations.
- MangaTranslate's reviewed English/Korean/Russian/Arabic landing URLs refer to the already featured `manhwa-translator` product. Toolsvio's homepage and `/tools` index refer to its already featured `toolsvio` listing. Narrow aliases cover these exact paths; unrelated products on shared domains remain distinct.
- The daily workflow is configured for 04:00 UTC / 09:00 Tashkent. The September 30 scheduled run actually started at 10:02 UTC. GitHub schedules are delayed sometimes; configuration is not a punctual-execution guarantee.

## Manual listing review

ShopChief is added as an unfeatured, unscored listing at `/tools/shopchief`. [Official product page](https://shopchief.ai/) and [pricing](https://shopchief.ai/pricing) support ecommerce research, copy, assets, store/SEO tasks, authorization requirements, 1,500 signup credits, and paid plans starting at $19/month. No measured performance or customer rating is invented.

Toolsvio already has a featured listing. Its [current homepage](https://www.toolsvio.online/) brands itself Toolvio and distinguishes current text utilities, calculators and SEO checks from planned AI/image/PDF tools. Do not add a second listing or infer a new paid placement from the test submission. Existing featured status is preserved.

## Activate Google Contacts syncing

1. Enable Google People API in the project associated with the existing Gmail OAuth client.
2. Authorize the intended AIBeat Google account using that same OAuth client, requesting offline access to `https://www.googleapis.com/auth/contacts`. Confirm the account is the one whose contacts you want to maintain. Google consent must be completed by the account owner.
3. Store the resulting refresh token as GitHub Actions secret `GOOGLE_CONTACTS_REFRESH_TOKEN`. Keep the existing Gmail token unchanged. Reuse `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `SUBMISSIONS_SUPABASE_KEY` secrets and `SUBMISSIONS_SUPABASE_URL` variable already used by the submission workflow. Never place refresh tokens in source files, logs, or chat.
4. Set repository Actions variable `GOOGLE_CONTACTS_SYNC_ENABLED` to `true`.
5. Run `Newsletter Google Contacts Sync` manually with `dry_run: true` to inspect aggregate counts, then with `dry_run: false`. Confirm contacts appear under Newsletter and opted-out addresses are excluded. The enabled workflow subsequently runs hourly at minute 17.

Until those credentials and the enable variable are configured, the sync job deliberately remains skipped. Its implementation is ready; live enrollment has not been verified.

Local validation: `npm test`, `npm run typecheck`, `npm run build`. The Contacts tests cover deduplication, completed opt-outs, pagination, existing contacts, mixed consent, missing permission, membership partial failures and duplicate label names. Newsletter route tests distinguish stored requests with failed notifications from storage failures.

Google API reference: https://developers.google.com/people/api/rest/v1/contactGroups.members/modify
