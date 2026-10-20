# C01 staging verification — 2026-10-14

Branch: codex/c01-business-authorization-hardening.

## Findings

- Verified account metadata: aibeat-business-staging, oejxwsvlvelxmfbysjbx, ACTIVE_HEALTHY, us-west-1, PostgreSQL 17.11.0.003.
- Supabase CLI 2.98.2 at C:/supabase/supabase.exe; account login works.
- WARNING: repository CLI link still targets production wvvagaodquzjenmuxsdw. It was not changed. No production database connection/query occurred. Account project metadata was used to identify staging and detect the unsafe default.
- Separate TEMP/aibeat-c01-staging-readonly-oejxwsvlvelxmfbysjbx workspace was linked explicitly to staging. Direct DNS/IPv6 lookup failed; the staging session pooler works: aws-0-us-west-1.pooler.supabase.com:5432, database postgres.
- Read-only SQL: auth.users=0, storage.objects=0, storage.buckets=0, public data relations=0. Only standard auth/storage/realtime/vault/platform schemas exist, with no application or migration-history schema. No production application data was observed. This is an aggregate inventory, not a forensic claim about platform metadata or historical backups.
- CLI reported temporary login-role initialization. Queries used BEGIN READ ONLY. No migrations, application DDL, fixtures or application data writes were executed.
- pgcrypto 1.3 installed; vector 0.8.2 available, not installed. Baseline migration installs vector.

## Readiness

Reviewed tests/rls/README.md, C01 and the baseline migration inventory. Nine baseline migrations precede C01. Reconstruct only from repository SQL, never a production dump. Seeds are integration definitions and workflow templates. Scheduler tables do not themselves activate scheduled launches. C01's BEGIN/COMMIT must remain intact. SQL semantics, constraints, grants and concurrency remain unvalidated; no push or dry-run push has run.

psql, Docker and isolationtester are unavailable on PATH. Install PostgreSQL 17 client/test tools in an appropriate environment. CLI account authentication works; psql and isolationtester additionally need a staging-only database password via a protected PGPASSFILE. Do not put secrets in chat, Git or command arguments. Staging API keys are unnecessary for SQL tests; later application checks require staging-only URL/key configuration. Never load repository .env.local.

Hosted database name is postgres; original fixtures require aibeat_c01_isolation. The preparation script preserves originals and creates hosted copies guarded by both database name and an explicit session project marker. This marker prevents accidents but is not identity proof: pin the host, project-specific postgres user and verified CLI project. Use session pooling, not transaction pooling.

## Exact next commands

Local preparation below has been run successfully; do not rerun into the existing directory. It only copies nine baseline migrations and renders two test files. C01 is deliberately excluded until baseline succeeds.

```powershell
# Already performed locally:
& ./tests/rls/prepare-c01-staging.ps1
```

The following commands have NOT run. Migration and fixture writes must wait for Nomoz's approval. Run from the repository in PowerShell, checking each result.

```powershell
$c01Stage = Join-Path $env:TEMP 'aibeat-c01-validation-oejxwsvlvelxmfbysjbx'
supabase --workdir $c01Stage link --project-ref oejxwsvlvelxmfbysjbx
if ($LASTEXITCODE -ne 0) { throw 'Link failed' }
if ((Get-Content (Join-Path $c01Stage 'supabase/.temp/project-ref') -Raw).Trim() -ne 'oejxwsvlvelxmfbysjbx') { throw 'Wrong target' }

# AFTER approval: inspect exactly nine baseline migrations, then apply.
supabase --workdir $c01Stage db push --linked --dry-run
# Review output before continuing.
supabase --workdir $c01Stage db push --linked
if ($LASTEXITCODE -ne 0) { throw 'Baseline failed; stop' }

Copy-Item ./supabase/migrations/202610140001_business_authorization_hardening.sql (Join-Path $c01Stage 'supabase/migrations')
supabase --workdir $c01Stage db push --linked --dry-run
# Review output: only C01 should be pending.
supabase --workdir $c01Stage db push --linked
if ($LASTEXITCODE -ne 0) { throw 'C01 failed; stop' }

# AFTER installation of clients and protected staging credentials:
# Use an isolated process, with no inherited service/password routing.
Remove-Item Env:PGSERVICE,Env:PGSERVICEFILE,Env:PGPASSWORD -ErrorAction SilentlyContinue
$env:PGHOST = 'aws-0-us-west-1.pooler.supabase.com'
$env:PGPORT = '5432'
$env:PGDATABASE = 'postgres'
$env:PGUSER = 'postgres.oejxwsvlvelxmfbysjbx'
$env:PGSSLMODE = 'require'
$env:PGOPTIONS = '-c c01.staging_project=oejxwsvlvelxmfbysjbx'
# Configure PGPASSFILE with ONLY the staging credential before proceeding.
if (-not $env:PGPASSFILE) { throw 'Protected staging PGPASSFILE required' }
psql -X --set=ON_ERROR_STOP=1 --file (Join-Path $c01Stage 'tests/business-isolation.sql')
if ($LASTEXITCODE -ne 0) { throw 'SQL assertions failed' }
Get-Content (Join-Path $c01Stage 'tests/business-ownership.spec') -Raw | isolationtester 'dbname=postgres'
```

Inspect concurrency output, not just exit status: B must wait for A's commit, then fail LAST_ACTIVE_OWNER; the final assertion must find exactly one owner. No captured expected-output CI gate exists yet. Ordinary SQL fixtures roll back; concurrency fixtures persist until staging disposal. Do not disable audit triggers for cleanup.

Only two repository files were added in this preparation: this report and tests/rls/prepare-c01-staging.ps1. Existing migrations and test originals were unchanged. Staging migration approval remains required by the user's explicit instruction. No production operation or C02 work is authorized.
