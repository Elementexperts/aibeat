// Local-only preloader. Never loaded by the repository-root application.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const cp=require('node:child_process'),threads=require('node:worker_threads');
const {classify,mock}=require('./guard.cjs');
const root=path.resolve(__dirname,'../..');
const policy=JSON.parse(fs.readFileSync(path.join(root,'c01-runtime-policy.json'),'utf8'));
const runner=process.env.C01_E2E_PROCESS_ROLE==='runner'&&!!policy.runnerEnv;
const baseline=runner?policy.runnerEnv:policy.env;
const expectedContext=new (require('node:async_hooks').AsyncLocalStorage)();
const expected=fn=>{if(!policy.localProbes)throw Error('Intentional probes are not authorized in this runtime');return expectedContext.run(true,fn);};
const monitor=require('./run-monitor.cjs');
function record(kind,detail={}) { fs.appendFileSync(policy.ledger,JSON.stringify({time:new Date().toISOString(),pid:process.pid,threadId:threads.threadId,kind,...detail})+'\n'); }
function deny(transport) { const intentional=expectedContext.getStore()===true;record('blocked',{transport,expected:intentional});if(!intentional)monitor.fatal(policy,{kind:'outbound',transport,source:'node'});throw Error('C01_LOCAL_BLOCKED'); }
function verifyEnv(env) {
  const allowed=new Set([...Object.keys(baseline),...(runner?['TEST_WORKER_INDEX','TEST_PARALLEL_INDEX']:[]),'NEXT_PRIVATE_WORKER','JEST_WORKER_ID','NEXT_RUNTIME','NEXT_DEPLOYMENT_ID','__NEXT_PRIVATE_ORIGIN','__NEXT_PRIVATE_STANDALONE_CONFIG','__NEXT_OPTIMIZE_FONTS','__NEXT_PRIVATE_PREBUNDLED_REACT','__NEXT_PRIVATE_RENDER_WORKER','FORCE_COLOR','NODE_CHANNEL_FD','NODE_CHANNEL_SERIALIZATION_MODE','PORT','RUST_MIN_STACK','__NEXT_PRIVATE_RUNTIME_TYPE','__NEXT_PROCESSED_ENV']);
  const extras=Object.keys(env).filter(k=>env[k]!==undefined&&!allowed.has(k));
  if(extras.length) {record('environment-rejected',{names:extras,expected:expectedContext.getStore()===true});if(expectedContext.getStore()!==true)monitor.fatal(policy,{kind:'environment',transport:'names'});throw Error('C01 environment names rejected');}
  for(const [k,v] of Object.entries(baseline)) if(env[k]!==v) {record('environment-rejected',{names:[k]});if(expectedContext.getStore()!==true)monitor.fatal(policy,{kind:'environment',transport:'value'});throw Error('C01 environment value rejected');}
  if(env.C01_E2E_STAGING_ENABLED!=='0'||process.cwd()!==root)monitor.fatal(policy,{kind:'environment',transport:'isolation'});monitor.assertHealthy(policy);
}
verifyEnv(process.env);
record('process-start',{ppid:process.ppid,cwdIsSnapshot:true,envNames:Object.keys(process.env).sort(),stagingDisabled:true,entry:path.basename(process.argv[1]||'worker')});
const originalConnect=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args) {
  const a=Array.isArray(args[0])?args[0]:args;
  const o=typeof a[0]==='object'?a[0]:{port:a[0],host:a[1]};
  if(o&&String(o.port)==='3101'&&['127.0.0.1','::1'].includes(o.host))return originalConnect.apply(this,args);
  return deny('socket');
};
const originalListen=net.Server.prototype.listen;
net.Server.prototype.listen=function(...args) {
  const o=typeof args[0]==='object'?args[0]:{port:args[0],host:args[1]};
  if(o&&String(o.port)==='3101'&&o.host==='127.0.0.1')return originalListen.apply(this,args);
  return deny('listen');
};
for(const name of ['http','https']) {
  const mod=require('node:'+name);
  for(const method of ['request','get']) {const original=mod[method];mod[method]=function(...args){
    const first=args[0];let origin;
    try {origin=typeof first==='string'||first instanceof URL?new URL(first).origin:((first.protocol||name+':')+'//'+(first.hostname||first.host)+':'+first.port);}catch{}
    if(origin==='http://127.0.0.1:3101')return original.apply(this,args);
    return deny(name+'.'+method);
  };}
}
require('node:tls').connect=()=>deny('tls');
require('node:dgram').createSocket=()=>deny('udp');
require('node:http2').connect=()=>deny('http2');
const dns=require('node:dns');const literalLookup=dns.lookup;
for(const name of Object.keys(dns))if(typeof dns[name]==='function'&&/^(lookup|resolve|reverse|setServers)/.test(name))dns[name]=(...args)=>{if(name==='lookup'&&['127.0.0.1','::1'].includes(args[0]))return literalLookup(...args);return deny('dns');};
for(const name of Object.keys(dns.promises))if(typeof dns.promises[name]==='function')dns.promises[name]=async()=>deny('dns.promises');
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
  const raw=typeof input==='string'||input instanceof URL?String(input):input.url;
  const kind=classify(raw);
  if(kind==='mock'){try {const value=mock(raw);record('mock',{provider:new URL(raw).hostname});return Response.json(value);}catch{return deny('unregistered-mock');}}
  if(kind==='local') {
    const response=await nativeFetch(input,{...init,redirect:'manual'});
    if(response.status>=300&&response.status<400){let safe=false;try{const location=response.headers.get('location');safe=!!location&&new URL(location,raw).origin==='http://127.0.0.1:3101';}catch{}if(!safe)return deny('redirect');}
    return response;
  }
  return deny('fetch');
};
const originalFork=cp.fork;
cp.fork=function(modulePath,args,options) {
  if(!Array.isArray(args)){options=args||{};args=[];} options=options||{};
  const resolved=path.resolve(modulePath);
  const nextRoot=fs.realpathSync(path.join(root,'node_modules/next'))+path.sep;
  const actual=fs.realpathSync(resolved);
  const playwrightEntry=fs.realpathSync(path.join(root,'node_modules/playwright/lib/worker/workerProcessEntry.js'));
  if(!(runner?actual===playwrightEntry:(actual.startsWith(nextRoot)||actual===path.join(__dirname,'runtime-probe.cjs'))))return deny('child-fork');
  if(options.execPath&&options.execPath!==process.execPath)return deny('child-executable');
  if(options.cwd&&path.resolve(options.cwd)!==root)return deny('child-cwd');
  verifyEnv(options.env||process.env);
  const execArgv=options.execArgv||process.execArgv;
  if(execArgv.some(x=>x!=='--no-deprecation'))return deny('child-execArgv');
  const child=originalFork.call(this,modulePath,args,{...options,cwd:root,env:options.env||process.env,execArgv});
  record('child-fork',{childPid:child.pid,entry:path.basename(modulePath)});return child;
};
const originalSpawn=cp.spawn;
cp.spawn=function(executable,args=[],options={}) {
  if(!runner||options.shell||options.detached)return deny('child-spawn');
  const actual=fs.realpathSync(executable);
  if(!policy.browserExecutables.some(file=>fs.existsSync(file)&&fs.realpathSync(file)===actual))return deny('browser-executable');
  const env=options.env||{};
  if(Object.keys(env).length!==Object.keys(policy.browserEnv).length||Object.entries(policy.browserEnv).some(([k,v])=>env[k]!==v))return deny('browser-environment');
  if(!args.includes('--proxy-server='+policy.browserProxy)||!args.includes('--proxy-bypass-list=<-loopback>')||!args.includes('--disable-quic'))return deny('browser-network-options');
  if(options.cwd&&path.resolve(options.cwd)!==root)return deny('browser-cwd');
  const child=originalSpawn.call(this,executable,args,{...options,cwd:root,env,windowsHide:true});
  record('browser-start',{pid:child.pid,ppid:process.pid,cwdIsSnapshot:true,envNames:Object.keys(env).sort()});return child;
};
for(const method of ['spawnSync','exec','execSync','execFile','execFileSync'])cp[method]=()=>deny('child-'+method);
const OriginalWorker=threads.Worker;
threads.Worker=class extends OriginalWorker {
  constructor(filename,options={}) {
    if(options.eval||options.execArgv||options.env===threads.SHARE_ENV)return deny('worker-options');
    if(path.resolve(String(filename))!==path.join(__dirname,'runtime-probe.cjs'))return deny('worker-entry');
    verifyEnv(options.env||process.env);
    super(filename,{...options,env:options.env||process.env,execArgv:[]});
    record('worker-created',{workerThreadId:this.threadId});
  }
};
require('node:module').syncBuiltinESMExports();
globalThis[Symbol.for('c01.runtime')]=true;
module.exports={expected,record,verifyEnv,policy};
if(policy.localProbes&&path.basename(process.argv[1]||'')==='next')require('./runtime-probe.cjs').probes().catch(()=>{record('main-probe-failed');process.exit(1);});
