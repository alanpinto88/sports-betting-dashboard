// Historical research only: same sportsbook, event, player label, market, side and line.
// Never interpret historical movement as sharp money, live odds, or a betting signal.
export function americanImpliedProbability(odds) {
 if(!Number.isInteger(odds)||Math.abs(odds)<100)return null;
 return odds<0?(-odds)/((-odds)+100):100/(odds+100);
}
export function historicalNbaPriceMovements(rows) {
 if(!Array.isArray(rows))return [];
 const buckets=new Map();
 for(const q of rows){
  if(!q||q.status!=='RESEARCH_ONLY'||q.eligibleForEv!==false||
     ![q.eventId,q.playerLabel,q.market,q.provider,q.side].every(v=>typeof v==='string'&&v.trim())||
     !Number.isFinite(q.line)||q.line<0||!['over','under'].includes(q.side)||
     americanImpliedProbability(q.americanOdds)===null||
     typeof q.capturedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(q.capturedAt))continue;
  const t=Date.parse(q.capturedAt);
  if(!Number.isFinite(t)||new Date(t).toISOString()!==q.capturedAt&&new Date(t).toISOString().replace(/\.000Z$/,'Z')!==q.capturedAt)continue;
  const key=JSON.stringify([q.eventId,q.playerLabel.trim().toLowerCase(),q.market,q.provider,q.side,q.line]);
  if(!buckets.has(key))buckets.set(key,[]);
  buckets.get(key).push({q,t});
 }
 const results=[];
 for(const entries of buckets.values()){
  entries.sort((a,b)=>a.t-b.t);
  const dedup=[];
  for(const entry of entries){
   if(dedup.length&&dedup[dedup.length-1].t===entry.t){
    // Conflicting same-timestamp prices make this series ambiguous.
    if(dedup[dedup.length-1].q.americanOdds!==entry.q.americanOdds)dedup[dedup.length-1].conflict=true;
   }else dedup.push({...entry,conflict:false});
  }
  if(dedup.length<2||dedup.some(x=>x.conflict))continue;
  const first=dedup[0].q,last=dedup[dedup.length-1].q;
  // Identical recorded prices do not constitute a price-movement event.
  if(first.americanOdds===last.americanOdds)continue;
  const initial=americanImpliedProbability(first.americanOdds),final=americanImpliedProbability(last.americanOdds);
  results.push(Object.freeze({
   eventId:first.eventId,playerLabel:first.playerLabel,market:first.market,
   provider:first.provider,side:first.side,line:first.line,
   openingRecordedOdds:first.americanOdds,latestRecordedOdds:last.americanOdds,
   firstCapturedAt:first.capturedAt,lastCapturedAt:last.capturedAt,
   observations:dedup.length,impliedProbabilityChangePoints:Number(((final-initial)*100).toFixed(2)),
   status:'HISTORICAL_RESEARCH',eligibleForEv:false,sharpMoneyVerified:false
  }));
 }
 return results.sort((a,b)=>Math.abs(b.impliedProbabilityChangePoints)-Math.abs(a.impliedProbabilityChangePoints));
}
