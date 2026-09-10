# Friday weekly tools draft

The workflow runs Fridays at 16:00 UTC (21:00 Asia/Tashkent). GitHub schedules can start later. Keep `GMAIL_WEEKLY_TOOLS_DRAFT_ENABLED=true` in repository variables; the Gmail credentials remain repository secrets. The default sender is hello@aibeat.dev, and `GMAIL_DRAFT_TO` identifies the draft recipient.

Scheduled runs select the first eight unique featured tools from the current directory. `lib/data.ts` prepends `data/submitted-tools.ts`, whose editorial additions are maintained newest first. There is no tool publication timestamp, so the email does not claim every tool launched within ten days. Add new reviewed featured listings at the beginning of that list.

`WEEKLY_TOOL_SLUGS` is no longer read from a persistent repository variable. To override one run, use the optional `tool_slugs` input under Run workflow, with exactly eight different valid slugs. The workflow summary prints the actual selected names and slugs.

Rerunning during the same ISO week replaces that week's existing unsent draft with the current selection and content. This also replaces manual edits in that generated draft. Previous weeks and other newsletter/outreach drafts are left alone. Legacy weekly keys with tool-slug suffixes are recognized. Draft discovery follows all result pages, so Monday outreach drafts cannot hide the weekly draft beyond the first 50 results. The job never sends the newsletter.

Tool logo paths become absolute site URLs for Gmail. The existing Pictory partner promotion is preserved.

Validation includes prepended featured selection, exclusion of nonfeatured entries, duplicate override rejection, absolute image URLs, existing-draft updates, legacy keys, and pagination. Before any eventual newsletter send, apply the Supabase unsubscribe exclusions described in `docs/email-delivery.md`.
