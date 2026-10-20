. (Join-Path $PSScriptRoot 'c01-staging-guard.ps1')
$base=@{Project='oejxwsvlvelxmfbysjbx';Host='aws-0-us-west-1.pooler.supabase.com';Port='5432';Database='postgres';User='postgres.oejxwsvlvelxmfbysjbx'}
$dummy='aws-0-us-west-1.pooler.supabase.com:5432:postgres:postgres.oejxwsvlvelxmfbysjbx:SYNTHETIC-NOT-A-PASSWORD'
$passed=0
function Reject([scriptblock]$Action) { $rejected=$false; try {& $Action} catch {$rejected=$true}; if(-not $rejected) {throw 'Guard accepted invalid input'} }
Assert-C01Configuration $base $dummy; $passed++
foreach($key in $base.Keys) { $bad=$base.Clone(); $bad[$key]='wrong'; Reject {Assert-C01Configuration $bad $dummy}; $passed++; $bad=$base.Clone(); $bad.Remove($key); Reject {Assert-C01Configuration $bad $dummy}; $passed++ }
Reject {Assert-C01Configuration $base ''}; $passed++
Reject {Assert-C01Configuration $base ($dummy+"`n"+$dummy)}; $passed++
Reject {Assert-C01Configuration $base '*:5432:postgres:postgres:dummy'}; $passed++
Reject {Assert-C01Configuration $base ($dummy.Replace('oejxwsvlvelxmfbysjbx','wvvagaodquzjenmuxsdw'))}; $passed++
Assert-C01DatabaseIdentity @{database='postgres';system_identifier='7692131729119822239'}; $passed++
foreach($bad in @($null,@{},@{database='postgres'},@{database='postgres';system_identifier='other'},@{database='other';system_identifier='7692131729119822239'})) {Reject {Assert-C01DatabaseIdentity $bad}; $passed++}
Write-Output "$passed local mocked guard checks passed; no database connection or fixtures."
