# Permanent marketing suppression

Prepared 2026-11-20 on codex/permanent-email-suppression, based on main
383b07e5efce423aafd72afd63138dbddc13d0a0, in .work-email-suppression.
No production database access, provider mutations, mail sending, deployments,
commits or pushes were performed. The original C01 workspace was left untouched.

## Scope and delivery inventory

| Entry point | Classification | Enforcement |
| --- | --- | --- |
| weekly-newsletter.yml / create-gmail-newsletter-draft.ts | Wednesday technology newsletter; unsent review draft | Shared Gmail adapter checks before lookup and immediately before draft POST/PUT |
| weekly-tools-gmail-draft.yml / create-gmail-weekly-tools-draft.ts | Friday featured tools; unsent review draft | Same checks; no send API added |
| daily-lead-discovery.yml / create-gmail-outreach-drafts.ts | Founder marketing outreach | Central suppression list, bulk eligibility and fresh shared draft-boundary checks |
| Retired Monday founder workflow | Inactive | Daily replacement above is protected; no retired schedule enabled |
| product-hunt-outreach.yml / outreach-workflow.ts / kit/client.ts | Lead enrollment and promotional campaign drafts | Bulk filtering, recipient checks on each provider request/retry, actual paginated Kit tag audience verification |
| Kit broadcast scheduling | Marketing delivery | Blocked, including legacy enabled send flags: Kit cannot consult Supabase at future delivery time |
| Follow-up templates | Marketing | No separate active follow-up dispatcher found; any future dispatcher must use the guarded adapter at delivery/retry time |
| /api/subscribe | Newsletter enrollment, potentially provider automation | Fresh checks before subscriber upsert, form enrollment and source tag; suppressed signup returns generic success without re-enrollment |
| newsletter-google-contacts.yml / newsletter-contacts.ts | Newsletter audience synchronization | Central filtering, suppressed label removal, checks before contact creation/label addition |
| /api/newsletter-request | Consent/request storage | Original submissions retained; central opt-out always takes precedence later |
| public-form-email.ts | Internal form notifications | Explicit transactional exemption; existing recipient and reply-to behavior preserved |
| submission-automation.ts | Requested listing confirmation drafts | Transactional; existing implementation preserved. Adding promotional upsells would require marketing classification |
| Business Supabase auth/password reset | Account/security transactional | Unchanged; not subject to marketing suppression |

Newsletter storage is not a single table: public_form_submissions contains request
and unsubscribe records; Kit stores provider subscribers/tags; Google Contacts
stores the Newsletter audience label. Outreach also has local lead/campaign state.
None overrides public.email_suppressions or a historical unsubscribe.

## Service and database design

lib/email-suppression.ts normalizes bare email addresses with trim/lowercase,
rejects invalid/header-list values, checks batches of up to 200 and never caches
decisions. Missing configuration, network errors, non-success HTTP responses or
malformed RPC results block marketing operations. No recipient address or provider
response body is included in suppression errors. All adapters recheck at their
last application-controlled mutation boundary, including Kit retries.

The private service uses only EMAIL_SUPPRESSION_SUPABASE_URL and
EMAIL_SUPPRESSION_SERVICE_ROLE_KEY. It has no Business/NEXT_PUBLIC fallback.
Keep the key in server secret storage and GitHub Actions secrets, never browser
variables, source files, command arguments or logs. Configure the URL as a GitHub
Actions variable and the same server-only environment variable for the app.
Existing Gmail, Kit and Contacts credentials remain necessary for their workflows.

The prepared migration 202611200001_email_suppression.sql:
- Preserves all existing rows, reasons/timestamps and historical submissions.
- Backfills historical unsubscribe requests regardless of processing status and
  newsletter rows marked SUPPRESSED.
- Enables and forces RLS; removes pre-existing table policies; revokes public and
  authenticated access and backend direct writes/deletes. service_role can read.
- Provides service-only SECURITY DEFINER RPCs with an empty search_path.
- Inserts unsubscribe submission and suppression in one transaction via a trigger.
  The legacy public submission RPC also invokes that trigger.
- Uses an idempotent canonical-email upsert. A blank repeated reason does not erase
  the earlier reason. Every duplicate request remains an original submission.
- Matches pre-existing mixed-case/whitespace addresses without deleting or rewriting
  them. Existing normalized duplicates may remain physically distinct but are all
  blocked. There is no resubscription or suppression deletion API.
- Keeps checking historical opt-outs in addition to the central table.

Unsubscribe returns the same success shape regardless of previous subscriber
existence. Persistence failure returns an error; it never reports successful
suppression when the database write failed. Internal notification failure does not
undo a successfully committed unsubscribe.

## Verification

- Full application suite: 520 PASS, 0 FAIL, 0 SKIPPED.
- Includes 20 new suppression tests: blocked and newly unsubscribed recipients,
  normalization, duplicates, bulk filtering, failures, boundary/retry races,
  newsletter/outreach adapter integration, Kit audience/scheduling guards,
  Contacts removal and transactional exemptions.
- TypeScript validation passed.
- Lint passed with the existing ToolLogo.tsx no-img-element warning.
- Disposable localhost PostgreSQL 17.11: 21 SQL assertions passed, including RLS
  grants, preserving 24 synthetic pre-existing suppressions, historical backfill,
  duplicate requests, legacy-trigger enforcement, bulk matching and forced-error
  transaction rollback. This is NOT verification of the 24 production addresses.
