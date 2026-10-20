// Environment separation for a future supervised Playwright runner; execution gates remain closed.
const path=require('node:path'),fs=require('node:fs');
const OS_KEYS=['SystemRoot','WINDIR','TEMP','TMP','COMSPEC','PATHEXT','HOMEDRIVE','HOMEPATH','LOGONSERVER','SYSTEMDRIVE','USERDOMAIN','USERNAME','USERPROFILE','PATH'];
function browserEnvironment(env){return Object.fromEntries(OS_KEYS.filter(k=>env[k]!==undefined).map(k=>[k,env[k]]));}
function browserOptions(policy,proxy=policy.browserProxy) {
  const url=new URL(proxy);if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||!url.port||url.username||url.password)throw Error('Controlled loopback proxy required');
  return {env:policy.browserEnv,proxy:{server:proxy},args:['--enable-automation','--proxy-bypass-list=<-loopback>','--disable-background-networking','--disable-component-update','--disable-domain-reliability','--disable-sync','--disable-quic','--dns-prefetch-disable','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']};
}
function runnerEnvironment(prepared,manifestFile) {
  if(!manifestFile||!path.isAbsolute(manifestFile))throw Error('External protected manifest path required');
  const relative=path.relative(prepared.destination,manifestFile);if(!relative||(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative)))throw Error('Runner manifest must remain outside app snapshot');
  const env={...prepared.env,C01_E2E_PROCESS_ROLE:'runner',C01_E2E_CONFIG_FILE:manifestFile};
  prepared.policy.runnerEnv=env;fs.writeFileSync(path.join(prepared.destination,'c01-runtime-policy.json'),JSON.stringify(prepared.policy));
  return env;
}
module.exports={browserEnvironment,browserOptions,runnerEnvironment};
