# C01 staging baseline execution result

Target: aibeat-business-staging / oejxwsvlvelxmfbysjbx only.
Branch: codex/c01-business-authorization-hardening.

## Result

All nine unchanged baseline migrations applied in original filename order. CLI exit code 0; all nine versions confirmed in staging migration history. See c01-baseline-manifest.json for exact filenames, SHA-256 checksums and individual results; c01-baseline-execution.log preserves execution notices. C01 was excluded from the staging migration directory and was NOT applied.

Before execution, staging project-ref and project-specific pooler user were checked. Host was aws-0-us-west-1.pooler.supabase.com:5432, database postgres, user postgres.oejxwsvlvelxmfbysjbx. CLI-managed authentication initialized a staging login role; no repository environment credentials were loaded. The separate TEMP/aibeat-c01-validation-oejxwsvlvelxmfbysjbx workspace was used throughout. Repository production link was neither used nor changed. Preflight found zero public application tables, auth users, storage buckets/objects and no migration history.

## Inventory and verification

28 public tables, all with RLS enabled. 53 public policies and two Business storage policies. Five workflow templates and three integration catalog rows seeded. Private business-documents bucket exists. Auth users, organizations, storage objects, public submissions and schedule-trigger rows remain zero.

Verified baseline functions: create_business_organization, is_org_member, has_org_role, organization_has_no_members, record_public_form_submission, set_updated_at. C01 decide_business_approval(uuid,uuid,text,text) is absent, and C01 version is absent from history.

Full table/function inventory: c01-baseline-inventory.json. Policy definitions, 560 table-grant entries for anon/authenticated/service_role, key function grants and storage settings: c01-baseline-authorization.json.

Observed policies match the legacy baseline: first-owner insert checks an empty membership list but not organization creator; owner membership mutation is broad; admin audit mutation and manager direct approval update remain allowed. These are known C01 targets, not proof that hardening is installed. Baseline helper functions retain PUBLIC execute and create_business_organization has an explicit anon execute grant from platform defaults; C01 explicitly revokes these sensitive grants. No permission repair was performed during baseline reconstruction.

## Errors and compatibility

No migration errors or file modifications. Expected notices: already-installed pgcrypto; DROP IF EXISTS policies/triggers absent on a fresh database; ivfflat index created with little data. The empty vector index notice concerns recall/performance and did not prevent migration completion. No data was imported from production. No user workflow, email, schedule or external integration was executed.

Catalog inspection establishes baseline reconstruction, not end-to-end application compatibility or adversarial RLS correctness. Those remain validation work. Existing SQL/runtime semantics in C01 have not been tested against this database.

## Remaining steps, approval required

1. Obtain explicit approval to apply ONLY 202610140001_business_authorization_hardening.sql to this staging project. The current approval covered baseline only.
2. Reconfirm target and nine-entry history, recheck C01 source checksum, copy C01 into the separate workspace, review a dry run showing only C01, then apply it once. Stop on the first error; report without silently editing or repairing.
3. Reinspect hardened policies, grants, functions, triggers and constraints.
4. With separate approval for synthetic fixture writes, run the prepared SQL isolation suite and actual two-session ownership spec. psql/isolationtester and staging-only direct credentials remain prerequisites; do not substitute mocked tests for concurrency verification.
5. Capture results and verify staging Business onboarding/auth/role/storage/approval behavior without sending mail, charging payments or external workflow execution. Report remaining compatibility issues before any further scope.

Staging baseline is ready for a separately approved C01 application attempt. C01 security validation and production readiness are not established. No production access, deployment, destructive reset, C02 work, commit or push occurred.
