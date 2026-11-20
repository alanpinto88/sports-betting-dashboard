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
    if(path==='/network-check'){
      // Zero-credit connectivity check: official fictional demo endpoint, no API key.
      // Public and deliberately non-billable; never forwards arbitrary URLs.
      try{
        const upstream=await fetch('https://prizepicksapi.com/api/v1/demo/coverage',{
          headers:{'Accept':'application/json'},
          redirect:'manual',
          signal:AbortSignal.timeout(10000)
        });
        return json({
          ok:upstream.ok,
          status:upstream.ok?'demo_reachable':'demo_http_response',
          providerHttpStatus:upstream.status,
          redirect:upstream.status>=300&&upstream.status<400,
          paidRequestsEnabled:false
        },200,headers);
      }catch(error){
        const name=String(error?.name||'');
        const category=name==='TimeoutError'?'timeout':name==='TypeError'?'fetch_type_error':'network_or_runtime_error';
        return json({
          ok:false,status:'demo_unreachable',reason:category,
          diagnosticHint:'The keyless provider demo also failed; check provider network reachability, DNS and Cloudflare outbound fetch.',
          paidRequestsEnabled:false
        },200,headers);
      }
    }
    if(path==='/coverage-network-check'){
      // Zero-credit unauthenticated connectivity probe of the exact coverage URL.
      // No API key, no user-controlled upstream URL, no response body disclosed.
      try{
        const upstream=await fetch('https://prizepicksapi.com/api/v1/coverage',{
          method:'GET',headers:{'Accept':'application/json'},
          redirect:'manual',signal:AbortSignal.timeout(10000)
        });
        return json({ok:true,status:'coverage_http_response',
          providerHttpStatus:upstream.status,
          note:'Any HTTP status proves the exact endpoint is reachable; 401/403 is expected without a key.',
          paidRequestsEnabled:false},200,headers);
      }catch(error){
        const name=String(error?.name||'');
        return json({ok:false,status:'coverage_network_failure',
          reason:name==='TimeoutError'?'timeout':name==='TypeError'?'fetch_type_error':'runtime_or_network_error',
          paidRequestsEnabled:false},200,headers);
      }
    }
    if(path==='/demo-projections'){
      // Keyless fictional examples only. Never call authenticated endpoints here.
      const league=new URL(request.url).searchParams.get('league')||'NBA';
      if(!['NBA','NFL','NHL'].includes(league))return json({error:'Unsupported league'},400,headers);
      try{
        const url=new URL('https://prizepicksapi.com/api/v1/demo/projections');
        url.searchParams.set('league',league);url.searchParams.set('limit','20');
        const upstream=await fetch(url.toString(),{
          headers:{'Accept':'application/json'},redirect:'manual',
          signal:AbortSignal.timeout(10000)
        });
        if(!upstream.ok)return json({ok:false,status:'demo_provider_http_error',providerHttpStatus:upstream.status,is_demo:true},502,headers);
        const payload=await upstream.json();
        const rows=(Array.isArray(payload?.data)?payload.data:[]).slice(0,20).map(p=>({
          player:String(p?.player?.name||''),team:String(p?.player?.team||''),
          opponent:String(p?.event?.opponent||''),league:String(p?.league||league),
          stat:String(p?.market?.stat||''),period:String(p?.market?.period||''),
          line:Number.isFinite(Number(p?.line))?Number(p.line):null,
          starts_at:p?.event?.starts_at||null,
          is_demo:true
        })).filter(p=>p.player&&p.stat&&p.line!==null);
        return json({ok:true,status:'fictional_demo',is_demo:true,league,rows,paidRequestsEnabled:false},200,headers);
      }catch(error){
        return json({ok:false,status:'demo_unavailable',reason:error?.name==='TimeoutError'?'timeout':'network_or_response_error',is_demo:true},502,headers);
      }
    }
    if(path==='/provider-check'){
      if(!env.PRIZEPICKS_API_KEY)return json({ok:false,status:'secret_missing',paidRequestsEnabled:false},503,headers);
      // Only provider /coverage is permitted. No client-supplied upstream URL or parameters.
      // This diagnostic intentionally skips Cache API: it is not available in every
      // Worker execution context. This endpoint never requests paid comparisons.
      try{
        const upstream=await fetch('https://prizepicksapi.com/api/v1/coverage',{
          headers:{
            'Authorization':`Bearer ${env.PRIZEPICKS_API_KEY}`,
            'Accept':'application/json'
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
        // Expose only allowlisted diagnostic categories, never raw provider errors or credentials.
        const name=String(error?.name||'');
        const message=String(error?.message||'').toLowerCase();
        const category=name==='TimeoutError'?'timeout':name==='AbortError'?'aborted':
          name==='TypeError'?'fetch_type_error':'runtime_error';
        const hint=/fetch failed|network|connection|connect|dns|resolve|tls|certificate/.test(message)
          ?'upstream_network_failure'
          :/invalid url|url parse/.test(message)?'invalid_upstream_url'
          :/abort|timeout/.test(message)?'request_timeout'
          :'check_worker_logs';
        return json({ok:false,status:'provider_unreachable',reason:category,diagnosticHint:hint,
          paidRequestsEnabled:false},502,headers);
      }
    }
    if(path==='/comparisons')return json({
      ok:false,status:'not_configured',rows:[],
      message:'Paid comparisons are disabled pending request authorization, abuse prevention and credit limits.'
    },503,headers);
    return json({error:'Not found'},404,headers);
  }
};