- No live provider or deployed Supabase behavior was exercised.

Commands from this worktree:

    npm test
    npm run typecheck
    npm run lint
    python tests/email-suppression/run-local-database.py

The Windows local runner locates existing PostgreSQL 17.11 tools under LOCALAPPDATA,
clears inherited PG connection settings, binds only 127.0.0.1 on a fresh port and
creates a disposable database with synthetic example.invalid identities. It stops
its own server in finally; temporary database/log files remain for review.
The SQL fixture rolls back its data and has a localhost/database-name guard.
Never run database.sql against a remote or existing application database.

## Deployment prerequisites and sequence (not executed)

1. Review this change and identify the public-submissions Supabase project. Do not
   assume the Business project or repository CLI link is correct. Independently
   verify URL/key/project pairing and migration owner privileges.
2. Inspect actual table schema, grants, policies, triggers and existing custom RPCs.
   The user-reported 24-row count and production RLS state have not been verified.
   Backfill may legitimately increase the count. Capture a restricted backup.
3. Pause marketing delivery while reconciling all existing Gmail drafts, Kit
   broadcasts/sequences/automations and manual audiences. This code cannot cancel
   already queued messages or intercept manual provider sends.
4. Validate the migration on an isolated copy of the public-form schema. Apply only
   this reviewed migration to the correct project with separate authorization,
   before deploying application code. Do not bulk-push the repository migrations:
   they also contain unrelated Business migrations.
5. Configure the two private suppression variables for the app and all five
   affected Actions. Verify that the RPCs work with the backend key and deny anon
   and authenticated list access. tests/email-suppression/audit.sql is a read-only
   post-migration catalog audit; its generic database/user names do not themselves
   prove Supabase project identity.
6. Deploy reviewed application/workflow changes only with authorization. Missing
   configuration/RPCs deliberately stops marketing and makes unsubscribe fail
   visibly, so coordinate migration, secrets and rollout.
7. Test with synthetic recipients and controlled providers, including a late
   unsubscribe after audience selection. Do not test-send to suppressed addresses.
8. Resume only channels with verified send-time enforcement. Kit scheduling stays
   blocked until a delivery-time guard/provider-native permanent suppression is
   implemented and independently verified.

## Limits and unresolved risks

This change is ready for review, not a claim of complete production enforcement.
An application check cannot intercept Gmail manual sends, additions to draft BCC,
provider dashboard actions, previously scheduled Kit campaigns, or delayed
automation triggered by earlier enrollment. Google label sync alone is not a
send-time guarantee. Provider-native suppression and existing queue reconciliation
are required before asserting permanent suppression across those channels.

There is also a narrow distributed-system race between the final committed
Supabase read and a provider accepting a request. A later opt-out cannot retract
an already accepted email. Future delivery systems need an integrated suppression
contract; application checks alone cannot provide atomicity across two services.

Provider-side unsubscribe events not recorded in AIBeat require a verified inbound
webhook/reconciliation mechanism; none was invented or enabled here. External
automation configuration and custom database access paths could not be audited
offline. The trusted database owner can still modify data; protect those credentials.
The pre-existing public unsubscribe form is unauthenticated: anyone knowing an
address can opt it out. This existing privacy-preserving behavior is unchanged.

Existing Kit automatic scheduling is intentionally unavailable for safety. Draft
generation and transactional behavior remain available. Unrelated Business,
pricing, directory and user-account code was not modified.

Rollback must retain the suppression table, trigger and historical opt-outs.
Do not restore unguarded marketing code and resume sending. If reverting the app,
keep marketing paused; coordinate unsubscribe endpoint compatibility with the
private RPC. Do not drop suppressions or restore permissive table grants.

## Exact changed files

- .github/workflows/daily-lead-discovery.yml
- .github/workflows/newsletter-google-contacts.yml
- .github/workflows/product-hunt-outreach.yml
- .github/workflows/weekly-newsletter.yml
- .github/workflows/weekly-tools-gmail-draft.yml
- app/api/subscribe/route.ts
- app/api/unsubscribe/route.ts
- components/subscribe/UnsubscribeForm.tsx
- docs/email-suppression.md
- lib/daily-outreach-drafts.ts
- lib/email-suppression.ts
- lib/gmail-newsletter-draft.ts
- lib/kit/client.ts
- lib/newsletter-contacts.ts
- lib/outreach-workflow.ts
- lib/public-form-email.ts
- lib/public-form-submissions.ts
- lib/submission-automation.ts
- package.json
- scripts/create-gmail-outreach-drafts.ts
- scripts/sync-newsletter-contacts.ts
- supabase/migrations/202611200001_email_suppression.sql
- tests/betalist-outreach.test.ts
- tests/daily-outreach-drafts.test.ts
- tests/email-suppression.test.ts
- tests/email-suppression/audit.sql
- tests/email-suppression/database.sql
- tests/email-suppression/run-local-database.py
- tests/gmail-scheduled-drafts.test.ts
- tests/helpers/suppression.ts
- tests/latest-news-newsletter.test.ts
- tests/newsletter-attribution.test.ts
- tests/newsletter-contacts.test.ts
- tests/newsletter-unsubscribe.test.ts
- tests/public-form-email.test.ts
