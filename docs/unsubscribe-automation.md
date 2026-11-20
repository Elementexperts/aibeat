# AIBeat automated unsubscribe reconciliation

Prepared locally on codex/permanent-email-suppression in .work-email-suppression.
Depends on the previously prepared permanent suppression change. Neither migration
has been applied to production. No live Gmail operations, emails, commits, pushes
or deployments were performed.

## Existing architecture inspected

- /api/unsubscribe -> recordPublicFormSubmission -> EmailSuppressionService:
  original submission and suppression already share an atomic database transaction.
- public-form-email.ts sends existing internal transactional notifications; this
  worker neither invokes it nor changes that existing behavior.
- Gmail newsletters/outreach use OAuth refresh tokens and multipart/alternative MIME.
  The worker reuses the MIME builder but deliberately does not call the marketing
  draft adapter: an unsubscribe confirmation is not a marketing suppression bypass.
- Existing workflows use Node 22, tsx, Actions variables/secrets and node:test.
- Newsletter/lead campaigns, Contacts and provider limitations are documented in
  email-suppression.md. This reconciliation does not solve provider-side delayed
  delivery or manual send limitations.
- The local templates/submission-replies README was read. It explicitly says not
  to treat unsubscribes as submissions. Its renderer only supports tool-submission
  statuses, so this dedicated neutral confirmation uses the same 580px dark header,
  text branding and mobile table design without importing unrelated local files.

## State model and guarantees

The endpoint remains responsible for immediate suppression. The daily workflow is
not on that critical path. The suppression migration now retains the first nonblank
reason; every later reason is retained in its original submission.

202611200002_unsubscribe_automation.sql creates two private RLS-forced tables:
- unsubscribe_automation_jobs: one row per original submission ID, normalized email,
  label state, draft state/ID, processed timestamp, retry count, sanitized error code,
  and claim token.
- unsubscribe_automation_contacts: one row per normalized address, recipient-wide
  draft reservation/ID, lease, next retry time and attempt count.

Only service-role calls to the narrow claim/step RPCs are granted. The tables have
no anonymous, authenticated or service-role direct read/write grants. Inspect the
ledger through a separately authorized database administrator connection. No form
submission statuses are changed.

Claim discovers original unsubscribe submissions regardless of processing status.
A row lock plus 15-minute recipient lease prevents independent workers from owning
the same recipient. The Actions job has a shorter 10-minute timeout. Tokens fence
every checkpoint, label mutation and draft reservation. Gmail requests time out
after 15 seconds. The workflow processes at most 25 contacts per run.

Processing:
1. Validate the OAuth mailbox is exactly hello@aibeat.dev.
2. Claim a recipient and its outstanding submissions.
3. Verify an actual central suppression row exists (legacy fallback alone is not
   sufficient). Missing suppression blocks Gmail work unless repair is enabled.
4. Find the exact existing label AIBeat/Unsubscribed - Do Not Contact. A missing or
   ambiguous label is an error; the worker does not invent a new label.
5. Search exact From/To/Cc/Bcc correspondence excluding spam, trash and drafts.
   Inspect message headers and labels again; apply only the one label to individual
   relevant messages that do not already have it. No label removal/thread mutation.
   No correspondence results in a recorded skipped labeling step.
6. Recheck complaint history, reconcile an existing marked draft, or durably reserve
   a single new draft before calling Gmail.
7. Record outcomes without altering original form status semantics.

Gmail search can expand aliases. Exact participant checks prevent unrelated alias
or display-name matches from being labeled. Header syntax the small conservative
parser cannot confidently interpret is skipped rather than broadly labeled.
Pagination is bounded at 1,000 items; excess/malformed pages fail visibly.

## Draft safety and complaints

Drafts have a stable per-address SHA-256 Message-ID and marker, plain text plus HTML,
a dark AIBeat header, no images, tracking, links, promotion or automatic sending.
The optional question asks for one of the five requested reasons by reply; there
is no external survey service or telemetry.

