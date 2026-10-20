// Shared browser policy: preparation cannot enable staging transport.
const {classify,mock,BASE}=require('./guard.cjs');
const {fatal,assertHealthy}=require('./run-monitor.cjs');
const negativeURLs=new Set(['https://browser-probe.example.invalid/event','https://oejxwsvlvelxmfbysjbx.supabase.co/rest/v1/organizations','https://api.stripe.com/v1/charges']);
async function installBrowserGuards(context,{policy,forwardLocal}={}) {
  assertHealthy(policy);const blocked=[];
  function violation(raw,kind) {
    if(policy.localProbes&&negativeURLs.has(raw)){blocked.push(new URL(raw).hostname);return;}
    fatal(policy,{source:'browser',kind:'outbound',transport:kind});
  }
  await context.route('**/*',async route=>{
    assertHealthy(policy);const request=route.request(),raw=request.url(),kind=classify(raw,request.method());
    if(kind==='local') {
      const response=forwardLocal?await forwardLocal(request):await route.fetch({maxRedirects:0});
      const status=typeof response.status==='function'?response.status():response.status;
      if(status>=300&&status<400) {
        const headers=typeof response.headers==='function'?response.headers():response.headers||{};
        let safe=false;try{safe=!!headers.location&&new URL(headers.location,raw).origin===BASE;}catch{}
        if(!safe){violation(raw,'redirect');return route.abort('blockedbyclient');}
      }
      return route.fulfill(forwardLocal?response:{response});
    }
    if(kind==='mock') {try{return await route.fulfill({json:mock(raw)});}catch{}}
    violation(raw,'request');await route.abort('blockedbyclient');
  });
  await context.routeWebSocket('**/*',socket=>{
    if(socket.url()==='ws://127.0.0.1:3101/_next/webpack-hmr')blocked.push('websocket');
    else violation(socket.url(),'websocket');
    socket.close();
  });
  return {blocked};
}
module.exports={installBrowserGuards};
