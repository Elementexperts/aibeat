const fs = require('node:fs');
const path = require('node:path');
const REF = 'oejxwsvlvelxmfbysjbx';
const URL = `https://${REF}.supabase.co`;
const BASE = 'http://127.0.0.1:3101';
function validate(c) {
  if (!c || c.projectRef !== REF || c.supabaseUrl !== URL || c.baseURL !== BASE) throw Error('E2E identity mismatch');
  if (typeof c.anonKey !== 'string' || !c.anonKey) throw Error('Missing staging anon key');
  let claims;
  try { claims = JSON.parse(Buffer.from(c.anonKey.split('.')[1], 'base64url').toString()); } catch { throw Error('Use a project-bound legacy anon JWT; opaque key pairing is not verified'); }
  if (claims.ref !== REF || claims.role !== 'anon') throw Error('E2E key project/role mismatch');
  // Decoding is NOT signature verification. A separate read-only pairing preflight is mandatory.
  if (c.clusterId !== '7692131729119822239') throw Error('Cluster anchor mismatch');
  return c;
}
function environment(c, inherited = process.env) {
  validate(c);
  const e = {};
  for (const name of ['SystemRoot','WINDIR','TEMP','TMP','COMSPEC','PATHEXT']) if (inherited[name]) e[name] = inherited[name];
  return Object.assign(e, {
    NODE_ENV:'development', NEXT_TELEMETRY_DISABLED:'1', AIBEAT_APP_ENV:'development',
    AIBEAT_BUSINESS_AI_MODE:'mock', NEXT_PUBLIC_SITE_URL:BASE,
    NEXT_PUBLIC_SUPABASE_URL:URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:c.anonKey,
    C01_E2E_CONTAINMENT:'1', C01_E2E_STAGING_ENABLED:'0',
    GMAIL_CLIENT_ID:'c01-mock',GMAIL_CLIENT_SECRET:'c01-mock',GMAIL_REFRESH_TOKEN:'c01-mock',
    KIT_API_KEY:'c01-mock',KIT_FORM_ID:'1',STRIPE_SECRET_KEY:'sk_test_c01_mock',
    STRIPE_PRICE_SIMPLE_PLACEMENT:'price_c01_simple',STRIPE_PRICE_FEATURED_PLACEMENT:'price_c01_featured',
    STRIPE_PRICE_SPOTLIGHT_PRO:'price_c01_spotlight',STRIPE_WEBHOOK_SECRET:'whsec_c01_mock'
  });
}
function classify(raw, method='GET') {
  const u = new globalThis.URL(raw);
  if (u.username || u.password) return 'blocked';
  if (u.origin === BASE) return 'local';
  if (u.origin === URL) {
    if (/^\/auth\/v1\/(user|logout)$/.test(u.pathname) ||
      (u.pathname === '/auth/v1/token' && ['password','refresh_token'].includes(u.searchParams.get('grant_type')))) return 'staging';
    if (/^\/(rest|storage)\/v1\//.test(u.pathname)) return 'staging';
    return 'blocked'; // signup, recovery, OTP, invite, admin, functions and realtime are denied.
  }
  const mocks = ['https://oauth2.googleapis.com','https://gmail.googleapis.com','https://api.kit.com','https://api.convertkit.com','https://api.stripe.com','https://generativelanguage.googleapis.com','https://api.openai.com'];
  if (mocks.includes(u.origin)) return 'mock';
  return 'blocked';
}
function mock(raw) {
  const u = new globalThis.URL(raw);
  if (u.hostname === 'oauth2.googleapis.com' && u.pathname === '/token') return {access_token:'c01-mock-access',expires_in:3600,token_type:'Bearer'};
  if (u.hostname === 'gmail.googleapis.com' && /\/users\/me\/(messages\/send|drafts)$/.test(u.pathname)) return {id:'c01-mock-message'};
  if (['api.kit.com','api.convertkit.com'].includes(u.hostname) && /\/subscribers(?:\/\d+)?$/.test(u.pathname)) return {subscriber:{id:1}};
  if (u.hostname === 'api.stripe.com' && u.pathname === '/v1/checkout/sessions') return {id:'cs_test_c01',object:'checkout.session',url:BASE+'/submit?c01_mock_checkout=1'};
  // Unknown AI, connector, email and webhook calls deliberately fail instead of pretending success.
  throw Error('C01 outbound request rejected (unregistered mock)');
}
function snapshot(source, destination) {
  if (fs.existsSync(destination)) throw Error('Snapshot destination must be fresh');
  const roots = ['app','components','lib','data','public','content','styles','tests/e2e','middleware.ts','next.config.js','next-env.d.ts','tsconfig.json','tailwind.config.ts','tailwind.config.js','postcss.config.js','package.json','package-lock.json'];
  fs.mkdirSync(destination,{recursive:true});
  function copy(from,to) {
    const st=fs.lstatSync(from); if (st.isSymbolicLink()) throw Error('Snapshot symlinks forbidden');
    const name=path.basename(from);
    if (name.startsWith('.') || /(^env\.|\.(env|pem|key|pgpass)$)/i.test(name)) return;
    if (st.isDirectory()) {fs.mkdirSync(to,{recursive:true});for(const n of fs.readdirSync(from)) copy(path.join(from,n),path.join(to,n));}
    else {fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
  }
  for (const root of roots) if(fs.existsSync(path.join(source,root))) copy(path.join(source,root),path.join(destination,root));
}
module.exports={REF,URL,BASE,validate,environment,classify,mock,snapshot};