Complaint matching examines all historical unsubscribe payloads immediately before
reservation. Spam, unsolicited/unwanted email, never subscribed/signed up/requested,
lack of consent/permission and stop-contact expressions skip drafts. Matching is
conservative English pattern matching, not a semantic/multilingual classifier;
review historical reasons and keep draft creation disabled where this is inadequate.

A new complaint after a draft was created marks the contact for manual review.
The worker does not alter/delete an existing draft or send it. Operators must
review retained drafts against newer complaints before sending anything.

The first draft POST is NEVER automatically retried. A timeout or lost ledger
checkpoint leaves a durable creating state. The next run searches Gmail by the
stable marker and verifies the recipient. It adopts a discoverable draft; if none
can be confidently found, it records review rather than creating another one.
This trades automatic recovery for duplicate prevention. A deleted or manually
sent draft is not recreated from a completed ledger.

Existing manually prepared confirmations with the exact confirmation subject and
recipient are flagged for review even without the marker (including sent/trash).
Differently worded historical confirmations cannot reliably be recognized;
reconcile them before initial enablement. Do not erase contact ledger
rows or reset creating/review states to pending to force a retry.

UNSUBSCRIBE_CREATE_DRAFTS=false is label-only processing; jobs are completed with
drafts skipped, not queued for later automatic creation. Enabling drafts later
does not retroactively generate skipped confirmations.

## Retries and failures

Gmail failures release the lease and defer eligibility one hour; the next daily
or manually dispatched run retries. Label additions are idempotent and inspected
again. No tight in-process provider retry loop is used.
Database failure stops the run; a failed failure-checkpoint leaves the lease to
expire. Pending submissions remain discoverable. Sanitized error enums contain
no provider bodies, credentials or email addresses. Console output contains counts
only. Failed/review counts make the workflow exit nonzero so attention is visible.
Privately inspect review cases; do not interpret a green subsequent no-op run as
resolution of historical review rows.

Missing suppression repair is separately gated by
UNSUBSCRIBE_REPAIR_SUPPRESSIONS=true. It reconstructs only a claimed unsubscribe
address from its original request, preserving reasons/timestamps where present.
No deletion, resubscription or marketing operation is available.

## Required configuration and OAuth

GitHub Actions variables:
- UNSUBSCRIBE_AUTOMATION_ENABLED=true only after reviewed deployment. Defaults off.
- UNSUBSCRIBE_CREATE_DRAFTS=true to opt into eligible unsent drafts. Defaults off.
- UNSUBSCRIBE_REPAIR_SUPPRESSIONS=true only after authorizing repair. Defaults off.
- EMAIL_SUPPRESSION_SUPABASE_URL: verified public-submissions project URL.

GitHub Actions secrets:
- EMAIL_SUPPRESSION_SERVICE_ROLE_KEY for that same project.
- GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.
- UNSUBSCRIBE_GMAIL_REFRESH_TOKEN: a dedicated hello@aibeat.dev token. No fallback to
  the existing marketing refresh token.

OAuth preparation (not performed):
1. Use an approved Google Cloud OAuth client with Gmail API enabled; keep consent
   internal to the Workspace where applicable and follow Workspace admin policy.
2. Sign in as hello@aibeat.dev and obtain an offline refresh token using a secure
   local OAuth flow or the approved existing setup procedure. Store it directly as
   a GitHub secret; never paste it into chat, source, CLI arguments or logs.
3. Request only https://www.googleapis.com/auth/gmail.modify. Do not request the
   separate gmail.send or full mail.google.com scope. Verify the mailbox profile
   before any mutation (the worker enforces this).
4. Do not enable Actions until the correct label and provider permissions have
   been checked with controlled test data under separate authorization.

Important limitation: Gmail does not offer a draft-and-message-label scope that
excludes sending. gmail.modify inherently permits sending, despite the absence
of gmail.send. The worker's allowlist permits profile/label/message/draft reads,
message label additions and draft creation only; send/delete/trash methods are
rejected by tests. A compromised token could still send outside this worker.
Use a dedicated token, restrict secret access, protect branches/workflow changes,
and revoke it if compromised. This is an API limitation, not scope-level prevention.

Official scope and method references:
- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/modify

