const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {prepareLocal}=require('./e2e/local-runtime.cjs');
test('local snapshot ignores parent credentials, has only dummy key and no env files',()=>{
  const old=process.env.C01_PARENT_POISON;process.env.C01_PARENT_POISON='synthetic-poison';
  let p;try {
    p=prepareLocal();assert.equal(p.env.C01_E2E_STAGING_ENABLED,'0');assert.equal(p.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,'C01_LOCAL_ONLY_NOT_A_CREDENTIAL');
    assert.equal(p.env.C01_PARENT_POISON,undefined);assert.equal(p.env.NODE_PATH,undefined);
    assert.equal(p.env.USERPROFILE,path.join(p.destination,'local-profile'));
    for(const n of ['.env.local','.env','.env.production','.env.development','.git','.vercel','supabase'])assert.equal(fs.existsSync(path.join(p.destination,n)),false);
    assert.equal(fs.existsSync(path.join(p.destination,'middleware.ts')),true);
    assert.ok(fs.readFileSync(path.join(p.destination,'middleware.ts'),'utf8').includes('containedApplicationMiddleware'));
    assert.ok(p.env.NODE_OPTIONS.includes('runtime-preload.cjs'));
    assert.equal(fs.existsSync(path.join(p.destination,'app/c01-local-runtime/route.ts')),true);
  }finally{if(old===undefined)delete process.env.C01_PARENT_POISON;else process.env.C01_PARENT_POISON=old;}
});
test('staging execution gates remain closed and browser staging access requires explicit opt-in',()=>{
  assert.match(fs.readFileSync(path.join(__dirname,'e2e/global-setup.ts'),'utf8'),/throw new Error/);
  assert.match(fs.readFileSync(path.join(__dirname,'e2e/launch.cjs'),'utf8'),/Execution gate closed/);
  assert.match(fs.readFileSync(path.join(__dirname,'e2e/browser.ts'),'utf8'),/installBrowserGuards/);
});
test('local preload rejects staging enablement, missing preload environment and poisoned env before entry',()=>{
  const cp=require('node:child_process');const p=prepareLocal();
  for(const change of [{C01_E2E_STAGING_ENABLED:'1'},{NODE_OPTIONS:''},{UNINTENDED_SECRET:'synthetic-poison'}]) {
    const result=cp.spawnSync(process.execPath,['--require',path.join(p.destination,'tests/e2e/runtime-preload.cjs'),'-e','process.stdout.write("UNSAFE_ENTRY")'],{cwd:p.destination,env:{...p.env,...change},encoding:'utf8',timeout:10000,windowsHide:true});
    assert.notEqual(result.status,0);assert.equal(result.stdout,'');
  }
});
test('deny proxy rejects HTTP and CONNECT locally without resolving or forwarding targets',async()=>{
  const {createDenyProxy}=require('./e2e/local-runtime.cjs'),http=require('node:http');const events=[];const proxy=createDenyProxy(events);
  await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
  try {
    const port=proxy.address().port;
    const httpStatus=await new Promise((resolve,reject)=>{const r=http.request({host:'127.0.0.1',port,path:'http://proxy-test.example.invalid/',method:'GET'},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});r.on('error',reject);r.end();});
    assert.equal(httpStatus,403);
    const connectStatus=await new Promise((resolve,reject)=>{const r=http.request({host:'127.0.0.1',port,path:'proxy-test.example.invalid:443',method:'CONNECT'});r.on('connect',(res,socket)=>{socket.destroy();resolve(res.statusCode);});r.on('error',reject);r.end();});
    assert.equal(connectStatus,403);assert.deepEqual(events.map(e=>e.method),['GET','CONNECT']);assert.ok(events.every(e=>e.blocked));
  }finally{await new Promise(resolve=>proxy.close(resolve));}
});

test('layout adapter edits snapshot only and rejects unreviewed source drift',()=>{
  const os=require('node:os'),crypto=require('node:crypto');
  const root=path.resolve(__dirname,'..');
  const files=['app/layout.tsx','components/layout/Footer.tsx'];
  const before=files.map(f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex'));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'c01-layout-adapter-'));
  for(const f of files){fs.mkdirSync(path.dirname(path.join(temp,f)),{recursive:true});fs.copyFileSync(path.join(root,f),path.join(temp,f));}
  fs.mkdirSync(path.join(temp,'public'));
  const {containLayout}=require('./e2e/runtime-layout.cjs');const result=containLayout(temp);
  assert.deepEqual(result,{snapshotOnly:true,suppressedLayoutNodes:4,replacedBadgeSources:8,productionSourcesWritten:false});
  assert.ok(fs.readFileSync(path.join(temp,'app/layout.tsx'),'utf8').includes('application/ld+json'));
  assert.ok(!fs.readFileSync(path.join(temp,'app/layout.tsx'),'utf8').includes('pagead2.googlesyndication.com'));
  assert.ok(fs.readFileSync(path.join(temp,'components/layout/Footer.tsx'),'utf8').includes('https://www.truetier.app/upvote/'));
  assert.equal((fs.readFileSync(path.join(temp,'components/layout/Footer.tsx'),'utf8').match(/src: '\/c01-local-badge.svg'/g)||[]).length,8);
  assert.deepEqual(files.map(f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')),before);
  assert.throws(()=>containLayout(temp),/Layout source changed/);
});
