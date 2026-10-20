param([ValidateSet('sql','concurrency')][string]$Suite, [switch]$ApprovedFixtureExecution, [ValidateSet('removal','demotion','suspension','role_conflict','approval_conflict','approval_rollback','provisioning','onboarding')][string]$Scenario)
$ErrorActionPreference='Stop'
if(-not $ApprovedFixtureExecution -or -not $Suite) {throw 'Fixture execution requires explicit approval and a suite; use check-c01-connection.ps1 for read-only checks.'}
& (Join-Path $PSScriptRoot 'check-c01-connection.ps1')
if(-not $?) {throw 'Read-only identity preflight failed'}
. (Join-Path $PSScriptRoot 'use-c01-staging.ps1')
if($Suite -eq 'sql') {
  $c01Run=& (Join-Path $PSScriptRoot 'prepare-c01-test-run.ps1')
  & $c01Psql -X -w -v ON_ERROR_STOP=1 -f (Join-Path $c01Run 'business-isolation.sql') 2>&1 | Tee-Object (Join-Path $c01Run 'isolation.log')
} else {
  if(-not $Scenario) {throw 'Concurrency requires an explicitly approved scenario; legacy pooler isolationtester route disabled.'}
  $c01Run=Join-Path $env:LOCALAPPDATA ('AIBeat/C01/runs/'+[guid]::NewGuid().ToString())
  & python (Join-Path $PSScriptRoot 'concurrency/runner.py') --scenario $Scenario --execute-approved --output $c01Run
}
if($LASTEXITCODE -ne 0) {throw 'Fixture runner failed; inspect output; no automatic retry or cleanup.'}
Write-Output "Runner exited zero; inspect assertions and expected concurrency error/blocking before claiming a pass. Logs: $c01Run"
