// Deploy separately as a Cloudflare Worker. No credentials or paid services required in code.
// This read-only relay intentionally exposes only a small, validated NHL final-score payload.
const SITE_ORIGIN = 'https://alanpinto88.github.io';
const NHL_API = 'https://api-web.nhle.com/v1/gamecenter/';
function json(body,status=200,origin=SITE_ORIGIN){
 return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':origin,'Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export default {
 async fetch(request){
  const origin=request.headers.get('Origin');
  if(origin && origin!==SITE_ORIGIN)return json({error:'Origin not allowed'},403);
  if(request.method!=='GET')return json({error:'GET only'},405);
  const url=new URL(request.url);
  const match=/^\/nhl\/final\/(\d{10})$/.exec(url.pathname);
  if(!match || url.search)return json({error:'Expected /nhl/final/{10-digit-game-id}'},400);
  const id=match[1];
  try{
   const response=await fetch(NHL_API+id+'/landing',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});
   if(!response.ok)return json({error:'NHL upstream unavailable'},502);
   const game=await response.json();
   const home=game?.homeTeam,away=game?.awayTeam;
   if(String(game?.id)!==id || !['OFF','FINAL'].includes(game?.gameState) || !home || !away ||
      !Number.isInteger(home.score) || !Number.isInteger(away.score) || home.score<0 || away.score<0 ||
      !/^[A-Z]{2,4}$/.test(String(home.abbrev||'')) || !/^[A-Z]{2,4}$/.test(String(away.abbrev||''))){
    return json({error:'Final score unavailable or invalid'},409);
   }
   return json({gameId:id,state:game.gameState,home:{team:home.abbrev,score:home.score},away:{team:away.abbrev,score:away.score},source:'NHL gamecenter',settlementEligible:false});
  }catch{
   return json({error:'NHL lookup failed'},502);
  }
 }
};
