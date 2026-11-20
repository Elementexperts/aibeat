# Weekly tools suppression setup — 20 November 2026

Failed manual run: 44718645768. Slug selection succeeded; missing suppression
configuration blocked draft creation before Gmail operations.

## Approved setup and verification

The user explicitly approved public submission/suppression operations in shared
project wvvagaodquzjenmuxsdw (aibeat-business), the single suppression migration,
GitHub Actions configuration, and an unsent Batch 3 draft rerun.

Project identity matched the existing GitHub SUBMISSIONS_SUPABASE_URL and two
known submission IDs. The reviewed migration applied successfully:
`supabase/migrations/202611200001_email_suppression.sql`
SHA256: D3B93D45282F333AC8F030FF7C357981FE0673A3F3724C1AB0C5D3EB5007DF13

All 24 existing suppression rows remained unchanged. RLS is enabled and forced;
anonymous/authenticated list access is denied, anonymous RPC execution is denied,
and the service role can execute the backend lookup. Existing rows were backed
up locally using Windows user-bound DPAPI encryption before execution.

The migration was applied transactionally through the Supabase Management API.
No CLI migration-history record was added; reconcile this exact version before
any future migration push. The unsubscribe-automation migration was NOT applied.
Business tables, users, policies and workflows were not changed.

GitHub Actions now has EMAIL_SUPPRESSION_SUPABASE_URL and the encrypted secret
EMAIL_SUPPRESSION_SERVICE_ROLE_KEY. Its credential project/role was verified in
memory. Read-only checks verified an existing suppressed recipient is blocked,
a synthetic example.invalid recipient is allowed, anonymous lookup is denied,
and the internal reviewer is not suppressed. No credentials or addresses were
printed or committed.

## Diagnostic improvements

Typed sanitized errors distinguish missing configuration, invalid URLs, rejected
credentials, missing RPCs, unavailable services and malformed responses. The
Friday workflow performs a read-only preflight comparing suppression and public
submission project URLs before checking the backend RPC. Suppression continues
to fail closed; there is no bypass or allowlist override.

Validation: 41 targeted tests passed; TypeScript passed; lint passed with the
existing ToolLogo no-img-element warning. Migration contents are unchanged.

## Authorized workflow verification

Publish these diagnostics, then dispatch the unsent weekly draft with:
stylesvg,denoisa,sheru-bhai-ai,seedream-5-5,tinycommand,nano-banana-2-1,datacircle,text-to-video

Verify the dispatched run and retained Gmail draft. This operation does not send
mail. Unrelated working-tree changes remain untouched.
