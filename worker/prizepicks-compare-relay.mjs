// Dedicated Cloudflare Worker for the user-provided PrizePicksAPI.com compare endpoint.
// Deploy as a NEW Worker; do not overwrite the existing NHL Worker.
// Set PRIZEPICKS_API_KEY as a Cloudflare encrypted Secret, never in source code.
// The provider endpoint and account permissions must be verified during deployment.
const ALLOWED_ORIGIN = 'https://alanpinto88.github.io';
const UPSTREAM = 'https://prizepicksapi.com/api/v1/compare';
const SPORTS = new Set(['NBA','WNBA','NFL','NHL','MLB','CFB','SOCCER','UFC','TENNIS']);
const STATS = new Set(['Points','Rebounds','Assists','Threes','Shots','Shots on Goal','Saves','Goals','Passing Yards','Rushing Yards','Receiving Yards']);
function reply(body,status=200,origin=null){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin===ALLOWED_ORIGIN)headers['Access-Control-Allow-Origin']=ALLOWED_ORIGIN;
 return new Response(JSON.stringify(body),{status,headers});
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin');
  if(origin && origin!==ALLOWED_ORIGIN)return reply({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS'){
   if(origin!==ALLOWED_ORIGIN)return reply({error:'Origin not allowed'},403);
   return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept','Access-Control-Max-Age':'600','Vary':'Origin'}});
  }
  if(request.method!=='GET')return reply({error:'GET only'},405,origin);
  const url=new URL(request.url);
  if(url.pathname!=='/api/prizepicks/compare')return reply({error:'Not found'},404,origin);
  if([...url.searchParams.keys()].some(k=>!['league','player','stat'].includes(k)))return reply({error:'Unsupported parameter'},400,origin);
  const league=(url.searchParams.get('league')||'NBA').toUpperCase();
  const player=(url.searchParams.get('player')||'').trim();
  const stat=(url.searchParams.get('stat')||'Points').trim();
  if(!SPORTS.has(league)||!STATS.has(stat)||!/^[a-zA-Z .'-]{2,60}$/.test(player))return reply({error:'Invalid league, player, or stat'},400,origin);
  if(!env.PRIZEPICKS_API_KEY)return reply({error:'API secret not configured'},503,origin);
  const upstream=new URL(UPSTREAM);
  upstream.searchParams.set('league',league);upstream.searchParams.set('player',player);upstream.searchParams.set('stat',stat);
  try{
   const res=await fetch(upstream.toString(),{method:'GET',headers:{'Accept':'application/json','X-User-Request':'Read PrizePicks data for an integration check','Authorization':'Bearer '+env.PRIZEPICKS_API_KEY},signal:AbortSignal.timeout(9000)});
   if(!res.ok)return reply({error:'Upstream request failed',upstream_status:res.status},502,origin);
   const raw=await res.text();
   if(raw.length>400000)return reply({error:'Upstream payload too large'},502,origin);
   let data;try{data=JSON.parse(raw)}catch{return reply({error:'Invalid upstream JSON'},502,origin)}
   if(!data||!Array.isArray(data.data))return reply({error:'Unexpected upstream schema'},502,origin);
   return reply(data,200,origin);
  }catch{return reply({error:'Upstream unavailable'},502,origin)}
 }
};
