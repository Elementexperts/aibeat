// One snapshot/environment/preload path for local probes and restricted-staging preparation.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {environment,snapshot,REF,URL,BASE,validate}=require('./guard.cjs');
const DUMMY='C01_LOCAL_ONLY_NOT_A_CREDENTIAL';
function dummyConfig(){return {projectRef:REF,supabaseUrl:URL,baseURL:BASE,anonKey:'test.'+Buffer.from(JSON.stringify({ref:REF,role:'anon'})).toString('base64url')+'.not-a-signature',clusterId:'7692131729119822239'};}
function prepareRuntime({config=dummyConfig(),local=false,includeProbes=false,source=path.resolve(__dirname,'../..'),inherited=process.env}={}) {
  validate(config);
  if(config.stagingEnabled===true||config.stagingEnabled==='1')throw Error('Staging transport may not be enabled during preparation');
  const env=environment(config,inherited);
  if(local)env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=DUMMY;
  env.NEXT_DISABLE_MEM_OVERRIDE='1';
  const destination=path.join(os.tmpdir(),'aibeat-c01-runtime-'+require('node:crypto').randomUUID());
  snapshot(source,destination);
  for(const name of ['HOMEDRIVE','HOMEPATH','LOGONSERVER','SYSTEMDRIVE','USERDOMAIN','USERNAME'])env[name]='';
  env.PATH=path.dirname(process.execPath);env.USERPROFILE=path.join(destination,'local-profile');fs.mkdirSync(env.USERPROFILE);
  fs.symlinkSync(path.join(source,'node_modules'),path.join(destination,'node_modules'),'junction');
  env.C01_E2E_RUN_DIR=destination;
  env.NODE_OPTIONS='--require '+JSON.stringify(path.join(destination,'tests/e2e/runtime-preload.cjs'));
  const ledger=path.join(destination,'c01-runtime-ledger.jsonl'),violation=path.join(destination,'c01-violation.json');
  const policy={version:1,env,ledger,violation,localProbes:includeProbes,stagingExecutionAuthorized:false,browserEnv:require('./runner-policy.cjs').browserEnvironment(env),browserProxy:'http://127.0.0.1:3102'};
  const chromium=require('playwright').chromium.executablePath();
  const cacheRoot=path.resolve(path.dirname(chromium),'../..');
  const revision=require(path.join(path.dirname(require.resolve('playwright-core/package.json')),'browsers.json')).browsers.find(b=>b.name==='chromium-headless-shell').revision;
  policy.browserExecutables=[chromium,path.join(cacheRoot,'chromium_headless_shell-'+revision,'chrome-headless-shell-win64/chrome-headless-shell.exe')];
  fs.writeFileSync(path.join(destination,'c01-runtime-policy.json'),JSON.stringify(policy));
  const stripeFile=path.join(destination,'lib/stripe.ts'),stripe=fs.readFileSync(stripeFile,'utf8');
  assert.equal(stripe.split('new Stripe(secretKey)').length,2,'Stripe transport adapter requires review');
  fs.writeFileSync(stripeFile,stripe.replace('new Stripe(secretKey)','new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient(globalThis.fetch) })'));
  const templates=require('./runtime-templates.cjs');
  if(includeProbes){
    for(const [name,file,body] of [['c01-local-runtime','route.ts',templates.route],['c01-local-browser','page.tsx',templates.page]]) {const dir=path.join(destination,'app',name);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,file),body);}
  }
  const violationDir=path.join(destination,'app/c01-containment-violation');fs.mkdirSync(violationDir,{recursive:true});fs.writeFileSync(path.join(violationDir,'route.ts'),templates.violationRoute);
  // This calls the actual app server action; it never exists in production source.
  const bridge=path.join(destination,'app/c01-action-probe');fs.mkdirSync(bridge,{recursive:true});fs.writeFileSync(path.join(bridge,'page.tsx'),templates.actionProbe);
  const middlewareFile=path.join(destination,'middleware.ts'),middleware=fs.readFileSync(middlewareFile,'utf8');
  assert.equal(middleware.split('export async function middleware(').length,2);
  const edge=templates.middleware.replace("if (request.nextUrl.pathname === '/c01-local-middleware')","if ("+includeProbes+" && request.nextUrl.pathname === '/c01-local-middleware')").replace("if (request.nextUrl.pathname !== '/c01-local-middleware')","if (!"+includeProbes+" || request.nextUrl.pathname !== '/c01-local-middleware')");
  fs.writeFileSync(middlewareFile,middleware.replace('export async function middleware(','async function containedApplicationMiddleware(')+edge);
  const layoutContainment=require('./runtime-layout.cjs').containLayout(destination);
  for(const name of ['.env','.env.local','.env.development','.env.production','.git','.vercel','supabase'])assert.ok(!fs.existsSync(path.join(destination,name)));
  return {destination,env,ledger,violation,policy,layoutContainment};
}
module.exports={prepareRuntime,dummyConfig,DUMMY};
