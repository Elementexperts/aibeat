# Kit Product Hunt Outreach

This is the safe foundation for AIBeat Product Hunt outreach. It is designed for local and GitHub Actions testing before a production admin UI is exposed.

## Architecture

- Next.js 14 App Router site.
- Existing newsletter signup remains at `app/api/subscribe/route.ts` and is unchanged by this module.
- Kit API V4 client lives in `lib/kit/client.ts`.
- Outreach safety, CSV parsing, merge rendering, local storage, and workflow logic live under `lib/outreach-*.ts`.
- Daily lead discovery, public contact validation, scoring, and report writing live in `lib/daily-lead-discovery.ts`.
- Local workflow data is stored in `data/outreach/store.json`.
- GitHub Actions workflow: `.github/workflows/product-hunt-outreach.yml`.
- Daily discovery workflow: `.github/workflows/daily-lead-discovery.yml`.

The repository currently has no Supabase, Prisma, or production admin authentication layer. Because of that, this first implementation does not expose a production `/admin/outreach` UI. Add a real database and server-side admin authentication before exposing browser-based admin controls.

## Kit API V4 Endpoints Used

- `GET /v4/tags`
- `POST /v4/tags`
- `POST /v4/subscribers`
- `POST /v4/tags/{tag_id}/subscribers/{subscriber_id}`
- `DELETE /v4/tags/{tag_id}/subscribers/{subscriber_id}`
- `GET /v4/custom_fields`
- `POST /v4/custom_fields`
- `POST /v4/broadcasts`
- `PATCH /v4/broadcasts/{id}`
- `GET /v4/broadcasts/{id}`
- `GET /v4/broadcasts/{id}/stats`
- `GET /v4/broadcasts/stats`

All calls use `X-Kit-Api-Key` server-side only.

## Environment Variables

Add these in Vercel only when ready:

```text
KIT_API_KEY
KIT_OUTREACH_TAG_ID
KIT_DEFAULT_EMAIL_TEMPLATE_ID
OUTREACH_ADMIN_EMAILS
OUTREACH_SEND_ENABLED=false
OUTREACH_SAFETY_LIMIT=25
OUTREACH_TIMEZONE=America/New_York
NEXT_PUBLIC_SITE_URL=https://www.aibeat.dev
KIT_FROM_EMAIL=hello@aibeat.dev
KIT_REPLY_TO_EMAIL=hello@aibeat.dev
KIT_FROM_NAME=Nomoz Fayzullaev | AIBeat
AUTOMATED_KIT_SEND_ENABLED=false
DAILY_LEAD_DISCOVERY_SOURCES=product_hunt,betalist
DAILY_LEAD_DISCOVERY_FEED_URL=https://www.producthunt.com/feed
DAILY_LEAD_DISCOVERY_BETALIST_URL=https://betalist.com
DAILY_LEAD_DISCOVERY_LOOKBACK_HOURS=48
DAILY_LEAD_DISCOVERY_MAX_CANDIDATES=30
DAILY_LEAD_DISCOVERY_MAX_LEADS=5
DAILY_LEAD_DISCOVERY_MIN_SCORE=70
DAILY_LEAD_DISCOVERY_CREATE_DRAFTS=true
DAILY_LEAD_DISCOVERY_DRY_RUN=false
DAILY_LEAD_DISCOVERY_REPORT_DIR=data/outreach/reports
```

`OUTREACH_SEND_ENABLED` must stay `false` until a one-recipient internal test succeeds.
`AUTOMATED_KIT_SEND_ENABLED` must stay `false`; the daily workflow creates unpublished Kit draft broadcasts only.

## Commands

Preview the first stored lead:

```bash
npm run outreach -- preview
```

Preview and validate a CSV without saving:

```bash
npm run outreach -- import-csv --file leads.csv
```

Save valid CSV rows as unapproved leads:

```bash
npm run outreach -- import-csv --file leads.csv --save
```

Sync approved leads to Kit:

```bash
npm run outreach -- sync-kit
```

Create a Kit draft broadcast:

```bash
npm run outreach -- create-draft
```

Preview the manually reviewed BetaList lead seed:

```bash
npm run outreach -- seed-betalist
```

Save the reviewed BetaList leads and apply the BetaList-specific outreach copy:

```bash
npm run outreach -- seed-betalist --save
```

Create one-recipient Kit draft broadcasts for saved BetaList leads only:

```bash
npm run outreach -- create-individual-drafts --source "Beta List" --limit 15
```

