# Local-only setup: prompts securely; makes no network/database connection.
$ErrorActionPreference = 'Stop'
$c01Secrets = Join-Path $env:LOCALAPPDATA 'AIBeat/C01/credentials'
New-Item -ItemType Directory -Force -Path $c01Secrets | Out-Null
$c01Sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
$c01Acl = New-Object Security.AccessControl.DirectorySecurity
$c01Acl.SetOwner($c01Sid)
$c01Acl.SetAccessRuleProtection($true,$false)
$c01Rule = New-Object Security.AccessControl.FileSystemAccessRule($c01Sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
$c01Acl.AddAccessRule($c01Rule)
Set-Acl -LiteralPath $c01Secrets -AclObject $c01Acl
$c01PassFile = Join-Path $c01Secrets 'staging.pgpass'
if (Test-Path $c01PassFile) { throw 'Credential file already exists; review before replacing it.' }
$c01Secret = Read-Host 'Database password for staging oejxwsvlvelxmfbysjbx ONLY' -AsSecureString
$c01Ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($c01Secret)
try {
  $c01Plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($c01Ptr)
  if ([string]::IsNullOrWhiteSpace($c01Plain) -or $c01Plain.Contains("`n") -or $c01Plain.Contains("`r")) { throw 'Invalid password input' }
  $c01Escaped = $c01Plain.Replace('\','\\').Replace(':','\:')
  [IO.File]::WriteAllText($c01PassFile,"aws-0-us-west-1.pooler.supabase.com:5432:postgres:postgres.oejxwsvlvelxmfbysjbx:$c01Escaped`n",(New-Object Text.UTF8Encoding($false)))
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($c01Ptr)
  $c01Plain=$null; $c01Escaped=$null; $c01Secret.Dispose()
}
Write-Output 'Staging password file saved in restricted local directory; no credential printed.'
