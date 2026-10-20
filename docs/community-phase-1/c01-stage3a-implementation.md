# C01 Stage 3A application compatibility implementation

Date: 2026-10-17. Branch: codex/c01-business-authorization-hardening.
Scope: application-only changes and offline validation. No database connection, fixture, migration, policy change, deployment, email, payment, production access, C02, commit or push.

## Implemented

- Approval decisions use the existing C01 RPC, then independently reload authoritative approvals, runs (including steps), and audit records. The authenticated UI does not infer workflow completion from an approval decision. A failed continuation remains FAILED; WAITING_FOR_APPROVAL and COMPLETED are preserved. RPC denial and post-commit refresh failure are visibly distinguished. Controls respect saved snapshot approver roles and prevent duplicate in-flight decisions.
- Onboarding distinguishes missing membership from lookup failure. Creator-owners with an incomplete onboarding marker can return to onboarding; other members cannot provision into a tenant they do not own. Existing selected tenant context is preserved. Ambiguous legacy multi-owner recovery is rejected rather than silently targeting another organization.
- Routing uses explicit environment identity. Production apex and the configured production VERCEL_URL redirect to www.aibeat.dev; staging never redirects there. Unconfigured or conflicting environment/host combinations return 421. Nonproduction Business server clients and middleware require the exact staging Supabase URL.
- Active membership selection is deterministic. A stale cookie falls back only to an organization the user actively belongs to; explicit unauthorized selections fail. A workspace selector validates through the server before changing its HttpOnly cookie. Refreshed chunked authentication cookies are copied to redirects and errors, and refreshed request cookies are forwarded downstream.
- UI membership controls are owner-only. Workflow execution/upload/integration/evaluation controls are owner/admin-only. Approval decisions remain owner/admin/manager, narrowed by saved workflow policy. Server actions and database authorization remain in force. Custom permission strings cannot override privileged role restrictions.
- Every workflow step/run update is checked, including zero-row results. A valid waiting run and step are saved before exposing a pending approval. After publishing the request, the application only reloads the run/approval rather than overwriting a concurrently committed decision. Incomplete saved runs are not treated as successful idempotent retries.
- New document chunk IDs include their document UUID, eliminating same-content collisions between new documents and tenants. Existing IDs/references are untouched. Unsupported extraction is rejected before upload; storage objects use UUID paths with overwrite disabled. Ingestion starts UPLOADED, becomes INDEXED only after all stages succeed, and attempts a scoped FAILED marker on failure. Partial records are retained, and failed/unindexed document chunks are excluded from AI retrieval.
- Audit display derives FAILED/BLOCKED/SUCCESS from recorded event semantics without mutating audit records.
- Integration, evaluation, membership, workflow and approval errors are surfaced in the UI. Stable modal close handling preserves edited content through decision errors.

## Exact files changed in this implementation

Application:
- app/business/actions.ts
- app/business/auth/callback/route.ts
- app/business/onboarding/actions.ts
- app/business/sign-in/actions.ts
- components/business/ApprovalModal.tsx
- components/business/BusinessWorkspace.tsx
- lib/business/auth.ts
- lib/business/document-ingestion.ts
- lib/business/security.ts
- lib/business/server-auth.ts
- lib/business/supabase-store.ts
- lib/business/types.ts
- lib/business/workspace-server.ts
- lib/business/workspace.ts
- lib/supabase/server.ts
- middleware.ts

New application helpers:
- lib/business/compatibility.ts
- lib/business/session-state.ts
- lib/business/response-cookies.ts

Tests/configuration:
- tests/c01-compatibility.test.ts (new)
- tests/aibeat-business.test.ts (audit mock now includes the database event_type field)
- package.json (register new compatibility suite in npm test)

Documentation:
- docs/community-phase-1/c01-stage3a-implementation.md (this report)

Several files already contained C01 edits before this implementation. They were preserved; git diff against HEAD includes earlier C01 work too. The existing migration and prior staging evidence were not edited.

## Routing configuration required before E2E

No environment files or credentials were read, pulled or changed.

Local testing:
- Use localhost with AIBEAT_APP_ENV=development (or no deployment mode).
- Use NEXT_PUBLIC_SUPABASE_URL=https://oejxwsvlvelxmfbysjbx.supabase.co and its staging publishable key.
- Use AIBEAT_BUSINESS_AI_MODE=mock.
- If AIBEAT_APP_ENV=staging is used locally, explicitly list localhost:PORT in AIBEAT_STAGING_HOSTS.

Preview:
- VERCEL_ENV=preview or AIBEAT_APP_ENV=staging.
- AIBEAT_STAGING_HOSTS must contain exact allowed host[:port] values, comma separated. Wildcards are not supported.
- The same exact staging database URL is required.
- Contradictory production/nonproduction environment indicators fail closed.

Eventual production:
- Explicit VERCEL_ENV=production or AIBEAT_APP_ENV=production is required.
- www.aibeat.dev is allowed; aibeat.dev and the configured production VERCEL_URL are canonicalized.
- Other aliases must be reviewed before release. No production runtime configuration was inspected.

## Validation

