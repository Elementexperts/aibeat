# AIBeat Email Delivery

Public tool submissions, newsletter requests, unsubscribe requests, and business early access save to Supabase using `record_public_form_submission`, then notify the owner using the Gmail Workspace API. These form notifications do not require Kit or Resend.

## Configuration

Deploy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, plus the existing `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` credentials. The Gmail token must allow sending (gmail.send, gmail.compose, gmail.modify, or mail.google.com). The existing draft workflow's gmail.compose scope supports sending as well.

Set `SUBMISSION_FROM_EMAIL=AIBeat <hello@aibeat.dev>`. The OAuth account must be hello@aibeat.dev or have that address configured as an allowed Gmail send-as alias. Route-specific `NEWSLETTER_FROM_EMAIL`, `UNSUBSCRIBE_FROM_EMAIL`, and `BUSINESS_EARLY_ACCESS_FROM_EMAIL` take precedence, so update any old submissions@aibeat.dev values in production. Blank sender values fall through to the shared setting, then AIBeat <hello@aibeat.dev>.

`hello@aibeat.dev` is always a recipient. Route-specific `NEWSLETTER_TO_EMAIL`, `UNSUBSCRIBE_TO_EMAIL`, and `BUSINESS_EARLY_ACCESS_TO_EMAIL` replace shared extra recipients from `SUBMISSION_TO_EMAIL`. Lists accept commas or whitespace and are normalized and deduplicated. Replies go to the submitted email address.

## Unsubscribe workflow

The unsubscribe endpoint validates and normalizes the email, then saves a `public_form_submissions` record with kind `unsubscribe`, including the optional reason and page URL. It never calls Kit. The existing public-form migration is sufficient; no new migration is required.

Success means the request is durably saved. The page says “Unsubscribe request received” because Gmail draft creation does not automatically manage a newsletter audience. Before any manual newsletter send, exclude all addresses returned by this query in the authenticated Supabase SQL editor:

```sql
select distinct lower(trim(email)) as email
from public.public_form_submissions
where kind = 'unsubscribe' and email is not null;
```

Apply these exclusions to the final Gmail recipient list, including any recipients added manually after generating a draft. Marking requests completed must not remove them from the exclusion list. Existing Gmail newsletter scripts prepare drafts; they are not an automatic audience sender or suppression sync.

Storage failure returns an error and sends no notification. After an unsubscribe is saved, Gmail failure is logged with the submission ID but does not reject the saved request. Review Supabase unsubscribe records before sends even if no notification arrived. Other public forms continue surfacing notification failures after saving their submission.

## Delivery and deployment

Gmail OAuth refresh and send requests each have a 10-second timeout. There is no automatic retry or guaranteed deduplication of sends. Resubmission creates another record and can produce another notification. Provider acceptance is not proof of inbox delivery.

Deploy the updated application with the Gmail credentials in the production environment. Local `.env.local` changes do not update hosting configuration. No live email is sent by the mocked tests. Legacy Kit code in the separate `/api/subscribe` route and outreach tools is outside this public-form workflow.
