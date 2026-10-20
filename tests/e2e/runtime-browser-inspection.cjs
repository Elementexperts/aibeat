// Reads OS process metadata only. Never logs raw command lines or environment values.
const cp=require('node:child_process'),path=require('node:path');
async function inspectBrowser(browser,environment) {
  const session=await browser.newBrowserCDPSession();
  try {
    const info=await session.send('SystemInfo.getProcessInfo');
    const command=await session.send('Browser.getBrowserCommandLine');
    const root=info.processInfo.find(p=>p.type==='browser');
    if(!root)throw Error('Chromium browser PID unavailable');
    const args=command.arguments;
    const rootFlags={denyProxy:args.some(a=>a.startsWith('--proxy-server=http://127.0.0.1:')),noLoopbackProxyBypass:args.includes('--proxy-bypass-list=<-loopback>'),resolverDeny:args.some(a=>a.startsWith('--host-resolver-rules=MAP * ~NOTFOUND')),backgroundDisabled:args.includes('--disable-background-networking'),quicDisabled:args.includes('--disable-quic')};
    const script=`$ErrorActionPreference='Stop'
$all=@(Get-CimInstance Win32_Process)
$ids=New-Object 'System.Collections.Generic.HashSet[int]'
[void]$ids.Add(${Number(root.id)})
do { $before=$ids.Count; foreach($p in $all){if($ids.Contains([int]$p.ParentProcessId)){[void]$ids.Add([int]$p.ProcessId)}} } while($ids.Count -gt $before)
$tree=@($all | Where-Object {$ids.Contains([int]$_.ProcessId)} | ForEach-Object {
  $c=[string]$_.CommandLine
  $kind=if($c -match '--type=([^ ]+)'){$Matches[1]}else{'browser-or-helper'}
  $utility=if($c -match '--utility-sub-type=([^ ]+)'){$Matches[1]}else{''}
  [pscustomobject]@{pid=[int]$_.ProcessId;ppid=[int]$_.ParentProcessId;name=$_.Name;kind=$kind;utility=$utility;commandLineReadable=[bool]$c;proxySwitchPresent=($c -match '--proxy-server=');resolverSwitchPresent=($c -match '--host-resolver-rules=');environmentIndependentlyRead=$false}
})
$connections=@(Get-NetTCPConnection -ErrorAction SilentlyContinue | Where-Object {$ids.Contains([int]$_.OwningProcess)} | ForEach-Object {[pscustomobject]@{pid=$_.OwningProcess;state=[string]$_.State;remoteIsLoopback=($_.RemoteAddress -in @('127.0.0.1','::1'));remoteIsUnspecified=($_.RemoteAddress -in @('0.0.0.0','::'));localIsLoopback=($_.LocalAddress -in @('127.0.0.1','::1'))}})
[pscustomobject]@{processes=$tree;connections=$connections;environmentVerification='BLOCKED: no supported independent descendant environment reader configured';networkEnforcement='BLOCKED: no OS/container egress boundary'} | ConvertTo-Json -Depth 6 -Compress`;
    const powershell=path.join(environment.SystemRoot||environment.WINDIR,'System32/WindowsPowerShell/v1.0/powershell.exe');
    const result=cp.spawnSync(powershell,['-NoLogo','-NoProfile','-NonInteractive','-Command',script],{env:environment,windowsHide:true,encoding:'utf8',timeout:20000,maxBuffer:1024*1024});
    const os=result.status===0?JSON.parse(result.stdout.replace(/^\uFEFF/,'')):{error:'OS process inspection failed',exitCode:result.status};
    return {rootPid:root.id,rootFlags,cdpProcesses:info.processInfo.map(p=>({pid:p.id,type:p.type})),os,descendantContainment:'BLOCKED'};
  }finally{await session.detach();}
}
module.exports={inspectBrowser};
