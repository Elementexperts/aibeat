# Friday weekly tools draft

The workflow runs Fridays at 16:00 UTC (21:00 Asia/Tashkent). GitHub schedules can start later. Keep `GMAIL_WEEKLY_TOOLS_DRAFT_ENABLED=true` in repository variables; the Gmail credentials remain repository secrets. The default sender is hello@aibeat.dev, and `GMAIL_DRAFT_TO` identifies the draft recipient.

Scheduled runs select the first eight unique featured tools from the current directory. `lib/data.ts` prepends `data/submitted-tools.ts`, whose editorial additions are maintained newest first. There is no tool publication timestamp, so the email does not claim every tool launched within ten days. Add new reviewed featured listings at the beginning of that list.

`WEEKLY_TOOL_SLUGS` is no longer read from a persistent repository variable. To override one run, use the optional `tool_slugs` input under Run workflow, with exactly eight different valid slugs. The workflow summary prints the actual selected names and slugs.

Rerunning during the same ISO week replaces that week's existing unsent draft with the current selection and content. This also replaces manual edits in that generated draft. Previous weeks and other newsletter/outreach drafts are left alone. Legacy weekly keys with tool-slug suffixes are recognized. Draft discovery follows all result pages, so Monday outreach drafts cannot hide the weekly draft beyond the first 50 results. The job never sends the newsletter.

Tool logo paths become absolute site URLs for Gmail. The existing Pictory partner promotion is preserved.

Validation includes prepended featured selection, exclusion of nonfeatured entries, duplicate override rejection, absolute image URLs, existing-draft updates, legacy keys, and pagination. Before any eventual newsletter send, apply the Supabase unsubscribe exclusions described in `docs/email-delivery.md`.

## Deliverability review

Set `GMAIL_WEEKLY_TOOLS_REVIEW_TO` to one internal reviewer address (falls back to `GMAIL_DRAFT_TO`). Lists and display-name syntax are rejected. The job creates an unsent editorial draft, not a subscriber campaign. Tests run before Gmail is contacted. The generated message now includes a visible unsubscribe link in HTML and plain text, a factual discount subject, Date and Message-ID headers, folded UTF-8 headers, and MIME base64 lines limited to 76 characters.

Before sending:
- Send only to confirmed subscribers. Tool submissions, public contact addresses, and outreach leads do not establish newsletter consent.
- Apply the Supabase unsubscribe exclusions in `docs/email-delivery.md`, honor requests within two days, and suppress recurring bounces. Do not repeatedly forward the newsletter to BCC batches after rejection.
- Verify the OAuth account owns the From address or has a verified send-as alias. Verify SPF, DKIM (prefer 2048-bit), and DMARC alignment on an actual received test message. DNS and Workspace authentication cannot be configured by this draft workflow. Google manages the sending transport/IPs; check TLS and authentication in received headers.
- Monitor domain reputation and spam complaints in Google Postmaster Tools; aim below 0.1% and never reach 0.3%. A successful draft/API response does not establish delivery.

The existing `/unsubscribe` page asks for an email address and records a suppression request. It is not an RFC 8058 one-click endpoint, so this workflow deliberately does not emit `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. For bulk marketing delivery, use a subscriber-aware sender with recipient-specific HTTPS unsubscribe tokens, a POST handler that suppresses without login or confirmation, and DKIM coverage of both unsubscribe headers. Do not put a shared recipient's token in a draft that will be forwarded or BCC'd. Verify final sent headers because Gmail editing/forwarding may change them. This remaining audience/sending infrastructure is outside an editorial draft workflow.

Reference: https://support.google.com/mail/answer/81126 (reviewed September 11, 2026). These changes improve formatting and opt-out visibility; they do not guarantee Gmail acceptance.
