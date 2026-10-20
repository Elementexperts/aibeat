const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {prepareRuntime,dummyConfig}=require('./e2e/runtime-config.cjs');
const {RunMonitor,firstViolation,assertHealthy,EXIT}=require('./e2e/run-monitor.cjs');
function exited(child){return new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});}
test('local and staging preparation share snapshot policy, layout and preload; staging opt-in rejected',()=>{
  const local=prepareRuntime({local:true,includeProbes:true}),staging=prepareRuntime({config:dummyConfig()});
  for(const p of [local,staging]){assert.equal(p.env.C01_E2E_STAGING_ENABLED,'0');assert.ok(p.env.NODE_OPTIONS.endsWith('runtime-preload.cjs"'));assert.equal(p.layoutContainment.replacedBadgeSources,8);assert.ok(fs.readFileSync(path.join(p.destination,'lib/stripe.ts'),'utf8').includes('Stripe.createFetchHttpClient'));assert.ok(!fs.existsSync(path.join(p.destination,'.env.local')));}
  assert.equal(staging.policy.localProbes,false);assert.throws(()=>prepareRuntime({config:{...dummyConfig(),stagingEnabled:true}}),/may not be enabled/);
});
test('unexpected request exits before a catch handler; supervisor stops another process and fences later scenarios',async()=>{
  const p=prepareRuntime({local:true,includeProbes:true}),monitor=new RunMonitor(p.policy);
  const marker=path.join(p.destination,'should-never-exist');
  const spectator=monitor.register(cp.spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{env:p.env,cwd:p.destination,windowsHide:true,stdio:'ignore'}));
  const spectatorExit=exited(spectator);
  const offender=monitor.register(cp.spawn(process.execPath,['-e',`(async()=>{try{await fetch('https://abort-probe.example.invalid/')}catch{require('fs').writeFileSync(${JSON.stringify(marker)},'caught')}require('fs').writeFileSync(${JSON.stringify(marker)},'continued')})()`],{env:p.env,cwd:p.destination,windowsHide:true,stdio:'ignore'}));
  try {
    const status=await exited(offender);assert.notEqual(status,0); // supervisor may win the race with the local exit(86)
    await Promise.race([spectatorExit,new Promise((_,reject)=>setTimeout(()=>reject(Error('Supervisor did not stop sibling')),3000))]);
    assert.ok(fs.existsSync(p.violation));assert.equal(fs.existsSync(marker),false);
    let laterScenario=false;assert.throws(()=>{monitor.assertHealthy();laterScenario=true;});assert.equal(laterScenario,false);
    const evidence=fs.readFileSync(p.violation,'utf8');assert.ok(!evidence.includes('example.invalid'));assert.match(evidence,/"source":"node"/);
  }finally{monitor.dispose();offender.kill();spectator.kill();}
});
test('intentional probes do not poison the run; asynchronous expectation does not hide unrelated violations',async()=>{
  const p=prepareRuntime({local:true,includeProbes:true});
  const script=`const {expected}=require('./tests/e2e/runtime-preload.cjs');(async()=>{await expected(async()=>{try{await fetch('https://expected.example.invalid')}catch{}});process.stdout.write('expected');try{await fetch('https://unexpected.example.invalid')}catch{process.stdout.write('UNSAFE')}})()`;
  const r=cp.spawnSync(process.execPath,['-e',script],{env:p.env,cwd:p.destination,encoding:'utf8',timeout:10000,windowsHide:true});assert.equal(r.status,EXIT);assert.equal(r.stdout,'expected');
});
test('browser rejection uses the same fatal evidence path instead of end-of-case assertion',()=>{
  const p=prepareRuntime({local:true,includeProbes:true});
  const script=`const {installBrowserGuards}=require('./tests/e2e/browser-policy.cjs');const {policy}=require('./tests/e2e/runtime-preload.cjs');let handler;const context={route:async(_,fn)=>{handler=fn},routeWebSocket:async()=>{}};(async()=>{await installBrowserGuards(context,{policy});await handler({request:()=>({url:()=> 'https://unexpected-browser.example.invalid',method:()=> 'GET'})});process.stdout.write('UNSAFE')})()`;
  const r=cp.spawnSync(process.execPath,['-e',script],{env:p.env,cwd:p.destination,encoding:'utf8',timeout:10000,windowsHide:true});assert.equal(r.status,EXIT);assert.equal(r.stdout,'');assert.equal(JSON.parse(fs.readFileSync(p.violation,'utf8')).source,'browser');
});
test('first violation retained and future scenario fence rejects',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'c01-monitor-')),p={violation:path.join(root,'violation.json')};
  firstViolation(p,{source:'browser',transport:'request',url:'SECRET'});firstViolation(p,{source:'later'});assert.equal(JSON.parse(fs.readFileSync(p.violation,'utf8')).source,'browser');assert.ok(!fs.readFileSync(p.violation,'utf8').includes('SECRET'));assert.throws(()=>assertHealthy(p));
});
test('fixture review has no executable privileged membership bootstrap and rejects retained IDs',()=>{
  const {plan}=require('./e2e/fixture-plan.cjs'),{reviewProvisioning,executeProvisioning}=require('./e2e/provisioning-review.cjs');const p=plan(),review=reviewProvisioning(p);
  assert.equal(review.counts.accounts,9);assert.equal(review.decision,'BLOCKED');assert.ok(review.operations.every(o=>o.emailDelivery!==true));assert.throws(()=>executeProvisioning(),/gate closed/);assert.throws(()=>reviewProvisioning(p,[p.organizationId]));
});
test('expired browser cookie fixture validates subject, issuer, expiry and chunks without forging a live session',()=>{
  const {expiredFixture,decodeCookies,PREFIX}=require('./e2e/session-fixture.cjs');const owner=require('node:crypto').randomUUID();
  const claims={sub:owner,iss:'https://oejxwsvlvelxmfbysjbx.supabase.co/auth/v1',exp:100};const session={access_token:'test.'+Buffer.from(JSON.stringify(claims)).toString('base64url')+'.offline-not-signed',refresh_token:'dummy-refresh'};
  const cookies=[{name:PREFIX,value:'base64-'+Buffer.from(JSON.stringify(session)).toString('base64url')}];assert.equal(expiredFixture(cookies,owner,200).length,1);assert.equal(decodeCookies(cookies).claims.sub,owner);assert.throws(()=>expiredFixture(cookies,owner,50));assert.throws(()=>expiredFixture(cookies,'foreign',200));assert.throws(()=>expiredFixture([{...cookies[0],name:PREFIX+'.7'}],owner,200));
});

