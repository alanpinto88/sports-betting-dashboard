// EV Sports — PrizePicks comparison relay (deployment template).
// This worker intentionally does NOT make paid provider requests until an authorized
// endpoint and response contract have been confirmed.
// Configure ALLOWED_ORIGIN as https://alanpinto88.github.io, never '*'.
const cors=(origin,allowed)=>({
  'Access-Control-Allow-Origin': origin===allowed?allowed:'null',
  'Access-Control-Allow-Methods':'GET, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Vary':'Origin',
  'Cache-Control':'no-store',
});
export default {
  async fetch(request,env) {
    const origin=request.headers.get('Origin')||'';
    const allowed=env.ALLOWED_ORIGIN||'https://alanpinto88.github.io';
    const headers={'Content-Type':'application/json; charset=utf-8',...cors(origin,allowed)};
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const url=new URL(request.url);
    if(request.method!=='GET')return Response.json({error:'Method not allowed'},{status:405,headers});
    if(url.pathname==='/health')return Response.json({ok:true,service:'ev-sports-prop-relay',providerConnected:false,paidRequestsEnabled:false},{headers});
    if(url.pathname==='/comparisons')return Response.json({
      ok:false,status:'not_configured',rows:[],
      message:'Provider API endpoint, account entitlement, request budget and terms must be verified before enabling live requests.'
    },{status:503,headers});
    return Response.json({error:'Not found'},{status:404,headers});
  }
};
