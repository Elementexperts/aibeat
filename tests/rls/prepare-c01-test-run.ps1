# Render fresh, synthetic per-run copies; no database connection or migration action.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'c01-staging-guard.ps1')
$c01Run=Join-Path $env:LOCALAPPDATA ('AIBeat/C01/runs/'+[guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $c01Run -Force | Out-Null
foreach($name in @('business-isolation.sql','business-ownership.spec')) {
  $text=[IO.File]::ReadAllText((Join-Path $PSScriptRoot $name))
  $pattern="current_database\(\)\s*<>\s*'aibeat_c01_isolation'"
  if([regex]::Matches($text,$pattern).Count -ne 1) {throw 'Expected one environment guard'}
  $text=[regex]::Replace($text,$pattern,"(current_database()<>'postgres' OR (SELECT system_identifier::text FROM pg_catalog.pg_control_system()) IS DISTINCT FROM '7692131729119822239')")
  if($name -eq 'business-ownership.spec') {
    # Verify each actual actor connection before SET ROLE or mutation, not just control.
    $guard=Get-C01IdentityGuard
    $text=$text.Replace("session a", "session a
setup { $guard }").Replace("session b", "session b
setup { $guard }")
    $map=@{}
    foreach($m in [regex]::Matches($text,'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')) {
      if(-not $map.ContainsKey($m.Value)) { $map[$m.Value]=[guid]::NewGuid().ToString() }
    }
    foreach($old in $map.Keys) {$text=$text.Replace($old,$map[$old])}
    $tag=Split-Path $c01Run -Leaf
    $text=$text.Replace('race1@example.invalid',"race1-$tag@example.invalid").Replace('race2@example.invalid',"race2-$tag@example.invalid")
    $map | ConvertTo-Json | Set-Content (Join-Path $c01Run 'concurrency-id-map.json')
  } else {
    # Restrict this assertion to this rollback-only tenant, excluding prior race audits.
    $text=$text.Replace("where event_type='APPROVAL_APPROVED'","where organization_id='20000000-0000-0000-0000-000000000001' and event_type='APPROVAL_APPROVED'")
  }
  [IO.File]::WriteAllText((Join-Path $c01Run $name),$text)
}
Write-Output $c01Run
