// EV Sports — safe PrizePicksAPI relay. No credit-consuming endpoints are enabled.
// The API credential stays in Cloudflare's PRIZEPICKS_API_KEY secret.
const cors=(origin,allowed)=>({
  'Access-Control-Allow-Origin':origin===allowed?allowed:'null',
  'Access-Control-Allow-Methods':'GET, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Vary':'Origin',
  'Cache-Control':'no-store'
});
const json=(body,status,headers)=>Response.json(body,{status,headers});
export default {
  async fetch(request,env,ctx){
    const origin=request.headers.get('Origin')||'';
    const allowed=env.ALLOWED_ORIGIN||'https://alanpinto88.github.io';
    const headers={'Content-Type':'application/json; charset=utf-8',...cors(origin,allowed)};
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(request.method!=='GET')return json({error:'Method not allowed'},405,headers);
    const path=new URL(request.url).pathname;
    if(path==='/health')return json({
      ok:true,service:'ev-sports-prop-relay',
      secretConfigured:Boolean(env.PRIZEPICKS_API_KEY),
      providerConnected:false,paidRequestsEnabled:false
    },200,headers);
    if(path==='/provider-check'){
      if(!env.PRIZEPICKS_API_KEY)return json({ok:false,status:'secret_missing',paidRequestsEnabled:false},503,headers);
      // Only provider /coverage is permitted. No client-supplied upstream URL or parameters.
      // This diagnostic intentionally skips Cache API: it is not available in every
      // Worker execution context. This endpoint never requests paid comparisons.
      try{
        const upstream=await fetch('https://prizepicksapi.com/api/v1/coverage',{
          headers:{
            'Authorization':`Bearer ${env.PRIZEPICKS_API_KEY}`,
            'Accept':'application/json',
            'X-User-Request':'Verify supported player prop leagues for an EV Sports discrepancy dashboard'
          },
          signal:AbortSignal.timeout(12000)
        });
        const result={
          ok:upstream.ok,
          status:upstream.ok?'authenticated_coverage_ok':'provider_rejected',
          providerHttpStatus:upstream.status,
          paidRequestsEnabled:false
        };
        return json(result,upstream.ok?200:502,headers);
      }catch(error){
        const category=error?.name==='TimeoutError'?'timeout':error?.name==='AbortError'?'aborted':'network_or_runtime_error';
        return json({ok:false,status:'provider_unreachable',reason:category,paidRequestsEnabled:false},502,headers);
      }
    }
    if(path==='/comparisons')return json({
      ok:false,status:'not_configured',rows:[],
      message:'Paid comparisons are disabled pending request authorization, abuse prevention and credit limits.'
    },503,headers);
    return json({error:'Not found'},404,headers);
  }
};
