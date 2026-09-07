# AIBeat Email Delivery

Public tool submissions (`/api/submit`), newsletter requests (`/api/newsletter-request`), unsubscribe notifications (`/api/unsubscribe`), and business early access (`/api/business/early-access`) save to Supabase and then send an owner notification through Resend. All four use `lib/public-form-submissions.ts` and `lib/public-form-email.ts`.

## Recipient configuration

`hello@aibeat.dev` is always included, including when an existing environment setting contains only `info@aibeat.dev`. Configured addresses are additional recipients; `info@aibeat.dev` remains included when configured. Public contact links are unchanged.

| Form | Recipient override |
| --- | --- |
| Tool submission | `SUBMISSION_TO_EMAIL` |
| Newsletter request | `NEWSLETTER_TO_EMAIL` |
| Unsubscribe | `UNSUBSCRIBE_TO_EMAIL` |
| Business early access | `BUSINESS_EARLY_ACCESS_TO_EMAIL` |

For each request, the first valid recipient list wins: route-specific setting, then `SUBMISSION_TO_EMAIL`, then no extra recipients. Blank or entirely invalid lists fall through. Lists accept commas or whitespace, normalize to lowercase, drop invalid addresses, and deduplicate, including the mandatory hello address. Route overrides replace shared extras.

Example configuration (documentation only):

```bash
SUBMISSION_TO_EMAIL=hello@aibeat.dev,info@aibeat.dev
SUBMISSION_FROM_EMAIL=AIBeat <submissions@aibeat.dev>
```

## Sender and delivery

`RESEND_API_KEY` is required for notifications. Sender precedence is the corresponding `NEWSLETTER_FROM_EMAIL`, `UNSUBSCRIBE_FROM_EMAIL`, or `BUSINESS_EARLY_ACCESS_FROM_EMAIL`, then `SUBMISSION_FROM_EMAIL`, then `AIBeat <submissions@aibeat.dev>`. Tool submissions use the shared sender. Blank sender values fall through. The sender domain must be verified in Resend. Replies go to the submitted email address.

Supabase storage must succeed before sending. Provider rejection, network timeout (10 seconds), missing credentials, or a missing provider email ID produces an error response; the stored submission remains available for manual recovery. The submission ID is used as the Resend idempotency key. There is no automatic retry worker; resubmitting the form creates a new record and can produce another notification. Provider acceptance does not guarantee inbox delivery: check Resend delivery/bounce logs and mailbox spam filters if a notification is missing.

Unsubscribe still performs the Kit lookup/unsubscribe first, and records/notifies for both matching and unknown subscribers. A later notification failure does not undo a successful Kit unsubscribe.

The separate `/api/subscribe` Kit signup path uses `KIT_API_KEY` and `KIT_FORM_ID`; it does not create an owner notification.

This code change does not update local or deployed environment values. Deployment requires existing Supabase configuration and usable Resend credentials with a verified sender. No live email is sent by the mocked tests.
