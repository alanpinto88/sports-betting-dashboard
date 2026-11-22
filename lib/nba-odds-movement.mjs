// Historical NBA prop quote movement. Pure calculations, no API calls.
import {validatePublishedQuote} from './nba-published-adapter.mjs';
export function summarizeNbaMovement(records,{now=Date.now(),minimumProbabilityPoints=3}={}) {
 if(!Array.isArray(records) || !Number.isFinite(now) || !Number.isFinite(minimumProbabilityPoints) || minimumProbabilityPoints<=0) return [];
 const groups=new Map();
 for(const raw of records){
  // Historical records require provenance, but may be older than the live 15-minute window.
  const at=Date.parse(raw?.captured_at);
  if(!Number.isFinite(at) || at>now)continue;
  const checked=validatePublishedQuote(raw,at);
  if(!checked.ok)continue;
  const q=checked.quote;
  const key=JSON.stringify([q.provider,q.playerId,q.eventId,q.stat,q.period,q.side,q.line]);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({...q,time:at});
 }
 const results=[];
 for(const [key,items] of groups){
  items.sort((a,b)=>a.time-b.time);
  // Conflicting quotes at the same timestamp cannot establish a reliable sequence.
  const byTime=new Map();
  let conflict=false;
  for(const q of items){
   const previous=byTime.get(q.time);
   if(previous && previous.odds!==q.odds){conflict=true;break;}
   if(!previous)byTime.set(q.time,q);
  }
  if(conflict)continue;
  const unique=[...byTime.values()].sort((a,b)=>a.time-b.time);
  if(unique.length<2)continue;
  const first=unique[0],last=unique[unique.length-1];
  const prob=odds=>odds>0?100/(odds+100):-odds/(-odds+100);
  const changePoints=(prob(last.odds)-prob(first.odds))*100;
  results.push({key,provider:last.provider,playerId:last.playerId,eventId:last.eventId,
   stat:last.stat,period:last.period,side:last.side,line:last.line,
   openingOdds:first.odds,latestOdds:last.odds,openingAt:first.capturedAt,
   latestAt:last.capturedAt,probabilityPointChange:changePoints,
   significant:Math.abs(changePoints)>=minimumProbabilityPoints,
   snapshotCount:unique.length,verifiedHistorical:true});
 }
 return results.sort((a,b)=>Math.abs(b.probabilityPointChange)-Math.abs(a.probabilityPointChange));
}
