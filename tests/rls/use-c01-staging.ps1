# Dot-source in a dedicated PowerShell session. No connection is opened.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'c01-staging-guard.ps1')
$c01Stage=Join-Path $env:TEMP 'aibeat-c01-validation-oejxwsvlvelxmfbysjbx'
if ((Get-Content (Join-Path $c01Stage 'supabase/.temp/project-ref') -Raw).Trim() -ne 'oejxwsvlvelxmfbysjbx') { throw 'Staging link mismatch' }
$c01Pooler=[uri](Get-Content (Join-Path $c01Stage 'supabase/.temp/pooler-url') -Raw).Trim()
if ($c01Pooler.Host -ne 'aws-0-us-west-1.pooler.supabase.com' -or $c01Pooler.Port -ne 5432 -or $c01Pooler.AbsolutePath -ne '/postgres' -or $c01Pooler.UserInfo.Split(':')[0] -ne 'postgres.oejxwsvlvelxmfbysjbx') { throw 'Staging pooler mismatch' }
# Reject known production routing before discarding inherited libpq settings.
if (Get-ChildItem Env: | Where-Object { $_.Name -like 'PG*' -and $_.Value -match 'wvvagaodquzjenmuxsdw' }) { throw 'C01_PRODUCTION_ROUTING_DETECTED' }
# Clear all inherited libpq routing/secrets, including PGHOSTADDR and PGSERVICE.
Get-ChildItem Env: | Where-Object Name -Like 'PG*' | ForEach-Object { Remove-Item -LiteralPath ('Env:'+ $_.Name) }
$env:PGHOST='aws-0-us-west-1.pooler.supabase.com'
$env:PGPORT='5432'
$env:PGDATABASE='postgres'
$env:PGUSER='postgres.oejxwsvlvelxmfbysjbx'
$env:PGSSLMODE='require'
$env:PGCONNECT_TIMEOUT='15'
# Session Pooler discards startup options; identity is checked using pg_control_system().
$env:PGOPTIONS=''
$env:PGPASSFILE=Join-Path $env:LOCALAPPDATA 'AIBeat/C01/credentials/staging.pgpass'
$c01PgRoot=Join-Path $env:LOCALAPPDATA 'AIBeat/C01/tools/postgresql-17.11/pgsql'
$c01Psql=Join-Path $c01PgRoot 'bin/psql.exe'
$c01Isolation=Join-Path $c01PgRoot 'lib/pgxs/src/test/isolation/isolationtester.exe'
$env:PATH=(Join-Path $c01PgRoot 'bin')+';'+$env:PATH
if (-not (Test-Path $env:PGPASSFILE)) { throw 'Staging password file is missing; run configure-c01-credential.ps1 interactively.' }
Assert-C01Configuration @{Project='oejxwsvlvelxmfbysjbx';Host=$env:PGHOST;Port=$env:PGPORT;Database=$env:PGDATABASE;User=$env:PGUSER} ([IO.File]::ReadAllText($env:PGPASSFILE))
Write-Output 'Staging-only libpq configuration validated; database identity still requires read-only verification.'
