// Runs only local infrastructure probes. Does not import the staging E2E spec/config.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),http=require('node:http'),assert=require('node:assert/strict');
const {environment,snapshot,REF,URL,BASE}=require('./guard.cjs');
const DUMMY='C01_LOCAL_ONLY_NOT_A_CREDENTIAL';
const root=path.resolve(__dirname,'../..');
function prepareLocal() { return require('./runtime-config.cjs').prepareRuntime({local:true,includeProbes:true}); }
function localRequest(pathname) {return new Promise((resolve,reject)=>{
  const request=http.get(BASE+pathname,{timeout:120000},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,body}));});
  request.on('timeout',()=>request.destroy(Error('Local request timeout')));request.on('error',reject);
});}
async function exclusivePort() {const s=require('node:net').createServer();await new Promise((resolve,reject)=>{s.once('error',reject);s.listen({host:'127.0.0.1',port:3101,exclusive:true},resolve);});await new Promise(resolve=>s.close(resolve));}
function createDenyProxy(events) {
  const proxy=http.createServer((req,res)=>{events.push({method:req.method,blocked:true});res.writeHead(403);res.end('C01 browser proxy denied');});
  proxy.on('connect',(req,socket)=>{events.push({method:'CONNECT',blocked:true});socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');});
  return proxy;
}
async function browserProbe(prepared) {
  const {chromium}=require('playwright');const proxyEvents=[],blocked=[],forwarded=[];
  // Explicit deny proxy catches browser background networking outside Playwright routes.
  const proxy=createDenyProxy(proxyEvents);
  await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
  const browserEnv=prepared.policy.browserEnv;
  let browser;const previousCwd=process.cwd();process.chdir(prepared.destination);
  try {
    browser=await chromium.launch({headless:true,...require('./runner-policy.cjs').browserOptions(prepared.policy,'http://127.0.0.1:'+proxy.address().port)});
    prepared.monitor?.registerCloser(()=>browser.close());
    const context=await browser.newContext({serviceWorkers:'block'});
    const guards=await require('./browser-policy.cjs').installBrowserGuards(context,{policy:prepared.policy,forwardLocal:async request=>{
      const u=new globalThis.URL(request.url());
      if(request.method()!=='GET')require('./run-monitor.cjs').fatal(prepared.policy,{source:'browser',transport:'local-method'});
      const response=await localRequest(u.pathname+u.search);forwarded.push(u.pathname);
      return {status:response.status,body:response.body,contentType:u.pathname.endsWith('.js')?'application/javascript':u.pathname.endsWith('.css')?'text/css':u.pathname.endsWith('.svg')?'image/svg+xml':u.pathname.includes('c01-local-browser')?'text/html':undefined};
    }});
    blocked.push(...guards.blocked);
    const page=await context.newPage();
    await page.goto(BASE+'/c01-local-browser',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>document.querySelector('#c01-public-config')?.textContent!=='pending',{},{timeout:30000});
    const text=await page.locator('#c01-public-config').innerText();
    const initialBlockedHosts=[...new Set(guards.blocked)];
    const processInspection=await require('./runtime-browser-inspection.cjs').inspectBrowser(browser,browserEnv);
    const blockedChecks=await page.evaluate(async()=>{
      const results=[];
      for(const url of ['https://browser-probe.example.invalid/event','https://oejxwsvlvelxmfbysjbx.supabase.co/rest/v1/organizations','https://api.stripe.com/v1/charges']) {try {await fetch(url);results.push(false);}catch{results.push(true);}}
      return results;
    });
    assert.ok(blockedChecks.every(Boolean));
    return {initialBlockedHosts,processInspection,layoutContainment:prepared.layoutContainment,publicConfigAvailable:text!=='public-config-unavailable',publicConfig:text==='public-config-unavailable'?null:JSON.parse(text),blockedHosts:[...new Set(guards.blocked)],blockedChecks,proxyEvents,localForwardedCount:forwarded.length,browserEnvNames:Object.keys(browserEnv),browserContextEnv:'explicit allowlist at launch; descendant native process environment not independently inspected'};
  } finally {if(browser)await browser.close();process.chdir(previousCwd);await new Promise(resolve=>proxy.close(resolve));}
}
async function run() {
  await exclusivePort();const prepared=prepareLocal();
  const summary={started:new Date().toISOString(),snapshot:prepared.destination,decision:'BLOCKED',stagingTrafficEnabled:false,osEgressBoundary:false};
  let child;let logs='';
  const output=path.join(root,'docs/community-phase-1/c01-stage3b2a-runtime-results.json');
  const monitor=new (require('./run-monitor.cjs').RunMonitor)(prepared.policy);
  try {
    child=monitor.register(cp.spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','--hostname','127.0.0.1','--port','3101'],{cwd:prepared.destination,env:prepared.env,windowsHide:true,stdio:['ignore','pipe','pipe']}));
    for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{logs+=chunk.toString();fs.writeFileSync(path.join(prepared.destination,'c01-next.log'),logs);});
    const started=Date.now();
    await new Promise((resolve,reject)=>{const timer=setInterval(()=>{if(logs.includes('Ready in')){clearInterval(timer);resolve();}else if(child.exitCode!==null||Date.now()-started>90000){clearInterval(timer);reject(Error('Next startup failed'));}},200);child.once('error',error=>{clearInterval(timer);reject(error);});});
    summary.launch={pid:child.pid,ready:true,host:'127.0.0.1',port:3101,repositoryRootLaunch:false};
    monitor.assertHealthy();const response=await localRequest('/c01-local-runtime');assert.equal(response.status,200,'Runtime route failed');summary.runtime=JSON.parse(response.body);assert.equal(summary.runtime.aiMock,true);
    const edge=await localRequest('/c01-local-middleware');assert.equal(edge.status,200,'Middleware probe failed');summary.middleware=JSON.parse(edge.body);assert.ok(summary.middleware.blocked&&summary.middleware.stagingDisabled&&summary.middleware.poisonAbsent&&summary.middleware.keyIsDummy&&summary.middleware.applicationMiddlewarePassed);
    summary.browser=await browserProbe({...prepared,monitor});monitor.assertHealthy();
    const expectedBrowserBlocks=new Set(['browser-probe.example.invalid','oejxwsvlvelxmfbysjbx.supabase.co','api.stripe.com','websocket']);
    summary.unexpectedBrowserHosts=summary.browser.blockedHosts.filter(host=>!expectedBrowserBlocks.has(host));
    if(summary.browser.publicConfigAvailable){assert.deepEqual(summary.browser.publicConfig,{url:URL,key:DUMMY,secretAbsent:true,privateAbsent:true,clientInitialized:true,clientSingleton:true});}
    summary.localChecksPassed=summary.browser.publicConfigAvailable&&!summary.unexpectedBrowserHosts.length;
    summary.decision='BLOCKED'; // Independent OS isolation/descendant environment verification remain mandatory.
    summary.remaining=['No OS/container egress boundary established','Native browser descendant environments not independently inspected',...(summary.unexpectedBrowserHosts.length?['Application layout attempted unexpected external assets; all were blocked']:[]),...(!summary.browser.publicConfigAvailable?['Application browser public configuration helper unavailable']:[])];
    // Logs contain only a synthetic configuration; retain locally in snapshot for diagnostics.
    fs.writeFileSync(path.join(prepared.destination,'c01-next.log'),logs);
  } catch(error) {summary.error=error.message;}
  finally {
    monitor.dispose();
    if(child) {
      // Stop only recorded processes from this unique snapshot, never arbitrary port owners.
      const events=fs.existsSync(prepared.ledger)?fs.readFileSync(prepared.ledger,'utf8').trim().split('\n').filter(Boolean).map(x=>JSON.parse(x)):[];
      const pids=[...new Set(events.filter(e=>e.kind==='process-start').map(e=>e.pid)),child.pid].filter(Boolean).reverse();
      for(const pid of pids)try{process.kill(pid);}catch{}
      summary.events=events;summary.stoppedPids=pids;
      summary.unexpectedBlocks=events.filter(e=>e.kind==='blocked'&&!e.expected);
      summary.environmentExclusion={rootEnvFilesAbsent:['.env','.env.local','.env.development','.env.production'].every(n=>!fs.existsSync(path.join(prepared.destination,n))),parentPoisonExcluded:!('C01_PARENT_POISON' in prepared.env),onlyDummyCredential:true};
      if(summary.unexpectedBlocks.length)summary.decision='BLOCKED';
    }
    fs.writeFileSync(path.join(prepared.destination,'c01-next.log'),logs);
    summary.finished=new Date().toISOString();
    const historyFile=path.join(root,'docs/community-phase-1/c01-stage3b2a-runtime-attempts.json');
    const history=fs.existsSync(historyFile)?JSON.parse(fs.readFileSync(historyFile,'utf8')):[];
    if(fs.existsSync(output))history.push(JSON.parse(fs.readFileSync(output,'utf8')));
    fs.writeFileSync(historyFile,JSON.stringify(history,null,2)+'\n');
    fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n');
    if(summary.decision!=='PASS')process.exitCode=1;
    console.log(JSON.stringify({decision:summary.decision,error:summary.error,report:output,processes:summary.events?.filter(e=>e.kind==='process-start').map(e=>({pid:e.pid,threadId:e.threadId,entry:e.entry})),unexpectedBlocks:summary.unexpectedBlocks?.length}));
  }
}
if(require.main===module)run().catch(()=>{console.error('Local probe failed before launch');process.exitCode=1;});
module.exports={prepareLocal,run,createDenyProxy};