## Workflow

.github/workflows/unsubscribe-reconciliation.yml
Name: AIBeat Unsubscribe Reconciliation
Schedule: 03:00 UTC daily plus workflow_dispatch.
contents: read; shared concurrency group; cancel-in-progress: false.
No artifacts containing recipient data are uploaded. No dotenv loading.
Offline safety tests run before secret-bearing worker execution.

## Validation

- Worker tests: 27 PASS (mock Gmail and Supabase; no real recipients).
- Full regression suite: 546 PASS, 0 FAIL, 0 SKIPPED. After that run, the final
  historical-confirmation safeguard was added and all 27 worker tests passed again.
- TypeScript passed. Lint passed with one existing ToolLogo.tsx image warning.
- git diff --check passed; the disposable PostgreSQL server was stopped.
- Local PostgreSQL 17.11: 43 PASS total (21 suppression + 22 automation).
  Real SQL validates RLS/grants, claims, competing lease rejection, reservations,
  duplicate submissions, complaint gate, status preservation and authorized repair.
  This is a disposable localhost DB, not the production Supabase database.
- Mock concurrent workers are tested; live Gmail eventual consistency and real
  multi-process remote database concurrency have not been exercised.
- The local SQL test first exposed an ambiguous alias; it was fixed and the entire
  disposable database run passed. No remote migration was attempted.

Commands from this worktree:

    node --import tsx --test tests/unsubscribe-automation.test.ts
    npm test
    npm run typecheck
    npm run lint
    python tests/email-suppression/run-local-database.py --automation

The local runner creates only synthetic example.invalid records, rolls back fixture
transactions and stops its server in finally. Retained temp logs/database files
contain synthetic data only. Do not run these fixtures against Supabase.

## Deployment checklist РІР‚вЂќ all still pending

1. Review both prepared migrations and application code; commit/push only when
   separately authorized. Preserve unrelated C01 and directory changes.
2. Independently identify the public-submissions project and matching backend key.
   Inspect actual schema, grants and existing custom dependencies; the reported
   production 24 suppressions have not been independently verified.
3. Validate in isolated staging with synthetic accounts under explicit approval.
   Apply 202611200001 followed by 202611200002, never a blanket CLI migration push.
4. Apply reviewed production migrations only with approval. Deploy the immediate
   suppression endpoint and private configuration before enabling reconciliation.
5. Audit existing confirmations/complaints and retained Gmail drafts; establish the
   exact label and dedicated OAuth token. Initially keep CREATE_DRAFTS and REPAIR
   false, then enable each only after its intended operation is approved.
6. Review a controlled manually dispatched run before relying on the daily schedule.
   Verify exact labels, private ledger rows and MIME drafts. Never send test messages
   to unsubscribed recipients.
7. Monitor failures, backlogs, skipped invalid-email historical rows and review
   states privately. Mail delivery/provider suppression limits from the parent
   report remain unresolved deployment prerequisites.

## Rollback

Disable UNSUBSCRIBE_AUTOMATION_ENABLED immediately. Revoke only its dedicated token
if needed. Keep both ledgers, suppression data and suppression triggers/RPCs intact.
Do not roll back immediate opt-out enforcement. Retain draft reservations even when
rolling back worker code, or future execution could duplicate drafts.
Labels and unsent drafts already created are retained for manual review; no broad
mail cleanup or automatic database deletion is part of rollback.

## Exact files added or modified for this increment

- .github/workflows/unsubscribe-reconciliation.yml (new)
- lib/unsubscribe-automation.ts (new)
- scripts/reconcile-unsubscribes.ts (new)
- supabase/migrations/202611200002_unsubscribe_automation.sql (new)
- tests/unsubscribe-automation.test.ts (new)
- tests/email-suppression/automation-database.sql (new)
- docs/unsubscribe-automation.md (new)
- lib/email-suppression.ts (allowlisted ledger RPC names)
- supabase/migrations/202611200001_email_suppression.sql (retain original reason)
- tests/email-suppression/run-local-database.py (optional --automation local suite)
- package.json (include worker tests)