test('fixture contract rejects namespace escapes, reused sentinels and real addresses',()=>{
  const {plan}=require('./e2e/fixture-plan.cjs'),{validateFixtureManifest}=require('./e2e/fixture-contract.cjs');const p=plan();
  for(const actor of Object.values(p.actors))actor.password='synthetic-only-password';
  const m={...p,storageBucket:'business-documents',permittedStoragePath:p.organizationId+'/'+p.runId+'/permitted.txt',foreign:{documentId:require('crypto').randomUUID(),workflowId:require('crypto').randomUUID(),approvalId:require('crypto').randomUUID(),storagePath:p.secondOrganizationId+'/'+p.runId+'/foreign.txt'}};
  assert.equal(validateFixtureManifest(m),m);
  assert.throws(()=>validateFixtureManifest({...m,permittedStoragePath:p.secondOrganizationId+'/'+p.runId+'/x.txt'}));
  assert.throws(()=>validateFixtureManifest({...m,foreign:{...m.foreign,approvalId:p.approvalId}}));
  assert.throws(()=>validateFixtureManifest({...m,invitationEmail:'real@example.com'}));
});

test('corrupt complete ledger evidence fails closed instead of disabling supervision',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c01-corrupt-ledger-')),policy={ledger:path.join(dir,'ledger.jsonl'),violation:path.join(dir,'abort.json')};
  fs.writeFileSync(policy.ledger,'not-json\n');const monitor=new RunMonitor(policy);
  try{assert.equal(monitor.aborted,true);assert.throws(()=>monitor.assertHealthy());assert.equal(JSON.parse(fs.readFileSync(policy.violation,'utf8')).transport,'ledger-unreadable');}finally{monitor.dispose();}
});

test('local-to-remote redirect is recorded and fatal even when application catches fetch errors',()=>{
  const p=prepareRuntime({local:true,includeProbes:true});
  const script=`const http=require('node:http');const server=http.createServer((_,r)=>{r.writeHead(302,{location:'https://redirect-probe.example.invalid/path'});r.end()});server.listen(3101,'127.0.0.1',async()=>{try{await fetch('http://127.0.0.1:3101/')}catch{process.stdout.write('UNSAFE_CATCH')}process.stdout.write('UNSAFE_CONTINUE')})`;
  const r=cp.spawnSync(process.execPath,['-e',script],{env:p.env,cwd:p.destination,encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(r.status,EXIT);assert.equal(r.stdout,'');assert.equal(JSON.parse(fs.readFileSync(p.violation,'utf8')).transport,'redirect');
});

test('runner manifest environment is separated from app and native browser environments',()=>{
  const p=prepareRuntime({local:true,includeProbes:true}),{runnerEnvironment,browserOptions}=require('./e2e/runner-policy.cjs');
  const env=runnerEnvironment(p,path.join(os.tmpdir(),'c01-protected-fixture.json'));
  assert.equal(p.env.C01_E2E_CONFIG_FILE,undefined);assert.equal(p.policy.browserEnv.C01_E2E_CONFIG_FILE,undefined);assert.ok(env.C01_E2E_CONFIG_FILE);
  assert.equal(browserOptions(p.policy).proxy.server,'http://127.0.0.1:3102');assert.throws(()=>browserOptions(p.policy,'http://example.invalid:3102'));
  assert.throws(()=>runnerEnvironment(p,path.join(p.destination,'manifest.json')));
  const r=cp.spawnSync(process.execPath,['-e',"process.stdout.write(globalThis[Symbol.for('c01.runtime')]?'guarded':'UNSAFE')"],{env,cwd:p.destination,encoding:'utf8',timeout:10000,windowsHide:true});assert.equal(r.status,0);assert.equal(r.stdout,'guarded');
  const bad=cp.spawnSync(process.execPath,['-e',"require('child_process').spawn(process.execPath,['-e','0'])"],{env,cwd:p.destination,encoding:'utf8',timeout:10000,windowsHide:true});assert.equal(bad.status,EXIT);
});
