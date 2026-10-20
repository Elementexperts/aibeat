# Nonsecret identity anchor established through staging-linked CLI authentication.
function Assert-C01Configuration {
  param($Config, [string]$CredentialText)
  $expected=@{Project='oejxwsvlvelxmfbysjbx';Host='aws-0-us-west-1.pooler.supabase.com';Port='5432';Database='postgres';User='postgres.oejxwsvlvelxmfbysjbx'}
  foreach($key in $expected.Keys) {if ([string]$Config[$key] -cne $expected[$key]) {throw "C01_CONFIGURATION_REJECTED: $key"}}
  $lines=@($CredentialText -split "`r?`n" | Where-Object {$_ -and -not $_.StartsWith('#')})
  if($lines.Count -ne 1 -or $lines[0] -cnotmatch '^aws-0-us-west-1\.pooler\.supabase\.com:5432:postgres:postgres\.oejxwsvlvelxmfbysjbx:.+$') {throw 'C01_CREDENTIAL_SCOPE_REJECTED'}
}
function Assert-C01DatabaseIdentity {
  param($Identity)
  if($null -eq $Identity -or $Identity.database -cne 'postgres' -or [string]$Identity.system_identifier -cne '7692131729119822239') {throw 'C01_DATABASE_IDENTITY_REJECTED'}
}
function Get-C01IdentityGuard {
  return "DO `$`$ BEGIN IF current_database()<>'postgres' OR (SELECT system_identifier::text FROM pg_catalog.pg_control_system()) IS DISTINCT FROM '7692131729119822239' THEN RAISE EXCEPTION 'C01_STAGING_IDENTITY_REQUIRED'; END IF; END `$`$;"
}