The BetaList seed currently contains 19 rows from the manually supplied table. Eighteen are approved for draft creation. `privacy@vidrip.app` is intentionally suppressed because privacy inboxes are not appropriate for promotional outreach.

Run daily lead discovery locally as a dry run:

```bash
npm run leads:daily -- --dry-run
```

Run daily lead discovery and create one-recipient Kit drafts:

```bash
npm run leads:daily -- --max-leads 5
```

Attempt scheduling:

```bash
npm run outreach -- schedule --send-at 2026-08-05T14:00:00Z --confirm
```

Scheduling is rejected unless `OUTREACH_SEND_ENABLED=true`, campaign sending is enabled, the timestamp is in the future, and a draft already exists.

## CSV Headers

```csv
first_name,founder_name,company_name,tool_name,email,website_url,product_hunt_url,launch_date,category,contact_type,public_contact_source_url,personalized_opening,priority,lawful_basis
```

Imported leads are never approved automatically and are never sent to Kit automatically.

## Suppression Behavior

Suppressed, unsubscribed, bounced, declined, replied, and interested leads are excluded from sync and follow-up planning. Privacy, legal, security, abuse, DPO, no-reply, and noreply addresses are blocked by default.

## Safe First-Send Procedure

1. Keep `OUTREACH_SEND_ENABLED=false`.
2. Import one internal test address.
3. Manually approve the test lead in `data/outreach/store.json` for local testing only.
4. Run `npm run outreach -- sync-kit`.
5. Run `npm run outreach -- create-draft`.
6. Open Kit and inspect sender, reply-to, subject, content, target tag, and unsubscribe footer.
7. Only after review, set `OUTREACH_SEND_ENABLED=true` in a safe test environment.
8. Schedule only the internal test.
9. Verify delivery.
10. Keep production sending disabled until manually approved.

## GitHub Actions

Run `Product Hunt Outreach Manager` manually from GitHub Actions. It supports:

- `preview`
- `sync-kit`
- `create-draft`
- `seed-betalist`
- `create-individual-drafts`
- `schedule`

For BetaList outreach, choose `create-individual-drafts`. The workflow first saves the reviewed BetaList seed, then creates unpublished one-recipient Kit broadcast drafts for leads with source `Beta List`, up to `max_drafts`.

If you want to reuse a Kit design, set `KIT_DEFAULT_EMAIL_TEMPLATE_ID` to the actual Kit email template/layout ID. Do not use a previous campaign broadcast ID unless Kit confirms it is also a reusable template ID.

The workflow uploads `data/outreach/store.json` as an artifact and never deploys or commits generated data.

Run `AIBeat Daily Lead Discovery` manually or let the daily schedule run at 04:00 UTC. It:

- Reads recent Product Hunt feed entries and public BetaList startup listings.
- Keeps AI-related candidates only.
- Looks for product websites and public contact pages.
- Accepts public business inboxes such as `hello@`, `contact@`, `press@`, `partnerships@`, and `sales@`.
- Blocks privacy, legal, security, abuse, DPO, no-reply, and common personal email domains.
- Scores qualified leads and stores them in `data/outreach/store.json`.
- Creates one-recipient Kit draft broadcasts using individual per-lead tags.
- Uploads `data/outreach/reports/*.json`, `data/outreach/reports/*.md`, and the store snapshot as artifacts.

The daily report includes a `candidateInspections` section for every discovered product. Use it to see:

- Product Hunt URL.
- BetaList URL.
- Detected website URL.
- Pages checked.
- Contact-like links found from the site.
- Emails found.
- Emails that passed public business-contact validation.
- Whether the product qualified or needs manual review.

Required GitHub configuration:

- Secret: `KIT_API_KEY`
- Variable: `KIT_OUTREACH_TAG_ID=21785142`
- Optional variable: `KIT_DEFAULT_EMAIL_TEMPLATE_ID`
- Keep `OUTREACH_SEND_ENABLED=false`
- Keep `AUTOMATED_KIT_SEND_ENABLED=false`

## Troubleshooting

- `401`: Kit authentication failed. Check `KIT_API_KEY` in Vercel.
- `403`: The Kit account or key does not have access to the requested API feature.
- `404`: The configured tag, template, subscriber, or broadcast was not found.
- `422`: Kit rejected validation. Check fields and broadcast payload.
- `429`: Kit rate limit reached. The client retries briefly; try again later.

## Limitations

Reply detection is manual. Use a future admin action such as `Mark as replied` after an inbound reply is observed. Daily discovery uses public pages only and does not scrape personal email inboxes or private data.