Offline suites: Business, C01 compatibility, submitted directory tools, submission automation, paid listing/Stripe mocked processing, newsletter requests, public-form email validation and Gmail draft construction.
Compatibility tests cover role boundaries, saved approval policy, authoritative failed/waiting/completed state, post-commit refresh failure, routing/environment rejection, cookie preservation, stale versus explicit tenant selection, lookup failure, creator onboarding eligibility, duplicate uploads, failed ingestion exclusion, checked writes, incomplete retries, and approval publish ordering.
The new suite is included in npm test.

Initial failures: Windows default cp1251 text decoding altered punctuation in edited UTF-8 files, causing three source-regression failures; one old audit mock omitted event_type. Encoding was repaired using explicit UTF-8, and the mock was corrected to match the actual database shape. Assertions were not weakened.
Latest selected suite result before final UI error-handling review: 161 PASS / 0 FAIL / 0 SKIPPED. Final rerun/typecheck results are appended below.

No browser/dev server was started. Unit mocks do not establish PostgREST response compatibility, browser cookie behavior or staging E2E success.
C01 migration SHA256 remains 731B5054DC65D4E7C8B92ED156A29F1FCEEC938824D326A6B8F9EE81AA04309C.

## Database-dependent gaps: separate approval required

| Finding | Current limitation | Proposed design / database change | Security implication | Priority |
|---|---|---|---|---|
| Invitation acceptance | Invite RPC saves an unbound INVITED row; activation/user rebinding is forbidden | New verified-email acceptance RPC: derive identity from auth.uid and verified auth email, lock tenant, consume one invitation idempotently, insert legitimate active membership and retire invitation with audit in one transaction; reconcile current immutable-identity trigger without broad client mutation rights | Must prevent arbitrary user binding, invitation reuse, role escalation and races | P1 if invited-user onboarding is required |
| Atomic request-and-pause | Application saves step, run, request and audit using separate requests | New owner/admin RPC validates same-tenant run/step, immutable workflow version/action/risk and current state, saves pause plus request/snapshot/audit transactionally | Interrupted publication can still retain a waiting run with no request; do not auto-delete, reauthorize or fabricate success | P1 |
| Multiple approval boundaries | Existing decision RPC ends a continuation that reaches another approval-required step as FAILED | Separately versioned continuation RPC/state machine creates the next request and pause atomically under a validated snapshot | Each external action needs its own approval; prior approval must not authorize later actions | P2 unless required workflows depend on it |
| Legacy snapshots | Existing snapshotless requests cannot be approved/edited | Existing reject-and-rerun path requires no new schema; any automated migration/recovery requires a separately reviewed audited operation | Never invent historical approval definitions or overwrite immutable evidence | P1 release readiness; manual recovery can use existing RPC |

## Remaining application limitations and Stage 3B readiness

Ready for review and staging E2E preparation, not a claim of full compatibility or deployment readiness.
- No automatic repair of partially persisted workflow requests. The application reports failure and refuses unsafe idempotent success; transactional repair requires the approved database design.
- Upload/storage, document, chunks, context and audits are not one transaction. Failure markers and retrieval filters reduce false success, but retained objects/context/audits may require scoped operator review. No broad deletion or immutable audit cleanup was added.
- Approval refresh uses multiple read requests, not one snapshot. A read failure reports a possibly committed decision and requires reload.
- Invitation acceptance, removal/suspension UI and multiple approval boundaries are not implemented here.
- Production aliases, environment settings, current grants, pending legacy requests and data assumptions remain unverified.
- Actual browser role controls, cookies, redirects, uploads and post-approval refresh still require staging E2E.
- New fixture accounts and organization membership setup for Stage 3B need explicit approval. No existing retained test evidence should be deleted or recycled silently.

Recommended next authorization: review these application changes, then authorize a staging-only Stage 3B preflight and controlled E2E run with fresh synthetic accounts, mock AI, captured/disabled email and payment effects, exact staging URL/host checks, and stop-on-failure rules. Mark database-dependent flows BLOCKED/SKIPPED unless separately implemented and approved.

Production release remains coordinated: quiesce Business writes, approved database/application rollout together, verify, then reopen. Old application versions cannot simply be rolled back against C01 revoked grants. Prefer a compatible forward fix or maintenance mode; restoring unsafe grants or bypassing audit/owner protections requires separate approval.

## Final validation — 2026-10-17

- Selected offline regression suite: 161 PASS / 0 FAIL / 0 SKIPPED (8 test files).
- TypeScript: node node_modules/typescript/bin/tsc --noEmit --incremental false — exit 0, no diagnostics.
- git diff --check — exit 0, no whitespace errors.
- C01 migration checksum reverified unchanged.
- React checklist review: server authorization retained; role-disabled controls; visible alerts; stable modal close callback; duplicate approval submission guard; independent authoritative reads parallelized. Browser interaction remains for Stage 3B.
- Tool access resumed after the earlier approval-service usage-limit interruption. No blocked operation was bypassed.
- Stopped after local implementation and verification. No staging E2E, production access, migrations, deployment, email, payment, commit or push.
