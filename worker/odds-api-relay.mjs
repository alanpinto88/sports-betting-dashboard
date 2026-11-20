// EV Sports — The Odds API relay. Deploy separately; no live requests until explicitly enabled.
// Secrets: ODDS_API_KEY. Set ODDS_API_ENABLED=true only after verifying plan and budget.
// Optional: ALLOWED_ORIGIN (default GitHub Pages origin).
const SPORT_KEYS=new Set(['icehockey_nhl','basketball_nba','americanfootball_nfl','baseball_mlb','soccer_epl','soccer_usa_mls']);
const MARKETS=new Set(['h2h','spreads','totals']);
const reply=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=env.ALLOWED_ORIGIN||'https://alanpinto88.github.io';
  const cors={'Access-Control-Allow-Origin':origin===allowed?allowed:'null','Access-Control-Allow-Methods':'GET, OPTIONS','Vary':'Origin'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(origin&&origin!==allowed)return reply({error:'Origin not allowed'},403,cors);
  if(request.method!=='GET')return reply({error:'GET only'},405,cors);
  const url=new URL(request.url);
  if(url.pathname==='/health')return reply({ok:true,service:'ev-odds-relay',liveEnabled:env.ODDS_API_ENABLED==='true',credentialPresent:Boolean(env.ODDS_API_KEY),note:'No paid upstream request performed'},200,cors);
  if(url.pathname!=='/odds'||url.searchParams.has('apiKey'))return reply({error:'Not found'},404,cors);
  if(env.ODDS_API_ENABLED!=='true')return reply({error:'Live odds disabled until budget and account quota are verified'},503,cors);
  if(!env.ODDS_API_KEY)return reply({error:'Server API key missing'},503,cors);
  const sport=url.searchParams.get('sport')||'icehockey_nhl';
  const market=url.searchParams.get('market')||'totals';
  if(!SPORT_KEYS.has(sport)||!MARKETS.has(market))return reply({error:'Unsupported sport or market'},400,cors);
  // Cloudflare cache prevents repeated requests across site visitors for 5 minutes.
  // For a strict spending cap, add a shared durable counter / scheduled budget gate before enabling.
  const cacheKey=new Request('https://ev-sports-cache.invalid/'+sport+'/'+market);
  const cached=await caches.default.match(cacheKey);
  if(cached)return reply({...await cached.json(),cache:'hit'},200,cors);
  // Fail closed unless an administrator explicitly acknowledges lack of a global spending cap.
  if(env.ODDS_API_BUDGET_ACK!=='true')return reply({error:'Shared budget gate not configured; live fetch blocked'},503,cors);
  const endpoint=new URL('https://api.the-odds-api.com/v4/sports/'+sport+'/odds/');
  endpoint.searchParams.set('apiKey',env.ODDS_API_KEY);
  endpoint.searchParams.set('regions','us');
  endpoint.searchParams.set('markets',market);
  endpoint.searchParams.set('oddsFormat','american');
  let upstream;
  try{upstream=await fetch(endpoint,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(12000)})}
  catch{return reply({error:'Upstream odds provider unavailable'},502,cors)}
  if(!upstream.ok)return reply({error:'Odds provider returned an error',status:upstream.status},502,cors);
  const raw=await upstream.json();
  if(!Array.isArray(raw))return reply({error:'Unexpected upstream response'},502,cors);
  const data=raw.slice(0,150).map(g=>({
   id:String(g.id||''),sport:g.sport_key,home:g.home_team,away:g.away_team,commence_time:g.commence_time,
   bookmakers:(g.bookmakers||[]).slice(0,30).map(b=>({key:b.key,title:b.title,last_update:b.last_update,markets:(b.markets||[]).filter(m=>m.key===market).map(m=>({key:m.key,last_update:m.last_update,outcomes:(m.outcomes||[]).map(o=>({name:o.name,price:o.price,point:o.point??null}))}))}))
  }));
  const body={source:'The Odds API',sport,market,observed_at:new Date().toISOString(),remaining:upstream.headers.get('x-requests-remaining'),last_cost:upstream.headers.get('x-requests-last'),data};
  await caches.default.put(cacheKey,new Response(JSON.stringify(body),{headers:{'Cache-Control':'public, max-age=300'}}));
  return reply({...body,cache:'miss'},200,cors);
 }
};