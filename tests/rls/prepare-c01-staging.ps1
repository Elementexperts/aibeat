# Local preparation only. No database or CLI commands.
$ErrorActionPreference = 'Stop'
$c01Repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$c01Stage = Join-Path $env:TEMP 'aibeat-c01-validation-oejxwsvlvelxmfbysjbx'
if (Test-Path $c01Stage) { throw 'Preparation directory exists; inspect it before reuse.' }
$c01Dest = Join-Path $c01Stage 'supabase/migrations'
New-Item -ItemType Directory -Force -Path $c01Dest,(Join-Path $c01Stage 'tests') | Out-Null
$c01Baseline = Get-ChildItem (Join-Path $c01Repo 'supabase/migrations') -Filter '*.sql' | Where-Object { $_.Name -lt '202610140001_business_authorization_hardening.sql' } | Sort-Object Name
if ($c01Baseline.Count -ne 9) { throw 'Unexpected baseline migration count' }
$c01Baseline | Copy-Item -Destination $c01Dest
foreach ($c01Name in @('business-isolation.sql','business-ownership.spec')) {
  $c01Text = [IO.File]::ReadAllText((Join-Path $PSScriptRoot $c01Name))
  $c01Pattern = "current_database\(\)\s*<>\s*'aibeat_c01_isolation'"
  if ([regex]::Matches($c01Text,$c01Pattern).Count -ne 1) { throw 'Expected one safety guard' }
  $c01Guard = "(current_database()<>'postgres' OR current_setting('c01.staging_project',true) IS DISTINCT FROM 'oejxwsvlvelxmfbysjbx')"
  $c01Text = [regex]::Replace($c01Text,$c01Pattern,$c01Guard)
  [IO.File]::WriteAllText((Join-Path $c01Stage "tests/$c01Name"),$c01Text)
}
Write-Output "Prepared $c01Stage. No database action performed."
