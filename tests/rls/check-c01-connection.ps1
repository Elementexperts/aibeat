# Read-only check; never runs a fixture.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'use-c01-staging.ps1')
$sql="BEGIN READ ONLY; SELECT json_build_object('database',current_database(),'system_identifier',system_identifier::text) FROM pg_catalog.pg_control_system(); COMMIT;"
$result = & $c01Psql -X -w -qAt -v ON_ERROR_STOP=1 -c $sql
if($LASTEXITCODE -ne 0) {throw 'C01_CONNECTION_FAILED'}
try {$identity=$result | ConvertFrom-Json} catch {throw 'C01_IDENTITY_RESPONSE_INVALID'}
Assert-C01DatabaseIdentity $identity
# Verify same SQL guard used by fixtures, read-only; no object changes.
$guard=Get-C01IdentityGuard
& $c01Psql -X -w -v ON_ERROR_STOP=1 -c "BEGIN READ ONLY; $guard COMMIT;"
if($LASTEXITCODE -ne 0) {throw 'C01_IN_CONNECTION_GUARD_FAILED'}
Write-Output 'Verified staging cluster identity through psql; read-only guard passed.'
