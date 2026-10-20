const assert=require('node:assert/strict');
const {expected,record}=require('./runtime-preload.cjs');
async function probes() {
  const results=[];
  async function blocked(name,fn) {await expected(async()=>{await assert.rejects(async()=>fn(),/C01_LOCAL_BLOCKED/);results.push(name);});}
  for(const [name,url] of Object.entries({ai:'https://api.openai.com/v1/responses',gemini:'https://generativelanguage.googleapis.com/v1/models',email:'https://api.sendgrid.com/v3/mail/send',connector:'https://connector.example.invalid/run',webhook:'https://webhook.example.invalid/event',staging:'https://oejxwsvlvelxmfbysjbx.supabase.co/rest/v1/organizations'}))await blocked(name,()=>fetch(url));
  for(const [name,fn] of Object.entries({http:()=>require('http').get('http://203.0.113.1/'),https:()=>require('https').get('https://203.0.113.1/'),socket:()=>require('net').connect(443,'203.0.113.1'),tls:()=>require('tls').connect(443,'203.0.113.1'),udp:()=>require('dgram').createSocket('udp4'),http2:()=>require('http2').connect('https://203.0.113.1'),dns:()=>require('dns').lookup('example.invalid'),dnsPromise:()=>require('dns').promises.resolve('example.invalid'),child:()=>require('child_process').spawn(process.execPath,['-e','0']),childEnv:()=>require('child_process').fork(__filename,[],{env:{...process.env,UNINTENDED_SECRET:'poison'}})})) {
    if(name==='childEnv') {await expected(()=>assert.rejects(async()=>fn(),/environment names rejected/));results.push(name);}else await blocked(name,fn);
  }
  for(const [name,url] of Object.entries({gmail:'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',kit:'https://api.kit.com/v4/subscribers',stripe:'https://api.stripe.com/v1/checkout/sessions'})) {const value=await(await fetch(url)).json();assert.ok(value.id||value.subscriber);results.push(name+'-mock');}
  // Exercise the real Stripe SDK through its explicitly selected safe transport.
  const Stripe=require('stripe');const stripe=new Stripe('sk_test_c01_mock',{httpClient:Stripe.createFetchHttpClient(globalThis.fetch),maxNetworkRetries:0});
  assert.equal((await stripe.checkout.sessions.create({mode:'payment'})).id,'cs_test_c01');results.push('stripe-sdk-mock');
  record('probe-pass',{checks:results});return {pid:process.pid,threadId:require('worker_threads').threadId,checks:results,stagingDisabled:process.env.C01_E2E_STAGING_ENABLED==='0'};
}
async function family() {
  const main=await probes();
  const cp=require('child_process'),{Worker}=require('worker_threads');
  const child=await new Promise((resolve,reject)=>{const c=cp.fork(__filename,['child'],{stdio:['ignore','ignore','ignore','ipc']});const timer=setTimeout(()=>{c.kill();reject(Error('Child probe timeout'));},15000);let result;c.on('message',m=>{result=m;});c.on('error',reject);c.on('exit',code=>{clearTimeout(timer);code===0&&result?resolve(result):reject(Error('Child probe failed'));});});
  const worker=await new Promise((resolve,reject)=>{const w=new Worker(__filename);const timer=setTimeout(()=>{w.terminate();reject(Error('Worker probe timeout'));},15000);let result;w.on('message',m=>{result=m;});w.on('error',reject);w.on('exit',code=>{clearTimeout(timer);code===0&&result?resolve(result):reject(Error('Worker probe failed'));});});
  return {main,child,worker};
}
if(require.main===module)probes().then(result=>{const {parentPort}=require('worker_threads');if(parentPort)parentPort.postMessage(result);else if(process.send)process.send(result);}).catch(()=>{process.exitCode=1;});
module.exports={probes,family};
