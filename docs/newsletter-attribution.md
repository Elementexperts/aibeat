# Newsletter Attribution

AIBeat newsletter forms send source attribution to the existing `/api/subscribe` endpoint without adding visible form fields.

The browser sends:

- `page_url`
- `referrer`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

The server validates and trims these values before sending anything to Kit. Kit API keys and Kit tag IDs are never sent to client-side code.

## Campaign Links

Use these links when sharing the newsletter page.

LinkedIn:

```text
https://www.aibeat.dev/newsletter?utm_source=linkedin&utm_medium=social&utm_campaign=daily_brief
```

Reddit:

```text
https://www.aibeat.dev/newsletter?utm_source=reddit&utm_medium=community&utm_campaign=daily_brief
```

Fazier:

```text
https://www.aibeat.dev/newsletter?utm_source=fazier&utm_medium=directory&utm_campaign=product_launch
```

Uneed:

```text
https://www.aibeat.dev/newsletter?utm_source=uneed&utm_medium=directory&utm_campaign=product_launch
```

Newsletter partnership:

```text
https://www.aibeat.dev/newsletter?utm_source=partner&utm_medium=referral&utm_campaign=newsletter_swap&utm_content=PARTNER_NAME
```

## Source Tag Mapping

The server maps `utm_source` to one Kit source tag:

- `linkedin` -> LinkedIn
- `reddit` -> Reddit
- `fazier` -> Fazier
- `uneed` -> Uneed
- `partner`, `newsletter_partner`, or `cross_promotion` -> Partner
- missing `utm_source` with an AIBeat page URL -> Direct
- anything else -> Other

Source tagging is best-effort. If Kit accepts the subscriber but tag application fails, the signup still succeeds.

## Kit Source Tag Setup Script

Run this after `KIT_API_KEY` is available in your environment or local `.env.local` file:

```bash
npm run kit:setup-source-tags
```

The script creates or retrieves these exact Kit tags:

- `Source — Direct`
- `Source — LinkedIn`
- `Source — Reddit`
- `Source — Fazier`
- `Source — Uneed`
- `Source — Partner`
- `Source — Other`

The script is safe to rerun. It first checks existing Kit tags, creates only missing exact-name tags, verifies that each required tag has exactly one numeric ID, and then updates the local ignored `.env.local` file with the `KIT_TAG_SOURCE_*` values.

The script never prints the Kit API key. If `KIT_API_KEY` is unavailable or Kit authentication fails, it exits without writing an incomplete configuration.

To verify in Kit manually:

1. Open Kit.
2. Go to the tags/subscribers area.
3. Confirm the seven tags above exist exactly once.
4. Confirm their IDs match the environment-variable mapping printed by the script.

## Vercel Environment Variables

Add these in Vercel under:

```text
Project Settings -> Environment Variables
```

Required existing variables:

```text
KIT_API_KEY
KIT_FORM_ID
```

Optional source tag variables:

```text
KIT_TAG_SOURCE_DIRECT
KIT_TAG_SOURCE_LINKEDIN
KIT_TAG_SOURCE_REDDIT
KIT_TAG_SOURCE_FAZIER
KIT_TAG_SOURCE_UNEED
KIT_TAG_SOURCE_PARTNER
KIT_TAG_SOURCE_OTHER
```

Do not place real tag IDs in the repository. Add them only in Vercel and local `.env.local` when testing locally.

If Vercel CLI access is unavailable, configure the variables manually:

1. Open the AIBEAT project in Vercel.
2. Go to `Settings -> Environment Variables`.
3. Add each `KIT_TAG_SOURCE_*` variable using the ID printed by `npm run kit:setup-source-tags`.
4. Apply the variables to Production, Preview, and Development.
5. Save the changes.
6. Redeploy only when you are ready for production to use the new values.

## Manual Kit Steps

Manual tag creation is only needed if the setup script cannot be used.

1. Open Kit.
2. Create the seven exact source tags listed above.
3. Copy each tag ID from Kit.
4. Add the tag IDs to Vercel using the environment variable names above.
5. Redeploy the site after changing Vercel environment variables.
6. Test one campaign link at a time and confirm the subscriber receives the expected source tag in Kit.

If a tag ID is missing, subscriptions still work. That source simply will not receive a Kit tag until the ID is configured.
